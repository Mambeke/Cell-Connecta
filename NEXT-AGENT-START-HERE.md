# Cell Connecta — handover to the next agent

**Prepared: 5 November 2026. This is the current starting point.**

## 1. Start here — do not rebuild the shop

**Important transfer correction:** the current verified ZIP is `/home/user/Cell-Connecta-Export-20261105/Cell-Connecta-Premium-Source.zip`, with matching `.sha256` and `Cell-Connecta-Premium-Source-Verification.json` alongside it. Read SOURCE-EXPORT-README.md. Reject the old 21,965,019-byte/118-entry archive: it was stale. Download and upload the actual ZIP, not just this Markdown.

You are continuing an existing, deployed application. The owner is changing agents because the conversation is long, **not asking for a new shop**.

- Live website: https://cell-connecta.pages.dev/
- Catalogue: https://cell-connecta.pages.dev/shop
- Active editable source in this workspace: `/home/user/shop`
- Current production release, confirmed by a read-only Cloudflare project GET on 5 November: **`2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f`**.
- Previous release retained: `a0583bcd-3209-40b9-8164-0b2eeeeb175c`.
- **Latest feature request is completed:** “Shop by brand” was removed from the landing page and published. Category gallery, featured phones and catalogue brand/model/storage filters remain.
- **Current user request is this handover only. Do not deploy new changes without a new task.**

Read these files, in order:
1. `NEXT-AGENT-START-HERE.md` — this document.
2. `AGENTS.md` — preservation/security and work agreements.
3. `HANDOVER.md` — operational detail, setup, source map, deployment and rollback.
4. `PROJECT-STATE.json` — release IDs, evidence, completed work and limitations.

**The backend source already exists in `server/`. Do not ask the owner to recover/export the old backend.** Do not replace current files with the old repository, unrelated top-level `index.html`, old compatibility Worker or an older ZIP. The original Arena source directory had no `.git`. This repository checkout now contains the premium source; commits before the premium import are historical.

## 2. What the current site should look like

### Landing page
- Four accessible category hero slides: iPhone, Samsung, laptops and accessories.
- Owner-supplied collection artwork: iPhones on stone; neon Samsung, laptop and accessories scenes. Keep these assets and their current compositions.
- Large unboxed desktop imagery and edge-to-edge mobile hero areas.
- Automatic slideshow, pause/arrows/dots, touch swipe, inert inactive slides and reduced-motion handling.
- Premium **Shop by category** gallery and **Featured phones** remain.
- **Shop by brand is removed. Do not bring it back.**

### Shared header/footer
- Main white navigation stays visible while scrolling; delivery strip scrolls away.
- Header account icon and global search icon/panel are removed.
- **Solid green WhatsApp icon immediately before the cart**, plus mobile menu on small screens.
- **No floating WhatsApp button anywhere.** Contextual sourcing/support links may remain.
- Footer **Owner admin** links to `/admin`. A signed-out visitor is redirected to `/login`; server authentication is not bypassed.
- Footer sentence “Online payment is not yet enabled” is removed. This was a copy change, **not payment integration**. Keep truthful unpaid/order-request disclosures where needed in checkout.

### Shop/catalogue
- Entire large intro card, breadcrumbs, collection kicker, visible big title and introductory paragraph are removed. Sidebar/search begin directly below navigation.
- Category name remains as a screen-reader-only H1; multi-category group headings are visible.
- Premium navy/blue desktop sidebar, category icons, softly graduated backgrounds, refined search/results controls and product cards.
- Category checkboxes: **Phones / Laptops / Accessories / Others**, with actual catalogue counts.
- Brand → exact Model → Storage choices scoped to actual inventory. Apple is labelled “Apple / iPhone”. Changing a parent clears dependent selections.
- Search, sort, price, condition, colour, in-stock/deal filters, removable chips and native GET/no-JavaScript forms.
- Multiple categories have separate blue-divided result sections and independent pagination.
- Selected storage/variant follows the customer into product detail via `?variant=…`; unknown or foreign IDs safely fall back.
- Mobile expandable filters: select options, then Apply. Desktop select/checkbox changes submit automatically.
- Below phone page numbers: premium **“Can’t find the phone you’re looking for?”** section. WhatsApp message asks for model, storage and budget.
- No invented reviews/star scores/review counts were added. Leave current ratings/data unchanged unless a new, well-defined request is made.

## 3. Important limitations — do not overclaim

1. **Others is browse/UI only.** It has a checkbox, count, heading, grouped section and honest empty state. D1 `cc_product_details.category` still has a CHECK permitting only `phones`, `laptops`, `accessories`. Assigning inventory to Others requires a separately reviewed additive authoring/schema extension. Do not just relax server validation and trigger database errors.
2. Current catalogue is **32 real published product records**; the last known full inventory has 47 variants. Other categories can genuinely be empty. Do not invent stock or auto-populate the new category.
3. Actual production-owner password/sign-in was not independently verified by the assistant. The signed-out gateway redirect and unauthenticated admin denial were verified. Do not reset the owner's account as a shortcut.
4. Payment provider/webhook, recovery-email delivery, transactional order email and carrier integrations are not established by the visual work. Keep manual/unpaid order-request semantics; never mark paid from a browser success page.
5. Earlier owner direction included direct iPhone/Samsung/Laptops/Accessories/Others category controls and laptop-brand filters. Current implementation uses Phones plus Brand/Model/Storage; it is **not** a separate first-level iPhone/Samsung tab system. Later “for now” instructions narrowed the implemented work. Do not claim those earlier tab ideas were delivered or start them unasked.
6. The owner has discussed selling the design as a template and using AI-generated images. Do not interpret that as permission to delete/rebuild the existing catalogue or customer database. The current published site and data must be preserved.

## 4. Preservation rules

- Existing project, URL, production D1, accounts, customer/order records, product and variant IDs, prices, stock, images and functioning backend must remain intact.
- Migration `0001_premium_store.sql` **is already applied to production**. Never reseed/reset/reapply the baseline remotely. Inspect actual schema before any approved additive migration.
- Checkpoint substantive changes. Most browse/style changes require **no DB writes or config patches**.
- Preserve all existing secrets/bindings, compatibility settings, `OWNER_EMAILS`, `RESEND_API_KEY`, and `LEGACY_CATALOGUE_PROTECTED=true`.
- Keep canonical website public and old/hash deployments protected by Cloudflare Access. No unrelated project/DNS/billing changes or deleting deployment history.
- Server authorization, sessions, CSRF, validation, parameterized SQL, upload restrictions, rate limits and authoritative DB pricing/stock must remain.
- Production checks must be read-only. Never run fake orders, oversell tests, inventory mutations or QA owner creation against production.
- Do not fabricate discounts, availability, specifications, reviews, service claims or payment/shipping integration.

Verified business details: WhatsApp **27685302223**; certified-refurbished warranty **6 months**; preowned **2 months**; returns **3 days**; free Cape Town delivery; outside areas quoted. Do not generalize phone warranty to every accessory/laptop.

## 5. Source map

| Path | Purpose |
|---|---|
| `public/_worker.js` | Thin route entry; production upload must use bundled standalone Worker. |
| `server/render.js` | SSR header/footer, landing page, shop, product, owner/admin and other pages. |
| `server/data.js` | Catalogue access, exact/composed/same-variant filtering, validation and persistence. |
| `server/core.js` | Auth/session/security/origin/validation helpers. |
| `server/api.js`, `server/orders.js`, `server/recovery.js` | API, authoritative stock/order flows, recovery. |
| `public/cc-assets/store.css` | Complete active styles including all supplied-artwork/gallery/sticky/compact shop changes. |
| `public/cc-assets/store.js` | Browser interactions, catalogue facets, slideshow, cart, product variants. Exports used by admin must be retained. |
| `public/cc-assets/admin.js` | Owner dashboard client; all privileged writes checked server-side. |
| `tests/unit.test.mjs` | 36 unit/integration tests. |
| `tests/categories.mjs` | 11 read-only hero/gallery/navigation/homepage browser groups. |
| `tests/catalogue.mjs` | 11 read-only catalogue/header/footer/sourcing/Others browser groups. |
| `tests/e2e.mjs`, `tests/staging.mjs` | Mutating QA suites — isolated QA only. |
| `scripts/build.mjs`, `scripts/prepare-release.mjs` | Build and safe fresh standalone artifact preparation; neither deploys/migrates. |
| `scripts/package-catalogue-delivery.py` | Current allowlisted/secret-scanned source/report packager; review report metadata for future releases. |
| `checks/` | Evidence, with environment/release/date labels. Historical records are not current blockers. |

### Workspace recovery issue fixed for this handover

On 5 November the restored workspace had stale CSS/browser JS and two missing artwork files even though newer server source and notes were present. **Recovered current canonical public CSS, complete browser module and laptop/accessories artwork before packaging.** The recovered browser JS is readable bundled ESM with its required exports, not the stale pre-sidebar script. No production write or deployment was made for this recovery.

Do not ignore this risk: after any new snapshot/extraction, confirm `initShopSidebar`, `.compact-catalogue`, current header/footer markup and all four `hero-*-collection.webp` assets exist before rebuilding. Use the refreshed ZIP, not an older archive. Recovery evidence: `checks/agent-handover-recovery.json`.

## 6. Tooling and verification

Use Node 22+. Dependencies, generated build directories, browser libraries/caches and background processes may not persist.

```bash
cd /home/user/shop                 # or the extracted project root
npm ci
# If system Node is older:
npm install --no-save node@22
export PATH="$PWD/node_modules/.bin:$PATH"
npx playwright install --with-deps chromium
npm run check
npm run format:check
npm test
npm run build
```

Run `npm run dev` using the platform's background-process tool, listening on **0.0.0.0:3000**. It binds isolated LOCAL D1 and a fake QA owner. Do not start long-lived servers with a one-shot shell command. Do not seed an already populated local database unnecessarily.

```bash
node tests/categories.mjs
node tests/catalogue.mjs
# These two scripts are read-only and safe on canonical production:
SHOP_URL=https://cell-connecta.pages.dev node tests/categories.mjs
SHOP_URL=https://cell-connecta.pages.dev node tests/catalogue.mjs
```

At the last feature release, **36 units, 15-module syntax, format/build and 22 local/LIVE read-only groups passed**, with zero uncaught JS errors at 360/390/430/768/1024/1366/1440/1920px. Full 32-product catalogue/config unchanged, asset hashes match; canonical200/hash Access302/admin API401/owner gateway302→login. This is Chromium workflow/geometry evidence, not physical-device/Safari/screen-reader certification.

The broad mutation suites historically passed 19 groups on isolated QA; they were **not rerun for the latest visual releases**. Preserve their production guards and QA-password requirements.

## 7. Deployment and credentials

- Account: `01a943752f1069b93df5b328ce954d0f`
- Project: `cell-connecta`; branch: `main`
- Production D1: `4404a83f-be39-4cc3-afc6-f4bc421b4987`, name `cellconnecta`, binding `DB`
- Separate QA/staging: `4aec972c-3587-4859-98b6-e43bec209e0f`

Owner wants controlled automatic publishing after testing, not manual upload instructions. Always confirm actual current project metadata first, save restricted before/after configuration snapshots and full catalogue, and compare them.

```bash
npm run build
npm run prepare:release -- /absolute/path/to/NEW-upload-directory
# From that fresh upload cwd, using authorized credentials only in child environment:
/path/to/shop/node_modules/.bin/wrangler pages deploy public \
  --project-name=cell-connecta --branch=main --commit-dirty=true
```

Deploy **only the prepared public child** from the fresh no-config upload directory. Do not blindly run old deploy scripts from the source root or upload the importing Worker without its server bundle. Verify canonical release, both read-only suites, exact catalogue/configuration, public asset hashes, canonical public response, protected hash and admin denial. Refresh handover/state/package afterward.

**Credential continuity matters to this owner:** do not demand a newly created token for every change. Reuse existing valid authorized access when securely available. If the token is not available in the new agent context, ask to reuse the existing valid token rather than automatically demanding creation of another. Replacement is required only if revoked/expired/insufficient. Tokens are deliberately **not included** in this document, project or ZIP. Do not hunt unrelated credential paths. No durable encrypted CI/deployment credential setup was installed; do not claim one exists or promise never to need access again.

Rollback uses a retained known-good premium artifact/release and the current database. Do not restore an old whole DB over newer orders or blindly revert to the old compatibility proxy.

## 8. Files to transfer to a new agent/workspace

1. **`Cell-Connecta-Premium-Source.zip`** — complete current project, assets, fixtures, tests, guides and successful evidence; extract before editing.
2. **`Cell-Connecta-Next-Agent-Handover.md`** — standalone copy of this document.
3. **`Cell-Connecta-Premium-Source.sha256`** — verify ZIP integrity.

The ZIP excludes tokens, private project snapshots, customer/auth exports, local databases, dependencies and build caches. The regular editable source is the handover—not conversation memory alone. Private checkpoints under `/home/user/upgrade-backup/` are not upload inputs and must not be shared publicly.

**Next action: read the source and wait for the owner's next requested change. Do not rebuild, republish, reintroduce removed sections or ask for the missing original backend.**
