# Agent Guide: MoPlayer Classic Android

This folder is the classic Android TV app. It is not an independent product. It is connected to the public website, admin control center, Supabase-backed release/config data, and the separate MoPlayer Pro app.

## Ecosystem Context

- Product slug: `moplayer`.
- Android package: `com.mo.moplayer`.
- Public website/API: `../web`, deployed at `https://moalfarras.space`.
- Admin control center: `../admin`, deployed at `https://admin.moalfarras.space`.
- MoPlayer Pro sibling app: `../moplayer2-android`, slug `moplayer2`, package `com.moalfarras.moplayerpro`.
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
- Classic may support legacy activation rows; Pro must remain explicitly `moplayer2`.

## Where To Edit

- Player stability: `app/src/main/java/com/mo/moplayer/ui/player`.
- Live TV behavior: `app/src/main/java/com/mo/moplayer/ui/livetv`.
- Retry/backoff helpers: `app/src/main/java/com/mo/moplayer/util`.
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
