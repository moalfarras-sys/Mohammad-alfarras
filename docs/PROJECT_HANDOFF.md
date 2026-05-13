# Project Handoff

This repository is a production monorepo for the public website, admin control center, Supabase-backed app metadata, and Android MoPlayer apps.

## Applications

- `apps/web`: public Next.js site for `moalfarras.space`, MoPlayer pages, activation, support, app config, and downloads.
- `apps/admin`: admin control center for `admin.moalfarras.space`.
- `apps/moplayer-android`: classic MoPlayer Android TV app.
- `apps/moplayer2-android`: MoPlayer Pro Android app.
- `packages/shared`: shared app product metadata and slug helpers.
- `packages/db`: server-side database helpers.
- `supabase/migrations`: ordered database migrations for production Supabase.

## Required Local Setup

Real secrets must stay in ignored local files:

- `apps/web/.env.local`
- `apps/admin/.env.local`
- Android `local.properties`

Never commit Vercel tokens, Supabase secret keys, database passwords, service role keys, or generated local env files.

Use `apps/web/.env.example` and `apps/admin/.env.example` as templates. Required web values include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOPLAYER_PROVIDER_ENCRYPTION_KEY`
- `ADMIN_ALLOWLIST`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_WEB_APP_URL`
- `NEXT_PUBLIC_ADMIN_APP_URL`

`DATABASE_URL` and `DIRECT_URL` are only needed for direct Postgres tooling. Use Supabase pooler/direct URLs with the real database password when running migrations or database scripts locally.

## Verification

Run these from the repository root before deploying:

```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run lint
npm --prefix apps/admin run build
```

For browser verification:

```powershell
npm --prefix apps/web run dev -- --port 3000
```

Then verify these routes:

- `/`
- `/en/apps`
- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2&code=MO-DEMO`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`

The download route may start a file download instead of rendering JSON; that is expected when a published release asset is available.

## Supabase

Project ref: `ckefrnalgnbuaxsuufyx`

Use the Supabase MCP plugin or Supabase CLI for project inspection, advisors, logs, and migrations. Recommended order for database work:

1. Inspect tables and migrations.
2. Run security/performance advisors.
3. Test SQL locally or through safe read-only queries first.
4. Create migrations with `supabase migration new <name>`.
5. Verify app routes and admin flows after applying changes.

Public client keys may be exposed to the browser. Secret keys and service role keys must only be used server-side.

## Vercel

Expected domains:

- Public site: `https://moalfarras.space`
- Admin: `https://admin.moalfarras.space`

Deploy only after local verification succeeds. Production env vars should be configured in Vercel project settings, not committed to the repository.

Recommended deploy flow:

```powershell
npx vercel pull --yes --environment=production --token <token>
npx vercel build --prod --token <token>
npx vercel deploy --prebuilt --prod --token <token>
```

If using the Vercel plugin, inspect build logs and runtime logs after deployment.

## MoPlayer Pro Notes

The public product name is `MoPlayer Pro`, while the internal slug remains `moplayer2` for compatibility with URLs, API payloads, database rows, and Android integration.

Key routes:

- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`

Keep classic MoPlayer (`moplayer`) and MoPlayer Pro (`moplayer2`) release channels separate.
