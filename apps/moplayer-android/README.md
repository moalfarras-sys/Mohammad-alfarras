# MoPlayer — `moplayer-android`

Production **Android / Android TV** client shipped as `com.mo.moplayer`. Gradle project name: **`MoPlayerapp`**.

- Open this folder in **Android Studio** (not `moplayer-pro-android` unless you need the Compose variant).
- Before AI-assisted edits, read [AGENTS.md](AGENTS.md). This app is connected to `apps/web`, `apps/admin`, `packages/shared`, and Supabase migrations.
- Releases: see repo [README.md](../../README.md) (`npm run release:moplayer`, `scripts/publish-android-release.mjs`).
- Build outputs go to `build-output/` (see `app/build.gradle.kts`).

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
