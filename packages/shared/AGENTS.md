# Agent Guide: Shared Package

This package is the shared product identity and helper layer for the ecosystem. Changes here affect the public site, admin, and Android integration assumptions.

## Ecosystem Context

- Public app: `../../apps/web`.
- Admin app: `../../apps/admin`.
- Classic Android: `../../apps/moplayer-android`, slug `moplayer`.
- Pro Android: `../../apps/moplayer2-android`, slug `moplayer2`.

## What This Package Owns

- Managed product slugs.
- Product identity helpers.
- Shared app metadata helpers that must remain environment-agnostic.

## Critical Rules

- `moplayer` means Classic.
- `moplayer2` means Pro.
- Alias mapping can accept public names like `moplayer-pro`, but canonical internal slugs must remain stable.
- Do not import Next.js, Supabase clients, Android-specific code, or server-only database helpers here.

## Verification

Run from repo root after changes:

```powershell
npm run verify:web
npm run verify:admin
```

If slug behavior changes, also run relevant Android tests because activation/config behavior depends on these names.
