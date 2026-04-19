# Moalfarras Workspace

Monorepo for the personal website of **Mohammad Alfarras** ([moalfarras.space](https://moalfarras.space)),
the unified private admin (`admin.moalfarras.space`), and the **MoPlayer** Android / Android TV app.

The site is, by design, **about me first** — projects, CV, work, content. **MoPlayer**
is one major product inside that ecosystem (with its own dedicated product page and Android build),
not the identity of the whole site.

---

## 1. Repository layout

```text
Moalfarrasappseit/
├── apps/
│   ├── web/           # moalfarras.space (Next.js 16, public site + /admin entry)
│   └── admin/         # admin.moalfarras.space (Next.js 16, dedicated admin UI)
├── android/
│   └── moplayer/      # MoPlayer Android Studio project (project name: MoPlayerapp)
├── packages/
│   └── shared/        # Cross-app shared TypeScript helpers
├── supabase/
│   └── migrations/    # Versioned SQL for the Supabase project
└── scripts/
    └── hash-admin-password.mjs   # scrypt hash generator for ADMIN_PASSWORD_HASH
```

| Workspace package           | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `moalfarrasweb`             | Public website (apps/web)                        |
| `moalfarras-control-center` | Standalone admin shell (apps/admin)              |
| `@moalfarras/shared`        | Shared TS modules used by both Next apps         |
| `MoPlayerapp` (Android)     | Native Android client (`com.mo.moplayer`)        |

---

## 2. Public routes (apps/web)

```text
GET /                           → 308 redirect to /{defaultLocale} (en)
GET /{ar|en}                    Home (about me, work, MoPlayer featured, content, contact)
GET /{ar|en}/cv                 CV / résumé (downloadable PDF: branded + ATS variants)
GET /{ar|en}/about              → 308 redirect to /{locale}/cv
GET /{ar|en}/work               Selected work / case studies
GET /{ar|en}/work/[slug]        Per-project case study
GET /{ar|en}/apps               Apps & products listing (MoPlayer headline)
GET /{ar|en}/apps/moplayer      MoPlayer product page (localized, full landing)
GET /{ar|en}/youtube            YouTube content surface
GET /{ar|en}/contact            Contact (email, WhatsApp, optional form)
GET /{ar|en}/privacy            Localized privacy summary
GET /app                        Canonical English MoPlayer product page (kept for backlinks)
GET /privacy                    Canonical privacy policy
GET /support                    MoPlayer support entry
GET /admin                      Unified admin entry (auth-gated, no public nav)
GET /api/cv-pdf?locale=…        On-demand CV PDF rendering
GET /api/app/releases/latest    Latest MoPlayer release JSON
GET /api/app/releases/[slug]/download  APK download proxy
GET /api/app/support            MoPlayer support webhook
GET /api/contact                Site contact form intake
```

The proxy (`apps/web/src/proxy.ts`, Next.js 16 convention) handles:
- `/`-style URLs → automatic locale prefix.
- Legacy `/{locale}/admin*` → unified `/admin` entry.
- Adds `x-site-locale` header so server components know the active locale.

> Note: the legacy `/{locale}/admin/*` content workspaces still exist for editing,
> but they are entered from `/admin`, never from public navigation.

---

## 3. Admin

There are two valid admin entry points, both backed by the same auth + Supabase data:

| URL                              | What it is                                       |
| -------------------------------- | ------------------------------------------------ |
| `https://moalfarras.space/admin` | Lightweight admin embedded inside the main app   |
| `https://admin.moalfarras.space` | Standalone admin (apps/admin), separate Vercel project |

Both implement the same modules:
- **Website control** — pages, projects, CV content, services, navigation
- **MoPlayer control** — product hero, screenshots, releases, FAQ, install steps, support
- **Messages** — contact + MoPlayer support submissions
- **Media** — upload, library, picker, brand asset assignments
- **PDFs** — CV branded + ATS variants
- **Settings** — admin allowlist, credential rotation

Auth is locked behind:
- `ADMIN_ALLOWLIST` (comma-separated emails)
- `ADMIN_PASSWORD_HASH` (scrypt) — see security note below
- `ADMIN_SESSION_SECRET` (HMAC signing for the session cookie)

---

## 4. Environment variables

Both apps read `.env.local` (gitignored). Templates are committed as `.env.example`.

### apps/web (full)

```env
# Admin
ADMIN_ALLOWLIST="you@example.com"
ADMIN_EMAIL="you@example.com"
ADMIN_PASSWORD_HASH="scrypt$<salt>$<derived>"
ADMIN_SESSION_SECRET="<48+ random hex bytes>"

# Supabase (public)
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon>"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_..."

# Supabase (server-only)
DATABASE_URL="postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres:<pwd>@db.<ref>.supabase.co:5432/postgres?sslmode=require"
SUPABASE_SERVICE_ROLE_KEY="<service-role>"

# Public URLs
NEXT_PUBLIC_WEB_APP_URL="https://moalfarras.space"
NEXT_PUBLIC_ADMIN_APP_URL="https://admin.moalfarras.space"

# Optional integrations
YOUTUBE_API_KEY=""
YOUTUBE_CHANNEL_ID=""
WEATHER_API_KEY=""
API_FOOTBALL_KEY=""
RAPIDAPI_FOOTBALL_KEY=""
EDGE_CONFIG=""
GOOGLE_SITE_VERIFICATION=""
```

### apps/admin

Same `ADMIN_*` and Supabase keys; can be a strict subset.

> **Security**: `ADMIN_PASSWORD` (plain text) is supported as a fallback only.
> Always use `ADMIN_PASSWORD_HASH` in production. Generate it with:
>
> ```bash
> node scripts/hash-admin-password.mjs "your-password"
> ```

---

## 5. Local development

```bash
# From repo root, once
npm install

# Web (port 3000 by default)
npm run dev:web

# Admin (different port — set PORT or rely on Next default)
npm run dev:admin
```

Production build checks:

```bash
npm run typecheck:web
npm run typecheck:admin
npm run build               # builds both web + admin
```

---

## 6. Deployment

Two Vercel projects, both pointing at this repo. Each has its own `.vercel/project.json`:

| Vercel project name      | Workspace      | Domain                        |
| ------------------------ | -------------- | ----------------------------- |
| `mohammad-alfarras`      | `apps/web`     | `moalfarras.space`            |
| `moalfarras-admin`       | `apps/admin`   | `admin.moalfarras.space`      |

For each project:
- **Root directory**: the corresponding `apps/*` folder.
- **Install command**: `npm install` (npm workspaces resolve `@moalfarras/shared`).
- **Build command**: `npm run build`.
- **Node**: 24.x.
- **Framework**: Next.js (auto-detected).

`.vercelignore` (root) excludes `node_modules`, build output, Android build cache,
backup screenshots, and `.env*` (except `.env.example`).

---

## 7. Supabase

Project ref `ckefrnalgnbuaxsuufyx`. Migrations live in `supabase/migrations/`.

Important schemas:
- `app_admin_roles` — admin/editor role table consulted by the auth fallback path.
- `app_*` tables (`006_app_ecosystem.sql`) — products, releases, screenshots, FAQs, support requests.
- `*_translations` tables — bilingual content (ar/en) for all editable surfaces.
- `media_assets` — asset library exposed to the admin media picker.

Always edit through migrations, not Studio one-offs, so production stays reproducible.

---

## 8. Android (MoPlayer)

```text
android/moplayer/        # Android Studio project (open this folder)
└── app/                 # com.mo.moplayer
```

Build APKs from the repo root:

```bash
cd android/moplayer
./gradlew.bat assembleSideloadDebug
./gradlew.bat assembleSideloadRelease
```

Outputs:

```text
android/moplayer/build-output/app/outputs/apk/sideload/debug/
android/moplayer/build-output/app/outputs/apk/sideload/release/
```

Branding lives in `android/moplayer/app/src/main/res/drawable`
(`moplayer_brand_logo_new.png`, `logo.xml`, `icon.xml`, `tv_banner_image.jpg`).

The Android client talks to the same Supabase project and reads release metadata
through `/api/app/releases/latest`.

---

## 9. Design system (apps/web)

Tokens live in `apps/web/src/app/globals.css` and are exposed to Tailwind 4 via `@theme inline`.

| Token             | Light                  | Dark                   |
| ----------------- | ---------------------- | ---------------------- |
| `--background`    | `#fbfbfd` ivory        | `#050811` midnight     |
| `--foreground`    | `#060912` deep ink     | `#f4f7fb` cool white   |
| `--surface`       | `#ffffff`              | `#0a0f1c`              |
| `--brand-accent`  | `#00b8d4` deeper cyan  | `#00e5ff` electric cyan|
| `--secondary`     | `#4f46e5` indigo       | `#6366f1` indigo       |
| `--accent`        | `#c026d3` magenta      | `#d946ef` magenta      |

Plus radii (`--radius-sm/md/lg/xl/pill`), motion (`--motion-fast/base/slow`),
shadows (`--shadow-card/elevated/hero`), and a single `glass-card` component class
that all legacy aliases (`bento-card`, `mesh-card`, `stats-glass-card`, `yt-video-card`)
inherit from. Theme switches via `next-themes` with the `class` attribute.

---

## 10. Content & admin workflow

1. Edit locally with `npm run dev:admin` or via `/admin` on production.
2. Changes write to Supabase tables — both web + admin read from the same snapshot.
3. The CV PDF is regenerated on demand at `/api/cv-pdf` (Chromium via `@sparticuz/chromium`).
4. MoPlayer releases are uploaded through the admin "Releases" module
   and surfaced via `/api/app/releases/latest`.
5. Public messages from `/contact` and MoPlayer support land in the Messages module.

---

## 11. Conventions to keep the project clean

- **Never commit** `.env.local`, `.next/`, `.vercel/`, build output, or screenshot dumps.
- **Never** put admin or product images at the repo root — everything goes under
  `apps/web/public/images` (web) or `android/moplayer/app/src/main/res` (Android).
- **Locale-prefixed pages live under `apps/web/src/app/[locale]/(site)/…`**.
- **Public routes outside `[locale]`** (`/admin`, `/app`, `/privacy`, `/support`)
  are explicitly opted out by `apps/web/src/proxy.ts`.
- **Component naming**: any future “v3 / 2026” throwaway naming should be re-named
  before merging — keep one canonical component per surface.

---

## 12. Useful scripts

```bash
# Generate a new scrypt admin password hash
node scripts/hash-admin-password.mjs "newPassword!2026"

# Bootstrap a Supabase admin role (uses service role key)
npm --prefix apps/web run bootstrap:admin

# Publish a MoPlayer release row from a JSON manifest
npm --prefix apps/web run publish:moplayer-release

# Initial Supabase setup (re-runnable, idempotent)
npm --prefix apps/web run setup:supabase
```
