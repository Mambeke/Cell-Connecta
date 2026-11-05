# Current verification and safe test procedure

Updated 3 November 2026. Read HANDOVER.md / PROJECT-STATE.json for the latest production release. Older audit reports retain historical results, not current blockers.

## Latest checks

Landing-page brand section is intentionally absent; unit and read-only homepage tests verify its removal while retaining category gallery/featured phones.

- Node 22+; `npm run check`: 15 runtime/utility JavaScript modules syntax checked (including release helper).
- `npm run format:check`: server/Worker/browser/test/utility code formatting.
- `npm test`: 36 units/integration checks, including release-helper rejection of protected source destinations and missing output arguments.
- `npm run build`: standalone Worker and browser bundles; no deploy/migration.
- `node tests/categories.mjs`: eleven read-only browser workflow groups for local QA.
- `node tests/catalogue.mjs`: eleven read-only catalogue groups pass locally and on LIVE production. Covers dynamic/grouped headings, dependent model/storage choices, selected-variant links, same-variant API composition, mobile Apply, eight widths/sticky offset, no-JS/resize behavior, search/sort/prices/stock/deals/pagination and compact geometry (intro absent; controls directly below nav).
- All **22 read-only groups (11 existing + 11 catalogue)** pass on LIVE deployment `2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f` at all eight widths with zero uncaught JavaScript errors. Full catalogue/configuration unchanged; browser assets match, hash Access302 and admin401. See checks/remove-home-brand-release-verification.json.

## Run locally or on production safely

Start local `npm run dev` as a background process at 0.0.0.0:3000. It uses isolated local D1/fake owner. Restore Playwright Chromium if caches disappeared. Node/dependency recovery is in HANDOVER.md.

```bash
npm run check
npm run format:check
npm test
npm run build
node tests/categories.mjs
node tests/catalogue.mjs
SHOP_URL=https://cell-connecta.pages.dev node tests/categories.mjs
SHOP_URL=https://cell-connecta.pages.dev node tests/catalogue.mjs
```

`tests/categories.mjs` is explicitly read-only. It covers:
- Four truthful categories even with empty stock; exact supplied hero/gallery imagery and correct category links.
- Automatic rotation, pause/play, arrows/dots, inert inactive slides, touch swipe and reduced-motion handling.
- Samsung/laptop/accessories dark theme, return to iPhone light theme; working shop/all-products/laptop-only-deals CTAs.
- Eight widths: 360,390,430,768,1024,1366,1440,1920; no horizontal overflow, unboxed large desktop/full-width mobile hero areas.
- Fancy gallery: four/two columns, loaded contained normal-blend images, no card/caption overflow, focus outline and View all products link; motion disabled when requested.
- Sticky white main navigation at every width; delivery strip scrolls away; anchors stay below header; WhatsApp/cart and mobile menu remain accessible. Header account/global-search removed intentionally; catalogue search retained. Footer admin gateway still enforces login; phone sourcing sits below pagination. No floating WhatsApp remains; stronger green navbar icon, footer notice removal, Others browse/empty group and truthful checkout semantics verified.

Results: checks/category-slideshow-results.json; full-home captures: checks/categories-home-{desktop,mobile}.png; current combined release record: checks/hero-release-results.json. Historical initial-launch screenshots/JSON are not proof every authenticated flow was rerun in production.

## Mutating QA suite — never production

`tests/e2e.mjs` and `tests/staging.mjs` exercise writes, fake accounts, uploaded drafts, CMS changes, concurrent stock/order confirmation/cancellation and rollback/rate-limit behavior. Keep their mutation guards. Use isolated local or explicitly configured staging D1 with public catalogue/photo fixtures and fake owner/ordinary accounts; never real production owners/customer secrets. `npm run seed:local` resets LOCAL QA only, not production, and is unnecessary when the existing local state is already populated.

Initial premium QA passed 19 workflow groups locally and on remote staging, including same-variant filters, authoritative prices/stock, PBKDF2 compatibility, owner allowlist, ordinary-account denial, sessions/CSRF/origin validation, image upload restrictions, publication/privacy, inventory edits, stale/invalid-write rollback, concurrent confirmation/oversell prevention, once-only cancellation restock and unconfigured-integration error handling. A modal refresh race found in staging was fixed by awaiting inventory reload before closing the editor. These are retained historical evidence; do not rerun them on live production or claim actual owner login was verified.

## Production preservation/security checks

Before and after frontend release, compare full GET /api/phones and Pages deployment configurations exactly. Verify canonical site publicly reachable, new hash redirects to Access, unauthenticated admin API returns 401, asset bytes match the prepared upload, and no migration/DB mutation was performed. Configuration snapshots and real auth/database exports are private, never public/archive inputs.

These checks are Chromium-rendered workflow/geometry tests, not a formal static-security audit, TypeScript typecheck, Lighthouse score, screen-reader audit, physical mobile test or Safari certification. Report failures/remaining limitations instead of hiding them.
