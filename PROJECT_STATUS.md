# Project Status

Last updated: 2026-09-30

## Current consolidation

- GitHub `origin/main` is currently at `aa6753e`; its latest Next App CI passed.
- The complete MoPlayer Pro 2.7.0 development stack is consolidated on this branch, including Android/TV UI, player, database, sync, activation, updater, localization, tests, and review fixes.
- MoPlayer PC 1.0.4 live-playback stabilization is preserved in the same integration line. Its public release feed remains on 1.0.3 until signed 1.0.4 binaries are published.
- The bilingual MoOS landing-page redesign is preserved. The ISO download remains disabled because the configured Vercel Blob endpoint still returns HTTP 403; production must not advertise that URL.
- The YouTube redesign brief is preserved at `YOUTUBE_PAGE_REDESIGN_PROMPT_MOALFARRAS.md`.

## Important files and areas

- `apps/moplayer-pro-android`: MoPlayer Pro 2.7.0 (`versionCode 69`).
- `apps/web`: activation/config/download integration and the MoOS landing page.
- `apps/moplayer-pro-windows`: MoPlayer PC 1.0.4 local candidate.
- `PROJECT_STATUS.md`: single current handoff source.

## Verification completed so far

- `npm run verify:windows`: passed on 2026-09-30 after preserving the 1.0.4 changes.
- All 94 registered worktrees were inspected: 91 clean, two worktrees contained the now-preserved changes, and one stale temporary registration was prunable.
- All local branch tips are ancestors of the MoPlayer Pro 2.7.0 consolidation tip.
- All remote feature/release branches are merged into `origin/main` by ancestry or equivalent final tree content; there are no open GitHub pull requests.
- The MoOS ISO candidate URL was rechecked with HEAD and range requests and returned HTTP 403 for both.

## Remaining release gates

- Run the full web, admin, dashboard, Android, and Windows verification suite on the consolidated tree.
- Build and verify the signed MoPlayer Pro 2.7.0 release artifact before publishing release metadata.
- Push the integration branch, merge it into `main` only after CI passes, and verify Vercel production deployments and live routes.
- Do not enable the MoOS ISO until a replacement host passes HTTP 200, byte-range, exact-size, and SHA-256 checks.

## Handoff notes

- Public Vercel project: `mohammad-alfarras`, root `apps/web`, domain `moalfarras.space`.
- Admin Vercel project: `moalfarras-admin`, root `apps/admin`, domain `admin.moalfarras.space`.
- No secret or credential has been added to source control.
