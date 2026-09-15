# Project Status

Last updated: 2026-09-15

## Completed today

- Reconciled the 18 production-only website commits into GitHub `main`; the published MoOS, MoPlayer, mobile, SEO, and download work is no longer at risk of being removed by the next Git deployment.
- Audited all public sitemap URLs, MoOS routes, application pages, release/config APIs, activation routes, admin login redirect, and downloadable release artifacts.
- Repaired the public MoOS desktop and cloud installers by enforcing LF line endings and adding an installer-integrity test. The previous CRLF files downloaded successfully but failed Bash parsing on Linux.
- Restored the tracked Media3 texture-view resource required by MoPlayer Pro Android and added the matching `.gitignore` exception.
- Updated supported web/admin/Windows dependencies and lockfile overrides. `npm audit` reports zero known vulnerabilities.
- Replaced internal locale navigation through `window.location.assign` with the Next.js router.
- Removed five obsolete root-level QA scratch scripts and cleaned related stylesheet whitespace.
- Updated GitHub Actions checkout/setup actions to their Node 24 generation.
- Enabled GitHub Dependabot vulnerability alerts and automated security updates; secret scanning and push protection remain enabled.

## Important files changed

- `.gitattributes`, `.gitignore`
- `.github/workflows/next-app-ci.yml`, `.github/workflows/flutter_quality.yml`
- `apps/web/public/downloads/moos/moos-install.sh`
- `apps/web/public/downloads/moos/moos-cloud-install.sh`
- `apps/web/tests/unit/moos-installer-integrity.test.ts`
- `apps/web/src/components/layout/locale-preference-link.tsx`
- `apps/moplayer-pro-android/app/src/main/res/layout/view_player_texture.xml`
- Workspace package manifests and `package-lock.json`

## Verification

- `npm run verify:web`: passed (typecheck, lint, 17 tests, production build).
- `npm run verify:admin`: passed.
- `npm run verify:moplayer-dashboard`: passed.
- `npm run verify:windows`: passed; Vite only reports an advisory large-chunk warning.
- `npm run verify:android:classic`: passed.
- `npm run verify:android:pro`: passed after restoring the required layout resource.
- `bash -n` passed for both MoOS installer scripts.
- `npm audit`: 0 vulnerabilities.
- GitHub Next App CI run `34963527067`: passed for web, admin, and dashboard.
- Vercel Git deployments from commit `d7dd2e8d` reached Ready for both public and admin production projects.
- The current Classic 2.4.0, Pro 2.6.5, and Windows 1.0.4 artifacts respond successfully and match the published sizes/checksums.
- The latest `moos-image` container workflow `34958392078` passed build, push, signing, signature verification, and remote-control tests; all three GHCR `latest` manifests resolve.

## Remaining attention

- The separate MoOS Live ISO workflow `34885449896` boots but fails its installation test. The public ISO endpoint correctly remains unavailable (`503`) and must not be advertised as ready until that workflow passes.
- GitHub `main` is not branch-protected. Enable protection only after agreeing on required reviews and checks so the current production flow is not accidentally blocked.
- GitHub Actions currently validates web/admin/dashboard only; Android and Windows remain local/release-workflow gates.
- Physical-device playback and full installer execution were not performed in this pass; builds, CI, manifests, scripts, downloads, hashes, and HTTP production behavior were verified.

## Next recommended step

Repair the MoOS Live ISO installation workflow, then execute a real VM installation smoke test before enabling the ISO download endpoint.

## Handoff notes

- Public Vercel project: `mohammad-alfarras`, root `apps/web`, domain `moalfarras.space`.
- Admin Vercel project: `moalfarras-admin`, root `apps/admin`, domain `admin.moalfarras.space`.
- No environment key or secret needs to be changed for this release.
