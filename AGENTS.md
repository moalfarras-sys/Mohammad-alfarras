# Agent Guide

This repository is a production monorepo. Keep changes scoped, verified, and easy to hand off.

## Start Here

Read these files before making broad changes:

- `README.md`: product overview, domains, core commands.
- `docs/DEVELOPMENT_WORKFLOW.md`: local setup, verification, deploy flow.
- `docs/architecture.md`: ownership boundaries and data flow.
- `docs/PROJECT_HANDOFF.md`: current production notes.
- `docs/PRODUCTION_GUIDE.md`: release and operations details.

## Ownership Map

| Area | Path | Owns |
| --- | --- | --- |
| Public site | `apps/web` | `moalfarras.space`, marketing pages, activation UI, public APIs, APK download routes |
| Admin app | `apps/admin` | `admin.moalfarras.space`, operations UI, app/release/source management |
| MoPlayer Classic | `apps/moplayer-android` | Classic Android TV app, slug `moplayer`, package `com.mo.moplayer` |
| MoPlayer Pro | `apps/moplayer2-android` | Pro Android/TV app, slug `moplayer2`, package `com.moalfarras.moplayerpro` |
| Shared product identity | `packages/shared` | Product slugs, release metadata helpers, shared app constants |
| Shared DB helpers | `packages/db` | Server-side Postgres helpers only |
| Database schema | `supabase/migrations` | Ordered Supabase/Postgres migrations |
| Docs | `docs` | Operational and architecture handoff |

## Product Slugs

- `moplayer` is MoPlayer Classic.
- `moplayer2` is MoPlayer Pro.
- Public copy may say **MoPlayer Pro**, but URLs, APIs, database rows, and Android integration must keep `moplayer2`.
- Do not merge Classic and Pro activation, source, release, or config logic unless the shared product helper explicitly supports it.

## Where To Edit

- Public MoPlayer pages: `apps/web/src/components/app/*`, `apps/web/src/lib/app-ecosystem.ts`, `apps/web/src/app/[locale]/(site)/apps/*`.
- Activation UI: `apps/web/src/components/app/moplayer-activation-page.tsx`.
- Activation APIs: `apps/web/src/app/api/app/activation/*`.
- App config/download APIs: `apps/web/src/app/api/app/config/route.ts`, `apps/web/src/app/api/app/download/latest/route.ts`, `apps/web/src/app/api/app/releases/*`.
- Admin dashboard shell: `apps/admin/src/components/admin/admin-os.tsx`.
- Admin app/release operations: `apps/admin/src/components/admin/app-admin-dashboard.tsx`, `apps/admin/src/lib/app-ecosystem.ts`, `apps/admin/src/app/actions.ts`.
- Website CMS/admin content: `apps/admin/src/components/admin/website-admin-dashboard.tsx`, `apps/admin/src/lib/website-cms.ts`.
- Classic player stability: `apps/moplayer-android/app/src/main/java/com/mo/moplayer/ui/player`, `apps/moplayer-android/app/src/main/java/com/mo/moplayer/ui/livetv`.
- Pro player stability: `apps/moplayer2-android/app/src/main/java/com/moalfarras/moplayer/ui/player`.
- Shared slug behavior: `packages/shared/src/app-products.ts`.

## Do Not Commit

- Secrets: `.env*` except `.env.example`, service role keys, Vercel tokens, database passwords, keystores.
- Generated folders: `node_modules`, `.next`, `build`, `build-output`, `.gradle`, `.kotlin`, `coverage`, `output`, `artifacts`.
- Local QA dumps: screenshots, XML dumps, temporary playlists, copied databases.
- New APK archives unless the release metadata and download routes require that exact file.

## Required Checks

Before pushing web/admin changes:

```powershell
npm run verify:web
npm run verify:admin
```

Before pushing Android player/source changes:

```powershell
npm run verify:android
```

Before a production deploy:

```powershell
npm run verify:production
```

If a check cannot run locally, say exactly which check failed or was skipped and why.

## Deployment Rules

- Public Vercel project: `mohammad-alfarras`, root `apps/web`, domain `moalfarras.space`.
- Admin Vercel project: `moalfarras-admin`, root `apps/admin`, domain `admin.moalfarras.space`.
- Push to `main` only after verification passes.
- After deploying, inspect both production domains and at least these routes:
  - `https://moalfarras.space/en`
  - `https://moalfarras.space/en/apps/moplayer2`
  - `https://moalfarras.space/en/activate?product=moplayer2`
  - `https://moalfarras.space/api/app/config?product=moplayer2`
  - `https://admin.moalfarras.space`

## Change Discipline

- Keep edits inside the owning app/package whenever possible.
- If changing duplicated ecosystem logic in `apps/web/src/lib/app-ecosystem.ts`, check whether `apps/admin/src/lib/app-ecosystem.ts` also needs the same product data.
- Prefer shared helpers in `packages/shared` over copy-pasting slug/product logic.
- For Android live playback, protect against stale retry callbacks, null players, lifecycle pauses, and channel zapping races.
- For UI work, verify desktop and mobile visually when pages or layout changed.
- Never rewrite git history, delete tracked assets, or change deployment roots unless the user explicitly asks.
