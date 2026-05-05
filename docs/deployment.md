# Deployment

Condensed from the main [README](../README.md). For full narrative (SEO, Android release, scripts), use the README; this file is the operations checklist.

Set **Root Directory** in each Vercel project to **`apps/web`** (site) and **`apps/admin`** (admin). If an older checkout used `apps/website` or `apps/admin-dashboard`, update the dashboard setting after pulling.

## Vercel projects

| Vercel project | Root directory | Domain |
| --- | --- | --- |
| `mohammad-alfarras` | `apps/web` | `moalfarras.space` |
| `moalfarras-admin` | `apps/admin` | `admin.moalfarras.space` |

Per project:

- **Install:** `npm install`
- **Build:** `npm run build`
- **Framework:** Next.js (v16.x)
- **Node:** 24.x

After changing environment variables, **Redeploy** so new values apply.

`apps/moplayer-dashboard` is a Vite SPA — not deployed by those two projects. Build with `npm run build:moplayer-dashboard` from the monorepo root and host `dist/` as a static site if needed.

## Environment templates

Copy and fill:

- [`apps/web/.env.example`](../apps/web/.env.example)
- [`apps/admin/.env.example`](../apps/admin/.env.example)

See the **Environment variables** section in [README.md](../README.md) for the full list (`ADMIN_*`, `NEXT_PUBLIC_SUPABASE_*`, `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional YouTube/weather keys, etc.).

## Supabase migrations

Migrations live in [`supabase/migrations/`](../supabase/migrations/). Project setup and CLI commands (`supabase link`, `supabase db push`) are documented in the README **Supabase** section.

## CI

GitHub Actions: [`.github/workflows/next-app-ci.yml`](../.github/workflows/next-app-ci.yml). Ensure the workflow runs from the `Moalfarrasappseit` root where `package-lock.json` exists.
