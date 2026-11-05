# Agent notes — Samsung products & image pipeline

Added 5 November 2026. Read before changing product data.

## Products are data, not code

The shop renders the catalogue from D1 on every request. Creating or editing a
product does **not** require a deployment. Only code changes (server/, public/)
need `wrangler pages deploy`.

## What exists now (production)

3 published Samsung products, created 2026-11-05:

| Model | Colour | SKU | Variants |
|---|---|---|---|
| Galaxy S24 Ultra | Titanium Grey | SAM-S24U-TGRY | 256GB, 512GB |
| Galaxy S23 Ultra | Phantom Black | SAM-S23U-PHBK | 256GB, 512GB |
| Galaxy S25 | Navy | SAM-S25-NVY | 256GB, 512GB |

All variants are `price = 0`, `in_stock = 0` — **owner placeholders**. The owner
sets real prices/stock in the admin dashboard. Rendered as "R0 / Out of stock"
with Add to bag and Request disabled.

## Prices are WHOLE RAND, not cents

`variants.price` stores 29999 for R29,999. Writing cents is a 100x error.
The app's own `amount()` validator rejects `<= 0`, so zero prices can only be
written directly to D1, never through `/api/admin/products`.

## Photo keys must be flat

`GET /api/photos/<key>` accepts only `/^[a-zA-Z0-9_.-]{1,180}$/`.
No slashes. Keys look like `galaxy-s25-s25-01-back-box.webp`.

## Image size ceiling via SQL

D1 rejects statements above roughly 75KB with `SQLITE_TOOBIG`.
Hex-encoded blobs double in size, so photos are compressed to fit:
1000px/q72 normally, down to 700px/q46 for detailed flat-lays.
Uploading originals through the admin dashboard avoids this ceiling.

## Tools

- `tools/insert-photos-sql.py` — compress + insert photos into photo_blobs
- `tools/samsung-product-sql.py` — create product rows (phones + variants + details)
- Both require `--env production --allow-production --confirm`
- Full-size originals: `product-photos/samsung/<model>/*.jpg`
