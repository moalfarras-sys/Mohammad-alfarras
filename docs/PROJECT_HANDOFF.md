# Project Handoff

This repository is a production monorepo for the public website, admin control center, Supabase-backed app metadata, and Android MoPlayer apps.

## Applications

- `apps/web`: public Next.js site for `moalfarras.space`, MoPlayer pages, activation, support, app config, and downloads.
- `apps/admin`: admin control center for `admin.moalfarras.space`.
- `apps/moplayer-android`: classic MoPlayer Android TV app.
- `apps/moplayer2-android`: MoPlayer Pro Android app.
- `packages/shared`: shared app product metadata and slug helpers.
- `packages/db`: server-side database helpers.
- `supabase/migrations`: ordered database migrations for production Supabase.

## Required Local Setup

Real secrets must stay in ignored local files:

- `apps/web/.env.local`
- `apps/admin/.env.local`
- Android `local.properties`

Never commit Vercel tokens, Supabase secret keys, database passwords, service role keys, or generated local env files.

Use `apps/web/.env.example` and `apps/admin/.env.example` as templates. Required web values include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOPLAYER_PROVIDER_ENCRYPTION_KEY`
- `ADMIN_ALLOWLIST`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_WEB_APP_URL`
- `NEXT_PUBLIC_ADMIN_APP_URL`

`DATABASE_URL` and `DIRECT_URL` are only needed for direct Postgres tooling. Use Supabase pooler/direct URLs with the real database password when running migrations or database scripts locally.

## Verification

Run these from the repository root before deploying:

```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run lint
npm --prefix apps/admin run build
```

For browser verification:

```powershell
npm --prefix apps/web run dev -- --port 3000
```

Then verify these routes:

- `/`
- `/en/apps`
- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2&code=MO-DEMO`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`

The download route may start a file download instead of rendering JSON; that is expected when a published release asset is available.

## Supabase

Project ref: `ckefrnalgnbuaxsuufyx`

Use the Supabase MCP plugin or Supabase CLI for project inspection, advisors, logs, and migrations. Recommended order for database work:

1. Inspect tables and migrations.
2. Run security/performance advisors.
3. Test SQL locally or through safe read-only queries first.
4. Create migrations with `supabase migration new <name>`.
5. Verify app routes and admin flows after applying changes.

Public client keys may be exposed to the browser. Secret keys and service role keys must only be used server-side.

Local migration history is expected to include the admin/AI/automation migrations through `20260524033521_widget_provider_secret_storage.sql`.

## Vercel

Expected domains:

- Public site: `https://moalfarras.space`
- Admin: `https://admin.moalfarras.space`

Deploy only after local verification succeeds. Production env vars should be configured in Vercel project settings, not committed to the repository.

Recommended deploy flow:

```powershell
npx vercel pull --yes --environment=production --token <token>
npx vercel build --prod --token <token>
npx vercel deploy --prebuilt --prod --token <token>
```

If using the Vercel plugin, inspect build logs and runtime logs after deployment.

## MoPlayer Pro Notes

The public product name is `MoPlayer Pro`, while the internal slug remains `moplayer2` for compatibility with URLs, API payloads, database rows, and Android integration.

Key routes:

- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`

Keep classic MoPlayer (`moplayer`) and MoPlayer Pro (`moplayer2`) release channels separate.

## 2026-06-01 MoPlayer Classic QA Notes

Classic Android TV work was verified on a local Android TV API 24 x86 emulator named `MoPlayer_Classic_API24_TV_720p`.

- Use JDK 17 for Classic Gradle commands. In this Windows workspace, a temporary Temurin JDK was used from `%TEMP%\codex-temurin17\jdk-17.0.19+10`.
- `npm run verify:android:classic` passed after the Classic fixes.
- `apps/moplayer-android/gradlew.bat assembleSideloadDebug -PincludeX86Abis=true` produced and installed `apps/moplayer-android/build-output/app/outputs/apk/sideload/debug/app-sideload-x86-debug.apk`.
- Manual QA imported an M3U playlist from `http://10.0.2.2:8765/test.m3u` served from a local Python HTTP server and played `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8` in Live TV.
- Verified paths: login method selection on 720p TV, M3U URL import, Home source-ready state, dock focus from Home to Live, Live category-to-channel focus, HLS playback startup, and logcat crash scan.
- `apps/moplayer-android/local.properties` is intentionally untracked and may contain a stale SDK path on this machine; Gradle can still build when `JAVA_HOME` and Android SDK env/path are set correctly.

## 2026-05-25 Admin/Web Release Notes

- Admin was simplified into a clean operations panel: website, offers, app runtime/releases/images/content, and AI inbox.
- Removed email center from the active admin navigation and hid activation/device/license/source/support management from the app pages so the visible admin surface stays focused on launch-ready essentials.
- Added website offers management in Website Control. Offers can be placed on home, services, apps, contact, or all main pages with banner/card/strip layouts.
- MoPlayer Pro public page now reads hero/logo/banner/gallery data from admin-managed app product and screenshot records instead of only hardcoded preview images.
- Added an internal admin helper widget that explains where to change images, offers, app runtime, releases, and AI items.
- Added field help popovers and larger mobile-friendly form controls for clearer Arabic-first admin use.
- Latest MoPlayer Pro APK currently present at `apps/web/public/downloads/moplayer2/app-release.apk`:
  - version: `2.5.11` (`versionCode` 49)
  - size: `49252567` bytes
  - SHA-256: `45ca5708f6e7cc6543ff0330bddb05c9ed516d2316241c2d48838ba62fe2e0c1`
  - notes: TV keyboard sign-in submit polish, valid Series category recovery, shorter unstable live fallback, and real Xtream QA for library sync, VOD, and episodic playback.
- Production deploy completed on 2026-06-01 for `moalfarras.space` and `admin.moalfarras.space`; production config, latest release, download redirect, and hosted APK hash all resolve to MoPlayer Pro `2.5.11`.

Verification completed before deployment:

```powershell
npm run verify:production
```
