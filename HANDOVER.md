# Cell Connecta — active project handover

**Updated: 5 November 2026. Read this with AGENTS.md and PROJECT-STATE.json.**

## 1. Current state and immediate work

**Source transfer correction, 5 November:** use SOURCE-EXPORT-README.md and the fresh ZIP under `/home/user/Cell-Connecta-Export-20261105/`. A restored older root ZIP was stale (21,965,019 bytes; 118 entries) and did not match its old sidecar checksum. It is NOT the current export. The new export includes canonical CSS/store/admin JS and all four artworks byte-for-byte, plus existing editable backend/tests/docs. Download the ZIP itself and upload it to the new workspace; a handover Markdown file or text link does not transfer source. No production writes/deploys for this recovery.

**Agent transfer: read NEXT-AGENT-START-HERE.md first. The owner is changing agents; no new production feature/deploy is requested.**

- On 5 November, current canonical release and 32-product catalogue were reconfirmed read-only. Restored stale CSS/browser JS and missing laptop/accessories artwork from canonical public assets for a complete portable source. Browser JS is readable recovered ESM with required exports; no production changes for this handover. See checks/agent-handover-recovery.json.

- **Latest request COMPLETED:** removed the complete Shop by brand section and its unused brand list from the landing-page renderer. Category gallery, four supplied-artwork heroes, featured phones and shop brand/model/storage filters remain unchanged. 36 units and all 22 local/LIVE read-only browser groups pass; full 32-product catalogue/config/assets/security checks pass. No DB/config writes.

- Public production: https://cell-connecta.pages.dev/shop. **Current LIVE release: `2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f`**. Previous `a0583bcd-3209-40b9-8164-0b2eeeeb175c` retained for rollback.
- **Previous navbar/Others request retained:** removed floating WhatsApp on every page; navbar WhatsApp is solid green with white icon. Removed the exact footer “Online payment is not yet enabled” sentence. Checkout/order-request disclosures and actual unpaid semantics remain unchanged. Added Others to the shop's category checkbox section with icon, count, heading, grouped section and honest empty state.
- **Others scope:** browse/UI only, currently 0 assigned products. Production D1 `cc_product_details.category` has a CHECK limited to phones/laptops/accessories. Do NOT pretend owner product authoring supports Others yet; a separately reviewed additive extension is needed to assign inventory there. No migration or schema relaxation was performed for this browse request.
- Existing header account/search removals, WhatsApp-before-cart, Owner admin footer gateway, catalogue search, phone sourcing below pagination, compact premium filters, variant-safe browsing and supplied-artwork homepage/gallery/sticky navigation retained. No rating changes.
- **36 unit tests**, **15-module syntax**, format/build; **11 hero/gallery/navigation + 11 catalogue read-only groups** pass locally and LIVE at eight widths, zero uncaught JS errors. New checks cover no floating button, stronger navbar colour, footer text removal, Others selection/grouped empty results and preserved checkout semantics.
- Full 32-product catalogue and exact production/preview config/domains/branch unchanged. Browser assets/artwork match the 38-file standalone upload. Public shop200, protected hash302, adminAPI401, owner gateway302→login. No DB writes, migrations or config patches.
- Evidence: `checks/remove-home-brand-release-verification.json`, `checks/catalogue-results.json`, `checks/category-slideshow-results.json`, `checks/navbar-others-{desktop,mobile}.png`. Earlier release records remain historical.
- Checkpoint/artifact: `/home/user/upgrade-backup/remove-home-brand-20261104/upload/public`. Restricted project snapshots/full catalogue baseline remain outside the deliverable. Existing authorized token reused; never persist its value in project/files or claim a durable encrypted deployment pipeline was installed.
- No pending work in this browse/style request. Actual-owner login, payment/recovery delivery and Others inventory authoring remain separately unverified/unimplemented scope, not claims of current functionality.

## 2. There is complete source — no old backend recovery needed

The active root in this workspace is `/home/user/shop`. The original Arena source directory had no `.git`. This repository checkout now contains the current premium implementation; pre-import commits are historical. Do not replace this checkout with a pre-import commit or the old embedded source ZIP. The old top-level `/home/user/index.html` and older ZIPs are not the active application.

| File/directory | Purpose |
| --- | --- |
| `public/_worker.js` | Thin Worker entry importing the editable server. Use the bundled Worker for standalone deployment. |
| `server/render.js` | SSR page layout/header/footer, hero/category data, storefront/shop/product/admin HTML. |
| `public/cc-assets/store.css` | Active overrides; gallery/sticky-nav rules precede the new scoped catalogue rules. `home.css` is the older base stylesheet, loaded first. |
| `public/cc-assets/store.js` | Cart/forms/site interactions and accessible 5500ms category slideshow. |
| `server/core.js` | Shared validation/security/auth/session/response utilities. |
| `server/data.js` | Catalogue/data access and same-variant filtering. |
| `server/api.js`, `orders.js`, `recovery.js` | Server APIs, authoritative order/stock workflows, recovery. |
| `public/cc-assets/admin.js` | Owner dashboard client; privileged writes are authorized server-side. |
| `migrations/0001_premium_store.sql` | Historical additive migration, already applied to production. |
| `tests/unit.test.mjs` | Fast Node units/integration checks. |
| `tests/catalogue.mjs` | READ-ONLY sidebar/category/model/storage/variant/pagination/search/sort/viewport workflows; run live only after sidebar publication. |
| `tests/categories.mjs` | READ-ONLY hero/gallery/navigation/responsiveness checks; safe to point at canonical production. |
| `tests/e2e.mjs`, `tests/staging.mjs` | Mutating isolated QA checks. Never production. Keep mutation guards. |
| `tests/fixtures/`, `scripts/seed-local.py` | Public catalogue/photo fixture and fake QA accounts for local recovery. No real owner credential needed. |
| `scripts/build.mjs` | Bundles Worker/browser modules into ephemeral build/. Does not deploy or migrate. |
| `scripts/prepare-release.mjs` | Builds a fresh standalone upload tree from already-built bundles. No credentials/deploy/DB operations. |
| `checks/` | Successful browser evidence and current release verification JSON. Some old files are historical: read their environment/date. |

## 3. Restore tools after a snapshot/new workspace

Dependencies, generated build directories, browser caches and running processes are not guaranteed to persist. Regular source/public fixtures and files under /home/user do persist. In a different workspace, first extract **Cell-Connecta-Premium-Source.zip** and use its project root.

Use Node 22 or newer. On Arena if the system Node is older:

```bash
cd /home/user/shop
npm ci
npm install --no-save node@22
export PATH="$PWD/node_modules/.bin:$PATH"
node --version
npx playwright install --with-deps chromium
```

With a working system Node 22+, the no-save Node install is unnecessary. Python/Pillow is needed only to reprocess the supplied iPhone image, not to run/build the store. Existing optimized WebPs are already present. Source `prepare-collection-art.py` accepts the original image path as an argument.

Local run:

```bash
npm run build
npm run dev
```

Use the platform's background-process tool, bound to 0.0.0.0:3000, for the long-running dev server. `npm run dev` uses local D1 and fake QA owner only. A local database may already be populated under `.wrangler/state/v3/d1`; do not reset it unnecessarily. For a genuinely blank local QA database only, `npm run seed:local` rebuilds the LOCAL public fixture and fake users. It is not a production migration or remote restore.

Browser API calls are relative URLs. Do not embed sandbox localhost URLs in frontend code. The server's local HTTPS/host allowances and frame policy deliberately differ from production security; do not weaken production framing/origin checks to enable preview.

## 4. Safe verification commands

```bash
npm run check
npm run format:check
npm test
npm run build
node tests/categories.mjs
SHOP_URL=https://cell-connecta.pages.dev node tests/categories.mjs
SHOP_URL=https://cell-connecta.pages.dev node tests/catalogue.mjs
```

The last two commands are read-only. It checks 360,390,430,768,1024,1366,1440,1920px, category links, carousel controls/motion/swipe, exact supplied imagery, gallery columns/overflow/focus and scrolling navigation/anchor/search/mobile-menu behavior. These are Chromium-rendered checks, not physical-device/Safari/screen-reader certification.

The broad mutating QA workflow suite previously passed 19 groups locally and on isolated remote staging. Do not claim those authenticated workflows were rerun on production. The actual production owner's password/sign-in remains unverified by the assistant.

## 5. Production identities and configuration

- Cloudflare account ID: `01a943752f1069b93df5b328ce954d0f`.
- Pages project: `cell-connecta`; production branch: `main`.
- Production D1: `4404a83f-be39-4cc3-afc6-f4bc421b4987`, name `cellconnecta`, binding `DB`.
- Separate QA/staging D1: `4aec972c-3587-4859-98b6-e43bec209e0f`. Local `--d1` uses an isolated Miniflare database, not a remote production query.
- Preserve `OWNER_EMAILS`, `RESEND_API_KEY`, all existing bindings/secrets and compatibility settings. Never print their values. `LEGACY_CATALOGUE_PROTECTED=true` depends on continued Access protection.
- Keep old/hash deployment URLs behind Cloudflare Access; keep canonical production publicly reachable. Do not delete history or unprotect old inventory/photo routes.

Credentials are intentionally **not** in source or this handover. Use an existing valid token securely supplied for deployment; do not ask the owner to create a new token for every change. If access is absent, request reuse of their existing valid token; replacement is necessary only if expired/revoked/insufficient. No durable encrypted deployment credential setup is configured. Do not ask the owner to recover the old backend or paste a password into source. Do not search unrelated credential paths. Never promise a credential pasted in chat has been erased from chat/logs.

## 6. Controlled frontend deployment — no DB migration

1. Checkpoint source. Save a **private/restricted** project GET snapshot and full GET `https://cell-connecta.pages.dev/api/phones` response before changing production. Inspect current canonical deployment ID/config; don't trust stale notes over actual live state.
2. Run the checks above, inspect desktop/mobile, and run `npm run build` after final source changes.
3. Prepare a new upload tree, e.g.:

```bash
npm run prepare:release -- /home/user/upgrade-backup/NEW-RELEASE/upload
```

The target must not already exist. The helper refuses stale build bundles, copies public assets and overrides the importing entry Worker with the bundled Worker. It writes a SHA256 manifest **outside** public. Build directories are ephemeral; don't assume an old bundle is current.

4. From that upload directory, deploy only its public child using the temporary token in the child process environment:

```text
wrangler pages deploy public --project-name=cell-connecta --branch=main --commit-dirty=true
```

Use the project's installed Wrangler/Node executable if running outside the source directory. Do not write credential values into a shell script, source, `.env`, command log or handover. Do not include private backup directories, configuration JSON or database exports in public. Deploy from the fresh no-config upload cwd so Pages retains its existing bindings/secrets rather than unintentionally applying local config.

5. Verify the new canonical deployment reports success. Compare exact full catalogue and deployment configurations before/after. Run the live read-only suite; verify assets match the artifact, hash URL redirects to Access, admin API returns 401 unauthenticated and canonical production stays public. No order/product/stock test mutations.
6. Update PROJECT-STATE, this handover, README's latest notice, tests/evidence and source archive. The current verifiable source-transfer exporter is `scripts/export-source.py`; it secret-scans the allowlisted source/evidence files and creates the current portable ZIP/report. In a new workspace, recreate that source-only packaging step if the private helper wasn't transferred; exclude `.wrangler`, node_modules, build, private backups, secret/config snapshots and real auth/DB exports.

## 7. Data/policies/limits to preserve

Existing catalogue baseline: 32 real Apple phone records with 47 variants. Other categories can be empty and must remain honest; supplied campaign scenes are not promises that every pictured item is in stock. No fake stock/specs/reviews/discounts. Prices are ZAR rand (major units), not cents. Cart localStorage is not price/stock authority.

Verified policies: certified refurbished six months; preowned two months; three-day returns; free Cape Town delivery. Other locations quoted. WhatsApp: +27 68 530 2223. Do not infer blanket laptop/accessories coverage from reference screenshots.

Order requests/manual payment remain explicit. Payment provider/webhook, recovery sender/delivery, transactional order email and carrier integrations need owner configuration and independent verification. A browser success URL must never mark an order paid. Actual owner login still needs owner confirmation; do not hardcode/reset their account to work around missing credentials.

## 8. Checkpoints and rollback

Private source checkpoints and standalone upload artifacts are under `/home/user/upgrade-backup/<release>/`. For example fancy-categories-20261103 precedes sticky-nav-20261103. Original private full DB export is 40,996,689 bytes, SHA256 `3b607d9b047b6ff0533df415250856f38fbf30beac3ea1930864ca5de993c502`; never include it in public/source delivery.

Rollback by redeploying a **known-good premium standalone artifact**, preserving current bindings/database. Do not drop cc_* tables or restore an old full DB snapshot over newer orders/customer changes. Old compatibility/legacy Workers may proxy to now Access-protected routes and fail, or expose drafts: don't blindly roll back to them. Retain history and Access.

## 9. History vs current guidance

Initial D1 quota problems, missing original backend, staging failures and local-only deployment restrictions were resolved/superseded during the 3 November rollout. They are not current blockers. `ARCHITECTURE-AUDIT.md`, `FINAL-REPORT.md` and early sections of `DEPLOYMENT-REPORT.md` retain historical evidence; never execute old initial-cutover commands as if the migration were pending. Current procedure is this handover and rewritten DEPLOYMENT.md.

No honest document can guarantee a future agent never gets stuck. Complete editable source, reproducible setup, current release IDs, portable fixtures and explicit safety/deployment rules remove the earlier missing-source dependency. For a brand-new workspace, transfer the latest source ZIP rather than relying on chat history alone.
