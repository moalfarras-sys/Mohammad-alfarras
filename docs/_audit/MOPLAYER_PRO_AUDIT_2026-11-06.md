# MoPlayer Pro verification — 2026-11-06

## Source and preservation

The original working tree is at acc7e503, 38 commits behind origin/main c717496e.
It contains 1,233 status entries, predominantly CRLF/LF changes. It remains intact;
tracked working/index patches and refs are backed up privately under
~/.local/state/moalfarras-pro-audit/20261106. Development proceeds in the existing
/var/home/moos/moalfarras-audit-20261105 worktree, PR #75, based on current main.
No force pushes, history rewrites, branch deletions or repository deletions.

29 remote branches are not ancestors of main. This does not prove they contain
unmerged features: squash merges require content/PR comparison. Fourteen open
Dependabot requests are covered by the audit's newer or equal installed versions
(Next 16.4.5, Zod 4.6.7, Nodemailer 10.3.1, Electron 42.11.18, Vite 8.3.6,
Undici 7.30.2, fast-uri 3.1.9, follow-redirects 1.16.2, Puppeteer 25.16.0).
They must not be merged as downgrades or incompatible standalone lock snapshots.

## Repairs reviewed and completed

- Updater rejects missing/malformed/mismatched checksums, wrong advertised version,
  zero/truncated/oversized files and invalid Content-Range bounds. Android signing
  remains enforced by PackageInstaller; SHA-256 alone is not publisher identity.
- TV runtime QA reproduced Home showing Channel 0 for the first M3U channel.
  Home no longer treats an internal sorting key as a resolved channel number.
  Player numbering remains resolved against its full channel list.
- Added explicit Media3 unstable-API annotations needed by Android Lint.
- Bidi control characters are escaped explicitly without changing RTL behavior.
- Pro build version is 2.7.3 / 72; instrumentation runner is configured.
- Android device CI covers API 29 and API 36 TV; local checks now include Lint.
- Original local doctor/combined-development scripts and workstation notes are
  carried forward without replacing the newer audited dependency locks.

## Evidence

- Full verify:production passed: web build/lint/types and 114 tests; admin
  build/lint/types and 11 tests; dashboard build; Classic 68 tests; Pro 402 tests.
- Pro Android Lint: zero errors, 101 warnings. Warnings remain for dependency
  updates, API availability, broad image-access behavior and other legacy items.
  No blanket suppression or risky major dependency upgrade was applied.
- Five connected Android TV API 36 tests passed: real Room 10,000-item sync with
  interruption/reopen/favorites/progress/search; Keystore decrypt/tamper rejection;
  two actual updater rejection tests; real Media3 engine three item changes and
  stop/reprepare with preserved position, using generated local PCM audio.
- Manual TV UI: source import confirmation, two-item synthetic M3U import, HLS
  720p AVC test-pattern rendering, channel switch, Home/return and channel overlay.
  A local ffmpeg-generated test pattern was served from loopback; no private
  provider credential or paid channel was used. Screenshots remain outside Git.
- Debug launch succeeded; one observed PSS snapshot was about 207 MiB during QA.
  This is not a leak/long-duration performance measurement.
- Windows type/lint/build passed. Flutter formatting/analyzer and six tests passed.
- npm audit: zero findings. This supersedes the earlier workstation report's
  dependency snapshot with 13 moderate findings.
- Initial 2.7.3 release build passed and its APK signing certificate matches the
  public 2.7.2 APK (SHA-256 certificate 97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d).
  Final build after the Home correction and publication status are recorded below.

## Limits and remaining work

No physical TV, iPhone, 4K/HDR/DRM, arbitrary provider codec coverage, subtitles
across every engine, long-running soak, or real-provider Xtream acceptance is
certified. Device audio test does not prove visible video rendering; the separate
manual HLS screenshot proves the listed 720p case only. API 29 CI is a separate
pending remote gate. The release must not be called published until the signed
artifacts, source merge, metadata and public download/config readback are checked.

## Primary references

- https://developer.android.com/media/implement/playback-app — foreground lifecycle.
- https://developer.android.com/studio/publish/app-signing — existing signing identity.
- https://developer.android.com/studio/test/command-line — connected instrumentation.

## Final local build and release preparation

After the Home repair, unit tests, Lint, debug and minified release builds passed;
five connected tests passed again. Arabic Settings and corrected Home were
visually inspected; the stale Channel 0 line is gone. The signed x86_64 release
rendered the synthetic HLS video and survived Home/return and channel switching.
Production packaging was rerun separately with `assembleRelease -PincludeX86Abis=false`
to keep universal downloads ARM-only (mixed debug/release tasks include emulator ABIs).
Universal size: 56,178,052 bytes; SHA-256:
`abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d`.

A synthetic legacy AVI/MSMPEG4v3 playback attempt on x86_64 produced the no-picture
error. Existing policy deliberately disables LibVLC on x86/x86_64 because its
surface attach was known to crash there. This is a platform limitation, not a
passed LibVLC acceptance test; do not remove that safety guard without ARM/device
coverage. LibVLC rendering on actual ARM hardware remains an explicit release QA
limit. No crash/ANR was observed during the listed TV UI checks.

Release metadata migration `20261106163000_moplayer_pro_273_release.sql` was
executed inside a verified-TLS Postgres transaction, read back with all three
expected sizes, then rolled back. Prior Pro release/assets/config rows are
backed up privately. Config merges preserve unrelated runtime/update fields.
The old published APKs and release rows are retained for rollback.

Remote TV CI exposed a boot race in the emulator action: sys.boot_completed was
1 before `input keyevent 82` was accepted, aborting before Gradle ran. Replaced
the action boot wrapper with a bounded script that waits for boot, package manager
and input readiness, retains logs, and always cleans up its own emulator.

## TV design included in final 2.7.3 candidate

The subsequent TV design pass is documented in [TV design](TV_DESIGN_2026-11-06.md).
It fixes variable-font weight selection, completes typography roles, labels all
TV dock targets, strengthens contrast, preserves safe margins and propagates
reduced motion. Seven connected TV tests passed after final changes, including
English/Arabic remote navigation and non-overlapping labels. Final signed ARM
release built successfully. The pre-design candidate hashes above are superseded.

Final universal: 56,183,214 bytes; SHA-256 `44d609c23f9db2f758f7acc836cb5c94e2399e8771ad88f30f894983222cdcad`.
The final migration was dry-run/read-back/rolled-back again with all three
updated sizes. Qualified artifacts are copied outside mutable Gradle outputs.
Public release remains a draft until the final design head passes remote CI.
