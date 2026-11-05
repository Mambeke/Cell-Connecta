# Landing page: Shop by brand removed — LIVE

4 November 2026 · `2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f` · https://cell-connecta.pages.dev/

Removed the complete Shop by brand section and unused homepage brand-list derivation from `server/render.js:home()`. Retained supplied-artwork heroes, Shop by category gallery, Featured phones, promotion/service areas and all shop brand/model/storage filters. No changes to products, customer data, ratings, prices, stock, order/payment semantics or owner authorization.

36 unit tests; 15-module syntax; formatting/build pass. Both read-only browser suites pass locally and LIVE (22 groups, eight widths, zero uncaught JS errors). Homepage checks explicitly verify Shop by brand is absent while category gallery and featured phones remain. Full 32-product catalogue and exact production/preview configuration/domains/branch unchanged. Browser assets/artwork match the 38-file standalone upload. Canonical home200/hash Access302/adminAPI401/owner gateway302→login. No DB writes, migration or config patch.

Evidence: `checks/remove-home-brand-release-verification.json`, `checks/category-slideshow-results.json`, `checks/catalogue-results.json`, current homepage screenshots. Checkpoint/artifact: `/home/user/upgrade-backup/remove-home-brand-20261104/`. Earlier records remain historical. Existing authorized deployment access reused; credentials/private config/local DB excluded from delivery.

All previous limitations remain: actual-owner login and payment/recovery delivery not independently verified/configured; Others is a browse-only category pending separately reviewed additive inventory-authoring support.
