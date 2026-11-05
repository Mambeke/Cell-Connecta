# Open landing-page showcase — live update

3 November 2026 · Deployment `a3643665-b391-488d-a31a-1af534368242`

Removed the image-caption wording and framed image cards. The hero now uses transparent device cutouts directly on the page, without image background panels, borders, rounded cards or card shadows. The mobile carousel and its image area span the viewport edge-to-edge. Desktop/laptop images are 500–620px high. Mobile uses a large image-first layout with copy/buttons below it.

Added the visible **Shop by category** heading immediately above iPhone, Samsung, Laptops and Accessories. All category links, automatic rotation, pause/play, arrows, dots, swipe, reduced-motion behaviour and inventory-backed shopping are retained.

Verification: 16 units pass; syntax/format/build pass. Six read-only category/carousel workflows pass locally and on live production at 360,390,430,768,1024,1366,1440,1920px. Browser assertions explicitly check no hero image border/radius/box shadow, full viewport-width mobile image/carousel, desktop image height >=500px, the heading and absence of the removed copy. Zero uncaught JavaScript errors. Original catalogue response, quantities/prices and production configuration were compared before/after and are unchanged. No migrations or inventory/account writes. Protected deployment hash and unauthenticated-admin denial verified.

Previous deployment 6b5447d5 is retained. Source checkpoint saved before edits. Latest screenshots: checks/categories-home-desktop.png and checks/categories-home-mobile.png.
