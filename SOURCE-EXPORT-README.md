# Current premium source export — transfer this ZIP, not only the handover

Date: 5 November 2026. Live release reconfirmed read-only: `2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f`.

## Actual export location

`/home/user/Cell-Connecta-Export-20261105/Cell-Connecta-Premium-Source.zip`

Alongside it:
- `Cell-Connecta-Premium-Source.sha256` — the ZIP's actual SHA-256.
- `Cell-Connecta-Premium-Source-Verification.json` — exact ZIP byte size, digest, entry count, and required-file byte sizes/hashes.

**The owner must download the ZIP itself and upload it to the new agent/workspace.** Opening only the Markdown handover does not transfer application files. No automatic cross-workspace transfer or permanent external download URL is claimed.

Verify before extracting:

```bash
sha256sum -c Cell-Connecta-Premium-Source.sha256
unzip -t Cell-Connecta-Premium-Source.zip
unzip Cell-Connecta-Premium-Source.zip
cd Cell-Connecta-Premium
```

## Reject the stale archive

A restored older `/home/user/Cell-Connecta-Premium-Source.zip` had **21,965,019 bytes**, **118 entries**, and actual SHA-256 `0e6524da2bd52b1edd8de159c01060a2279f45d6c6510f58e204ce343715a227`. It lacked PROJECT-STATE.json and held old browser assets. Its saved `.sha256` did not match. **That archive is not the current release and is not being delivered.**

## Recovery/provenance

- Editable server modules, tests, scripts, guides and evidence remained in `/home/user/shop`. Core/API/order/recovery/data modules also match the private pre-last-change checkpoint. The current render source removes Shop by brand and includes the latest header/shop changes.
- Recovered the following current public assets directly from canonical production, **exact bytes retained**:

| File | Bytes |
|---|---:|
| public/cc-assets/store.css | 96,045 |
| public/cc-assets/store.js | 22,352 |
| public/cc-assets/admin.js | 42,785 |
| hero-iphone-collection.webp | 161,284 |
| hero-samsung-collection.webp | 204,996 |
| hero-laptop-collection.webp | 207,726 |
| hero-accessories-collection.webp | 262,658 |

The browser modules are readable production-bundled ESM. Store JS includes `initShopSidebar` and the required admin-facing exports. Both parse and bundle successfully. They are intentionally not reformatted so per-file hashes can match the current served versions exactly.

The exact latest-release standalone Worker upload was not present in this restored filesystem. Older checkpoint artifacts were NOT substituted for it. No unverified remote Worker/CI download is claimed. Current editable backend source is included directly, not reconstructed from the old public repository.

Includes `server/`, `public/`, `tests/`, `scripts/`, successful `checks/`, `migrations/`, package manifests, current guides/state and `SOURCE-EXPORT-MANIFEST.json` containing every packaged source-file size and digest.

Excludes credentials/tokens, private checkpoints/project snapshots, local databases/D1 state, customer/auth exports, dependencies and generated build caches. Exporter: `scripts/export-source.py`. The exporter performs a credential-pattern scan and validates canonical public-asset hashes before writing the ZIP.

Current export checks: 15-module syntax, 36 unit tests and production build pass. Extracted-source tests and final archive CRC/checksum are recorded in the verification sidecar. Historical browser evidence remains separately dated; no new production deploy, database write or config change was made for export.
