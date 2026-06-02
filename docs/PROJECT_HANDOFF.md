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

## 2026-06-02 MoPlayer Pro Performance Pass

Investigated the "very slow / not smooth / freezes" reports for MoPlayer Pro on a local
Android TV API 24 x86 emulator (the running `emulator-5554`). Baseline `dumpsys gfxinfo`
showed **100% janky frames** while browsing Live TV, and an idle screen (no input) was still
rendering ~40 fps continuously — the app never settled.

Root causes and fixes (all scoped to `apps/moplayer2-android`):

- **Ungated infinite animations were the main culprit.** Several `rememberInfiniteTransition`
  blocks were created unconditionally and only gated their *value* (e.g. `if (animate) raw else 0f`).
  The transition kept posting a frame every vsync forever, so the whole screen repainted ~40×/s
  even at rest. Fixed by only constructing the transition when motion is enabled in:
  `ui/screens/MediaScreens.kt` (live receiver pulse), `ui/screens/HomeScreen.kt` (home breathe,
  assistant sheen, hero-match pulse, World Cup countdown pulse), `ui/components/WeatherClockWidget.kt`
  (weather glyph spin/fall/flash), and `ui/components/AtmosphericBackground.kt` (aurora drift).
- **Performance policy is now TV-aware** (`core/Adaptive.kt`): on a television that is not a
  high-end box, `BALANCED`/`AUTO` now sets `reduceMotion=true` and disables the ambient particle
  canvas + focus-driven backdrop reloads. Phones, tablets, and high-end TV boxes are unchanged.
- **Network stalls no longer freeze the app for minutes** (`data/network/NetworkModule.kt`):
  the shared OkHttp read timeout dropped from 5 min to 45s (90s for M3U playlists) and the call
  timeout from 10 min to 8 min. `readTimeout` is the gap between bytes, so healthy large library
  syncs and video segments are unaffected; only a server that connects then stalls now fails fast.
- **Live channels recover faster from dead streams** (`ui/player/PlayerScreen.kt`): Media3 live
  segment retries reduced from 12 (~55s of frozen video) to 6 (~18s) before the app-level
  alternative-quality / LibVLC fallback takes over.

Verified results on the same emulator (idle frame count is GPU-independent, so it is the clean
before/after signal):

- Live TV idle: **210 → 11 frames / 5s**. Home idle: **218 → 6 frames / 6s** (app now reaches rest).
- `npm run verify:android:pro` (`testDebugUnitTest`): **44 tests, 0 failures**.
- `assembleRelease -PincludeX86Abis=true` succeeds (R8 + lintVital pass), so the changes ship cleanly.
- No new permissions, no crashes in logcat, all home/live widgets still render (motion just rests).

Notes for the next machine: `apps/moplayer2-android/local.properties` had a stale `sdk.dir`
(`C:\Users\Moalfarras\...`); corrected to the real SDK path for this box. That file stays
untracked. Version was left at `2.5.12` (`versionCode` 50) — bump and rebuild a signed release
only on an explicit publish request.

### Subscription expiry + library robustness (same pass)

A separate emulator account had expired mid-session, and a background refresh against the
expired panel had wiped the whole cached library — the app showed an empty Home with a stale
"add an account" message and no explanation. Fixes:

- **A refresh that returns nothing can no longer erase a cached library** (`data/db/MoPlayerDatabase.kt`):
  `replaceServerContent`/`replaceServerContentTypes` now skip the destructive delete when the
  incoming media list is empty but content already exists, and just refresh account/status. This
  protects every login type (Xtream full + incremental, M3U) from an expired/erroring panel.
- **Expired subscriptions are surfaced clearly** (`domain/model/Models.kt` `subscriptionInactive`,
  `ui/MainViewModel.kt`, `ui/screens/SearchSettingsScreens.kt` `SubscriptionExpiredDialog`,
  `MainActivity.kt`, `ui/i18n/Strings.kt`): when the active account reports Expired/Banned/Disabled
  (or a past expiry date), a localized (EN/AR) "Subscription expired" dialog appears over the kept
  cache with **New sign-in** (removes the account → login screen for a fresh subscription) and
  **Later** (dismiss per-account, keep browsing the cache).
- **Home no longer says "Library is empty" while the first sync is still running**
  (`ui/screens/HomeScreen.kt` + `Strings.kt`): the empty card now shows a localized
  "Loading your library…" while a sync is in flight, and an accurate "refresh / sign in with
  another source" message otherwise.

Verified end-to-end on the emulator with a real provider M3U-plus URL (entered through the on-screen
keyboard via `adb input tap` + `input text`):

- Library synced **12,489 live + 19,903 movies + 10,396 series + 235 categories (~42.8k items) in ~24s**;
  Home shelves, Live categories, channel logos, and EPG all rendered.
- Stream URLs resolve to valid HLS manifests (confirmed reachable from the host with real `.ts`
  segments). Live playback errors on this API-24 **x86** emulator are the software decoder failing on
  real HEVC/high-bitrate broadcast feeds (LibVLC is intentionally disabled on x86), not an app fault —
  the new fast-fail surfaces Retry/Internal/MX/External quickly instead of a ~55s freeze.
- Simulated an expired account → the localized dialog appeared over the preserved library and
  **New sign-in** routed back to the login screen.
- `testDebugUnitTest`: **49 tests, 0 failures** (added `ServerProfileSubscriptionTest`). Signed
  `assembleRelease` passes R8 + lintVital.

### Recomposition + huge-panel pass (same day)

Pushing toward "best-in-class on huge panels":

- **`@Immutable` on the hot domain models** (`domain/model/Models.kt`: `MediaItem`, `Category`,
  `AppSettings`, `WeatherSnapshot`, `FootballMatch`, `ServerProfile`, `EpgEntry`, `LiveEpgSnapshot`;
  `core/Adaptive.kt`: `PerformancePolicy`, `DevicePerformanceInfo`). These are already all-`val`
  data classes recreated fresh from Room/DataStore, so the annotation is safe and lets Compose skip
  recomposition of the lazy grids/shelves when their inputs are unchanged.
- **Streaming JSON for the Xtream sync** (`data/repository/IptvRepository.kt` `rawPlayerElement`):
  the `get_*_streams` responses are now parsed straight off the network buffer with
  `Json.decodeFromStream` instead of materializing the whole multi-MB body as a `String` first,
  roughly halving peak memory during the big live/VOD/series fetches on low-RAM boxes.

Re-verified on the emulator against the real provider: full library re-synced through the streaming
parser (**12,489 live + 19,903 movies + 10,396 series**) with no `SerializationException`; Home,
Movies, and a Series detail (JUJUTSU KAISEN → **3 seasons / 59 episodes** via `get_series_info`,
with poster + Arabic description) all rendered with no crash. All login methods (M3U, Xtream, QR
activation) converge on the same `startBackgroundLibraryRefresh` → Xtream sync, so metadata
(expiry, posters, ratings, descriptions, seasons/episodes) is fetched regardless of entry point;
pure non-Xtream M3U playlists are still limited to whatever the playlist itself carries.

Still open (intentionally not done this pass): a generated **Baseline Profile** (needs a
macrobenchmark module + a profileable run — the single biggest remaining cold-start win), reusing
one `ExoPlayer` instance across live channel zaps instead of rebuilding (faster zapping, but it
touches the carefully-tested Media3/LibVLC fallback so it needs its own QA), and removing the
~450 lines of dead atmospheric-weather/widget code (R8 already strips it, so source-clarity only).

### Cold-start polish from the real-device test tour

A "play as a user" pass (data persists across force-stop/restart: the 12,489/19,903/10,396 + 59
episodes and the active account all reload from Room, no re-sync) surfaced two short-lived but
jarring flashes, both fixed and included in the released build:

- **No more sign-in flash on cold start** (`MainViewModel` `initialized` flag + `MainActivity`):
  the router now shows a brief themed splash spinner until the saved servers/settings are read from
  disk, instead of flashing the sign-in screen for a fraction of a second before Home loads.
- **No more "Library is empty" flash on Movies/Series** (`ui/screens/MediaScreens.kt` `PosterGrid`):
  the grid now shows the localized "Loading your library…" copy while paging's first load is in
  flight, and only the real empty/refresh message once it settles.

### Released MoPlayer Pro 2.5.13 to production

Bumped `apps/moplayer2-android/app/build.gradle.kts` to `versionName 2.5.13` / `versionCode 51`
and built a signed `assembleRelease` universal APK. `apksigner` confirmed the new APK carries the
**same signing certificate** as the live 2.5.12 (`97dad776…`), so it installs as an update.

- APK: `49256351` bytes, SHA-256 `31e5648b5841182394f3b9bad96f779bdf475a014072ff1f18caf59b0e9af249`.
- Published through the same Supabase-backed path the admin uses (no Vercel token was needed because
  `/api/app/*` reads the database live): uploaded the APK to the public `app-releases` storage bucket
  (`moplayer2/app-release-2.5.13.apk`), inserted an `app_releases` row
  (`6258f0df-3baf-470d-ad7a-e1f0d4cdb8aa`, `is_published=true`, newest `published_at`) and an
  `app_release_assets` row pointing at the public storage URL. Both inserts are additive — the old
  2.5.12 rows are untouched, so a rollback is just flipping the new row's `is_published` to false.
- Verified live: `…/api/app/releases/latest?product=moplayer2` and `…/api/app/config?product=moplayer2`
  now report `2.5.13 / 51`, and `…/api/app/download/latest?product=moplayer2` follows through to the
  storage APK (HTTP 200, `49256351` bytes, `application/vnd.android.package-archive`).
- Also refreshed the version-controlled mirrors (the `app-ecosystem.ts` static fallback, the static
  `apps/web/public/downloads/moplayer2/app-release.apk`, and `docs/android-projects.md`). Those only
  matter on the next `apps/web` Vercel deploy / when the DB has no published row, so they are not
  required for users to receive 2.5.13 — the DB+storage publish above is what is live.

## 2026-06-01 MoPlayer Classic QA Notes

Classic Android TV work was verified on a local Android TV API 24 x86 emulator named `MoPlayer_Classic_API24_TV_720p`.

- Use JDK 17 for Classic Gradle commands. In this Windows workspace, a temporary Temurin JDK was used from `%TEMP%\codex-temurin17\jdk-17.0.19+10`.
- `npm run verify:android:classic` passed after the Classic fixes.
- `apps/moplayer-android/gradlew.bat assembleSideloadDebug -PincludeX86Abis=true` produced and installed `apps/moplayer-android/build-output/app/outputs/apk/sideload/debug/app-sideload-x86-debug.apk`.
- Manual QA imported an M3U playlist from `http://10.0.2.2:8765/test.m3u` served from a local Python HTTP server and played `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8` in Live TV.
- Verified paths: login method selection on 720p TV, M3U URL import, Home source-ready state, dock focus from Home to Live, Live category-to-channel focus, HLS playback startup, and logcat crash scan.
- Real Xtream QA was also run against a provider source. The app synced 12,472 live channels, 19,417 movies, 9,782 series, and 232 categories; Home posters rendered after the image proxy/Glide fix; Home now shows remaining subscription time; Live TV remote focus was tightened so a channel can open even when Android TV focus recovery loses the focused row. A stale sync-state row with `totalSeries=0` was repaired from the actual Room table counts.
- Classic `2.2.12` (`versionCode` 18) was built with `assembleSideloadRelease` for production ARM devices. The public APK at `apps/web/public/downloads/moplayer/app-sideload-universal-release.apk` is `52746532` bytes with SHA-256 `67b0fa3b55ca05e1ff7ea380b91c47d46d32748325669cb557a1b85487c305f7`.
- `apps/moplayer-android/local.properties` is intentionally untracked and may contain a stale SDK path on this machine; Gradle can still build when `JAVA_HOME` and Android SDK env/path are set correctly.

## 2026-05-25 Admin/Web Release Notes

- Admin was simplified into a clean operations panel: website, offers, app runtime/releases/images/content, and AI inbox.
- Removed email center from the active admin navigation and hid activation/device/license/source/support management from the app pages so the visible admin surface stays focused on launch-ready essentials.
- Added website offers management in Website Control. Offers can be placed on home, services, apps, contact, or all main pages with banner/card/strip layouts.
- MoPlayer Pro public page now reads hero/logo/banner/gallery data from admin-managed app product and screenshot records instead of only hardcoded preview images.
- Added an internal admin helper widget that explains where to change images, offers, app runtime, releases, and AI items.
- Added field help popovers and larger mobile-friendly form controls for clearer Arabic-first admin use.
- Latest MoPlayer Pro APK currently present at `apps/web/public/downloads/moplayer2/app-release.apk`:
  - version: `2.5.12` (`versionCode` 50)
  - size: `49253817` bytes
  - SHA-256: `1e8d9bd4ee4cae45a6164269dd102fc7905479285e01ecb44f661f45910374d5`
  - notes: poster/logo image restore on older Android TV devices, visible Home subscription expiry/connection data, TV keyboard sign-in submit polish, valid Series category recovery, shorter unstable live fallback, and real Xtream QA for library sync, VOD, and episodic playback.
- Production deploy completed on 2026-06-01 for `moalfarras.space` and `admin.moalfarras.space`; production config, latest release, download redirect, and hosted APK hash all resolve to MoPlayer Pro `2.5.12`.

Verification completed before deployment:

```powershell
npm run verify:production
```
