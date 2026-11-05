# Premium All Products catalogue — live release

**3 November 2026 · LIVE VERIFIED.** Release `85bbb919-bdce-456a-8ba3-00a0085eeaaf` at https://cell-connecta.pages.dev/shop. Previous `527a235b-90a3-4d8a-ba03-fbf93e6b5c6b` retained.

## Requested experience

- Current premium brand styling, not an unrelated new theme.
- All products heading becomes Phones, Laptops or Accessories when that category is selected.
- Select multiple categories to see separately titled sections, divided by blue horizontal rules. Each section has its own pagination.
- Laptop/desktop sidebar stays below the sticky main navigation. It has category checkboxes and real catalogue counts, Brand → Model → Storage, condition, colour, price, stock and genuine-deal controls.
- Apple is labelled Apple / iPhone. Models and storage choices come from actual parent-scoped listings, not invented options. Changing a category or brand clears dependent model/storage selections.
- Mobile has expandable filters with batch selections and Apply. Search and sorting remain accessible above the products.
- Selected filter chips can be removed individually; reset clears the selection.
- A filtered product card's selected variant is retained when opening its product detail page, including storage/price/stock. Unknown/foreign variant IDs safely fall back to the product's existing default.
- Native GET forms work without JavaScript. Existing URL category destinations remain valid.

## Verification performed on current source and LIVE production

| Check | Result |
| --- | --- |
| Unit/integration tests | 29 / 29 pass |
| Runtime/utility source syntax | 15 modules pass |
| Formatting and production bundle | Pass |
| Existing hero/gallery/sticky-navigation read-only browser groups | 11 pass locally and live |
| New catalogue read-only browser groups | 8 pass locally and live |
| Rendered widths | 360, 390, 430, 768, 1024, 1366, 1440, 1920px |
| Uncaught JavaScript errors | 0 |
| Horizontal overflow / sticky overlap | None found at tested widths |
| Exact model and same-variant storage/price/stock/deals composition | Pass |
| Independent populated category pagination | Synthetic unit fixture pass |
| Actual empty category sections | Real catalogue browser pass |
| No-JS form / viewport resizing | Pass |
| Full production catalogue compared to checkpoint | Unchanged: 32 products |
| Production writes / migrations / config changes | None |
| Standalone release artifact | Prepared: 38 files; SHA-256 manifest outside public |
| Live sidebar verification | All 19 read-only groups pass; assets match; canonical200/hash Access302/admin401 |

`tests/catalogue.mjs` and `tests/categories.mjs` are public GET/navigation tests. Both suites now pass on the new canonical LIVE release. No owner/customer credentials or destructive reseeding were needed for local verification.

## Files and evidence

- `server/render.js`: premium sidebar, heading, scoped facets, grouped catalogue and selected-variant cards/detail page.
- `server/data.js`: repeated category/brand/model/colour/condition composition; original same-variant filtering preserved.
- `public/_worker.js`: shop metadata title follows selected categories; optional product variant selection.
- `public/cc-assets/store.js`: progressive dependent filters, desktop auto-submit, mobile Apply, observed header offset.
- `public/cc-assets/store.css`: complete existing live hero/gallery/sticky stylesheet plus scoped catalogue styles.
- `tests/unit.test.mjs`: 29 tests including new multi-category, model, grouped pagination, escaping, facets and variant-link checks.
- `tests/categories.mjs`: existing regression suite updated for intentional category checkbox semantics.
- `tests/catalogue.mjs`: eight new read-only browser workflow groups.
- `checks/catalogue-results.json`, `checks/catalogue-local-release.json`, `checks/catalogue-{1440,390}.png`, `checks/catalogue-grouped-desktop.png`: current LIVE browser evidence; local-release.json remains historical prepublication evidence.
- Private checkpoint/upload: `/home/user/upgrade-backup/catalogue-sidebar-20261103/`. Never distribute private project-config snapshots.

During regression checks, two missing artwork files and an older local stylesheet were recovered from the previous delivered archive and the canonical live public CSS. Current hero/gallery/sticky regression checks all pass; preserve the complete stylesheet, not the stale Samsung-only version.

## Completed controlled publication

Published the standalone 38-file release to the existing project/main branch as `85bbb919-bdce-456a-8ba3-00a0085eeaaf`. Exact production/preview configuration, branch and domains match restricted prepublish snapshots. The complete 32-product catalogue is identical; browser assets and preserved artwork match upload hashes. Canonical shop200, new hash Access302 and unauthenticated admin401 verified. Both read-only browser suites pass LIVE (19 groups, eight widths, zero JS errors). No production data/config writes or migration.

Source, state, handover, report and portable package refreshed. For future access, reuse an existing valid token rather than creating a new token for each change. No durable encrypted CI credential setup has been installed; never claim it has.

Real-owner login, payments, recovery-email delivery and physical-device/Safari certification remain separate, unverified work. No stock, service or payment claims were invented. Existing 6-month certified-refurbished / 2-month preowned warranty, 3-day returns and Cape Town delivery policies are unchanged.
