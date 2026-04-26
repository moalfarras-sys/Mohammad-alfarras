# Moalfarras — monorepo

Personal & professional ecosystem for **Mohammad Alfarras**
([moalfarras.space](https://moalfarras.space)), the unified admin
([admin.moalfarras.space](https://admin.moalfarras.space)), and the **MoPlayer**
Android / Android TV app.

The site is, by design, **about me first** — CV, work, content, products.
**MoPlayer** is a flagship product inside the ecosystem, with its own dedicated
page at `/{locale}/apps/moplayer` (and a canonical `/app` shortcut that 308s to
it). The product page lives inside the same `SiteNavbar` + `SiteFooter` shell so
the brand stays coherent; only the *content* switches to the "Apple-cinematic"
dark-forever section via a scoped `.cinematic-section` class.

---

## Layout

```text
Moalfarrasappseit/
├── apps/
│   ├── web/             # moalfarras.space (Next.js 16, public + /admin redirect)
│   └── admin/           # admin.moalfarras.space (Next.js 16 — unified admin)
├── android/
│   └── moplayer/        # Android Studio project (com.mo.moplayer, v2.0.0)
├── packages/
│   └── shared/          # Shared TS helpers consumed by both Next apps
├── supabase/
│   └── migrations/      # Versioned SQL for the Supabase schema
└── scripts/
    ├── hash-admin-password.mjs        # scrypt hash generator
    └── publish-android-release.mjs    # APK → Supabase storage + app_releases
```

## Workspaces

| Package                    | Path               | Purpose                              |
| -------------------------- | ------------------ | ------------------------------------ |
| `moalfarrasweb`            | `apps/web`         | Public website + `/admin` redirect   |
| `moalfarras-control-center`| `apps/admin`       | Unified admin (MoPlayer + links to Website CMS) |
| `@moalfarras/shared`       | `packages/shared`  | Cross-app TypeScript helpers         |
| `MoPlayerapp` (Android)    | `android/moplayer` | Native Android client                |

---

## Public routes (`apps/web`)

```text
GET /                           → 308 /{defaultLocale}
GET /{ar|en}                    Home (Creator-Minimal)
GET /{ar|en}/cv                 CV + timeline + principles + stack
GET /{ar|en}/about              → 308 /{locale}/cv
GET /{ar|en}/work               Work list
GET /{ar|en}/work/[slug]        Case study detail
GET /{ar|en}/apps               Apps listing (MoPlayer as lead)
GET /{ar|en}/apps/moplayer      MoPlayer (Apple-cinematic, inside site shell)
GET /{ar|en}/youtube            YouTube / editorial
GET /{ar|en}/contact            Contact (form + availability + channels)
GET /{ar|en}/privacy            Localized privacy summary
GET /{ar|en}/admin              Legacy Website CMS (locale-prefixed)
GET /app                        308 → /{defaultLocale}/apps/moplayer
GET /privacy                    Canonical privacy
GET /support                    MoPlayer support entry
GET /admin                      308 → https://admin.moalfarras.space
GET /opengraph-image            1200×630 PNG (ImageResponse, edge)
GET /sitemap.xml                Smart sitemap with hreflang
GET /robots.txt                 Allow public, disallow /admin + /api/*
GET /api/cv-pdf?locale=…        On-demand CV PDF
GET /api/app/releases/latest    Latest MoPlayer release JSON
GET /api/app/releases/[slug]/download  APK download proxy
GET /api/app/support            MoPlayer support webhook
GET /api/contact                Contact form intake
```

`apps/web/src/proxy.ts` (Next.js 16 proxy convention) handles:

- locale prefixing (`/cv` → `/en/cv`)
- passing the resolved locale via `x-site-locale` header
- letting `/admin`, `/app`, `/privacy`, `/support` bypass locale logic

---

## Visual system — Creator-Hybrid

- **Creator-Minimal** (personal pages) — warm ivory/ink in light,
  cinematic midnight in dark. Single electric-cyan accent. Thin 1px borders.
  Serif display (`Fraunces`) for Latin, `Tajawal` for Arabic headlines.
  Body: `Inter` (Latin) / `Noto Kufi Arabic` (Arabic). No aurora, no glass.
- **Apple-Cinematic** (`.cinematic-section` on `/{locale}/apps/moplayer`) —
  black canvas, huge typography, full-bleed product hero, scroll-driven bento.
  The section wrapper forces product-dark regardless of user theme, but the
  surrounding `SiteNavbar` + `SiteFooter` keep tokenized colors.

Tokens live in [`apps/web/src/app/globals.css`](apps/web/src/app/globals.css):

| Token              | Light              | Dark                |
| ------------------ | ------------------ | ------------------- |
| `--background`     | `#fafaf7` ivory    | `#0a0a0b` ink       |
| `--foreground`     | `#0a0a0a`          | `#fafafa`           |
| `--surface`        | `#ffffff`          | `#111114`           |
| `--surface-soft`   | `#f4f4ef`          | `#15151a`           |
| `--accent`         | `#0099b3` cyan     | `#00e5ff` cyan      |
| `--border`         | `rgba(10,10,10,.09)` | `rgba(255,255,255,.09)` |

Plus radii (`--radius-xs/sm/md/lg/pill`), motion (`--motion-fast/base/slow`),
shadows (`--shadow-card/elevated/hero`). A single `.glass-card` class unifies
all legacy aliases (`bento-card`, `mesh-card`, `stats-glass-card`, `yt-video-card`).

## Mobile-first

- Breakpoints tested: 320 · 375 · 414 · 768 · 1024 · 1280+.
- Real **drawer** via
  [`components/layout/mobile-menu-drawer.tsx`](apps/web/src/components/layout/mobile-menu-drawer.tsx)
  — slides from the `-start` side (RTL-aware), locks scroll, closes on ESC or
  backdrop tap, holds all nav + language + theme toggles.
- Touch targets ≥ 44×44 via `.button-*` classes and explicit `min-h-11`.
- Safe-area respected: `.top-safe`, `.pb-dock`, `.safe-bottom-space`.
- Mobile dock (`lg:hidden`) sits above `env(safe-area-inset-bottom)`.
- Footer uses a mobile accordion; expanded on desktop.
- No hover-only interactions — all "reveal on hover" have a visible baseline.

---

## SEO & Google Search Console

- Per-page `generateMetadata` via
  [`apps/web/src/lib/seo.ts`](apps/web/src/lib/seo.ts): `title`, `description`,
  `canonical`, `alternates.languages` (AR/EN/x-default), OpenGraph, Twitter card.
- JSON-LD suite via [`apps/web/src/lib/seo-jsonld.ts`](apps/web/src/lib/seo-jsonld.ts):
  - Root layout → `Person` + `Organization` + `WebSite`.
  - Home → `ProfilePage` + expanded `Person` + `BreadcrumbList`.
  - CV → expanded `Person` + `WebPage` + `BreadcrumbList`.
  - Work index → `CollectionPage` + `BreadcrumbList`.
  - Work detail → `CreativeWork` + `BreadcrumbList`.
  - Apps index → `CollectionPage` + `BreadcrumbList`.
  - Apps/MoPlayer (and `/app`) → `SoftwareApplication` (with `Offer`, version,
    file size, download URL) + `FAQPage` + `BreadcrumbList`.
  - YouTube → `WebPage` + `VideoObject` (featured) + `BreadcrumbList`.
  - Contact → `ContactPage` + `BreadcrumbList`.
- Sitemap [`apps/web/src/app/sitemap.ts`](apps/web/src/app/sitemap.ts) emits
  each public route × locale with `hreflang` alternates and priority/changefreq.
- OpenGraph default: [`apps/web/src/app/opengraph-image.tsx`](apps/web/src/app/opengraph-image.tsx)
  (edge-rendered 1200×630 PNG via `next/og`).
- `robots.ts` disallows `/admin` and `/api/` completely.

### Connecting Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console).
2. Add property: `https://moalfarras.space`.
3. Choose **HTML meta tag** verification. Copy the `content="..."` token.
4. In Vercel, set the env var on the `mohammad-alfarras` project:
   ```env
   GOOGLE_SITE_VERIFICATION="<token>"
   ```
5. Redeploy. The token is injected in `<head>` via
   [`apps/web/src/app/layout.tsx`](apps/web/src/app/layout.tsx) `metadata.verification.google`.
6. After verification, submit `https://moalfarras.space/sitemap.xml` in Search Console.

---

## Admin

The public `/admin` is a **permanent redirect** to
[`admin.moalfarras.space`](https://admin.moalfarras.space). The admin subdomain
runs `apps/admin` (separate Vercel project) and currently manages MoPlayer
content (product, releases, screenshots, FAQs, support).

The **Website CMS** (pages, projects, CV content, PDFs, media, settings)
still lives under `/{locale}/admin/*` on the main site, gated by the same
Supabase auth. The admin subdomain shell exposes a top-level **"Website CMS"**
button that deep-links to `/{locale}/admin` so it feels like one hub.

### Admin auth

- `ADMIN_ALLOWLIST` — comma-separated allowed emails
- `ADMIN_PASSWORD_HASH` — scrypt hash (generate via
  `node scripts/hash-admin-password.mjs "<password>"`)
- `ADMIN_SESSION_SECRET` — HMAC signing key (48+ random hex bytes)

---

## Environment variables

Templates live at:

- [`apps/web/.env.example`](apps/web/.env.example)
- [`apps/admin/.env.example`](apps/admin/.env.example)

### Required on both web + admin Vercel projects

```env
ADMIN_ALLOWLIST="you@example.com"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD_HASH="scrypt$<salt>$<derived>"
ADMIN_SESSION_SECRET="<48+ random hex bytes>"

NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon>"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."

NEXT_PUBLIC_WEB_APP_URL="https://moalfarras.space"
NEXT_PUBLIC_ADMIN_APP_URL="https://admin.moalfarras.space"
```

### Additional on `mohammad-alfarras` (web only)

```env
# Server-only — DO NOT prefix with NEXT_PUBLIC
DATABASE_URL="postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres?sslmode=require"
SUPABASE_SERVICE_ROLE_KEY="<service-role>"

# Google Search Console verification (paste token after GSC verification)
GOOGLE_SITE_VERIFICATION=""

# Live data integrations (optional)
YOUTUBE_API_KEY=""
YOUTUBE_CHANNEL_ID="UCfQKyFnNaW026LVb5TGx87g"
WEATHER_API_KEY=""
```

### Additional on `moalfarras-admin`

```env
SUPABASE_SERVICE_ROLE_KEY="<service-role>"   # needed for write paths
```

---

## Local development

```bash
# One-time, from the repo root
npm install

# Web dev server (port 3000 by default)
npm run dev:web

# Admin dev server
npm run dev:admin
```

Checks:

```bash
npm run typecheck:web
npm run typecheck:admin
npm run lint:web
npm run lint:admin
npm run build        # builds both web + admin
```

---

## Deployment

Two Vercel projects, both pointing at this repo:

| Project name          | Root         | Domain                       |
| --------------------- | ------------ | ---------------------------- |
| `mohammad-alfarras`   | `apps/web`   | `moalfarras.space`           |
| `moalfarras-admin`    | `apps/admin` | `admin.moalfarras.space`     |

Per project:

- **Install command**: `npm install`
- **Build command**: `npm run build`
- **Framework**: Next.js (auto-detected, v16.2)
- **Node**: 24.x

After pushing new env vars you must **Redeploy** from the Vercel dashboard for
them to take effect.

---

## Supabase

Project ref `ckefrnalgnbuaxsuufyx`. Migrations live in `supabase/migrations/`.

Local Supabase CLI is initialized in `supabase/config.toml` with the same
project ref. To apply migrations to the hosted project, use one of:

```bash
supabase login
supabase link --project-ref ckefrnalgnbuaxsuufyx
supabase db push
```

or run migrations with a valid `DIRECT_URL`. API keys alone can read/write
existing tables, but they cannot create missing tables; schema changes require
CLI access or the database password.

Important tables:

- `app_admin_roles` — admin/editor gate (Supabase-auth path).
- `app_products`, `app_releases`, `app_release_assets`, `app_screenshots`,
  `app_faqs`, `app_support_requests` — MoPlayer ecosystem (slug: `moplayer`).
- `work_projects` + `work_project_translations` + `work_project_media` +
  `work_project_metrics` — Work/Projects surface.
- `experiences`, `certifications` — CV data.
- `service_offerings` + `service_offering_translations` — Home services block
  (read by `PortfolioHomePage` when present, otherwise falls back to hardcoded
  copy in `portfolio-pages.tsx`).
- `navigation_items` + `navigation_translations` — nav editor-driven labels,
  consumed by `(site)/layout.tsx` via `readNav(locale)`.
- `contact_messages` — contact form submissions.
- `media_assets` — asset library.
- `site_settings` — key/value JSON bag (brand portrait, YouTube summary, etc.).

---

## Android — MoPlayer release flow

```text
android/moplayer/        # open this folder in Android Studio
└── app/                 # com.mo.moplayer, v2.0.0, minSdk 24, targetSdk 35
```

Build APKs:

```bash
cd android/moplayer
./gradlew.bat --version
./gradlew.bat clean
./gradlew.bat test
./gradlew.bat lint
./gradlew.bat testSideloadDebugUnitTest
./gradlew.bat assembleSideloadDebug
./gradlew.bat assembleSideloadRelease
```

Windows note: `JAVA_HOME` may point at a valid JDK path, but the local
`gradlew.bat` still needs to validate `%JAVA_HOME%\bin\java.exe` directly.
This repo's wrapper is patched for that Windows batch behavior. The verified
local JDK during repair was Temurin/OpenJDK 21.0.10.

Required Android SDK components:

```text
platforms;android-35       # must include platforms/android-35/android.jar
build-tools;35.0.0
platform-tools
emulator
cmdline-tools;latest
```

Output:

```text
android/moplayer/build-output/app/outputs/apk/sideload/debug/
android/moplayer/build-output/app/outputs/apk/sideload/release/
```

Refresh the website download artifacts locally (build APKs, copy into
`apps/web/public/downloads/moplayer`, print file sizes and SHA-256):

```bash
npm run release:moplayer
```

The current public fallback release also mirrors the APKs to the Supabase
Storage bucket `app-releases` under `moplayer/2.0.0/`. The local `/downloads`
files stay available as a static fallback, while the release API can point at
the Supabase public object URLs.

Publish a new version (upload APK → Supabase storage → `app_releases` row):

```bash
node scripts/publish-android-release.mjs \
  --version 2.0.1 \
  --versionCode 3 \
  --apk android/moplayer/build-output/app/outputs/apk/sideload/release/moplayer-release.apk \
  --notes "Bug fixes + faster startup"
```

If the hosted Supabase schema has not been migrated yet, you can still upload
the APK to Storage only:

```bash
node scripts/publish-android-release.mjs \
  --version 2.0.1 \
  --versionCode 3 \
  --apk android/moplayer/build-output/app/outputs/apk/sideload/release/app-sideload-arm64-v8a-release.apk \
  --uploadOnly
```

After the script finishes:

- `/api/app/releases/latest` serves the new JSON.
- `/{locale}/apps/moplayer` and `/app` show the new version.
- Android clients using the API pick it up automatically.

The script needs `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
exported in the shell.

---

## Security notes

- **Never commit** `.env.local`, `.next/`, `.vercel/`, `local.properties`,
  `keystore.properties`, `*.keystore`, or build output.
- `ADMIN_PASSWORD` (plain text) is supported only as a legacy fallback. Always
  prefer `ADMIN_PASSWORD_HASH` in production.
- The Supabase **service role key** must only be set on the admin project and
  on server-only API routes — never in a `NEXT_PUBLIC_*` variable.
- `robots.ts` disallows `/admin` and `/api/` for all crawlers.

---

## Useful scripts

```bash
# Generate a fresh scrypt admin password hash
node scripts/hash-admin-password.mjs "newPassword!2026"

# Publish an Android release
node scripts/publish-android-release.mjs --version <v> --versionCode <n> --apk <path>

# Bootstrap an admin role in Supabase
npm --prefix apps/web run bootstrap:admin

# Re-runnable initial Supabase setup
npm --prefix apps/web run setup:supabase
```
