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


### Qualified device results

- Final Android verification passes: 409 Pro unit tests, Classic checks and Lint
  (zero errors; 101 existing warnings). Signed minified release build passes.
- All 14 connected checks passed on API 36 TV emulator and on the actual Android
  11 ARMv7 Smart TV Pro; physical run 50.601 s. This includes real Media3 audio
  playback/reuse/resume, Keystore, updater validation, Room and remote UI checks.
- An additional real local-HTTP M3U integration test passed on the emulator and
  on the physical TV (1.683 s): initial import, fresh background skip with no
  extra request, simulated stale catalog, second HTTP response with new channel,
  updated Room count and retained favorite. This uses an isolated database and
  loopback server; it does not mutate the user's provider catalog.
- Temporary debug/test packages were removed after each physical run. Production
  app/data were retained. The existing signing certificate allowed an in-place
  upgrade to 2.7.5/code 75 on the TV. Cold launch completed in 2.310 s in this run;
  not a comparative benchmark. The library and history remained present.
- Real after-upgrade Home screenshot confirms one card for the previously
  duplicated series. Before: `/tmp/pro-real-tv-awake.png`. After:
  `/tmp/pro275-real-resume.png`. No private images or XML enter Git.
- PR: https://github.com/moalfarras-sys/Mohammad-alfarras/pull/77


### User-directed Home and search refinement (same unpublished 2.7.5 candidate)

The user requested removing live recent-watch and newly-added-channel Home rows.
Removed both, including their Home paging subscriptions; Live TV remains in the
dock. Home now presents resume VOD, latest movies/series and favorite channels,
without adding automatic live shelves under another name. The no-shelf state
explains browsing from the dock rather than falsely calling a live-only library
empty. Resume posters are 122 normalized TV dp, new-release posters 112; themes,
Arabic fonts and the bottom dock remain. A 180ms compositor-only shelf entrance
has no continuous loop or per-frame layout and is skipped with reduced motion.

Search remains on local FTS4: query-only Arabic/English network-name spellings,
split letter/digit queries (MBC2 / MBC 2), exact-title ranking, numeric-token
boundary priority (channel 2 before 20/21), and favorites as a relevance tie-break.
No title/index/schema is rewritten and no query/catalog is sent to an AI server.
Added actual Room ranking tests with ambiguous names/numbers and aliases;
substring fallback and source scope are retained. General typo correction or
semantic natural-language understanding are not claimed.

The existing GitHub 2.7.5 draft was never published; its assets are replaced with
the final candidate after these requested changes and requalification.


Search references: https://www.sqlite.org/fts3.html (existing FTS4 prefix/index
behavior retained). The final Home tests replace obsolete tests for shelves the
user explicitly removed. Current unit count is 405 (not the earlier 409); fewer
shelf tests reflect removed behavior, not skipped failures. Real Room search tests
verify MBC2, Arabic MBC/BeIN spelling, 2 versus 20 and exact versus extended titles.

A repeat physical UI run was invalidated when Google's DreamActivity/screensaver
became resumed instead of the test activity. Catalog/HTTP/update checks passed in
that run but Compose checks failed with no hierarchy. Recorded that failure;
temporarily disabled screensaver and extended the display timeout for the final
rerun, with original values (enabled=1, timeout=300000 ms) saved for restoration.
No app assertions were weakened or skipped to work around the device state.


### Final 2.7.5 qualification

- Final source: `85117a8f`; `npm run verify:production` passed (web/admin
  typecheck, Lint, builds and tests, dashboard build, Classic and Pro checks).
  Pro has 405 passing unit tests; Lint has zero errors and 101 existing warnings.
- Final signed/minified release build passed. All 17 connected tests passed on
  the API 36 TV emulator (17.136 s) and physical Android 11 ARMv7 TV (117.295 s),
  including local-HTTP refresh, Room search/resume, updater, Keystore, Media3
  and remote navigation. Physical qualification is not a codec/4K/HDR matrix.
- GitHub stable release was published at `2026-11-06T19:52:31Z`:
  https://github.com/moalfarras-sys/Mohammad-alfarras/releases/tag/moplayer-pro-v2.7.5
  All three files were anonymously downloaded completely and verified:

| APK | Bytes | SHA-256 |
| --- | ---: | --- |
| Universal ARM | 56203839 | `21353385f397483c0b0afb0d1219ac4ddd7f00d20f16dfcc1d50e96e2af2ffff` |
| ARM64 | 34966194 | `ac35aee64d11b4857a390d2a7425633abe73fcfce0099710e98c25d8a700a93b` |
| ARMv7 | 31247764 | `9230d24585c00350a3f088149814e15bed590b11807d7fb70d9c98d0baa40e3c` |

Existing production signing certificate SHA-256 is unchanged:
`97dad77680a62c4ead62634f59b4d4a44315dba6687bde9cb4576a6a527a593d`.

The final release was installed in-place on the user's TV without clearing data.
One first-open observation remained at the preparing-library screen; force-stop
and reopen restored the catalog. No contemporary app crash was found. Do not
report a proven root cause or use activity launch time as time-to-library-ready.
Further cold starts were inspected separately. Final Home D-pad capture
`/tmp/pro275-final-home-clean.png` shows the larger VOD resume cards, orange focus,
Arabic labels and bottom dock; automatic live rows are absent. Local QA images
and XML are deliberately excluded from Git.

Two subsequent cold rechecks each showed the full catalog/Home in a screenshot
captured six seconds after activity start. The initial delay did not reproduce;
its cause remains unconfirmed. Original TV display values were restored and
read back (`screensaver_enabled=1`, `screen_off_timeout=300000`). Only the
production package remains; temporary debug/test packages were removed.

All PR checks on final Android source `85117a8f` passed, including GitHub's
API 29 phone and API 36 TV connected jobs, Android Classic/Pro, desktop builds,
web/admin/dashboard and both Vercel previews.

### Production activation

Migration `20261106220000_moplayer_pro_275_release.sql` passed a rolled-back dry
run, then was applied atomically with its migration-history entry after saving
a private release/config backup. Production config now returns latest 75,
minimum 45 and `forceUpdate=false`; the full public latest-download response
matched 56,203,839 bytes and the universal SHA-256 above. Both domains and the
required activation/product/config routes returned HTTP 200. Product-page static
version text still reflected the previous deployment at this checkpoint; final
main deployment readback follows the merge. Old release files and prior metadata
are retained for recovery.
