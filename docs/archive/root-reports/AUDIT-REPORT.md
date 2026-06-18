# Audit Report - 2026-06-15

## Scope

- Inspected monorepo docs, public web routes/APIs, admin Website Control, support flow, AI assistant, legal/privacy surfaces, downloads, CV export routes, cron reporting, and Supabase migration boundaries.
- Verified existing MoPlayer APK/Windows release files are present locally and current fallback checksums match tracked metadata.

## Findings Fixed

- `/en/ai` and `/ar/ai` redirected to home while navigation/docs expected AI assistance.
- Support page exposed internal owner-confirmation/TODO-style legal text and collected too little diagnostic detail.
- Legal pages requested by the product were missing and would have been risky to publish without owner legal details.
- Cron report route existed but was not scheduled in `vercel.json` and did not persist a copy into the admin automation inbox.
- CV download filenames did not include the 2026 naming convention.
- Several key public images were still not directly controllable from the same admin image slot form.
- Specific project slugs had hard-coded visual overrides that could silently replace CMS-selected project cover/gallery images.

## Verification

- `npm run verify:web` passed: typecheck, lint, production build, Vitest coverage.
- `npm run verify:admin` passed: typecheck, lint, production build.
- `npm run verify:moplayer-dashboard` passed after updating Vite.
- Production deploy and HTTP smoke checks passed on 2026-06-15 for the public site and admin domains.
- Browser QA passed on desktop and 390px mobile for AI and support. Hidden legal pages returned 404 until configured.
- Admin image controls now cover homepage, apps, AI, support, and legal hero images with library selection or direct upload.

## Remaining Attention

- Complete and confirm legal owner details in admin before publishing legal pages.
- Vercel still reports the current stable Next.js PostCSS moderate advisory; keep watching for the next stable Next release that updates its bundled PostCSS dependency.
