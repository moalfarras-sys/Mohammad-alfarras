# MoPlayer Pro cinematic / remote UX follow-up — 2026-11-06

## Baseline and research

Started on clean `main` bf204210 (published 2.7.3 / code 72). Existing workstation
changes remain in the preserved stash described by WORKSTATION_RESTORE.md in the
private audit backup. Work is isolated on `feat/pro-cinematic-remote-20261106`.
The previous updater, fonts, dock labels, source handoff and playback safety fixes
are already merged; this work builds on them rather than reapplying old patches.

Primary references reviewed, 2026-11-06:

- [Android TV Compose](https://developer.android.com/training/tv/playback/compose)
- [TV focus system](https://developer.android.com/design/ui/tv/guides/styles/focus-system)
- [TV principles](https://developer.android.com/design/tv/principles)
- [TiviMate](https://tivimate.com/): TV-first content browsing; phone is not its target.
- [SparKLE](https://www.sparkleplayer.com/): guide, recent content, favorites,
  themes, audio/subtitles and remote personalization.
- [OTT Navigator](https://ottnav.github.io/faq/basics/what-is-ott-navigator.html):
  TV/remote and touch access to provider content, flexible categories and guide.

This is a comparison of published product information, not a claim of running
competitors or copying their assets. Context7 AndroidX source guidance and the
installed tv-material 1.1.0-rc01 API were checked before adding a TV Surface.
No dependency version changed. Explicit TV action colors/shapes preserve the
existing orange/palette themes without relying on a second default theme.

## Priorities and implementation

**P0 — usability:** The VOD toolbar had nine icon-only actions and a hint competing
in a non-scrollable row. Replace it with a keyed lazy strip, visible localized
labels and a separate hint. Audio/subtitles/quality lead; retry and external
player remain available. TV actions use Compose for TV Surface with a warm
focused fill and accent outline. Phone actions retain FocusGlow's touch behavior.
Remote/timeline transport stays LTR in Arabic. Phone controls now use smaller
safe insets and compact ±10 buttons, retaining their accessibility labels.
Reduced-motion preference also removes VOD controls' entrance/exit fades.

**P1 — Home hierarchy:** A synthetic two-channel library reproduced identical
cards in Continue watching and Live TV. Shelves now suppress duplicates by
(server, type, id), taking the limit after filtering and prioritizing actual
recent viewing, favorites and resumable VOD. Full catalogs/favorites are retained
in their dedicated sections. Empty duplicate shelves disappear. A first-time
user still sees Live TV first, and undated channels are never called new.

Smart picks is now a compact header action instead of a full-width leading
shelf. Restored row indexes account for that removed TV item; phone retains its
own header. The cinematic header emphasizes the focused title and real provider
description (when present), with a quiet OK hint. Existing weather, clock,
account, campaigns and football settings still apply. Bottom dock, theme choices,
fonts, wallpapers and underlying player engines remain intact.

**P2 — remaining broader product work:** Full time-based EPG grid, DVR/timeshift,
multiview, hardware HDR/AFR qualification, and further redesign of login, settings,
search and detail screens need separate implementation/qualification. This pass
does not advertise unsupported features or represent the entire requested
cross-platform audit as complete. No IPTV credentials or personal media are used
for test fixtures. No production metadata or automatic update is changed here.

## Verification

- `npm run verify:android`: Classic unit checks and Pro 407 unit tests passed.
- Final `lintDebug`: zero errors; 101 existing warnings remain. A new test-only
  RememberInComposition error was corrected rather than suppressed.
- `assembleDebug` and `assembleDebugAndroidTest` pass.
- Android TV API 36: all 12 tests passed again on the final committed source.
- Phone API 36: ten applicable tests pass; the two TV-only dock tests skip.
  Includes real Room/Keystore/updater/Media3 checks and five player UI checks.
- D-pad traverses all nine tools in English and mirrored Arabic, including lazy
  items initially offscreen. Touch/keyed scrolling reaches and activates each
  action. A 320dp Arabic player fixture checks transport order and viewport bounds.
- Visual inspection caught a partially clipped seek button that the first
  visibility assertion missed. Constrained the middle action to available phone
  width and strengthened the test to check the seek target lies inside the player.
  This fixture renders the actual overlay but is not a playback screenshot.
- Phone app sign-in was launched and inspected in its real landscape activity.

Local QA files (intentionally ignored/untracked; synthetic content only):
`/tmp/pro-cinematic-before-home.png`, `/tmp/pro-cinematic-after-home.png`,
`/tmp/pro-cinematic-phone-player.png`, `/tmp/pro-cinematic-phone-login.png`.
Final Home captures: `/tmp/pro-cinematic-final-home-1080.png`,
`/tmp/pro-cinematic-final-home-720.png`, `/tmp/pro-cinematic-final-home-4k.png`.
Reviewed native 720p/1080p UI captures and restored 1920x1080 afterwards.
A requested 3840x2160 logical viewport still produced a 1920x1080 framebuffer
capture; this is not a native 4K visual qualification.
The emulator was limited to 1536 MB for final checks to avoid host contention;
its adaptive low-device policy suppresses optional widgets. This differs from
some earlier baseline captures and is not evidence of removed widget settings.
The final capture also suppresses descriptions identical to the title. No competitor screenshots or
private provider assets were copied into the product.

Physical TVs/phones, ARM LibVLC/HDR/4K decoding and long-duration playback remain
unqualified in this pass. UI resolution captures do not establish codec support.
Production release remains subject to the existing signed-release and playback
gates; no version bump or automatic production update is included in this PR.


## Final local runtime evidence

The final signed, minified `assembleRelease -PincludeX86Abis=true --max-workers=2`
succeeded and the x86_64 artifact was installed in the TV emulator. It is a local
QA artifact, not a newly published 2.7.3 asset. The public production release is
unchanged. Unit/debug/test builds and final Lint passed; the original 101 warnings
remain visible. Phone tests were rerun after remembering the test focus/state
holders; ten applicable checks pass, two TV-only dock checks skip.

The phone app imported a local synthetic M3U with two live channels and one VOD
item. Media3 reached PLAYING and position advanced with buffered HLS data; the
rendered test-pattern frame was captured. This is a short smoke check, not a
long-duration or physical-device qualification. A cold FFmpeg library load was
reported by debug StrictMode on main (~322 ms on this emulator); follow up with
measured background preparation before claiming improved cold playback startup.

PR: https://github.com/moalfarras-sys/Mohammad-alfarras/pull/76


The TV source-error path was also exercised when the local fixture HTTP server
was stopped by the interrupted session. After restarting the server, OK/retry
returned the MediaSession to PLAYING and a rendered frame was captured. This
checks error/retry recovery only; still-frame captures and a PLAYING session do
not establish sustained moving-video smoothness or a frame-drop benchmark.

Remote CI on code commit `1ed6a95b`: Pro and Classic Android checks, API 29 phone
and API 36 TV device jobs, Windows/Linux desktop checks, admin/dashboard checks
and both Vercel previews passed. The web browser-install/job was still running
at this evidence snapshot; do not describe that pending job as passed.


## 2.7.4 testing release preparation

The user requested publication and continued development. Candidate packaging is
now `2.7.4-rc.1`, versionCode 73, with the existing application id/certificate.
This supersedes the earlier note that this branch had no version bump. The
production config, fallback metadata and automatic updates remain on 2.7.3.
The GitHub candidate is a prerelease only. Per Android's versioning guidance,
a later stable build must use versionCode 74 or higher; changing the name alone
does not override Android's downgrade protection.
Reference: https://developer.android.com/studio/publish/versioning


RC qualification: `npm run verify:android` passed again (407 Pro unit tests,
Classic checks and Lint). Signed minified emulator and ARM release builds passed.
An in-place emulator upgrade retained the test library and showed version 73 /
2.7.4-rc.1. Every ARM artifact's signature matches the existing SHA-256 certificate
`97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`.
The universal candidate contains ARM64 and ARMv7 only; x86 stays local for QA.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| app-universal-release.apk | 56199529 | `396c193309527b57c9d1fbcd06a99af528874e6d32507d0af5bf6f95131d460e` |
| app-arm64-v8a-release.apk | 34961883 | `690ad347a10f242bac356170a640d789dd9c6f133c167bb840a6d6b7a43eb33f` |
| app-armeabi-v7a-release.apk | 31243445 | `e8661fcfbea982879cb7af56291e52ba805c64352f5847e66f725980ba3cc764` |

Candidate URL: https://github.com/moalfarras-sys/Mohammad-alfarras/releases/tag/moplayer-pro-v2.7.4-rc.1

The new CI TV job exited 255 after boot, before Gradle/tests. Settings writes
were outside the readiness loop; they now retry within the same bounded loop.
A mocked SDK test rejected the first settings write with 255 and verified that
Gradle was reached after retry, while `bash -n` passed. This is an orchestration
regression check, not a substitute for real Android tests. Remote CI reruns on
the final commit; no production automatic update is enabled by this candidate.

## Stable 2.7.4 / code 74 preparation

A real cold-start StrictMode trace showed FFmpeg JNI disk loading on main.
The Compose Media3 owner now awaits a guarded native availability probe on IO
before constructing its main-thread player. Platform renderers and the fallback
chain remain available when FFmpeg is absent. No library is eagerly loaded in
Application startup; player ownership and effects still cancel when disabled or
disposed. Added a Compose session regression test for async preparation,
enable/disable and surface-generation replacement; the real audio/zap test now
uses the same background preparation path. No fixed startup speedup is claimed.

Primary references: Android startup optimization
https://developer.android.com/topic/performance/appstartup/analysis-optimization
and Media3's synchronized, cached LibraryLoader
https://github.com/androidx/media/blob/release/libraries/common/src/main/java/androidx/media3/common/util/LibraryLoader.java

Stable packaging uses versionCode 74, allowing an in-place update from RC code 73.
