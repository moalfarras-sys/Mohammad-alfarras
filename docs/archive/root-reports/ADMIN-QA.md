# Admin QA

Date: 2026-06-15 · Admin app: `apps/admin` → `admin.moalfarras.space`

## Is the admin real? — Yes
Proven by a live, reversible binding test (full detail in **CMS-REALITY-TEST.md**): editing a service and hiding a service via the same data path the admin uses changed the live `/services` page, then restored.

## Data layer (real, not mock)
- Writes: `apps/admin/src/lib/website-cms.ts` — `saveSiteSetting`, `mergeSiteSetting`, `saveWebsitePage`, `saveWebsiteProject`, `saveWebsiteProjectDetails`, `saveWebsiteService`, `deleteWebsiteService`, `deleteWebsiteProject`, plus app/product/release/media helpers in `apps/admin/src/lib/app-ecosystem.ts`.
- Reads (public site): `apps/web/src/lib/content/store.ts` + `apps/web/src/lib/app-ecosystem.ts` — same tables.

## Production data present (read-only probe)
`site_settings` 10 · `pages` 12 (+24 translations) · `service_offerings` 9 (+18) · `work_projects` 9 (+18) · `media_assets` 26 · `app_products` 2 · `app_releases` 64 · `app_settings` 40 · `contact_messages` 5.

## Admin sections (routes)
`/` dashboard · `/website` (CMS: pages, services, projects, media, key images, legal) · `/moplayer` · `/moplayer-pro` · `/moplayer-pc` · `/email` · `/ai` · `/login`.

## Not exercised this session
- Admin UI click-through under an authenticated session (login flow) — binding was verified at the shared data layer instead.
- Media-library delete + "image in use" warning (avoided deleting real assets).
- Live app maintenance toggle (avoided disrupting real downloads; code path verified instead).
