# Deployment Report

Date: 2026-06-15 · Branch: `cursor/admin-panel-upgrade`

## Status: this session's changes are NOT deployed
Per your decision ("continue heavier work first"), production deploy was **held**. No commit or push to `main` was made this session.

Important: the brief's main feature work (AI page → redirect, contact/support rebuild, download metadata, legal routes, jargon fixes) is **uncommitted in the working tree on this branch**. Production (`main`) still runs the previously-deployed code until this branch is committed and merged. The **live CMS content edits** I made (service/work copy) were written directly to production Supabase, so they are already live in the data layer regardless of code deploy.

## Ready / green
- `npm run verify:web` passes: typecheck + lint + build + 12/12 tests.
- `npm run typecheck:admin` passes.
- Key routes 200; downloads, sitemap, robots, contact/support forms, AI widget verified locally (reads prod Supabase).
- Admin⇄site binding proven live and reversible (CMS-REALITY-TEST.md).

## Working-tree changes to commit
- Code (jargon removal): `content/site.ts`, `components/site/digital-os-vnext.tsx`, `components/site/work-digital-exhibition.tsx`, `components/app/moplayer2-landing.tsx`, `components/layout/site-footer.tsx`, `app/layout.tsx`, `app/not-found.tsx`.
- Code (contact attachment): `app/api/contact/route.ts`, `components/site/liquid-contact-form.tsx`.
- The 10 report files in this set.
- (Pre-existing uncommitted feature work on this branch: AI redirect, contact/support, download counters, legal — verify these are intended before merge.)

## Deploy procedure (when authorized)
1. Review + commit code and reports on the branch.
2. Merge/push to `main` → Vercel auto-deploys web (`moalfarras.space`) + admin (`admin.moalfarras.space`).
3. Post-deploy smoke on production: `/en`, `/ar`, `/en/contact`, `/en/services`, `/en/work`, MoPlayer pages; confirm `/ai` redirects + `noindex`; footer/header clean; jargon gone; a real download; sitemap/robots.

## Recommended before deploy
- Pixel multi-device visual pass (VISUAL-FINAL-QA.md) and Lighthouse (PERFORMANCE-FINAL-QA.md).
- Optional: contact file upload; wire home hero to `home_content`; decide on SSR `<html lang>` + SEO framework keywords.

## Cleanup
- Remove `tmp-cms-probe/` (temporary Supabase probe/test scripts created this session), and stale `tmp-web-*.log` / `tmp-download-qa/`.

---
_Note: a prior version of this file described an earlier 2026-06-15 production deployment (pre-AI-removal, when `/en/ai` returned 200). That report is superseded by this one._
