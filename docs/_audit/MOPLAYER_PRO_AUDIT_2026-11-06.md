# MoPlayer Pro audit and release 2.7.3 — 2026-11-06

## Provenance and preservation

The original working tree was at acc7e503, 38 commits behind origin/main c717496e,
with 1,233 status entries, predominantly CRLF/LF changes. It remains preserved;
tracked working/index patches and refs are backed up privately under
~/.local/state/moalfarras-pro-audit/20261106. Repairs continue in the existing
/var/home/moos/moalfarras-audit-20261105 worktree and PR #75, based on current main.
No force push, history rewrite, branch/repository deletion or old APK replacement.
Original local doctor/development scripts are carried forward without restoring
obsolete lockfiles over the newer audited dependency locks.

## Confirmed repairs

- Updater rejects missing/malformed/mismatched SHA-256, the wrong advertised
  package/version, supplied invalid/truncated/oversized file sizes and invalid
  Content-Range bounds. Android PackageInstaller still enforces signing identity;
  a checksum alone is not publisher authentication.
- Runtime TV QA reproduced Channel 0 in Home and Live preview. Browse surfaces no
  longer treat zero-based sorting keys as provider channel numbers. The player
  retains its complete-list channel numbering.
- Manrope's bundled variable font defaulted to weight 200 although Compose
  registered it under heavier weights. Licensed static Manrope/Cairo 500/600/700
  instances now make both languages readable on API 23+. All Material type roles,
  labeled TV navigation, safe margins, contrast and focus are covered by the
  [TV design report](TV_DESIGN_2026-11-06.md).
- Short control feedback is separate from continuous decorative motion. Balanced
  TVs retain smooth remote feedback without expensive animated backgrounds.
  Low-motion preference and Performance mode reduce control motion; Low motion
  also suppresses decoration in Quality mode.
- Added required Media3 unstable-API annotations for Lint; escaped Bidi controls
  explicitly without changing RTL behavior. Pro version is 2.7.3 / code 72.
- Device CI waits for boot, package-manager and input services and shares an
  explicit AVD path. The previous action's premature unlock failed before Gradle.

## Local evidence

| Check | Result |
| --- | --- |
| Web | Types, lint, production build, 114 tests passed |
| Admin | Types, lint, production build, 11 tests passed |
| Dashboard | Build passed |
| Classic Android | 68 tests passed |
| Pro Android | 404 tests passed, including motion-policy regression coverage |
| Pro Lint | Zero errors; 101 warnings remain |
| Connected TV API 36 | Seven tests: Room/10k-item persistence, Keystore, updater, real Media3, English/Arabic D-pad navigation |
| Windows source | Type/lint/build passed |
| Flutter | Formatting/analyzer and six tests passed |
| MoOS download Worker | 21 tests passed |
| npm audit | Zero findings in the updated dependency tree |

Full verify:production passed during this pass. Final motion-policy changes also
passed verify:android; final source CI and production publication are gated below.
Warnings remain for dependency/API updates, legacy image-access behavior and
other existing items; they were not blanket-suppressed.

Manual TV QA used a local ffmpeg-generated 720p AVC HLS test pattern and synthetic
M3U sources: import confirmation, catalog import, rendering, channel switch,
Home/return and player overlay. Minified signed x86_64 release also rendered HLS
with the new typography/navigation. English sign-in/Home/Settings and Arabic
Home/Settings/Live were visually reviewed at 1080p; Arabic Home was also reviewed
at 720p and the original emulator resolution restored. Screenshots stay outside
Git. One earlier PSS sample was about 207 MiB; this is not a leak/soak measurement.

## Signed release and recovery

Qualified ARM-only artifacts are copied outside mutable Gradle outputs. Each
signature verifies and matches the public 2.7.2 certificate:
97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d.
Build separately with `assembleRelease -PincludeX86Abis=false`; mixed debug/release
tasks include emulator ABIs. Universal: 56,183,447 bytes, SHA-256
`603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c`. The draft contains universal, arm64-v8a and armeabi-v7a APKs.

Migration 20261106163000_moplayer_pro_273_release.sql was tested in a verified-TLS
Postgres transaction, all three sizes read back, then rolled back. Existing Pro
release/assets/public-config rows are backed up privately. Config updates merge
unrelated fields, and old releases/assets remain recoverable. Publish assets
before committing this migration to production. Final publication is recorded
below after successful CI and public readback.

## Branches and remaining gates

29 remote branches were not ancestors of main; squash-merged work must be
compared by content/PR history, not blindly merged. Fourteen open Dependabot PRs
are covered by equal/newer audited versions and should not be merged as downgrades.
No old branch has been deleted.

A synthetic legacy AVI/MSMPEG4v3 attempt failed on x86_64, where existing policy
intentionally disables LibVLC because its surface attach is unsafe. ARM LibVLC
must be tested on real hardware; that guard was retained. No physical TV,
iPhone, 4K/HDR/DRM, arbitrary-provider codec coverage, long-duration soak or native
iOS acceptance is certified. The separate private iOS/MoOS repositories have not
been merged or deleted in this Pro-focused phase.

## Primary references

- https://developer.android.com/media/implement/playback-app
- https://developer.android.com/studio/publish/app-signing
- https://developer.android.com/studio/test/command-line
- https://developer.android.com/tools/variables
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://vercel.com/docs/git/vercel-for-github
