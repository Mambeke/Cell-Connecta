# Cell Connecta — homepage redesign

Responsive homepage based closely on the supplied Cell Connecta reference image. Uses actual live prices, product photos and availability. Warranty and delivery terms retain the existing business policies rather than the example image's policies.

## Structure

- `public/index.html`: new homepage.
- `public/cc-assets/`: new styling, behaviour, logo and reference artwork.
- `public/legacy.html` and `public/assets/`: recovered production product/admin application, compiled assets (original editable source unavailable).
- `public/_worker.js`: Pages advanced-mode worker. Serves new homepage and retained product/admin frontend. Proxies `/api/*` to the retained backend deployment.
- `public/cc-bridge.js`: ensures returning home from retained React pages opens the new homepage.

## IMPORTANT: retained backend dependency

**Do not delete Cloudflare Pages deployment `1845bad0-5e22-4f2a-b413-bbe96651d244`.**

Its fixed URL is `https://1845bad0.cell-connecta.pages.dev`. It provides the existing D1-backed product, photo and authentication services. The new worker forwards API requests to it; no database schema or business data is modified by this redesign. This is a compatibility bridge, not full recovery of the backend source. Future migration should recover/reimplement those services, verify authentication and admin writes, then remove this dependency. Avoid automatic deployment-pruning jobs that delete the retained deployment.

The public catalogue/photo snapshots made during recovery are not a database or customer-account backup.

## Run and deploy

Node 20 or later. Run `npm ci`.

- `npm run preview` — local read-only frontend preview, API requests forwarded to the existing backend.
- `npm run deploy:preview` — Cloudflare preview branch.
- `npm run deploy` — production deployment to `cell-connecta`.

Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the process environment. Never put credentials in source code or commit `.env` files. The scripts do not contain credentials.

The production project already owns its D1 binding and secret settings; this homepage deployment must not overwrite those settings.

## Features

Mobile menu, catalogue filtering, search, price sorting, live product cards and prices, locally saved favourites, product details, WhatsApp support and existing admin/login pages. No fake checkout or fabricated stock. Buy Now opens the real product page where customers choose storage and order on WhatsApp.

Hero/category artwork and logo are cropped from the user-supplied reference. Listing photos remain the real shop photos. The hero is decorative, not an exact listing photograph.
