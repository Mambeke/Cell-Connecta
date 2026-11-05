import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.SHOP_URL || "http://127.0.0.1:3000";
// Read-only category/navigation checks: no order, owner or inventory mutations.
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage();
const errors = [],
  checks = [];
page.on("pageerror", (e) => errors.push(e.message));
const active = () =>
  page.locator("[data-hero-slide].is-active").getAttribute("aria-label");
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log("PASS", name);
}
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await check(
    "All four slides/cards use loaded category images and correct category links",
    async () => {
      assert.equal(await page.locator("[data-hero-slide]").count(), 4);
      assert.equal(await page.locator(".brand-section").count(), 0);
      assert.equal(
        await page
          .getByRole("heading", { name: "Shop by brand", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("heading", { name: "Featured phones", exact: true })
          .count(),
        1,
      );
      assert.match(
        await page.locator('[data-hero-key="iphone"] img').getAttribute("src"),
        /hero-iphone-collection\.webp$/,
      );

      assert.equal(
        await page.locator("#shop-by-category-title").innerText(),
        "Shop by category",
      );
      assert.ok(
        !/illustrativ|illustration/i.test(
          await page.locator("body").innerText(),
        ),
      );
      assert.equal(
        await page.locator(".collection-shortcuts .category").count(),
        4,
      );
      await page
        .locator("[data-hero-slide] img")
        .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
      const links = await page
        .locator(".collection-shortcuts .category")
        .evaluateAll((cards) => cards.map((c) => c.getAttribute("href")));
      assert.deepEqual(links, [
        "/shop?category=phones&brand=Apple",
        "/shop?category=phones&brand=Samsung",
        "/shop?category=laptops",
        "/shop?category=accessories",
      ]);
    },
  );
  await check(
    "Automatic rotation, pause, next/previous and category dots work",
    async () => {
      await page.mouse.move(0, 0);
      const first = await active();
      await page.waitForTimeout(5800);
      assert.notEqual(await active(), first);
      await page.locator("[data-hero-pause]").click();
      const paused = await active();
      await page.mouse.click(1, 1);
      await page.waitForTimeout(5800);
      assert.equal(await active(), paused);
      for (let i = 0; i < 4; i++) {
        await page.locator('[data-hero-go="' + i + '"]').click();
        assert.equal(
          await page
            .locator("[data-hero-slide]")
            .nth(i)
            .getAttribute("aria-hidden"),
          "false",
        );
        assert.equal(
          await page
            .locator("[data-hero-slide]:not(.is-active)")
            .evaluateAll((slides) => slides.every((s) => s.inert)),
          true,
        );
      }
      await page.locator("[data-hero-next]").click();
      assert.match(await active(), /^iPhone/);
      await page.locator("[data-hero-prev]").click();
      assert.match(await active(), /^Accessories/);
    },
  );
  await check(
    "Samsung supplied artwork, dark theme, real CTAs and return to pale iPhone theme work",
    async () => {
      await page.locator('[data-hero-go="1"]').click();
      const galaxy = page.locator('[data-hero-key="samsung"]');
      assert.match(
        await galaxy.locator("img").getAttribute("src"),
        /hero-samsung-collection\.webp$/,
      );
      assert.equal(
        await galaxy.locator("img").evaluate((i) => i.naturalWidth),
        1671,
      );
      assert.equal(
        await galaxy
          .locator(".hero-category-title")
          .evaluate((e) => getComputedStyle(e).color),
        "rgb(255, 255, 255)",
      );
      const dark = await page
        .locator(".premium-hero")
        .evaluate((e) => getComputedStyle(e).backgroundImage);
      await galaxy
        .locator(".hero-buttons")
        .getByRole("link", { name: "Explore Samsung", exact: true })
        .click();
      await page.waitForURL("**/shop?**");
      assert.equal(new URL(page.url()).searchParams.get("brand"), "Samsung");
      assert.equal(new URL(page.url()).searchParams.get("category"), "phones");
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
      const pale = await page
        .locator(".premium-hero")
        .evaluate((e) => getComputedStyle(e).backgroundImage);
      assert.notEqual(dark, pale);
      await page.locator('[data-hero-go="1"]').click();
      await page
        .locator('[data-hero-key="samsung"]')
        .getByRole("link", { name: "Shop All Products", exact: true })
        .click();
      await page.waitForURL("**/shop");
      assert.equal(new URL(page.url()).search, "");
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
    },
  );
  await check(
    "Laptop supplied artwork, neon theme, shopping and laptop-only deals links work",
    async () => {
      await page.locator('[data-hero-go="2"]').click();
      const laptop = page.locator('[data-hero-key="laptops"]');
      assert.match(
        await laptop.locator("img").getAttribute("src"),
        /hero-laptop-collection\.webp$/,
      );
      assert.equal(
        await laptop.locator("img").evaluate((i) => i.naturalWidth),
        1671,
      );
      assert.equal(
        await laptop
          .locator(".hero-category-title")
          .evaluate((e) => getComputedStyle(e).color),
        "rgb(255, 255, 255)",
      );
      await laptop
        .getByRole("link", { name: "Shop Laptops", exact: true })
        .click();
      await page.waitForURL("**/shop?**");
      assert.equal(new URL(page.url()).searchParams.get("category"), "laptops");
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
      await page.locator('[data-hero-go="2"]').click();
      await page
        .locator('[data-hero-key="laptops"]')
        .getByRole("link", { name: "View Deals", exact: true })
        .click();
      await page.waitForURL("**/shop?**");
      assert.equal(new URL(page.url()).searchParams.get("category"), "laptops");
      assert.equal(new URL(page.url()).searchParams.get("deals"), "1");
      assert.equal(
        await page.locator('[name=category][value="laptops"]').isChecked(),
        true,
      );
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
    },
  );
  await check(
    "Accessories supplied artwork, dark theme, shop and View All links work",
    async () => {
      await page.locator('[data-hero-go="3"]').click();
      const accessories = page.locator('[data-hero-key="accessories"]');
      assert.match(
        await accessories.locator("img").getAttribute("src"),
        /hero-accessories-collection\.webp$/,
      );
      assert.equal(
        await accessories.locator("img").evaluate((i) => i.naturalWidth),
        1753,
      );
      assert.equal(
        await accessories
          .locator(".hero-category-title")
          .evaluate((e) => getComputedStyle(e).color),
        "rgb(255, 255, 255)",
      );
      await accessories
        .getByRole("link", { name: "Shop Accessories", exact: true })
        .click();
      await page.waitForURL("**/shop?**");
      assert.equal(
        new URL(page.url()).searchParams.get("category"),
        "accessories",
      );
      assert.equal(
        await page.locator('[name=category][value="accessories"]').isChecked(),
        true,
      );
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
      await page.locator('[data-hero-go="3"]').click();
      await page
        .locator('[data-hero-key="accessories"]')
        .getByRole("link", { name: "View All", exact: true })
        .click();
      await page.waitForURL("**/shop");
      assert.equal(new URL(page.url()).search, "");
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
    },
  );
  const widths = [360, 390, 430, 768, 1024, 1366, 1440, 1920];
  await check(
    "Every slide fits all eight requested viewport widths; mobile categories remain visible",
    async () => {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        for (let i = 0; i < 4; i++) {
          await page.locator('[data-hero-go="' + i + '"]').click();
          await page.waitForTimeout(80);
          const image = page.locator(
            "[data-hero-slide].is-active .hero-category-image",
          );
          const style = await image.evaluate((el) => ({
            border: getComputedStyle(el).borderTopWidth,
            radius: getComputedStyle(el).borderRadius,
            shadow: getComputedStyle(el).boxShadow,
          }));
          assert.deepEqual(style, {
            border: "0px",
            radius: "0px",
            shadow: "none",
          });
          const imageBox = await image.boundingBox();
          if (width <= 600) {
            const heroBox = await page.locator(".hero-carousel").boundingBox();
            assert.ok(
              Math.abs(heroBox.x) < 1 && Math.abs(heroBox.width - width) < 1,
              "Mobile carousel must be edge-to-edge",
            );
            assert.ok(
              Math.abs(imageBox.width - width) < 1,
              "Mobile image must be full viewport width",
            );
          }
          if (width >= 1024)
            assert.ok(
              imageBox.height >= 500,
              "Desktop hero images must be at least 500px high",
            );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
            "Overflow " + width + " slide " + i,
          );
        }
      }
    },
  );
  await check(
    "Premium collection gallery fits eight widths, loads the supplied artwork and supports keyboard focus",
    async () => {
      await page.locator(".category-section").scrollIntoViewIfNeeded();
      await page
        .locator(".collection-shortcuts img")
        .evaluateAll((images) => Promise.all(images.map((i) => i.decode())));
      const sources = await page
        .locator(".collection-shortcuts img")
        .evaluateAll((images) => images.map((i) => i.getAttribute("src")));
      assert.deepEqual(sources, [
        "/cc-assets/hero-iphone-collection.webp",
        "/cc-assets/hero-samsung-collection.webp",
        "/cc-assets/hero-laptop-collection.webp",
        "/cc-assets/hero-accessories-collection.webp",
      ]);
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        const cards = await page
          .locator(".collection-shortcuts .category")
          .evaluateAll((cards) =>
            cards.map((c) => ({
              x: Math.round(c.getBoundingClientRect().x),
              height: c.getBoundingClientRect().height,
              overflow: c.scrollWidth > c.clientWidth + 1,
              copyOverflow:
                c.querySelector(".category-copy").scrollWidth >
                c.querySelector(".category-copy").clientWidth + 1,
              imageFit: getComputedStyle(c.querySelector("img")).objectFit,
              imageBlend: getComputedStyle(c.querySelector("img")).mixBlendMode,
            })),
          );
        assert.equal(
          new Set(cards.map((c) => c.x)).size,
          width <= 900 ? 2 : 4,
          "Column count at " + width,
        );
        assert.ok(
          cards.every(
            (c) =>
              c.height >= 200 &&
              !c.overflow &&
              !c.copyOverflow &&
              c.imageFit === "contain" &&
              c.imageBlend === "normal",
          ),
          "Card layout at " + width,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
          "Gallery overflow " + width,
        );
      }
      await page.keyboard.press("Tab");
      await page.locator(".collection-shortcuts .category").first().focus();
      assert.equal(
        await page
          .locator(".collection-shortcuts .category")
          .first()
          .evaluate((e) => e.matches(":focus-visible")),
        true,
      );
      assert.equal(
        await page
          .locator(".collection-shortcuts .category")
          .first()
          .evaluate((e) => getComputedStyle(e).outlineWidth),
        "3px",
      );
      await page.locator(".category-view-all").click();
      await page.waitForURL("**/shop");
    },
  );
  await check(
    "iPhone, Samsung, laptop and accessories cards open truthful persistent category pages",
    async () => {
      const categories = [
        ["iPhone", "phones", "Apple"],
        ["Samsung", "phones", "Samsung"],
        ["Laptops", "laptops", null],
        ["Accessories", "accessories", null],
      ];
      for (let i = 0; i < categories.length; i++) {
        const [label, category, brand] = categories[i];
        await page.goto(base, { waitUntil: "networkidle" });
        await page.locator(".collection-shortcuts .category").nth(i).click();
        await page.waitForURL("**/shop?**");
        assert.equal(
          new URL(page.url()).searchParams.get("category"),
          category,
        );
        assert.equal(
          await page
            .locator('[name=category][value="' + category + '"]')
            .isChecked(),
          true,
        );
        if (brand)
          assert.equal(await page.locator("[name=brand]").inputValue(), brand);
        const count = await page.locator(".product-card").count();
        if (label === "iPhone") assert.ok(count > 0);
        else if (!count)
          assert.ok(
            (await page.locator(".empty-state").innerText()).includes(
              "no matching listings available right now",
            ),
          );
      }
    },
  );
  await check(
    "Navigation stays visible while scrolling at eight widths; anchors, WhatsApp and mobile menu work",
    async () => {
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(base, { waitUntil: "networkidle" });
        await page.evaluate(() =>
          window.scrollTo({ top: 1200, behavior: "instant" }),
        );
        const geometry = await page.locator(".site-header").evaluate((e) => {
          const r = e.getBoundingClientRect();
          return {
            top: r.top,
            width: r.width,
            bottom: r.bottom,
            position: getComputedStyle(e).position,
            onTop: e.contains(document.elementFromPoint(innerWidth / 2, 20)),
          };
        });
        assert.equal(geometry.position, "sticky");
        assert.ok(
          Math.abs(geometry.top) < 1 &&
            Math.abs(geometry.width - width) < 1 &&
            geometry.onTop,
          "Sticky header " + width,
        );
        assert.ok(
          await page
            .locator(".topbar")
            .evaluate((e) => e.getBoundingClientRect().bottom <= 0),
        );
        await page.evaluate(() => {
          location.hash = "shop-by-category-title";
        });
        await page.waitForTimeout(650);
        const target = await page
          .locator("#shop-by-category-title")
          .boundingBox();
        assert.ok(
          target.y >= geometry.bottom - 1,
          "Anchor hidden under navigation " + width,
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate(() =>
        window.scrollTo({ top: 1000, behavior: "instant" }),
      );
      assert.equal(await page.locator("#global-search-toggle").count(), 0);
      assert.equal(await page.locator(".site-header .account-link").count(), 0);
      assert.match(
        await page.locator(".header-whatsapp").getAttribute("href"),
        /^https:\/\/wa.me\/27685302223$/,
      );
      await page.locator("#global-menu-toggle").click();
      await page
        .locator('#global-menu a[href="/shop?category=accessories"]')
        .click();
      await page.waitForURL("**/shop?category=accessories");
      assert.match(await page.locator("h1").innerText(), /accessories/i);
      await page.goto(base, { waitUntil: "networkidle" });
    },
  );
  await check(
    "Mobile menu exposes laptops/accessories and touch swipes change hero slides",
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(base, { waitUntil: "networkidle" });
      await page.locator("[data-hero-pause]").click();
      await page.locator("#global-menu-toggle").click();
      assert.equal(
        await page
          .locator('#global-menu a[href="/shop?category=laptops"]')
          .isVisible(),
        true,
      );
      assert.equal(
        await page
          .locator('#global-menu a[href="/shop?category=accessories"]')
          .isVisible(),
        true,
      );
      await page.locator("#global-menu-toggle").click();
      const before = await active();
      await page.locator(".hero-slides").evaluate((surface) => {
        const start = new Event("touchstart");
        start.touches = [{ clientX: 280, clientY: 150 }];
        surface.dispatchEvent(start);
        const end = new Event("touchend");
        end.changedTouches = [{ clientX: 100, clientY: 150 }];
        surface.dispatchEvent(end);
      });
      assert.notEqual(await active(), before);
    },
  );
  await check(
    "Reduced-motion visitors are not automatically rotated and can navigate manually",
    async () => {
      const reduced = await browser.newContext({ reducedMotion: "reduce" }),
        p = await reduced.newPage();
      await p.goto(base, { waitUntil: "networkidle" });
      assert.equal(await p.locator("[data-hero-pause]").textContent(), "Play");
      const before = await p
        .locator("[data-hero-slide].is-active")
        .getAttribute("aria-label");
      await p.waitForTimeout(5800);
      assert.equal(
        await p
          .locator("[data-hero-slide].is-active")
          .getAttribute("aria-label"),
        before,
      );
      await p.locator("[data-hero-next]").click();
      assert.notEqual(
        await p
          .locator("[data-hero-slide].is-active")
          .getAttribute("aria-label"),
        before,
      );
      assert.equal(
        await p
          .locator(".collection-shortcuts .category")
          .first()
          .evaluate((e) => getComputedStyle(e).transitionDuration),
        "0s",
      );
      assert.equal(
        await p
          .locator(".collection-shortcuts img")
          .first()
          .evaluate((e) => getComputedStyle(e).transitionDuration),
        "0s",
      );
      await reduced.close();
    },
  );
  for (const [device, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    await page.setViewportSize(viewport);
    await page.goto(base, { waitUntil: "networkidle" });
    await page.locator("[data-hero-pause]").click();
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((i) => i.decode().catch(() => {}))),
      );
    await page.screenshot({
      path: "checks/categories-home-" + device + ".png",
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  const result = {
    passed: true,
    base,
    readOnly: true,
    widths,
    checks,
    javascriptErrors: errors,
  };
  await fs.writeFile(
    "checks/category-slideshow-results.json",
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  await page.screenshot({
    path: "checks/categories-failure.png",
    fullPage: true,
  });
  throw e;
} finally {
  await browser.close();
}
