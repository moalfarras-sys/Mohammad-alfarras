# MoPlayer Pro for Windows

Electron + React + TypeScript desktop app for Windows 10 and Windows 11.

## Commands

```powershell
npm run dev:windows
npm run build:windows
npm run verify:windows
npm run dist:windows
npm --prefix apps/moplayer-pro-windows run prepare:installer-art
npm --prefix apps/moplayer-pro-windows run smoke
npm --prefix apps/moplayer-pro-windows run qa:screens
```

Output files are written to:

```text
apps/moplayer-pro-windows/release/
```

Expected release files:

- `MoPlayer-Pro-Setup.exe`
- `MoPlayer-Pro-Portable.exe`

`npm run dist:windows` packages in the system Temp folder first, then copies the final artifacts into `release/`. This avoids Windows Desktop/Application Control file locks during Electron packaging.

The distribution step also writes Windows release metadata and copies the local EXE artifacts to:

```text
apps/web/public/downloads/moplayer/windows/
```

The public website route can then be tested locally with:

```text
/api/app/download/latest?product=moplayer2&platform=windows
/api/app/download/latest?product=moplayer2&platform=windows&portable=1
```

These local EXE copies are ignored by Git and are for local QA only until a signed installer is uploaded to durable binary hosting/CDN.

The app registers with the existing MoPlayer activation backend as:

```json
{
  "productSlug": "moplayer2",
  "platform": "windows",
  "deviceType": "pc",
  "publicDeviceIdPrefix": "MO-D-PC-"
}
```

`MO-D-PC-` keeps the Windows client compatible with the existing activation API validator while `platform=windows` and `deviceType=pc` preserve the PC identity in devices/admin data.

## Product Assets

The Windows app reuses MoPlayer Pro Android assets from `apps/moplayer2-android`:

- splash/logo art from `ic_splash_logo.png`;
- app icon from `ic_launcher_foreground_img.png`;
- cinematic background from `bg_app_cinematic.jpg`;
- TV/banner art from `baner_tv.png`;
- Cairo and Manrope fonts from the Android Pro font resources.

The Windows UI intentionally mirrors the Android Pro TV surface instead of using a generic desktop dashboard: warm fiery glass theme, bottom dock navigation, left category rail, live channel rows, poster shelves, right-side preview pane, and large touch/mouse/keyboard-friendly targets.

MoPlayer Pro does not provide, host, sell, or distribute any media content. Users must add their own legally obtained playlists or Xtream credentials.

## Installer Art

`scripts/prepare-installer-art.mjs` regenerates the NSIS sidebar, header, preview PNGs, and bilingual license file from the MoPlayer Pro assets:

- `build/installerSidebar.bmp`
- `build/installerHeader.bmp`
- `build/installerSidebar-preview.png`
- `build/installerHeader-preview.png`
- `build/license.txt`

The assisted installer also includes `build/installer.nsh`, which replaces the old white NSIS welcome/license/finish flow with custom dark MoPlayer pages:

- premium welcome page using MoPlayer colors;
- required private-media usage confirmation;
- branded finish page with an optional launch checkbox.

The default NSIS license page is intentionally disabled in `package.json`; the app uses the custom legal page instead. The install-directory chooser is also disabled so users do not see a mismatched legacy setup page during the normal flow.

Run it before `npm run dist:windows` if the icon, banner, or installer wording changes.

## Local QA Notes

`qa:screens` uses a temporary local fixture with a public technical HLS stream and a unique temporary Electron user-data directory per screenshot. It does not bundle IPTV channels or provider credentials into the product.

As of 2026-06-12, `qa:screens` also captures Arabic RTL regressions and the multi-view channel picker:

- `ar-home.png`
- `ar-settings.png`
- `ar-multi.png`
- `ar-multi-picker.png`
- `ar-login.png`
- `multi-picker.png`

The Windows title bar is intentionally kept LTR even when the app content is RTL so the brand/logo never slides under the native Windows close/maximize/minimize controls.

For real-source QA, launch Electron with `--qa-user-data=<temp path>` so provider credentials and large libraries stay isolated from the installed user profile. M3U Plus `get.php` URLs are detected and imported through Xtream `player_api.php` to avoid blocking on huge playlist downloads.

The 2026-06-11 real-source QA loaded 42,673 items, verified account status/expiry metadata, search, favorites, settings, Android-parity screen layout, bottom dock interaction, and live HLS playback. Details are in `MOPLAYER-PC-QA-REPORT.md`.

The installer and portable EXE are local build artifacts and should not be committed. Publish the Windows download on the public website only after the EXE is hosted in a proper binary store and trusted Windows code signing is configured.

## Local Storage And Server Handoff

The Windows app does not bundle a provider/server URL, username, password, playlist URL, or EPG URL inside the installer. User-added sources are stored on the PC under:

```text
%APPDATA%\@moalfarras\moplayer-pro-windows\
```

Important files:

- `moplayer-pro-data.json`: device info, settings, source metadata, favorites, watch progress, and encrypted source secrets.
- `moplayer-pro-library.json`: parsed channel/movie/series library cache.
- `logs\app.log`: local diagnostic log.

When Windows secure storage is available, source secrets are encrypted with Electron `safeStorage`. If secure storage is unavailable, the app falls back to base64 only as a compatibility fallback, so production QA should confirm `Local encryption: Available` in Settings.

QR activation uses the website API as a short-lived handoff. The website queues source credentials for the device to fetch once, then the Windows app saves the source locally and acknowledges the handoff. Provider credentials must not be treated as permanent Supabase data.

## 2026-06-12 Polish Regression

- `prepare:icon` now runs `prepare:logo-mark` first. The generated renderer mark and Windows icon are transparent, with black/white source background pixels and isolated hairlines removed.
- Installer artwork now uses the transparent `moplayer-mark.png`, so NSIS header/sidebar previews no longer show a boxed black logo.
- The Windows setup flow now uses `build/installer.nsh` for custom MoPlayer welcome, legal confirmation, and finish pages instead of the old default white NSIS license/finish screens.
- Home, Settings, Movies, Live TV, Multi-view, Login, and Arabic RTL screenshots passed after the visual polish pass.
- The floating dock is smaller with larger icons, extra bottom scroll padding, and safer long-text wrapping in cards.
- Multi-view channel picking has a centered picker, category filter, search, readable rows, and Arabic RTL QA coverage.
- Movie/series preview now always exposes a Trailer action for non-live content. If provider metadata has no trailer URL, the app opens a YouTube search for the item title.
- The quiet Windows update check now uses `app:checkWindowsUpdate`, which returns `null` when Windows release metadata is absent instead of throwing noisy IPC errors on launch.
- Local website QA passed for the MoPlayer family links: Classic download/activation uses `product=moplayer`, Pro Android download/activation uses `product=moplayer2`, and PC download/activation uses `product=moplayer2&platform=windows` for downloads plus `product=moplayer-pc&platform=windows` for the public activation entry.
- Production on 2026-06-12 serves JSON for `/api/app/config?product=moplayer2`, `/api/weather?city=Berlin`, and `/api/football`. Production Windows download metadata/routes were not yet deployed; `/downloads/moplayer/windows/latest-windows.json` returned 404 and `/api/app/download/latest?product=moplayer2&platform=windows` still resolved to the Android Pro APK until the web deployment is updated.

## Startup Troubleshooting

If the app hangs on `Preparing MoPlayer Pro`, inspect `%APPDATA%\@moalfarras\moplayer-pro-windows\logs\app.log` first. The 2026-06-11 hang was caused by an ESM preload script being loaded by Electron as a classic preload script; the app now compiles preload from `src/preload.cts` to `dist-electron/preload.cjs`, and `build:electron` cleans stale preload output before every build.
