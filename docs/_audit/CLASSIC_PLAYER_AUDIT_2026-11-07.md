# MoPlayer Classic playback audit — 2026-11-07

Scope: the blue Classic app, `apps/moplayer-android`, package `com.mo.moplayer`,
product slug `moplayer`. Pro identity, sources and signing configuration are retained.
Baseline main was `0d5dd368`; work branch `codex/classic-deep-audit-20261106`.
The original workstation stash was preserved. No tracked assets were deleted.
Fetched origin before editing/release preparation. The separate 2.5.1 branch has
three distinct commit identities because main merged it as `fbe7af96` (#43), but
its Classic source tree is byte-identical to main. No old branch was merged again
or deleted. The original worktree/stash were retained.

## Priorities and repairs

| Priority | Proven finding | Repair / evidence |
| --- | --- | --- |
| P0 | Exo remains allocated after VLC fallback; comparison/release code creates unused engines | Release every initialized delegate once; never initialize a delegate to compare/release it |
| P0 | Changing engine can leave the old engine playing | Stop and detach the outgoing owner before selecting the new engine |
| P0 | Fallback seeks to the initial position rather than current VOD progress | Read position before stopping; live fallback starts at live edge |
| P0 | Late callbacks can restart a stopped or superseded load | Bind callbacks to source/load generation; detach on stop/release; fence queued VLC events |
| P0 | Repeated VLC view attachment throws `Can't set view when already attached` | Make attachment idempotent and detach the old surface before changing views |
| P0 | Native VLC plays but never signals READY to the owner | Emit READY/buffering-complete on Playing; actual PCM test failed before repair |
| P0 | A second singleTask player intent leaves the previous content open | Update intent and recreate the owned session through its normal cleanup path; actual framework test failed before repair |
| P1 | VOD pauses even while visible and does not resume after returning | Pause in onStop, remember playback intention; preserve explicit pause |
| P1 | PiP exit leaves child control bars hidden; Exo cannot auto-enter PiP | Restore both bars and query active playback across both engines |
| P1 | Subtitle Off does not disable text; flat track menu index selects the wrong group | Disable text type explicitly; map menu index to group and in-group track |
| P1 | System Play and Pause both toggle playback | Add distinct private commands and explicit play intention; qualification in progress |
| P1 | Lint succeeds with errors; Android-device CI covers Pro only | Fail on Lint errors, include Classic Lint in verification, add Classic API 29/36 device jobs |
| P1 | TV initialization re-enables backgrounds after the viewer disabled motion | Honor viewer/system/reduced-motion settings and low-device policy on every initialization |
| P1 | Player repeats Live and can publish previous-channel guide metadata after a zap | One Live badge, real program titles only, generation-scoped guide results |
| P1 | Horizontal focus links stay LTR in Arabic | Map physical left/right to the actual RTL arrangement, including dock wrap |
| P1 | TV dock labels fall to 8sp; Arabic uses system fallback; focus corners use raw pixels | Larger shared type, licensed Cairo locale aliases, density-aware focus geometry |

The six manager regression checks all failed before the behavioral repair and
passed afterwards. Existing positive event-delivery coverage remains; new checks
also cover live-edge fallback and notifying the surface before native preparation.
Native callbacks use snapshots so switching/unregistering during error delivery
cannot invalidate the callback iterator. VLC native release joins run off the UI
thread after listeners/views are detached on it.

## Framework and visual qualification

An initial API 36 TV emulator run of three actual player checks failed on VOD
resume, visible-paused playback and subtitle Off. They passed after repair.
The singleTask framework check independently failed with the previous title still
visible; the implementation now recreates the session with the new intent.
The real VLC PCM test reached Playing but failed its READY-event assertion; the
native state relay was corrected rather than suppressing that assertion.

The expanded local group subsequently passed 22 connected tests on API 36 TV,
including real Media3/VLC PCM playback, native fallback errors, repeated view
attachment, track groups, PiP control restoration, framework lifecycle, private
media commands, merged TV manifest and the existing adapter stress cases.
Classic had 77 passing unit checks at that checkpoint; Pro's 405 checks passed.

The old adapter test fixture inflated AppCompat views with a raw application
context and used layout parameters as MeasureSpecs. It now uses the real product
theme and explicit screen MeasureSpecs. Its concurrent case also joined jobs on
the same main thread it blocked: that test deadlocked. The test thread now waits
while both producers dispatch actual adapter updates to the main thread, with a
bounded timeout and an item-count assertion. Stress iterations were retained.
The old instrumentation package assertion now uses the real flavor/debug id.

Physical Android 11 ARMv7 TV qualification was subsequently authorized. The first
connection attempt failed offline and no tests ran. After reconnect/wake, 21/22
checks passed. Native pause can complete asynchronously; tests now wait for the
same paused state and retain the explicit-pause assertion. A later repeat exposed
system transport control handling, which is now being qualified with distinct
Play/Pause commands. No failed run is counted as a passing qualification.

The physical TV identified a second detail: Android's controller sends its own
Pause while the Activity is leaving, before onStop. That automatic transition must
not overwrite the viewer's resume intention. The bridge now distinguishes that
system command from explicit remote/notification pause, checks lifecycle state,
and fences commands from previous lifecycle owners. The focused three-test TV
rerun passed for Media3 resume, default VLC resume, and idempotent Play/Pause.
An explicit pause while stopped also has a separate regression assertion.

## Classic visual polish

The existing XML/View architecture, blue identity, alternate themes and bottom
dock were retained. Dock labels now use 11sp across resource buckets, with a
continuous navy surface and a distinct selected state. Posters use quieter 16dp
corners, larger two-line titles, more title spacing, and focus rings measured in
the current display density. Focus lift/scale was reduced to avoid collisions
with neighboring cards. Settings rows retain room for two-line Arabic labels.
Home gains safe top spacing and TV horizontal margins.

Arabic uses Cairo static 500/600/700 assets already licensed in the sibling app;
the OFL and attribution are bundled in Classic. Locale font aliases preserve the
English DM Sans/Outfit family. No new runtime dependency was added. Background
motion respects both user and system restrictions and stays off on weak devices.

`ClassicHomeVisualTest` imports a generated local M3U catalog and original QA
posters, visits all three interface sizes in Arabic and English, checks visible
action bounds, and reaches Settings using physical D-pad presses across the dock.
The fixture restores the previous active source and display preferences and
removes its source/art by default. An explicit debug-only keepFixtures argument
supports temporary screenshot comparisons; these fixtures never enter Git or
the production database. The expanded API 36 TV group passed all 26 tests at the
visual-polish checkpoint; final locale-alias packaging and physical repeat remain
part of the release qualification below.

Physical UI profiling then exposed a sustained weather-render loop: the debug
fixture recorded 4,997 janky frames out of 5,006, median 65 ms. The initial TV UI
run could not reach idle and was stopped; it is not a passing run. Weather now
removes its frame callback on pause and refuses to restart while OFF, reduced,
hidden, detached or on a low-tier device. 32-bit TVs with at most 2.25 GiB use the
lightweight path even when the OS does not declare isLowRamDevice. That threshold
is a conservative product policy based on the measured Android 11 ARMv7 TV;
capable 64-bit devices retain their existing tiers. A real attached-view regression
asserts that OFF/reduced/hidden/detached weather cannot restart its loop.
The subsequent 27-test group passed on both the physical TV and API 36 emulator.
Unit tier/policy coverage was expanded; final resource-family qualification follows.

Poster rows now reserve 112dp below content for the 66dp dock, 24dp bottom margin
and focus clearance. This corrects the previous 64–92dp resource buckets, which
could place the last row's title beneath the enlarged dock.

A generated H.264/AAC 1280x720 moving test-pattern clip visibly rendered on the
emulator with the default VLC path. The first manual attempt used an ADB-created
external directory with the wrong ownership and failed permission checks. Moving
the fixture into the debug app's private cache fixed the test setup; no new app
storage permission was added. Capture while playing: local
`/tmp/classic-emulator-video-frame.png`. Local captures/dumps are excluded from Git.

## Lint correctness

The June report already present in build-output contained Windows paths and was
not treated as current evidence. A new run found 27 errors and 1,229 warnings
while abortOnError=false still returned success. The repaired current report has
zero errors; the large existing warning backlog remains separately recorded.

API 27/29 theme attributes now live in qualified resources, with day/night base
styles preserving existing colors. AppCompat tint and RTL title alignment were
corrected. The in-app receiver uses ContextCompat's non-exported registration.
The manager opts into its existing Media3 API explicitly.

Two narrow false-positive exceptions remain documented rather than hiding real
errors: flavor/debug manifests inherit TV declarations from main (verified by a
real PackageManager test), and tvprovider 1.1.0's inherited setters used by the
public WatchNextProgram.Builder example carry restrictive annotations. Only that
publishing method is suppressed; the documented builder API remains unchanged.

## Research and assumptions

Existing dependencies were retained: Media3 1.10.1, LibVLC 3.5.1. The installed
LibVLC artifact was inspected for IVLCVout.areViewsAttached and its native pause
binding imports libvlc_media_player_set_pause. Native pause is asynchronous.

- Lifecycle of visible video: https://developer.android.com/develop/adaptive-apps/guides/support-multi-window-mode
- Track disabling/overrides: https://developer.android.com/media/media3/exoplayer/track-selection
- Separate media transport callbacks: https://developer.android.com/media/legacy/audio/mediasession
- Public TV builder example: https://developer.android.com/training/tv/discovery/watch-next-add-programs
- Private receivers: https://developer.android.com/reference/android/content/Context#RECEIVER_NOT_EXPORTED
- TV typography: https://developer.android.com/design/ui/tv/guides/styles/typography
- TV card hierarchy: https://developer.android.com/design/ui/tv/guides/components/cards
- TV safe areas: https://developer.android.com/design/ui/tv/guides/styles/layouts

## Final source gates

`npm run verify:android` passed for Classic and Pro. Classic has 80 passing unit
tests and zero Lint errors (1,227 existing warnings remain); Pro's 405 unit tests
and Lint are unchanged and pass. After the complete 27-test run on each device,
the final font, clock and focus resources were requalified with Home/overlay
instrumentation on each device (2/2 each). Clock digits now use Locale.ROOT to
avoid clipped Arabic fallback glyphs in fixed digital cells. The original Latin
wordmark stays consistent, and dock selection preserves the localized font.
TV and Liquid motion tokens share one scale/elevation source.

The original 2.5.1 APK and pre-release Classic release/config rows were backed up
privately under the local state directory. Existing GitHub release assets remain
available. Candidate publication and the remaining final checks are recorded next.

## Remaining boundaries

- This is not certification of every provider, stream codec, HDR/4K mode, low-RAM
  device or long-running session. Local PCM and a generated H.264/AAC clip are
  credentials-free regression media, not a real provider qualification matrix.
- Existing Lint warnings still need scoped cleanup; they are not hidden as a
  baseline and are not represented as fixed.
- Source import, QR handoff, large-library search and long-term series-detail
  freshness were inspected but not fully exercised with a real provider here.
- Version 2.5.2/code 27 is being packaged; no production publication is claimed
  until signed assets, update metadata, CI and post-deploy readback are recorded.

Final qualification/release evidence is appended below after completion.

The complete suite subsequently passed **28/28 on each device**, including the
single-badge/no-guide case. CHANNEL and LIVE receive the correct label; the
redundant subtitle and empty guide metadata stay hidden. Guide results are
captured for one content id and committed only if the request still owns it.
Cold visual tests now wait for the deliberately deferred clock to populate before
asserting digit shape; they retain the ASCII/visibility/focus assertions.

Final UI rendering passed six language/size combinations at each of 1280x720,
1920x1080 and virtual 3840x2160, plus the same six combinations on the physical
1080p TV. The emulator's original resolution was restored. Software graphics
startup was unstable on this host; the existing host-GPU/Vulkan-disabled profile
booted and ran the actual tests. No crashed emulator run is represented as passing.

On a warm physical Home with the generated catalog and no player running, a
10.08-second idle sample rendered 10 frames and consumed 32 CPU ticks (about
3.17% of one core at the device's 100 Hz accounting rate). This documents removal
of the continuous overlay loop; it is not a universal frame-rate guarantee.
The signed player also rendered the generated H.264/AAC video and continuous HLS
on the physical TV. Duplicate Pause froze identical frames; duplicate Play advanced
the test pattern. Empty QA content ids prevent test Watch Next/history entries.
