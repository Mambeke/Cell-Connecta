# Homepage release checks

Date: 2 November 2026.

Verified in Chromium against Cloudflare Pages preview `https://1e96de64.cell-connecta.pages.dev` before production release:

- Four featured cards use actual live listings, prices and photos.
- The catalogue loads all 32 public product listings.
- No horizontal page overflow at widths 320, 360, 375, 390, 414, 600, 768, 900, 1024, 1280, 1536 and 1920 pixels.
- Mobile navigation opens, closes, and filters the catalogue.
- Empty categories offer sourcing via WhatsApp; no fabricated Samsung/laptop inventory.
- Search filters by actual model/colour/storage data.
- Saved phones persist across page refresh using browser-local storage.
- Price sorting works.
- Existing product details and WhatsApp order links render.
- Returning home from an existing product page opens the new homepage.
- Login page renders; unauthenticated admin route stays protected.
- No JavaScript exceptions or Content Security Policy violations during these checks.

## Limitations

Owner login, authenticated uploads, edits and other admin writes were NOT tested: owner login credentials were not provided. No product/account/database writes were performed during testing. A successful login-page render is not proof of authenticated administration.

The backend remains dependent on the fixed previous deployment `1845bad0-5e22-4f2a-b413-bbe96651d244`. Do not delete that deployment. Original backend source was not recovered. This release does not constitute a full backend/database backup or migration.

The page adapts to tested viewport sizes; this is not a claim of testing every browser or device.
