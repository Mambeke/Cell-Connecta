# Cell Connecta — historical pre-release audit

> **HISTORICAL EVIDENCE ONLY:** Read AGENTS.md, HANDOVER.md and PROJECT-STATE.json for current source, setup, deployment and migration state. Do not follow old local-only/quota/missing-source statements as present blockers.

> **LIVE RELEASE UPDATE — 3 November 2026:** Premium deployment `ce8ff92c-e87a-49a7-8216-45c352c00360` is live at https://cell-connecta.pages.dev. The additive migration is applied to the original production DB. Existing inventory/account/session records were compared with the private full backup and preserved. All 26 pre-release hash/branch URLs were verified behind Access, and the new production hash is protected too. Product editing is unlocked with `LEGACY_CATALOGUE_PROTECTED=true`. Remote staging passed 19 workflows at all eight widths; production public/security smoke checks passed. Real-owner password login and external email/payment integrations remain unverified/unconfigured. Earlier local-only statements below are historical, superseded by this release update. See DEPLOYMENT-REPORT.md.

**2 November 2026 · LOCAL IMPLEMENTATION / NOT A LIVE RELEASE**

## Executive result

The premium storefront and owner workflows have been implemented on the existing Pages/D1 architecture and exercised against an isolated local database. **Production has not been migrated or redeployed.** This honours the decision to build/test locally after Cloudflare D1's daily read quota was exhausted.

The live address remains **https://cell-connecta.pages.dev**, deployment `9fd3e213-2d80-4643-bb16-5a6b588ffe2a`. Original products, IDs, images, accounts, bindings and deployment secrets have not been replaced. The upgrade is not described as production-ready: staging verification, real-owner authentication, legacy-route protection and configured external services remain release gates.

## 1. Original system and preservation

The audited system used Cloudflare Pages, a vanilla editable homepage, a retained compiled React/Vite application, and a compatibility Worker proxying backend operations to an immutable older deployment. Original backend source was unavailable; the new implementation does not require its recovery.

The existing D1 database `cellconnecta` contained six application tables: `phones`, `variants`, `photo_blobs`, `users`, `sessions`, `email_codes`. Audit counts were 32 products, 47 variants, one verified owner, 35 legacy sessions, no email codes and 131 stored image BLOBs. Public catalogue fixtures used the 83 publicly referenced photos. Prices are stored in rand, not cents. Passwords use the existing PBKDF2 encoding.

Before substantial edits, a source ZIP, schema/private-record snapshot and GitHub checkpoint branch `upgrade/premium-store-20261102` were created from `bf57e7973a17b12047252d5afbcb20d6ea204651`. Private authentication records are excluded from deliverables. A fresh full production export is still required before rollout; the restricted snapshot is not a full image-BLOB backup.

The premium implementation is saved locally and supplied as a source archive. It has **not** been pushed to GitHub. The remote branch is the pre-upgrade checkpoint, not the new implementation.

## 2. Implemented and locally verified

| Area | Result |
|---|---|
| Shared responsive storefront | Branded header/footer, navigation/search, premium homepage, real featured inventory, category/brand/deal routes and honest empty states. |
| Shop | Search and combined brand/category/price/storage/colour/condition/availability/deal filters; sorting and 12-item pagination. Price/storage/availability filters resolve to the same variant. |
| Product | Actual gallery/zoom/thumbnails, variant selection, recorded condition and verified specifications, stock/price updates, relevant policies and related products. |
| Owner security | Existing PBKDF2 hash compatibility, verified-owner role plus server allowlist, hashed expiring HttpOnly/Secure sessions, CSRF/origin checks and login rate limits. Ordinary accounts and forged sessions are denied. |
| Owner catalogue | DB-backed add/edit, draft/publish/unpublish/archive, image upload/reorder/remove, featured curation and persistent mobile forms. Archival retains records and IDs. |
| Stock | Add/remove/set, reason/actor history, version checks, negative-stock rejection and atomic guarded writes. |
| Cart | Persistent variant-ID/quantity bag; fresh server price/stock validation; authoritative quote totals and line prices. |
| Orders | Private unpaid request receipt, idempotent creation, owner confirmation/fulfilment/cancellation, atomic allocation and once-only restock. Concurrent confirmations cannot oversell in local tests. |
| Content | DB-backed promotion enable/disable/update, contact/policy settings and CSV export. |
| SEO/accessibility/performance | SSR titles/descriptions/canonicals, real product structured data, robots/sitemap, private-page noindex, labelled forms, keyboard controls/dialogs, image dimensions/lazy loading, local fonts and small browser modules. No invented review markup. |

Visual refinements include consistent prices/spacing, mobile filter/navigation behaviour, responsive owner tables/dialogs and removing the mobile floating contact bubble so it cannot obscure product controls. Direct WhatsApp/contact links remain available.

## 3. Routes and data changes

Public pages: `/`, `/shop`, `/phone/:id`, `/cart`, `/checkout`, `/order/:id#token`, `/login`, `/forgot`, `/policies/{delivery,warranty,returns,privacy,terms}`, `/robots.txt`, `/sitemap.xml`. `/product/:id` redirects to the canonical phone route. `/admin` requires an authenticated allowlisted owner.

Public APIs cover catalogue/products/photos, cart validation and unpaid order requests; receipts require the private token. `/api/admin/*` protects inventory, uploads, stock/history, orders, export and settings on the server. `/api/payments/session` explicitly returns 503 while no gateway is configured.

`migrations/0001_premium_store.sql` adds `cc_product_details`, `cc_settings`, `cc_sessions`, `cc_rate_limits`, `cc_inventory_movements`, `cc_orders`, `cc_order_items`, `cc_transaction_guards` and `cc_recovery_codes`. Original tables are neither dropped nor emptied. Metadata seeds current original listings as published; original prices/IDs/photos/account hashes remain in place. **Migration applied locally only.** New order price snapshots use integer cents.

## 4. Security and consistency

Privileged mutations require both a real server session and CSRF/origin validation. SQL is parameterized. Uploaded JPEG/PNG/WebP signatures and declared types are checked, SVG is rejected and upload size is capped at 1.5 MB. Stored HTML and JSON-script content are escaped. Private HTML/API responses are not publicly cached; public photo responses use stable image caching.

Failed guarded transactions roll back and show errors rather than success. Stale product/stock writes are rejected. Browser storage never establishes authoritative stock, prices or paid status. Request creation does not reserve stock or charge money; confirmation allocates only if quantities remain sufficient.

**Additional production privacy safeguard:** older immutable deployment URLs predate draft/archive metadata and may bypass the new application's visibility rules. The new production backend therefore blocks product/image/archive changes until those old public paths are protected or safely retired and `LEGACY_CATALOGUE_PROTECTED=true` is deliberately set. Unit/integration tests check that lock even with an authenticated owner. No older deployment was deleted, and the flag is not currently claimed to be enabled in production.

## 5. Verification evidence

- **19 local browser/API workflow groups passed**, including owner CRUD persistence, upload/draft privacy, mobile editing, stock, archive confirmation, CMS updates, failure rollback, concurrent order allocation, cancellation, unauthorised access and session/logout limits.
- Rendered layout/overflow checks at **360, 390, 430, 768, 1024, 1366, 1440 and 1920px**.
- **13/13 unit/integration checks passed**, including production editing/privacy gates and production-versus-preview security headers.
- Nine source modules passed syntax validation; formatting checks and production bundling passed.
- No uncaught browser JavaScript exceptions or CSP violations during E2E.
- Eight actual local screenshots cover homepage, shop, product and authenticated owner dashboard at desktop/mobile sizes.

Development tests caught and led to fixes for false model matches from internal SKUs, a swallowed first admin action after filtering, inconsistent rand formatting and below-fold screenshot painting. The final rerun passed after those fixes.

Machine-readable evidence: `checks/premium-test-results.json`. Exact commands, fixture safety and coverage limitations are in `TESTING.md`. This is Chromium automation, not a physical-device/Safari/screen-reader/Lighthouse or independent penetration-test certification. The JavaScript project has syntax/format checks rather than a TypeScript typecheck.

## 6. Blocked, unconfigured or deliberately not included

1. **Remote rollout:** D1 daily quota blocked staging seeding. No premium production deployment/migration or actual-owner login has been verified. Existing live deployment remains unchanged.
2. **Old deployment exposure:** legacy catalogue/image paths require protection or reviewed retirement before production catalogue editing can unlock. This is a release gate, not silently marked complete.
3. **Recovery email:** a native server integration is implemented, but an approved `RESEND_FROM_EMAIL` and verified sender/API-key delivery are required. Without configuration the UI explains the limitation and the API fails clearly. Live send/reset is unverified; existing credentials are preserved.
4. **Online payments:** no gateway credentials, webhook, refund flow or paid-state transition is enabled. Customers submit unpaid requests and arrange payment with the shop. No browser success is treated as proof of payment.
5. **Order email/carrier service:** no transactional order email or live shipping-rate/tracking integration is connected. Cape Town delivery is free; outside areas are quoted before confirmation.
6. **Bulk import:** CSV export exists; bulk CSV import is not included.

Verified policy defaults are six-month certified refurbished warranty, two-month pre-owned warranty, three-day returns and free Cape Town delivery. No fabricated inventory, ratings, delivery promises or payment-provider badges were added.

## 7. Exact owner workflow after deployment

1. Sign in at `/login` with the **existing verified owner email/password**; open `/admin`. The local preview uses fake accounts and will not recognise the actual owner's password.
2. **Inventory → + Add product**: enter true brand/model/SKU/condition, description and verified specs; add storage variants with rand prices/real quantities; upload photos; save as Draft, then Published when ready. Tick Featured to curate the homepage.
3. **Edit** changes real persisted fields; choose Draft to unpublish. Refresh and inspect the public listing. Stale-write errors mean another session changed it: reload before retrying.
4. **Stock**: choose variant, Add/Remove/Set, quantity and reason; save and review Stock history.
5. **Archive**: confirm the prompt; the listing leaves the new public catalogue without deleting its record. Use the Archived filter and Edit to restore it later.
6. **Orders → View order**: contact the customer; Confirm allocates stock, Fulfil follows actual fulfilment, Cancel reverses allocation once. These controls do not collect payment.
7. **Store content** updates the promotion/contact/policy text. Sign out when finished.

Full click-by-click instructions and error behaviour are in `OWNER-GUIDE.md`. A locked production editor means the legacy-route deployment safeguard still needs to be completed, not that a new owner account should be created.

## 8. Next controlled step

When quota and authorisation permit, take a fresh full backup, seed a separate staging clone, apply the additive migration there, secure old public deployment routes, verify real-owner authentication and recovery configuration, and then perform a reviewed production cutover with recorded tests/rollback. Do not import QA data or run destructive/race tests against customer production data. `DEPLOYMENT.md` contains the binding IDs, gates, migration command and rollback cautions.

**Bottom line: the implementation and substantial local QA are delivered; the production rollout and external-service sign-off remain explicitly incomplete.**
