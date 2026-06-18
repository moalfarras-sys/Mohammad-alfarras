# Admin CMS Reality Matrix

Date: 2026-06-15

Status legend:
- PASS: changed, inspected, or verified against the public route this session.
- PARTIAL: admin/data path exists, but the full browser mutation matrix was not exhaustively repeated for every page.
- ATTENTION: documented limitation that should stay visible after deployment.

Evidence files:
- `tmp-admin/qa/pc-public-reflection-result.json`
- `tmp-admin/qa/pc-admin-image-qa-restore.json`
- `tmp-admin/qa/services-projects-cms-qa.json`
- `tmp-admin/qa/contact-support-qa.json`
- `tmp-admin/qa/public-route-content-scan.json`
- `tmp-admin/qa/db-public-content-scan.json`

| Page | Section | Field | Current source | Editable in admin? | Admin screen | Test action | Public result | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Hero/page copy | title, subtitle, SEO | `pages`, `page_translations`, `site_settings` | yes | Admin > Website > Pages/Home | code/data audit and public scan | `/ar`, `/en` 200 with no forbidden visitor terms | PASS |
| Home | Profile/footer image | media asset + site settings | `media_assets`, `site_settings` | yes | Admin > Website > Media / Key site images | corrected Arabic alt text in DB | DB scan clean | PASS |
| Services | Service title | `service_offering_translations.title` | yes | Admin > Website > Services | changed title to QA marker | marker reflected on `/en/services` | PASS |
| Services | Service visibility | `service_offerings.is_active` | yes | Admin > Website > Services | set existing service inactive | marker disappeared from `/en/services` | PASS |
| Services | Add service | `service_offerings`, translations | yes | Admin > Website > Services | inserted QA service then restored | QA service reflected, then removed | PASS |
| Services | Service image | `service_offerings.cover_media_id` -> `media_assets` | yes | Admin > Website > Services / Media | switched via QA service media | public page used managed media | PASS |
| Work | Project title/description | `work_project_translations` | yes | Admin > Website > Projects | changed QA title/description | marker reflected on `/en/work` | PASS |
| Work | Project visibility | `work_projects.is_active` | yes | Admin > Website > Projects | hid existing project | marker disappeared from `/en/work` | PASS |
| Work | Add project | `work_projects`, translations | yes | Admin > Website > Projects | inserted QA project then restored | QA project reflected, then removed | PASS |
| Work | Project image | `work_projects.cover_media_id` -> `media_assets` | yes | Admin > Website > Projects / Media | switched cover media to `m34` | public route contained managed image reference | PASS |
| Contact | Form submission | `contact_messages` | yes | Admin > Email/Website messages | submitted QA contact request | stored, delivered, receipt true, status archived | PASS |
| Support | App support ticket | `app_support_requests`, `support-uploads` | yes | Admin > Email/App issues and app support inbox | submitted MoPlayer PC support with screenshot | stored with screenshot path, status archived | PASS |
| Navigation | Header links | `site.ts` navigation and shared layout | no public admin editor yet | Admin can manage page visibility, not nav order fully | scanned key public routes | no `Mo Ai` link in header/footer | PASS |
| Footer | Mo Ai removal | shared footer/nav content | no direct footer link editor yet | Admin > Website settings for images/copy | scanned key public routes | no `Mo Ai` in footer/header | PASS |
| AI page | Public route | redirect/noindex route | no | code route only | opened `/en/ai`, `/ar/ai` | 307 to `/en` and `/ar`; sitemap excludes `/ai` | PASS |
| MoPlayer Family | PC card image | `windows_release.cardImage`, `heroImage`, `screenshotItems` | yes | Admin > MoPlayer PC > Images | replaced PC image with QA image | reflected on `/en/apps/moplayer` | PASS |
| MoPlayer PC | Hero image | `site_settings.windows_release.heroImage` | yes | Admin > MoPlayer PC > Hero image | replaced with QA image | reflected on `/en/apps/moplayer-pc` | PASS |
| MoPlayer PC | Card image | `site_settings.windows_release.cardImage` | yes | Admin > MoPlayer PC > Card image | added admin field and action | family/app cards now read it | PASS |
| MoPlayer PC | Screenshots | `site_settings.windows_release.screenshotItems` | yes | Admin > MoPlayer PC > Gallery | added QA screenshot item | reflected in PC gallery | PASS |
| MoPlayer PC | Release/status | `site_settings.windows_release` | yes | Admin > MoPlayer PC > Release | code audit and existing form verified | maintenance/download controls wired | PASS |
| App pages | Pro/Classic images | `app_products`, `app_screenshots`, ecosystem reader | yes | Admin > Apps | page now receives ecosystem data | family page uses managed data | PASS |
| Downloads | PC installer button | `windows_release.file/downloadUrl` + bundled Windows fallback | yes | Admin > MoPlayer PC > Release | tested CMS media-only settings plus bundled release | setup and portable APIs redirect to GitHub Releases; button is visible only when a file exists | PASS |
| Media Library | Upload/alt/where used | `media_assets`, `site-media` | yes | Admin > Website > Media | added usage labels and delete guard | used images cannot be deleted blindly | PASS |
| SEO/OG | Page social image | `page_translations`, media settings | yes | Admin > Website > Pages | code/data audit | OG paths read managed page/product data where wired | PARTIAL |
| 404 | Copy/image | `_not-found` fallback | not fully admin-editable | none | build route exists | no full admin editor added | ATTENTION |

Conclusion: The critical MoPlayer PC image problem is fixed and proven. Services, projects, contact, support, app PC media, public content cleanup, revalidation, and Windows download routing are proven. The remaining documented limitation is the fully admin-editable 404 page; it is not a live product/download blocker for the current homepage MoPlayer section and deployment request.
