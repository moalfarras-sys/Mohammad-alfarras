# Deployment Report - 2026-06-15

## Status

- Production deployment completed on 2026-06-15.
- Public Vercel project `mohammad-alfarras` deployed and aliased to `https://moalfarras.space`.
- Admin Vercel project `moalfarras-admin` deployed and aliased to `https://admin.moalfarras.space`.
- Supabase Storage bucket `support-uploads` was created as a private image bucket for support screenshots.
- Local verification passed for web, admin, and the MoPlayer dashboard.

## Production Deployments

- Public site deployment: `dpl_3UCzrS96sX8HGtahpfvTBzasKZP4`
- Admin deployment: `dpl_BEhs3CnhugYB6QMyeKsRNbH7F7ey`

## Production Checks

- `https://moalfarras.space/en` returned HTTP 200.
- `https://moalfarras.space/en/ai` returned HTTP 200.
- `https://moalfarras.space/en/support` returned HTTP 200.
- `https://moalfarras.space/en/apps/moplayer2` returned HTTP 200.
- `https://moalfarras.space/en/activate?product=moplayer2` returned HTTP 200.
- `https://moalfarras.space/api/app/config?product=moplayer2` returned HTTP 200 JSON.
- `https://moalfarras.space/Mohammad-Alfarras-CV-2026-DE.pdf` returned HTTP 200 PDF.
- `https://moalfarras.space/sitemap.xml` returned HTTP 200 XML.
- `https://moalfarras.space/en/impressum` returned HTTP 404 while legal pages are unpublished, as intended.
- `https://admin.moalfarras.space` returned HTTP 200.
- `https://admin.moalfarras.space/website` returned HTTP 200 for the protected admin shell/login flow.

## Verification Completed Locally

- `npm run verify:web`
- `npm run verify:admin`
- `npm run verify:moplayer-dashboard`
- `npm audit --omit=dev --workspaces=false` at repo root returned 0 vulnerabilities.
- `npm audit --omit=dev --workspaces=false` in `apps/web` returned 0 vulnerabilities.
- `npm audit --omit=dev --workspaces=false` in `apps/admin` returned 0 vulnerabilities.
- Browser QA on `http://127.0.0.1:3000/en/ai`
- Browser QA on `http://127.0.0.1:3000/en/support`
- Hidden legal route check on `http://127.0.0.1:3000/en/impressum`

## Remaining Operational Notes

- Fill real legal owner details in Admin > Website > Legal Pages before publishing legal routes.
- Vercel install still prints 2 moderate `postcss` advisories through the current latest stable Next.js `16.2.9`, whose package metadata depends on `postcss 8.4.31`. The patched dependency is only present in `next@16.3.0-canary.51`, so the project stays on stable Next instead of moving production to a canary build.
