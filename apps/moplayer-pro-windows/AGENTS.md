# Agent Guide: MoPlayer Pro Windows

This folder is the Windows desktop client for MoPlayer Pro. It is a sibling app to the Android Pro project, not a replacement.

## Product Identity

- Public name: **MoPlayer Pro**
- Web/API product slug: `moplayer2`
- Platform registration: `windows`
- Device type registration: `pc`

## Boundaries

- Do not rename `moplayer2` in API requests.
- Do not store provider credentials in Supabase.
- Provider source data is accepted only from user input or the short-lived website QR handoff, then saved locally.
- Do not add bundled channels, playlists, or demo IPTV content.
- Keep Android projects untouched unless the task explicitly asks for Android changes.

## Verification

Run from the repository root:

```powershell
npm run verify:windows
npm run dist:windows
```

For a packaged smoke test after `dist:windows`:

```powershell
npm --prefix apps/moplayer-pro-windows run smoke
```

