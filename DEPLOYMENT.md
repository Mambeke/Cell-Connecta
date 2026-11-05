# Current controlled deployment and rollback

Updated 3 November 2026. **Read AGENTS.md, HANDOVER.md and PROJECT-STATE.json first.** This replaces the obsolete initial local-only/quota/cutover procedure. The premium application is live, the original backend is no longer needed, and migration 0001 is already applied.

> Current landing-page brand-removal release `2e6cc1d9-b20d-4bb7-a2bc-e07af3a5992f` is LIVE verified. No DB/config changes. For future releases reuse existing valid deployment access; do not demand creation of a new token for each change.

## Targets — never substitute a blank database

- Public site: https://cell-connecta.pages.dev
- Account: `01a943752f1069b93df5b328ce954d0f`; Pages project: `cell-connecta`; production branch: `main`.
- Original production D1: `4404a83f-be39-4cc3-afc6-f4bc421b4987`, `cellconnecta`, binding `DB`.
- Separate QA/staging D1: `4aec972c-3587-4859-98b6-e43bec209e0f`.
- Exact latest live deployment/evidence: PROJECT-STATE.json and checks/hero-release-results.json. Confirm live API metadata before proceeding.

## Existing state and safety gates

Migration `migrations/0001_premium_store.sql` was applied during the initial premium rollout. **Do not run it again, import a baseline schema, seed remote, reset production, or restore an old whole DB over current orders.** Frontend/navigation/style updates need zero DB writes/migrations.

Preserve all existing production/preview configurations, DB binding, OWNER_EMAILS/RESEND_API_KEY and other secrets, compatibility settings and `LEGACY_CATALOGUE_PROTECTED=true`. Keep the owner's Access policy enabled for old/hash URLs; canonical production must remain public. Do not delete history, unprotect legacy inventory/photo paths or change DNS/billing/unrelated projects.

## Reproducible frontend release

1. Checkpoint source and record the actual canonical deployment. Save a full read-only GET `/api/phones` catalogue baseline and restricted project-config snapshot. Configuration responses may contain secret values: chmod 600, never print/archive/publish them.
2. With Node 22+ and restored dependencies, run:

```bash
npm run check
npm run format:check
npm test
npm run build
node tests/categories.mjs
node tests/catalogue.mjs
```

Start the isolated local dev server first for the last command. Visually inspect desktop/mobile. The broad mutating E2E suite is for isolated QA only, not production. Keep its guards.

3. Build after final source changes. Prepare a fresh no-config upload directory:

```bash
npm run prepare:release -- /home/user/upgrade-backup/NEW-RELEASE/upload
```

The helper rejects existing/protected paths and stale bundles. It copies public assets, replaces public/_worker.js with the standalone build/_worker.js, replaces store/admin browser bundles and writes a checksum manifest outside public. It does not deploy/authenticate/change D1. Do not deploy an old generated artifact or the importing Worker without its server modules.

4. With an existing valid authorized scoped Cloudflare token supplied only to the deployment child process environment, run from that upload cwd:

```text
/path/to/shop/node_modules/.bin/wrangler pages deploy public --project-name=cell-connecta --branch=main --commit-dirty=true
```

The project-installed Node 22 binary must be on PATH if needed. Use only the public child as the upload directory; never upload backup/configuration/database directories. Do not persist token values in scripts/source/.env/logs. No migration or project PATCH is required. Running from the fresh no-config cwd avoids unintentionally applying the project’s production D1 config during upload.

5. Verify success and canonical ID via Pages metadata. Run:

```bash
SHOP_URL=https://cell-connecta.pages.dev node tests/categories.mjs
SHOP_URL=https://cell-connecta.pages.dev node tests/catalogue.mjs
```

Compare exact full catalogue and deployment configurations before/after, public assets to the artifact, canonical public accessibility, new hash redirect to Access, and unauthenticated admin API 401. Use only GET/read-only browser checks in production. Do not create fake live orders or mutate stock/customer data as a smoke test.

6. Update HANDOVER/PROJECT-STATE/README/current test evidence. Regenerate the portable source ZIP/report with current handover included. Secret-scan an allowlist of source/public fixtures/successful evidence; never include private config, credentials, local DB or real auth exports.

## Rollback

Prefer redeploying a retained, verified premium standalone upload artifact from the preceding release. It uses the existing DB and preserves current data/config. Do not drop additive cc_* tables or restore stale whole-database backups over newer orders. No rollback requires deleting history.

Do not blindly restore the old compatibility Worker: its upstream immutable deployment is now behind Access and can fail, and legacy inventory routes may bypass current draft/archive privacy. Any legacy rollback needs a reviewed Access/authentication/publication-freeze plan. Keep old hash protection enabled.

## Remaining integrations, not deployment blockers for style updates

Actual owner password/sign-in confirmation, verified recovery-email sender/delivery, real payment provider/server webhook, carrier and transactional order email remain separate owner configuration/verification tasks. Keep manual/unpaid order-request semantics explicit. A fake QA owner or browser success page is not proof of real authentication/payment.
