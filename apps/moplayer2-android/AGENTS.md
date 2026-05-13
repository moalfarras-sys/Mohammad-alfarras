# Agent Guide: MoPlayer Pro Android

This folder is the MoPlayer Pro Android/Android TV app. It is not an independent product. It is connected to the public website, admin control center, Supabase-backed activation/config/release data, and the classic MoPlayer app.

## Ecosystem Context

- Product slug: `moplayer2`.
- Public product name: **MoPlayer Pro**.
- Android package/applicationId: `com.moalfarras.moplayerpro`.
- Public website/API: `../web`, deployed at `https://moalfarras.space`.
- Admin control center: `../admin`, deployed at `https://admin.moalfarras.space`.
- Classic sibling app: `../moplayer-android`, slug `moplayer`, package `com.mo.moplayer`.
- Shared product slug metadata: `../../packages/shared`.
- Database migrations: `../../supabase/migrations`.

## What This App Owns

- MoPlayer Pro Android TV first experience using Kotlin and Jetpack Compose.
- Media3/ExoPlayer playback with LibVLC fallback where needed.
- Activation QR/code flow that talks to `https://moalfarras.space/activate?product=moplayer2`.
- Runtime config, provider source handling, playlist parsing, widgets, and TV/mobile UI.

## Critical Product Rules

- Keep slug `moplayer2` in API calls, database rows, release metadata, and BuildConfig.
- UI may say **MoPlayer Pro**; code paths must not switch to `moplayer-pro` unless shared slug mapping supports it.
- Do not share Classic package names, release assets, or activation assumptions.
- Do not add permissions unless the feature actually needs them and runtime request behavior is handled.

## Where To Edit

- Player and fallback behavior: `app/src/main/java/com/moalfarras/moplayer/ui/player/PlayerScreen.kt`.
- Main navigation/state: `app/src/main/java/com/moalfarras/moplayer/ui/MainViewModel.kt`.
- Playlist/source parsing: `app/src/main/java/com/moalfarras/moplayer/data/parser`, `app/src/main/java/com/moalfarras/moplayer/data/repository`.
- Network models: `app/src/main/java/com/moalfarras/moplayer/data/network`.
- TV/home UI: `app/src/main/java/com/moalfarras/moplayer/ui/screens`, `app/src/main/java/com/moalfarras/moplayer/ui/components`.
- Build/version/API config: `app/build.gradle.kts`.

## Modern Skills Required

For Kotlin, Compose, Android TV, Media3/ExoPlayer, LibVLC, Gradle, permissions, and Play readiness, verify current Android Developers and relevant library release notes before changing architecture. Use IPTV/OTT product practices: predictable remote focus, stable player state, clear retry/error overlays, fast zapping, lifecycle-safe playback, and Arabic/RTL-safe text.

## Verification

Run from repo root:

```powershell
npm run verify:android:pro
```

Build when release packaging changed:

```powershell
apps/moplayer2-android/gradlew.bat assembleDebug
```

If player behavior changed, test Media3 startup, LibVLC fallback, live stream error and retry, fast channel zapping, back/home/PIP/background lifecycle, Arabic error copy, and TV remote focus restoration.

## Do Not Do

- Do not commit `.gradle`, `.kotlin`, `app/build`, generated APKs, keystores, or `local.properties`.
- Do not remove Media3/LibVLC fallback protection without replacing it with tested behavior.
- Do not use Classic `moplayer` slug or package in Pro code.
- Do not expose Supabase service role keys or provider secrets in the app.
