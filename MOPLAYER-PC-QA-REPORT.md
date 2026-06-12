# MoPlayer Pro Windows PC QA Report

## 2026-06-12 v1.0.2: full in-app auto-update + matches screen (live-verified)

- **electron-updater wired end-to-end**: generic feed at `https://moalfarras.space/downloads/moplayer/windows/latest.yml` (committed, deployed by the website) with absolute GitHub Release asset URLs; `app-update.yml` embedded in the package; updater disabled for portable/dev/QA-screenshot runs (falls back to the website-link banner). Renderer shows a live progress banner and a "Restart to update" button; quiet startup check stays silent when up to date.
- **Live auto-update proof on this PC**: installed v1.0.1 checked the production feed, found v1.0.2, downloaded it from GitHub in ~7 seconds (app log: `checking → available 1.0.2 → downloaded 1.0.2`), installed silently on quit, and relaunched as v1.0.2. A follow-up check on v1.0.2 returns `not-available` (up to date).
- **New football matches screen** (`#screen=matches`): grouped by league with logos, live-score chips with elapsed minutes, kickoff times, venues, auto-refresh every 60 s, EN + AR RTL. Opened by clicking the home football widget.
- **Football API duplicate fix (production)**: `/api/football` returned every fixture twice (ESPN path concatenated `upcomingFixtures`/`recentResults` subsets with the full unique list; api-football path lacked id-dedup across per-day queries). Both assembly points now dedupe by fixture id — verified live: 8 matches / 8 unique. The PC widget and matches screen also dedupe defensively client-side.
- Release `moplayer-pc-v1.0.2` published on GitHub with Setup, Portable, and the `.blockmap` (enables differential updates); website metadata and feed deployed; `qa-auto-update.mjs` added for repeatable update-pipeline QA.
- This pass also shipped the parallel playback-hardening work (stream proxy URI/keep-alive/HEAD fixes, playback.ts engine tuning, multi-view audio/limit-awareness, CSP worker-src) — see `apps/moplayer-pro-windows/MOPLAYER-PC-QA-REPORT.md` for its measured results.

## 2026-06-12 Release Pass (MoPlayer PC v1.0.0 public naming)

- Product renamed to **MoPlayer PC** (`MoPlayer-PC-Setup.exe` / `MoPlayer-PC-Portable.exe`); `write-release-meta.mjs`, the website download API, and `latest-windows.json` now all use the PC artifact names. `package.json` `win.target` was corrected from `squirrel` back to `nsis` to match the packaging CLI.
- Public binary hosting moved to **GitHub Releases** (`moplayer-pc-v<version>` tag) because the ~115 MB EXEs exceed Vercel static limits. `latest-windows.json` carries `downloadUrl`/`portableDownloadUrl` and the site API `GET /api/app/download/latest?product=moplayer2&platform=windows` 307-redirects there (local static copy stays as a dev fallback).
- **In-app update flow is now actionable**: the quiet startup check and the Settings "Check for updates" both surface a dismissable banner with a "Download update" button that opens the website download API (which always points at the newest release). Version comparison is numeric semver, not string inequality.
- **Football widget upgraded**: uses the real team logos delivered by `/api/football`, shows the league name in the header, and lists up to three additional fixtures with kickoff time or live score under the featured match. Verified in EN + AR against the live production API (FIFA World Cup data).
- New reusable `scripts/qa-real-source.mjs`: drives the *installed* app over CDP with real Xtream credentials from env vars (never stored in the repo), captures screenshots of every screen, measures renderer responsiveness, and verifies live playback.
- **Real-source QA result (installed MoPlayer PC v1.0.0)**: ~43K items (13K live / 20K movies / 10K series) synced in ~5 s; renderer responsiveness probes stayed at 1–4 ms during sync and playback (no hangs); live channel reached `readyState=4` and played; search returned 400 visible results; all screen captures written to `qa-screenshots/real-*.png`.
- **QR activation E2E proof (local routes against production Supabase)**: create → confirm → queue encrypted source → app pulls once (payload removed) → ack (queue + token rows deleted, count 0) → second pull rejected with `unauthorized`. Device rows contain no provider fields, and `app_settings` keys are hashed device ids. Admin now also strips `encryptedPayload` before provider-source rows reach the client.
- Silent install over the previous build reused the same install directory (same `appId`), confirming the in-place update path for existing users.

## Test Summary

- Date: 2026-06-11
- App: MoPlayer Pro for Windows
- Version: 1.0.0
- Product slug: `moplayer2`
- Platform registration: `windows`
- Device type registration: `pc`
- Device ID format: `MO-D-PC-*`
- Result: Built, verified, packaged, installed on this PC, smoke-tested, real-source tested, screenshot-tested, and launched from the installed Windows app.

The provider URL, username, and password used for real-source QA are intentionally not written in this report.

## 2026-06-12 Polish Regression Pass

- Reproduced the user-reported issues from screenshots: boxed black logo, RTL titlebar/logo collision risk, clipped settings cards, oversized poster/card density, large dock with small icons, weak multi-view picker, and missing trailer fallback.
- Regenerated `src/renderer/assets/moplayer-mark.png`, `build/icon.png`, and `build/icon.ico` from a transparent logo extraction pipeline. Pixel inspection confirmed transparent corners and no opaque black background.
- Reworked final CSS overrides for titlebar safe area, home hero sizing, dock sizing, poster density, settings wrapping, preview actions, and bottom scroll padding.
- Added a Palmyra-inspired Syrian line-art background in place of the old mosque line art.
- Added multi-view picker category filtering/search and dedicated QA screenshots for `multi-picker.png` and `ar-multi-picker.png`.
- Added Arabic QA screenshots for home, settings, multi-view, multi-view picker, and login.
- Added a trailer action that uses provider trailer metadata or falls back to YouTube search for non-live content.
- Added `app:checkWindowsUpdate` so missing Windows release metadata does not produce noisy launch IPC errors.
- Verified local installed data storage: provider secrets are in `%APPDATA%\@moalfarras\moplayer-pro-windows\moplayer-pro-data.json` as Electron `safeStorage` encrypted entries, with the large library cache in `moplayer-pro-library.json`. No provider server is bundled in the installer.
- Production endpoint spot-check on 2026-06-12: config/weather/football returned JSON; Windows release metadata was still not deployed to production, and the live `platform=windows` download route still resolved to the Android Pro APK until the web app is redeployed.

## Startup Fix

- Reproduced the stuck splash screen from the installed app logs.
- Root cause: Electron tried to load `dist-electron/preload.js` as a classic preload script, but the file was emitted as ESM because the package uses `"type": "module"`. The renderer never received `window.moPlayer`, so it stayed on `Preparing MoPlayer Pro`.
- Fix: moved preload to `src/preload.cts`, compile output is now `dist-electron/preload.cjs`, and `main.ts` points Electron to the CJS preload.
- Added `scripts/clean-electron.mjs` so stale preload output cannot survive future builds.

## Android UI Parity Correction

- Re-inspected the Android Pro Compose implementation before the final Windows correction: `HomeScreen.kt`, `LoginScreen.kt`, `MediaScreens.kt`, `Cards.kt`, `Glass.kt`, `MoTheme.kt`, `TvScale.kt`, `Dock.kt`, and `SearchSettingsScreens.kt`.
- Reworked the Windows shell away from the rejected web-style dashboard and toward the Android Pro TV layout: fiery glass palette, cinematic background, bottom dock, left category rail, central content panel, live channel rows, poster grid/shelves, and right-side preview pane.
- Reused the same Android Pro logo/icon/background/banner/font assets already copied from `apps/moplayer2-android`.
- Verified the corrected layout with screenshot QA for home, live, movies, series, search, settings, license, and support. The generated images are under `apps/moplayer-pro-windows/qa-screenshots/`.
- Fixed the final bottom-dock hit area after real-source QA showed the workspace layer intercepting pointer clicks over dock buttons. The dock now sits above the workspace layer and is clickable with mouse/touch automation.

## Final Visual Polish

- Rechecked the Windows app visually after the user's design pass.
- Tightened the home hero sizing so the stat/action buttons no longer clip on desktop viewports.
- Reduced movie/series poster grid sizing from oversized TV-scale cards to a PC-friendly dense grid while keeping the Android Pro visual language.
- Increased scroll padding and bottom spacing in long settings/support surfaces so the floating dock does not cover the last controls.
- Kept Live TV closer to the Android Pro layout: left categories, compact channel rows, real logos, current item preview, and quick actions.
- Regenerated installer sidebar/header art with the MoPlayer Pro app icon, banner, warm cinematic background, glass UI cues, and a clean bilingual license page.

## Commands Run

```powershell
npm --prefix apps/moplayer-pro-windows run build
npm --prefix apps/moplayer-pro-windows run smoke
npm --prefix apps/moplayer-pro-windows run qa:screens
npm run verify:windows
npm run verify:web
npm --prefix apps/moplayer-pro-windows run prepare:installer-art
npm run dist:windows
%LOCALAPPDATA%\Programs\MoPlayer Pro\MoPlayer Pro.exe --smoke-test
```

## Build Result

- TypeScript: passed.
- Renderer build: passed.
- Electron main/preload build: passed.
- `npm --prefix apps/moplayer-pro-windows run smoke`: passed.
- `npm --prefix apps/moplayer-pro-windows run qa:screens`: passed with isolated per-screen temporary Electron user data.
- `npm run verify:windows`: passed.
- `npm run verify:web`: passed.
- `npm run dist:windows`: passed and produced refreshed setup/portable artifacts.

## Real Source QA

The supplied M3U Plus URL was detected as Xtream and loaded through `player_api.php` instead of downloading/parsing the huge M3U file.

- Account status: Active.
- Provider expiry: 2027-06-02.
- Live format: `m3u8`.
- Timezone: `Africa/Cairo`.
- Categories loaded: 234.
- Media items loaded: 42,673.
- Live channels: 12,253.
- Movies: 19,991.
- Series: 10,429.
- Items with posters/logos: 40,332.
- Items with ratings: 29,358.
- Items with descriptions: 7,319.
- Search QA: query returned 400 visible cards.
- Favorites QA: toggling a live channel favorite persisted locally.
- Settings QA: source subscription card showed active status, expiry, connections, format, and timezone.
- Player QA: first live channel reached `readyState=4`, `paused=false`, `errorCode=0`, and played in the internal Windows player.

Screenshots were written to:

- `apps/moplayer-pro-windows/qa-screenshots/real-login.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-m3u-filled.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-home-loaded.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-live.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-movies.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-series.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-search.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-settings.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-player.png`
- `apps/moplayer-pro-windows/qa-screenshots/real-current-live-player.png`

## Screen And Flow Result

- Splash screen: passed and no longer hangs.
- Header/navigation: passed with Android-style brand strip, source actions, and bottom dock navigation.
- Login: passed for QR, Xtream, and M3U URL entry surfaces.
- M3U Plus import: passed through Xtream API extraction.
- Home: passed with widgets, quick tiles, metrics, and media rows.
- Live TV: passed with real categories, counts, Android-like channel rows, channel logos, right preview pane, image fallback, and favorite toggling.
- Movies: passed with left category rail, PC-sized poster grid, right preview pane, ratings, and descriptions where provider data exists.
- Series: passed with left category rail, PC-sized poster grid, right preview pane, ratings, and descriptions where provider data exists.
- Search: passed against the real provider library.
- Favorites: passed in local storage.
- Settings: passed with language, density, fullscreen, playback, widgets, weather city, parental filter controls, and provider subscription details.
- License: passed and points to the MoPlayer Pro activation URL.
- Support/device info: passed with copy device ID, support link, and log export.
- Player: passed with HLS playback, fullscreen player mode, play/pause, retry, favorite, volume, mute, speed, progress, related list, HLS fatal recovery, and MPEG-TS fallback candidate logic.
- Arabic/RTL: Arabic copy file was repaired from mojibake and toggle motion was corrected for RTL.

## Installer Artifacts

Local artifacts:

- `apps/moplayer-pro-windows/release/MoPlayer-Pro-Setup.exe`
- `apps/moplayer-pro-windows/release/MoPlayer-Pro-Portable.exe`
- `apps/web/public/downloads/moplayer/windows/latest-windows.json`
- `apps/web/public/downloads/moplayer/windows/MoPlayer-Pro-Setup.exe`
- `apps/web/public/downloads/moplayer/windows/MoPlayer-Pro-Portable.exe`
- `apps/moplayer-pro-windows/build/installerSidebar-preview.png`
- `apps/moplayer-pro-windows/build/installerHeader-preview.png`

Metadata:

- Setup size: `115054690` bytes.
- Setup SHA-256: `0e66aece186a0afbd8ff374cc2773b5230bf1dace349a84231ed1e3fe0bc9966`.
- Portable size: `114762463` bytes.
- Portable SHA-256: `84955e504fd61b7300aab3d2ee2e64a6e89785a2f2e76283583a52d2c541dc25`.
- Release date: `2026-06-12`.
- Target: `Windows 10 / Windows 11 x64`.

## Website Local Download Preparation

- The public website API is prepared locally for Windows downloads without publishing it to production.
- `GET /api/app/download/latest?product=moplayer2&platform=windows` redirects to `/downloads/moplayer/windows/MoPlayer-Pro-Setup.exe`.
- `GET /api/app/download/latest?product=moplayer2&platform=windows&portable=1` redirects to `/downloads/moplayer/windows/MoPlayer-Pro-Portable.exe`.
- Local dev verification on port `3038` returned `307` from the API route and `200 OK` from the static setup EXE URL with `Content-Length: 114993845`.
- Windows EXE files copied into `apps/web/public/downloads/moplayer/windows/` are local ignored artifacts; they are ready for local testing but not committed or deployed.

## Install Result

- Silent install to current user: passed.
- Installed EXE smoke test: passed with exit code 0.
- Desktop shortcut exists at `C:\Users\Moalf\Desktop\MoPlayer Pro.lnk`.
- Installed app path: `C:\Users\Moalf\AppData\Local\Programs\MoPlayer Pro\MoPlayer Pro.exe`.
- Installed app was launched normally and left running.

## Android Asset Parity

The Windows app uses MoPlayer Pro Android assets:

- `ic_splash_logo.png` as the splash/brand logo.
- `ic_launcher_foreground_img.png` as app icon and installer icon source.
- `bg_app_cinematic.jpg` as the cinematic app background.
- `baner_tv.png` as TV/login/product media.
- `cairo.ttf` and `manrope.ttf` as UI fonts.

## Security Notes

- Electron security posture: `contextIsolation=true`, `nodeIntegration=false`, `sandbox=true`, `webSecurity=true`, and privileged APIs are exposed only through the preload bridge.
- Provider credentials are saved locally for user-entered sources and are not written to Supabase as permanent provider records.
- QA used a temporary user data directory for the supplied provider source so the real installed app was not populated with the test credentials.
- Screenshot QA now uses unique temporary user-data directories to avoid Electron cache/profile permission collisions.

## Remaining Production Work

- Public distribution still needs a trusted binary host and a real Windows code-signing certificate before broad release.
- Some provider poster/logo URLs are broken upstream; the app now falls back to branded player art instead of showing broken image icons.
- Very large libraries work in current QA, but a later SQLite cache would be better if real customers use even larger providers.
- Broad hardware certification still needs more real Windows devices, GPU drivers, touch screens, low-memory PCs, and high-DPI displays. This local build is verified on the current PC and targets Windows 10/11 x64.
- Production publishing should move the EXE to durable binary storage/CDN, keep the website route as a redirect, and publish only signed installers.

## Sources Checked

- Electron security guidance for local-content desktop apps, context isolation, and preload/IPCs: https://www.electronjs.org/docs/latest/tutorial/security
- electron-builder Windows NSIS guidance for setup artifacts and desktop/start-menu shortcut creation: https://www.electron.build/docs/nsis/
- Next.js Route Handlers guidance for the website download redirect: https://nextjs.org/docs/app/api-reference/file-conventions/route
- hls.js playback documentation: https://github.com/video-dev/hls.js
