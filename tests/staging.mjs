import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { randomBytes, randomUUID } from "node:crypto";
const base = process.env.SHOP_URL || "http://127.0.0.1:3000";
// Remote mutation tests require a live Cloudflare metadata proof of the isolated staging binding.
const deploymentId = process.env.CC_STAGING_DEPLOYMENT_ID;
if (!deploymentId || !process.env.CLOUDFLARE_API_TOKEN)
  throw Error("Missing staging verification credentials.");
const metadataResponse = await fetch(
  "https://api.cloudflare.com/client/v4/accounts/01a943752f1069b93df5b328ce954d0f/pages/projects/cell-connecta/deployments/" +
    encodeURIComponent(deploymentId),
  { headers: { Authorization: "Bearer " + process.env.CLOUDFLARE_API_TOKEN } },
);
const metadata = await metadataResponse.json();
assert.equal(metadata.success, true);
assert.equal(metadata.result.environment, "preview");
assert.equal(metadata.result.url, base);
assert.equal(
  metadata.result.d1_databases?.DB?.id,
  "4aec972c-3587-4859-98b6-e43bec209e0f",
);
assert.notEqual(new URL(base).hostname, "cell-connecta.pages.dev");
console.log("Verified isolated remote staging binding before any mutations.");
if (!process.env.CC_QA_PASSWORD)
  throw Error("Set CC_QA_PASSWORD for the local-only QA owner.");
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage();
const checks = [],
  errors = [],
  csp = [];
let csrf = "",
  qaProduct,
  orderId;
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (/Content Security Policy|Refused to/.test(m.text())) csp.push(m.text());
});
const check = async (name, fn) => {
  await fn();
  checks.push(name);
  console.log("PASS", name);
};
async function request(path, { method = "GET", body, headers = {} } = {}) {
  return page.evaluate(
    async ({ path, method, body, headers }) => {
      const r = await fetch(path, {
        method,
        headers: {
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      return { status: r.status, json: await r.json().catch(() => null) };
    },
    { path, method, body, headers },
  );
}
const admin = (path, body) =>
  request(path, { method: "POST", body, headers: { "X-CSRF-Token": csrf } });
async function allImages() {
  await page
    .locator("img")
    .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = "eager")));
  await page.waitForFunction(
    () => [...document.images].every((i) => i.complete),
    {},
    { timeout: 15000 },
  );
  await page
    .locator("img")
    .evaluateAll((imgs) =>
      Promise.all(imgs.map((i) => i.decode().catch(() => {}))),
    );
  assert.ok(
    await page
      .locator("img")
      .evaluateAll((imgs) => imgs.every((i) => i.naturalWidth > 0)),
    "Some listing images failed to decode",
  );
  await page.evaluate(async () => {
    for (
      let y = 0;
      y < document.documentElement.scrollHeight;
      y += innerHeight
    ) {
      scrollTo(0, y);
      await new Promise(requestAnimationFrame);
    }
    scrollTo(0, 0);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}
async function screenshot(name, path, mobile = false) {
  await page.setViewportSize({
    width: mobile ? 390 : 1440,
    height: mobile ? 844 : 1000,
  });
  await page.goto(base + path, { waitUntil: "networkidle" });
  if (path === "/admin") await page.waitForSelector(".admin-stats strong");
  await allImages();
  await page.screenshot({
    path:
      "checks/staging-" + name + "-" + (mobile ? "mobile" : "desktop") + ".png",
    fullPage: name !== "admin",
  });
}
try {
  await fs.mkdir("checks", { recursive: true });
  await check(
    "Homepage renders real featured products and working Shop All Phones CTA",
    async () => {
      await page.goto(base, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".product-card").count(), 4);
      await allImages();
      await page
        .getByRole("link", { name: "Shop All Products", exact: true })
        .click();
      await page.waitForURL("**/shop");
      assert.equal(await page.locator(".product-card").count(), 12);
    },
  );
  await check(
    "Catalogue search, composed brand/price/storage/condition filters, pagination and sorting",
    async () => {
      await page.locator("#shop-q").fill("iPhone 15");
      await page.locator(".catalogue-search button").click();
      await page.waitForURL(/q=iPhone/);
      assert.ok(
        (await page.locator(".product-info h3").allTextContents()).every((t) =>
          t.includes("iPhone 15"),
        ),
      );
      const r = await request(
        "/api/catalogue?brand=Apple&min=6000&max=10000&storage=128GB&condition=certified_refurbished",
      );
      assert.equal(r.status, 200);
      assert.ok(r.json.count > 0);
      for (const p of r.json.items) {
        assert.equal(p.brand, "Apple");
        assert.equal(p.condition, "certified_refurbished");
        const v = p.variants.find((v) => v.id === p.displayVariantId);
        assert.equal(v.storage, "128GB");
        assert.ok(v.price >= 6000 && v.price <= 10000);
      }
      const selectedColour = r.json.items[0].colour;
      const combined = new URLSearchParams({
        brand: "Apple",
        category: "phones",
        colour: selectedColour,
        storage: "128GB",
        min: "6000",
        max: "10000",
        condition: "certified_refurbished",
        available: "1",
      });
      const filtered = await request("/api/catalogue?" + combined);
      assert.ok(filtered.json.count > 0);
      for (const product of filtered.json.items) {
        assert.equal(product.category, "phones");
        assert.equal(product.colour, selectedColour);
        assert.ok(
          product.variants.find((v) => v.id === product.displayVariantId)
            .inStock > 0,
        );
      }
      await page.goto(base + "/shop?" + combined, { waitUntil: "networkidle" });
      assert.equal(
        await page.locator(".product-card").count(),
        filtered.json.items.length,
      );
      assert.equal(
        await page.locator("[name=colour]").inputValue(),
        selectedColour,
      );
      const sorted = await request("/api/catalogue?sort=price-low");
      const prices = sorted.json.items.map(
        (p) => p.variants.find((v) => v.id === p.displayVariantId).price,
      );
      assert.ok(prices.every((p, i) => !i || p >= prices[i - 1]));
      const next = await request("/api/catalogue?page=2");
      assert.equal(next.json.items.length, 12);
    },
  );
  let publicProducts = (await request("/api/phones")).json;
  const multi = publicProducts.find((p) => p.variants.length > 1),
    productPath = "/phone/" + multi.id;
  await check(
    "Product gallery, real conditions, variant prices, stock and accurate structured data",
    async () => {
      await page.goto(base + productPath, { waitUntil: "networkidle" });
      await page.locator("#variant-select").selectOption(multi.variants[1].id);
      const expected = multi.variants[1].price;
      assert.equal(
        Number(
          (await page.locator("#detail-price").textContent()).replace(
            /[^0-9.]/g,
            "",
          ),
        ),
        expected,
      );
      assert.ok(
        (await page.locator("#detail-stock").textContent()).includes(
          String(multi.variants[1].inStock),
        ),
      );
      if (multi.photoUrls.length > 1) {
        await page.locator("[data-gallery]").nth(1).click();
        assert.ok(
          (
            await page.locator("#main-product-image").getAttribute("src")
          ).includes(multi.photos[1]),
        );
      }
      const schema = JSON.parse(
        await page.locator('script[type="application/ld+json"]').textContent(),
      );
      assert.equal(schema.offers.length, multi.variants.length);
      assert.equal(schema.offers[1].price, expected);
    },
  );
  await check(
    "Unavailable quantities rejected; available products enter a persistent real-stock-validated bag",
    async () => {
      await page.locator("#product-quantity").fill("101");
      await page.locator("#add-to-cart").click();
      assert.ok(await page.locator("#product-error").isVisible());
      await page.locator("#product-quantity").fill("1");
      await page.locator("#add-to-cart").click();
      await page.waitForFunction(
        () => document.querySelector(".cart-count").textContent === "1",
      );
      await page.reload({ waitUntil: "networkidle" });
      assert.equal(await page.locator(".cart-count").textContent(), "1");
      await page.goto(base + "/cart", { waitUntil: "networkidle" });
      await page.waitForSelector(".cart-item");
      assert.ok(await page.locator("#proceed-checkout").isVisible());
      const invalid = await request("/api/cart/validate", {
        method: "POST",
        body: { items: [{ variantId: multi.variants[1].id, quantity: 100 }] },
      });
      assert.equal(invalid.status, 409);
    },
  );
  await check(
    "Checkout records an unpaid, unreserved order request and returns a private receipt",
    async () => {
      await page.goto(base + "/checkout", { waitUntil: "networkidle" });
      await page.waitForSelector("#checkout-form:not([hidden])");
      for (const [k, v] of Object.entries({
        name: "Local QA Customer",
        phone: "+27820000000",
        email: "qa@example.invalid",
        city: "Cape Town",
        address: "Local QA only — no real delivery",
      }))
        await page.locator("#checkout-form [name=" + k + "]").fill(v);
      await page.locator("[name=acknowledged]").check();
      await page.locator("#place-order").click();
      await page.waitForURL(/\/order\//);
      await page.waitForSelector("#receipt-content h1");
      assert.match(
        await page.locator("#receipt-content").innerText(),
        /request is received/i,
      );
      assert.match(
        await page.locator("#receipt-content").innerText(),
        /not yet reserved/i,
      );
      orderId = new URL(page.url()).pathname.split("/").pop();
      assert.equal((await request("/api/orders/" + orderId)).status, 401);
    },
  );
  await check(
    "Unauthenticated admin page/API, forged session, and cross-origin mutation attempts are blocked",
    async () => {
      const anon = await browser.newContext();
      const r = await anon.request.get(base + "/admin", { maxRedirects: 0 });
      assert.equal(r.status(), 302);
      const apiResponse = await anon.request.post(
        base + "/api/admin/products",
        { headers: { Origin: base }, data: { model: "Unpermitted" } },
      );
      assert.equal(apiResponse.status(), 401);
      const cross = await anon.request.post(base + "/api/admin/products", {
        headers: { Origin: "https://evil.invalid" },
        data: {},
      });
      assert.equal(cross.status(), 403);
      const forged = await anon.request.get(base + "/api/admin/overview", {
        headers: { Cookie: "cc_store_session=forged" },
      });
      assert.equal(forged.status(), 401);
      await anon.close();
    },
  );
  await check(
    "Owner authenticates using PBKDF2; server checks owner permissions and CSRF",
    async () => {
      await page.goto(base + "/login", { waitUntil: "networkidle" });
      await page
        .locator("#login-form [name=email]")
        .fill("qa-owner@cellconnecta.invalid");
      await page
        .locator("#login-form [name=password]")
        .fill(process.env.CC_QA_PASSWORD);
      await page.locator("#login-form button[type=submit]").click();
      await page.waitForURL("**/admin");
      await page.waitForSelector(".admin-stats strong");
      const me = await request("/api/auth/me");
      assert.equal(me.json.isOwner, true);
      const ordinary = await request("/api/auth/login", {
        method: "POST",
        body: {
          email: "qa-customer@cellconnecta.invalid",
          password: process.env.CC_QA_PASSWORD,
        },
      });
      assert.equal(ordinary.status, 401);
      csrf = me.json.csrfToken;
      assert.equal(
        (await request("/api/admin/stock", { method: "POST", body: {} }))
          .status,
        403,
      );
      const cookies = await context.cookies();
      const session = cookies.find((c) => c.name === "cc_store_session");
      assert.ok(
        session.httpOnly && session.secure && session.sameSite === "Lax",
      );
    },
  );
  await check(
    "Desktop/mobile screenshots and rendered overflow checks at all eight requested widths",
    async () => {
      for (const [name, path] of [
        ["home", "/"],
        ["shop", "/shop"],
        ["product", productPath],
        ["admin", "/admin"],
      ]) {
        await screenshot(name, path, false);
        await screenshot(name, path, true);
      }
      for (const width of [360, 390, 430, 768, 1024, 1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const path of [
          "/",
          "/shop",
          productPath,
          "/cart",
          "/checkout",
          "/admin",
          "/login",
        ]) {
          await page.goto(base + path, { waitUntil: "networkidle" });
          const d = await page.evaluate(() => ({
            w: innerWidth,
            s: document.documentElement.scrollWidth,
          }));
          assert.ok(d.s <= d.w, `${path} overflow at ${width}: ${d.s}`);
        }
      }
    },
  );
  await check(
    "Mobile navigation, search and compact filter panel are accessible and functional",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + "/shop", { waitUntil: "networkidle" });
      await page.locator("#global-menu-toggle").click();
      assert.equal(
        await page.locator("#global-menu-toggle").getAttribute("aria-expanded"),
        "true",
      );
      await page.locator("#global-menu-toggle").click();
      assert.ok(await page.locator("#global-menu").isHidden());
      assert.equal(await page.locator("#global-search-toggle").count(), 0);
      assert.ok(await page.locator("#shop-q").isVisible());
      await page.locator("#global-menu-toggle").click();
      await page.keyboard.press("Escape");
      assert.ok(await page.locator("#global-menu").isHidden());
      await page.locator(".filter-details summary").click();
      assert.ok(await page.locator(".filter-panel").isVisible());
      await page.setViewportSize({ width: 1440, height: 1000 });
    },
  );
  await check(
    "Owner creates a draft product with an uploaded image; drafts stay private",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(base + "/admin", { waitUntil: "networkidle" });
      await page.waitForSelector(".admin-stats strong");
      await page.locator("#add-product").click();
      const f = page.locator("#product-form");
      await f.locator("[name=model]").fill("QA Integration Device");
      await f.locator("[name=brand]").fill("Other");
      await f.locator("[name=colour]").fill("Graphite");
      await f
        .locator("[name=description]")
        .fill("Local QA only. Not production inventory.");
      await f
        .locator("[name=specifications]")
        .fill("Purpose: Local integration testing");
      await f.locator("[data-field=price]").fill("1234");
      await f.locator("[data-field=inStock]").fill("3");
      await page
        .locator("#image-upload")
        .setInputFiles("tests/fixtures/upload.jpg");
      await page.waitForFunction(() =>
        document
          .querySelector("#upload-status")
          .textContent.includes("successfully"),
      );
      await page.locator("#save-product").click();
      await page.waitForFunction(
        () => !document.querySelector("#product-editor").open,
      );
      const overview = await request("/api/admin/overview");
      qaProduct = overview.json.products.find(
        (p) => p.model === "QA Integration Device",
      );
      assert.ok(qaProduct);
      assert.equal(qaProduct.status, "draft");
      assert.ok(
        !(await request("/api/phones")).json.some((p) => p.id === qaProduct.id),
      );
      assert.equal((await request("/api/phones/" + qaProduct.id)).status, 404);
    },
  );
  await check(
    "Owner publishes and edits price/details; database values persist after refresh and homepage curation updates",
    async () => {
      let p = qaProduct;
      let saved = await admin("/api/admin/products", {
        ...p,
        status: "published",
        featured: true,
        variants: p.variants.map((v) => ({ ...v, price: 1299.5 })),
        description: "QA description <script>window.QA_INJECTED=true</script>",
      });
      assert.equal(saved.status, 201);
      await page.reload({ waitUntil: "networkidle" });
      p = (await request("/api/admin/overview")).json.products.find(
        (x) => x.id === p.id,
      );
      assert.equal(p.variants[0].price, 1299.5);
      assert.equal(p.status, "published");
      qaProduct = p;
      await page.goto(base + "/phone/" + p.id, { waitUntil: "networkidle" });
      assert.equal(await page.evaluate(() => window.QA_INJECTED), undefined);
      assert.ok((await page.locator("body").innerText()).includes("<script>"));
      await page.goto(base, { waitUntil: "networkidle" });
      assert.ok(
        (await page.locator(".product-info h3").allTextContents()).includes(
          "QA Integration Device",
        ),
      );
      await page.goto(base + "/admin", { waitUntil: "networkidle" });
    },
  );
  await check(
    "Stock add/remove/set operations persist; negative results and stale updates are rejected",
    async () => {
      for (const [action, quantity, expected] of [
        ["add", 5, 8],
        ["remove", 2, 6],
        ["set", 2, 2],
      ]) {
        const response = await admin("/api/admin/stock", {
          variantId: qaProduct.variants[0].id,
          action,
          quantity,
          reason: "Local QA stock check",
          version: qaProduct.version,
        });
        assert.equal(response.status, 200, JSON.stringify(response.json));
        qaProduct = (await request("/api/admin/overview")).json.products.find(
          (p) => p.id === qaProduct.id,
        );
        assert.equal(qaProduct.variants[0].inStock, expected);
      }
      const invalid = await admin("/api/admin/stock", {
        variantId: qaProduct.variants[0].id,
        action: "remove",
        quantity: 3,
        reason: "Invalid QA adjustment",
        version: qaProduct.version,
      });
      assert.equal(invalid.status, 400);
      const stale = await admin("/api/admin/stock", {
        variantId: qaProduct.variants[0].id,
        action: "add",
        quantity: 1,
        reason: "Stale QA adjustment",
        version: 1,
      });
      assert.equal(stale.status, 409);
    },
  );
  await check(
    "Mobile product editor and stock-adjustment forms fit the viewport and save through the real API",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base + "/admin", { waitUntil: "networkidle" });
      await page.waitForSelector(".admin-stats strong");
      await page.locator("#admin-search").fill("QA Integration Device");
      await page.locator('[data-edit="' + qaProduct.id + '"]').click();
      const box = await page.locator("#product-editor").boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= 390 && box.height <= 844);
      await page.locator("#product-form [name=colour]").fill("Graphite QA");
      await page.locator("#save-product").click();
      await page.waitForFunction(
        () => !document.querySelector("#product-editor").open,
      );
      await page.locator('[data-stock="' + qaProduct.id + '"]').click();
      await page.locator("#stock-form [name=quantity]").fill("1");
      await page
        .locator("#stock-form [name=reason]")
        .fill("Local QA mobile form");
      await page.locator("#stock-form button.button").click();
      await page.waitForFunction(
        () => !document.querySelector("#stock-dialog").open,
      );
      qaProduct = (await request("/api/admin/overview")).json.products.find(
        (p) => p.id === qaProduct.id,
      );
      assert.equal(qaProduct.colour, "Graphite QA");
      assert.equal(qaProduct.variants[0].inStock, 3);
      assert.equal(
        (
          await admin("/api/admin/stock", {
            variantId: qaProduct.variants[0].id,
            action: "set",
            quantity: 2,
            reason: "Restore local concurrency fixture",
            version: qaProduct.version,
          })
        ).status,
        200,
      );
      qaProduct = (await request("/api/admin/overview")).json.products.find(
        (p) => p.id === qaProduct.id,
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
    },
  );
  await check(
    "A failed database write rolls back completely and returns an error, never a false success",
    async () => {
      const before = (await request("/api/admin/overview")).json.products
        .length;
      const duplicate = {
        ...qaProduct,
        id: undefined,
        version: undefined,
        model: "SHOULD NOT PERSIST",
        variants: qaProduct.variants.map((v) => ({ ...v, id: undefined })),
      };
      const response = await admin("/api/admin/products", duplicate);
      assert.equal(response.status, 409);
      const after = (await request("/api/admin/overview")).json.products;
      assert.equal(after.length, before);
      assert.ok(!after.some((p) => p.model === "SHOULD NOT PERSIST"));
    },
  );
  await check(
    "Order requests are idempotent; concurrent confirmations cannot oversell; cancellation restocks once",
    async () => {
      const input = {
        name: "Concurrent QA",
        phone: "+27820000000",
        email: "qa@example.invalid",
        city: "Cape Town",
        address: "Local QA fixture",
        deliveryMethod: "cape_town",
        acknowledged: true,
        expectedSubtotalCents: 259900,
        items: [{ variantId: qaProduct.variants[0].id, quantity: 2 }],
      };
      const key = randomUUID(),
        receipt = randomBytes(32).toString("hex"),
        headers = { "Idempotency-Key": key, "X-Order-Token": receipt };
      const a = await request("/api/orders", {
        method: "POST",
        body: input,
        headers,
      });
      assert.equal(a.status, 201, JSON.stringify(a.json));
      const repeat = await request("/api/orders", {
        method: "POST",
        body: input,
        headers,
      });
      assert.equal(repeat.json.id, a.json.id);
      const b = await request("/api/orders", {
        method: "POST",
        body: input,
        headers: {
          "Idempotency-Key": randomUUID(),
          "X-Order-Token": randomBytes(32).toString("hex"),
        },
      });
      assert.equal(b.status, 201);
      const results = await Promise.all([
        admin("/api/admin/orders/" + a.json.id, { status: "confirmed" }),
        admin("/api/admin/orders/" + b.json.id, { status: "confirmed" }),
      ]);
      assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
      let p = (await request("/api/admin/overview")).json.products.find(
        (p) => p.id === qaProduct.id,
      );
      assert.equal(p.variants[0].inStock, 0);
      const confirmed = results[0].status === 200 ? a.json.id : b.json.id;
      assert.equal(
        (await admin("/api/admin/orders/" + confirmed, { status: "cancelled" }))
          .status,
        200,
      );
      assert.equal(
        (await admin("/api/admin/orders/" + confirmed, { status: "cancelled" }))
          .status,
        200,
      );
      p = (await request("/api/admin/overview")).json.products.find(
        (p) => p.id === qaProduct.id,
      );
      assert.equal(p.variants[0].inStock, 2);
      qaProduct = p;
    },
  );
  await check(
    "Product archive requires confirmation and removes the listing from public API/search/product pages",
    async () => {
      await page.goto(base + "/admin", { waitUntil: "networkidle" });
      await page.waitForSelector(".admin-stats strong");
      await page.locator("#admin-search").fill("QA Integration Device");
      page.once("dialog", (dialog) => dialog.accept());
      await page.locator('[data-archive="' + qaProduct.id + '"]').click();
      await page.waitForFunction(() =>
        document
          .querySelector("#admin-success")
          .textContent.includes("archived"),
      );
      assert.equal((await request("/api/phones/" + qaProduct.id)).status, 404);
      const search = await request("/api/catalogue?q=QA%20Integration");
      assert.equal(search.json.count, 0);
      const response = await page.goto(base + "/phone/" + qaProduct.id);
      assert.equal(response.status(), 404);
    },
  );
  await check(
    "Owner can disable/update promotion; restricted uploads and unconfigured online payments fail clearly",
    async () => {
      await page.goto(base + "/admin", { waitUntil: "networkidle" });
      const overview = (await request("/api/admin/overview")).json;
      await page.waitForSelector(".admin-stats strong");
      await page.locator("[data-admin-tab=content]").click();
      await page.locator("#content-form [name=enabled]").uncheck();
      await page.locator("#content-form button[type=submit]").click();
      await page.waitForFunction(() =>
        document
          .querySelector("#admin-success")
          .textContent.includes("Store content saved"),
      );
      await page.goto(base, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".source-banner").count(), 0);
      await page.goto(base + "/admin", { waitUntil: "networkidle" });
      const restore = await admin("/api/admin/settings", {
        promotion: overview.settings.promotion,
        business: overview.settings.business,
      });
      assert.equal(restore.status, 200);
      const upload = await page.evaluate(async (csrf) => {
        const r = await fetch("/api/admin/photos", {
          method: "POST",
          headers: { "Content-Type": "image/svg+xml", "X-CSRF-Token": csrf },
          body: '<svg onload="alert(1)"/>',
        });
        return r.status;
      }, csrf);
      assert.equal(upload, 415);
      assert.equal(
        (await request("/api/payments/session", { method: "POST", body: {} }))
          .status,
        503,
      );
      assert.equal(
        (
          await request("/api/auth/forgot", {
            method: "POST",
            body: { email: "qa-owner@cellconnecta.invalid" },
          })
        ).status,
        503,
      );
    },
  );
  await check(
    "Login rate limiting and session logout are enforced",
    async () => {
      let limited = false;
      for (let i = 0; i < 7; i++) {
        const response = await request("/api/auth/login", {
          method: "POST",
          body: {
            email: "nobody@example.invalid",
            password: "not-a-real-password",
          },
        });
        if (response.status === 429) limited = true;
        else assert.equal(response.status, 401);
      }
      assert.ok(limited);
      assert.equal((await admin("/api/auth/logout", {})).status, 200);
      assert.equal((await request("/api/admin/overview")).status, 401);
    },
  );
  await check(
    "No JavaScript exceptions or Content Security Policy violations during end-to-end workflows",
    async () => {
      assert.deepEqual(errors, []);
      assert.deepEqual(csp, []);
    },
  );
  const result = {
    passed: true,
    environment:
      "Verified remote Cloudflare Pages preview + isolated staging D1; NOT production",
    checks,
    widths: [360, 390, 430, 768, 1024, 1366, 1440, 1920],
    limitations: [
      "Staging tests passed against the isolated QA owner. Real production owner-password login remains unverified.",
      "No online payment provider, transactional order email or carrier-rate service is enabled.",
      "Password recovery needs RESEND_FROM_EMAIL and a working sender/API key; real email delivery is not configured or tested.",
    ],
  };
  await fs.writeFile(
    "checks/staging-test-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  await page
    .screenshot({ path: "checks/staging-failure.png", fullPage: true })
    .catch(() => {});
  const result = {
    passed: false,
    environment: "local QA",
    checks,
    error: e.message,
  };
  await fs.writeFile(
    "checks/staging-test-results.json",
    JSON.stringify(result, null, 2),
  );
  console.error("FAILED", e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
