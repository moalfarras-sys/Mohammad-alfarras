# moalfarras.space — Site Roadmap (2026-06-21)

READ-ONLY audit consolidation. Public site = `apps/web` (Next 16, `[locale]` ar+en, Arabic primary).
Admin = `apps/admin`. Products: Classic (`moplayer`) / Pro (`moplayer2`) / PC (`moplayer-pc`) / iOS.

All paths are repo-relative to `C:/Users/Moalf/Desktop/Moalfarrasspace`.

---

## 1. Executive summary

The site is feature-rich and structurally sound: global SEO backbone (title template, OG/Twitter,
robots, hreflang ar/en + x-default=ar, bilingual sitemap, Person/Org/WebSite JSON-LD), a working
bilingual "Mo Ai" assistant lazy-loaded site-wide, and cinematic product pages. Four problems block
the owner's goals (real per-app images, top-tier speed, beautiful look, flagship animated Mo Ai, full
keyword SEO):

1. **Real images.** Only **one** product has a genuine in-repo screenshot library —
   **MoPlayer Pro for Windows/PC** at `apps/moplayer-pro-windows/qa-screenshots` (40 real PNGs,
   verified). Classic Android, Pro Android and iOS have **zero** usable screenshots (only build
   artifacts, icons, and one CORRUPT file). The web currently fills those gaps with AI mockups, one of
   which (`moplayer-classic-promo.png`) embeds real channel logos (MBC/beIN/OSN) — a compliance risk
   per the project's own iOS `SCREENSHOTS_GUIDE.md`.

2. **Speed.** `apps/web/public/images` is **28 MB**; the brand icon and logo are **1.5 MB each**
   (`moplayer-icon-512.png`, `moplayer-brand-logo-final.png`) yet render at 42–96 px. The Pro/PC
   screenshots run 1–3 MB. Plus 8 always-on infinite CSS animations and heavy backdrop-blur.

3. **SEO keywords.** Only the 9 pages in `apps/web/src/content/seo-data.ts` carry keywords. Every
   high-value product/flow page (MoPlayer hub, Classic, Pro, PC, iOS, AI, support, work case studies,
   legal) builds metadata inline with **no keywords field**. Keywords are also dev-only constants with
   **no admin editing path**.

4. **Mo Ai.** The widget text is **already rebranded to "Mo Ai"** (`site-assistant-widget.tsx:14-44`),
   but it is **visually static** — there are still **no `@keyframes mo-ai-*` and no transitions** in the
   `.mo-ai-*` CSS block (`globals.css:4871-5139`), and the typing indicator is a plain spinner. The FAB
   label still says "مساعد محمد"/"Assistant" (`lazy-site-assistant.tsx:60,63`). Admin cannot control the
   assistant at all (read-only `ai_assistant_settings`).

> Standing-rule note: MEMORY records an owner rule that the site must **not** visibly show "AI"/"Mo Ai".
> The widget already ships the visible "Mo Ai" string. **Confirm with the owner** whether the visible
> "Mo Ai" brand is now intended before extending it to the FAB / `/ai` page / footer.

---

## 2. Per-product REAL-IMAGE plan

Rule: each product shows ONLY its own real screenshots. Where no real screenshot exists in the repo,
render an explicit **"needs image — upload from admin"** empty slot — never borrow another app's art.

### 2a. Source inventory (what is real in the repo)

| Product | Real screenshots in repo? | Source |
|---|---|---|
| **Pro / PC (Windows desktop)** | YES — 40 genuine PNGs | `apps/moplayer-pro-windows/qa-screenshots/*.png` |
| **Classic (Android)** | NO — only build artifacts + launcher icons | `apps/moplayer-android/**` (no fastlane/qa) |
| **Pro (Android)** | NO — one candidate is CORRUPT | `apps/moplayer-pro-android/build/qa-login.png` (invalid: header `ff fe fd ff 50 00 4e 00`, UTF-16-mangled PNG sig, `file`→`data`) |
| **iOS** | NO — only a capture GUIDE + logo | `apps/MoPlayer iphone ios/docs/app-store/SCREENSHOTS_GUIDE.md`; logo `.../assets/branding/logo.png` |

### 2b. Real-file → web-slot mapping (Pro/PC desktop)

Use the `real-*` set (loaded with real data). Convert to WebP/AVIF and target <300 KB before copying
into `apps/web/public/images` (e.g. namespaced `/images/apps/pc/*`, `/images/apps/pro/*`).

| Repo file (qa-screenshots) | Size | → Web slot |
|---|---|---|
| `real-home-loaded.png` | 1.47 MB | **Hero** (PC and/or Pro). Keep existing `moplayer-pc-desktop.png` hero, or replace |
| `real-movies.png` | 2.84 MB | Gallery — Movies (good demo-poster hero alt) |
| `real-series.png` | 2.90 MB | Gallery — Series |
| `real-live.png` | 1.12 MB | Gallery — Live TV |
| `real-guide.png` | 1.07 MB | Gallery — EPG/Guide |
| `real-settings.png` | 1.37 MB | Gallery — Settings |
| `real-multi.png` | 0.88 MB | Gallery — Multi-view (USP) |
| `real-search.png` | 1.24 MB | Gallery — Search |
| `real-login.png` | 1.39 MB | Gallery — Login/Activation |
| `ar-home.png` / `ar-settings.png` / `ar-matches.png` / `ar-multi.png` / `ar-login.png` / `ar-multi-picker.png` | 0.19–1.45 MB | **Arabic (RTL) locale** variants — pair with EN counterparts |
| `real-player.png` / `real-current-live-player.png` | 2.57 / 1.60 MB | **AVOID on public surfaces** — shows live beIN broadcast (copyright). If used, crop/compress |

Generic (non-`real-`) variants (`home/live/movies/series/player/guide/settings.png`) are genuine but
show sparse demo data — prefer the `real-*` set.

Current web wiring to update:
- `apps/web/src/components/app/moplayer-pc-landing.tsx:117` — hero defaults to `/images/moplayer-pc-desktop.png` (a real PC shot — keep). Add a real gallery from `screenshotItems[]` (`:109`).
- `apps/web/src/components/app/moplayer2-landing.tsx:167-171` — gallery falls back to AI `moplayer-pro-showcase-*.png|webp`; replace with real `real-*` shots.
- `apps/web/src/components/digital-os-vnext.tsx:396-448` — homepage cards use `/images/moplayer-pro-hero.webp` + `moplayer-pc-desktop.png`.

### 2c. Products that MUST show an empty "upload from admin" slot

| Product | Web slots to set to empty state | Why |
|---|---|---|
| **Classic (Android)** | hero + gallery on Classic landing | No real Android shots; current `moplayer-classic-promo.png` is an AI mockup embedding MBC/beIN/OSN logos — retire it |
| **Pro (Android)** | hero + gallery (IF Pro pages = Android app) | Only candidate file is corrupt; if Pro pages actually mean the desktop, use 2b instead — confirm with owner |
| **iOS** | hero + gallery | No screenshots captured; do NOT reuse `moplayer-pro-home.webp` (TV mockup, wrong form factor). Logo-only slot may use `.../assets/branding/logo.png` |

The admin upload path already exists (`uploadAppScreenshot` → `app-media` bucket, `saveAppScreenshot`
in `app-ecosystem.ts`; `normalizeScreenshots()` already strips classic-only images from Pro at
`app-ecosystem.ts:420-422`), so "needs image" placeholders are immediately actionable.

---

## 3. Per-page SEO / keywords table

`has-keywords?` = does the page currently emit a `keywords` metadata field. Pages routing through
`pageMetadata()` / `seo-data.ts` (9 slugs) do; pages with inline `generateMetadata` do not.

| Page (route) | Has keywords? | Recommended AR + EN keywords |
|---|---|---|
| Home `/[locale]` | YES (`seo-data.ts:16/135`) | strengthen title; add `web design Germany / تصميم مواقع في ألمانيا`, `Mohammad Alfarras developer` |
| About `/about` | YES (`seo-data.ts:85/...`) | OK; **add WebPage+Breadcrumb JSON-LD** (currently none) |
| Services `/services` | YES — but **dup** `تطوير مواقع` at `seo-data.ts:194-195` | replace dup with `تطوير تطبيقات ويب` / `تصميم متجاوب`; add Service/ProfessionalService JSON-LD |
| CV `/cv` | YES | OK |
| Work index `/work` | YES | OK |
| YouTube `/youtube` | YES | OK |
| Contact `/contact` | YES | OK |
| Privacy `/privacy` | **NO** — own `generateMetadata` drops configured keys (`privacy/page.tsx:13-52`; keys exist at `seo-data.ts:129/270`) | wire `copy.keywords` into the privacy `generateMetadata` |
| Apps hub `/apps` | YES | OK; add ItemList/CollectionPage + per-app SoftwareApplication JSON-LD |
| **MoPlayer hub** `/apps/moplayer` (`page.tsx:36-62`) | **NO** | `MoPlayer, IPTV player family, Android TV, Windows, iOS, محمد الفراس / عائلة تطبيقات MoPlayer, مشغل IPTV` |
| **Classic** `/apps/moplayer/classic` (`page.tsx:51-77`) | **NO** | `MoPlayer Classic, IPTV player Android, M3U player, Xtream player, lightweight Android TV player, APK download / مشغل IPTV للأندرويد, مشغل M3U, مشغل خفيف للأجهزة الضعيفة, تشغيل قوائم IPTV` |
| **Pro** `/apps/[productSlug]` (moplayer2) (`page.tsx:64-90`) | **NO** | `MoPlayer Pro, Android TV IPTV player, Fire TV player, Xtream Codes player, premium IPTV app / مشغل IPTV لأجهزة Android TV, مشغل Fire TV, مشغل Xtream, تفعيل MoPlayer Pro` |
| **PC** `/apps/moplayer-pc` (`page.tsx:48-76`) | **NO** | `MoPlayer PC, Windows IPTV player, desktop M3U player, Xtream Windows / مشغل IPTV لويندوز, مشغل وسائط ويندوز, تحميل مشغل للكمبيوتر` + **SoftwareApplication+FAQ JSON-LD (currently none)** |
| **iOS** `/apps/moplayer-ios` (`page.tsx:145-162`) | **NO** | `MoPlayer iOS, iPhone IPTV player, Apple TV player, App Store IPTV / مشغل IPTV للايفون, مشغل آيفون` + **OG image + Twitter card + SoftwareApplication JSON-LD (all missing)** |
| **AI / Mo Ai** `/ai` (`page.tsx:58-85`) | **NO** | `Mo Ai, AI assistant, site assistant, chatbot, MoPlayer help / مساعد ذكي, مساعد الموقع, شات بوت, مساعدة MoPlayer` + **OG image + Twitter + WebPage/FAQPage JSON-LD (all missing)** |
| **Support** `/support` (`page.tsx:130-172`) | **NO** | `MoPlayer support, IPTV player help, activation support / دعم MoPlayer, مساعدة تقنية, دعم التفعيل, الدعم الفني` |
| **Work case study** `/work/[slug]` (`page.tsx:52-75`) | **NO** | derive from `project.tags`/tech/client + `web design, case study / تصميم مواقع, دراسة حالة, محمد الفراس` |
| **Legal** terms/impressum/disclaimers (`legal-route.tsx:18-41`) | **NO** | Impressum: `Impressum, legal notice, imprint, Mohammad Alfarras / بيانات قانونية, الناشر, محمد الفراس`; add OG/Twitter for indexable Impressum |

Baseline confirmed correct (no action): hreflang ar/en + x-default=ar on every route; sitemap
(`sitemap.ts:15-32`) covers all routes incl. 5 MoPlayer pages + ai/contact/support/privacy/impressum
with per-URL alternates + dynamic `work/[slug]`; robots blocks admin/api/downloads/draft; pairing &
unpublished legal correctly noindexed.

---

## 4. Admin additions ("real control")

| # | Addition | Why / current gap | Priority |
|---|---|---|---|
| 1 | **Per-page SEO keywords field** (AR/EN) in Pages & SEO editor (`website-control.tsx:1018-1148`) + `saveWebsitePageAction` (`actions.ts:702-740`); persist to `page_translations.meta_keywords`; `seo.ts:31` prefers CMS over `seo-data.ts` fallback | keywords are dev-only constants; owner wants editable keywords on every page | HIGH |
| 2 | **Mo Ai assistant settings card** + `saveAiAssistantSettingsAction` — toggle `enabled`, provider/model, system prompt, AR/EN greeting, quick-reply chips, persona/avatar. `ai_assistant_settings` is currently **read-only** (`ai-ops.ts:158-159`, displayed at `ai-operations.tsx:217-219`) | owner cannot control the flagship assistant from admin | HIGH |
| 3 | **Screenshot alt-text (AR/EN) + "Featured" toggle** in add/edit forms (`app-control.tsx:916-941`, `:960-976`); the save action already accepts them (`actions.ts:308-317`) but the UI never sends them (alt always empty, featured always false) | a11y + SEO requirement | HIGH |
| 4 | **Explicit "needs image — upload here" empty slot** across product logo/hero/TV-banner/gallery, iOS hero, PC hero (replace decorative `EmptyState`/`ImageFallback` at `app-control.tsx:980`, `website-control.tsx:1088`) | enforces no-mixing rule; today empties silently fall back to shared/AI art | MEDIUM |
| 5 | **Audit log** (`audit_log`: actor, action, target, before/after, ts) written from each mutating action + read-only "Recent changes" on Overview | no history/undo for editor+admin destructive deletes | MEDIUM |
| 6 | **Drag-to-reorder** for screenshots/projects/services/FAQ/offers (keep `sort_order` persisted) | numeric manual entry only today | MEDIUM |
| 7 | **Website analytics card** (pageviews/top pages/referrers + messages & downloads trend) | dashboard shows only download + content counts (`home-dashboard.tsx:44-64`) | MEDIUM |
| 8 | **iOS multi-screenshot gallery** like PC `screenshotItems[]` (`actions.ts:1167-1216`); iOS currently single `heroImageUrl` only (`actions.ts:576-630`) | owner cannot build an iOS gallery from admin | LOW |
| 9 | **Client-side file preview** before save (object URL) for brand/profile/contact hero, site image slots (`actions.ts:977-1009`), page social image, project/service covers | must save then open public page to verify | LOW |

---

## 5. Prioritized improvement roadmap

### P0 — Speed (biggest LCP/bandwidth win on weak devices)
1. Re-export `moplayer-icon-512.png` & `moplayer-brand-logo-final.png` (1.5 MB each, rendered 42–96 px →
   `apps-showcase-page.tsx:310/355`, `digital-os-vnext.tsx:479`) to <40 KB PNG or SVG.
2. Compress every `public/images` asset >300 KB to WebP/AVIF <150 KB (`yt-channel-hero.png` 1.48 MB,
   `hero-profile-bg.png` 1.44 MB, `projects/*.png` 0.9–1.4 MB). Target ~60–70% payload cut from 28 MB.
3. Ensure Supabase-hosted CMS images run through next/image optimizer (drop `unoptimized` where CSP
   allows; `remotePatterns` already allows the host at `next.config.ts:46`).
4. Compress chosen Pro/PC screenshots to <300 KB WebP before wiring (§2b).

### P1 — Real images + high-value SEO
5. Wire real Pro/PC `real-*` screenshots into PC + Pro galleries; set Classic/iOS (and Pro-Android, if
   applicable) to "needs image — upload from admin"; **retire `moplayer-classic-promo.png`** (embedded
   third-party logos). (§2)
6. Add `keywords` to every inline `generateMetadata` page; fix Services dup (`seo-data.ts:194-195`);
   wire privacy keywords. (§3)
7. Add missing structured data: SoftwareApplication+FAQ on PC; OG image+Twitter+SoftwareApplication on
   iOS; OG image+Twitter+WebPage/FAQPage on AI; WebPage+Breadcrumb on About/Services. (§3)

### P2 — Features that attract visitors
8. **Mo Ai animation pass** (§6) — flagship requirement, currently zero animations.
9. Add `loading.tsx` skeletons for data-heavy routes (home, apps/*, youtube, support) — none exist today.
10. Public **Status** + **Changelog** pages (data already exists: version/date/size/SHA-256 +
    maintenance flag at `moplayer-pc-landing.tsx:124-131/:226`); link from footer + product pages.
11. **QR download cards** on each product page (encode `/api/app/download/latest` + activate URL) and a
    consolidated `/help` (or `/faq`) page aggregating per-product FAQs with FAQPage JSON-LD.
12. Expand the thin **About** page (timeline/values/photo/metrics, reuse `story[]`/`stack[]`) and add a
    **testimonials/social-proof** section (real clients + YouTube metrics) on home/services.

### P3 — Page polish / smoothness on weak devices
13. Gate expensive always-on effects (large backdrop-blur hero panels, marquee, glass sweep — 8 infinite
    keyframes + 22 backdrop-filter uses in `globals.css`) behind a low-power/coarse-pointer/small-viewport
    heuristic; pause infinite animations offscreen via IntersectionObserver. (reduce-motion already handled
    globally at `globals.css:1916`.)
14. Ensure exactly one `priority` image per route; lazy-load decorative full-bleed backgrounds
    (`moplayer_pc_bg.png` 0.56 MB at `moplayer-pc-landing.tsx:201`; `moplayer-pro-bg.png` at
    `moplayer2-landing.tsx:251`).

---

## 6. Mo Ai chatbot redesign spec

**Current state (verified 2026-06-21):** widget text is ALREADY rebranded to "Mo Ai" with a marketing
welcome and conversion starters (`site-assistant-widget.tsx:14-44`). The backend
(`lib/ai-assistant.ts`: grounded canned replies → OpenAI/Gemini/Anthropic/custom → local fallback,
Supabase persistence + lead emails) is solid — **do not touch provider/persistence/lead logic**.

**Two real remaining gaps:** (1) zero animations on the widget; (2) the FAB still says
"مساعد محمد"/"Assistant".

### 6a. Animation pass (HIGH) — CSS-only, no new JS libs

`apps/web/src/app/globals.css` — the `.mo-ai-*` block at `4871-5139` has **no `@keyframes`, no
`animation:`, no `transition:`** (only generic `os*` keyframes exist elsewhere). Add, wrapped in
`@media (prefers-reduced-motion: no-preference)`:
- `.mo-ai-fab` (`4895-4920`): idle attention pulse + hover lift; add an animated avatar/spark mark so it
  reads as Mo Ai, not a generic chat bubble.
- `.mo-ai-panel` (`4922`): entrance = slide-up + fade + slight scale, **RTL-aware**.
- `.mo-ai-bubble` (`5014`): per-message reveal with staggered `animation-delay`.
- New `.mo-ai-typing`: real 3-dot indicator to replace the spinner.

### 6b. Real typing indicator (HIGH)

`apps/web/src/components/site/site-assistant-widget.tsx:191-197` — replace the `Loader2` spinner +
"Mo Ai is typing…" bubble with three animated dots using the new `.mo-ai-typing` CSS. Message bubbles
(`182-190`) currently render instantly; pair with the §6a reveal animation.

### 6c. Finish the rebrand on remaining surfaces (HIGH — gate on owner confirmation)

| File:line | Current | Change to |
|---|---|---|
| `lazy-site-assistant.tsx:16` | `aria-label="Assistant"` | `"Mo Ai"` |
| `lazy-site-assistant.tsx:60` | `"فتح المساعد"` / `"Open assistant"` | `"فتح Mo Ai"` / `"Open Mo Ai"` |
| `lazy-site-assistant.tsx:63` | `"مساعد محمد"` / `"Assistant"` | `"Mo Ai"` |
| `ai/page.tsx:16-18,33-35,63` | eyebrow/lead/metadata "مساعد محمد"/"Smart site assistant" | "Mo Ai" |
| `site-footer.tsx:32` | `"المساعد الذكي"` / `"Assistant"` | `"Mo Ai"` |
| `ai-assistant.ts:35,37` | persona "أنت المساعد الذكي…" / "You are the smart assistant…" | introduce itself as "Mo Ai" so LLM replies match |

### 6d. Keep as-is (already good)
- Site-wide mount (`layout.tsx:229`), hidden on `/activate` + `/moplayer/setup`
  (`site-assistant-widget.tsx:97-99`, `lazy-site-assistant.tsx:30-32`).
- Global `mo-ai:open` event entry points (open-assistant-button, work pages, footer).
- Bilingual page-aware context injection (`site-assistant-widget.tsx:135-138`).
- Verify FAB does not overlap the CookieBanner mounted right after at `layout.tsx:230`.

> Before shipping any additional visible "Mo Ai" string (6c), confirm against the MEMORY no-visible-"AI"
> rule. The widget itself already shows "Mo Ai", so the owner may have already approved — verify.
