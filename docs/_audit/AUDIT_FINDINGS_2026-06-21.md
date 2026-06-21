# moalfarras.space — Web Ecosystem Audit Findings

**Date:** 2026-06-21
**Scope:** `apps/web`, `apps/admin`, `supabase/`, repo root (web ecosystem). Native app source trees are out of scope except where flagged.
**Branch context:** `fix/production-audit-2026-06-18`

---

## Executive summary

The web ecosystem is in strong shape: full ar/en parity across all 25 public pages with consistent RTL handling, a real (not shell) admin CMS whose writes bind end-to-end to the production Supabase tables the public site reads, a hardened Supabase security posture (RLS on every sensitive table, no service-role key in the browser, no committed secrets), solid SEO foundations (dynamic ar+en sitemap, per-URL hreflang, JSON-LD), and a well-architected activation flow with encrypted, ephemeral, token-gated provider sources. The most serious issues are concentrated and fixable. Two **critical-class security gaps** sit in the activation flow: there is **no rate limiting on any activation route** (a ~707k 4-char code space + ownership-free confirm makes live codes brute-forceable to hijack devices or push malicious sources), and the **provider-source encryption key silently falls back to the Supabase service-role key**. The most visible content bug is that the **home hero is hardcoded** and ignores the CMS `home_content` document, so admin homepage edits do nothing. Several surfaces share a single recurring root cause — the **`/ai` route** (indexable, in sitemap, "smart/الذكي" framing, footer link) is simultaneously contradicted by an e2e suite that expects it retired, and an **unconfirmed hardcoded Android-TV Downloader code (7876083)** plus **stale version fallbacks** risk showing wrong values if any CMS row is absent. Mobile/RTL has two real quality hits: the **Arabic (primary) font loads only weight 400** while the UI uses 800–950 (faux-bold), and **hero LCP text is gated behind framer-motion `opacity:0`**.

---

## Counts by severity

| Severity | Count |
|---|---:|
| Critical | 0 |
| High | 11 |
| Medium | 17 |
| Low | 22 |
| Info | 22 |
| **Total** | **72** |

> Note: no findings were labelled `critical` in the source data; the two highest-risk security items (activation rate-limiting, encryption-key fallback) are `high` and are treated as fix-now priorities below.

## Counts by area

| Area | High | Medium | Low | Info | Total |
|---|---:|---:|---:|---:|---:|
| public-pages-i18n | 1 | 1 | 2 | 4 | 8 |
| nav-footer-cta-links | 0 | 1 | 1 | 4 | 6 |
| moplayer-products-downloads | 1 | 2 | 3 | 2 | 8 |
| activation-flow | 2 | 4 | 4 | 2 | 12 |
| admin-panel-binding | 0 | 3 | 3 | 4 | 10 |
| supabase-security | 0 | 0 | 3 | 4 | 7 |
| seo-indexing | 2 | 1 | 2 | 5 | 10 |
| forms-email | 1 | 2 | 3 | 3 | 9 |
| ai-chatbot | 0 | 3 | 2 | 2 | 7 |
| dead-code-cruft | 1 | 3 | 6 | 2 | 12 (1 out-of-scope) |
| perf-mobile-rtl | 2 | 4 | 4 | 1 | 11 |
| **Total** | **10** | **24** | **33** | **33** | **100 line-items*** |

> *Per-area rows count line-items including positive "info" confirmations; the de-duplicated severity table above (72) merges the cross-area duplicates (e.g. the `/ai` route, the provider-source encryption-key fallback, and the contact-page i18n gap each appear in multiple areas).

---

## Top priorities (fix now)

Ordered, de-duplicated across areas. These are the in-scope critical/high items (plus the medium items that share the same root cause as a high item).

### 1. No rate limiting on any activation API route — live 4-char codes are brute-forceable (SECURITY)
- **Files:** `apps/web/src/app/api/app/activation/confirm/route.ts:13`, `.../status/route.ts`, `.../create/route.ts`, `.../source/route.ts`, `.../source/test/route.ts`, `.../source/ack/route.ts`; helper exists at `apps/web/src/lib/request-guard.ts`
- **Why it matters:** Device code is only 4 chars over a 29-symbol alphabet (~707k combos, `apps/web/src/lib/activation-code.ts:23`). `confirm` activates ANY matching `waiting` code with no ownership/session binding. Codes live 15 min. An attacker can enumerate the keyspace against `confirm` to hijack someone else's device, then POST to `source` to push a malicious Xtream/M3U source. `status` is equally open and leaks which codes are live. This is the single highest-risk issue.
- **Fix:** Add `rateLimit()` (already used by contact/support/assistant routes) to every activation route, keyed by IP+bucket — tight on `confirm`/`status` (10–20/min) and `source`/`source-test` (5–10/min). Bind a code to its creator via a short signed nonce returned by `create` and required at `confirm`, so a guessed code alone cannot be activated by a third party. Optionally lengthen the code / add a per-device confirm-attempt cap.

### 2. Provider-source encryption key silently falls back to the Supabase service-role key (SECURITY)
- **Files:** `apps/web/src/lib/provider-source-security.ts:64-65` (also derives HMAC at `:184-186`); doc'd as dev fallback in `apps/web/.env.example:33-36`
- **Why it matters:** `serverSecret()` uses `MOPLAYER_PROVIDER_ENCRYPTION_KEY || SUPABASE_SERVICE_ROLE_KEY`. If the dedicated var is unset in prod, the AES-256-GCM key encrypting users' Xtream/M3U credentials is derived from the same key that already has full read access to the ciphertext rows — so the at-rest encryption provides little defense-in-depth. The single secret is also reused for the pull-token HMAC (weak key hygiene).
- **Fix:** Require a dedicated `MOPLAYER_PROVIDER_ENCRYPTION_KEY` (fail closed in production if missing rather than falling back). Derive separate encryption vs HMAC keys via HKDF with distinct info labels. Document the var in deployment config.

### 3. Home hero is hardcoded and bypasses the CMS `home_content` document (CMS BINDING)
- **File:** `apps/web/src/components/site/digital-os-vnext.tsx:294-342`
- **Why it matters:** `HomePageV2()` builds the hero from a local literal `home` object and never references `model.t.hero`, which `site-model.ts` already wires from the admin `home_content` setting (`cms-documents.ts:276`/`:363`). Editing the homepage headline/body in admin has **zero effect** on the live site — the known-hardcoded headline.
- **Fix:** Read the hero eyebrow/title/body/CTAs from `model.t.hero` (and the other `home_content` fields), falling back to the local literals only when empty, e.g. `const title = model.t.hero?.headline?.trim() || home.title;`. Verify the `home_content` shape in `cms-documents.ts` before wiring.

### 4. The `/ai` route is internally contradictory (renders + sitemap vs e2e expects it retired) and carries "smart/الذكي" framing (SEO + AI-BRANDING)
- **Files:** `apps/web/src/app/[locale]/(site)/ai/page.tsx:15-35,67,87-140`; `apps/web/src/app/sitemap.ts:30`; `apps/web/src/components/layout/site-footer.tsx:32`; `tests/e2e/control-center-and-seo.spec.ts:82-83,107-115`; `next.config.ts` redirects `:8-16`
- **Why it matters:** The page is live and listed in the sitemap, yet the e2e suite asserts `/{locale}/ai` should **308-redirect to home** and be **absent from the sitemap** — and no such redirect exists in `next.config.ts`, so the suite will fail against this code. Separately, the footer label "المساعد الذكي" and the page eyebrow/metadata ("Smart site assistant" / "مساعد محمد الذكي") read as AI branding, and the `/ai` slug is visible in the address bar — borderline against the no-visible-AI rule. (The floating widget itself is correctly neutral: "Site assistant" / "مساعد محمد".) It is also a thin landing page for SEO.
- **Fix (decide intent once):**
  - **If retiring:** delete `app/[locale]/(site)/ai/`, add `/:locale(en|ar)/ai -> /:locale` permanent redirect in `next.config.ts`, remove the `/ai` sitemap entry, update the footer link. This satisfies the e2e suite and the branding rule in one move.
  - **If keeping:** remove the retired-redirect + sitemap-exclusion assertions (spec `:82-83,107-115`), set `robots:{index:false}` on the page (thin content), move it to a neutral slug (e.g. `/assistant` with a redirect from `/ai`), and soften copy to drop "ذكي"/"smart" to match the neutral widget.

### 5. Two activation/session pages are indexable and in the sitemap despite carrying `?code=` (SEO)
- **Files:** `apps/web/src/app/[locale]/(site)/activate/page.tsx:69` and `.../moplayer/setup/page.tsx:32`; both listed in `apps/web/src/app/sitemap.ts:27-28`
- **Why it matters:** Both render the device-pairing flow with `?code=`/`?device_code=` and set no `robots:{index:false}`, and the sitemap actively invites Google to crawl them — risking code-bearing URLs being cached in search results. `/moplayer/setup` is also a near-duplicate of `/activate` (both mount `MoPlayerActivationPage`).
- **Fix:** Add `robots:{index:false, follow:true}` to both `generateMetadata` returns and remove both from `sitemap.ts`. Consider 301-redirecting `/moplayer/setup` to `/activate` to collapse the duplicate surface.

### 6. Android TV "gateway" Downloader code 7876083 is hardcoded with no CMS/migration backing (CMS BINDING)
- **Files:** `apps/web/src/components/app/moplayer-product-hub.tsx:50-51`; corroborated only in `docs/PRODUCTION_AUDIT_2026-06-18.md` (flagged pending owner confirmation)
- **Why it matters:** `DOWNLOADER_CODES = { gateway: "7876083", pro: "4608937" }`. The Pro code is corroborated everywhere (migration 024, web/admin, config route, landing). The **gateway** code appears only here, has no `site_settings`/migration row, cannot be verified from code, and admins cannot change it without a redeploy. If 7876083 is wrong/unregistered, every TV visitor using the gateway path hits a dead code. The same component also ignores the CMS `downloaderCode` that the Pro landing honors (medium-severity sibling: hub shows a fixed Pro code while `moplayer2-landing.tsx:211` uses `runtimeConfig.downloaderCode`, so an admin edit updates `/apps/moplayer2` but not the hub).
- **Fix:** Confirm 7876083 with the owner. Source **both** codes from CMS (e.g. a `site_settings` key or the existing `*_public_config`) so they are admin-editable, mirroring `moplayer2-landing`'s `runtimeConfig.downloaderCode`. Pass the Pro `runtimeConfig.downloaderCode` into the hub card instead of the hardcoded constant. At minimum add a migration/seed documenting the gateway code as the single source of truth.

### 7. Support form reports success even when persistence AND all emails fail (silent total failure) (BUG)
- **File:** `apps/web/src/app/api/app/support/route.ts:152-197`; `saveSupportRequest` at `apps/web/src/lib/app-ecosystem.ts:561-605`
- **Why it matters:** `saveSupportRequest()`, `sendMail()`, and `sendTransactionalMail()` return values are all ignored, and `saveSupportRequest` always returns a `requestId` even when the DB insert and fallback both fail. If Supabase is down and SMTP/Resend are misconfigured, the visitor sees the localized "request received" success while **nothing is stored or emailed**, with no owner alert. Leads can be silently lost.
- **Fix:** Make `saveSupportRequest` return a discriminated result (`stored: 'db'|'fallback'|false`); have the route return 502 with the localized error when nothing was stored AND the owner email was not delivered (mirroring `/api/contact`'s `if (!delivered && !stored) return 502`). At minimum fire `sendAutomationAlert()` when nothing persisted/sent.

### 8. 613MB `apps/MoPlayer iphone ios.rar` is untracked AND not git/vercel-ignored (DEAD-CODE / FOOTGUN)
- **File:** `apps/MoPlayer iphone ios.rar`
- **Why it matters:** `git check-ignore` exits 1 (NOT ignored) and the file is untracked. Nothing in `.gitignore`/`.vercelignore` excludes `*.rar`. A stray `git add .` would commit a 613MB blob into history; a deploy could try to upload it. It duplicates the live `apps/MoPlayer iphone ios/` source and a standalone export already exists outside the repo.
- **Fix:** Delete the `.rar`. Add `*.rar` (and `apps/*.rar`) to both `.gitignore` and `.vercelignore`.

### 9. Arabic (primary, RTL) font loads only weight 400 but UI uses 800–950 → faux-bold (RTL QUALITY)
- **File:** `apps/web/src/lib/fonts.ts:11`
- **Why it matters:** `arabicFont = IBM_Plex_Sans_Arabic({ weight: "400" })` loads a single weight, while `globals.css` uses font-weight 800/900/950 in 70+ places (e.g. `:416,446,478,3521,4118`). Arabic is the primary language and is first in the RTL body stack, so every bold Arabic heading renders as smeared browser faux-bold. (Latin/Manrope is variable and unaffected.)
- **Fix:** Load real Arabic weights `["400","500","700"]` (IBM Plex Sans Arabic max is 700) and cap RTL heading weights at 700, so bold Arabic uses real glyphs instead of faux-bold.

### 10. Hero LCP text gated behind framer-motion `opacity:0` mount animations (PERF)
- **Files:** `apps/web/src/components/app/moplayer2-landing.tsx:284-292`, `moplayer-landing.tsx:128`, `work-digital-exhibition.tsx`, `apps-showcase-page.tsx`, `moplayer-pc-landing.tsx`
- **Why it matters:** These client components emit `style="opacity:0"` in SSR HTML for the hero `h1` (the LCP element), so it stays invisible until hydration + animation runs — delaying LCP and causing FOUC on slow mobile. No SSR-safe fallback.
- **Fix:** Render hero copy visible by default and animate as enhancement only (gate `opacity:0` behind a `mounted` state, or set `initial={false}` for first paint of LCP nodes, or move hero text out of motion components).

---

## Area findings

### public-pages-i18n

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | `/ai` renders + in sitemap but e2e expects retirement (308) | `app/[locale]/(site)/ai/page.tsx:87-140`; `sitemap.ts:30`; `tests/e2e/control-center-and-seo.spec.ts:82-83,107-115` | See Top Priority #4 — decide keep vs retire and align page+sitemap+tests+`next.config.ts` |
| low | Contact social-card subtitles English-only in both locales | `components/site/contact-hub-page.tsx:70-99` (render `:216`) | Move the 3 detail captions into `copy.en/copy.ar`; look up per-locale by id like `t.socials` (`:204`) |
| low | Empty leftover route dir `apps/moplayerpro/` | `app/[locale]/(site)/apps/moplayerpro/` | Delete the empty dir; `next.config.ts:13` already redirects the alias |
| info | `/ai` uses "smart assistant" wording + `/ai` slug (intent check) | `app/[locale]/(site)/ai/page.tsx:17-18,33-35` | Resolve via #4; consider neutral slug. Widget already neutral (`site-assistant-widget.tsx:18-43`) |
| info | Legal pages (terms/app-disclaimer/download-disclaimer) 404 until admin publishes | `lib/legal-route.tsx:43-53`; `lib/legal-pages.ts:65-67` | By design; confirm with owner that `legal_pages` is published in prod. Impressum ships a Berlin default |
| info | Unused `/blog` & `/insights` SEO content (no route/link) | `data/rebuild-content.ts:435-442` | Remove `nav.blog`/`seo.blog` to match the real route set, or add the route |
| info | Footer "apps" → `/apps`, navbar "apps" → `/apps/moplayer` | `app/[locale]/(site)/layout.tsx:32,53`; `content/site.ts` | Pick one canonical "Apps" destination for both header and footer |

### nav-footer-cta-links

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | Footer "Assistant" exposes `/ai` route + "smart assistant" wording | `components/layout/site-footer.tsx:32` | See #4 — neutral label/slug or soften `/ai` copy; align with the neutral widget |
| low | Contact social cards: hardcoded English sub-labels in AR UI | `components/site/contact-hub-page.tsx:76` (render `:216`) | Localize `detail` into the copy object (e.g. "قناة المحتوى", "محادثة مباشرة سريعة", "الملف المهني") |
| info | Unused `links` arrays in `siteCopy()` (nav comes from `getNavigation`) | `app/[locale]/(site)/layout.tsx:29` | Delete the dead `links` arrays; single source of truth in `content/site.ts` |
| info | Top-nav primary item labelled "MoPlayer" → MoPlayer hub, not `/apps` | `content/site.ts:26` | Confirm flagship intent; optionally surface `/apps` overview in nav |
| info | Footer Channels lists 4 of 6 configured socials (IG/TG/FB omitted) | `components/layout/site-footer.tsx:91` | Confirm active channels; add IG (already in `sameAs`) or remove unused entries from `site-data.ts` |
| info | Verified: language switcher preserves path+query/hash; all chrome buttons have handlers | `components/layout/locale-preference-link.tsx:22` | No action |

### moplayer-products-downloads

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | Hub Pro/Classic downloader codes diverge from CMS-driven Pro landing code | `components/app/moplayer-product-hub.tsx:51` | See #6 — pass `runtimeConfig.downloaderCode` into the hub card; fall back to 4608937 only when empty |
| medium | Stale version fallbacks: Classic 2.2.16 (shipped 2.3.0), Pro 2.5.22 vs 2.5.24 | `lib/app-ecosystem.ts:196`; `api/app/config/route.ts:14,24,38,74` | Update fallbacks to Classic 2.3.0 / Pro 2.5.24, align the two Pro values, or drive from one shared constant |
| low | AR hub copy omits `ios` product entry (patched by side function) | `components/app/moplayer-product-hub.tsx:121` (`iosProductCopy` `:207-219`) | Move AR iOS strings into `copy.ar.products.ios`; delete the special-case branch |
| low | Two competing Pro presentations + stale "MoPlayer القديم" label | `components/app/moplayer2-landing.tsx:139,188` | Align comparison labels to "MoPlayer Classic" in ar/en; extract shared product names to one constant |
| low | Hub iOS download button links to App Store placeholder anchor | `components/app/moplayer-product-hub.tsx:284` (render `:448-452`) | Use the iOS secondaryCta label / hide secondary button while `coming_soon`; restrict CMS `ios.storeUrl` to anchor or real Apple URL |
| info | PC download button hidden (not disabled) with no hub explanation when no Windows file | `components/app/moplayer-product-hub.tsx:241` | Render a disabled "Under maintenance / قيد الصيانة" state on the hub PC card, mirroring `moplayer-pc-landing.tsx:226-232` |
| info | Pro/Classic landings force hardcoded AR strings → AR never reflects admin edits | `components/app/moplayer2-landing.tsx:213`; `moplayer-landing.tsx:54-55` | Source AR copy from CMS too, falling back to bundled AR only when empty (match EN behavior) |

### activation-flow

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | `confirm` re-activates an already-activated code, never returns "already used" | `api/app/activation/confirm/route.ts:50` | Short-circuit when `status==='activated'` and requester isn't owner; add `already_activated`/conflict status + client copy |
| medium | Client has no 429/rate-limit state (shown as generic "connection issue") | `components/app/moplayer-activation-page.tsx:259` | Add a `rateLimited` branch keyed off `response.status===429` reading `retryAfterSeconds`, bilingual copy |
| medium | "Wrong product" mismatch reported as generic "invalid/not found" | `api/app/activation/status/route.ts:71` (also `confirm:32`) | Secondary lookup ignoring product → distinct `wrong_product` status telling user to open the right product's page |
| medium | Server-side Xtream/M3U test fetch enables SSRF probing of internal hosts | `lib/provider-source-security.ts:326` (`normalizeHttpUrl` `:76-97`) | Resolve+reject RFC1918/loopback/link-local/ULA + metadata IP; `redirect:'manual'`; gate behind rate limit + activated-device check |
| low | Valid credentials >240 chars silently truncated | `lib/provider-source-security.ts:124` | Raise cap (e.g. 512) or reject with explicit "credential too long" instead of silent truncation |
| low | Xtream-in-M3U detection only matches literal `get.php` | `lib/provider-source-security.ts:255` | Treat any M3U URL carrying both username+password params as candidate Xtream; try `player_api.php` first |
| low | M3U test errors are concatenated AR/EN; Xtream errors English-only | `lib/provider-source-security.ts:421` (Xtream `:341-359`) | Return a machine-readable `code` per failure; client maps code → localized message |
| low | `create` can 500 on concurrent collision without retry hint | `api/app/activation/create/route.ts:96` | Confirm UNIQUE constraint on `device_code`; return 503/retryable on exhaustion; add collision-vs-DB-error logging |
| info | Good: encrypted source, single-fetch receipt, safeMessage redaction | `api/app/activation/source/route.ts:118` | No action; retain when fixing rate-limit/key-fallback |
| info | Verified: ar/en activation pages + PC/Pro/Classic slug plumbing consistent | `app/[locale]/(site)/activate/page.tsx:100` | Optional: pass `platform` through for telemetry |

### admin-panel-binding

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | Download counts read-only in admin (no edit/reset/seed) | `apps/admin/src/lib/app-ecosystem.ts:56` | Add `saveDownloadCountAction` (admin-role) upserting `app_download_counts` per slug+platform; number input on dashboard/app-control |
| medium | In-site assistant settings (enabled/provider/model) display-only | `apps/admin/src/lib/ai-ops.ts:157` (render `ai-operations.tsx:218-219`) | Add admin-role action upserting `ai_assistant_settings (id='default')` + form on `/ai`; web reads the same row |
| medium | Legacy env-password admin login remains as fallback | `apps/admin/src/lib/admin-auth.ts:53`; `apps/admin/src/lib/auth.ts:114` | Gate behind `ALLOW_LEGACY_ADMIN_LOGIN` (default off in prod); require `ADMIN_SESSION_SECRET`; migrate to Supabase + `app_admin_roles` |
| low | Allowlisted email auto-promotes to `admin` on first sign-in | `apps/admin/src/lib/admin-auth.ts:42` | Tighten `ADMIN_ALLOWLIST`; consider auto-promote to `editor` or require manual grant |
| low | `saveRuntimeConfigAction` reads iOS fields for both products, persists only for moplayer2 | `apps/admin/src/app/actions.ts:554` (reads `:492-497`) | Hide iOS inputs on the classic form, or note they live under MoPlayer Pro / the `/moplayer/ios` page |
| low | Media deletion usage-scan misses `app_settings` runtime-config image refs | `apps/admin/src/lib/website-cms.ts:331` | Add `app_settings` to `findWebsiteMediaUsage` so runtime logo/bg/iOS-hero refs block deletion |
| info | Admin nav uses visible "AI" labels (acceptable — behind auth + noindex) | `apps/admin/src/components/admin/admin-shell.tsx:21` | No action for the visitor rule; optionally rename for consistency |
| info | Public app config hardcodes codes/versions as fallback only — admin override binds | `apps/web/src/app/api/app/config/route.ts:15` | Keep fallbacks in sync or reduce to safe placeholders |
| info | Verified: admin↔site CMS binding end-to-end across all sections | `apps/admin/src/lib/website-cms.ts:140` | No action (only gaps are the two flagged above) |
| info | Legal publish gated on responsibleName + address + email | `apps/admin/src/app/actions.ts:936` | Owner action: fill Impressum fields in admin then toggle Published |

### supabase-security

| Sev | Title | File | Fix |
|---|---|---|---|
| low | Provider-source encryption key falls back to service-role key | `apps/web/src/lib/provider-source-security.ts:65` | See #2 — set dedicated `MOPLAYER_PROVIDER_ENCRYPTION_KEY` in prod; fail closed |
| low | Plaintext provider API-key columns in `ai_assistant_settings` (dormant) | `supabase/migrations/20260523133032_ai_assistant_settings.sql:5` | Drop if unused, or store encrypted-at-rest (reuse AES-256-GCM pattern) if planned |
| low | Long-lived (14-day) signed attachment URL embedded in owner email | `apps/web/src/app/api/contact/route.ts:111` | Reduce TTL (24–72h) or link to an admin-authenticated download endpoint; check support route too |
| info | Verified: no service-role key reaches the browser | `apps/web/src/lib/supabase/client.ts:49` | No action; consider `import 'server-only'` guard |
| info | Verified: no real secrets committed (only `.env.example` placeholders) | `.gitignore:13` | No action; optional CI secret scanner |
| info | Verified: RLS admin-only reads, scoped public reads, no anon writes | `supabase/migrations/009_activation_and_app_control.sql:61` | No action; periodically dump live policies to confirm they match migrations |
| info | Verified: one private storage bucket; ephemeral encrypted provider handoff | `supabase/migrations/20260615100000_support_uploads_bucket.sql:1` | No action; confirm no extra buckets created outside migrations |

### seo-indexing

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | Admin `robots.ts` allows crawling + advertises main-site sitemap on admin subdomain | `apps/admin/src/app/robots.ts:5` | Make it a hard wall `{ disallow:'/' }`; remove host/sitemap pointing at public domain |
| low | Root `/privacy`, `/app/privacy`, `/support` redirect to `/en` not Arabic-primary `/ar` | `app/privacy/page.tsx:4`; `app/app/privacy/page.tsx:4`; `app/support/page.tsx:9` | Redirect to `defaultLocale` (ar) for consistency with `/` and `/app` |
| low | `/ai` thin landing page indexed in sitemap | `app/[locale]/(site)/ai/page.tsx:67`; `sitemap.ts:30` | See #4 — enrich + index, or `robots:{index:false}` + drop from sitemap |
| info | Sitemap URL inventory & indexability count | `sitemap.ts:51` | After fixing activation pages, static localized drops to 17×2=34 |
| info | `robots.ts` disallow list references non-existent `/downloads/`, `/draft/` | `app/robots.ts:8` | Optional cleanup of stale entries |
| info | Verified: legal-pages indexing correctly gated (sitemap/metadata/render agree) | `lib/legal-route.tsx:31` | No action |
| info | Verified: no route collisions; `[productSlug]` scoped to moplayer2 only | `app/[locale]/(site)/apps/[productSlug]/page.tsx:37` | No action |
| info | Google Search Console verification depends on possibly-unset env var | `app/layout.tsx:65` | Confirm `GOOGLE_SITE_VERIFICATION` set in Vercel prod (or DNS-verified) |

*(High items `/activate` and `/moplayer/setup` indexable → see Top Priority #5.)*

### forms-email

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | `support-uploads` bucket rejects `application/pdf` but contact form advertises/accepts PDF | `supabase/migrations/20260615100000_support_uploads_bucket.sql:7`; `components/site/liquid-contact-form.tsx:329`; `api/contact/route.ts:32` | Add `application/pdf` to `allowed_mime_types` (and apply to live bucket), or remove PDF from the form/copy/allow-list |
| medium | Contact route can persist-without-delivering, never alerts owner | `api/contact/route.ts:251,265` | When `stored=true && delivered=false`, `sendAutomationAlert()`/queue retry; log delivery failure |
| low | Customer auto-receipt failure computed but never logged/alerted | `api/contact/route.ts:255`; `api/app/support/route.ts:174-195` | Log warning / `sendAutomationAlert` when transactional send returns false |
| low | Raw Supabase storage error strings embedded in owner email + stored record | `api/contact/route.ts:109` (also support `:84,100,119`) | Map upload errors to a short generic code before email/storage; log raw server-side only |
| low | Rate limiting best-effort; disabled when Supabase public env absent | `lib/request-guard.ts:34` | Flag missing backend as misconfig (or in-memory/KV fallback); use atomic counter to avoid race |
| info | Contact AR locale missing `preferredTime` label/placeholder/validation | `components/site/liquid-contact-form.tsx:243` | Add the 3 keys to the AR copy block |
| info | Generic "review the form" error doesn't point to field on support form | `components/site/support-request-form.tsx:32` | Return localized field-level errors (like contact) or validate client-side; avoid raw zod defaults |
| info | Attachment validation relies on client-declared MIME only (no sniffing) | `api/contact/route.ts:99`; `api/app/support/route.ts:71` | Optional magic-byte validation; current allow-list + private bucket + signed URLs make this low priority |

*(High item: support form silent total failure → see Top Priority #7.)*

### ai-chatbot

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | Visitor copy leans on "smart/ذكي" + public `/ai` slug | `app/[locale]/(site)/ai/page.tsx:15` | See #4 — align with neutral widget naming; consider `/assistant` slug + redirect |
| medium | Anthropic provider coded but undocumented + half-exposed in health checks | `lib/ai-assistant.ts:315`; `.env.example:70-75`; `api/app/diagnostics/route.ts:47` | Decide kept/removed; if kept, document `ANTHROPIC_*` and include in diagnostics flag; if not, remove from chain + health routes |
| medium | No OpenAI-compatible custom backup provider (owner requested) | `lib/ai-assistant.ts:246,256` | Add generic provider reading `CUSTOM_AI_BASE_URL/_API_KEY/_MODEL` calling `/v1/chat/completions`; document vars |
| low | Default provider mismatch: `.env.example` gemini vs code openai-first | `lib/ai-assistant.ts:349,357`; `.env.example:71` | Pick one canonical default; align code default order, `.env.example`, and health-route heuristic |
| low | Provider failures silently swallowed (no logging/telemetry) | `lib/ai-assistant.ts:359-366` | Log provider name + HTTP status (never the key/headers) on non-OK/exception; surface `ai_messages` metadata in admin |
| info | Verified: no hardcoded keys; env-only; no secret logging | `lib/ai-assistant.ts:247` | No action; keep pattern for the new custom provider |
| info | Verified: validation + rate-limiting on both assistant endpoints | `api/ai/site-assistant/route.ts:10` | Acceptable; optional in-memory fallback limiter for no-Supabase path |

### dead-code-cruft

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | Empty stray top-level dirs `backend/`, `storage/`, `database/` | `backend/`, `storage/`, `database/` | Delete; document real locations (`supabase/migrations`, Supabase Storage) in AGENTS.md |
| medium | Empty orphan route dir `(site)/apps/moplayerpro/` | `app/[locale]/(site)/apps/moplayerpro/` | Delete (produces no route, referenced nowhere) |
| low | Committed empty `apps/web/data/messages.json` (zero consumers) | `apps/web/data/messages.json` | Delete the file and the empty `apps/web/data/` dir |
| low | Unreachable else-branch (`MoPlayerLanding`) in `[productSlug]` route | `app/[locale]/(site)/apps/[productSlug]/page.tsx:300` | Simplify to always render `MoPlayer2Landing` (or comment that the fallback needs a 3rd managed app); confirm no plan to add slugs |
| low | Partially-dead exports in admin legacy `auth.ts` | `apps/admin/src/lib/auth.ts` | Remove 5 unused exports if legacy fallback obsolete; keep the 4 still used until the path is retired |
| low | Competing status docs (root `PROJECT_STATUS.md` vs `docs/CURRENT_PROJECT_STATE.md`) | `PROJECT_STATUS.md` | Keep `docs/CURRENT_PROJECT_STATE.md` (tracked); delete/fold the untracked root one |
| low | Redundant `apps/.gitignore` duplicates root `.vercel` ignores | `apps/.gitignore` | Delete (root `.gitignore` already covers `.vercel` everywhere) |
| low | Misleading version-suffixed filenames (no surviving predecessor) | `components/site/digital-os-vnext.tsx`, `components/site/site-pages-v3.tsx` | Rename to `digital-os.tsx` / `site-pages.tsx` (update ~5 import sites) as a deliberate refactor |
| info | Local QA leftovers (gitignored, local-only) | `tmp-admin/`, `test-results/`, `artifacts/`, `home_live_active.png`, `desktop.ini` | Optional local cleanup; no repo impact |
| info | Cross-area note: `/ai` route + "المساعد الذكي" framing | `app/[locale]/(site)/ai/page.tsx:1` | Defer to #4 |

*(High item: 613MB `.rar` → see Top Priority #8. The nested `apps/apps/moplayer-pro-windows` dir is out of scope — see below.)*

### perf-mobile-rtl

| Sev | Title | File | Fix |
|---|---|---|---|
| medium | CMS/Supabase images forced `unoptimized` despite host in `remotePatterns` | `components/site/apps-showcase-page.tsx:306,310,346`; `digital-os-vnext.tsx:468,578`; `legal-page.tsx:28` | Remove `unoptimized={src.startsWith("http")}` for whitelisted hosts so they get AVIF/WebP + resize |
| medium | Decorative full-bleed `<Image fill>` hero bgs missing `sizes` (serve 1920px to phones) | `moplayer2-landing.tsx:252`; `moplayer-landing.tsx:92`; `moplayer-pc-landing.tsx:201` | Add `sizes="100vw"`; do not add `priority` to faint decorative bgs |
| medium | Mobile bottom dock: 7 cols, ~7.7px labels, sub-44px tap targets | `app/globals.css:4094,4117`; `content/site.ts:22-39` | Reduce to 4–5 destinations on phones (or icon-only + accessible labels); raise min label ≥10px; cells ≥44px |
| medium | framer-motion ignores OS reduce-motion (no `useReducedMotion`/`MotionConfig`) | `moplayer2-landing.tsx:271`; `moplayer-landing.tsx`; `work-digital-exhibition.tsx` | Wrap client trees in `<MotionConfig reducedMotion="user">` or branch on `useReducedMotion()` |
| low | Arabic & Latin fonts both `preload:false` → FOUT on primary Arabic text | `lib/fonts.ts:8,16` | `preload:true` for `arabicFont` (primary language); keep Latin `false` |
| low | `TimezoneWidget` live clock during SSR → minute-boundary hydration mismatch | `components/site/contact-hub-page.tsx:111,121-122` | Init `now=null`, set in `useEffect` (or `suppressHydrationWarning` on time nodes) |
| low | `.light` theme tokens defined but never activated (dead CSS / no light mode) | `app/globals.css:2101-2121`; `app/layout.tsx:72` | Wire a theme toggle, or remove `.light` block + set a single dark `themeColor` |
| low | Navbar brand logo (above-the-fold) loaded without `priority` | `components/layout/site-navbar.tsx:69` | Add `priority`/`loading="eager"` to the navbar brand `<Image>`; drawer logo stays lazy |
| info | Verified: scroll-reveal + homepage server-component architecture done right | `app/globals.css:5141` | No action; preserve patterns when refactoring |

*(High items: Arabic font weights → #9; hero LCP gating → #10.)*

---

## Out of scope / native apps

These items were marked `in_scope=false` (native-app or accidental-nesting artifacts) but are recorded so they are not lost:

| Sev | Title | File | Note / Fix |
|---|---|---|---|
| medium | Nested duplicate dir `apps/apps/moplayer-pro-windows` (empty, untracked) | `apps/apps/moplayer-pro-windows` | Accidental mis-rooted copy; the real app is `apps/moplayer-pro-windows/`. Delete `apps/apps/` entirely (empty, not tracked). `.gitignore` even has a defensive `apps/web/apps/` entry, suggesting this recurs |
| info | Cross-area: `/ai` route + "المساعد الذكي" framing (dead-code pass deferral) | `app/[locale]/(site)/ai/page.tsx:1` | Deferred from the dead-code workstream to the AI-branding decision — handled in Top Priority #4 |

---

## Quick wins (low-effort, high-value)

1. **Delete the 613MB `.rar`** and add `*.rar` to `.gitignore`/`.vercelignore` (Top Priority #8) — removes a real commit/deploy footgun in minutes.
2. **Set `MOPLAYER_PROVIDER_ENCRYPTION_KEY` in Vercel prod** (Top Priority #2) — restores real defense-in-depth for stored credentials; the code-side fail-closed change is small.
3. **Add `robots:{index:false}` to `/activate` and `/moplayer/setup`** and drop them from `sitemap.ts` (Top Priority #5) — stops code-bearing URLs being indexed.
4. **Update stale version fallbacks** to Classic 2.3.0 / Pro 2.5.24 and align the two Pro values (`lib/app-ecosystem.ts:196`, `api/app/config/route.ts`).
5. **Remove `unoptimized={src.startsWith("http")}`** on whitelisted Supabase image hosts (`apps-showcase-page.tsx`, `digital-os-vnext.tsx`, `legal-page.tsx`) — biggest image-bandwidth win, one-line edits.
6. **Add `sizes="100vw"`** to the decorative full-bleed `<Image fill>` hero backgrounds.
7. **Add weight 700 to `arabicFont`** (`lib/fonts.ts:11`) — eliminates faux-bold across all Arabic headings.
8. **Delete the empty dirs** `backend/`, `storage/`, `database/`, `(site)/apps/moplayerpro/`, `apps/apps/`, redundant `apps/.gitignore`, and `apps/web/data/messages.json` — structure-confusion cleanup with zero functional risk.
9. **Localize the contact social-card subtitles** into the copy object (`contact-hub-page.tsx:76`) — closes the one remaining visible ar/en parity gap.
10. **Make the admin `robots.ts` a hard wall** (`disallow:'/'`, drop the public-domain sitemap/host) (`apps/admin/src/app/robots.ts:5`).
11. **Fix the Arabic root redirects** (`/privacy`, `/app/privacy`, `/support` → `/ar`) for consistency with the Arabic-first convention.
12. **Document `ANTHROPIC_*` in `.env.example`** (or remove the dead provider) and align the default-provider story across code/`.env.example`/health routes.
