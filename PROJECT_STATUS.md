# Project Status

Last updated: 2026-09-30

## Production state

- Pull request [#34](https://github.com/moalfarras-sys/Mohammad-alfarras/pull/34) was merged into `main` as `a37b213f8b3940a8e22b6ae65b90919b0846f04d`.
- GitHub Actions run `36684848378` passed the web, admin, dashboard, MoPlayer Classic Android, and MoPlayer Pro Android jobs.
- Vercel production deployments succeeded for the public site (`GSNzD18RyLKB4wANfKjVKz7xs3iC`) and admin (`5QYLAvp7pb7bvcFpUG1uFGfmsxeN`).
- Live checks returned HTTP 200 for `/en`, `/ar`, both MoPlayer Pro product pages, activation, both MoOS pages, and the admin login route.
- Live MoPlayer Pro config and release APIs now return version `2.7.0`, version code `69`, and the verified universal APK metadata. The latest-download route redirects to the matching GitHub Release asset.
- The bilingual MoOS redesign is live. Its ISO remains unavailable in the live manifest because the configured Blob URL returns HTTP 403.

## Released artifacts

- GitHub Release: `moplayer-pro-v2.7.0`.
- Universal APK: 56,170,203 bytes, SHA-256 `3c26275744b0947a3e1f1b8fb8708de4335bf292a1410bb62cf6be63651042ff`.
- ARM64 APK: 34,932,546 bytes, SHA-256 `500902fc5db9e2c5d713c0eaf196a718dac766296e46bf03db941fe8841ba874`.
- ARMv7 APK: 31,214,119 bytes, SHA-256 `a08fa02fefd2a4db477264ecef2ddef95a0c1ad4d16d520cb14b12c339a3e6c5`.
- All APKs passed Android signature verification with certificate SHA-256 `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`.

## Verification completed

- `npm run verify:production`: passed.
- `npm run verify:web`: passed after release metadata synchronization.
- `npm run verify:admin`: passed after release metadata synchronization.
- `npm run verify:windows`: passed for the preserved MoPlayer PC 1.0.4 candidate.
- `:app:assembleRelease --rerun-tasks`: passed for MoPlayer Pro 2.7.0 / code 69.
- TypeScript 6 compatibility was restored by removing the deprecated admin `baseUrl`; the explicit `@/* -> ./src/*` path mapping remains in place.
- All registered worktrees and local/remote branch tips were audited. Work from the two dirty trees was committed and consolidated; remote feature content is merged by ancestry or confirmed equivalent tree content.
- No secret, token, database password, signing key, or generated APK was committed.

## Important current boundaries

- The connected Supabase project `xoogchspxkzojhdvlxpf` is reachable but does not contain `public.app_products`; production currently serves the verified release through code fallback metadata. Do not apply the repository migration history to that project without a separate reviewed database rollout and the correct database credentials.
- MoPlayer PC 1.0.4 is preserved and verified as a local candidate, but the public Windows feed remains at 1.0.3 until signed 1.0.4 installers are published.
- Do not enable the MoOS ISO until a replacement host passes HTTP 200, byte-range, exact-size, and SHA-256 checks.
- Physical Android/TV device smoke testing remains recommended for playback, remote focus, activation, updater, and lifecycle behavior.

## Next recommended step

Provision or identify the intended production Supabase schema before enabling database-managed release operations, then publish signed MoPlayer PC 1.0.4 installers when the Windows signing/release pipeline is available.
