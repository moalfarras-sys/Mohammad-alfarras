# MoPlayer Pro UI Redesign

Date: 2026-06-11

This handoff tracks the Windows desktop redesign and installer refresh for MoPlayer Pro.

## Completed

- Created a premium dark glass orange/copper visual system for the Windows app.
- Added a bottom glass dock inspired by MoPlayer Pro Android.
- Removed the visible left-navigation experience from the Windows runtime and expanded the main content area.
- Improved Home, Live TV, Movies, Series, Search, Favorites, Settings, Login/QR activation, License/Support, Player, and Multi-view styling.
- Made poster grids denser and more desktop-friendly.
- Regenerated setup sidebar/header artwork and rebuilt Setup/Portable files.
- Linked the website PC page to generated Windows release metadata.
- Fixed `moplayer-pc` alias resolution to use the `moplayer2` product.

## Main Files

- `apps/moplayer-pro-windows/src/renderer/App.tsx`
- `apps/moplayer-pro-windows/src/renderer/styles.css`
- `apps/moplayer-pro-windows/src/renderer/theme/tokens.css`
- `apps/moplayer-pro-windows/src/renderer/components/ui/PremiumDock.tsx`
- `apps/moplayer-pro-windows/scripts/prepare-installer-art.mjs`
- `apps/web/src/app/[locale]/(site)/apps/moplayer-pc/page.tsx`
- `apps/web/src/components/app/moplayer-pc-landing.tsx`
- `apps/web/src/lib/windows-release.ts`
- `packages/shared/src/app-products.ts`

## Local Verification

Passed:

- `npm run verify:windows`
- `npm --prefix apps/moplayer-pro-windows run qa:screens`
- `npm --prefix apps/moplayer-pro-windows run smoke`
- `npm run dist:windows`
- Packaged app smoke from `release/win-unpacked/MoPlayer Pro.exe`
- Silent NSIS install smoke in a temp directory, installed app smoke, cleanup
- `npm run verify:web`

## Installer Limit

The current Windows installer is electron-builder NSIS. It supports branded sidebar/header BMPs and license text, but not a completely free-form React-style wizard without custom NSIS scripting or a separate bootstrapper.

See the app-specific details in `apps/moplayer-pro-windows/MOPLAYER-UI-REDESIGN.md`.
