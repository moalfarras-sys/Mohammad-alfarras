# Deployment Report - 2026-06-15

## Status

- Production deployment was not executed in this task.
- Local verification passed for web and admin.
- Supabase migration was added but not applied from this environment.

## Required Before Production

1. Review the changed files.
2. Apply `supabase/migrations/20260615100000_support_uploads_bucket.sql`.
3. Fill legal owner details in Admin > Website > Legal Pages.
4. Keep legal pages unpublished until responsible name, address, and email are correct.
5. Deploy the public Vercel project `mohammad-alfarras` from `apps/web`.
6. Deploy the admin Vercel project `moalfarras-admin` from `apps/admin`.
7. Inspect:
   - `https://moalfarras.space/en`
   - `https://moalfarras.space/en/ai`
   - `https://moalfarras.space/en/support`
   - `https://moalfarras.space/en/apps/moplayer2`
   - `https://moalfarras.space/api/app/config?product=moplayer2`
   - `https://admin.moalfarras.space`

## Verification Completed Locally

- `npm run verify:web`
- `npm run verify:admin`
- Browser QA on `http://127.0.0.1:3000/en/ai`
- Browser QA on `http://127.0.0.1:3000/en/support`
- Hidden legal route check on `http://127.0.0.1:3000/en/impressum`
