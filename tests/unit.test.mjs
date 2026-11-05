import test from "node:test";
import assert from "node:assert/strict";
import { filterProducts, validateProduct } from "../server/data.js";
import { esc, layout, productPage } from "../server/render.js";
import { verifyPassword, allowedOwners } from "../server/core.js";
import { pbkdf2Sync } from "node:crypto";
const base = {
  id: "p",
  _id: "p",
  brand: "Apple",
  model: "iPhone Test",
  colour: "Blue",
  category: "phones",
  condition: "certified_refurbished",
  description: "A real description",
  photos: ["photo.jpg"],
  photoUrls: ["/api/photos/photo.jpg"],
  featured: true,
  sku: "CC-TEST",
  status: "published",
  specifications: [],
  warrantyMonths: 6,
  updatedAt: 1,
  createdAt: 1,
  variants: [
    { id: "v1", storage: "64GB", price: 4000, inStock: 0, wasPrice: null },
    { id: "v2", storage: "128GB", price: 6000, inStock: 2, wasPrice: 6500 },
  ],
};
test("combined variant price/storage filters use the same variant", () => {
  assert.equal(
    filterProducts([base], new URLSearchParams("storage=128GB&max=5000")).count,
    0,
  );
  assert.equal(
    filterProducts(
      [base],
      new URLSearchParams(
        "brand=Apple&condition=certified_refurbished&storage=128GB&min=5500&max=6500",
      ),
    ).count,
    1,
  );
});
test("deal, brand and availability filters compose", () => {
  assert.equal(
    filterProducts([base], new URLSearchParams("brand=Samsung&deals=1")).count,
    0,
  );
  assert.equal(
    filterProducts([base], new URLSearchParams("available=1&deals=1")).count,
    1,
  );
});
test("catalogue pagination is bounded to 12 records", () => {
  const p = Array.from({ length: 28 }, (_, i) => ({ ...base, id: String(i) }));
  assert.equal(
    filterProducts(p, new URLSearchParams("page=3")).items.length,
    4,
  );
});
test("product validation rejects negative stock, zero price and invalid discounts", () => {
  assert.throws(
    () =>
      validateProduct({
        ...base,
        variants: [{ ...base.variants[1], inStock: -1 }],
      }),
    /Stock/,
  );
  assert.throws(
    () =>
      validateProduct({
        ...base,
        variants: [{ ...base.variants[1], price: 0 }],
      }),
    /Price/,
  );
  assert.throws(
    () =>
      validateProduct({
        ...base,
        variants: [{ ...base.variants[1], wasPrice: 100 }],
      }),
    /previous price/,
  );
});
test("published products require real uploaded photo references", () =>
  assert.throws(() => validateProduct({ ...base, photos: [] }), /photo/));
test("stored content is escaped in HTML and JSON script data", () => {
  assert.equal(esc("<script>"), "&lt;script&gt;");
  const html = layout({
    title: "safe",
    content: "",
    payload: { value: "</script><script>alert(1)</script>" },
  });
  assert.ok(!html.includes("</script><script>alert(1)"));
});
test("schema uses recorded prices, conditions and stock without invented reviews", () => {
  const { schema } = productPage(base, [], { whatsapp: "27685302223" });
  assert.equal(schema.offers[0].availability, "https://schema.org/OutOfStock");
  assert.equal(schema.offers[1].price, 6000);
  assert.equal(
    schema.offers[1].itemCondition,
    "https://schema.org/RefurbishedCondition",
  );
  assert.equal(schema.aggregateRating, undefined);
});
test("existing PBKDF2 encoding remains compatible without plaintext password storage", async () => {
  const pass = "temporary-unit-test-password",
    salt = Buffer.from("unit-test-salt");
  const hash = pbkdf2Sync(pass, salt, 100000, 32, "sha256");
  const encoded =
    "pbkdf2$100000$" + salt.toString("base64") + "$" + hash.toString("base64");
  assert.equal(await verifyPassword(pass, encoded), true);
  assert.equal(await verifyPassword("wrong", encoded), false);
});
test("owner configuration accepts explicit list formats and fails closed", () => {
  assert.deepEqual(allowedOwners({}), []);
  assert.deepEqual(
    allowedOwners({ OWNER_EMAILS: "A@example.com, b@example.com" }),
    ["a@example.com", "b@example.com"],
  );
  assert.deepEqual(allowedOwners({ OWNER_EMAILS: '["A@example.com"]' }), [
    "a@example.com",
  ]);
});

test("production catalogue editing fails closed until old deployment URLs are protected", async () => {
  const { productEditingReady } = await import("../server/core.js");
  assert.equal(productEditingReady({ CF_PAGES_BRANCH: "main" }), false);
  assert.equal(
    productEditingReady({ LEGACY_CATALOGUE_PROTECTED: "false" }),
    false,
  );
  assert.equal(
    productEditingReady({ LEGACY_CATALOGUE_PROTECTED: "true" }),
    true,
  );
  assert.equal(productEditingReady({ CF_PAGES_BRANCH: "local" }), true);
});
test("production denies framing; isolated local preview can embed without weakening production", async () => {
  const { default: worker } = await import("../public/_worker.js");
  const env = {
    ASSETS: { fetch: async () => new Response("asset") },
    CF_PAGES_BRANCH: "main",
  };
  const prod = await worker.fetch(
    new Request("https://cell-connecta.pages.dev/cc-assets/test"),
    env,
  );
  assert.equal(prod.headers.get("X-Frame-Options"), "DENY");
  assert.match(
    prod.headers.get("Content-Security-Policy"),
    /frame-ancestors 'none'/,
  );
  const local = await worker.fetch(
    new Request("http://localhost/cc-assets/test"),
    { ...env, CF_PAGES_BRANCH: "local" },
  );
  assert.equal(local.headers.get("X-Frame-Options"), null);
});
test("local TLS preview origin is exact-host HTTPS while cross-origin attempts remain blocked", async () => {
  const { origin, requestOrigin } = await import("../server/core.js");
  const req = new Request("http://3000-example.e2b.app/api/cart/validate", {
    method: "POST",
    headers: {
      Origin: "https://3000-example.e2b.app",
      "Content-Type": "application/json",
    },
  });
  assert.equal(requestOrigin(req), "https://3000-example.e2b.app");
  assert.doesNotThrow(() => origin(req));
  assert.throws(
    () =>
      origin(
        new Request(req, {
          headers: {
            Origin: "https://different.e2b.app",
            "Content-Type": "application/json",
          },
        }),
      ),
    (error) => error.status === 403,
  );
});

test("authenticated production product, archive and upload APIs enforce the legacy visibility lock", async () => {
  const { api } = await import("../server/api.js");
  const owner = {
    email: "qa-owner@cellconnecta.invalid",
    email_verified: 1,
    role: "owner",
    csrf_token: "csrf",
  };
  const env = {
    CF_PAGES_BRANCH: "main",
    OWNER_EMAILS: owner.email,
    DB: {
      prepare() {
        return {
          bind() {
            return this;
          },
          async first() {
            return owner;
          },
        };
      },
    },
  };
  for (const path of [
    "/api/admin/products",
    "/api/admin/products/test/archive",
    "/api/admin/photos",
  ]) {
    const req = new Request("https://cell-connecta.pages.dev" + path, {
      method: "POST",
      headers: {
        Cookie: "cc_store_session=test",
        Origin: "https://cell-connecta.pages.dev",
        "x-csrf-token": "csrf",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    await assert.rejects(
      () => api(req, env),
      (error) =>
        error.status === 503 && error.message.includes("legacy deployment"),
    );
  }
});

test("landing page always exposes four honest category slides and cards, even without inventory", async () => {
  const { home, storeCategories } = await import("../server/render.js");
  const html = home([], { promotion: { enabled: false } });
  assert.equal(storeCategories.length, 4);
  assert.equal((html.match(/data-hero-slide\b/g) || []).length, 4);
  assert.equal((html.match(/class="category"/g) || []).length, 4);
  for (const category of storeCategories) {
    assert.ok(html.includes(category.heroImage || category.image));
    assert.ok(html.includes(category.label));
  }
  assert.ok(!/illustrativ|illustration/i.test(html));
  assert.match(html, /Shop by category/);
  assert.match(html, /data-hero-pause/);
  assert.ok(!html.includes("In stock"));
});
test("empty category selections preserve checks, brand and accurate headings", async () => {
  const { shop } = await import("../server/render.js");
  for (const [query, heading, category, brand] of [
    ["category=laptops", "Laptops", "laptops", null],
    ["category=accessories", "Accessories", "accessories", null],
    ["category=phones&brand=Samsung", "Phones", "phones", "Samsung"],
  ]) {
    const html = shop(
      [],
      new URL("https://cell-connecta.pages.dev/shop?" + query),
    );
    assert.ok(html.includes('<h1 class="sr-only">' + heading + "</h1>"));
    assert.match(
      html,
      new RegExp('name="category" value="' + category + '"[^>]*checked'),
    );
    if (brand) assert.ok(html.includes('value="' + brand + '" selected'));
    assert.match(html, /No products match this selection/);
    assert.match(html, /no matching listings available right now/);
  }
});
test("iPhone category excludes Apple laptops and composes with the existing filters", () => {
  const phone = { ...base, id: "phone", category: "phones" };
  const laptop = {
    ...base,
    id: "laptop",
    category: "laptops",
    model: "Laptop",
  };
  const result = filterProducts(
    [phone, laptop],
    new URLSearchParams("brand=Apple&category=phones"),
  );
  assert.equal(result.count, 1);
  assert.equal(result.items[0].id, "phone");
});

test("iPhone hero and collection cards use the supplied artwork", async () => {
  const { home, storeCategories } = await import("../server/render.js");
  const html = home([], { promotion: { enabled: false } });
  assert.equal(storeCategories[0].heroImage, "hero-iphone-collection.webp");
  assert.match(html, /data-hero-key="iphone"/);
  assert.match(html, /src="\/cc-assets\/hero-iphone-collection.webp"/);
  assert.match(html, /Shop All Products <svg/);
});

test("Samsung hero uses the supplied Galaxy scene without inventing stock", async () => {
  const { home, storeCategories } = await import("../server/render.js");
  const samsung = storeCategories.find((c) => c.key === "samsung");
  assert.equal(samsung.heroImage, "hero-samsung-collection.webp");
  assert.equal(samsung.image, "hero-samsung-open.webp");
  assert.equal(samsung.link, "/shop?category=phones&brand=Samsung");
  assert.match(samsung.body, /availability/);
  const html = home([], { promotion: { enabled: false } });
  assert.match(html, /src="\/cc-assets\/hero-samsung-collection.webp"/);
  assert.match(html, /Samsung Galaxy collection on neon-lit stone platforms/);
  assert.match(html, /Discover your next/);
});

test("Laptop hero uses the supplied showroom scene and category-scoped shopping/deals without stock claims", async () => {
  const { home, storeCategories } = await import("../server/render.js");
  const laptop = storeCategories.find((c) => c.key === "laptops");
  assert.equal(laptop.heroImage, "hero-laptop-collection.webp");
  assert.equal(laptop.image, "hero-laptop-open.webp");
  assert.equal(laptop.link, "/shop?category=laptops");
  assert.equal(laptop.secondaryLink, "/shop?category=laptops&deals=1");
  assert.equal(laptop.button, "Shop Laptops");
  assert.match(laptop.body, /availability/);
  const html = home([], { promotion: { enabled: false } });
  assert.match(html, /src="\/cc-assets\/hero-laptop-collection.webp"/);
  assert.match(html, /Laptop collection on an illuminated showroom platform/);
  assert.match(html, /href="\/shop\?category=laptops&amp;deals=1">View Deals/);
});

test("Accessories hero uses the supplied collection, real shop links and honest availability wording", async () => {
  const { home, storeCategories } = await import("../server/render.js");
  const c = storeCategories.find((c) => c.key === "accessories");
  assert.equal(c.heroImage, "hero-accessories-collection.webp");
  assert.equal(c.image, "hero-accessories-open.webp");
  assert.equal(c.link, "/shop?category=accessories");
  assert.equal(c.button, "Shop Accessories");
  assert.equal(c.secondaryLink, "/shop");
  assert.equal(c.secondaryButton, "View All");
  assert.match(c.body, /availability and compatibility/);
  assert.doesNotMatch(
    c.body,
    /guaranteed|warranty on all|original accessories/i,
  );
  const html = home([], { promotion: { enabled: false } });
  assert.match(html, /src="\/cc-assets\/hero-accessories-collection.webp"/);
  assert.match(
    html,
    /Tech accessories collection on neon-lit display platforms/,
  );
  assert.match(html, /href="\/shop">View All <svg/);
});

test("Premium category gallery keeps four truthful collection links and accessible headings", async () => {
  const { home, storeCategories } = await import("../server/render.js");
  const html = home([], { promotion: { enabled: false } });
  assert.equal((html.match(/data-category-key=/g) || []).length, 4);
  for (const c of storeCategories) {
    assert.ok(
      html.includes(
        `data-category-key="${c.key}" aria-label="Shop ${c.label}"`,
      ),
    );
    assert.ok(html.includes(`<h3>${c.label}</h3>`));
    assert.ok(html.includes(c.heroImage || c.image));
  }
  assert.match(html, /View all products/);
  assert.match(html, /FIND YOUR NEXT UPGRADE/);
  assert.doesNotMatch(html, /bestseller|limited stock|customer rating/i);
});

test("Release preparation rejects protected source destinations without changing files", async () => {
  const { spawnSync } = await import("node:child_process");
  const { resolve } = await import("node:path");
  const r = spawnSync(
    process.execPath,
    ["scripts/prepare-release.mjs", resolve("public")],
    { encoding: "utf8" },
  );
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /protected source\/build paths/);
  const usage = spawnSync(process.execPath, ["scripts/prepare-release.mjs"], {
    encoding: "utf8",
  });
  assert.notEqual(usage.status, 0);
  assert.match(usage.stderr, /Usage:/);
});

test("Repeated category values form a union while model/brand constraints remain combined", () => {
  const laptop = {
    ...base,
    id: "l",
    category: "laptops",
    model: "MacBook Air",
  };
  const accessory = {
    ...base,
    id: "a",
    category: "accessories",
    brand: "Other",
    model: "Case",
  };
  assert.equal(
    filterProducts(
      [base, laptop, accessory],
      new URLSearchParams("category=phones&category=laptops"),
    ).count,
    2,
  );
  const r = filterProducts(
    [base, laptop, accessory],
    new URLSearchParams(
      "category=phones&category=laptops&brand=Apple&model=iPhone+Test&storage=128GB&available=1",
    ),
  );
  assert.equal(r.count, 1);
  assert.equal(r.items[0].id, base.id);
  assert.equal(r.items[0].displayVariantId, "v2");
});
test("Model matching is exact and price/storage/availability still match a single variant", () => {
  const pro = { ...base, id: "pro", model: "iPhone Test Pro" };
  assert.equal(
    filterProducts([base, pro], new URLSearchParams("model=iPhone+Test")).count,
    1,
  );
  assert.equal(
    filterProducts(
      [base],
      new URLSearchParams("model=iPhone+Test&storage=128GB&max=5000"),
    ).count,
    0,
  );
  assert.equal(
    filterProducts(
      [base],
      new URLSearchParams("model=iPhone+Test&storage=64GB&available=1"),
    ).count,
    0,
  );
  assert.equal(
    filterProducts(
      [base],
      new URLSearchParams(
        "model=iPhone+Test&storage=128GB&deals=1&available=1",
      ),
    ).count,
    1,
  );
});
test("Shop headings follow selected categories, with independent grouped pagination", async () => {
  const { shop } = await import("../server/render.js");
  const phones = Array.from({ length: 13 }, (_, i) => ({
    ...base,
    id: "phone" + i,
  }));
  const laptops = Array.from({ length: 13 }, (_, i) => ({
    ...base,
    id: "laptop" + i,
    category: "laptops",
    model: "MacBook",
  }));
  assert.match(
    shop(phones, new URL("https://x/shop")),
    /<h1 class="sr-only">All products<\/h1>/,
  );
  assert.match(
    shop(phones, new URL("https://x/shop?category=phones")),
    /<h1 class="sr-only">Phones<\/h1>/,
  );
  const html = shop(
    [...phones, ...laptops],
    new URL("https://x/shop?category=phones&category=laptops&page_phones=2"),
  );
  assert.match(html, /<h1 class="sr-only">Phones &amp; Laptops<\/h1>/);
  assert.equal((html.match(/class="product-card"/g) || []).length, 13);
  assert.equal((html.match(/catalogue-group is-grouped/g) || []).length, 2);
  assert.match(html, /page_phones=1/);
  assert.match(html, /page_laptops=2/);
  assert.match(html, /<h2>Phones<\/h2>/);
  assert.match(html, /<h2>Laptops<\/h2>/);
});
test("Grouped empty categories remain visible and do not claim nonexistent stock", async () => {
  const { shop } = await import("../server/render.js");
  const html = shop(
    [base],
    new URL("https://x/shop?category=phones&category=laptops"),
  );
  assert.match(html, /data-category-group="laptops"/);
  assert.match(html, /<h2>Laptops<\/h2><span>0 products<\/span>/);
  assert.match(html, /no matching listings available right now/);
});
test("Server-side model and storage choices follow category/brand/model parents", async () => {
  const { shop } = await import("../server/render.js");
  const other = {
    ...base,
    id: "s",
    brand: "Samsung",
    model: "Galaxy Test",
    variants: [{ ...base.variants[1], storage: "256GB" }],
  };
  const laptop = {
    ...base,
    id: "l",
    category: "laptops",
    model: "MacBook",
    variants: [{ ...base.variants[1], storage: "512GB" }],
  };
  const html = shop(
    [base, other, laptop],
    new URL("https://x/shop?category=phones&brand=Apple&model=iPhone+Test"),
  );
  const model = html.match(/<select id="shop-model"[\s\S]*?<\/select>/)[0];
  const storage = html.match(/<select id="shop-storage"[\s\S]*?<\/select>/)[0];
  assert.match(model, /iPhone Test/);
  assert.doesNotMatch(model, /Galaxy|MacBook/);
  assert.match(storage, /64GB/);
  assert.match(storage, /128GB/);
  assert.doesNotMatch(storage, /256GB|512GB/);
});
test("Filter text/facets stay escaped and filters use a progressive native GET form", async () => {
  const { shop } = await import("../server/render.js");
  const evil = "<script>alert(1)</script>";
  const html = shop(
    [{ ...base, model: evil }],
    new URL("https://x/shop?model=" + encodeURIComponent(evil)),
  );
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /\\u003cscript/);
  assert.match(html, /action="\/shop" method="get"/);
  assert.match(html, /<fieldset class="shop-category-filter">/);
  assert.match(html, /id="shop-model" name="model"/);
  assert.match(html, /id="shop-storage" name="storage"/);
});
test("Filtered product cards carry the selected variant and product pages safely preselect it", async () => {
  const { card } = await import("../server/render.js");
  const html = card({ ...base, displayVariantId: "v2" });
  assert.match(html, /\/phone\/p\?variant=v2/);
  const p = productPage(base, [], { whatsapp: "27685302223" }, "v1").content;
  assert.match(p, /value="v1" selected/);
  const unknown = productPage(
    base,
    [],
    { whatsapp: "27685302223" },
    "foreign-variant",
  ).content;
  assert.match(unknown, /value="v2" selected/);
  assert.doesNotMatch(unknown, /foreign-variant/);
});

test("Compact shop removes the entire promotional intro while preserving an accessible category heading", async () => {
  const { shop } = await import("../server/render.js");
  const html = shop([base], new URL("https://x/shop?category=phones"));
  assert.match(
    html,
    /class="container catalogue-section premium-catalogue compact-catalogue"/,
  );
  assert.match(html, /<h1 class="sr-only">Phones<\/h1>/);
  assert.doesNotMatch(
    html,
    /shop-intro|breadcrumbs|THE CELL CONNECTA COLLECTION|Find your fit\. Choose a category/,
  );
  assert.match(html, /id="shop-filters"/);
  assert.match(html, /class="catalogue-search"/);
  assert.match(html, /shop-category-icon/);
  assert.match(html, /#device-phone/);
});

test("Compact visual refresh does not invent ratings or alter real stock labels", async () => {
  const { card } = await import("../server/render.js");
  const html = card(base);
  assert.match(html, /In stock/);
  assert.doesNotMatch(html, /rating|review|star/i);
});

test("Header uses WhatsApp before cart; owner admin remains only in footer", () => {
  const html = layout({
    title: "Shop",
    content: "",
    path: "/shop",
    page: "shop",
  });
  const header = html.match(
    /<header class="site-header">[\s\S]*?<\/header>/,
  )[0];
  assert.doesNotMatch(
    header,
    /account-link|global-search|Owner sign in|href="\/admin"|href="\/login"/,
  );
  assert.match(header, /header-whatsapp/);
  assert.ok(header.indexOf("header-whatsapp") < header.indexOf("cart-link"));
  assert.match(
    html,
    /<a href="\/admin" class="owner-admin-link">Owner admin<\/a>/,
  );
});

test("Phone sourcing section sits after pagination with a safe prefilled WhatsApp link", async () => {
  const { shop } = await import("../server/render.js");
  const all = Array.from({ length: 13 }, (_, i) => ({ ...base, id: "p" + i }));
  const html = shop(
    all,
    new URL("https://x/shop?category=phones&model=iPhone+Test&storage=128GB"),
  );
  assert.match(html, /Can’t find the phone/);
  assert.ok(
    html.indexOf('class="phone-sourcing"') > html.indexOf('class="pagination"'),
  );
  assert.match(html, /https:\/\/wa.me\/27685302223\?text=/);
  assert.match(html, /Model%3A%20iPhone%20Test/);
  assert.match(html, /Storage%3A%20128GB/);
  assert.doesNotMatch(
    shop([], new URL("https://x/shop?category=laptops")),
    /class="phone-sourcing"/,
  );
});

test("Public layout removes floating WhatsApp and footer payment notice without changing checkout semantics", () => {
  const html = layout({ title: "Shop", content: "", page: "shop" });
  assert.doesNotMatch(
    html,
    /class="whatsapp-float"|Online payment is not yet enabled/,
  );
  assert.equal(
    (html.match(/class="icon-button header-whatsapp"/g) || []).length,
    1,
  );
  assert.match(html, /owner-admin-link/);
});

test("Others is a real query selection with honest counts and grouped empty results", async () => {
  const { shop } = await import("../server/render.js");
  const html = shop([base], new URL("https://x/shop?category=others"));
  assert.match(html, /name="category" value="others"[^>]*checked/);
  assert.match(html, /<h1 class="sr-only">Others<\/h1>/);
  assert.match(html, /No products match/);
  assert.match(html, /#device-others/);
  const grouped = shop(
    [base],
    new URL("https://x/shop?category=phones&category=others"),
  );
  assert.match(grouped, /data-category-group="others"/);
  assert.match(grouped, /<h2>Others<\/h2><span>0 products<\/span>/);
});

test("Landing page omits Shop by brand while retaining category gallery and featured phones", async () => {
  const { home } = await import("../server/render.js");
  const html = home([base], {});
  assert.doesNotMatch(
    html,
    /Shop by brand|brand-section|brand-grid|FIND YOUR FAVOURITE/,
  );
  assert.match(html, /Shop by category/);
  assert.match(html, /Featured phones/);
  assert.equal((html.match(/data-hero-slide/g) || []).length, 4);
  assert.match(html, /service-strip/);
});
