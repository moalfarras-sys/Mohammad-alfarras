# Agent Guide: MoPlayer Classic Android

This folder is the classic Android TV app. It is not an independent product. It is connected to the public website, admin control center, Supabase-backed release/config data, and the separate MoPlayer Pro app.

## Ecosystem Context

- Product slug: `moplayer`.
- Android package: `com.mo.moplayer`.
- Public website/API: `../web`, deployed at `https://moalfarras.space`.
- Admin control center: `../admin`, deployed at `https://admin.moalfarras.space`.
- MoPlayer Pro sibling app: `../moplayer-pro-android`, slug `moplayer2`, package `com.moalfarras.moplayerpro`.
- Shared product slug metadata: `../../packages/shared`.
- Database migrations: `../../supabase/migrations`.

## What This App Owns

- Classic Android TV experience using XML/View-based Android UI.
- Live TV and player stability for the classic app.
- Sideload/play build flavors and classic release packaging.
- Integration with `WEB_API_BASE_URL`, defaulting to `https://moalfarras.space`.

## Critical Product Rules

- Do not rename this app to MoPlayer Pro.
- Do not change the package name or slug unless the public site, admin, database rows, and download metadata are updated together.
- Do not mix Pro activation/source handling into Classic unless shared APIs explicitly support both product slugs.
- QR source delivery is a fresh-session handoff only. The app may fetch a website-delivered source shortly after QR activation, save it locally, acknowledge it, and then stop polling until a new QR code is created.
- Classic may support legacy activation rows; Pro must remain explicitly `moplayer2`.

## Where To Edit

- Player stability: `app/src/main/java/com/mo/moplayer/ui/player`.
- Live TV behavior: `app/src/main/java/com/mo/moplayer/ui/livetv`.
- Retry/backoff helpers: `app/src/main/java/com/mo/moplayer/util`.
- Modern player engines: `app/src/main/java/com/mo/moplayer/ui/player/engine`.
- Background playback / MediaSession: `app/src/main/java/com/mo/moplayer/service/PlaybackService.kt`.
- Android TV home integration (Watch Next / Recommendations): `app/src/main/java/com/mo/moplayer/util/TvRecommendationHelper.kt`.
- Build/release config: `app/build.gradle.kts`.
- Release output guidance: root `../../docs/PRODUCTION_GUIDE.md`.

## Modern Skills Required

For Android, Gradle, LibVLC, permissions, lifecycle, TV navigation, and playback behavior, verify current Android/VLC/Media docs before changing architecture. Use IPTV/OTT Android TV practices: stable focus, clear loading/error/retry states, lifecycle-safe playback, and no stale retry callbacks after channel switching.

## Verification

Run from repo root:

```powershell
npm run verify:android:classic
```

Build when release packaging changed:

```powershell
apps/moplayer-android/gradlew.bat assembleSideloadDebug
```

If player behavior changed, test startup, live stream error, `EndReached`, fast channel zapping, back/home/PIP/background lifecycle, and remote focus restoration.

## Do Not Do

- Do not commit `build-output`, `.gradle`, `.kotlin`, generated APKs, keystores, or `local.properties`.
- Do not remove lifecycle guards or retry-token checks without replacing them with safer behavior.
- Do not add provider keys directly to the app when the public web API can proxy server-side data.

## Playback regression gates

Classic verification includes Lint and fails on errors. Run
`ANDROID_SERIAL=<device> node scripts/run-gradle.mjs classic connectedSideloadDebugAndroidTest`
for actual player/framework checks; the fixtures are local and contain no source
credentials. Own and release every initialized engine, fence load callbacks, and
announce a surface change before fallback preparation. Native VLC must signal
READY when Playing and never attach an already attached video layout twice.
Separate system Play/Pause from toggle actions. Pause visible video in onStop,
preserve explicit pause, and test both default VLC and the Media3 path.

`build-output` may contain stale reports copied from another workstation; verify
report timestamps and the new command result. Never claim zero issues merely
because abortOnError=false returned success. Primary evidence and narrow Lint
exceptions: `../../docs/_audit/CLASSIC_PLAYER_AUDIT_2026-11-07.md`.

Keep TV and Liquid motion constants aligned. Semantic font families have Arabic
alternatives; do not overwrite localized faces with Typeface.DEFAULT. Fixed digital
clock cells use Locale.ROOT digits. OFF/reduced/hidden/detached weather must not
restart a frame callback, and constrained TVs keep the lightweight path. Live
metadata is a real program title, not a duplicate Live badge; fence delayed guide
results by content/load owner. Visual tests wait for deferred Home chrome before
checking bounds and D-pad reachability.

Home is intentionally limited to latest movies, latest series and VOD resume.
All three populated shelves must fit together above the dock at each interface
size, in Arabic and English. Home uses its own compact holder/view type; never
share that holder with portrait library grids. Progress-only changes must update
the real Room-to-UI path without reloading covers, fading rows or stealing focus.
Keep Home's preview and weather layers hidden during D-pad browsing. Settings
horizontal controls must keep their neighbors in RTL and return to the category
rail only at the physical edge; hidden options cannot be focus targets.
