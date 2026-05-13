# Production Guide

This guide is the operating manual for `moalfarras.space`, `admin.moalfarras.space`, MoPlayer Classic, and MoPlayer Pro.

## Product Rules

| Product | Public name | Internal slug | Android project | Download folder |
| --- | --- | --- | --- | --- |
| Classic | MoPlayer | `moplayer` | `apps/moplayer-android` | `apps/web/public/downloads/moplayer` |
| Pro | MoPlayer Pro | `moplayer2` | `apps/moplayer2-android` | `apps/web/public/downloads/moplayer2` |

Never rename the `moplayer2` slug. Only user-facing copy should say `MoPlayer Pro`.

## Activation Flow

Classic QR links:

```text
https://moalfarras.space/activate?code=MO-XXXX
```

Pro QR links:

```text
https://moalfarras.space/activate?product=moplayer2&code=MO-XXXX
```

Product-aware endpoints:

- `POST /api/app/activation/create`
- `GET /api/app/activation/status`
- `POST /api/app/activation/confirm`
- `POST /api/app/activation/source/test`
- `POST /api/app/activation/source`
- `GET /api/app/activation/source`

All create, confirm, status, source-send, source-pull, and queue reads must filter by product. Classic may read legacy rows where `product_slug` is `null`; Pro must only use `moplayer2`.

## Supabase

Project ref:

```text
ckefrnalgnbuaxsuufyx
```

Required migrations are in `supabase/migrations`. Production is expected to include migrations through:

```text
018_release_artifact_metadata_sync.sql
```

Use the Supabase service key only in server-side environments and local ignored files. Do not commit it.

## Vercel

| Project | Root | Domain |
| --- | --- | --- |
| `mohammad-alfarras` | `apps/web` | `moalfarras.space` |
| `moalfarras-admin` | `apps/admin` | `admin.moalfarras.space` |

Required production env on both projects:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
NEXT_PUBLIC_WEB_APP_URL
NEXT_PUBLIC_ADMIN_APP_URL
```

Required only on `mohammad-alfarras`:

```text
MOPLAYER_PROVIDER_ENCRYPTION_KEY
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_KEY
```

Admin auth env must remain configured:

```text
ADMIN_EMAIL
ADMIN_ALLOWLIST
ADMIN_PASSWORD_HASH
ADMIN_SESSION_SECRET
```

## Build And Test

Web:

```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
```

Admin:

```powershell
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run lint
npm --prefix apps/admin run build
```

Android:

```powershell
apps/moplayer-android/gradlew.bat testSideloadDebugUnitTest
apps/moplayer2-android/gradlew.bat testDebugUnitTest
```

## APK Publishing

Classic:

```powershell
cd apps/moplayer-android
.\gradlew.bat assembleSideloadRelease -PincludeX86Abis=true
```

Copy the production download into `apps/web/public/downloads/moplayer`:

- `app-sideload-universal-release.apk`

ABI split APKs are release-script outputs only. Do not commit them unless a
release entry explicitly needs separate ABI downloads.

Pro:

```powershell
cd apps/moplayer2-android
.\gradlew.bat assembleRelease
```

Copy `app-release.apk` into:

```text
apps/web/public/downloads/moplayer2/app-release.apk
```

Update Supabase release asset `file_size_bytes` and `checksum_sha256` after every APK rebuild.

## Browser Verification

Before deploy:

- `/ar/activate`
- `/en/activate`
- `/ar/activate?product=moplayer2`
- `/en/activate?product=moplayer2`
- `/api/app/releases/latest?product=moplayer`
- `/api/app/releases/latest?product=moplayer2`
- `/api/app/download/latest?product=moplayer`
- `/api/app/download/latest?product=moplayer2`
- Admin product switcher for releases, activation requests, devices, source queues, runtime config, and support.

After deploy:

- `https://moalfarras.space`
- `https://www.moalfarras.space`
- `https://admin.moalfarras.space`
- Classic QR activation creates and confirms a Classic device.
- Pro QR activation creates and confirms a Pro device.
- Website source delivery reaches the Android app and is acknowledged.

## Clean Repo Rules

- Keep generated output out of git: `.next`, `build`, `.gradle`, `output`, screenshots, dumps, and local env files.
- Keep release APKs only in the public download folders that are intentionally served.
- Do not commit local passwords, Supabase service keys, Vercel tokens, keystores, or `local.properties`.
- If a file looks old, first confirm it is not imported, routed, or referenced by Gradle/Next before deleting it.
