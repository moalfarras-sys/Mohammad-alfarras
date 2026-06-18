# MoPlayer iOS — QA Report

**App:** MoPlayer Pro · **Bundle ID:** `com.moalfarras.moplayerpro.ios` · **Version:** 1.0.0 (1)
**Toolchain verified on:** Flutter 3.41.9 (stable), Dart 3.x, Windows dev machine.

> iOS archiving/signing requires macOS + Xcode and could **not** be performed on this
> machine. Everything that can be verified without a Mac was verified and is reported below.
> See [app-store/MAC_PUBLISHING_GUIDE.md](app-store/MAC_PUBLISHING_GUIDE.md) for the Mac-only steps.

## Commands run & results

| Check | Command | Result |
| --- | --- | --- |
| Dependency resolve | `flutter pub get` | ✅ Got dependencies |
| Formatting | `dart format --output=none --set-exit-if-changed lib test` | ✅ 0 files need changes |
| Static analysis | `flutter analyze` | ✅ **No issues found** |
| Unit/widget tests | `flutter test` | ✅ **6/6 passed** |

### Tests covered
- M3U parser: channels, logos, categories, URLs.
- M3U parser: single-quoted attributes + stable IDs.
- Xtream series detail: integer-keyed maps + flat episode lists.
- Xtream URL builder: server normalization + credential encoding.
- Favorites: media-identity round-trip.
- Bundled legal review playlist parses as valid M3U.

## Code / feature audit (read-through)

| Area | Status |
| --- | --- |
| Architecture | Clean: `core/`, `features/`, `models/`, `providers/`, `repositories/`, `services/`, `widgets/` |
| Screens | Splash, Login/Add-source, Home, Live, Movies, Movie detail, Series, Series detail, Player, Search, Favorites, Settings |
| Source types | Xtream login, M3U URL, QR activation, source switching + delete (with confirm) |
| Player | media_kit (libmpv) for HLS/MPEG-TS, landscape, buffering, retry, resume, wakelock, dispose on exit |
| Legal disclaimer | Present verbatim in Settings → Legal & Support |
| Privacy / Terms | In-app links to `https://moalfarras.space/<locale>/privacy` and `/terms` |
| Demo / review mode | Bundled `assets/demo/review_playlist.m3u` using Apple's public BipBop HLS test stream |
| Auth model | Supabase **anonymous** sign-in (device-based; no user-created accounts) |
| Secrets | None committed; Supabase keys injected via `--dart-define`; `.env*` gitignored |

## Known limitations (require macOS / Xcode)
- iOS build, archive, code-signing, and `.ipa` export.
- Real-device playback, gestures, dynamic-island/safe-area validation on hardware.
- App Store Connect upload, TestFlight, and submission.
- App icon/launch-image rendering on a physical device.

## App Store readiness status
**Code: ready.** Static quality gates are green and the app is App-Store-policy-safe
(player-only, no bundled copyrighted content, legal demo source). Remaining work is the
Mac/Xcode build + signing + submission, fully documented under `docs/app-store/`.
