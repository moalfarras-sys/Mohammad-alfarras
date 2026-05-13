# Agent Guide: Shared DB Package

This package contains server-side database helpers. It must remain safe for backend/server use only.

## Ecosystem Context

- Used by `../../apps/web` and `../../apps/admin`.
- Supabase/Postgres schema lives in `../../supabase/migrations`.
- Do not import this package into browser-only components.

## What This Package Owns

- Postgres connection helpers.
- Server-side query helpers.
- Small database utility code shared by web/admin.

## Critical Rules

- Keep secrets server-side.
- Do not expose `DATABASE_URL`, service role keys, or direct Postgres clients to browser bundles.
- Schema changes belong in `../../supabase/migrations`, not only in TypeScript assumptions.

## Modern Skills Required

For SQL, Postgres, Supabase, pooling, RLS, and migration behavior, verify current Supabase/Postgres docs before changing architecture.

## Verification

Run from repo root:

```powershell
npm run verify:web
npm run verify:admin
```
