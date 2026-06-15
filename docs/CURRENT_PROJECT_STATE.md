# Current Project State

Updated: 2026-06-15

## 2026-06-15 AI, Support, Legal, and Reporting Pass

- The standalone localized AI route is active again at `/en/ai` and `/ar/ai`. It uses `apps/web/src/components/site/ai-assistant-page.tsx` and the existing `/api/ai/site-assistant` backend, while the floating Mo Ai widget remains available site-wide.
- Main navigation and mobile dock include `Mo Ai`; sitemap includes `/ai`. This supersedes the older 2026-06-06 note that the standalone AI page should stay redirected.
- The support page at `/en/support` and `/ar/support` was rebuilt as a diagnostic support form for MoPlayer Pro, Classic, PC, website requests, and other issues. Visitor-facing internal/TODO legal text was removed.
- `/api/app/support` now stores structured diagnostics: product/area, issue type, device, app version, optional WhatsApp/phone, message, and optional screenshot upload metadata. Screenshots target the private Supabase Storage bucket `support-uploads`; migration `20260615100000_support_uploads_bucket.sql` creates/updates that bucket.
- Legal public routes were added for `/impressum`, `/terms`, `/app-disclaimer`, and `/download-disclaimer`. They stay 404/hidden until the admin publishes complete legal owner details.
- Admin Website Control has a new Legal Pages section. Publishing is blocked server-side unless responsible name, address, and email are present. Published legal links are then added to the footer and sitemap.
- Admin Website Control Key Site Images supports media-library selection and direct device upload for homepage portrait/product/activation, apps hero, AI hero, support hero, and legal hero.
- CMS project cover/gallery selections are respected; hard-coded visual overrides for specific slugs were removed.
- Privacy can now receive an admin-managed extra note from the same `legal_pages` setting.
- Vercel cron is configured in `vercel.json` for `/api/cron/report` on `0 7 */10 * *`; the route still emails the owner and now also writes a copy to `automation_inbox`.
- CV export filenames now include 2026: `Mohammad-Alfarras-CV-2026-{locale}-{variant}.pdf` and `Mohammad-Alfarras-CV-2026-{locale}.docx`.
- Static public CV aliases exist for `Mohammad-Alfarras-CV-2026-DE.pdf`, `Mohammad-Alfarras-CV-2026-EN.pdf`, and `Mohammad-Alfarras-CV-2026-AR.pdf`.
- Verification passed on 2026-06-15: `npm run verify:web`, `npm run verify:admin`, and `npm run verify:moplayer-dashboard`. Browser QA covered desktop/mobile `/en/ai`, desktop/mobile `/en/support`, hidden `/en/impressum`, and footer legal gating on `http://127.0.0.1:3000`.
- Production is deployed: public site deployment `dpl_3UCzrS96sX8HGtahpfvTBzasKZP4` is live on `https://moalfarras.space`, and admin deployment `dpl_BEhs3CnhugYB6QMyeKsRNbH7F7ey` is live on `https://admin.moalfarras.space`.
- Supabase Storage bucket `support-uploads` exists in production as a private support screenshot bucket.

## 2026-06-06 Work and Case Study Experience

- The Work page now uses `apps/web/src/components/site/work-digital-exhibition.tsx` as an interactive portfolio discovery surface. It includes category filters, a project selector, a highlighted project narrative, real CMS metrics, the existing live football proof widget, and the full project grid.
- Every project has an internal case-study route as the primary action: `/{locale}/work/{slug}`. Live websites and product pages are secondary actions, so visitors do not leave the portfolio before seeing the project story.
- `apps/web/src/components/site/portfolio-pages.tsx` now presents challenge, decision, result, metrics, tags, gallery, and previous/next project navigation.
- Work and case-study actions can open the existing `Mo Ai` widget with a project-specific prompt through the `mo-ai:open` browser event. Keep this as a widget integration; do not restore a standalone AI navigation page.
- The Work football widget removes duplicate provider rows by match ID and date before rendering.
- Regression coverage lives in `apps/web/tests/e2e/control-center-and-seo.spec.ts`. The suite checks the work spotlight, internal case-study path, Mo Ai handoff, Arabic mobile overflow, case-study story, and project navigation.
- Last verification: `npm run verify:web`; focused Playwright on desktop Chromium and mobile Chromium, `9/9` tests in each; production-build visual QA at `http://127.0.0.1:3010` with no console errors.
- Live deployment: `dpl_BzNCz6neRNsGAfkVeqa1g6oTv2Ma`, aliased to `https://moalfarras.space`. Production checks passed for English Work, Arabic Work mobile, and the MoPlayer case study.

## 2026-06-06 Public Indexing Cleanup

- Google Search Console metadata showed `Discovered - currently not indexed`; the exported CSV did not include example URLs, only the issue type.
- Production `robots.txt` and `sitemap.xml` were reachable with HTTP 200, but the sitemap included redirect-only shortcut URLs: `https://moalfarras.space/app`, `https://moalfarras.space/privacy`, and `https://moalfarras.space/support`.
- `apps/web/src/app/sitemap.ts` now advertises only final localized public pages and localized work/project URLs. Shortcut redirects remain live, but they are no longer submitted as sitemap URLs.
- Superseded on 2026-06-15: `/ar/ai` and `/en/ai` are standalone localized Mo Ai pages again, and AI is back in desktop/mobile navigation and the sitemap.
- Shared page metadata now points `x-default` to the matching English page instead of incorrectly pointing every internal page to `/en`.
- Static sitemap entries no longer publish a constantly changing `lastmod`; project entries use their real update timestamp when one exists.
- Desktop navigation links are single-line and non-shrinking, with an earlier switch to the menu layout on medium widths so Arabic and English labels do not overlap or get clipped.
- Production deployment `dpl_HnjbmLff7o5RyGUkpghGCDXF6E2G` is live on `https://moalfarras.space` and `https://www.moalfarras.space`.
- Production verification covered all 46 sitemap URLs: every URL returned HTTP 200, used a matching canonical URL, included `x-default`, and did not publish `noindex`. Arabic/English desktop and mobile visual QA also passed for home, MoPlayer Pro, activation, navigation, and the chatbot widget.
- `apps/web/src/app/robots.ts` now uses one clear rule for all crawlers: allow public pages, disallow `/admin`, `/api/`, and `/downloads/`, and publish the canonical sitemap URL.
- `apps/web/tests/e2e/control-center-and-seo.spec.ts` includes a regression check that sitemap output contains final public pages and excludes redirect-only shortcut URLs.
- After deployment, resubmit `https://moalfarras.space/sitemap.xml` in Google Search Console and use URL Inspection on priority pages such as `/en`, `/en/apps/moplayer2`, `/ar/apps/moplayer2`, `/en/work`, and `/ar/work`.

## Operating Model

This monorepo serves three production surfaces:

- Public website and app API gateway: `apps/web` -> `https://moalfarras.space`
- Admin control center: `apps/admin` -> `https://admin.moalfarras.space`
- Android apps:
  - MoPlayer Classic: `apps/moplayer-android`, slug `moplayer`, package `com.mo.moplayer`
  - MoPlayer Pro: `apps/moplayer2-android`, slug `moplayer2`, package `com.moalfarras.moplayerpro`

There is only one real admin. It is `apps/admin`. The old localized public-site admin in `apps/web/src/app/[locale]/admin` has been removed. Public legacy admin URLs now redirect to the admin app.

## Legacy Admin Redirects

Implemented in:

- `apps/web/src/proxy.ts`
- `apps/web/next.config.ts`
- `apps/web/src/app/admin/page.tsx`

Behavior:

- `/admin` redirects to `https://admin.moalfarras.space`
- `/en/admin` and `/ar/admin` redirect to `https://admin.moalfarras.space`
- `/en/admin/*` and `/ar/admin/*` redirect to `https://admin.moalfarras.space/website`

Do not add admin UI back to `apps/web`.

## Current Admin App

Main files:

- Shell/navigation: `apps/admin/src/components/admin/admin-shell.tsx`
- Overview: `apps/admin/src/components/admin/pages/home-dashboard.tsx`
- Website CMS: `apps/admin/src/components/admin/pages/website-control.tsx`
- Product operations: `apps/admin/src/components/admin/pages/app-control.tsx`
- Email center: `apps/admin/src/components/admin/pages/email-center.tsx`
- AI/automation: `apps/admin/src/components/admin/pages/ai-operations.tsx`
- Server actions: `apps/admin/src/app/actions.ts`
- Product/admin data: `apps/admin/src/lib/app-ecosystem.ts`
- Website CMS data: `apps/admin/src/lib/website-cms.ts`

Visible routes:

- `/`
- `/website`
- `/moplayer`
- `/moplayer-pro`
- `/email`
- `/ai`
- `/login`

## Current Public Web App

Main app-facing routes:

- `/en/apps/moplayer`
- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`
- `/api/app/releases/latest?product=moplayer2`
- `/api/app/activation/*`
- `/api/app/support`
- `/api/app/events`
- `/api/app/diagnostics`

`apps/web/src/lib/app-ecosystem.ts` is now public-facing. Admin-only product/release/image mutation helpers were removed from this file; those live in `apps/admin/src/lib/app-ecosystem.ts`.

## Android Linkage

MoPlayer Pro reads:

- `BuildConfig.WEB_API_BASE_URL`, default `https://moalfarras.space`
- `BuildConfig.APP_PRODUCT_SLUG`, default `moplayer2`
- Runtime config from `/api/app/config?product=moplayer2`
- Activation/source handoff from `/api/app/activation/*`
- Latest APK from `/api/app/download/latest?product=moplayer2`

MoPlayer Classic uses slug `moplayer` and keeps legacy activation compatibility where older rows may have `product_slug = null`.

## QR Source Handoff Rule

Supabase is not a permanent provider/server store for Android sources.

- Server credentials may exist only as a short-lived encrypted QR handoff queue under hashed `app_settings` keys.
- `/api/app/activation/source` returns a pending source only once. After the first successful device fetch, the encrypted payload is removed immediately and only a non-sensitive short-lived receipt remains.
- `/api/app/activation/source/ack` deletes the receipt and the temporary device source auth hash. If import fails or times out, the user must create a new QR activation.
- MoPlayer Classic polls for website-delivered sources only within a 20 minute local window after a fresh QR activation, then stops permanently for that session.
- MoPlayer Pro no longer exposes the old direct Supabase activation-code/device-activation endpoints. Source import is only through the website QR handoff, then the app saves the server locally.
- `device_provider_sources` was a legacy persistent-source table and is dropped by migration. Do not rebuild features on it.
- Android apps bundle ISRG Root X1 because older Android TV/API 24 images may not trust current Let's Encrypt chains for `moalfarras.space` or playlist hosts. Keep the bundled certificate in both Android apps unless minimum SDK/device support changes.
- MoPlayer Pro must display website-issued `MO-XXXX` activation codes only. Fake/offline `MOPRO-*` codes are intentionally not allowed because the website cannot activate them.

## Telemetry and Diagnostics

Public intake:

- `/api/app/events` writes to `app_device_events` and still queues `automation_events`
- `/api/app/diagnostics` writes to `app_diagnostic_reports`
- Diagnostic category/severity values are normalized before insert so app-side custom values do not violate production DB constraints. DB-safe categories are `general`, `playback`, `activation`, `source`, and `crash`; DB-safe severities are `normal`, `low`, `high`, and `critical`.

Admin display:

- Each app page in `AppControl` now shows Diagnostics and Device Events.
- Diagnostic reports can be moved through `new`, `reviewing`, `resolved`, and `archived`.
- Device lists are scoped by product, activation requests, diagnostics, and app events, so devices that report without a fresh activation can still appear.

## Removed Legacy Files

Removed from `apps/web`:

- `src/app/[locale]/admin/*`
- `src/components/admin/*`
- `src/lib/auth.ts`
- `src/lib/admin-auth.ts`
- `src/lib/admin-actions.ts`
- `tests/unit/auth-password.test.ts`

These belonged to the old public-site admin and should not be restored unless the product decision changes intentionally.

## Important Caution

The worktree may contain unrelated Android/APK/docs changes from other work. Do not revert them casually. APK files under `apps/web/public/downloads` are release mirrors and may be intentionally tracked.

## Live Service Audit

Last checked locally on 2026-06-05 with real `.env.local` secrets, without printing secret values:

- Supabase service-role access works.
- `app_products` contains `moplayer` and `moplayer2`.
- `app_releases` contains published releases for both products: MoPlayer Classic `2.2.16`, MoPlayer Pro `2.5.20`.
- One Supabase Auth user exists and has an `admin` role in `app_admin_roles`.
- SMTP verification works, and a live `/api/contact` smoke test returned `delivered: true`, `stored: true`, and `customerReceipt: true`.
- YouTube Data API works for the configured channel.
- Weather API works for Berlin.
- API-Football key is present but the upstream API-Football account reports `access: account is suspended`; `/api/football` still works through the ESPN scoreboard fallback and returns World Cup 2026 schedule data.
- RapidAPI `free-api-live-football-data` is configured as a server-side fallback in `app_private_settings`. The public route uses it through the website only; Android apps do not receive API keys.
- The public Work/projects page has a compact live match widget that reads `/api/football` and displays only real provider data. It currently shows World Cup 2026 fixtures from the ESPN fallback when no higher-priority paid/live provider has usable top-league data.
- `/api/ai/site-assistant` and `/api/app/assistant` return working replies and store conversations when allowed by the route.
- `/api/app/events` and `/api/app/diagnostics` were smoke-tested with temporary device data, then the test rows were deleted.
- `/api/automation/health` no longer self-fetches local pages; it checks real dependencies directly and reports Supabase, SMTP, YouTube, Weather, football fallback, and both app release channels.
- Production downloads were verified from `https://moalfarras.space`:
  - MoPlayer Classic latest download resolves to `/downloads/moplayer/app-sideload-universal-release.apk`, `52792635` bytes, SHA-256 `79701639678373dda3b44c07347c22bd799975767a2eb260943c50609f1f9a0d`.
  - MoPlayer Pro latest download resolves to `/downloads/moplayer2/app-release.apk`, `49260800` bytes, SHA-256 `477beee677797ae489ec6afce71fe369a31f020ecb18fd3d12ec0d4192907a0f`.
- Android API 24 emulator QA used the only available local AVD, `MoPlayer_Classic_API24_TV_720p`, sequentially for both apps. Classic and Pro both generated real website `MO-XXXX` QR codes, imported a QR-delivered public M3U source, loaded home content, and left no provider source/auth payload behind in Supabase after acknowledgement.

## Verification Commands

Run from repo root:

```powershell
npm run typecheck:web
npm run typecheck:admin
npm run verify:web
npm run verify:admin
npm run verify:moplayer-dashboard
```

For Android changes:

```powershell
npm run verify:android
```

Last local verification on 2026-06-05:

- `npm run verify:production` passed, including `verify:web`, `verify:admin`, `verify:moplayer-dashboard`, and `verify:android`.
- `npm --prefix apps/web exec -- playwright test` passed after installing the local Playwright Chromium browser.
- Browser smoke check passed for `http://127.0.0.1:3000/en`, legacy `/en/admin/settings` redirect, and `http://127.0.0.1:3001/login`.
- Production browser smoke checks passed for `https://moalfarras.space/en`, `https://moalfarras.space/en/apps/moplayer2`, `https://moalfarras.space/en/activate?product=moplayer2`, and `https://admin.moalfarras.space/login`.
