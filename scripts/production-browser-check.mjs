import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = "https://cell-connecta.pages.dev";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [],
  csp = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (/Content Security Policy|Refused to/.test(m.text())) csp.push(m.text());
});
const phones = await (await page.request.get(base + "/api/phones")).json();
assert.equal(phones.length, 32);
const product = phones.find((p) => p.variants.length > 1) || phones[0];
async function painted() {
  await page
    .locator("img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => image.decode().catch(() => {}))),
    );
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 700) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(50);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(120);
  const broken = await page
    .locator("img")
    .evaluateAll((images) =>
      images.filter((i) => !i.complete || !i.naturalWidth).map((i) => i.src),
    );
  assert.deepEqual(broken, []);
}
const widths = [360, 390, 430, 768, 1024, 1366, 1440, 1920];
for (const width of widths) {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(base + "/shop", { waitUntil: "networkidle" });
  assert.equal(await page.locator(".product-card").count(), 12);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
    "Overflow at " + width,
  );
}
for (const [device, viewport] of Object.entries({
  desktop: { width: 1440, height: 1000 },
  mobile: { width: 390, height: 844 },
})) {
  await page.setViewportSize(viewport);
  for (const [name, path] of Object.entries({
    home: "/",
    shop: "/shop",
    product: "/phone/" + product.id,
  })) {
    const r = await page.goto(base + path, { waitUntil: "networkidle" });
    assert.equal(r.status(), 200);
    await painted();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({
      path: "checks/production-" + name + "-" + device + ".png",
      fullPage: true,
    });
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + "/phone/" + product.id, { waitUntil: "networkidle" });
await page.locator("#variant-select").selectOption(product.variants[1].id);
await page.getByRole("button", { name: "Add to bag", exact: true }).click();
await page.goto(base + "/cart", { waitUntil: "networkidle" });
await page.waitForFunction(
  () => !document.querySelector("#cart-summary")?.hidden,
);
assert.ok((await page.locator("#cart-subtotal").innerText()).includes("R"));
assert.deepEqual(errors, []);
assert.deepEqual(csp, []);
const results = {
  passed: true,
  environment: "Live production, non-order-creating browser checks only",
  url: base,
  widths,
  screenshots: 6,
  productVariantAndBagQuote: true,
  uncaughtJavascriptErrors: errors,
  cspViolations: csp,
  ownerPasswordLoginVerified: false,
  ordersCreated: 0,
  inventoryWrites: 0,
};
await fs.writeFile(
  "checks/production-browser-results.json",
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
await browser.close();
