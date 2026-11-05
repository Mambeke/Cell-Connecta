# Supplied-artwork laptop hero — live

3 November 2026 · https://cell-connecta.pages.dev · deployment `06060728-c5bb-4164-a020-a7d04ac78dfd`.

Uses the actual customer-supplied `Futuristic Laptop Showroom Glow.png` (1671×941), optimized to `hero-laptop-collection.webp`. The supplied homepage screenshot guided the composition; the live site remains real HTML, text and links, not a flattened screenshot.

Third carousel slide: full-width dark navy/cyan neon campaign; large “Find your next / Laptop.” headline; four-laptop platform composition on the right; mobile image above copy with all four devices proportionally contained. Shop Laptops opens `/shop?category=laptops`; View Deals opens `/shop?category=laptops&deals=1`. Both navigate correctly with persistent category selection. Product/category thumbnails and existing iPhone/Samsung hero artwork are retained. The shared dark scene styling applies only to Samsung/laptops; iPhone and accessories retain their light presentation. Four-category automatic rotation, pause/play, controls, swipe and reduced-motion handling remain.

Copy asks about availability/sourcing rather than inventing laptop inventory, latest-model availability, brand stock or laptop warranty coverage. Global established phone warranty wording and policies are unchanged. No stock, pricing, catalogue, account, backend authorization, payment, DNS or billing changes.

Verification: 19/19 unit tests; syntax checks for nine modules; formatting/build pass. Eight read-only browser workflow groups pass locally and on live production at 360,390,430,768,1024,1366,1440,1920px, with zero uncaught JavaScript errors. Includes supplied laptop image and dimensions, dark theme and both laptop CTAs; existing Samsung/iPhone theme return and CTAs; all four slide/card links; autoplay/pause, arrows/dots, swipe and reduced motion; full-width mobile image areas and no overflow. Desktop, tablet and mobile laptop screenshots visually reviewed before publishing; final live captures saved.

The full 32-product `/api/phones` response exactly matches the pre-release baseline. Production/preview deployment configurations and public assets were verified unchanged/matching the prepared artifact as appropriate. New deployment hash redirects to Cloudflare Access (302); unauthenticated admin API returns 401. No migrations or database writes. Previous `e0d21be6-35a5-49fd-af25-e13f9ff917d8` retained; no deployment history deleted.

Private checkpoint, before/after comparisons, evidence, checksum manifest and fresh standalone deployment artifact: `/home/user/upgrade-backup/laptop-hero-20261103/`. Upload artifact is `upload/public` only; never publish private backups/configuration/database files. Live screenshots: `checks/laptop-home-desktop.png` and `checks/laptop-home-mobile.png`.
