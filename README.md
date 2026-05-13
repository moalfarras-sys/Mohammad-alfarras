# Moalfarras Space

Production monorepo for:

- Public website: `https://moalfarras.space`
- Admin control center: `https://admin.moalfarras.space`
- MoPlayer Classic Android TV app: internal slug `moplayer`
- MoPlayer Pro Android app: internal slug `moplayer2`

The public name is **MoPlayer Pro**. Keep the `moplayer2` slug in code, URLs, API payloads, and database rows for compatibility.

## Project Layout

```text
apps/web                 Next.js public site, activation APIs, APK downloads
apps/admin               Next.js admin control center
apps/moplayer-android    MoPlayer Classic Android TV app
apps/moplayer2-android   MoPlayer Pro Android app
apps/moplayer-dashboard  Optional Vite dashboard
packages/shared          Shared product metadata and helpers
packages/db              Shared database helpers
supabase/migrations      Production database migrations
docs/PRODUCTION_GUIDE.md Production operations guide
```

## Domains

| App | Vercel project | Root | Domain |
| --- | --- | --- | --- |
| Public site | `mohammad-alfarras` | `apps/web` | `moalfarras.space` |
| Admin | `moalfarras-admin` | `apps/admin` | `admin.moalfarras.space` |

`www.moalfarras.space` is supported and redirects to `moalfarras.space` while preserving the path and query string.

## Activation Routes

MoPlayer Classic:

```text
https://moalfarras.space/activate?code=MO-XXXX
https://moalfarras.space/ar/activate
https://moalfarras.space/en/activate
```

MoPlayer Pro:

```text
https://moalfarras.space/activate?product=moplayer2&code=MO-XXXX
https://moalfarras.space/ar/activate?product=moplayer2
https://moalfarras.space/en/activate?product=moplayer2
```

Activation APIs must always preserve product separation with `productSlug` or `product_slug`.

## Required Local Env

Real secrets belong only in ignored files:

- `apps/web/.env.local`
- `apps/admin/.env.local`
- Android `local.properties`

Do not commit production secrets. Use `.env.example` files for templates only.

Required production values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOPLAYER_PROVIDER_ENCRYPTION_KEY` on `apps/web`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `NEXT_PUBLIC_WEB_APP_URL=https://moalfarras.space`
- `NEXT_PUBLIC_ADMIN_APP_URL=https://admin.moalfarras.space`

## Verification

Run from the repository root:

```powershell
npm --prefix apps/web run typecheck
npm --prefix apps/web run lint
npm --prefix apps/web test
npm --prefix apps/web run build
npm --prefix apps/admin run typecheck
npm --prefix apps/admin run lint
npm --prefix apps/admin run build
```

Android:

```powershell
apps/moplayer-android/gradlew.bat testSideloadDebugUnitTest
apps/moplayer2-android/gradlew.bat testDebugUnitTest
```

Release APKs:

```powershell
cd apps/moplayer-android
.\gradlew.bat assembleSideloadRelease -PincludeX86Abis=true

cd ..\moplayer2-android
.\gradlew.bat assembleRelease
```

## Documentation

Start here:

- [Agent Guide](AGENTS.md)
- [Development Workflow](docs/DEVELOPMENT_WORKFLOW.md)
- [Project Handoff](docs/PROJECT_HANDOFF.md)
- [Production Guide](docs/PRODUCTION_GUIDE.md)
- [Deployment Notes](docs/deployment.md)
- [Android Projects](docs/android-projects.md)
- [Architecture](docs/architecture.md)
