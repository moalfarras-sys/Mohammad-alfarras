# moalfarras.space — Production Audit & Fixes (2026-06-18)

Real production audit (live `curl` against `https://moalfarras.space` + code review on
`origin/main`). This branch's tip equals `origin/main`, so the audited code **is** production.

## Reality check (what was already correct in production)

| Area | Live result |
| --- | --- |
| Classic APK | `…?product=moplayer` → `200`, 52 MB real file |
| Pro APK | `…?product=moplayer2` → `200`, 49 MB real file |
| PC Setup | `…?product=moplayer2&platform=windows` → GitHub release, 115 MB, `200` |
| PC Portable | `…&portable=1` → GitHub release, `200` |
| `www` → non-`www` | `308`, **preserves path + locale** (`www/en/apps/moplayer-pc` → `moalfarras.space/en/apps/moplayer-pc`) |
| Canonical / hreflang / OG / Twitter | Present on pages |
| `robots.txt` | `200`, contains `Sitemap:` |

So most download/canonical/SEO items were **not broken** — the user's strongest pain point
(`/ai` redirecting to home) was the real bug.

## Fixes applied

### 1. Impressum (§5 DDG) — `#1`
- Impressum now **always renders** (previously 404'd until a CMS publish flag) and is
  **always linked in the footer next to Privacy** on every page.
- Pre-filled: operator name (`Mohammad Alfarras / محمد الفراس`), country (Germany /
  Deutschland), official email. Indexable + in `sitemap.xml`.
- **Action required (owner):** the full **postal street address** is legally required and
  cannot be fabricated. Until provided, the page shows an honest *"provided on request"*
  line. Add it in Admin → Legal (`legal_pages.address`) or send it to finish compliance.

### 2. Canonical domain & language — `#2`
- `www` → non-`www` already preserved path + locale (verified live). No "www=English /
  non-www=Arabic" behavior reproduced.
- Fixed a real inconsistency: **`x-default` hreflang** pointed to `/en` on 9 subpages while
  the homepage/sitemap and the proxy default are `/ar`. Unified **all** `x-default` → `/ar`.

### 3. Mo Ai routes — `#3`  (was the real bug)
- `/ar/ai` and `/en/ai` returned **`307 → home`** (the page literally called `redirect()`).
- Replaced with a **real bilingual assistant landing page** (hero, capability cards, example
  questions, CTA). The CTA opens the existing site assistant via the global `mo-ai:open`
  event. No redirect. Mobile-first, cinematic, no horizontal overflow at 375 px.
- Made indexable: removed from `robots.ts` disallow, added to `sitemap.xml`, added
  canonical + hreflang + OG.

### 4. MoPlayer downloads — `#4`
- All four buttons verified working in production (see table).
- The PC build is namespaced as `moplayer2 + platform=windows`. Made the consistent slug
  `product=moplayer-pc` resolve correctly even without `platform=windows` (it used to fall
  through to the Android Pro APK). PC page links now use the clear `product=moplayer-pc`.
- Structured-data "MoPlayer PC" item now points to the PC landing page, not a download redirect.

### 5. YouTube numbers — `#5`
- Single source of truth: `youtubeChannel.fallback` (views `1.5M+`, subscribers `6.2K+`,
  videos `161`).
- Removed stale hardcodes (`6.1K`, `162`) in `rebuild-content.ts` and `default-content.ts`;
  they now derive from the single source.
- **Note:** surfaces driven by the live CMS/Supabase content blocks may still hold old
  numbers seeded earlier — re-seed or update those blocks in Admin to fully propagate.

### 6. Technical SEO — `#6`
- `sitemap.xml`: added `/ai` (ar/en) and made `/impressum` always present, all with
  ar/en/x-default alternates.
- `robots.txt`: removed the `/ai` block; still references the sitemap.
- `x-default` unified to `ar` site-wide (see #2).

### 7. Contact & support forms — `#7`
- Code path audited end-to-end: Zod validation, **8 MB** screenshot cap + image-type check,
  Supabase storage upload + signed URL, `saveSupportRequest` insert, owner email + user
  confirmation email, honeypot spam field, friendly success/error states.
- **Added IP-based rate limiting** (`rateLimit`, 6 req / 10 min) to `/api/app/support` and
  `/api/contact` — they previously had only the honeypot.
- Live email delivery + DB writes depend on production env (SMTP/Resend + Supabase) and were
  not exercised from this environment.

### 8. Support page email/WhatsApp — `#8`
- The direct-channel list now uses labelled rows (icon + label + value). The long email can
  no longer collide with the WhatsApp pill (value truncates with ellipsis; rows verified
  vertically separated). Added `aria-label`s (email address, "opens in new tab" for WhatsApp).
- The support **form** already had solid a11y (`<label>`-wrapped fields, `aria-live` status).

### 9. Downloader codes — `#9`
- The TV section showed one code (`7876083`) while the app config had two others
  (`2418397`, `4608937`) — confusing. Restructured into **two clearly-labelled codes**:
  **Gateway** (all apps → chooser) and **MoPlayer Pro direct**, each with a one-line hint.
- **Action required (owner):** confirm the exact registered Downloader codes. Current values
  live in one constant `DOWNLOADER_CODES` (gateway `7876083`, pro `4608937`) — tell me if
  either differs and I'll update the single source.

### 10. Contradictory readiness copy — `#10`
- LG/Samsung TV cards said "ready / store-ready / جاهز" but carried an "In Dev" badge.
  Copy now reads **"planned / قيد التطوير"**, matching the badge.

## Verification
- `tsc --noEmit` ✅ · `eslint .` ✅ · `next build` ✅ (full route manifest, no errors).
- Dev-server checks: `/ar/ai` + `/en/ai` render real pages (no redirect); CTA opens the
  assistant; footer shows Impressum + Privacy; `/ar/impressum` renders (name/Germany/email +
  honest address line); support channels labelled & separated; `robots.txt` and `sitemap.xml`
  reflect the new routes.

## Open items needing owner input
1. **Impressum postal address** (legal requirement).
2. **Downloader code numbers** — confirm gateway + Pro-direct values.
3. **Live CMS YouTube blocks** — re-seed/update in Admin so old `6.1K/162` strings are replaced.
