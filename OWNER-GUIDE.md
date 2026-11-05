# Cell Connecta owner guide

> **LIVE RELEASE UPDATE — 3 November 2026:** Premium deployment `ce8ff92c-e87a-49a7-8216-45c352c00360` is live at https://cell-connecta.pages.dev. The additive migration is applied to the original production DB. Existing inventory/account/session records were compared with the private full backup and preserved. All 26 pre-release hash/branch URLs were verified behind Access, and the new production hash is protected too. Product editing is unlocked with `LEGACY_CATALOGUE_PROTECTED=true`. Remote staging passed 19 workflows at all eight widths; production public/security smoke checks passed. Real-owner password login and external email/payment integrations remain unverified/unconfigured. Earlier local-only statements below are historical, superseded by this release update. See DEPLOYMENT-REPORT.md.

**These instructions apply to the live upgraded store at https://cell-connecta.pages.dev. Use your existing verified owner email and password; staging/local QA accounts are separate and do not belong to production.**

## Sign in

1. After deployment, open `https://cell-connecta.pages.dev/login`.
2. Use your existing verified owner email and existing password. There is no new public owner-registration process and no hardcoded production password.
3. Open **Owner dashboard** in the footer, or `/admin` directly.
4. If a session expires, sign in again and retry. Sign out when finished, especially on a shared device.

The deployment must preserve the existing `OWNER_EMAILS` allowlist. A verified database account with role `owner` is also required. Correct credentials alone do not turn an ordinary account into an owner.

Password recovery is unavailable until the deployment administrator configures an approved recovery-email sender and verifies actual delivery. The page explains this rather than pretending an email was sent. Once configured, recovery sends an expiring code, accepts a new password of at least 12 characters, and revokes existing sessions. Never share a recovery code.

## Add a product

1. **Inventory → + Add product**.
2. Enter the real brand, model, unique SKU, category, colour and condition.
3. Add the description and only verified specifications. Battery health and cosmetic grade are optional; leave unknown facts empty.
4. Add one or more variants with storage, price in rand and actual quantity. A previous price must genuinely exceed the current price.
5. Upload JPEG, PNG or WebP photos. The editor resizes uploads; each uploaded file must be under 1.5 MB. Up to 10 images are supported. Reorder with the image arrows and remove unwanted references before saving.
6. Keep **Publication → Draft** while preparing the listing. Choose **Published** when ready. Published products require an uploaded image and a valid variant.
7. Optionally tick **Feature this product on the homepage**. Save, then refresh and inspect the public listing.

Production product editing is now enabled after verified Access protection of older deployment URLs. Keep that Access application enabled. If an editing-lock warning appears later, contact the deployment administrator; do not create another owner account or bypass the safeguard.

## Edit, publish, unpublish or archive

Use inventory search and the status/brand/category/stock filters. Click **Edit**, change fields and save. Publication can be changed between Draft and Published. Refresh to confirm the persisted result.

**Archive** asks for confirmation and removes the product from the new public shop, search, sitemap and product route. It retains the record and IDs. Find it using the Archived status filter; edit it to restore an appropriate publication status. Archiving does not cancel existing orders or automatically restore allocated stock.

If another session has changed a product, a stale-write message appears instead of silently overwriting it. Refresh, review the latest values and retry. A failed save is not reported as success.

## Stock adjustments

1. Click **Stock** beside the product and choose the variant.
2. Select **Add units**, **Remove units** or **Set exact quantity**.
3. Enter quantity and a clear reason, then save.
4. Open **Stock history** to review before/after quantities and the actor/reason.

Negative results are rejected. Review pending/confirmed orders before manually reducing quantities. Avoid editing stock simultaneously through the legacy application after cutover.

## Orders

**Orders** shows unpaid order requests; **View order** opens customer/contact/delivery details and item snapshots.

- **Confirm** allocates the requested stock atomically. Confirmation fails if stock is no longer available. It does **not** charge the customer or mark an online payment received.
- **Fulfil** marks a confirmed order fulfilled after actual fulfilment.
- **Cancel** cancels a request; if stock was allocated, it is restored once. Repeating cancellation does not add stock again.

Contact the customer and arrange delivery/payment directly. Free Cape Town delivery is the verified policy; delivery outside Cape Town must be quoted. No gateway or order-confirmation email has been connected. Do not interpret a request receipt as proof of payment.

## Homepage and store content

Use **Store content** to edit/enable/disable the promotion, its internal shop/WhatsApp link, contact details and policy text. Featured products are managed from the product editor. Empty brands show honest sourcing/empty states, not invented inventory.

Verified starting policies: six-month certified refurbished warranty, two-month pre-owned warranty, three-day returns and free Cape Town delivery. Do not advertise a new offer unless you can honour it. Export inventory with **Export CSV**; bulk import is not available in this release.
