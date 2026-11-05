# Cell Connecta — premium storefront source

This repository contains the editable premium storefront and server/API implementation corresponding to live release **2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f**.

**Next agent:** start with [NEXT-AGENT-START-HERE.md](NEXT-AGENT-START-HERE.md), [AGENTS.md](AGENTS.md), [HANDOVER.md](HANDOVER.md), and [PROJECT-STATE.json](PROJECT-STATE.json). Read [SOURCE-PROVENANCE.md](SOURCE-PROVENANCE.md) for import verification.

The repository root is the application root. `server/` contains the backend; `public/cc-assets/` contains the current CSS, browser modules and supplied collection artwork. **Do not recover the old backend, replace this with the old Vite/Convex archive, or reset the production database.** The older static-compatibility site remains in Git history and in the backup branch `archive/static-site-before-premium-20261105`.

Use Node 22+, `npm ci`, `npm test`, `npm run check` and `npm run build`. Read HANDOVER before starting local QA or publishing. Browser tests require Playwright Chromium. Mutating suites are isolated-QA only. A Git push does not deploy this Cloudflare direct-upload project; follow the controlled standalone release procedure for future production updates.

---

# Cell Connecta — active production source

**Live:** https://cell-connecta.pages.dev
**Latest verified LIVE deployment:** `2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f` · 4 November 2026.

> **Current work COMPLETED and LIVE.** Shop by brand removed from the landing page. Category gallery, supplied-artwork heroes, featured phones and shop brand/model/storage filters unchanged. 36 units and 22 read-only browser groups pass locally/live at eight widths; full catalogue/config preserved. See REMOVE-HOME-BRAND-UPDATE.md.

## Next agent: start here

**Source transfer correction:** read SOURCE-EXPORT-README.md. The fresh archive and checksum are in `/home/user/Cell-Connecta-Export-20261105/`. Download/upload the ZIP itself. Do not use the older 21,965,019-byte root ZIP.

**Agent handover prepared 5 November 2026:** read [NEXT-AGENT-START-HERE.md](NEXT-AGENT-START-HERE.md). It summarizes all retained/removed UI, backend limits, credential continuity and snapshot recovery. No new deployment was performed for the handover.

1. **[AGENTS.md](AGENTS.md)** — preservation/security rules and work agreements.
2. **[HANDOVER.md](HANDOVER.md)** — current source map, recovery/setup, safe deployment, rollback, credentials and remaining limitations.
3. **[PROJECT-STATE.json](PROJECT-STATE.json)** — machine-readable current release/evidence.

This directory is the complete editable storefront/backend implementation. **Original backend recovery is not needed.** Do not overwrite it with the older top-level HTML, legacy proxy Worker or old repository main. This workspace's active path is `/home/user/shop`; use the extracted project root elsewhere.

The portable `Cell-Connecta-Premium-Source.zip` contains source, assets, public fixtures, instructions and successful evidence—not real customer/auth exports or credentials. It was extracted into an isolated directory and all **36 unit tests passed** from the extracted source. In a different workspace, transfer/extract the latest ZIP before continuing; chat history is not a source backup.

## Current storefront

- Four accessible automatic hero slides: supplied iPhone, Samsung, laptop and accessories collection artwork; responsive live copy/links, pause/arrows/dots/swipe/reduced motion.
- Premium Shop by category gallery: supplied imagery, larger cards, hover/focus effects, four desktop/two mobile columns, honest category destinations.
- Sticky white main navigation while scrolling; delivery strip scrolls away. Anchor, search and mobile menu behavior verified.
- Live premium catalogue: desktop sidebar, multiselect category headings/blue-separated groups, Brand → Model → Storage, mobile Apply, selected-variant product links, scoped facets, active chips and independent group pagination.
- Real inventory-backed catalogue, filtering, products, cart/unpaid order requests and server-authorized owner workflows on the original Pages/D1 architecture.

## Quick local setup (Node 22+)

```bash
npm ci
npx playwright install --with-deps chromium
npm run build
npm run dev
```

Use a background-process tool for the dev server (0.0.0.0:3000). It binds isolated local D1 and fake QA owner. Only if the local fixture is blank and a local reset is intended: `npm run seed:local`. Never seed/migrate/reset production. If system Node is older, HANDOVER.md explains the no-save Node 22 recovery step.

## Verify

```bash
npm run check
npm run format:check
npm test
npm run build
node tests/categories.mjs
```

Current results: **22 units, 15-module syntax, formatting/build; eleven read-only browser workflow groups locally and live at eight widths (360–1920px), zero uncaught JavaScript errors**. `SHOP_URL=https://cell-connecta.pages.dev node tests/categories.mjs` is safe/read-only. The broad 19-workflow authenticated/mutating suite was separately verified on isolated QA/staging; never weaken its production guards or use it on real data.

## Publish safely

Read **[DEPLOYMENT.md](DEPLOYMENT.md)**. Build, test, checkpoint and save private catalogue/config baselines first. Then:

```bash
npm run prepare:release -- /absolute/fresh/upload-directory
```

Deploy only that directory's `public` child from the fresh no-config cwd with authorized temporary credentials supplied to the child process environment. The helper refuses stale bundles and existing/protected destinations. It never deploys or touches D1. Preserve existing bindings/secrets/Access and compare full catalogue/config before and after. **Migration 0001 is already applied; frontend updates require no database writes.**

## Important limits and records

- All 32 catalogue records and deployment configuration were compared unchanged after this release; new hash remains Access-protected, unauthenticated admin API returns 401.
- Actual owner login still needs owner confirmation. Recovery-email sender/delivery, payment/webhook, transactional email and carrier integrations need separate owner configuration/verification. Never pretend a browser success page proves payment.
- Never publish private backup/config/auth/DB files or token values. No billing/DNS/other project changes.
- [TESTING.md](TESTING.md) — current test procedure/scopes.
- [STICKY-NAV-UPDATE.md](STICKY-NAV-UPDATE.md) — latest navigation/handover release.
- [FANCY-CATEGORIES-UPDATE.md](FANCY-CATEGORIES-UPDATE.md), [ACCESSORIES-HERO-UPDATE.md](ACCESSORIES-HERO-UPDATE.md), [LAPTOP-HERO-UPDATE.md](LAPTOP-HERO-UPDATE.md), [SAMSUNG-HERO-UPDATE.md](SAMSUNG-HERO-UPDATE.md), [REFERENCE-HERO-UPDATE.md](REFERENCE-HERO-UPDATE.md) — preceding feature releases.
- [DEPLOYMENT-REPORT.md](DEPLOYMENT-REPORT.md) / `checks/hero-release-results.json` — verification history/current release evidence.
- ARCHITECTURE-AUDIT.md and FINAL-REPORT.md are explicitly historical; old quota/local-only/missing-source statements are not current blockers.
