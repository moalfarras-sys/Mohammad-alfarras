# MoPlayer — `moplayer-android`

Production **Android / Android TV** client shipped as `com.mo.moplayer`. Gradle project name: **`MoPlayerapp`**.

- Open this folder in **Android Studio** (not `moplayer-pro-android` unless you need the Compose variant).
- Before AI-assisted edits, read [AGENTS.md](AGENTS.md). This app is connected to `apps/web`, `apps/admin`, `packages/shared`, and Supabase migrations.
- Releases: see repo [README.md](../../README.md) (`npm run release:moplayer`, `scripts/publish-android-release.mjs`).
- Build outputs go to `build-output/` (see `app/build.gradle.kts`).

## 2.5.1 fixes (2026-10-04)

Version `2.5.1` / code `26`, GitHub Release `moplayer-android-2.5.1`, universal APK 53,237,761 bytes, SHA-256 `210aba34...f3ea1c`, same certificate. Parental "Lock adult content" now hides adult groups (`ParentalLockManager.filterAdultCategories`) in Live/Movies/Series; Live TV header shows the category total; the guide card hides without guide data; the preview channel number matches by id; offline weather no longer invents values; the duplicate `player_settings` DataStore in `SettingsViewModel` is gone. Verified with an in-place signed upgrade 2.5.0 -> 2.5.1 on the Android TV emulator.

## 2.5.0 TV UI and real-server pass (2026-10-04)

Version `2.5.0` / code `25`, GitHub Release `moplayer-android-2.5.0`, universal APK 53,238,825 bytes, SHA-256 `48cdbda2...80f2eb`, signed with the same certificate as 2.4.0 (`97dad776...593d`).

- `util/DisplayScale.kt` is applied in every Activity's `attachBaseContext`: TVs get one 960x540dp grid (widened by Settings > Interface > Interface size), phones in landscape shrink to fit, the system font scale is clamped to 0.9-1.1, and the in-app language (system / English / Arabic) is applied there. Code outside an Activity must use `DisplayScale.localized(context)` for strings.
- `res/font/*.ttf` were all JetBrains Mono copies before 2.5.0; they are now the real DM Sans / Outfit / JetBrains Mono files.
- Poster grids use `ui/common/AutoFitGridLayoutManager` + `AspectRatioFrameLayout` (2:3); cards fill their cell via `PosterCardSizing.fitGridCell`.
- Live TV: list rows use `LiquidGlassTokens.LIST_ROW_FOCUS_SCALE`; the overlay only auto-hides over a playing channel; the preview never starts on one-connection accounts while a channel plays; on the first failure `IptvRepository.checkActiveAccount()` tells rejected / expired / connection-limit apart and stops the retries with a clear message.
- Activation never shows a locally invented code, retries creation with backoff, renews expired/invalid codes, and rotates the pull token per QR session. The website `epgUrl` (or the playlist `url-tvg` header) is stored encrypted in `CredentialManager` and imported by `data/epg/XmltvEpgRepository` for M3U sources.
- Ratings are stored on a 10-point scale and provider plots are cleaned; the first launch after updating from an older version runs one forced library sync (`MoPlayerApp.refreshLibraryAfterUpdate`).
- QA on 2026-10-04 with a real Xtream line (13,093 channels, 20,586 movies, 10,839 series, one connection): Android TV API 36 1080p at 320 and 240 dpi, Android TV API 24 720p, phone API 35 landscape; Home, Live (zapping, one-connection behaviour, error messages), Movies, Series, player, Search, Settings, Arabic RTL, website QR activation with a public test playlist, and an in-place signed upgrade 2.4.0 -> 2.5.0 that kept the source and library.

## 2.3.0 Classic TV polish handoff

Version `2.3.0` / code `23` is a scoped MoPlayer Classic pass. Keep future edits inside this module unless a shared dependency is truly required.

- Premium TV theme: focused cards now use dark cyan glass states instead of bright white focus fills; keep focus clearly visible on 720p TVs.
- Settings: app updates have a dedicated `App update` panel. It reads `moplayer` release metadata from `moalfarras.space`, blocks accidental downgrade when a local/debug build is newer than published, validates APK size/SHA-256 after download, and opens the installer/download link.
- Performance: live channel lists load in windows, image preload queues are device-tier aware, RecyclerView pools are smaller on low-end boxes, and focus animation allocation was reduced.
- Player: live playback has a token-safe open watchdog, three bounded retries, stale retry protection, source-aware error copy, Back/Retry actions, and lifecycle cleanup for background/foreground and channel switching.
- Startup/StrictMode: debug builds enable StrictMode after app bootstrap; known startup disk reads for config/background/activation state were moved off the main thread.
- QA evidence for the 2.3.0 pass was captured outside the repo / local ignored artifacts under `artifacts/moplayer-classic-qa-20260620` and the prior `C:\Users\Moalf\Desktop\MoPlayerClassic-QA-20260619` folder when available.

Publishing note: the universal Classic APK is about 50.4 MiB. Supabase Storage rejected the universal upload during this pass with `The object exceeded the maximum allowed size`, so 2.3.0 was published by replacing the existing tracked static website APK assets under `apps/web/public/downloads/moplayer/` and then publishing Supabase release metadata with `--externalUrl`. This keeps one recommended universal TV APK for both `arm64-v8a` and old `armeabi-v7a` devices.

```powershell
node scripts/publish-android-release.mjs --version 2.3.0 --versionCode 23 --apk <release-apk> --abi universal --primary --externalUrl /downloads/moplayer/app-sideload-universal-release.apk --notes "..."
```

Production verification on 2026-06-20:

- `https://moalfarras.space/api/app/config?product=moplayer` reports `latestVersionName=2.3.0`, `latestVersionCode=23`, size `52817551`, and SHA-256 `ff259fa8f03dadc079af2606e7cc0bcd4ce41290e62516c3572ecdc9931c5e49`.
- `https://moalfarras.space/api/app/download/latest?product=moplayer` redirects to `/downloads/moplayer/app-sideload-universal-release.apk`.
- API 24 Android TV emulator update panel shows `You are on the latest published version: 2.3.0`.

**Pair:** `moplayer-pro-android` is the separate `com.moalfarras.moplayerpro` line — see [../moplayer-pro-android/README.md](../moplayer-pro-android/README.md).
