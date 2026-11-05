# Samsung supplied-artwork hero — live

3 November 2026. Live at https://cell-connecta.pages.dev · deployment `e0d21be6-35a5-49fd-af25-e13f9ff917d8`.

Implemented the supplied Samsung reference as the second slide of the existing four-category carousel. Uses the customer's actual `Samsung Galaxy Showcase in Neon Light.png`, optimized as `public/cc-assets/hero-samsung-collection.webp` (1671×941); the homepage screenshot is a design reference only, not a flattened replacement for the live site.

The Samsung slide has a full-width dark navy background, seamlessly softened neon scene edges, white/cyan live headline, and functional Explore Samsung / Shop All Products buttons. Every Galaxy model, including the folding phone, stays visible on mobile through proportional image containment. The parent banner switches to the dark theme when Samsung becomes active and returns to the appropriate light theme for the other slides. Category thumbnails are unchanged. The previous supplied-iPhone-artwork implementation is retained.

Copy avoids claiming Samsung inventory exists or that specific pictured models are available: it asks visitors to check availability or sourcing. No invented latest-model, stock, quality-assurance or delivery-speed claims were added. Established policy wording and existing backend/security code remain unchanged.

Verification: 18/18 unit tests; syntax checks for nine modules; formatting and production build pass. Seven read-only browser workflow groups pass locally and on live production at 360,390,430,768,1024,1366,1440,1920px with no uncaught JavaScript errors. Includes supplied-image URL and natural dimensions; Samsung theme; both real CTA navigations; return to pale iPhone theme; all four category links; autoplay/pause, dots/arrows, swipe and reduced motion; unboxed image geometry; mobile viewport width and no page overflow. Final desktop/tablet/mobile screenshots visually reviewed.

Both supplied-artwork hero updates are now deployed. No migrations or database writes were performed. The full 32-product catalogue exactly matches the previous verified release, and production/preview deployment configurations are identical before and after. The new deployment hash redirects to Access; unauthenticated admin API returns 401. Fresh standalone bundled deploy artifact and checksum manifest: `/home/user/upgrade-backup/samsung-hero-20261103/release-upload/public` and `release-artifact-sha256.json`. Private checkpoint and test evidence are beside them; never upload private backup directories. Previous deployment `927258d4-1ee8-4dd6-9617-3e33754dc3fe` was retained; its public browser assets already matched the prepared release when checked. No deployment history was deleted.

Previews: `/home/user/Cell-Connecta-Samsung-Hero-Preview.png` and `/home/user/Cell-Connecta-Samsung-Mobile-Preview.png`.
