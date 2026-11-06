# Production audit — 2026-11-05

## Scope and provenance

Repository: `moalfarras-sys/Mohammad-alfarras`. The existing checkout was 38 commits
behind `origin/main` and had extensive line-ending-only differences plus four
real local edits. It was preserved. Repairs were made in a separate worktree
on `fix/monorepo-audit-20261105`, based on `c717496e`.

The monorepo owns public Next.js web/APIs, independent Next.js administration,
Classic Android, Pro Android, Electron Windows, Flutter iOS, an optional Vite
dashboard, shared product/release metadata, server Postgres helpers and Supabase
migrations. MoOS's public static site and large-file delivery run independently
on Cloudflare Workers/R2. `moplayer` and `moplayer2` remain separate product IDs.

## Confirmed defects repaired

1. **Credential handoff race:** two simultaneous source polls could both return
   the same decrypted provider credentials. Receipt replacement is now a
   compare-and-set operation (Redis Lua or a conditional JSONB update). Only the
   winning request returns the source; errors cannot masquerade as successful
   removal. No provider URLs/passwords are added to persistent records.
2. **Silently ignored storage failures:** Supabase read/write/delete errors and
   Redis HTTP-200 error bodies could be accepted as success. Storage operations
   now propagate sanitized failures; code collisions remain retryable.
3. **Stale QR codes:** the Redis device-code index stores JSON strings, but was
   read as raw text. Replacement now decodes it, checks device/product/status,
   uses a product-specific index, and handles legacy Classic entries.
4. **Rate-limit lifetime race:** separate increment/expiry calls could leave an
   immortal counter. One Lua operation now increments, repairs missing TTL and
   returns TTL; responses include Retry-After and storage requests time out.
   The existing availability fallback remains best-effort when Redis is down.
5. **Admin sessions:** valid signatures alone did not re-check the current email
   allowlist, and future timestamps/extra token fields were accepted. Sessions
   now enforce current membership, token shape and bounded issue time.
6. **Reduced-motion hydration:** MoPlayer's hero returned different server/client
   wrapper trees, producing React error 418. Wrapper/initial-transform shape is
   stable, with motion disabled for reduced-motion viewers.
7. **Verification portability:** Android checks called Windows batch scripts on
   Linux. A shared launcher selects the OS wrapper; the Pro wrapper checksum is
   pinned. Flutter verification handles the app path containing spaces.
8. **Dependency advisories:** targeted patches update Next/eslint-config-next to
   16.4.5, Vitest/coverage to 4.1.12, Zod/Nodemailer/Puppeteer, Electron 42.11.18,
   Vite and affected transitive packages. The minimatch override is scoped to
   versions 7–10 so legacy v3/v5 API consumers are preserved. App and root locks
   are synchronized. Zero npm audit findings at verification time.

## Verification

| Area | Result |
| --- | --- |
| Clean workspace installation | `npm ci --ignore-scripts --no-audit` passed; platform installers are separate |
| Web | Types, ESLint, production build, 114 unit tests passed |
| Admin | Types, ESLint, production build, 11 authentication/database tests passed |
| Public browser QA | 32 production-build tests; Arabic/English, desktop/mobile, reduced motion, SEO, redirects, activation pages; screenshots inspected |
| Classic Android | 68 unit tests passed under JDK 17 |
| Pro Android | 401 unit tests passed under JDK 17 |
| Optional dashboard | Build passed |
| Windows source | Types, lint, Vite/Electron builds and HLS/range stream-proxy QA passed |
| Windows installers on Linux | Failed in host Wine (ntdll mapping/stack overflow); Windows CI packaging/startup added |
| Flutter | Formatting, analyzer and 6 tests passed with Flutter 3.47.4 |
| MoOS Worker/static site | 21 Worker tests, static export and eight public browser viewport/locale views passed |
| Native installs | No new TV-device, Windows-device or macOS/iOS installation claim is made |

`npm run verify:production` passed. This script covers web/admin/dashboard/Android;
Windows and Flutter are explicit additional gates. GitHub CI now covers Android,
Windows/Linux desktop, Flutter, web/admin tests and web browser journeys.

## Live delivery verified

22 public route/config/download probes succeeded. Complete downloaded files were
hashed, not just HEAD-checked:

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| Classic 2.5.1 | 53,237,761 | `210aba349a743437c6610bb6712ba78b719bd0bfc43389c2cbf966c909f3ea1c` |
| Pro 2.7.2 universal | 56,178,347 | `8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a` |
| Windows 1.0.4 installer | 115,551,141 | `95b7c32319b9465331d74812634546539922c150878996aefd662539516aa0ac` |
| MoOS .1046 ISO | 5,830,410,240 | `37053a88ae313f994875794055035d53134206a88eb44fb160b39fef3bb04821` |

The Windows updater feed's SHA-512 matches the installer. MoOS's detached ECDSA
signature verifies against the repository's pinned public key; full transfer,
initial/end ranges and a range above 4 GiB passed. No native artifacts were
replaced or republished during this source audit.

## Cloud accounts and production configuration

- Vercel authentication confirmed both projects and GitHub `main` integration.
  `mohammad-alfarras` uses `apps/web`; `moalfarras-admin` uses `apps/admin`; both
  use Node 24. Existing roots are unchanged. Old blocked-account deployment
  statuses are historical; November preview deployments succeeded.
- Cloudflare access confirmed account `73a194363e5c5d6d7556d177d6929c6f`.
  `moos-site` uses assets; `moos-downloads` binds private R2 `moos-releases`.
  Current Worker versions observed: site `1bbe00dc-c579-4015-ae82-af7a58c9fc93`,
  downloads `b322760e-4302-44d1-940d-3eb2f49913d1` (100%, October 14).
- DNS delegation is to registrar-servers.com; the absence of a Cloudflare DNS
  zone is expected. `www` aliases Vercel.
- Supabase access initially exposes only the original `moplayer` project
  `ckefrnalgnbuaxsuufyx`, which was INACTIVE. Its restoration was requested
  successfully; the completed recovery is recorded below. The other reference
  in the October handoff is outside the supplied token's permissions.
- Vercel Config values reveal stale direct-DB URLs to the original project;
  protected Secret values cannot be pulled. No secret values appear here.
- The request to remove `schnellsicher` was explicitly cancelled; nothing was
  deleted from Supabase or Vercel.

## Publication and remaining gates

Source publication, post-deploy smoke, restored database inspection and
Windows CI results are recorded below once complete. Authenticated admin CMS,
database schema/RLS and iOS cloud synchronization require a healthy, correctly
identified production database. Do not label these verified merely because
fallback pages return HTTP 200.

## Primary references and version assumptions

- [Next 16.4.5](https://github.com/vercel/next.js/releases/tag/v16.4.5) and
  [security advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr).
- [Next authentication/authorization](https://nextjs.org/docs/app/guides/authentication).
- [React hydration snapshot consistency](https://react.dev/reference/react/useSyncExternalStore)
  and [Motion reduced motion](https://motion.dev/docs/react-use-reduced-motion).
- [Redis atomic scripting](https://redis.io/docs/latest/develop/programmability/eval-intro/),
  [Upstash EVAL](https://upstash.com/docs/redis/sdks/ts/commands/scripts/eval),
  [Supabase conditional updates](https://supabase.com/docs/reference/javascript/update).
- [Android build JDK guidance](https://developer.android.com/build/jdks) and
  [Gradle wrapper checksums](https://docs.gradle.org/current/userguide/gradle_wrapper.html).
- [Vercel protected environment values](https://vercel.com/changelog/environment-variables-now-use-config-and-secret-types).
- [Supabase Management API](https://api.supabase.com/api/v1/) and official
  [OpenAPI source](https://github.com/supabase/supabase/blob/master/apps/docs/spec/api_v1_openapi.json).

This audit verifies the listed behavior and artifacts. It does not establish
that every third-party IPTV source, physical device or external integration is
working. Existing signing identities and released product versions are preserved.

## Database recovery completed

The original project is now ACTIVE_HEALTHY. Its existing data includes both app
products, 12 CMS pages, 9 services and 9 work projects; it was not an empty or
unrelated database. The pre-recovery release data stopped at Classic 2.4.0 and
Pro 2.5.24. Both current GitHub releases were inserted with the verified sizes
and hashes; superseded releases were unpublished, retained as history.

Reviewed migrations were transaction-tested with rollback before applying:
`20260605090000`, `20260615120000`, and the four `20261105213*` recovery migrations.
The existing iOS migration was already applied under timestamp `20260616080913`
and was not replayed. Expired legacy QR settings were removed; persistent
provider tables contained zero rows and legacy client writes were revoked.
The internal RLS event-trigger RPC no longer inherits PUBLIC execution. The
new download-count view uses caller permissions and is server-only; both actual
readers already use service-role clients. All public tables have RLS enabled.

Vercel web/admin Supabase settings now target the restored original project.
Public URLs/anon keys are Config; service keys remain Secret. The IPv6-only
direct connection failed locally; the official transaction pooler succeeded
with Supabase's official root CA and full certificate/hostname verification,
including a real write/read transaction that was rolled back. Shared DB code
now prefers DATABASE_URL, validates TLS and bounds connection waits. Two
regression tests cover URL precedence and certificate enforcement.

A restored CMS image referenced an unavailable unrelated storage host (HTTP
402). Its media row now uses the existing local Alhasakah website capture.
No project, bucket, site content collection or user account was deleted.

The Supabase advisor's remaining warnings concern anonymous-user policy review
and leaked-password protection. Anonymous sessions are used by the iOS design;
owner-scoped policies were inspected. They are not blanket public access.
macOS/iOS device sync still needs a device-level acceptance pass.

Additional references: [Supabase connection modes and TLS](https://supabase.com/docs/guides/database/connecting-to-postgres)
and the [official dashboard CA URL configuration](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json).
