# Agent Guide: Public Web App

This folder is the public Next.js app for `https://moalfarras.space`. It is not a standalone website. It is the public gateway for the Android apps, activation, releases, support, and shared product metadata.

## Ecosystem Context

- Admin lives in `../admin` and deploys to `https://admin.moalfarras.space`.
- MoPlayer Classic lives in `../moplayer-android`, slug `moplayer`, package `com.mo.moplayer`.
- MoPlayer Pro lives in `../moplayer2-android`, slug `moplayer2`, package `com.moalfarras.moplayerpro`.
- Shared product slug logic lives in `../../packages/shared`.
- Server database helpers live in `../../packages/db`.
- Supabase schema changes live in `../../supabase/migrations`.

## What This App Owns

- Public pages and localized routes under `src/app/[locale]/(site)`.
- MoPlayer and MoPlayer Pro public product pages.
- Activation UI in `src/components/app/moplayer-activation-page.tsx`.
- Public app APIs under `src/app/api/app`.
- APK download routing and release download endpoints.
- Public website CMS routes, SEO, sitemap, manifest, PWA assets.

## Critical Product Rules

- Keep `moplayer` and `moplayer2` separate.
- Public text can say **MoPlayer Pro**, but APIs, URLs, release metadata, and Android integration use `moplayer2`.
- Do not change activation payloads without checking both Android apps and admin.
- Do not remove APKs or public images unless release metadata and all page references are updated.

## Where To Edit

- Product pages: `src/components/app/moplayer-landing.tsx`, `src/components/app/moplayer2-landing.tsx`, `src/lib/app-ecosystem.ts`.
- Activation UI: `src/components/app/moplayer-activation-page.tsx`.
- Activation APIs: `src/app/api/app/activation/*`.
- Runtime config: `src/app/api/app/config/route.ts`.
- Latest downloads: `src/app/api/app/download/latest/route.ts`, `src/app/api/app/releases/[slug]/download/route.ts`.
- Shared product behavior: prefer editing `../../packages/shared/src/app-products.ts`.

## Modern Skills Required

For routing, caching, metadata, middleware/proxy, Server Components, Server Actions, images, or Vercel behavior, verify current Next.js and Vercel docs before editing. This project targets May 2026-era Next.js/React/Vercel behavior.

For UI work, use modern responsive, accessibility, Arabic/RTL, performance, image optimization, and browser visual QA practices.

## Verification

Run from repo root:

```powershell
npm run verify:web
```

For visual or route changes, also smoke test:

```powershell
npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3000
```

Check `/en`, `/ar`, `/en/apps/moplayer2`, `/ar/apps/moplayer2`, `/activate?product=moplayer2&code=MO-DEMO`, `/api/app/config?product=moplayer2`, and `/api/app/download/latest?product=moplayer2`.

## Do Not Do

- Do not move admin-only operations into the public app unless intentionally merging products.
- Do not expose Supabase service role keys or provider source secrets to the browser.
- Do not add dependencies without checking current docs and explaining why the existing stack is insufficient.
- Do not treat this as a marketing-only site; Android activation and app runtime depend on it.
