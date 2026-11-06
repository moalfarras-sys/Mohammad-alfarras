# MoPlayer Pro 2.7.5: real TV, series and smart refresh

## Baseline and actual device

Work starts from clean main 41cfa061 / released 2.7.4, on
`fix/pro-smart-sync-series-20261106`. Main native and web CI both completed
successfully. The preserved workstation stash is untouched.

With the user's explicit authorization, connected by ADB to their Smart TV Pro
(BeyondTV6/BeyondTV4), Android 11, ARMv7, 1920x1080, 2 GiB RAM. Initial installed
version was 2.7.3/code 72. The user performed the update via Settings and confirmed
installation; subsequent package readback and the actual About panel showed
2.7.4/code 74 and latest 2.7.4. This is user-performed update evidence, not an
agent-observed installer walkthrough. D-pad traversed all seven Settings panes
and OK opened About. Screenshots/XML remain private local QA files in /tmp.
No provider credentials/database were exported from the device.

## Proven problems and changes

### P0: series key mismatch

`refreshSeriesDetails` accepts `seriesId.ifBlank { id }`, but the episode observer
ignored any series with a blank seriesId. It could download episodes then show an
empty detail page. Both now resolve the same (source id, series id) key, with
unit coverage for fallback, invalid ids and independent sources.

### P1: continue-watching clutter

Real Home showed many partially watched episodes of one series as separate cards.
The Room query now selects only the most recently played episode per source and
series, before paging. Other films/series can surface without downloading or
sorting the whole library in memory. Completion does not resurrect earlier
unfinished episodes. No progress/history row is deleted; dedicated series detail
still lists all episodes. Unknown/blank series ids remain separate. A Room test
uses two sources with 1,000 episodes each, verifies both source-scoped and merged
shelves, completes the newest episode and verifies old progress is retained.
The first test fixture omitted markPlayed (the real app records start separately
from position); corrected the fixture rather than changing production history
writes to match the test.

### P1: stale long-running sessions and episodes

The foreground refresh guard was once per source per process. A TV left open
could rely solely on delayed OS work even after catalog data became stale. It now
re-checks age at most once per five minutes on foreground/timer, while actual
catalog fetching keeps its existing three-hour per-section TTL and failure
backoff. No foreground catalog refresh starts while playing or another library
job is busy; delayed checks re-check playback before starting. Local M3U files
stay local. Network calls are not triggered per D-pad movement.

The open series revalidates silently on the same tick with a 15-minute repository
TTL instead of six hours, preserving cached episodes during failure. It only
requests that series, not every series in the library. UI entry selection updates
when the episode snapshot changes without forcing a season change after the
viewer has navigated. State is scoped to source + series id.

### P2: app update discovery

Visible-app ticks run every five minutes; admin config keeps its existing
30-minute network throttle. An available new APK is announced once per version
per activity state, deferred until playback closes. The notice points to
Settings > About without taking focus. Download/checksum verification and Android
installation confirmation remain in the existing updater. APK installation is
not silently bypassed. Instant provider changes are not promised: provider IPTV
catalogs expose polling, not a server push feed this client can subscribe to.

## Research

- AndroidX PeriodicWorkRequest source: periodic work is bounded by network/device
  constraints, minimum interval 15 minutes and flex 5 minutes; it is not an exact
  real-time schedule. Foreground age probes supplement WorkManager.
  https://github.com/androidx/androidx/blob/androidx-main/work/work-runtime/src/main/java/androidx/work/PeriodicWorkRequest.kt
- Room/Paging invalidation keeps reactive shelves in sync with committed changes.
- Android PackageInstaller user-action requirements remain respected:
  https://developer.android.com/reference/android/content/pm/PackageInstaller.SessionParams#setRequireUserAction(int)

## Validation and release

Results are appended after final device qualification. Existing 2.7.4 assets,
source credentials, activation logic and protected settings are retained. A
stable 2.7.5 uses code 75, signed by the existing certificate. Physical-TV testing
does not certify all ARM codecs, all providers, HDR/4K or every other device.
