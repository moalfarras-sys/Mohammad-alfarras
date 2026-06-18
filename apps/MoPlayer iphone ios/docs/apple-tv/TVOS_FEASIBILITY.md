# Apple TV / tvOS Feasibility — MoPlayer

**Status: NOT production-ready for tvOS. Do not ship as tvOS yet.** This is a feasibility
report, not a built target. The iPhone app must not be destabilized to chase tvOS.

## The core problem
Flutter does **not** have official, stable tvOS support. There is no supported `tvos` target in
the Flutter SDK, the engine is not officially built/distributed for tvOS, and key plugins used
here (notably **media_kit/libmpv**, `flutter_secure_storage`, `connectivity_plus`,
`wakelock_plus`) are not guaranteed to compile or behave on tvOS. tvOS also mandates the
**focus engine** (D-pad/Siri Remote) and AVKit-style playback — paradigms Flutter's touch UI
does not provide out of the box.

## Options (ranked)
1. **Native tvOS app in Swift/SwiftUI + AVKit, sharing the backend/API contract** — RECOMMENDED.
   Reuse this project's REST/Xtream/M3U logic as a documented API contract; rebuild the UI
   natively with the focus engine. Most reliable App Store path for TV.
2. **Separate experimental Flutter-tvOS project** — only via community/forked engine builds.
   High maintenance, fragile, not recommended for production; keep entirely separate from this repo.
3. **Do nothing on tvOS now** — ship iPhone first; revisit when/if Flutter tvOS matures.

## If/when a native tvOS app is built, reuse from here
- **Models**: channel/VOD/series/episode shapes (`lib/models`).
- **API behavior**: Xtream endpoints + URL building (`services/xtream`), M3U parsing rules
  (`services/m3u`), activation flow (`services/activation`).
- **Design language**: dark premium theme, orange/gold accents, spacing/typography.
- **Player requirements**: HLS/MPEG-TS, resume, buffering/retry, cleanup — map to **AVPlayer/AVKit** on tvOS.
- **Navigation requirements**: top-level Live/Movies/Series/Search/Favorites; everything must be
  reachable and operable with the **Siri Remote** and satisfy tvOS **focus** + safe-area/overscan.

## Recommendation
Ship **iPhone** now. Treat Apple TV as a **separate future native effort** using this repo's
Dart core as the API/design reference. Do not mark tvOS as done unless it truly builds and runs
on a real Apple TV / tvOS simulator with a reliable signing path.
