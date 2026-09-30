# Project Status

Last updated: 2026-09-30

## Production state

- Pull request [#35](https://github.com/moalfarras-sys/Mohammad-alfarras/pull/35) was merged into `main` as `f8d1444ffb1a65ddc2e7e9c040713bac4e023130`.
- GitHub Actions run `36770984855` (Next App CI on `main`) and the pull-request run `36770707753` passed.
- Vercel production deployments succeeded for the public site (`6769134929`) and admin (`6769116686`).
- Live checks returned HTTP 200 for `/en`, `/ar`, both MoPlayer Pro product pages, `/en/activate?product=moplayer2`, the config API and `admin.moalfarras.space` (login).
- Live MoPlayer Pro config and `/api/app/releases/latest` now return version `2.7.1`, version code `70`, 56,171,853 bytes and SHA-256 `380e29c1…74fd6`. The latest-download route answers 307 to the `moplayer-pro-v2.7.1` GitHub Release asset. MoPlayer Classic stays at `2.4.0` / `24`.
- In-app update verified on the Android TV emulator: the published 2.7.0 showed "Version 2.7.1 is available", downloaded and verified the APK, asked once for the install permission, installed 2.7.1 and kept the account and settings.
- The bilingual MoOS redesign is live. Its ISO remains unavailable in the live manifest because the configured Blob URL returns HTTP 403.

## MoPlayer Pro 2.7.1 changes

- Merged "All playlists" library no longer crashes when two sources share a category id (source-qualified list keys, one row per id).
- Stored Xtream stream URLs are played with the account's current password; a changed password forces a full re-sync.
- Cached movie details are replayed after a library sync; re-imported M3U files become the active source again.
- QR activation keeps the website's 15-minute code deadline until a source is queued, uses a fresh device id per QR session, and deleting an account during its QR import clears the sealed source.
- The activation `status` and `confirm` APIs no longer return the device's `publicDeviceId`.
- The player keeps the screen on only while playing (Media3 and LibVLC).
- Provider "0" ratings are hidden, ratings keep one decimal, and double-escaped `\r\n` in plots become line breaks.

## Released artifacts

- GitHub Release: `moplayer-pro-v2.7.1`.
- Universal APK: 56,171,853 bytes, SHA-256 `380e29c18757858f296e62cd3be93579ddc9cb9578fdacbaa39193e649974fd6`.
- ARM64 APK: 34,934,202 bytes, SHA-256 `e3bbd5d99318125b7db4e4a262498bde5933fa0337deacb633e8cf7899cf1be2`.
- ARMv7 APK: 31,215,776 bytes, SHA-256 `b60bd612d04b10d303cde35a7355577f225b627dc66a5993af30457ac84a2dd7`.
- All APKs passed Android signature verification with certificate SHA-256 `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`.

## Verification completed

- `npm run verify:web` (typecheck, lint, build, 57 unit tests), `npm run verify:admin`, `npm run verify:moplayer-dashboard`: passed.
- MoPlayer Classic `testSideloadDebugUnitTest` and MoPlayer Pro `testDebugUnitTest` (395 tests): passed. They were run with `gradlew.bat` directly because this shell does not search the current folder for executables.
- `:app:assembleRelease`: passed for MoPlayer Pro 2.7.1 / code 70.
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
