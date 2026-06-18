# CMS Reality Test — Admin ⇄ Site Binding

Date: 2026-06-15 · Branch: `cursor/admin-panel-upgrade`

## Method

The public site (`apps/web`) and the admin app (`apps/admin`) connect to the **same production Supabase project**. The admin writes via server actions in `apps/admin/src/lib/website-cms.ts` (`saveWebsiteService`, `deleteWebsiteService`, `saveWebsiteProject`, `saveSiteSetting`, media/app helpers). The public site reads the **same tables** in `apps/web/src/lib/content/store.ts` (`pages`, `page_translations`, `service_offerings`, `service_offering_translations`, `work_projects`, `work_project_translations`, `media_assets`, `site_settings`) and `apps/web/src/lib/app-ecosystem.ts` (`app_products`, `app_releases`, `app_settings`).

Live data confirmed present in production (read-only probe): 9 services (+18 translations), 9 work projects (+18 translations), 12 pages (+24 translations), 26 media assets, 2 app products, 64 releases, 40 app settings, 5 stored contact messages, 10 `site_settings` keys.

A **reversible end-to-end test** was run against the same data path the admin uses, then read from the live rendered pages (snapshot cache `revalidate: 30`). All test mutations were restored.

## Results

| Item | Edited in admin (table/setting) | Shows on site | Tested live? | Result | Notes |
|---|---|---|---|---|---|
| Service title text | `service_offering_translations.title` | `/en/services` | ✅ Yes | **PASS** | Set sentinel title → appeared on page; restored |
| Hide a service | `service_offerings.is_active=false` | `/en/services` | ✅ Yes | **PASS** | Service disappeared from page; restored to active |
| Service description (AR+EN) | `service_offering_translations.description` | `/en/services`, `/ar/services` | ✅ Yes | **PASS** | Jargon removed from `srv-uiux`; new copy live |
| Service image | `service_offerings.cover_media_id` → `media_assets` | `/services` | ⚙️ By shared mechanism | PASS (path verified) | `getServices()` resolves cover via `media_assets`; same read path proven above |
| Add a new service | insert `service_offerings` row | `/services` | ⚙️ By shared mechanism | PASS | `getServices()` renders all `is_active` rows sorted by `sort_order` |
| Add/edit a project | `work_projects` + `work_project_translations` | `/work`, `/work/{slug}` | ✅ Tags edited live | **PASS** | `wp-ecosystem` tags rewritten → live on `/en/work` |
| Project image / gallery | `work_project_media` → `media_assets` | `/work/{slug}` | ⚙️ By shared mechanism | PASS (path verified) | `getProjects()` resolves cover/gallery via `media_assets` |
| App version shown | `app_settings` runtime config (`latestVersionName`) | `/en/apps/moplayer2` | ✅ Yes | **PASS** | config API `2.5.20` === rendered `2.5.20` |
| App maintenance / disabled | `app_settings` runtime config (`enabled`/`maintenanceMode`) | app page + `/api/app/download/latest` | ⚙️ Code path verified | PASS | Route returns `503`; landing hides download, shows "App under maintenance"/"Downloads disabled". Not flipped live to avoid disrupting real downloads. |
| Site images (hero/portrait/product) | `site_settings.site_images` / `media_assets` | home, apps, support, legal | ⚙️ By shared mechanism | PASS (path verified) | `resolveSiteImages(snapshot)` reads `site_settings`/media |
| Brand profile name | `site_settings.brand_profile` | profile surfaces | ⚙️ By shared mechanism | PASS (path verified) | `getProfile()` reads `brand_profile` |
| Promo offers | `site_settings.site_offers` | home/services/apps | ⚙️ By shared mechanism | PASS (path verified) | `getOffers()` reads `site_offers`, filters by `isActive`/placement |
| YouTube curation | `site_settings.youtube_curation` | `/youtube`, home | ⚙️ By shared mechanism | PASS (path verified) | `buildSiteModel` applies exclude/pin/feature |
| Contact messages captured | `/api/contact` → `contact_messages` | admin Leads | ✅ Data present | PASS | 5 real rows already stored in production |
| Delete unused image | `media_assets` delete | media library | ⚙️ Not run live | Pending | Mechanism present; not exercised to avoid deleting real assets |
| Block deleting a used image | usage check | media library warning | ⚙️ Not run live | Pending | Requires admin UI session; recommend manual confirm |

## Honest scope note

- The binding **mechanism** (admin write → same Supabase table ← web read) was proven **live and reversible** for services (edit + hide) and work-project tags, plus a live app-version correlation. Every other row above uses the **identical** read/write path, so it is verified by shared mechanism + code, not by a separate live click-through of the admin UI.
- One real gap: the **home-page hero headline/subhead copy is hardcoded** in `apps/web/src/components/site/digital-os-vnext.tsx` (a code edit to it appears live, and a `home_content` setting exists but the current hero component does not consume it). Home images, services, projects, apps, offers, profile, contact, and legal **are** CMS-driven. If hero copy must be admin-editable, wire the hero to `home_content`.

## Where the data lives in Supabase (data map)

| Surface | Table / setting | Admin editor |
|---|---|---|
| Services (title/desc/bullets/order/visibility) | `service_offerings` (+ `service_offering_translations`) | `/website` → Services |
| Service image | `service_offerings.cover_media_id` → `media_assets` | `/website` → Services / Media |
| Projects / case studies | `work_projects` (+ `work_project_translations`, `work_project_media`, `work_project_metrics`) | `/website` → Work |
| Pages + SEO | `pages` (+ `page_translations`) | `/website` → Pages |
| Site images (hero/portrait/product) | `site_settings.site_images` + `media_assets` | `/website` → Key Site Images |
| Brand profile / home content / offers / youtube | `site_settings` keys: `brand_profile`, `home_content`, `site_offers`, `youtube_curation` | `/website` |
| Apps (name/version/maintenance/copy/FAQ) | `app_products`, `app_releases`, `app_settings` (runtime config), `site_settings.moplayer*_public_config` | `/moplayer`, `/moplayer-pro`, `/moplayer-pc` |
| Contact / support leads | `contact_messages`, support intake + `support-uploads` bucket | `/website` Leads, `/email` |
| Download counts | `analytics_events` + `site_settings.download_counts` | dashboard |

## Live content changes made 2026-06-15 (documented + migration-backed)

Applied directly to production Supabase **and** codified in `supabase/migrations/20260615170000_visitor_copy_jargon_cleanup.sql` so production no longer depends on undocumented manual edits:

- `service_offering_translations`: `business-websites` (en) title/desc — removed "CMS-Controlled".
- `service_offering_translations`: `srv-uiux` (en + ar) desc — removed "Next.js, React, TypeScript".
- `work_project_translations`: `wp-ecosystem` (en + ar) `tags_json` — removed "Next.js" / "RTL/LTR".
- `app_products` `moplayer2`: `tagline`, `long_description`, `feature_highlights`, `how_it_works` — removed "admin-controlled", "Supabase", "Vercel", "runtime settings", "admin product switcher", "Downloader code", "Independent records".
