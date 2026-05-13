# Agent Guide: Optional MoPlayer Dashboard

This folder is an optional Vite dashboard. It is not the production public site and not the production admin control center.

## Ecosystem Context

- Production public site lives in `../web`.
- Production admin lives in `../admin`.
- Android apps live in `../moplayer-android` and `../moplayer2-android`.
- Shared product identity lives in `../../packages/shared`.

## What This App Owns

- Experimental or optional dashboard UI built with Vite/React.
- Supabase client experiments that are safe for public/client-side keys.

## Critical Rules

- Do not assume this dashboard is deployed to `moalfarras.space` or `admin.moalfarras.space`.
- Do not move production admin operations here unless the deployment plan changes.
- Keep product slugs aligned with `../../packages/shared`.

## Modern Skills Required

For UI or data work, use current React/Vite/Supabase docs. Keep it lightweight and clearly separate from production web/admin apps.

## Verification

Run from repo root:

```powershell
npm run verify:moplayer-dashboard
```

## Do Not Do

- Do not store secrets in client-side code.
- Do not duplicate production release/activation logic from `../web` or `../admin` without a deliberate shared abstraction.
