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
- Latest admin/site work was fast-forwarded into `main`.
- `main` currently points to `06b03d7 docs: add GitHub repository audit`.

The default branch now matches the already-deployed MoPlayer admin suite work.

## Cleanup Completed

- Fast-forwarded `moalfarras-sys/Mohammad-alfarras` `main` to include the MoPlayer iOS/admin/site production work.
- Deleted old non-default `Mohammad-alfarras` branches: `copilot/*`, `cursor/*`, `production`, `ui-ux-redesign`, and the temporary `fix/production-audit-2026-06-18` branch after merging it into `main`.
- Removed duplicate root `logo.png` from `moalfarras-sys/MoPlayerios`; the app uses `assets/branding/logo.png`.
- Removed tracked `.env`, DocuSign private key files, logs, pid files, generated PDFs, `tmp/`, `test-results/`, and `tsconfig.tsbuildinfo` from `moalfarras-sys/schnell-bashar`; updated its `.gitignore`.
- Removed `git hub.txt` from `moalfarras-sys/alhasaha` because it contained a GitHub PAT; updated its `.gitignore`.
- Closed stale `elmedina-website` PRs #1 and #2 and deleted their unrelated `codex/*` branches.
- Deleted merged/stale branches in `Faressalon` and `seelweb` where safe.
- Added useful GitHub repository descriptions/homepage metadata for all visible repositories.
- Moved root-level report clutter in `Mohammad-alfarras` into `docs/archive/root-reports/`.
- Moved root placeholder docs from `backend/`, `database/`, and `storage/` into `docs/archive/root-reports/`.
- Removed the tool-specific `.claude/launch.json` from `Mohammad-alfarras`.

## Branch Audit

Remote branches currently expected in `Mohammad-alfarras`:

- `main`: keep, default branch.

Other visible repositories after cleanup:

- `MoPlayerios`: `main`
- `alhasaha`: `main`
- `elmedina-website`: `main`
- `Faressalon`: `main`
- `seelweb`: `main`, `backup/origin-main-2026-04-18`
- `schnell-bashar`: `main`, `release/theme-media-booking-v1`

The two remaining non-default branches contain commits that are not trivially represented in `main`, so they were kept instead of deleting potentially useful project history.

## File Audit

### Safe Cleanup Candidates

These are safe cleanup candidates, but should be removed through a normal PR/commit rather than direct GitHub deletion:

- The current cleanup moved root-level QA/report markdown into `docs/archive/root-reports/`.
- The current cleanup removed `.claude/launch.json`.
- The current cleanup moved placeholder `backend/`, `database/`, and `storage/` README files into `docs/archive/root-reports/`.
- The current cleanup removed the duplicate root `logo.png` from `MoPlayerios`.

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

Searched tracked files for the recently shared GitHub tokens and real test IPTV URL fragments. After cleanup, no matching real token or real server URL was found in default-branch tracked files.

The removed `alhasaha/git hub.txt`, the removed `schnell-bashar/.env`, and the removed `schnell-bashar/docusign-private.key` still exist in Git history until a deliberate history rewrite is performed. Rotate/revoke those credentials.

The GitHub tokens shared in chat are exposed outside the repository context and should be revoked/rotated from GitHub.

## Recommended Next Actions

1. Decide whether iOS should live only in `MoPlayerios` or remain duplicated inside the monorepo until App Store launch.
2. Decide whether to rewrite history for `alhasaha` and `schnell-bashar` to permanently purge exposed secrets from older commits. This requires coordination because it rewrites Git history.
3. Review the two remaining non-default branches: `seelweb/backup/origin-main-2026-04-18` and `schnell-bashar/release/theme-media-booking-v1`.
4. Plan a separate binary-release cleanup for APKs instead of deleting public download assets immediately.
