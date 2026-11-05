# Supplied-photo iPhone hero — live

3 November 2026. Live at https://cell-connecta.pages.dev · deployment `e0d21be6-35a5-49fd-af25-e13f9ff917d8`.

Uses the customer's actual four-iPhone-on-stone artwork, not replacement device imagery. Precise foreground clipping preserves the original phone and platform pixels, while removing the rectangular dark background. A full-width pale-blue CSS light sweep joins the live headline and functional shop buttons on the left with the large collection on the right. On mobile the edge-to-edge artwork is placed above the text and buttons. Shop by category and all four category slides remain.

Asset preparation: `python scripts/prepare-collection-art.py "/path/to/Premium iPhone Collection on Stone.png"`. Requires Pillow. The optimized WebP is already included in public assets; preparing it is not required to build or deploy.

Final release verification: 18/18 unit tests; syntax checks for nine source modules; formatting and production build pass. Seven read-only browser workflow groups pass locally and on live production at 360,390,430,768,1024,1366,1440,1920px with no uncaught JavaScript errors. Supplied-artwork URL, loaded images, all four category links, autoplay/pause, arrows/dots, swipe, reduced motion, responsive geometry and honest empty categories verified. Desktop/tablet/mobile screenshots visually reviewed.

No database changes, migrations or production writes were made. Backend, inventory, account and security code remains unchanged. Both supplied-artwork hero updates are deployed and live-verified. Full 32-product catalogue matches the previous verified release; production and preview configuration are unchanged. New deployment hash remains behind Access; unauthenticated admin API returns 401.

Private checkpoint, final evidence, checksum manifest and fresh bundled deployment artifact are under `/home/user/upgrade-backup/reference-hero-20261103/`. Never upload checkpoint/private database files. The deployment artifact is its `upload/public` directory only.

Final combined deployment artifact/evidence: `/home/user/upgrade-backup/samsung-hero-20261103/release-upload/public`. The original pre-edit checkpoint is retained.
