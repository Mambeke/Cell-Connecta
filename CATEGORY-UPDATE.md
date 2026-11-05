# Landing categories & slideshow — live update

3 November 2026 · Production deployment `6b5447d5-0159-4960-8004-b411bf4f802d`

The landing page now has four permanent clickable categories: iPhone, Samsung, laptops and accessories. An automatic hero carousel cycles their images/copy every 5.5 seconds while not paused/hovered/focused, with previous/next arrows, category dots, play/pause, mobile swipe and reduced-motion support. Four lightweight WebP images total about 91 KB; these support category navigation. Actual catalogue photographs and stock remain authoritative.

Header/mobile/footer links include all four categories. iPhone/Samsung routes combine phone category and brand, so Apple laptops will not leak into the iPhone category. Empty categories retain their selected filters, have accurate product-oriented headings and offer honest sourcing/empty states.

A source checkpoint was created before edits. No migrations, owner changes, stock edits or order writes were performed. The complete public catalogue response (32 existing products including prices/stock) matched before and after. Original production bindings/settings/secrets were unchanged. The new deployment hash remains protected by Access. Previous premium deployment ce8ff92c is retained for rollback.

Verification: 16/16 units, syntax/format/build pass. Six read-only carousel/category browser workflow groups pass locally and on live production, including auto-advance, pause/arrows/dots, four category links, mobile menu/swipe, reduced-motion behaviour and all slides at widths 360,390,430,768,1024,1366,1440,1920px. Zero uncaught JavaScript errors. Evidence: `checks/category-slideshow-results.json` and `checks/categories-home-{desktop,mobile}.png`. Initial 19-group authenticated staging tests remain previous-release evidence; they were not rerun against production or presented as new owner-password verification.
