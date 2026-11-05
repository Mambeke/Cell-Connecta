import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
// Public GET/navigation checks only. Safe locally or on canonical production.
const base = process.env.SHOP_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage(),
  errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const go = (path) => page.goto(base + path, { waitUntil: "networkidle" });
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log("PASS", name);
}
async function change(selector, value, param) {
  await Promise.all([
    page.waitForURL((u) => u.searchParams.get(param) === value, {
      waitUntil: "networkidle",
    }),
    page.locator(selector).selectOption(value),
  ]);
}
async function capture(file) {
  await page
    .locator(".product-card img")
    .evaluateAll((imgs) => imgs.forEach((i) => (i.loading = "eager")));
  await page
    .locator(".product-card img")
    .evaluateAll((imgs) => Promise.all(imgs.map((i) => i.decode())));
  await page.screenshot({ path: file, fullPage: true });
}
try {
  const all = await (await page.request.get(base + "/api/phones")).json();
  const sample = all.find(
    (p) =>
      p.category === "phones" &&
      p.brand === "Apple" &&
      p.variants.length > 1 &&
      p.variants.some((v) => v.inStock > 0),
  );
  assert.ok(sample, "Real multivariant phone required for storage workflow");
  await check(
    "Default catalogue retains accessible heading, desktop sidebar and real inventory",
    async () => {
      await go("/shop");
      assert.equal(await page.locator("h1").innerText(), "All products");
      assert.equal(
        await page.locator(".filter-details").getAttribute("open"),
        "",
      );
      assert.equal(
        await page.locator(".product-card").count(),
        Math.min(12, all.length),
      );
      assert.equal(await page.locator("[name=category]").count(), 4);
      assert.equal(
        await page
          .locator(".shop-sidebar")
          .evaluate((el) => getComputedStyle(el).position),
        "sticky",
      );
    },
  );
  await check(
    "Desktop category checkboxes update heading and create blue-separated sections",
    async () => {
      await Promise.all([
        page.waitForURL((u) => u.searchParams.getAll("category").length === 1, {
          waitUntil: "networkidle",
        }),
        page.locator("[name=category][value=phones]").check(),
      ]);
      assert.equal(await page.locator("h1").innerText(), "Phones");
      await Promise.all([
        page.waitForURL((u) => u.searchParams.getAll("category").length === 2, {
          waitUntil: "networkidle",
        }),
        page.locator("[name=category][value=laptops]").check(),
      ]);
      assert.equal(await page.locator("h1").innerText(), "Phones & Laptops");
      assert.equal(await page.locator("[data-category-group]").count(), 2);
      const group = page.locator("[data-category-group=laptops]");
      assert.equal(await group.locator("h2").innerText(), "Laptops");
      assert.equal(
        await group.locator(".product-card").count(),
        all.filter((p) => p.category === "laptops").length,
      );
      const rule = await group.evaluate((el) => ({
        width: getComputedStyle(el).borderTopWidth,
        color: getComputedStyle(el).borderTopColor,
      }));
      assert.ok(parseFloat(rule.width) >= 2);
      assert.match(rule.color, /rgb\(/);
      await capture("checks/catalogue-grouped-desktop.png");
      await page.getByRole("link", { name: "Remove Laptops" }).click();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("h1").innerText(), "Phones");
    },
  );
  await check(
    "Brand → exact iPhone model → real storage updates and survives product navigation",
    async () => {
      await go("/shop?category=phones");
      await change("#shop-brand", "Apple", "brand");
      await change("#shop-model", sample.model, "model");
      const storage = sample.variants.find((v) => v.inStock > 0).storage;
      const expected = [
        ...new Set(
          all
            .filter(
              (p) =>
                p.category === "phones" &&
                p.brand === "Apple" &&
                p.model === sample.model,
            )
            .flatMap((p) => p.variants.map((v) => v.storage)),
        ),
      ].sort();
      assert.deepEqual(
        (
          await page
            .locator("#shop-storage option")
            .evaluateAll((els) => els.map((el) => el.value).filter(Boolean))
        ).sort(),
        expected,
      );
      await change("#shop-storage", storage, "storage");
      const card = page.locator(".product-card").first(),
        href = await card.locator(".product-photo").getAttribute("href");
      const variant = new URL(href, base).searchParams.get("variant");
      assert.ok(variant);
      const product = all.find(
        (p) => p.id === new URL(href, base).pathname.split("/").pop(),
      );
      const v = product.variants.find((v) => v.id === variant);
      assert.equal(v.storage, storage);
      assert.equal(product.model, sample.model);
      assert.match(
        await card.locator(".product-spec").innerText(),
        new RegExp(storage),
      );
      await card.locator(".product-photo").click();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("#variant-select").inputValue(), variant);
      assert.ok(
        (await page.locator("#detail-price").innerText())
          .replace(/\D/g, "")
          .startsWith(String(v.price)),
      );
    },
  );
  await check(
    "API composed filters preserve same-variant storage, price and availability",
    async () => {
      const q =
        "category=phones&category=laptops&brand=Apple&storage=128GB&max=9000&available=1";
      const r = await (
        await page.request.get(base + "/api/catalogue?" + q)
      ).json();
      assert.ok(r.count > 0);
      for (const p of r.items) {
        const v = p.variants.find((v) => v.id === p.displayVariantId);
        assert.ok(v);
        assert.equal(v.storage, "128GB");
        assert.ok(v.price <= 9000 && v.inStock > 0);
      }
    },
  );
  await check(
    "Mobile batches category/model/storage selections until Apply and resets child facets",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await go("/shop");
      assert.equal(
        await page.locator(".filter-details").getAttribute("open"),
        null,
      );
      await page.locator(".filter-details summary").click();
      await page.locator("[name=category][value=phones]").check();
      await page.locator("#shop-brand").selectOption("Apple");
      await page.locator("#shop-model").selectOption(sample.model);
      await page
        .locator("#shop-storage")
        .selectOption(sample.variants.find((v) => v.inStock > 0).storage);
      assert.equal(new URL(page.url()).search, "");
      await page.locator(".filter-actions button").click();
      await page.waitForLoadState("networkidle");
      assert.equal(new URL(page.url()).searchParams.get("model"), sample.model);
      assert.equal(await page.locator("h1").innerText(), "Phones");
      await page.locator(".filter-details summary").click();
      await page.locator("[name=category][value=phones]").uncheck();
      await page.locator("[name=category][value=laptops]").check();
      assert.equal(await page.locator("#shop-model").inputValue(), "");
      assert.equal(await page.locator("#shop-storage").inputValue(), "");
      assert.equal(await page.locator("#shop-model option").count(), 1);
      await page.locator(".filter-actions button").click();
      await page.waitForLoadState("networkidle");
      assert.equal(await page.locator("h1").innerText(), "Laptops");
    },
  );
  await check(
    "Eight widths have no horizontal overflow, correct filter mode and no sticky-header overlap",
    async () => {
      for (const width of [360, 390, 430, 768, 1024, 1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        await go("/shop?category=phones");
        const m = await page.evaluate(() => ({
          w: innerWidth,
          sw: document.documentElement.scrollWidth,
          open: document.querySelector(".filter-details").open,
          cols: getComputedStyle(
            document.querySelector(".product-grid"),
          ).gridTemplateColumns.split(" ").length,
        }));
        assert.ok(m.sw <= m.w + 1, `${width}px overflow ${m.sw}`);
        assert.equal(m.open, width >= 1000);
        assert.equal(
          m.cols,
          width >= 1600
            ? 4
            : width >= 1200
              ? 3
              : width >= 1000
                ? 2
                : width <= 700
                  ? 2
                  : 3,
        );
        if (width >= 1000) {
          await page.evaluate(() => scrollTo(0, 700));
          await page.waitForTimeout(120);
          const box = await page.evaluate(() => ({
            side: document
              .querySelector(".shop-sidebar")
              .getBoundingClientRect().top,
            head: document.querySelector(".site-header").getBoundingClientRect()
              .bottom,
          }));
          assert.ok(
            box.side >= box.head + 10,
            `${width}: sidebar overlaps sticky navigation`,
          );
        }
        if ([390, 1440].includes(width)) {
          await page.evaluate(() => scrollTo(0, 0));
          await capture(`checks/catalogue-${width}.png`);
        }
      }
    },
  );
  await check(
    "Sidebar remains operable after resizing and without JavaScript",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      assert.equal(
        await page.locator(".filter-details").getAttribute("open"),
        null,
      );
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.waitForFunction(
        () => document.querySelector(".filter-details").open,
      );
      assert.notEqual(
        await page.locator(".filter-details").getAttribute("open"),
        null,
      );
      const noJS = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 1440, height: 1000 },
      });
      const p = await noJS.newPage();
      await p.goto(base + "/shop?category=phones");
      assert.notEqual(
        await p.locator(".filter-details").getAttribute("open"),
        null,
      );
      await p.locator("[name=category][value=laptops]").check();
      await p.locator(".filter-actions button").click();
      await p.waitForLoadState("networkidle");
      assert.equal(await p.locator("h1").innerText(), "Phones & Laptops");
      await noJS.close();
    },
  );
  await check(
    "Search, sorting, price controls, availability/deals and pagination remain functional",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await go("/shop?category=phones&page=2");
      assert.equal(
        await page.locator(".pagination [aria-current=page]").innerText(),
        "2",
      );
      await page.locator("#shop-q").fill("mini");
      await page.locator(".catalogue-search button").click();
      await page.waitForLoadState("networkidle");
      assert.equal(new URL(page.url()).searchParams.has("page"), false);
      assert.ok((await page.locator(".product-card").count()) > 0);
      for (const text of await page
        .locator(".product-card h3")
        .allTextContents())
        assert.match(text, /mini/i);
      await change("#catalogue-sort", "price-low", "sort");
      const prices = (
        await page.locator(".product-card .price").allTextContents()
      ).map((s) => Number(s.replace(/[^0-9.]/g, "")));
      assert.deepEqual(
        prices,
        [...prices].sort((a, b) => a - b),
      );
      await page.locator("#shop-min").fill("5000");
      await page.locator("#shop-max").fill("9000");
      await page.locator(".filter-actions button").click();
      await page.waitForLoadState("networkidle");
      assert.equal(new URL(page.url()).searchParams.get("min"), "5000");
      await Promise.all([
        page.waitForURL((u) => u.searchParams.get("available") === "1", {
          waitUntil: "networkidle",
        }),
        page.locator("[name=available]").check(),
      ]);
      await Promise.all([
        page.waitForURL((u) => u.searchParams.get("deals") === "1", {
          waitUntil: "networkidle",
        }),
        page.locator("[name=deals]").check(),
      ]);
      const response = await (
        await page.request.get(
          base + "/api/catalogue" + new URL(page.url()).search,
        )
      ).json();
      assert.equal(
        await page.locator(".product-card").count(),
        response.items.length,
      );
      for (const product of response.items) {
        const v = product.variants.find(
          (v) => v.id === product.displayVariantId,
        );
        assert.ok(
          v.price >= 5000 &&
            v.price <= 9000 &&
            v.inStock > 0 &&
            v.wasPrice > v.price,
        );
      }
    },
  );
  await check(
    "Compact premium layout removes intro and brings shopping controls directly below navigation",
    async () => {
      for (const width of [360, 390, 430, 768, 1024, 1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        await go("/shop");
        assert.equal(await page.locator(".shop-intro").count(), 0);
        assert.equal(
          await page.locator(".premium-catalogue .breadcrumbs").count(),
          0,
        );
        assert.equal(await page.locator("h1").getAttribute("class"), "sr-only");
        const geometry = await page.evaluate(() => {
          const box = (s) => document.querySelector(s).getBoundingClientRect();
          const side = box(".shop-sidebar"),
            search = box(".catalogue-search"),
            nav = box(".site-header"),
            product = box(".product-card");
          return {
            gap: side.top - nav.bottom,
            sideTop: side.top,
            searchTop: search.top,
            productTop: product.top,
            bg: getComputedStyle(document.body).backgroundImage,
          };
        });
        assert.ok(
          geometry.gap >= 10 && geometry.gap <= 30,
          `${width}px excessive header gap ${geometry.gap}`,
        );
        if (width >= 1000)
          assert.ok(
            Math.abs(geometry.sideTop - geometry.searchTop) < 2,
            "Sidebar/search not aligned",
          );
        else
          assert.ok(
            geometry.productTop < 500,
            `${width}px products too far down ${geometry.productTop}`,
          );
        assert.match(geometry.bg, /gradient/);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await go("/shop");
      await capture("checks/compact-catalogue-mobile.png");
      await page.locator(".filter-details summary").click();
      await page.screenshot({
        path: "checks/compact-filters-mobile.png",
        fullPage: false,
      });
      await page.setViewportSize({ width: 1440, height: 1100 });
      await go("/shop");
      await capture("checks/compact-catalogue-desktop.png");
    },
  );
  await check(
    "Customer header, footer admin gateway and below-pagination phone sourcing work at eight widths",
    async () => {
      for (const width of [360, 390, 430, 768, 1024, 1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        await go("/shop?category=phones");
        assert.equal(
          await page
            .locator(
              ".site-header .account-link, #global-search-toggle, #global-search",
            )
            .count(),
          0,
        );
        assert.equal(
          await page
            .locator(
              '.site-header a[href="/login"], .site-header a[href="/admin"]',
            )
            .count(),
          0,
        );
        const wa = page.locator(".header-whatsapp"),
          cart = page.locator(".header-actions .cart-link");
        assert.equal(
          await wa.getAttribute("href"),
          "https://wa.me/27685302223",
        );
        assert.ok((await wa.boundingBox()).x < (await cart.boundingBox()).x);
        const callout = page.locator(".phone-sourcing");
        assert.equal(await callout.count(), 1);
        assert.ok(
          await callout.evaluate(
            (el) =>
              !!(
                el.previousElementSibling &&
                el.previousElementSibling.classList.contains("pagination")
              ),
          ),
        );
        const href = new URL(
          await callout.locator(".sourcing-button").getAttribute("href"),
        );
        assert.equal(href.hostname, "wa.me");
        assert.equal(href.pathname, "/27685302223");
        assert.match(href.searchParams.get("text"), /help me source/);
        assert.ok(
          await page.locator(".site-footer .owner-admin-link").isVisible(),
        );
        assert.equal(
          await page
            .locator(".site-footer .owner-admin-link")
            .getAttribute("href"),
          "/admin",
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.keyboard.press("Escape");
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await go("/shop?category=phones");
      await page.locator(".phone-sourcing").scrollIntoViewIfNeeded();
      await page.screenshot({ path: "checks/phone-sourcing-mobile.png" });
      await page.locator(".owner-admin-link").click();
      await page.waitForURL("**/login");
      assert.equal(await page.locator("#login-form").count(), 1);
      await page.setViewportSize({ width: 1440, height: 1000 });
      await go("/shop");
      await page.locator(".phone-sourcing").scrollIntoViewIfNeeded();
      await page.screenshot({ path: "checks/phone-sourcing-desktop.png" });
    },
  );
  await check(
    "Only navbar has a persistent WhatsApp icon, footer notice is gone and Others filters truthfully",
    async () => {
      for (const width of [360, 390, 430, 768, 1024, 1366, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 });
        await go("/shop");
        assert.equal(await page.locator(".whatsapp-float").count(), 0);
        assert.equal(await page.locator(".header-whatsapp").count(), 1);
        assert.doesNotMatch(
          await page.locator(".site-footer").innerText(),
          /payment is not yet enabled/i,
        );
        const palette = await page
          .locator(".header-whatsapp")
          .evaluate((el) => ({
            bg: getComputedStyle(el).backgroundColor,
            color: getComputedStyle(el).color,
          }));
        assert.equal(palette.bg, "rgb(18, 160, 80)");
        assert.equal(palette.color, "rgb(255, 255, 255)");
        assert.equal(
          await page.locator("[name=category][value=others]").count(),
          1,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await Promise.all([
        page.waitForURL((u) => u.searchParams.get("category") === "others", {
          waitUntil: "networkidle",
        }),
        page.locator("[name=category][value=others]").check(),
      ]);
      assert.equal(await page.locator("h1").innerText(), "Others");
      assert.ok(
        await page.locator("[name=category][value=others]").isChecked(),
      );
      assert.equal(
        await page.locator(".product-card").count(),
        all.filter((p) => p.category === "others").length,
      );
      assert.equal(await page.locator("#shop-model option").count(), 1);
      await go("/shop?category=phones&category=others");
      assert.equal(await page.locator("[data-category-group]").count(), 2);
      assert.equal(
        await page.locator("[data-category-group=others] h2").innerText(),
        "Others",
      );
      await go("/checkout");
      assert.match(
        await page.locator("body").innerText(),
        /order request|no online payment|no payment/i,
      );
    },
  );
  assert.deepEqual(errors, []);
  await fs.writeFile(
    "checks/catalogue-results.json",
    JSON.stringify(
      {
        base,
        checks,
        errors,
        widths: [360, 390, 430, 768, 1024, 1366, 1440, 1920],
        time: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(
    `${checks.length} read-only catalogue groups PASS; zero JavaScript errors`,
  );
} finally {
  await browser.close();
}
