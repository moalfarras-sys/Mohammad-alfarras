# Development Workflow

This file keeps daily development predictable for humans and AI agents.

## Clean Setup

From the repository root:

```powershell
npm ci
```

Android projects use their own Gradle wrappers:

```powershell
node scripts/run-gradle.mjs classic tasks
node scripts/run-gradle.mjs pro tasks
```

Secrets stay in ignored local files:

- `apps/web/.env.local`
- `apps/admin/.env.local`
- Android `local.properties`

Use `.env.example` files as templates only.

Use Node 24, JDK 17, Android SDK 36 and build-tools 35.0.0/36.0.0.
Set `JAVA_HOME` and `ANDROID_HOME` for local Android verification. The launcher
selects the Windows or POSIX wrapper automatically. Flutter QA uses Flutter
3.47.4 (`npm run verify:ios`); an iOS archive still requires macOS/Xcode.

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

MoPlayer Pro Windows:

```powershell
npm run dev:windows
npm run verify:windows
npm run dist:windows
npm --prefix apps/moplayer-pro-windows run qa:screens
```

Default ports may vary if another server is already running. Prefer explicit ports during QA:

```powershell
npm --prefix apps/web run dev -- --hostname 127.0.0.1 --port 3000
npm --prefix apps/admin run dev -- --hostname 127.0.0.1 --port 3001
```

## Research Before Implementation

For fast-moving topics, verify current docs before changing code. This matters because the project uses active platforms: Next.js 16, React 19, Vercel, Supabase, Android/Kotlin, Media3/ExoPlayer, LibVLC, Android TV, Electron, and Windows packaging.

Research is required before:

- changing routing, caching, middleware/proxy, metadata, server actions, or Next.js build behavior;
- changing Vercel project settings, deploy commands, env vars, aliases, or production workflow;
- changing Android permissions, Gradle config, playback engines, lifecycle, or TV focus behavior;
- changing Supabase auth, RLS, migrations, service role logic, storage, or provider-source encryption;
- adding or replacing dependencies;
- making performance, security, accessibility, Arabic/RTL, or image optimization decisions.

Use official docs and release notes first. Keep the implementation conservative: current, stable, testable, and consistent with this repository's existing structure.

## Verification Matrix

| Change type | Minimum check |
| --- | --- |
| Public pages, app APIs, activation, downloads | `npm run verify:web` |
| Admin UI or admin actions | `npm run verify:admin` |
| iOS/Flutter shared code | `npm run verify:ios`; macOS/Xcode for device/archive QA |
| Shared slug/product helpers | `npm run verify:web` and `npm run verify:admin` |
| Supabase migrations | Verify affected API/admin flows and document migration order |
| MoPlayer Classic Android | `npm run verify:android:classic` |
| MoPlayer Pro Android | `npm run verify:android:pro` |
| MoPlayer Pro Windows PC | `npm run verify:windows`, `npm run dist:windows`, and `npm --prefix apps/moplayer-pro-windows run qa:screens` before release |
| Player/live playback changes | Android unit tests plus manual/emulator playback QA when a stream is available |
| Production deploy | `npm run verify:production` |

After the web production build, run `npm --prefix apps/web run test:e2e`.
Playwright starts an isolated production server on port 4317. Use
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` for an already-installed compatible
Chromium, or install the Playwright browser. An explicit `PLAYWRIGHT_BASE_URL`
targets an existing deployment. `verify:production` covers web, admin, optional
dashboard and Android; Windows packaging and Flutter remain explicit extra gates.

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
- `apps/moplayer-pro-windows/dist`
- `apps/moplayer-pro-windows/dist-electron`
- `apps/moplayer-pro-windows/release`
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

## Combined daily development

`npm run doctor` checks installed tools and env-file presence without printing
secret values. `npm run dev` starts web at http://127.0.0.1:3000/en and admin at
http://127.0.0.1:3100, with local cross-app URLs set only in child processes.
Ignored env files are preserved. Occupied ports fail explicitly; Ctrl+C stops
both owned servers. See DEV_ENVIRONMENT_AUDIT_2026-11-06.md and VSCODE_CODEX_MCP.md.

Pro device QA: `node scripts/run-gradle.mjs pro connectedDebugAndroidTest`.
Build production APKs separately with
`node scripts/run-gradle.mjs pro assembleRelease -PincludeX86Abis=false`; mixed
debug/release tasks intentionally include emulator ABIs. Preserve the existing
signing identity and publish exact sizes/checksums before updating release rows.
