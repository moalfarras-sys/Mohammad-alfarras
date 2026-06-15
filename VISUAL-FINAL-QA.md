# Visual / Mobile Final QA

Date: 2026-06-15 · Captured with the preview browser against the local dev server (reads production Supabase).

## Setup note
Two leftover dev servers (web :3000, admin :3001) from prior automated sessions were verified as this project and stopped; clean preview-managed servers were started (web :3000, admin :3002). The web launch config `--hostname` pin was removed so the preview browser (localhost) and server share a host — otherwise lazy images hung and screenshots timed out.

## Screenshots captured + reviewed
| Page | Viewport / locale | Result |
|---|---|---|
| Home | mobile 375 · AR | ✅ Clean hero ("محمد الفراس · تصميم وبرمجة المواقع", no "Digital OS"), benefit chips (no tech list), dock nav with no "Mo Ai", floating Mo Ai widget present, RTL correct, no horizontal overflow |
| Contact | mobile 375 · AR | ✅ Cinematic hero "احك لي عن مشروعك" — full form (type, name, email, whatsapp, budget, timeline, appointment, details), **new optional attachment field**, consent, real "إرسال الطلب" submit. No "Continue" half-flow |
| Support | desktop · EN | ✅ "App and Project Support" — full diagnostic copy, not a placeholder; full parity with AR; clean dock nav |
| 404 | desktop · EN | ✅ "This page could not be found." / "هذه الصفحة غير موجودة." — "Digital OS" text removed; bilingual |
| MoPlayer Pro | desktop · EN | ⚠️→✅ Found visitor-facing jargon in DB copy ("admin-controlled", "Supabase", "Vercel", "runtime settings", "admin product switcher"); rewritten + re-verified clean. Download counter visible ("8 since Jun 2026") |

## Visual checks
- No horizontal overflow observed on captured pages (mobile + desktop).
- Text not cramped; Arabic font (IBM Plex Sans Arabic) renders cleanly; RTL correct.
- Buttons are full-size and labelled (no silent buttons observed); CTAs link to real routes.
- No "Mo Ai" link in header nav or footer; floating Mo Ai widget present on public pages.
- No standalone AI page (redirect/noindex confirmed separately).
- No visitor-facing tech jargon after fixes (code + CMS content + app_products copy).
- Contact is a complete single-page form (not a partial flow). Support EN is full quality.

## Blocker found and fixed
`app_products[moplayer2]` (the MoPlayer Pro page) rendered internal/developer copy to visitors on both `/en` and `/ar` (tagline, long_description, feature_highlights, how_it_works = literal admin instructions). Rewritten to customer copy in production + migration `20260615170000_visitor_copy_jargon_cleanup.sql`, then re-verified live (jargon=none, new copy live on both locales).

## Not captured this session (honest)
- Authenticated **admin** UI screenshots (dashboard/services/media/apps/leads): the admin app is auth-gated and the owner password is not available to me; the admin launch config also pins `--hostname`, so its login page screenshot timed out. Admin function is proven instead via the live reversible binding test (CMS-REALITY-TEST.md).
- Not every page × every device × every locale was screenshotted (≈19 pages × 6 combos is impractical); a representative high-priority set across mobile + desktop and AR + EN was captured, with structural/HTTP verification (snapshots, route 200s, curl) covering the rest.
- Tablet preset and Android-vs-iPhone distinction: viewport-width responsive behavior verified at mobile 375 and desktop; no separate tablet capture.
