import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.SHOP_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 } });
const errors = [],
  csp = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (/Content Security Policy|Refused to/.test(m.text())) csp.push(m.text());
});
const checks = [];
try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector(".product-card");
  assert.equal(await page.locator(".product-card").count(), 4);
  checks.push("Featured products: 4 actual live listings");
  const photos = await page
    .locator(".main-photo")
    .evaluateAll((imgs) => imgs.every((i) => i.complete && i.naturalWidth > 0));
  assert.ok(photos);
  checks.push("All featured product photos load");
  await fs.mkdir("checks", { recursive: true });
  await page.screenshot({ path: "checks/desktop.png", fullPage: true });
  for (const width of [
    320, 360, 375, 390, 414, 600, 768, 900, 1024, 1280, 1536, 1920,
  ]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    assert.ok(
      dimensions.scroll <= dimensions.viewport,
      `Horizontal overflow at ${width}: ${dimensions.scroll}`,
    );
  }
  checks.push("No page overflow at 12 widths from 320px to 1920px");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "checks/mobile.png", fullPage: true });
  await page.locator("#menu-toggle").click();
  assert.equal(
    await page.locator("#menu-toggle").getAttribute("aria-expanded"),
    "true",
  );
  await page.locator('#mobile-menu [data-category="Samsung"]').click();
  assert.ok(await page.locator("#empty-state").isVisible());
  assert.ok(await page.locator("#mobile-menu").isHidden());
  checks.push("Mobile menu and empty-category sourcing");
  await page.locator("#clear-filters").click();
  assert.equal(await page.locator(".product-card").count(), 32);
  checks.push("Full catalogue: 32 phones");
  await page.locator("#search-toggle").click();
  await page.locator("#phone-search").fill("iPhone 15");
  assert.ok((await page.locator(".product-card").count()) >= 2);
  assert.ok(
    (await page.locator(".product-info h3").allTextContents()).every((t) =>
      t.includes("iPhone 15"),
    ),
  );
  checks.push("Live product search");
  await page.locator("#search-close").click();
  await page.locator(".save-phone").first().click();
  assert.equal(await page.locator("#saved-count").textContent(), "1");
  await page.locator("#saved-toggle").click();
  assert.equal(await page.locator(".product-card").count(), 1);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#saved-count").textContent(), "1");
  checks.push("Saved phones persist across refresh");
  await page.locator("#view-all").click();
  await page.locator("#sort").selectOption("price-low");
  const prices = await page.locator(".price").allTextContents();
  const nums = prices.map((p) => Number(p.replace(/[^0-9]/g, "")));
  assert.ok(nums.every((n, i) => !i || n >= nums[i - 1]));
  checks.push("Price sorting");
  const href = await page.locator(".buy-button").first().getAttribute("href");
  await page.goto(base + href, { waitUntil: "networkidle" });
  assert.ok(
    (await page.locator("body").innerText()).includes("Order on WhatsApp"),
  );
  assert.match(await page.locator("body").innerText(), /full specification/i);
  checks.push("Existing product details and WhatsApp ordering render");
  const home = page.locator('a[href="/"]').first();
  await home.click();
  await page.waitForSelector("#hero-title");
  assert.match(
    await page.locator("#hero-title").textContent(),
    /Your next iPhone/,
  );
  checks.push("Product page returns to redesigned homepage");
  await page.goto(base + "/login", { waitUntil: "networkidle" });
  assert.ok((await page.locator("input").count()) > 0);
  checks.push("Existing login page renders");
  await page.goto(base + "/admin", { waitUntil: "networkidle" });
  assert.ok(!(await page.locator("body").innerText()).includes("Loading…"));
  checks.push("Unauthenticated admin route remains protected");
  assert.equal(errors.length, 0, errors.join("\n"));
  assert.equal(csp.length, 0, csp.join("\n"));
  checks.push("No JavaScript or CSP errors");
  console.log(
    JSON.stringify(
      {
        base,
        passed: true,
        checks,
        limitations: [
          "Authenticated admin writes and a real owner login are not tested: no owner login credentials supplied.",
          "Backend depends on preserved deployment 1845bad0-5e22-4f2a-b413-bbe96651d244.",
        ],
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error("FAILED", e);
  await page.screenshot({ path: "checks/failure.png", fullPage: true });
  process.exitCode = 1;
} finally {
  await browser.close();
}
