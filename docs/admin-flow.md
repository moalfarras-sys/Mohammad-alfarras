# Admin Flow

## Current Decision

There is one active admin surface:

- `apps/admin`
- Production domain: `https://admin.moalfarras.space`
- Local dev: `npm --prefix apps/admin run dev -- --hostname 127.0.0.1 --port 3001`

The public app `apps/web` no longer contains localized admin UI. Legacy URLs on the public domain redirect out:

- `/admin` -> `https://admin.moalfarras.space`
- `/en/admin` and `/ar/admin` -> `https://admin.moalfarras.space`
- `/en/admin/*` and `/ar/admin/*` -> `https://admin.moalfarras.space/website`

This keeps `moalfarras.space` as the public site and app API gateway, and `admin.moalfarras.space` as the only operational control center.

## What Admin Owns

`apps/admin` owns:

- Admin login/session and roles.
- Website CMS controls: brand, services, offers, pages/SEO, projects, media, contact messages.
- MoPlayer Classic (`moplayer`) operations.
- MoPlayer Pro (`moplayer2`) operations.
- Runtime config, releases, APK assets, product content, FAQs, screenshots.
- Activations, devices, licenses, encrypted source-delivery status.
- App support inbox and email replies.
- App diagnostics and device events.
- AI conversations, feedback, automation events/inbox/rules/runs.

## What Public Web Owns

`apps/web` owns:

- Localized public pages under `src/app/[locale]/(site)`.
- Public MoPlayer product pages.
- Activation UI.
- App-facing APIs under `src/app/api/app`.
- Download routing and release download endpoints.
- Public support/contact intake.
- Diagnostics/events intake from Android.
- SEO, sitemap, robots, manifest, and public assets.

Do not add admin-only screens back to `apps/web`.

## Product Boundaries

- `moplayer` = MoPlayer Classic, package `com.mo.moplayer`.
- `moplayer2` = MoPlayer Pro, package `com.moalfarras.moplayerpro`.
- Public copy can say "MoPlayer Pro"; slugs, URLs, DB rows, and Android payloads must keep `moplayer2`.

## Verification

Before deploy:

```powershell
npm run verify:web
npm run verify:admin
```

For Android-facing changes:

```powershell
npm run verify:android
```
