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
- Do not load provider/server credentials directly from Supabase tables. Pro source import must go through a fresh website QR handoff, save the source locally, acknowledge it, and then rely on local app storage plus the provider server.
- Do not add permissions unless the feature actually needs them and runtime request behavior is handled.

## Where To Edit

Paths below are under `app/src/main/java/com/moalfarras/moplayer/`.

- Player (split in 2.7.0; keep `PlayerScreen` itself small, it is near the API 23 ART verifier method-size limit noted in its comments):
  - `ui/player/PlayerScreen.kt`: the composable, remote keys, overlays wiring, zap coalescing, fallback chain.
  - `ui/player/Media3Session.kt`, `Media3Playback.kt`: one persistent ExoPlayer per player session (reused across zaps, stale events dropped by per-load media id), sources, LoadControl, IPTV retry policy, FFmpeg audio renderer factory, MediaSession.
  - `ui/player/LibVlcPlayerView.kt`, `VlcCore.kt`: LibVLC fallback; every native call runs on a serial worker, never on main.
  - `ui/player/PlayerPolicies.kt`, `PlaybackEnginePolicies.kt`: pure, unit-tested decisions (failure classification, retry/reconnect delays, zap keys, channel numbers, format swap, buffer sizing).
  - `ui/player/PlayerState.kt`, `PlayerOverlays.kt`, `NextEpisodeOffer.kt`: state holders and overlay UI.
- Main navigation/state: `ui/MainViewModel.kt` (+ pure helpers in `ui/MainPolicies.kt`), app shell in `MainActivity.kt` (Back goes through the OnBackPressedDispatcher once per key release).
- Sync: `data/repository/IptvRepository.kt`, `CatalogWriter.kt` (batched writes that keep favorites/progress), `XtreamSupport.kt`, `SyncErrors.kt` (typed, localized errors); streaming parsers in `data/parser` (`JsonStreamReader`, `M3uParser`, `XmltvStreamParser`).
- QR activation: `IptvRepository` activation functions + `data/repository/ActivationSupport.kt`, `DeviceStateStore.kt` (stable device id, sealed one-time source). Keep the QR-only credential rule below.
- Database: `data/db` (Room v9, FTS4 search via `SearchText`, whitelisted raw queries in `MediaQueries`). Never destructive migrations; export the schema.
- Updates and remote config: `core/UpdateManager.kt`, `data/repository/UpdateRepository.kt`, `AppRemoteConfigService.kt`.
- Strings: never add fields to `ui/i18n/Strings.kt`; each area has its own file (`PlayerStrings`, `HomeStrings`, `LoginStrings`, `SettingsStrings`, `SyncStrings`, `AppStrings`, `UpdateStrings`) with English and Arabic. Wrap LTR data in Arabic text with `ltr()`/`isolate()` from `ui/i18n/Bidi.kt`.
- TV/home UI: `ui/screens`, `ui/components` (`FocusGlow`, `TvTextField`, `Cards`, `Dock`), `ui/theme` (`TvScale`).
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
apps/moplayer-pro-android/gradlew.bat assembleDebug
```

If player behavior changed, test Media3 startup, LibVLC fallback, live stream error and retry, fast channel zapping, back/home/PIP/background lifecycle, Arabic error copy, and TV remote focus restoration.

## Do Not Do

- Do not commit `.gradle`, `.kotlin`, `app/build`, generated APKs, keystores, or `local.properties`.
- Do not remove Media3/LibVLC fallback protection without replacing it with tested behavior.
- Do not use Classic `moplayer` slug or package in Pro code.
- Do not expose Supabase service role keys or provider secrets in the app.
