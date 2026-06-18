# Admin Redesign Report - 2026-06-18

Scope: `apps/admin` inside the `moalfarras.space` monorepo.

## What Changed

- Added a dedicated `/media` route named **Media Control Center**.
- Added a global command palette (`Ctrl/Cmd+K`) for fast navigation to real control surfaces.
- Added Media Library to the desktop sidebar, mobile dock, PWA shortcuts, dashboard quick actions, and helper links.
- Added `/media` server actions that keep the owner inside the media screen after upload, delete, and site-image save operations.
- Updated dashboard entry points so website images, app visuals, maintenance, app colors, and customer notes are visible from the first screen.

## Real Control Surfaces

The redesigned admin links to existing real data/actions:

| Area | Admin route | Backing data/action |
| --- | --- | --- |
| Media upload | `/media#upload` | Supabase Storage `site-media`, table `media_assets`, `uploadMediaLibraryAction` |
| Media library | `/media#library` | `media_assets`, delete guarded by server-side usage checks |
| Website image slots | `/media#site-images` | `site_settings.site_images`, `saveMediaSiteImagesAction` |
| Website CMS | `/website` | brand, theme, legal, offers, services, projects, pages, contact messages |
| Classic runtime | `/moplayer/classic#runtime` | `moplayer_public_config` |
| Pro runtime | `/moplayer/pro#runtime` | `moplayer2_public_config` |
| Pro app page images | `/moplayer/pro#product-content`, `/moplayer/pro#visual-assets` | `app_products`, `app_screenshots`, `app-media` |
| iOS public page | `/moplayer/ios#ios-runtime` | `moplayer2_public_config.ios` |
| PC visuals | `/moplayer/pc#images` | `site_settings.windows_release`, `media_assets` |
| Website messages | `/website#messages` | `contact_messages`, email reply action |
| App support/diagnostics | `/moplayer/*#support-inbox`, `/moplayer/*#telemetry` | app support requests, diagnostic reports, device events |

## Image Bindings

The new Media Control Center exposes these site image keys:

- `home.hero.profile` -> `site_images.home_portrait`
- `home.moplayer.hero` -> `site_images.home_product_hero`
- `home.activation.preview` -> `site_images.home_product_secondary`
- `activation.hero` -> `site_images.activation_hero`
- `apps.hero` -> `site_images.apps_hero`
- `ai.hero` -> `site_images.ai_hero`
- `support.hero` -> `site_images.support_hero`
- `legal.hero` -> `site_images.legal_hero`

It also surfaces app image paths without making them fake fields:

- Classic logo, hero, TV banner, and screenshots are edited in `/moplayer/classic`.
- Pro logo, hero, TV banner, and screenshots are edited in `/moplayer/pro`.
- iOS preview image is edited in `/moplayer/ios`.
- PC hero/card/gallery images are edited in `/moplayer/pc`.

## Buttons Added Or Rewired

- **Search controls** opens the command palette and links only to existing routes/anchors.
- **Upload to library** writes a real `media_assets` record and uploads the file to Supabase Storage.
- **Save website image slots** writes real `site_settings.site_images` values.
- **Delete media** calls the same server-side media deletion guard and is disabled in the UI when a visible usage is detected.
- **Manage iOS / Edit content/images / Open runtime** link to existing real editors.
- **Preview** buttons open public pages on `moalfarras.space`.

## Not Faked

These features were not presented as completed controls because they require separate schema/app-client work:

- Push notifications to a specific device.
- Full RBAC role-management UI beyond the current authenticated admin/editor checks.
- Image crop variants and automatic WebP conversion pipeline.
- Automatic database/media backup scheduler.
- iOS in-app runtime consumption beyond the public iOS page controls.

## Verification

Completed locally:

```powershell
npm --prefix apps/admin run typecheck
```

Run before production deploy:

```powershell
npm run verify:admin
npm run verify:production
```
