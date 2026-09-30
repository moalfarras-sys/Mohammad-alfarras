# Project Status

Last updated: 2026-09-30

## Production state

- Pull request [#36](https://github.com/moalfarras-sys/Mohammad-alfarras/pull/36) was merged into `main` as `1f30b1f0be14a2ad46231bd4cf47489e538ab920` (MoPlayer Pro 2.7.2 / code 71). The previous release, 2.7.1, came from [#35](https://github.com/moalfarras-sys/Mohammad-alfarras/pull/35) (`f8d1444`).
- GitHub Actions run `36777213065` (Next App CI on `main`) and the pull-request run `36777022305` passed.
- Vercel production deployments succeeded for the public site (`6770159388`) and admin (`6770167039`).
- Live checks returned HTTP 200 for `/en`, `/ar`, `/en/apps/moplayer2`, `/en/activate?product=moplayer2`, the config API and `admin.moalfarras.space`.
- Live MoPlayer Pro config now returns version `2.7.2`, version code `71`, 56,178,347 bytes and SHA-256 `8b5595ec…677a`, with `forceUpdate` false. The latest-download route answers 307 to the `moplayer-pro-v2.7.2` GitHub Release asset.
- In-app update verified on the Android TV emulator: 2.7.1 (from its GitHub Release) showed "Version 2.7.2 is available", downloaded and verified the APK, installed 2.7.2, and reopened with the new Interface size setting.
- The bilingual MoOS redesign is live. Its ISO remains unavailable in the live manifest because the configured Blob URL returns HTTP 403.

## MoPlayer Pro 2.7.2 changes

- Reported on a real TV after 2.7.1: the interface was too large and group names were cut off. Reproduced on the emulator by simulating 240 dpi, 400 dpi and a 1.3 system font scale.
- `ui/theme/TvDisplayScale.kt` lays the TV interface out on one grid on every TV (960x540dp design canvas widened by the viewer's interface size), and keeps the system font scale between 0.9 and 1.1. 240/320/400 dpi now render pixel-identically.
- New Settings > Look & Home > Interface size: Compact (1.25x grid), Standard (1.12x, default), Large (1.0x, the 2.7.1 look).
- Live and Movies/Series group rails are wider and use body-size text on up to two lines; a focused channel name that does not fit scrolls.
- Release APKs must be built with `:app:assembleRelease` alone (or `-PincludeX86Abis=false`): a debug task in the same Gradle run adds x86/x86_64 and doubles the universal APK.

## MoPlayer Pro 2.7.1 changes

- Merged "All playlists" library no longer crashes when two sources share a category id (source-qualified list keys, one row per id).
- Stored Xtream stream URLs are played with the account's current password; a changed password forces a full re-sync.
- Cached movie details are replayed after a library sync; re-imported M3U files become the active source again.
- QR activation keeps the website's 15-minute code deadline until a source is queued, uses a fresh device id per QR session, and deleting an account during its QR import clears the sealed source.
- The activation `status` and `confirm` APIs no longer return the device's `publicDeviceId`.
- The player keeps the screen on only while playing (Media3 and LibVLC).
- Provider "0" ratings are hidden, ratings keep one decimal, and double-escaped `\r\n` in plots become line breaks.

## Released artifacts

- GitHub Release: `moplayer-pro-v2.7.2`.
- Universal APK: 56,178,347 bytes, SHA-256 `8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a`.
- ARM64 APK: 34,940,701 bytes, SHA-256 `aae08c44a5dcbbe7aabf8e7359efbe654bab20a01002a2431bceb1bee07f478a`.
- ARMv7 APK: 31,222,268 bytes, SHA-256 `bbc84b316dff53eda8515f2df98fc75e31235ffcbaf39165a4e3a754f8808da3`.
- All APKs passed Android signature verification with certificate SHA-256 `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`.
- Previous: `moplayer-pro-v2.7.1` (universal SHA-256 `380e29c1…74fd6`).

## Verification completed

- `npm run verify:web` (typecheck, lint, build, 57 unit tests), `npm run verify:admin`, `npm run verify:moplayer-dashboard`: passed.
- MoPlayer Classic `testSideloadDebugUnitTest` and MoPlayer Pro `testDebugUnitTest` (401 tests for 2.7.2): passed. They were run with `gradlew.bat` directly because this shell does not search the current folder for executables.
- `:app:assembleRelease`: passed for MoPlayer Pro 2.7.2 / code 71 (ARM only).
- Emulator QA (Android TV API 36, real Xtream provider): playlist-link import with confirmation, sync, search, live 4K playback, CH+ zapping on a one-connection line, movie playback and seek, series episode playback and resume, merged library browsing, and an in-place signed upgrade 2.7.0 → 2.7.1 that kept accounts, history and focus.
- Known provider behaviour: empty DAZN "event slot" channels return an empty `.ts` body or an HLS list with an MKV placeholder; the player shows its error card with Next channel.
- No secret, token, database password, signing key, test IPTV credential, or generated APK was committed.

## Important current boundaries

- The connected Supabase project `xoogchspxkzojhdvlxpf` is reachable but does not contain `public.app_products`; production currently serves the verified release through code fallback metadata. Do not apply the repository migration history to that project without a separate reviewed database rollout and the correct database credentials.
- MoPlayer PC 1.0.4 is preserved and verified as a local candidate, but the public Windows feed remains at 1.0.3 until signed 1.0.4 installers are published.
- Do not enable the MoOS ISO until a replacement host passes HTTP 200, byte-range, exact-size, and SHA-256 checks.
- Physical Android/TV device smoke testing remains recommended for playback, remote focus, activation, updater, and lifecycle behavior (the emulator is x86_64, where LibVLC is disabled).

## Next recommended step

Provision or identify the intended production Supabase schema before enabling database-managed release operations, then publish signed MoPlayer PC 1.0.4 installers when the Windows signing/release pipeline is available.
