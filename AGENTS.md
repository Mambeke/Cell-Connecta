# Repository continuation notice

This Git checkout is current premium source, not the old public-repository version. Historical warnings about “old main” refer to commits before this source import. Use this checkout normally; the original Arena source root `/home/user/shop` had no `.git`, but clones of this repository do. Read SOURCE-PROVENANCE.md and the entry points below before changing production. Credentials are not included.

# Cell Connecta — instructions for the next agent

Read `NEXT-AGENT-START-HERE.md`, `HANDOVER.md` and `PROJECT-STATE.json` FIRST. They are the current operational entry points, not the historical pre-release audit. Last maintained: 5 November 2026.

## Source of truth
- Current source transfer: read SOURCE-EXPORT-README.md. Fresh ZIP is `/home/user/Cell-Connecta-Export-20261105/Cell-Connecta-Premium-Source.zip`, with size/hash in its verification sidecar. Do not use the stale 21,965,019-byte root archive.
- This directory (`/home/user/shop` in the current workspace) contains the editable, self-contained application: `server/`, `public/`, `tests/`, `scripts/`, `migrations/`.
- Do not rebuild from the unrelated top-level `/home/user/index.html`, old compiled frontend, old public repository version or legacy proxy Worker. This source is newer. Do not overwrite it by downloading old source.
- Original backend source is NOT required. The replacement server implementation is already here. Do not ask the busy owner to recover/export it again.
- The full latest source, fixtures, instructions and successful test evidence are delivered in `/home/user/Cell-Connecta-Export-20261105/Cell-Connecta-Premium-Source.zip`. Another workspace must receive/extract that archive first; chat memory alone is not source.

## Non-negotiable preservation/security rules
1. Keep the existing live address, Cloudflare project, production D1, accounts, product/variant IDs, photos, prices, stock and order data. Do not create an empty replacement database or destructive rebuild.
2. Production migration `0001_premium_store.sql` is ALREADY APPLIED. Do not re-run seed/baseline schema/migrations on production. Inspect schema before any explicitly authorized new additive migration.
3. Make a checkpoint before substantive changes. Frontend updates need no database writes or configuration patches.
4. Keep Cloudflare Access protecting old/hash deployments; canonical `cell-connecta.pages.dev` remains public. Preserve `LEGACY_CATALOGUE_PROTECTED=true`, DB binding, owner allowlist and server-side secrets. Never unprotect old APIs to make a test pass.
5. Only read-only public/security tests on production. `tests/e2e.mjs` and staging mutation tests are for isolated QA data; never weaken their production guards. Never run oversell, checkout/order-create, stock/product/CMS mutations against real customers' data as a smoke test.
6. All privileged operations require server authorization/CSRF/validation. Never add public owner signup, hardcoded passwords, browser-controlled prices/paid state or secret values to client code.
7. Tokens/passwords/private exports/config snapshots must not enter source, public artifacts, reports or the source archive. Reuse an existing valid token securely supplied for deployment; do not ask for a newly created token for each change. Only request replacement when expired/revoked/insufficient; do not hunt unrelated credential files. Never echo a token. Token/session values from earlier chat are not handover material.
8. Real-owner login and email/payment integrations are not verified/configured merely because fake-owner staging passed. Report limitations honestly. No fabricated inventory, latest-model availability, guarantees, reviews or service claims.
9. Verified policies: six-month certified-refurbished warranty, two-month preowned warranty, three-day returns, free Cape Town delivery. Do not generalize phone coverage to all laptops/accessories.
10. User wants automatic controlled publishing after tests, without manual-upload instructions. Use the existing project only; no DNS/billing/unrelated-project changes. If authorization is unavailable, finish locally and say explicitly it is not published.

## Frontend agreements to retain
- Landing-page Shop by brand section removed by owner request. Do not reintroduce it; shop brand/model/storage filtering and category gallery remain.
- No floating WhatsApp button. Navbar WhatsApp is solid green. Footer payment-not-enabled sentence removed, but truthful unpaid checkout/order-request semantics remain. Others is a browse-only shop category; inventory authoring needs separately reviewed additive schema support.
- Header has WhatsApp immediately before cart, no account/global-search icon. Only Owner admin footer link leads to /admin; auth remains enforced. Catalogue search stays. Phone sourcing WhatsApp callout follows page numbers.
- Shop intro/banner/breadcrumbs removed by owner request: sidebar/search immediately below navigation. Keep compact premium surfaces and screen-reader-only H1. Ratings remain unchanged.
- Premium catalogue desktop sidebar with category multiselect, dynamic headings, blue-divided groups, exact model/storage choices and selected-variant product links; mobile batch Apply.
- Four accessible category slides (iPhone, Samsung, laptops, accessories), supplied collection artwork, honest empty categories, correct category links.
- Full-width/unboxed hero images, large desktop compositions and edge-to-edge mobile image areas. No unwanted image captions.
- Autoplay/pause, arrows/dots, touch swipe, inactive slides inert and reduced-motion support.
- Fancy Shop by category gallery using supplied collection images; four columns desktop, two mobile/tablet; keyboard focus and reduced-motion support.
- Main white navigation stays at the top during scrolling; delivery strip scrolls away. Do not confuse the owner's word “static” with CSS `position: static`.

## Operating discipline
- Node 22+, `npm ci`; caches, node_modules/build and background processes may disappear between snapshots. Follow HANDOVER's recovery steps.
- Local preview binds 0.0.0.0:3000, with fake owner/local D1 only. Do not add localhost URLs to browser-facing API requests.
- Build first. `npm run prepare:release -- /absolute/fresh/upload-directory` creates a standalone Worker + browser assets without config. Deploy from that new directory, not blindly from the project with production-binding config.
- Before/after deploy: save restricted project configuration snapshot and full GET `/api/phones` catalogue; compare them; test canonical public site, new hash Access redirect and unauthenticated admin 401.
- Refresh HANDOVER, PROJECT-STATE, README latest notice and release evidence after completing a release. Regenerate the portable source archive with the current handover included.
