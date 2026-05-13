# Agent Guide: Admin Control Center

This folder is the admin Next.js app for `https://admin.moalfarras.space`. It is not a standalone dashboard. It controls public website content, app releases, runtime config, activations, devices, and provider-source workflows for the MoPlayer ecosystem.

## Ecosystem Context

- Public site and APIs live in `../web` and deploy to `https://moalfarras.space`.
- MoPlayer Classic lives in `../moplayer-android`, slug `moplayer`, package `com.mo.moplayer`.
- MoPlayer Pro lives in `../moplayer2-android`, slug `moplayer2`, package `com.moalfarras.moplayerpro`.
- Shared product slug logic lives in `../../packages/shared`.
- Server database helpers live in `../../packages/db`.
- Supabase schema changes live in `../../supabase/migrations`.

## What This App Owns

- Admin login and session handling.
- Product/release/source operations UI.
- Website CMS controls for settings, media, pages, PDFs, CV, and projects.
- App runtime settings, device status, activation queues, and support request visibility.

## Critical Product Rules

- Keep `moplayer` and `moplayer2` separate in every admin operation.
- Do not change product slugs in admin without updating public web APIs and Android clients.
- Do not expose secrets in client components.
- Do not assume `/settings`, `/media`, `/pages`, `/pdfs`, `/cv`, or `/projects` are separate top-level admin routes on the admin domain; the current admin app is primarily a single control-center surface.

## Where To Edit

- Admin shell/navigation: `src/components/admin/admin-os.tsx`.
- App operations: `src/components/admin/app-admin-dashboard.tsx`, `src/lib/app-ecosystem.ts`, `src/app/actions.ts`.
- Website CMS: `src/components/admin/website-admin-dashboard.tsx`, `src/lib/website-cms.ts`.
- Auth/session behavior: `src/lib/auth.ts`, `src/lib/admin-auth.ts`.
- Shared product behavior: prefer editing `../../packages/shared/src/app-products.ts`.

## Modern Skills Required

For auth/session, server actions, Supabase access, Vercel deploys, or Next.js behavior, verify current official docs before changing architecture. For admin UI, prioritize clarity, dense operational scanning, accessibility, responsive layout, and safe forms.

## Verification

Run from repo root:

```powershell
npm run verify:admin
```

For visual changes:

```powershell
npm --prefix apps/admin run dev -- --hostname 127.0.0.1 --port 3001
```

Check `/`, login rendering, and authenticated dashboard flows if valid local credentials are available.

## Do Not Do

- Do not copy public website components into admin unless there is a clear shared abstraction.
- Do not change release/download paths without checking `../web` API routes.
- Do not bypass server-side auth for convenience.
- Do not commit `.env.local`, Vercel files, generated builds, or media dumps.
