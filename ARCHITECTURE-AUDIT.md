# Cell Connecta architecture audit — 2 November 2026

> **HISTORICAL EVIDENCE ONLY:** Read AGENTS.md, HANDOVER.md and PROJECT-STATE.json for current source, setup, deployment and migration state. Do not follow old local-only/quota/missing-source statements as present blockers.

> **LIVE RELEASE UPDATE — 3 November 2026:** Premium deployment `ce8ff92c-e87a-49a7-8216-45c352c00360` is live at https://cell-connecta.pages.dev. The additive migration is applied to the original production DB. Existing inventory/account/session records were compared with the private full backup and preserved. All 26 pre-release hash/branch URLs were verified behind Access, and the new production hash is protected too. Product editing is unlocked with `LEGACY_CATALOGUE_PROTECTED=true`. Remote staging passed 19 workflows at all eight widths; production public/security smoke checks passed. Real-owner password login and external email/payment integrations remain unverified/unconfigured. Earlier local-only statements below are historical, superseded by this release update. See DEPLOYMENT-REPORT.md.

## Existing system

- Cloudflare Pages project `cell-connecta`, production branch `main`.
- Editable homepage: vanilla HTML/CSS/JavaScript. Retained compiled React/Vite product/admin frontend.
- Previous compatibility worker proxies APIs to immutable deployment `1845bad0-5e22-4f2a-b413-bbe96651d244`; editable original backend source unavailable.
- D1 binding `DB`, existing database `4404a83f-be39-4cc3-afc6-f4bc421b4987`.
- Existing tables: phones, variants, photo_blobs, users, sessions, email_codes. Photos are BLOBs in D1; despite an old schema comment mentioning R2, no R2 binding is configured.
- Inventory at audit: 32 products, 47 storage variants; quantities are stored in variants.in_stock, prices are ZAR major units (rand), not cents. Existing original prices are variants.was_price.
- Product attributes already present: brand/model/condition/colour/description/grade/battery/photos/created_at. Variants have stable IDs, storage, price, previous price, stock, position.
- One verified owner account. Legacy password format: PBKDF2, 100000 iterations. Never print or commit password hashes, session tokens, owner email, or deployment secrets.
- Existing OWNER_EMAILS and RESEND_API_KEY deployment secrets must be preserved.

## Working / gaps

Working: homepage, public catalogue/photo APIs, existing product pages, owner login/admin backend routes. Previous release verified unauthenticated protection and public browsing, but did not verify authenticated inventory writes.

Gaps: no dedicated shop/cart/order flow; hardcoded homepage curation; no publication metadata/audit trail; inconsistent UI across legacy routes; no verified payment provider. Backend/source dependency on an old deployment.

## Protection

- Git branch checkpoint `upgrade/premium-store-20261102` from bf57e7973a17b12047252d5afbcb20d6ea204651.
- Local source archive and restricted private snapshot of existing phones, variants and authentication records in `/home/user/upgrade-backup/`. Not committed, not a public download.
- No original product, variant, image, user, session or email-code table is to be dropped or emptied.
- Inspect schema before additive migration. Capture current production binding/deployment metadata.

## Smallest reliable changes

1. Retain vanilla frontend and Pages Workers runtime; no new frontend framework or production database.
2. Implement shared server-rendered storefront/header for `/`, `/shop`, `/phone/:id`, `/cart`, `/checkout` and owner workflows. Add small progressively enhanced JavaScript modules.
3. Query existing phones/variants directly through bound D1. Preserve IDs and data shapes for compatibility.
4. Add namespaced metadata, settings, hashed-session, rate-limit, audit and order tables. Seed metadata for existing products as published, matching their current public visibility.
5. Reuse existing owner password hashes, and require both verified identity and OWNER_EMAILS membership. New secure HttpOnly hashed sessions and CSRF checks; no public owner registration.
6. Keep original photo_blobs storage with strict image validation/size limits; no large image data in text columns. R2 remains an optional future storage migration, not needed to ship this upgrade.
7. Implement real stock-validated order requests and owner confirmation. Confirming an order atomically deducts stock; cancellation returns it once. No online payment collection or paid status without an explicit configured provider.
8. Test in an isolated temporary staging D1 database containing public inventory copies and a staging-only test owner, never real customer accounts. Deploy additive production migration only after staging passes.

## Deliberate integration boundaries

Online payments, transactional order email and carrier rates require verified business configuration. Do not imply card checkout, automated email, or nationwide free delivery. WhatsApp remains the configured human fulfilment channel. Policies require business/legal owner review before claiming legal completeness.

## Final local implementation / release status

The architecture above was retained: no frontend-framework replacement, no new production database and no destructive schema changes. The new Worker owns SSR and API behaviour directly, including configurable Resend recovery; it no longer proxies recovery to the immutable backend. Original inventory, account and photo tables/IDs remain authoritative.

Local verification now covers 19 browser/API workflow groups at all eight requested widths, 13 unit/integration checks, formatting, nine-module syntax checks and successful build bundling. `FINAL-REPORT.md` separates implemented/local verification from release blockers.

Production has not received this migration or implementation. D1 remote quota blocked staging population; only a partial staging database exists remotely. All write/race/archive tests used isolated local SQLite with fake accounts and public inventory/photo fixtures.

A further release risk was identified: immutable legacy deployment URLs predate publication metadata and may expose draft/archive rows outside the new API. Production product/image/archive writes therefore fail closed until the deployment operator genuinely secures those routes and sets `LEGACY_CATALOGUE_PROTECTED=true`. This flag is not a substitute for protecting the old routes. Local QA uses Wrangler's explicit local branch and is separately isolated. No old deployment has been deleted.

Original verified email/account/password data is preserved. The actual owner's password was not provided, so local fake-owner authentication does not prove production sign-in. Recovery requires an approved `RESEND_FROM_EMAIL` plus the preserved API key and verified delivery. Payments, transactional order email and carrier integrations remain unconfigured. Bulk CSV import is not included.
