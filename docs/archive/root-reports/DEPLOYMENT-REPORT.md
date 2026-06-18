# Deployment Report

Date: 2026-06-15

## Current Status

DEPLOYED.

The public homepage MoPlayer section has been redesigned, the MoPlayer PC download fallback was fixed, and the verified commit was pushed to `main`.

Production commit: `d3520d8b` (`Fix MoPlayer CMS media and homepage section`)

Production visibility: `https://moalfarras.space/en` showed the new MoPlayer section at `2026-06-15T15:36:07Z`.

## Verification Run

| Command | Result |
| --- | --- |
| `npm run verify:web` | PASS |
| `npm run verify:admin` | PASS |
| `npm run verify:moplayer-dashboard` | PASS |
| `npm run verify:production` | PASS |
| `git diff --check` | PASS |

`verify:web` included typecheck, lint, production build, and 12 passing tests.

`verify:production` completed successfully after the MoPlayer PC Windows download fix.

## Local Browser/HTTP QA

| Check | Result |
| --- | --- |
| Homepage MoPlayer section `/en` | PASS - desktop and mobile visual inspection, no horizontal overflow |
| Homepage MoPlayer section `/ar` | PASS - Arabic RTL copy and links reflected |
| MoPlayer hub link | PASS - `/en/apps/moplayer` and `/ar/apps/moplayer` return 200 |
| MoPlayer Classic link | PASS - `/en/apps/moplayer/classic` and `/ar/apps/moplayer/classic` return 200 |
| MoPlayer Pro link | PASS - `/en/apps/moplayer2` and `/ar/apps/moplayer2` return 200 |
| MoPlayer PC link | PASS - `/en/apps/moplayer-pc` and `/ar/apps/moplayer-pc` return 200 |
| Activation link | PASS - `/en/activate?product=moplayer2` and `/ar/activate?product=moplayer2` return 200 |
| Classic download API | PASS - redirects to the official APK |
| Pro download API | PASS - redirects to the official APK |
| PC setup download API | PASS - redirects to the GitHub Releases setup executable |
| PC portable download API | PASS - redirects to the GitHub Releases portable executable |

## Production Actions

| Action | Result |
| --- | --- |
| Commit | PASS - `d3520d8b` |
| Push to `main` | PASS - pushed to `origin/main` and `origin/cursor/admin-panel-upgrade` |
| Production domain smoke test | PASS |

## Production Smoke Test

| URL/check | Result |
| --- | --- |
| `https://moalfarras.space/en` | PASS - new MoPlayer section visible |
| `https://moalfarras.space/ar` | PASS - Arabic RTL section visible in browser DOM |
| `https://moalfarras.space/en/apps/moplayer` | PASS - 200 |
| `https://moalfarras.space/en/apps/moplayer/classic` | PASS - 200 |
| `https://moalfarras.space/en/apps/moplayer2` | PASS - 200 |
| `https://moalfarras.space/en/apps/moplayer-pc` | PASS - 200 |
| `https://moalfarras.space/en/activate?product=moplayer2` | PASS - 200 |
| `https://moalfarras.space/ar/apps/moplayer` | PASS - 200 |
| `https://moalfarras.space/ar/apps/moplayer/classic` | PASS - 200 |
| `https://moalfarras.space/ar/apps/moplayer2` | PASS - 200 |
| `https://moalfarras.space/ar/apps/moplayer-pc` | PASS - 200 |
| `https://moalfarras.space/ar/activate?product=moplayer2` | PASS - 200 |
| `https://admin.moalfarras.space` | PASS - 307 to `/login` |
| Classic download API | PASS - 307 to `/downloads/moplayer/app-sideload-universal-release.apk` |
| Pro download API | PASS - 307 to `/downloads/moplayer2/app-release.apk` |
| PC setup download API | PASS - 307 to GitHub Releases setup executable |
| PC portable download API | PASS - 307 to GitHub Releases portable executable |
| `https://moalfarras.space/sitemap.xml` | PASS - MoPlayer app routes present, `/ai` not present |
| `https://moalfarras.space/en/ai` | PASS - 307 redirect to `/en` |

## Production Browser QA

| Viewport | Result |
| --- | --- |
| Desktop `1440x1000` | PASS - section width `1240`, height `720`, no horizontal overflow |
| Mobile `390x844` | PASS - cards present, no horizontal overflow |
| Arabic DOM | PASS - `dir="rtl"`, title `بوابة واحدة لكل تطبيقات MoPlayer.`, Classic/Pro/PC links present |

## Notes

- `tmp-admin/` remains local QA evidence and is ignored by git.
- The fully admin-editable custom 404 page remains documented in `ADMIN-CMS-REALITY-MATRIX.md` as an attention item, not a blocker for the current homepage MoPlayer and download deployment.
- A server-rendered root `<html>` locale fix was investigated, but using `headers()` in the root layout made all pages dynamic in `next build`. It was not shipped because it would reduce static generation and cache performance; the existing client document sync keeps the live browser DOM locale-correct.
