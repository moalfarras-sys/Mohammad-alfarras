# GitHub Repository Audit - 2026-06-18

## Scope

Audited the GitHub state for:

- `moalfarras-sys/MoPlayerios`
- `moalfarras-sys/Mohammad-alfarras`

No repository files were deleted during this audit.

## Current State

### MoPlayerios

- URL: `https://github.com/moalfarras-sys/MoPlayerios`
- Visibility: private
- Default branch: `main`
- Branches found: `main`
- Latest pushed commit on `main`: `27a75fd chore: prepare MoPlayer iOS Flutter for App Store release`
- Local export path: `C:\Users\Moalf\Desktop\MoPlayerios-release-20260618-131052`
- Tracked files: 194

This repo is focused and usable as the standalone MoPlayer iOS Flutter/App Store handoff repository.

### Mohammad-alfarras

- URL: `https://github.com/moalfarras-sys/Mohammad-alfarras`
- Visibility: public
- Default branch: `main`
- Repository size reported by GitHub API: about 634 MB
- Latest admin/site work is pushed to `fix/production-audit-2026-06-18`, not merged into `main`.
- `main` currently points to `b435e603 Document production MoPlayer deployment`.
- Latest admin suite commit exists only on `fix/production-audit-2026-06-18`: `6d9eb6ac feat: redesign MoPlayer admin suite controls`.

Important: because `main` is the default branch, a future Vercel/GitHub-based production deploy from `main` may overwrite the already-deployed MoPlayer admin suite work unless the branch is merged.

## Branch Audit

Remote branches found in `Mohammad-alfarras`:

- `main`: keep, default branch.
- `fix/production-audit-2026-06-18`: keep until merged; contains the latest MoPlayer iOS/admin/site work.
- `cursor/admin-panel-upgrade`: duplicate of `main` at `b435e603`; safe deletion candidate after confirming no external workflow uses it.
- `production`: already merged into `main`; safe deletion candidate if not used as a manual deployment branch.
- `copilot/clean-up-repository-files`: old branch from 2025-12-12; review once, then delete if no needed cleanup remains.
- `copilot/improve-env-file-comments`: old branch from 2025-12-17; safe deletion candidate after review.
- `copilot/prepare-deploy-to-vercel`: old branch from 2025-12-12; safe deletion candidate after review.
- `copilot/update-portfolio-mobile-first`: old branch from 2025-12-10; safe deletion candidate after review.
- `cursor/setup-dev-environment-6ac4`: old branch from 2026-05-05; safe deletion candidate after review.
- `ui-ux-redesign`: old branch from 2026-05-06; safe deletion candidate after review.

Recommended branch cleanup order:

1. Open or merge `fix/production-audit-2026-06-18` into `main` after review.
2. Delete `cursor/admin-panel-upgrade` if it remains identical to `main`.
3. Delete old `copilot/*`, `cursor/setup-dev-environment-6ac4`, and `ui-ux-redesign` branches after confirming no active pull requests or workflows reference them.
4. Delete `production` only if the team does not use it as a manual release marker.

## File Audit

### Safe Cleanup Candidates

These are safe cleanup candidates, but should be removed through a normal PR/commit rather than direct GitHub deletion:

- Root-level QA/report markdown files in `Mohammad-alfarras`, for example `ADMIN-QA.md`, `FINAL-AUDIT.md`, `SEO-REPORT.md`, `PERFORMANCE-REPORT.md`, and similar files. These should be moved into `docs/archive/` or consolidated, not blindly deleted.
- `.claude/launch.json` in `Mohammad-alfarras`. It appears tool/editor-specific. Delete if nobody uses Claude local workspace launch config.
- `backend/README.md`, `database/README.md`, and `storage/README.md`. These folders contain only placeholder README files. Delete or move to docs if they are no longer used operationally.
- `logo.png` at the root of `MoPlayerios`. The app references `assets/branding/logo.png`; the root `logo.png` is a duplicate and appears unused.

### Keep For Now

- `apps/web/public/downloads/**/*.apk`: these are large and make the repo heavy, but they are currently part of the public website download path. Do not delete until downloads move fully to GitHub Releases or Supabase Storage with route fallbacks updated.
- `apps/MoPlayer iphone ios` inside `Mohammad-alfarras`: this duplicates the standalone `MoPlayerios` repo, but keep it until a deliberate migration decides the monorepo should no longer contain iOS source.
- `android/`, `web/`, and `windows/` inside `MoPlayerios`: these are Flutter platform folders used for local QA/preview. They are not App Store-required, but deleting them should be a deliberate iOS-only simplification after verifying `flutter analyze`, `flutter test`, and macOS iOS build still work.
- `supabase/migrations`: required operational database history.
- `.env.example` files: required templates; no real secrets were found in tracked `.env.example` files during this audit.

## Large File Findings

The largest tracked files in `Mohammad-alfarras` are APKs:

- `apps/web/public/downloads/moplayer/app-sideload-universal-release.apk` - about 52.8 MB
- `apps/web/public/downloads/moplayer2/app-release.apk` - about 49.3 MB
- `apps/web/public/downloads/moplayer/app-sideload-arm64-v8a-release.apk` - about 33.6 MB
- `apps/web/public/downloads/moplayer/app-sideload-armeabi-v7a-release.apk` - about 33.3 MB

Recommended future cleanup:

1. Move APK binaries to GitHub Releases or Supabase Storage.
2. Keep website download routes stable by redirecting to the external release asset.
3. Remove APKs from Git history only with a planned history-rewrite migration if repository size becomes a serious problem. Do not rewrite history casually.

## Secret Check

Searched tracked files for the recently shared GitHub tokens and real test IPTV URL fragments. No matching real token or real server URL was found in tracked files.

The GitHub tokens shared in chat are still exposed outside the repository context and should be revoked/rotated from GitHub.

## Recommended Next Actions

1. Merge `fix/production-audit-2026-06-18` into `main` so GitHub default branch matches the already-deployed production site/admin work.
2. Decide whether iOS should live only in `MoPlayerios` or remain duplicated inside the monorepo until App Store launch.
3. Move root QA/report markdown clutter into `docs/archive/` in a separate docs-cleanup commit.
4. Delete old remote branches only after branch-owner confirmation.
5. Plan a separate binary-release cleanup for APKs instead of deleting public download assets immediately.
