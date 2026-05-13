# Agent Guide

This repository is a production monorepo. Keep changes scoped, verified, and easy to hand off.

## Start Here

Read these files before making broad changes:

- `README.md`: product overview, domains, core commands.
- `docs/DEVELOPMENT_WORKFLOW.md`: local setup, verification, deploy flow.
- `docs/architecture.md`: ownership boundaries and data flow.
- `docs/PROJECT_HANDOFF.md`: current production notes.
- `docs/PRODUCTION_GUIDE.md`: release and operations details.

## Modern Research Policy

The project is maintained in May 2026. Do not assume framework, platform, Android, Vercel, Supabase, or browser behavior from memory when the topic may have changed.

Before changing modern or fast-moving areas, research the current best practice first:

- Next.js, React, App Router, Server Components, middleware/proxy, caching, Turbopack, metadata, image handling, and security headers.
- Vercel deploys, project settings, production aliases, environment variables, build output, CLI behavior, logs, and rollbacks.
- Android, Kotlin, Gradle, Jetpack Compose, Media3/ExoPlayer, LibVLC, Android TV focus/navigation, permissions, and Play Store requirements.
- Supabase Auth, Postgres/RLS, Storage, Edge Functions, security advisors, migrations, and client/server key handling.
- IPTV/OTT playback, M3U/Xtream parsing, EPG handling, buffering, retry policy, lifecycle, remote control UX, and legal content boundaries.
- Accessibility, Arabic/RTL UI, responsive design, performance, image formats, Core Web Vitals, and modern browser compatibility.

Use primary sources first: official framework docs, Android Developers, Vercel docs, Supabase docs, package release notes, and source repositories. Use blog posts or forum threads only as supporting context, not as the authority.

If internet access is available, look up the current docs before making architecture, dependency, deployment, permissions, security, or performance decisions. Record any important source or version assumption in the final handoff when it affects the implementation.

Do not add a trendy dependency just because it is new. Prefer the existing stack unless research shows a clear reliability, security, performance, or maintainability win.

## Required Agent Skills

Match the work to the strongest available skill or toolset before editing:

- IPTV or Android player work: use IPTV/OTT and Android QA guidance; prioritize playback stability, lifecycle, retry behavior, focus, and source handling.
- Web UI work: use modern frontend, React/Next.js, accessibility, responsive, visual QA, and browser testing guidance.
- Vercel/deploy work: use Vercel deployment/CI guidance and inspect production after changes.
- Supabase/database work: use Supabase/Postgres guidance and verify migrations before relying on them.
- Security-sensitive work: use security review/threat-model guidance and keep secrets server-side.
- Visual/product polish: use premium IPTV/media-product design guidance and verify desktop/mobile screenshots.

If a requested change crosses multiple areas, plan the ownership boundaries first, then edit the smallest safe set of files.

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
