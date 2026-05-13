# Development Workflow

This file keeps daily development predictable for humans and AI agents.

## Clean Setup

From the repository root:

```powershell
npm install
```

Android projects use their own Gradle wrappers:

```powershell
apps/moplayer-android/gradlew.bat tasks
apps/moplayer2-android/gradlew.bat tasks
```

Secrets stay in ignored local files:

- `apps/web/.env.local`
- `apps/admin/.env.local`
- Android `local.properties`

Use `.env.example` files as templates only.

## Local Development

Public site:

```powershell
npm run dev:web
```

Admin:

```powershell
npm run dev:admin
```

Optional dashboard:

```powershell
npm run dev:moplayer-dashboard
```

Default ports may vary if another server is already running. Prefer explicit ports during QA:

```powershell
npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3000
npm --prefix apps/admin run dev -- --hostname 127.0.0.1 --port 3001
```

## Verification Matrix

| Change type | Minimum check |
| --- | --- |
| Public pages, app APIs, activation, downloads | `npm run verify:web` |
| Admin UI or admin actions | `npm run verify:admin` |
| Shared slug/product helpers | `npm run verify:web` and `npm run verify:admin` |
| Supabase migrations | Verify affected API/admin flows and document migration order |
| MoPlayer Classic Android | `npm run verify:android:classic` |
| MoPlayer Pro Android | `npm run verify:android:pro` |
| Player/live playback changes | Android unit tests plus manual/emulator playback QA when a stream is available |
| Production deploy | `npm run verify:production` |

## Production Deploy Checklist

1. Confirm `git status --short` only contains intended changes.
2. Run `npm run verify:production`.
3. Commit with a focused message.
4. Push `main`.
5. Deploy through Vercel or let Git integration deploy.
6. Inspect:

```powershell
npx vercel inspect https://moalfarras.space
npx vercel inspect https://admin.moalfarras.space
```

7. Smoke test:

```powershell
Invoke-WebRequest -UseBasicParsing https://moalfarras.space/en/apps/moplayer2
Invoke-WebRequest -UseBasicParsing https://moalfarras.space/en/activate?product=moplayer2
Invoke-WebRequest -UseBasicParsing https://moalfarras.space/api/app/config?product=moplayer2
Invoke-WebRequest -UseBasicParsing https://admin.moalfarras.space
```

## File Hygiene

Safe to delete locally when not running builds:

- `**/.next`
- `**/coverage`
- `**/build`
- `**/build-output`
- `**/.gradle`
- `**/.kotlin`
- `output`
- `artifacts`

Do not delete tracked public APKs or images unless you also update release metadata, download routes, and pages that reference them.

## Vercel Shape

Vercel deploys two separate projects:

| Project | Root | Domain |
| --- | --- | --- |
| `mohammad-alfarras` | `apps/web` | `moalfarras.space` |
| `moalfarras-admin` | `apps/admin` | `admin.moalfarras.space` |

The root `.vercelignore` intentionally excludes Android source, Gradle output, local secrets, generated folders, and local artifacts from Vercel uploads.

## Common Pitfalls

- Do not rename `moplayer2` to `moplayer-pro` in code paths or database rows.
- Do not move admin routes from `admin.moalfarras.space` into the public site unless intentionally merging apps.
- Do not run `npm audit fix --force`; it can select unsafe major changes or downgrades.
- Do not use APK split files for public download unless release metadata points to those exact files.
- Do not assume live IPTV streams are available in the repository; use tests and a provided stream for final playback QA.
