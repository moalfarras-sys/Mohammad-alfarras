# SEO Final QA

Date: 2026-06-15 · Verified via local server.

## Passing
- **robots.txt**: `Allow: /`; `Disallow: /admin`, `/admin/`, `/api/`, `/downloads/`, `/draft/`, `/*/draft/`, `/ai`, `/ar/ai`, `/en/ai`; `Sitemap: https://moalfarras.space/sitemap.xml`.
- **sitemap.xml**: no `/ai`; localized public pages + work/project URLs only. Legal pages excluded until published.
- **Per-page metadata**: canonical + `hreflang` (`ar`, `en`, `x-default`) configured (`layout.tsx`, per-page `generateMetadata`).
- **Structured data**: Person / Organization / WebSite JSON-LD in root layout.
- **Viewport**: `width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover`.
- Visitor-facing tech jargon removed from titles/descriptions on home, services, work (code + live CMS content).

## Findings / recommendations
1. **`<html lang>` on SSR** is `lang="ar" dir="rtl"` for **all** pages, including English. It is corrected client-side by an in-`<head>` IIFE and a per-locale content `<div lang dir>`, so real users and JS-rendering crawlers get the right value. **Recommendation:** make the root `<html lang/dir>` locale-correct in SSR (drive it from the `[locale]` segment) for non-JS crawlers. Pre-existing, mitigated; not a launch blocker.
2. **SEO `keywords` + JSON-LD `knowsAbout`** still name frameworks ("Next.js developer", "React", "Tailwind CSS", "Supabase"). **Kept deliberately** as search-targeting; these are not rendered as on-page visitor text. Remove if you want zero framework mentions anywhere.
3. `x-default` points to `/en` on internal pages and `/ar` at root — confirm the intended default.

## Not done this session
- Google Search Console resubmission / URL inspection.
- Live production crawl of all sitemap URLs (done in a prior pass per docs; re-run after deploy).
