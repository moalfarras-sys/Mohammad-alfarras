# Project Handoff

This repository is a production monorepo for the public website, admin control center, Supabase-backed app metadata, and Android MoPlayer apps.

## 2026-06-15 AI, Support, Legal, and Cron Update

- Restored the public standalone Mo Ai page at `/en/ai` and `/ar/ai`, backed by the existing site assistant API. Navigation, footer navigation list, mobile dock, and sitemap now include the AI route.
- Rebuilt the support page into a structured diagnostic form and extended `/api/app/support` to route product/issue/device/version/contact details into admin support requests and owner email.
- Added optional support screenshot handling through private Supabase Storage bucket `support-uploads`; migration `supabase/migrations/20260615100000_support_uploads_bucket.sql` must be applied before production screenshot uploads can succeed.
- Added hidden-by-default legal routes: `/impressum`, `/terms`, `/app-disclaimer`, `/download-disclaimer`. They return 404 until admin Legal Pages are published with responsible name, address, and email.
- Added admin Website Control fields for legal owner data and disclaimers. Server action `saveLegalPagesAction` prevents publishing incomplete legal pages.
- Expanded Admin > Website > Key Site Images so public images can be selected from the media library or uploaded directly: home portrait/product/activation, apps hero, AI hero, support hero, and legal hero.
- Removed code-level project visual overrides so CMS project cover/gallery selections are not silently replaced.
- Added conditional footer and sitemap legal links; privacy remains public and can show an optional extra note from the legal setting.
- Wired `vercel.json` Cron Jobs to `/api/cron/report` and saved each generated report into `automation_inbox` in addition to email.
- Updated CV response filenames to the 2026 naming convention.
- Added static public CV aliases for DE/EN/AR 2026 filenames.
- Verification passed: `npm run verify:web` and `npm run verify:admin`. Local Browser QA passed on `/en/ai`, `/en/support`, `/en/impressum` hidden gate, and mobile 390px width checks.
- Production deploy was not run in this handoff. Deploy after reviewing changes, applying the Supabase migration, and running the normal Vercel project deployment flow.

## 2026-06-13 Public Web Unification and Performance Audit

- Completed the public EN/AR route, shell, SEO, interaction, accessibility, and performance audit in `apps/web`.
- Unified active localized pages on the shared Digital OS shell, added direct legacy redirects, removed public weather/football UI, and retained the underlying APIs because Android/Windows clients still use them.
- Centralized stable identity, social, metric, language-level, and SEO data; corrected the public name and million-scale view metric; removed CV jokes and percentage skill UI.
- Converted the CV and MoPlayer hub to Server Components, split page-specific client bundles, removed route-wide Framer Motion and theme code, and changed Mo AI to load only on click.
- Split the legacy global stylesheet into route-owned CSS, disabled wasteful shell/product prefetching, and reduced the MoPlayer hub from about 236.8 KB to 170.2 KB of transferred JavaScript. Local mobile Lighthouse now measures 91-94 Performance and 100 Accessibility/Best Practices/SEO on the acceptance routes. LCP remains about 3.0-3.4 seconds under the local simulated mobile profile; see `docs/WEB_AUDIT_2026-06-13.md`.
- Updated public web and admin to Next.js `16.2.9` and `eslint-config-next` `16.2.9`. `npm run verify:web`, `npm run verify:admin`, `npm run verify:production`, and all 26 desktop/mobile Playwright tests passed; web produced 95 pages and passed all 12 Vitest tests.
- `npm audit --omit=dev` still reports transitive esbuild and Next-bundled PostCSS advisories. The available npm remediation is incompatible or an unsafe Next.js downgrade, so the advisories are documented for an upstream-compatible update instead of being force-overridden.
- Production CMS contact copy was updated in both languages to remove visitor-facing implementation details about the admin panel. The admin fallback and MoPlayer support receipt use the same public-safe wording.
- YouTube channel metrics now come from one lightweight server-side YouTube Data API request cached for 24 hours and are reused by the shared shell, CV, and YouTube page. The static fallback was synchronized on 2026-06-13 to 1,543,472 views, 6,230 subscribers, and 161 videos.
- Standardized both locale fallbacks and generated CV exports on Rhenus Home Delivery from November 2023 to present and Stocubo from October 2019 to November 2022. Removed the contradictory IKEA and generic `2018-2021` fallback entries. The owner should still confirm that this selected source is factually correct.
- Corrected the icon and social metadata pipeline: browser icons now use the small favicon, Apple gets a real 180px icon, the manifest uses a correctly declared square icon, and Open Graph/Twitter use the generated 1200x630 image. The 512px PNG was losslessly reduced from 67.7 KB to 22.1 KB.
- Exempted Next.js file-based `/opengraph-image` and `/twitter-image` routes from locale prefixing. Without this exception the proxy redirected the extensionless metadata routes to localized 404 pages.
- Search Console and Bing sitemap submission still require the owner’s authenticated webmaster accounts; the sitemap and robots files are ready for submission.
- The audited build is live on `https://moalfarras.space`. The production crawl passed all 50 sitemap URLs and 59 internal paths with no 404s or redirect chains. Isolated mobile Lighthouse measured 96-98 Performance and 100 Accessibility/Best Practices/SEO; the Arabic home LCP is 2.53 seconds, approximately 30ms above the strict 2.5-second budget.

## 2026-06-12 MoPlayer Pro Windows Adaptive Multi-view

- Replaced the always-visible four-pane multi-view with a progressive layout in `apps/moplayer-pro-windows`.
- One channel now fills the viewing area, two channels sit side by side, three channels use two upper panes plus a full-width lower pane, and four channels return to the standard 2x2 grid.
- Added an Add Channel action above the grid after the first selection. Removing a channel compacts the remaining streams so the larger matching layout is restored without leaving holes.
- Expanded Electron screenshot QA with English and Arabic `multi-1` through `multi-4` states in addition to the empty view and channel picker.
- Hardened the Windows playback pipeline: blob workers are allowed by CSP, HLS and MPEG-TS use separate main/multi buffer profiles, startup and persistent-stall timers recover or switch live formats, and failed multi-view tiles expose retry.
- Corrected the local proxy so completed browser requests do not abort healthy upstream streams, byte ranges/cache validators survive, compressed-length mismatches are avoided, and every HLS `URI` attribute is rewritten for audio, subtitles, keys, and init maps.
- Real encrypted-profile QA covered 42,957 items. BEIN SPORT 4K HLS started in 1.69 seconds and stayed advancing, four tiles played in 2.90 seconds, MP4/MKV started in about 1.24 seconds, raw MPEG-TS started in 2.04 seconds, and no CSP/uncaught/renderer-crash log lines appeared.
- The provider metadata reports one maximum connection even though four streams were accepted during QA. Multi-view now warns when selected tiles exceed the reported provider limit; match-day provider congestion remains external to the app.
- Added `qa:stream-proxy` and `apps/moplayer-pro-windows/MOPLAYER-PC-QA-REPORT.md` for repeatable proxy checks and the full playback handoff.
- Final installer/portable artifacts were generated locally, but Authenticode reports `NotSigned` and this PC's Windows Application Control blocks new unsigned hashes. Do not publish the generated metadata or binaries until trusted Windows code signing is configured; the tracked website metadata was intentionally left unchanged.

## 2026-06-12 MoPlayer Pro Windows Polish Pass

- Fixed the Windows app logo pipeline in `apps/moplayer-pro-windows`: `prepare:icon` now regenerates a transparent `moplayer-mark.png` from the source art before creating `build/icon.png` and `build/icon.ico`. Black/white source background pixels and the isolated top hairline are removed so the app, title bar, and installer no longer show a boxed black logo.
- Replaced the default white NSIS installer experience with `build/installer.nsh`: custom dark MoPlayer welcome, required private-media usage confirmation, and branded finish page with optional launch. The normal setup flow no longer shows the legacy license/finish screens from the 2026-06-12 screenshots.
- Reworked the Windows title bar, home layout, settings cards, dock, poster grids, preview pane, and multi-view picker to address the 2026-06-12 visual regression screenshots. The shell keeps the native title bar safe area LTR while page content can be RTL, preventing the Arabic brand/logo from sliding under Windows caption buttons.
- Replaced the old mosque-style background line art with subtle Palmyra-inspired Syrian colonnade line art. This remains decorative and low-opacity behind the app surface.
- Multi-view channel selection now has a centered picker, category select, search field, readable channel rows, and dedicated QA screenshots for English and Arabic.
- Movie/series preview now always offers a Trailer action for non-live items. Provider trailer URLs are used when present; otherwise the app opens a YouTube search for the item title.
- Added QA support for `--qa-language=ar` and `multi-picker`; `qa:screens` now captures Arabic home/settings/multi/login and picker regressions with isolated temporary Electron user data.
- Added `app:checkWindowsUpdate` so the quiet update check returns `null` when the Windows release metadata file is not deployed instead of producing noisy IPC errors on launch.
- Local storage inspection on this PC confirmed the installed app keeps provider data under `%APPDATA%\@moalfarras\moplayer-pro-windows`: one local Xtream source, one `safeStorage` encrypted secret, and the parsed library in `moplayer-pro-library.json`. The installer does not bundle the provider/server data.
- Local website QA verified MoPlayer family routing: Classic download/activation stays on `product=moplayer`, Pro Android download/activation stays on `product=moplayer2`, and PC download routes resolve to `/downloads/moplayer/windows/MoPlayer-Pro-Setup.exe` or `/downloads/moplayer/windows/MoPlayer-Pro-Portable.exe`. PC activation uses the public `product=moplayer-pc&platform=windows` entry while the app itself still registers with the backend as `moplayer2` plus `platform=windows`.
- Public MoPlayer copy was softened away from technical/API language, activation wording is device-neutral for TV and PC, and the mobile dock/site assistant are hidden on activation/setup pages to prevent form overlap.
- Production API spot-check on 2026-06-12: `/api/app/config?product=moplayer2`, `/api/weather?city=Berlin`, and `/api/football` returned JSON. Windows production download metadata was not deployed yet: `/downloads/moplayer/windows/latest-windows.json` returned 404 and `/api/app/download/latest?product=moplayer2&platform=windows` still resolved to the Android Pro APK until the web project is redeployed with the Windows route/artifacts.
- Verification passed: `npm run verify:windows`, `npm --prefix apps/moplayer-pro-windows run qa:screens`, `npm --prefix apps/moplayer-pro-windows run smoke`, `npm run dist:windows`, `npm run verify:web`, local Playwright visual QA for MoPlayer hub/product/activation pages, and packaged portable smoke with temporary user data.

## 2026-06-11 MoPlayer Product Hub

- Replaced the public `/en/apps/moplayer` and `/ar/apps/moplayer` surface with a MoPlayer product-family hub.
- Preserved the previous Classic product page at `/en/apps/moplayer/classic` and `/ar/apps/moplayer/classic` so Classic downloads, setup copy, FAQ, release data, and SEO structured data still have a dedicated page.
- The new hub promotes three active surfaces: MoPlayer Classic for lightweight Android/Android TV devices, MoPlayer Pro for the premium gold Android app, and MoPlayer PC for the Windows installer/download path.
- Added future platform placeholders for MoPlayer iOS, Apple TV, LG webOS, and Samsung Tizen. These are visual roadmap cards only; do not add real product slugs/releases until the native apps exist.
- Added local/admin awareness: the admin app now shows a Classic-page shortcut on the Classic product and a Windows setup shortcut on the Pro product.
- Documented the expansion model in `docs/MOPLAYER_PRODUCT_HUB.md`.
- Design note: the hub uses real MoPlayer assets, product-specific cards, restrained motion, and `prefers-reduced-motion` support. It should remain a product doorway, not a generic APK download page.

## 2026-06-11 MoPlayer Pro Windows PC Release Candidate

- Added `apps/moplayer-pro-windows`, an Electron + React + TypeScript Windows desktop client for MoPlayer Pro. It keeps the existing backend identity `productSlug=moplayer2`, registers as `platform=windows` and `deviceType=pc`, and does not change the Android Classic or Android Pro apps.
- Ported the core PC flows: QR activation with the existing website APIs, local Xtream/M3U source entry and storage, live/movies/series library views, search, favorites, settings, support/device info, and HLS playback through `hls.js` with retry/error states.
- After visual QA against the Android Pro app, the Windows shell was corrected to follow the Android TV design system instead of a generic desktop dashboard: fiery glass styling, cinematic background, bottom dock navigation, left category rail, live channel rows, PC-sized poster grid/shelves, and right-side preview panes using the Android Pro assets.
- Final PC polish tightened the home hero height, reduced oversized movie/series poster cards, added bottom scroll padding where the dock can overlap long views, and regenerated the NSIS installer sidebar/header/license art with the real MoPlayer Pro icon, banner, and bilingual installer copy.
- Provider credentials remain local to the Windows app after user entry or short-lived QR source handoff. No bundled IPTV content or permanent Supabase provider-source storage was added.
- Added Windows commands at the repo root: `npm run dev:windows`, `npm run build:windows`, `npm run verify:windows`, and `npm run dist:windows`.
- `npm run dist:windows` builds through a Temp output folder before copying artifacts back to `apps/moplayer-pro-windows/release`; this avoids Windows Application Control / Desktop folder locks seen on the local QA machine.
- Release metadata is generated at `apps/web/public/downloads/moplayer/windows/latest-windows.json`; local setup/portable EXEs are also copied into that folder for local website download QA and ignored by Git.
- The local website route is prepared: `/api/app/download/latest?product=moplayer2&platform=windows` redirects to `/downloads/moplayer/windows/MoPlayer-Pro-Setup.exe`, and `portable=1` redirects to the portable EXE. Local dev QA returned `307` from the API route and `200 OK` from the static EXE URL.
- Fixed the Windows splash hang: Electron preload now compiles from `src/preload.cts` to `dist-electron/preload.cjs`, and `build:electron` removes stale Electron output before compiling.
- Local QA on Windows 11 Pro passed for TypeScript/lint/build, web verification, isolated fixture screenshots, Electron packaging, NSIS install, installed-app smoke checks, desktop shortcut creation, normal installed launch, and local website download redirects. Details are in `MOPLAYER-PC-QA-REPORT.md`.
- Real-source QA was completed with the user-supplied test provider without documenting credentials: the Windows app detected the M3U Plus URL as Xtream, loaded 42,673 items, verified subscription metadata through `player_api.php`, searched the real library, toggled a favorite, and played a live HLS channel in the internal player with `readyState=4` and no media error.
- Website download UI was not published; before production, host the large EXE in an appropriate binary store/CDN, configure trusted Windows code signing, run broader Windows hardware QA, and run `npm run verify:web`.

## 2026-06-06 Work Discovery and Case Study Upgrade

- Reworked the public `/en/work` and `/ar/work` experience around a new project-lens surface that exposes the existing CMS challenge, solution, result, metrics, tags, and imagery without duplicating project data.
- Project cards now keep visitors inside the portfolio first by linking to `/{locale}/work/{slug}`. A separate secondary link opens the live project or product page when one exists.
- Added an interactive project selector, responsive image stage, problem/decision/outcome summary, proof metrics, and a project-aware `Ask Mo Ai` action. The action opens the existing site-wide assistant and pre-fills a contextual question; it does not create a second AI page.
- Upgraded case-study pages with a stronger hero action hierarchy, proof strip, numbered problem/decision/outcome narrative, implementation summary, gallery, and previous/next project navigation.
- Deduplicated football matches before rendering the Work page widget so provider overlap cannot create repeated rows or React key warnings.
- Added Playwright coverage for internal case-study links, the project-to-Mo-Ai handoff, Arabic mobile overflow, case-study narrative, and project navigation.
- `npm run verify:web` passed. The focused Playwright suite passed in both desktop Chromium and mobile Chromium (`9/9` in each project). Production-build browser QA passed in Arabic and English at desktop and mobile sizes with no horizontal page overflow or browser console errors.
- Production deployment `dpl_BzNCz6neRNsGAfkVeqa1g6oTv2Ma` is live on `https://moalfarras.space`. Post-deploy checks passed for `/en/work`, `/ar/work`, and `/en/work/moplayer`, including canonical URLs, RTL mobile layout, case-study navigation, no horizontal overflow, and no browser console errors.

## 2026-06-06 Public Indexing and Navigation Cleanup

- Cleaned the public sitemap so it contains only final indexable localized pages and active localized work entries. Redirect-only shortcuts (`/app`, `/privacy`, `/support`) and the retired standalone AI page are excluded.
- Shared page metadata now points `x-default` to the matching English page. Static sitemap entries no longer publish a constantly changing `lastmod`; project entries use a real update timestamp when available.
- Removed AI from desktop navigation, mobile navigation, and the sitemap. The site-wide `Mo Ai` chatbot remains available on public pages. Legacy `/ar/ai` and `/en/ai` URLs permanently redirect to `/ar` and `/en`.
- Fixed navbar label clipping by keeping links on one line, preventing link/action shrink, removing forced uppercase spacing, and switching to the menu layout before medium-width labels collide.
- `npm --prefix apps/web run typecheck`, lint, build, Vitest, and the focused Playwright suite all passed. Visual QA passed in Arabic and English at desktop and mobile sizes for home, MoPlayer Pro, activation, navbar, mobile dock, and chatbot.
- Production deployment `dpl_HnjbmLff7o5RyGUkpghGCDXF6E2G` is live and aliased to `https://moalfarras.space`. All 46 production sitemap URLs returned HTTP 200 with matching canonical URLs, `x-default`, and no `noindex`.

## 2026-06-05 Football Widget Multi-Provider Update

- Added RapidAPI `free-api-live-football-data` as a server-side fallback inside `apps/web/src/app/api/football/route.ts`. The route now keeps API-Football and RapidAPI keys separate, then falls through to ESPN scoreboard and TheSportsDB.
- Tested RapidAPI endpoints with the private key: `/football-current-live` returned live matches, `/football-get-matches-by-date?date=YYYYMMDD` returned match lists, and `/football-popular-leagues` returned World Cup plus top five league metadata. The key is stored only in Supabase `app_private_settings`, not in app code or APKs.
- Added a compact real-data match widget to the public Work/projects page (`apps/web/src/components/site/work-digital-exhibition.tsx`, `apps/web/src/app/globals.css`). It reads `/api/football`, shows the active source, highlights World Cup fixtures, and does not invent fake scores when providers return no data.
- Production verification on `https://moalfarras.space/api/football` returned `source=espn-scoreboard`, `mode=world_cup_schedule`, `matches=8`, `worldCupMatches=104`, primary `Mexico vs South Africa`. This is expected while ESPN is the best available source for World Cup 2026 schedule data.
- `npm run verify:web` passed before deploy. Production deployment `dpl_4EcxfFbUcS4h2T7sKukTfSfFbTca` is aliased to `https://moalfarras.space`.

## 2026-06-05 Production Domain and Emulator Verification

- Verified real production APIs on `https://moalfarras.space`: app config for both products, YouTube stats, weather, football fallback, automation health, contact email send/store/receipt, site assistant, app assistant, latest release metadata, and latest APK downloads.
- Verified production admin surface on `https://admin.moalfarras.space/login`; the active admin remains `apps/admin`, not the removed public-site admin.
- Updated the live Supabase `app_release_assets` row for published Pro release `moplayer2-2.5.20` so the latest download now resolves to `/downloads/moplayer2/app-release.apk` instead of an older Supabase Storage object.
- Current production APK hashes:
  - MoPlayer Classic universal: `52792635` bytes, SHA-256 `79701639678373dda3b44c07347c22bd799975767a2eb260943c50609f1f9a0d`.
  - MoPlayer Pro universal: `49260800` bytes, SHA-256 `477beee677797ae489ec6afce71fe369a31f020ecb18fd3d12ec0d4192907a0f`.
- Android emulator QA used the only available local AVD, `MoPlayer_Classic_API24_TV_720p` / Android TV API 24 x86. Classic and Pro were installed sequentially, generated real website `MO-XXXX` QR codes, imported a QR-delivered source, loaded home content, and left no provider source/auth payload behind in Supabase after ack.
- Browser visual QA passed for desktop/mobile public pages and the admin login. Noted polish-only issues: the public home hero is visually heavy on desktop/mobile, but no blank or broken production page was found.
- `npm run verify:production` passed after the APK metadata correction.

## 2026-06-05 QR Source Handoff Hardening

- Provider/server credentials are now strictly a temporary QR handoff, not a Supabase storage feature.
- `apps/web/src/app/api/app/activation/source/route.ts` queues encrypted source data only while pending, then removes `encryptedPayload` immediately after the first device fetch. The remaining receipt has no server URL, username, password, playlist URL, or EPG URL and expires quickly.
- `apps/web/src/app/api/app/activation/source/ack/route.ts` is idempotent and deletes both the source receipt and temporary source auth hash after app import/failure acknowledgement.
- `apps/web/src/app/api/app/activation/create/route.ts` gives the source auth hash its own expiry so old QR sessions cannot become long-lived device links.
- `apps/moplayer-android` now polls website-delivered sources only for a short window after a fresh QR activation and marks the delivery complete after import, failure, or timeout.
- `apps/moplayer2-android` no longer exposes the old direct Supabase activation source endpoints/models; QR source import goes through the public website API only, then the server profile is saved locally in the app.
- `apps/admin` source delivery controls read/update only non-sensitive `app_settings` receipts. The old `device_provider_sources` table is not used.
- Added migration `supabase/migrations/20260605090000_enforce_ephemeral_provider_source_handoff.sql` to clear old source/auth queue keys and document the policy.
- MoPlayer Pro now applies admin runtime maintenance/disabled/force-update config as a blocking control message that closes current playback; non-blocking admin messages appear as notices.
- Android 7/API 24 emulator QA found old TV trust stores failing Let's Encrypt chains for `moalfarras.space` and `github.io`. Both Android apps now bundle ISRG Root X1 in `res/raw/isrg_root_x1.pem` and trust it through `network_security_config.xml`; do not replace this with an insecure trust-all client.
- MoPlayer Pro's debug QR fallback was removed. If website QR creation fails, the app must show a real error instead of a fake `MOPRO-*` code that the website cannot activate.

## 2026-06-04 Admin Consolidation and Telemetry Cleanup

- The only active admin is `apps/admin` on `admin.moalfarras.space`.
- Removed the legacy localized public-site admin from `apps/web/src/app/[locale]/admin`, along with its old `apps/web/src/components/admin` UI and web-local admin auth/actions.
- Public legacy admin URLs now redirect out of `apps/web`: `/en/admin` and `/ar/admin` go to the admin root; old CMS subpaths go to `https://admin.moalfarras.space/website`.
- `apps/web/src/lib/app-ecosystem.ts` was trimmed back to public-facing ecosystem read/support/download behavior. Admin product/release/image mutations remain in `apps/admin/src/lib/app-ecosystem.ts`.
- `/api/app/events` now writes real device events to `app_device_events` while preserving the existing automation event queue. `/api/app/diagnostics` normalizes product slugs and updates device last-seen timestamps.
- `apps/admin` app pages now show diagnostics and device events per product, and diagnostics can be moved through `new`, `reviewing`, `resolved`, and `archived`.
- Current state notes for future agents live in `docs/CURRENT_PROJECT_STATE.md`.

## 2026-06-04 Live Services Audit

- Real local secrets were checked without printing values.
- Synced the live YouTube, Weather, and Football API keys into the web/admin local env files so local web/admin checks match the app env.
- Added the existing Supabase Auth user to `app_admin_roles` as `admin`; admin login now has a valid role once the correct Supabase Auth password is used.
- SMTP verified successfully, and `/api/contact` completed a live send/store/receipt smoke test.
- YouTube and Weather APIs work with the configured keys.
- API-Football key is present, but the upstream account is suspended. The public `/api/football` widget still works through the ESPN scoreboard fallback.
- `/api/app/diagnostics` now normalizes category/severity before insert to avoid DB constraint failures.
- `/api/automation/health` now checks real dependencies directly instead of self-fetching local routes that produced false 404s.

## Applications

- `apps/web`: public Next.js site for `moalfarras.space`, MoPlayer pages, activation, support, app config, and downloads.
- `apps/admin`: admin control center for `admin.moalfarras.space`.
- `apps/moplayer-android`: classic MoPlayer Android TV app.
- `apps/moplayer2-android`: MoPlayer Pro Android app.
- `packages/shared`: shared app product metadata and slug helpers.
- `packages/db`: server-side database helpers.
- `supabase/migrations`: ordered database migrations for production Supabase.

## Required Local Setup

Real secrets must stay in ignored local files:

- `apps/web/.env.local`
- `apps/admin/.env.local`
- Android `local.properties`

Never commit Vercel tokens, Supabase secret keys, database passwords, service role keys, or generated local env files.

Use `apps/web/.env.example` and `apps/admin/.env.example` as templates. Required web values include:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOPLAYER_PROVIDER_ENCRYPTION_KEY`
- `ADMIN_ALLOWLIST`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_WEB_APP_URL`
- `NEXT_PUBLIC_ADMIN_APP_URL`

`DATABASE_URL` and `DIRECT_URL` are only needed for direct Postgres tooling. Use Supabase pooler/direct URLs with the real database password when running migrations or database scripts locally.

## Verification

Run these from the repository root before deploying:

```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run lint
npm --prefix apps/admin run build
```

For browser verification:

```powershell
npm --prefix apps/web run dev -- --port 3000
```

Then verify these routes:

- `/`
- `/en/apps`
- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2&code=MO-DEMO`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`

The download route may start a file download instead of rendering JSON; that is expected when a published release asset is available.

## Supabase

Project ref: `ckefrnalgnbuaxsuufyx`

Use the Supabase MCP plugin or Supabase CLI for project inspection, advisors, logs, and migrations. Recommended order for database work:

1. Inspect tables and migrations.
2. Run security/performance advisors.
3. Test SQL locally or through safe read-only queries first.
4. Create migrations with `supabase migration new <name>`.
5. Verify app routes and admin flows after applying changes.

Public client keys may be exposed to the browser. Secret keys and service role keys must only be used server-side.

Local migration history is expected to include the admin/AI/automation migrations through `20260524033521_widget_provider_secret_storage.sql`.

## Vercel

Expected domains:

- Public site: `https://moalfarras.space`
- Admin: `https://admin.moalfarras.space`

Deploy only after local verification succeeds. Production env vars should be configured in Vercel project settings, not committed to the repository.

Recommended deploy flow:

```powershell
npx vercel pull --yes --environment=production --token <token>
npx vercel build --prod --token <token>
npx vercel deploy --prebuilt --prod --token <token>
```

If using the Vercel plugin, inspect build logs and runtime logs after deployment.

## MoPlayer Pro Notes

The public product name is `MoPlayer Pro`, while the internal slug remains `moplayer2` for compatibility with URLs, API payloads, database rows, and Android integration.

Key routes:

- `/en/apps/moplayer2`
- `/ar/apps/moplayer2`
- `/activate?product=moplayer2`
- `/api/app/config?product=moplayer2`
- `/api/app/download/latest?product=moplayer2`

Keep classic MoPlayer (`moplayer`) and MoPlayer Pro (`moplayer2`) release channels separate.

## 2026-06-02 MoPlayer Pro Performance Pass

Investigated the "very slow / not smooth / freezes" reports for MoPlayer Pro on a local
Android TV API 24 x86 emulator (the running `emulator-5554`). Baseline `dumpsys gfxinfo`
showed **100% janky frames** while browsing Live TV, and an idle screen (no input) was still
rendering ~40 fps continuously — the app never settled.

Root causes and fixes (all scoped to `apps/moplayer2-android`):

- **Ungated infinite animations were the main culprit.** Several `rememberInfiniteTransition`
  blocks were created unconditionally and only gated their *value* (e.g. `if (animate) raw else 0f`).
  The transition kept posting a frame every vsync forever, so the whole screen repainted ~40×/s
  even at rest. Fixed by only constructing the transition when motion is enabled in:
  `ui/screens/MediaScreens.kt` (live receiver pulse), `ui/screens/HomeScreen.kt` (home breathe,
  assistant sheen, hero-match pulse, World Cup countdown pulse), `ui/components/WeatherClockWidget.kt`
  (weather glyph spin/fall/flash), and `ui/components/AtmosphericBackground.kt` (aurora drift).
- **Performance policy is now TV-aware** (`core/Adaptive.kt`): on a television that is not a
  high-end box, `BALANCED`/`AUTO` now sets `reduceMotion=true` and disables the ambient particle
  canvas + focus-driven backdrop reloads. Phones, tablets, and high-end TV boxes are unchanged.
- **Network stalls no longer freeze the app for minutes** (`data/network/NetworkModule.kt`):
  the shared OkHttp read timeout dropped from 5 min to 45s (90s for M3U playlists) and the call
  timeout from 10 min to 8 min. `readTimeout` is the gap between bytes, so healthy large library
  syncs and video segments are unaffected; only a server that connects then stalls now fails fast.
- **Live channels recover faster from dead streams** (`ui/player/PlayerScreen.kt`): Media3 live
  segment retries reduced from 12 (~55s of frozen video) to 6 (~18s) before the app-level
  alternative-quality / LibVLC fallback takes over.

Verified results on the same emulator (idle frame count is GPU-independent, so it is the clean
before/after signal):

- Live TV idle: **210 → 11 frames / 5s**. Home idle: **218 → 6 frames / 6s** (app now reaches rest).
- `npm run verify:android:pro` (`testDebugUnitTest`): **44 tests, 0 failures**.
- `assembleRelease -PincludeX86Abis=true` succeeds (R8 + lintVital pass), so the changes ship cleanly.
- No new permissions, no crashes in logcat, all home/live widgets still render (motion just rests).

Notes for the next machine: `apps/moplayer2-android/local.properties` had a stale `sdk.dir`
(`C:\Users\Moalfarras\...`); corrected to the real SDK path for this box. That file stays
untracked. Version was left at `2.5.12` (`versionCode` 50) — bump and rebuild a signed release
only on an explicit publish request.

### Subscription expiry + library robustness (same pass)

A separate emulator account had expired mid-session, and a background refresh against the
expired panel had wiped the whole cached library — the app showed an empty Home with a stale
"add an account" message and no explanation. Fixes:

- **A refresh that returns nothing can no longer erase a cached library** (`data/db/MoPlayerDatabase.kt`):
  `replaceServerContent`/`replaceServerContentTypes` now skip the destructive delete when the
  incoming media list is empty but content already exists, and just refresh account/status. This
  protects every login type (Xtream full + incremental, M3U) from an expired/erroring panel.
- **Expired subscriptions are surfaced clearly** (`domain/model/Models.kt` `subscriptionInactive`,
  `ui/MainViewModel.kt`, `ui/screens/SearchSettingsScreens.kt` `SubscriptionExpiredDialog`,
  `MainActivity.kt`, `ui/i18n/Strings.kt`): when the active account reports Expired/Banned/Disabled
  (or a past expiry date), a localized (EN/AR) "Subscription expired" dialog appears over the kept
  cache with **New sign-in** (removes the account → login screen for a fresh subscription) and
  **Later** (dismiss per-account, keep browsing the cache).
- **Home no longer says "Library is empty" while the first sync is still running**
  (`ui/screens/HomeScreen.kt` + `Strings.kt`): the empty card now shows a localized
  "Loading your library…" while a sync is in flight, and an accurate "refresh / sign in with
  another source" message otherwise.

Verified end-to-end on the emulator with a real provider M3U-plus URL (entered through the on-screen
keyboard via `adb input tap` + `input text`):

- Library synced **12,489 live + 19,903 movies + 10,396 series + 235 categories (~42.8k items) in ~24s**;
  Home shelves, Live categories, channel logos, and EPG all rendered.
- Stream URLs resolve to valid HLS manifests (confirmed reachable from the host with real `.ts`
  segments). Live playback errors on this API-24 **x86** emulator are the software decoder failing on
  real HEVC/high-bitrate broadcast feeds (LibVLC is intentionally disabled on x86), not an app fault —
  the new fast-fail surfaces Retry/Internal/MX/External quickly instead of a ~55s freeze.
- Simulated an expired account → the localized dialog appeared over the preserved library and
  **New sign-in** routed back to the login screen.
- `testDebugUnitTest`: **49 tests, 0 failures** (added `ServerProfileSubscriptionTest`). Signed
  `assembleRelease` passes R8 + lintVital.

### Recomposition + huge-panel pass (same day)

Pushing toward "best-in-class on huge panels":

- **`@Immutable` on the hot domain models** (`domain/model/Models.kt`: `MediaItem`, `Category`,
  `AppSettings`, `WeatherSnapshot`, `FootballMatch`, `ServerProfile`, `EpgEntry`, `LiveEpgSnapshot`;
  `core/Adaptive.kt`: `PerformancePolicy`, `DevicePerformanceInfo`). These are already all-`val`
  data classes recreated fresh from Room/DataStore, so the annotation is safe and lets Compose skip
  recomposition of the lazy grids/shelves when their inputs are unchanged.
- **Streaming JSON for the Xtream sync** (`data/repository/IptvRepository.kt` `rawPlayerElement`):
  the `get_*_streams` responses are now parsed straight off the network buffer with
  `Json.decodeFromStream` instead of materializing the whole multi-MB body as a `String` first,
  roughly halving peak memory during the big live/VOD/series fetches on low-RAM boxes.

Re-verified on the emulator against the real provider: full library re-synced through the streaming
parser (**12,489 live + 19,903 movies + 10,396 series**) with no `SerializationException`; Home,
Movies, and a Series detail (JUJUTSU KAISEN → **3 seasons / 59 episodes** via `get_series_info`,
with poster + Arabic description) all rendered with no crash. All login methods (M3U, Xtream, QR
activation) converge on the same `startBackgroundLibraryRefresh` → Xtream sync, so metadata
(expiry, posters, ratings, descriptions, seasons/episodes) is fetched regardless of entry point;
pure non-Xtream M3U playlists are still limited to whatever the playlist itself carries.

Still open (intentionally not done this pass): a generated **Baseline Profile** (needs a
macrobenchmark module + a profileable run — the single biggest remaining cold-start win), reusing
one `ExoPlayer` instance across live channel zaps instead of rebuilding (faster zapping, but it
touches the carefully-tested Media3/LibVLC fallback so it needs its own QA), and removing the
~450 lines of dead atmospheric-weather/widget code (R8 already strips it, so source-clarity only).

### Cold-start polish from the real-device test tour

A "play as a user" pass (data persists across force-stop/restart: the 12,489/19,903/10,396 + 59
episodes and the active account all reload from Room, no re-sync) surfaced two short-lived but
jarring flashes, both fixed and included in the released build:

- **No more sign-in flash on cold start** (`MainViewModel` `initialized` flag + `MainActivity`):
  the router now shows a brief themed splash spinner until the saved servers/settings are read from
  disk, instead of flashing the sign-in screen for a fraction of a second before Home loads.
- **No more "Library is empty" flash on Movies/Series** (`ui/screens/MediaScreens.kt` `PosterGrid`):
  the grid now shows the localized "Loading your library…" copy while paging's first load is in
  flight, and only the real empty/refresh message once it settles.

### MoPlayer Pro 2.5.20 live/series playback hardening

Scoped follow-up for MoPlayer Pro only (`apps/moplayer2-android`) after real-device reports that
Live TV could stay black with audio, series details sometimes failed with a 12s `get_series_info`
connect timeout, and episodes from several series did not play:

- **Root cause from the user screenshot** (`data/network/NetworkModule.kt`): the failure text ended
  with `after 12000ms`, matching the shared Xtream API connect timeout. Pro now keeps normal API
  calls bounded but uses a dedicated Xtream client with a 22s connect timeout and 60s read gap for
  panel APIs, so slow huge-panel `get_series_info` calls do not fail at exactly 12 seconds.
- **Series detail retry path** (`data/repository/IptvRepository.kt`): `refreshSeriesDetails` now
  retries transient connect/timeout failures and tries both common Xtream query shapes
  (`series_id` and `series`) before surfacing a sanitized error. Cached episode lists still return
  immediately and are not refetched once saved locally.
- **Episode/VOD URL robustness** (`data/repository/XtreamSupport.kt`, `ui/player/PlayerScreen.kt`):
  VOD and series episodes now honor `direct_source` when the panel sends it, normalize container
  aliases such as `matroska` -> `mkv`, and the player can retry Xtream movie/series links with
  compatible container extensions (`mkv`, `mp4`, `avi`, `ts`, `m3u8`, etc.) before falling back to
  LibVLC or external players.
- **Weak-device live recovery** (`ui/player/PlayerScreen.kt`): performance/legacy TS live streams
  prefer the safer LibVLC path on ARM devices, video-no-frame watchdogs react faster (about 2.2s
  for live on weak/performance devices, 3.5s for VOD), and playback networking uses a dedicated
  bounded client so dead live links fail/recover faster than the slower series-detail API path.
- Emulator QA on `emulator-5554` / Android TV API 24 x86: installed debug `2.5.20-debug` over the
  saved real-provider data without uninstalling. Local Room data stayed unchanged after update:
  `LIVE=12492`, `MOVIE=19933`, `SERIES=10401`, `EPISODE=77`, `servers=1`,
  `lastSyncAt=1780522996160`. App launched to the saved Live library in about one second with no
  fatal crash. Live playback smoke on this x86 emulator surfaced a controlled "Could not play
  stream" recovery error instead of crashing; x86 remains a limited playback signal because real ARM
  boxes can use the LibVLC path that the emulator cannot safely represent.
- Bumped Android to `versionName 2.5.20` / `versionCode 58`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.20` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.20`. After the 2026-06-05 TLS/QR verification
  pass, the live release asset now points to the Vercel-hosted mirror:
  `/downloads/moplayer2/app-release.apk`.
- Verified production `moalfarras.space` APIs: latest release/config return `2.5.20` /
  `versionCode 58`, `/api/app/download/latest?product=moplayer2` redirects through
  `/api/app/releases/moplayer2-2.5.20/download`, and the final APK URL returns HTTP 200
  with `49260800` bytes.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49260800` bytes
- SHA-256: `477beee677797ae489ec6afce71fe369a31f020ecb18fd3d12ec0d4192907a0f`

Verification completed locally before publish:

- `npm run verify:android:pro`
- `apps/moplayer2-android/gradlew.bat assembleDebug`
- `apps/moplayer2-android/gradlew.bat assembleRelease`
- `npm run verify:web`
- `npm run verify:admin`

### MoPlayer Pro 2.5.19 stable cached browsing and QR handoff verification

Scoped follow-up for MoPlayer Pro only (`apps/moplayer2-android`) after reports that an already
loaded library still appeared to reload when returning to Home/Movies/Series or opening the same
area again:

- **QR/Supabase activation behavior verified** (`IptvRepository.kt`, `MainViewModel.kt`): the QR
  flow is only a handoff. The app creates/polls a short-lived activation session, pulls the source
  once, saves it into the local Room `servers` table through `registerXtreamSource`,
  `registerXtreamFromPlaylistUrl`, or `registerM3uSource`, then acknowledges the web source. After
  that, browsing and playback use the local app database and provider URL, not Supabase as a live
  library backend.
- **Paging flows are now keyed by stable library inputs** (`ui/MainViewModel.kt`): Home shelves,
  selected Live/Movies/Series grids, favorites, continue-watching, search, zap lists, episode lists,
  and focused EPG now use `distinctUntilChanged` query keys. Focus changes, notices, background
  progress, and back navigation no longer recreate the Room/Paging sources for already-loaded
  content.
- **Player return behavior preserved** (`MainViewModel.kt`): while the player is open,
  `selectedMedia` keeps using the return browsing section when needed, so related lists still work
  without forcing unrelated reloads.
- Emulator QA on `MoPlayer_Classic_API24_TV_720p`: installed the fresh debug APK over the existing
  saved real-provider data (no uninstall) and verified counts/timestamps stayed unchanged across
  update, force-stop/relaunch, and Home/Movies/Series navigation: `LIVE=12492`, `MOVIE=19933`,
  `SERIES=10401`, `EPISODE=77`; sync timestamps remained
  `1780522980067|1780522985962|1780522993620`.
- Bumped Android to `versionName 2.5.19` / `versionCode 57`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.19` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.19`; storage path:
  `moplayer2/2.5.19/moplayer2-2.5.19-universal.apk`.
- Verified production `moalfarras.space` APIs: latest release/config return `2.5.19` /
  `versionCode 57`, `/api/app/download/latest?product=moplayer2` redirects through
  `/api/app/releases/moplayer2-2.5.19/download`, and the final Supabase APK URL returns HTTP 200
  with `49267249` bytes.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49267249` bytes
- SHA-256: `f626b375d26e546be176c16070a957aac8dc9df0517660eedd44ef10f2420291`
- Signing cert SHA-256: `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`

Verification completed locally:

- `npm run verify:android:pro`
- `apps/moplayer2-android/gradlew.bat assembleDebug`
- `apps/moplayer2-android/gradlew.bat assembleRelease`
- `npm run verify:web`
- `npm run verify:admin`

### MoPlayer Pro 2.5.16 weak-device library browsing pass

Scoped follow-up for MoPlayer Pro only (`apps/moplayer2-android`) after reports that large
libraries and series episodes still felt slow on weak real devices:

- **Larger bounded Paging batches** (`data/repository/IptvRepository.kt`): browse pages now load
  `120` rows at a time with a `360` row initial load, shelf rows load `72`, and search loads `96`.
  Pages are bounded with `maxSize` so weak boxes do not keep an unbounded in-memory window while
  scrolling through very large libraries.
- **Lazy list/grid reuse hints** (`ui/screens/MediaScreens.kt`, `ui/screens/SearchSettingsScreens.kt`,
  `ui/components/Cards.kt`): hot Compose lists now provide `contentType` alongside stable keys for
  channels, posters, episodes, search results, and Home lanes. This lets Compose reuse only matching
  row/card structures during long remote-control scrolls.
- **Series episode prefetch** (`ui/MainViewModel.kt`): focusing an Xtream series for about `380ms`
  starts a quiet `get_series_info` cache fill if the user stays on the same item, so opening the
  series often finds episodes already stored. Fast focus movement cancels/replaces the prefetch,
  and opening the series cancels any pending prefetch to avoid duplicate detail requests.
- **Faster episode detail writes** (`IptvRepository.refreshSeriesDetails`): episode upsert batches
  increased from `300` to `1000`, and series detail loading now falls back to the item id when a
  provider omits `seriesId`.
- Bumped Android to `versionName 2.5.16` / `versionCode 54`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.16` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.16`; storage path:
  `moplayer2/2.5.16/moplayer2-2.5.16-universal.apk`.
- Verified production `moalfarras.space` APIs: latest release/config return `2.5.16` /
  `versionCode 54`, `/api/app/download/latest?product=moplayer2` redirects through
  `/api/app/releases/moplayer2-2.5.16/download`, and the final Supabase APK URL returns HTTP 200
  with `49258848` bytes.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49258848` bytes
- SHA-256: `ec0560ad1d754cfeb102df78476a5b3c38f0f9bae35713caa2ec91b9d5651319`
- Signing cert SHA-256: `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`

Verification completed locally:

- `npm run verify:android:pro`
- `apps/moplayer2-android/gradlew.bat assembleDebug`
- `apps/moplayer2-android/gradlew.bat assembleRelease`
- `npm run verify:web`
- `npm run verify:admin`

### MoPlayer Pro 2.5.18 empty-library and weak-device fix

Follow-up after emulator QA showed the 2.5.17 database migration preserved existing media, but a
fresh or broken Xtream sync could still save categories without media when the provider returned
category arrays and empty stream arrays.

- **Categories-only libraries are now blocked** (`MoPlayerDatabase.kt`, `IptvRepository.kt`):
  full and per-section library replacement no longer writes sync-ready state for empty media
  payloads. If a device is already stuck with category rows but no media, startup/background refresh
  now detects the bad state and retries instead of showing an empty library as ready.
- **Xtream sections validate stream payloads before saving** (`IptvRepository.kt`): live, movie, and
  series syncs reject "groups but no playable items" responses so transient provider/API failures do
  not poison the local cache.
- **Poster first paint is faster** (`Cards.kt`, `MoPlayerApplication.kt`): TMDB posters bypass the
  website image proxy and use smaller `w342` card images through the app Coil client with browser
  headers; the proxy remains for non-TMDB poster/logo URLs.
- **Old Android TV boxes auto-enter Performance Mode** (`Adaptive.kt`): Android TV devices below
  API 26, low-RAM devices, and <=128 MB memory-class devices are forced to the lighter automatic
  profile to reduce motion, widgets, preview/backdrop work, and video caps on weak hardware.
- Emulator QA on `MoPlayer_Classic_API24_TV_720p` verified Home, Movies, Series, Series episode list,
  Live TV categories/channels/EPG, and playback startup. Movies posters appeared in about four
  seconds after clearing the debug image cache and switching TMDB card images to direct smaller URLs.
- `npm run verify:android:pro`, `npm run verify:android`, `npm run verify:web`, and
  `npm run verify:admin` passed. Signed `assembleRelease` passed for 2.5.18.
- Bumped Android to `versionName 2.5.18` / `versionCode 56`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.18` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.18`; storage path:
  `moplayer2/2.5.18/moplayer2-2.5.18-universal.apk`.
- Verified production `moalfarras.space` APIs: latest release/config return `2.5.18` /
  `versionCode 56`, `/api/app/download/latest?product=moplayer2` redirects through
  `/api/app/releases/moplayer2-2.5.18/download`, and the final Supabase APK URL returns HTTP 200
  with `49265390` bytes.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49265390` bytes
- SHA-256: `4ef7cad9c6a859a9cec691ee663447df4b637a0324614842a014abf16d88fa85`
- APK URL:
  `https://ckefrnalgnbuaxsuufyx.supabase.co/storage/v1/object/public/app-releases/moplayer2/2.5.18/moplayer2-2.5.18-universal.apk`

### MoPlayer Pro 2.5.17 weak-device smoothness pass

Follow-up scoped to MoPlayer Pro after another weak-device review:

- **Image loading now uses the app Coil pipeline** (`MoPlayerApplication.kt`, `Cards.kt`,
  `DynamicAccent.kt`): poster/logo cards no longer manually download and decode full bitmaps into a
  fixed-count `LruCache`. Coil now has explicit memory/disk cache sizing, uses the shared image HTTP
  client, and dynamic accent extraction requests only a tiny bitmap.
- **Room browse/search rows are lighter** (`Entities.kt`, `Mappers.kt`, `MoPlayerDatabase.kt`):
  hot paging queries return `MediaListRow` instead of full `MediaEntity`, avoiding `rawJson`,
  cast/director and other detail-only fields during long library scrolls.
- **Search uses a narrow synced table** (`media_search`, DB version `8`): migration `7 -> 8`
  backfills the table from existing media, and library/series/VOD writes keep it in sync. Search now
  filters the narrow table and joins back to media for display rows.
- **Background work is less aggressive** (`AppContainer.kt`, `EpgRefreshWorker.kt`): periodic EPG and
  library workers now include flex windows, exponential backoff, battery-not-low and storage-not-low
  constraints. Full XMLTV refresh skips when the cached full EPG is younger than six hours; focused
  channels can still fetch short EPG on demand.
- **Login motion respects weak-device mode** (`LoginScreen.kt`, `MainActivity.kt`): animated login
  backdrop/logo/loading wave are disabled or made static when `PerformancePolicy.reduceMotion` is on.
- Bumped Android to `versionName 2.5.17` / `versionCode 55`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.17` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.17`; storage path:
  `moplayer2/2.5.17/moplayer2-2.5.17-universal.apk`.
- Verified production `moalfarras.space` APIs: latest release/config return `2.5.17` /
  `versionCode 55`, `/api/app/download/latest?product=moplayer2` redirects through
  `/api/app/releases/moplayer2-2.5.17/download`, and the final Supabase APK URL returns HTTP 200
  with `49263486` bytes.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49263486` bytes
- SHA-256: `f26b2f2596fce2ed672cbaaabefccc907c9246fe033f184f5e645559dcdf1cd2`
- Signing cert SHA-256: `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`

Verification completed locally before publish:

- `npm run verify:android:pro`
- `npm run verify:android`
- `apps/moplayer2-android/gradlew.bat assembleRelease`
- `npm run verify:web`
- `npm run verify:admin`
- `npm run verify:moplayer-dashboard`

### MoPlayer Pro 2.5.15 large-library sync performance

Scoped follow-up for MoPlayer Pro only (`apps/moplayer2-android`) after testing a real large
Xtream/M3U-plus account with roughly 12.5k live channels, 19.9k movies, and 10.4k series:

- **Bulk library rows no longer store raw Xtream/M3U JSON blobs** (`XtreamSupport.kt`,
  `M3uParser.kt`): the app keeps the normalized fields it needs for browsing/playback and avoids
  duplicating large response payloads into every media/category row. This reduces SQLite write
  pressure and GC on weak Android TV boxes.
- **Section refresh preserves watch state by section** (`MoPlayerDatabase.kt`): live/movie/series
  refreshes now read playback/favorite state only for the content type being replaced instead of
  scanning the full library multiple times.
- **Series episodes are cached after first load** (`IptvRepository.refreshSeriesDetails`): opening a
  series that already has local episodes returns immediately instead of refetching
  `get_series_info` every time. Detail writes are wrapped in one Room transaction.
- Bumped Android to `versionName 2.5.15` / `versionCode 53`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.15` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.15`; storage path:
  `moplayer2/2.5.15/moplayer2-2.5.15-universal.apk`.
- Verified production `moalfarras.space` APIs: latest release/config return `2.5.15` /
  `versionCode 53`, `/api/app/download/latest?product=moplayer2` redirects to the new release
  download route, and the final Supabase APK URL returns HTTP 200 with `49257055` bytes.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49257055` bytes
- SHA-256: `263b79d099e257971d2104665db88c3a9b8a318005ad20749d7300dc2046b169`
- Signing cert SHA-256: `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`

Verification completed locally:

- `npm run verify:android:pro`
- `apps/moplayer2-android/gradlew.bat assembleDebug`
- `apps/moplayer2-android/gradlew.bat assembleRelease`
- Old Android TV API 24 x86 emulator (`MoPlayer_Classic_API24_TV_720p`): uninstalled the existing
  Pro debug app, installed the fresh debug APK, imported the real M3U-plus/Xtream test source, and
  confirmed the local library contained `LIVE=12489`, `MOVIE=19909`, `SERIES=10398`. The synced
  media/category rows had `rawJson` length `0`, and opening one series stored `18` cached episodes.

### MoPlayer Pro 2.5.14 Xtream/QR partial-sync hardening

Scoped follow-up for MoPlayer Pro only (`apps/moplayer2-android`) after reports that weak
devices could stay slow or show only partial libraries after server registration/update:

- **Partial Xtream syncs no longer look complete** (`data/repository/IptvRepository.kt`):
  `syncXtreamIncremental` now keeps the previous `lastSyncAt` while it is only checking account
  metadata. A server is marked fresh only after content sections save through
  `replaceServerContentTypes`, preventing a killed/failed low-end box from treating an empty or
  live-only cache as fully synced.
- **Startup and WorkManager now retry incomplete libraries** (`IptvRepository.needsLibraryRefresh`,
  `ui/MainViewModel.kt`, `core/LibraryRefreshWorker.kt`): Xtream requires live, movie, and series
  sync timestamps before refresh is skipped. Missing VOD/series after an interrupted run forces a
  background retry even if the account check happened recently.
- **Newly imported Xtream/M3U-plus sources become active immediately** (`MoPlayerDatabase.kt`,
  `MainViewModel.kt`): server ordering now uses `createdAt` when `lastSyncAt` is still zero, and
  M3U links detected as Xtream switch the app back to active-source mode. This helps QR, shared
  links, and manual M3U-plus registration behave the same way.
- Bumped Android to `versionName 2.5.14` / `versionCode 52`, built signed `assembleRelease`, and
  refreshed `apps/web/public/downloads/moplayer2/app-release.apk`.
- Published `2.5.14` through `scripts/publish-android-release.mjs` to the Supabase-backed app
  release system. Live release slug: `moplayer2-2.5.14`; storage path:
  `moplayer2/2.5.14/moplayer2-2.5.14-universal.apk`.
- Verified the production API path on `moalfarras.space`: latest release/config now return
  `2.5.14` / `versionCode 52`, `/api/app/download/latest?product=moplayer2` redirects to the new
  release download route, and the final Supabase APK URL returns HTTP 200 with `49256978` bytes and
  `application/vnd.android.package-archive`.

Built APK:

- `apps/moplayer2-android/app/build/outputs/apk/release/app-universal-release.apk`
- Size: `49256978` bytes
- SHA-256: `ee31b490a4bdc7ab7f889f30d9d369f7a2e8b0c376e1195ca30a876fbf886e8f`
- Signing cert SHA-256: `97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`

Verification completed locally:

- `npm run verify:android:pro`
- `apps/moplayer2-android/gradlew.bat assembleRelease`
- `npm run verify:web`
- `npm run verify:admin`
- Old Android TV API 24 x86 emulator (`MoPlayer_Classic_API24_TV_720p`): uninstalled existing
  MoPlayer packages, installed the fresh Pro debug APK, registered a mock Xtream server through an
  M3U-plus deep link, confirmed live/movie/series categories and media were stored, and relaunched
  with the saved server still opening Home from cache instead of returning to login.

Still recommended next: generate a real Baseline Profile/macrobenchmark path for cold-start and
first-scroll performance. Android's current docs still call this the main production mechanism for
precompiling hot startup and user-journey code paths; the app already depends on
`androidx.profileinstaller`, but it does not yet ship a generated app-specific profile.

### Released MoPlayer Pro 2.5.13 to production

Bumped `apps/moplayer2-android/app/build.gradle.kts` to `versionName 2.5.13` / `versionCode 51`
and built a signed `assembleRelease` universal APK. `apksigner` confirmed the new APK carries the
**same signing certificate** as the live 2.5.12 (`97dad776…`), so it installs as an update.

- APK: `49256351` bytes, SHA-256 `31e5648b5841182394f3b9bad96f779bdf475a014072ff1f18caf59b0e9af249`.
- Published through the same Supabase-backed path the admin uses (no Vercel token was needed because
  `/api/app/*` reads the database live): uploaded the APK to the public `app-releases` storage bucket
  (`moplayer2/app-release-2.5.13.apk`), inserted an `app_releases` row
  (`6258f0df-3baf-470d-ad7a-e1f0d4cdb8aa`, `is_published=true`, newest `published_at`) and an
  `app_release_assets` row pointing at the public storage URL. Both inserts are additive — the old
  2.5.12 rows are untouched, so a rollback is just flipping the new row's `is_published` to false.
- Verified live: `…/api/app/releases/latest?product=moplayer2` and `…/api/app/config?product=moplayer2`
  now report `2.5.13 / 51`, and `…/api/app/download/latest?product=moplayer2` follows through to the
  storage APK (HTTP 200, `49256351` bytes, `application/vnd.android.package-archive`).
- Also refreshed the version-controlled mirrors (the `app-ecosystem.ts` static fallback, the static
  `apps/web/public/downloads/moplayer2/app-release.apk`, and `docs/android-projects.md`). Those only
  matter on the next `apps/web` Vercel deploy / when the DB has no published row, so they are not
  required for users to receive 2.5.13 — the DB+storage publish above is what is live.

## 2026-06-03 MoPlayer Classic 2.2.16 Home watch-row cleanup release

Small Classic follow-up after Home QA showed a duplicated watch-history experience:

- Removed the secondary `recent_history` Home row from `HomeViewModel`. The app now keeps only the stronger `continue_watching` row, which carries watch progress and `savedPosition` so playback resumes from the saved point.
- Left the rest of the Home shelves intact: recently added movies, recently added series, and favorites still load normally.
- Bumped Classic to `versionName 2.2.16` / `versionCode 22`, built signed sideload release APKs, and refreshed `apps/web/public/downloads/moplayer/*`.

Built APKs:

- Universal: `52792635` bytes, SHA-256 `79701639678373dda3b44c07347c22bd799975767a2eb260943c50609f1f9a0d`
- arm64-v8a: `33639214` bytes, SHA-256 `c9a2f84353bb023615a0749d266fb2abad5ad998508d2b7161c6a39ca41f7590`
- armeabi-v7a: `33317608` bytes, SHA-256 `683fd8a68a4a35ee24bb48caee993fab20b6f0c326d4e6482a000238f2a6ade1`

Verification completed before publishing:

- `npm run verify:android:classic`
- `apps/moplayer-android/gradlew.bat assembleSideloadDebug -PincludeX86Abis=true`
- Android TV API 24 x86 emulator (`emulator-5554`): installed `app-sideload-x86-debug.apk`, launched Home with no fatal/crash logs, and UI dump confirmed `ContinueWatching=1`, `RecentlyWatched=0`, `LatestMovies=1`.
- `npm run release:moplayer`
- `npm run verify:web`
- `npm run verify:admin`
- Published the public Vercel project to production alias `moalfarras.space`, published Supabase release metadata for `moplayer-2.2.16`, and published the admin Vercel project to production alias `admin.moalfarras.space`.
- Production `/api/app/releases/latest?product=moplayer`: `2.2.16` / `22`, slug `moplayer-2.2.16`, APK size `52792635`, SHA-256 `79701639678373dda3b44c07347c22bd799975767a2eb260943c50609f1f9a0d`.
- Production `/api/app/config?product=moplayer`: `config.update.latestVersionName=2.2.16`, `latestVersionCode=22`, same APK size/SHA.
- Production download chain redirects through `/api/app/releases/moplayer-2.2.16/download` to `/downloads/moplayer/app-sideload-universal-release.apk`; the live APK downloaded from the domain matched the expected byte length and SHA-256.
- Production `/api/automation/health` reports `football.ok=true`, `football.detail=200:espn-scoreboard`, `config_moplayer=200`, and `download_moplayer=200`; `admin.moalfarras.space` returns the expected login redirect.

## 2026-06-03 MoPlayer Classic 2.2.15 performance and football data release

Scoped Classic follow-up for the normal MoPlayer app (`moplayer`, package `com.mo.moplayer`) after the large-server and match-widget QA passes:

- Improved large-library sync/storage on weak Android TV devices. Room now uses WAL, bulk channel/movie/series writes are grouped in transactions, stale prune deletes are transactional, M3U import flushes batches transactionally, and search index rows use stable IDs so repeated syncs replace rows instead of growing duplicate FTS content.
- Rebuilt the local search index in pages instead of loading all live/movie/series rows into memory at once. This keeps cache recovery and first-use search safer on very large providers.
- Kept Home weather and football widgets enabled on API 24 / low-tier TV devices, but with lightweight rendering: static football logos in low-power mode, slower match refresh cadence, no heavy weather overlay, and no Lottie weather animation on constrained devices.
- Fixed the public football route when no paid provider key is configured. `/api/football` now tries providers independently: API-Football when configured, then a no-key ESPN scoreboard fallback, then TheSportsDB. A failing provider no longer makes the whole widget return `not_configured`.
- Added a real no-key World Cup 2026 schedule fallback. Local route QA returned `source=espn-scoreboard`, `mode=world_cup_schedule`, `worldCupMatches=104`, and first match `Mexico vs South Africa` at `2026-06-11T19:00:00Z` with venue `Estadio Banorte`, `Mexico City, Mexico`.
- Expanded the Android football parser to read `worldCupMatches`, `statusLong`, venue name/city, referee, halftime score, and ISO timestamps with or without seconds. The match details overlay now avoids a Unicode separator that could render badly on older boxes.
- Bumped Classic to `versionName 2.2.15` / `versionCode 21`, built signed sideload release APKs, and refreshed `apps/web/public/downloads/moplayer/*`.

Built APKs:

- Universal: `52791031` bytes, SHA-256 `62327cb09ed7cf00097151707c7b51a87f504fb8b75fa5cd2d5f958b6ac94590`
- arm64-v8a: `33637614` bytes
- armeabi-v7a: `33316004` bytes

Verification completed before publishing:

- `npm run verify:android:classic`
- `npm run release:moplayer`
- `npm run verify:web`
- `npm run verify:admin`
- Local `apps/web` `/api/football` smoke test on port `3010`: HTTP 200, 8 primary widget matches, 104 important/world cup matches.
- Android TV API 24 x86 emulator (`emulator-5554`): rebuilt `assembleSideloadDebug -PincludeX86Abis=true`, installed `app-sideload-x86-debug.apk`, launched Home, confirmed no crash/fatal log, and verified the Home football widget rendered `Mexico vs South Africa` with `19:00 - FIFA World Cup`.
- Published the public Vercel project to production alias `moalfarras.space`, published Supabase release metadata for `moplayer-2.2.15`, and published the admin Vercel project to production alias `admin.moalfarras.space`.
- Production `/api/football`: `source=espn-scoreboard`, `mode=world_cup_schedule`, `worldCupMatches=104`, primary `Mexico vs South Africa`, `2026-06-11T19:00:00Z`, venue `Estadio Banorte`, `Mexico City, Mexico`.
- Production `/api/app/releases/latest?product=moplayer`: `2.2.15` / `21`, slug `moplayer-2.2.15`, APK size `52791031`, SHA-256 `62327cb09ed7cf00097151707c7b51a87f504fb8b75fa5cd2d5f958b6ac94590`.
- Production `/api/app/config?product=moplayer`: `config.update.latestVersionName=2.2.15`, `latestVersionCode=21`, same APK size/SHA.
- Production download chain redirects through `/api/app/releases/moplayer-2.2.15/download` to `/downloads/moplayer/app-sideload-universal-release.apk`; the live APK downloaded from the domain matched the expected byte length and SHA-256.
- Production `/api/automation/health` now reports `football.ok=true`, `football.detail=200:espn-scoreboard`, `football.matches=8`; `admin.moalfarras.space` returns the expected login redirect.

## 2026-06-03 MoPlayer Classic 2.2.14 live/widget corrective release

Follow-up to the Classic 2.2.13 release after deeper QA on the provided large Xtream/M3U-plus source:

- Fixed Home weather and football widgets being hidden on low-tier Android TV devices. They now stay
  visible on API 24 / low-RAM TV targets while using lightweight rendering: no Lottie weather icon
  animation, slower football refresh cadence, static match logos, and no full-screen weather FX overlay.
- Changed Xtream live URL preference to choose HLS (`m3u8`) whenever the provider allows it and no
  explicit output format is saved. Explicit provider/user preference still wins, and live playback keeps
  the existing retry fallback between `m3u8` and `ts`.
- Bumped Classic to `versionName 2.2.14` / `versionCode 20`, built signed sideload release APKs, and
  refreshed `apps/web/public/downloads/moplayer/*`.

Built APKs:

- Universal: `52789387` bytes, SHA-256 `99b854aec6825340844850488b88d2d99e34183aec716126f91b325298f73d43`
- arm64-v8a: `33635970` bytes
- armeabi-v7a: `33314360` bytes

Verification completed before publishing:

- `npm run verify:android:classic`
- `npm run release:moplayer`
- `npm run verify:web`
- `npm run verify:admin`
- Android TV API 24 x86 emulator (`emulator-5554`, 1280x720): installed sideload debug x86 APK,
  confirmed Home shows both weather and football widgets on the low-tier emulator, opened Live TV from
  the cached 42k-item source, selected a channel with remote D-pad, and confirmed real live video playback.
  `LiveTvPerf` logged first frame at `394ms`; no `AndroidRuntime`/fatal crash appeared in logcat.
- Confirmed the test provider's HLS live endpoint returns an `#EXTM3U` playlist, and the existing cached
  `.ts` stream also plays on the emulator.
- Published the public Vercel project and admin Vercel project to production aliases
  (`moalfarras.space`, `admin.moalfarras.space`), then published Supabase release metadata for
  `moplayer-2.2.14` using the Vercel-hosted static APK URL.
- Production checks: `/api/app/releases/latest?product=moplayer` returns `2.2.14` / `20`; config returns
  `config.update.latestVersionName = 2.2.14` and checksum `99b854aec6825340844850488b88d2d99e34183aec716126f91b325298f73d43`;
  `/api/app/download/latest?product=moplayer` redirects to `/api/app/releases/moplayer-2.2.14/download`;
  the final APK URL returns HTTP 200 with `52789387` bytes and `application/vnd.android.package-archive`.

## 2026-06-03 MoPlayer Classic 2.2.13 large-library detail cache release

Scoped Classic pass in `apps/moplayer-android` focused on the normal MoPlayer app (`moplayer`,
package `com.mo.moplayer`) after testing the provided large Xtream/M3U-plus source:

- Added a non-destructive Room migration path for current installs: database `5 -> 6` is schema-neutral,
  so existing v5 libraries, credentials, favorites, watch state, and episodes survive app updates instead
  of falling through to destructive migration.
- Added Xtream detail caching for VOD and series. Movie detail now fetches `get_vod_info`, updates local
  poster/backdrop/plot/cast/director/genre/rating/duration/TMDB data, and refreshes the search row. Series
  detail now fetches `get_series_info`, updates local metadata, stores episodes in Room, and preserves
  previous episode watch progress during refresh.
- Fixed the new-content summary string that could render mojibake in logs/UI surfaces.
- Bumped Classic to `versionName 2.2.13` / `versionCode 19`, built signed sideload release APKs, and
  refreshed `apps/web/public/downloads/moplayer/*`.
- Published production public site to Vercel (`moalfarras.space`) and published Supabase release metadata
  for slug `moplayer-2.2.13`. Supabase Storage rejected the universal APK because it exceeds the bucket
  object-size limit, so the live release asset intentionally points to the Vercel-hosted static URL:
  `/downloads/moplayer/app-sideload-universal-release.apk`.

Built APKs:

- Universal: `52788559` bytes, SHA-256 `89e3557684e5e0dd6c668098b80064b2177d02341ca239a6105b56b945d56293`
- arm64-v8a: `33635142` bytes
- armeabi-v7a: `33313532` bytes

Verification completed:

- `npm run verify:android:classic`
- `npm run verify:web`
- `npm run verify:admin`
- `npm run release:moplayer`
- Android TV API 24 x86 emulator (`emulator-5554`, 1280x720): installed fresh sideload debug x86 APK,
  registered the provided test source, confirmed Room counts `12493` live, `19909` movies, `10398`
  series, `235` categories, and `42800` search rows. Home rendered movie/series poster rows from cache,
  opening a series cached `112` episodes, and force-stop/relaunch returned to Home from saved cache
  without re-entering credentials or crashing.
- Production checks: `/api/app/releases/latest?product=moplayer` and `/api/app/config?product=moplayer`
  return `2.2.13` / `19`; `/api/app/download/latest?product=moplayer` redirects to
  `/api/app/releases/moplayer-2.2.13/download`; the final APK URL returns HTTP 200 with `52788559`
  bytes and `application/vnd.android.package-archive`.

Still recommended next: replace Retrofit/Gson full-array Xtream parsing with a streaming JSON reader for
live/VOD/series API responses. M3U import is already streaming; Xtream catalogue endpoints still allocate
the full response list before batch inserts, which is the main remaining memory-risk on extremely weak boxes.

## 2026-06-01 MoPlayer Classic QA Notes

Classic Android TV work was verified on a local Android TV API 24 x86 emulator named `MoPlayer_Classic_API24_TV_720p`.

- Use JDK 17 for Classic Gradle commands. In this Windows workspace, a temporary Temurin JDK was used from `%TEMP%\codex-temurin17\jdk-17.0.19+10`.
- `npm run verify:android:classic` passed after the Classic fixes.
- `apps/moplayer-android/gradlew.bat assembleSideloadDebug -PincludeX86Abis=true` produced and installed `apps/moplayer-android/build-output/app/outputs/apk/sideload/debug/app-sideload-x86-debug.apk`.
- Manual QA imported an M3U playlist from `http://10.0.2.2:8765/test.m3u` served from a local Python HTTP server and played `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8` in Live TV.
- Verified paths: login method selection on 720p TV, M3U URL import, Home source-ready state, dock focus from Home to Live, Live category-to-channel focus, HLS playback startup, and logcat crash scan.
- Real Xtream QA was also run against a provider source. The app synced 12,472 live channels, 19,417 movies, 9,782 series, and 232 categories; Home posters rendered after the image proxy/Glide fix; Home now shows remaining subscription time; Live TV remote focus was tightened so a channel can open even when Android TV focus recovery loses the focused row. A stale sync-state row with `totalSeries=0` was repaired from the actual Room table counts.
- Classic `2.2.12` (`versionCode` 18) was built with `assembleSideloadRelease` for production ARM devices. The public APK at `apps/web/public/downloads/moplayer/app-sideload-universal-release.apk` is `52746532` bytes with SHA-256 `67b0fa3b55ca05e1ff7ea380b91c47d46d32748325669cb557a1b85487c305f7`.
- `apps/moplayer-android/local.properties` is intentionally untracked and may contain a stale SDK path on this machine; Gradle can still build when `JAVA_HOME` and Android SDK env/path are set correctly.

## 2026-05-25 Admin/Web Release Notes

- Admin was simplified into a clean operations panel: website, offers, app runtime/releases/images/content, and AI inbox.
- Removed email center from the active admin navigation and hid activation/device/license/source/support management from the app pages so the visible admin surface stays focused on launch-ready essentials.
- Added website offers management in Website Control. Offers can be placed on home, services, apps, contact, or all main pages with banner/card/strip layouts.
- MoPlayer Pro public page now reads hero/logo/banner/gallery data from admin-managed app product and screenshot records instead of only hardcoded preview images.
- Added an internal admin helper widget that explains where to change images, offers, app runtime, releases, and AI items.
- Added field help popovers and larger mobile-friendly form controls for clearer Arabic-first admin use.
- Latest MoPlayer Pro APK currently present at `apps/web/public/downloads/moplayer2/app-release.apk`:
  - version: `2.5.12` (`versionCode` 50)
  - size: `49253817` bytes
  - SHA-256: `1e8d9bd4ee4cae45a6164269dd102fc7905479285e01ecb44f661f45910374d5`
  - notes: poster/logo image restore on older Android TV devices, visible Home subscription expiry/connection data, TV keyboard sign-in submit polish, valid Series category recovery, shorter unstable live fallback, and real Xtream QA for library sync, VOD, and episodic playback.
- Production deploy completed on 2026-06-01 for `moalfarras.space` and `admin.moalfarras.space`; production config, latest release, download redirect, and hosted APK hash all resolve to MoPlayer Pro `2.5.12`.

Verification completed before deployment:

```powershell
npm run verify:production
```
