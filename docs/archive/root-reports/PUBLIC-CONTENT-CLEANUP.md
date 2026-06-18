# Public Content Cleanup

Date: 2026-06-15

## Removed or Reworded

Visitor-facing technical/platform copy was removed or rewritten in:
- `apps/web/src/components/site/interactive-cv-page.tsx`
- `apps/web/src/components/site/site-model.ts`
- `apps/web/src/lib/seo-jsonld.ts`
- `apps/web/src/app/opengraph-image.tsx`
- `apps/web/src/lib/app-ecosystem.ts`
- `apps/web/src/content/cv.ts`
- `apps/web/src/content/work.ts`
- `apps/web/src/content/seo-data.ts`
- `apps/web/src/data/rebuild-content.ts`
- `apps/web/src/data/default-content.ts`
- `apps/web/src/data/projects.ts`

MoPlayer PC Windows warning copy was rewritten to avoid absolute safety claims. The public wording now tells users to download only from the official page and verify file name, version, and source.

## Route Scan

Scanned 24 public routes:
- `/ar`, `/en`
- `/ar/services`, `/en/services`
- `/ar/work`, `/en/work`
- `/ar/contact`, `/en/contact`
- `/ar/support`, `/en/support`
- `/ar/apps/moplayer`, `/en/apps/moplayer`
- `/ar/apps/moplayer2`, `/en/apps/moplayer2`
- `/ar/apps/moplayer-pc`, `/en/apps/moplayer-pc`
- `/ar/activate?product=moplayer2`, `/en/activate?product=moplayer2`
- `/ar/youtube`, `/en/youtube`
- `/ar/cv`, `/en/cv`
- `/ar/privacy`, `/en/privacy`

Result: zero forbidden visitor terms.

## Database Scan

Scanned public CMS tables:
- `site_settings`
- `pages`
- `page_translations`
- `media_assets`
- `service_offerings`
- `service_offering_translations`
- `work_projects`
- `work_project_translations`
- `work_project_metrics`
- `app_products`
- `app_releases`
- `app_release_assets`
- `app_screenshots`
- `app_faqs`

Result: zero forbidden content matches.

Evidence:
- `tmp-admin/qa/public-route-content-scan.json`
- `tmp-admin/qa/db-public-content-scan.json`
