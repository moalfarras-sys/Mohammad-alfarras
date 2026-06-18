# MoPlayer iOS Local QA

Date: 2026-06-15

Scope: local-only QA for the MoPlayer Pro iOS Flutter app using Windows and an Android emulator as an iPhone landscape preview. No deployment, no publishing, and no production website changes were performed.

## Test Environment

- Host OS: Windows
- Flutter target for local preview: Android emulator only
- App platform mode: `ios`
- Product slug: `moplayer2`
- Local config: `.env` or `.env.local` only, both ignored by Git except `.env.example`
- Server credentials: temporary QA credentials, redacted from reports and generated artifacts
- Android preview package: `com.moalfarras.moplayerpro.iospreview`
- Existing Android production package collision removed from emulator only: `com.moalfarras.moplayerpro`

## Test Server Type

- Xtream: tested
- M3U: tested
- Server URL, username, password, and full playlist URL are intentionally not stored in this report.

## Verification Commands

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
dart tool\local_real_server_qa.dart
```

Results:

- `flutter clean`: passed
- `flutter pub get`: passed
- `flutter analyze`: passed, no issues found
- `flutter test`: passed, 4 tests
- `flutter build apk --debug`: passed
- `dart tool\local_real_server_qa.dart`: passed with 0 recorded failures

## What Worked

- Xtream login returned an active account.
- Live categories loaded: 124 categories.
- Live channels loaded from sampled category: 26 channels.
- Movie categories loaded: 70 categories.
- Movies loaded from sampled category: 489 movies.
- Series categories loaded: 41 categories.
- Series loaded from sampled category: 611 series.
- First movie detail parsed poster, plot, and container extension.
- First series detail parsed 3 seasons and 59 episodes.
- Search worked against the live server sample.
- M3U playlist downloaded and parsed successfully.
- M3U parser handled a very large playlist: 378,977 channels and 235 categories.
- Player stream probes succeeded for live, movie, and episode URLs.
- Posters/images loaded for TMDB-backed movie and series items.
- Local app build, analyzer, tests, and debug APK build all passed.

## What Failed

- Supabase anonymous auth returned HTTP 422 for the supplied local publishable configuration, so cloud write QA could not create/read device, favorites, or history records.
- The first sampled live logo URL returned HTTP 400 from an external image host. Movie and series posters loaded correctly, and the UI fallback path covers bad logos.
- Full real iPhone playback validation is still blocked until the project is run on macOS with Xcode and a physical iPhone or iOS Simulator.

## Bugs Fixed

- Fixed fresh-login crash caused by mutating an immutable empty playlist list in `AuthRepository`.
- Made M3U parsing more flexible for single-quoted and unquoted attributes.
- Replaced unstable Dart `hashCode` M3U IDs with stable generated IDs.
- Made Xtream API parsing tolerate alternate response envelopes such as `data`, `items`, `results`, `streams`, and category wrappers.
- Made series detail parsing handle integer-keyed episode maps and flat episode lists.
- Added explicit `MOPLAYER_PLATFORM=ios` override for local Android emulator preview without turning the app into Android-specific UX.
- Added safe device-registration bootstrap that does not crash when Supabase anonymous auth is unavailable.
- Reduced initial content load size by fetching category-scoped Xtream content where possible.
- Updated Home previews and large media panels to pick a real first category instead of loading entire catalogs first.
- Fixed live-channel tile landscape overflow.
- Compact iPhone landscape navigation rail so Home, Live, Movies, Series, Search, Favorites, and Settings remain reachable on emulator height.

## Screens Tested

- Login screen with real Xtream credentials
- Home screen with real featured content
- Live TV category and channel list
- Player screen from a real live stream
- Movies screen with real posters and categories
- Main landscape shell/navigation

The player opened a real live stream and the app did not crash. The Android emulator showed native playback controls and a playing state. A video-surface screenshot appeared black, which is common with native/hardware video surfaces in emulator captures, so final rendering must still be verified on Mac/iPhone.

## Player Results

Stream probes:

- Live stream: HTTP 200, `application/x-mpegurl`
- Movie stream: HTTP 206, `video/x-matroska`
- Episode stream: HTTP 206, `video/x-matroska`

Observed app behavior:

- Player route opened real stream URL.
- No Flutter/player exception was observed during live playback.
- Retry/reconnect code path remains in place through the media player controller.
- Emulator audio backend logged host audio warnings, but the app process stayed stable.

## Supabase Records Created

- Records created: 0
- Records read back: 0
- Supabase health check: HTTP 200
- Anonymous auth: HTTP 422
- Effective platform intended for writes: `ios`
- Product slug intended for writes: `moplayer2`

Cloud write verification is blocked until Supabase allows the app to obtain a user/session for this local publishable configuration, or until a server-side app API is provided for device/favorite/history writes. The current app avoids crashing and continues with local cache behavior.

## Platform Separation

The local preview uses an Android emulator only as a Windows testing surface. Runtime platform metadata remains iOS-focused through `MOPLAYER_PLATFORM=ios`.

Expected record classification when Supabase write access is available:

- `product_slug`: `moplayer2`
- `platform`: `ios`
- `device_type`: `android-emulator-ios-preview` during Windows emulator QA only

This avoids collision with Android TV, Android mobile, Windows, or web MoPlayer records.

## iOS Compatibility Notes

- UI remains landscape-first and iOS-style, not Android-styled.
- Player changes stay on Flutter/media packages compatible with iOS.
- Android emulator package ID is only for local Windows preview.
- Real iOS signing, entitlements, AVPlayer surface behavior, audio/subtitle track switching, background handling, and App Store archive still require macOS/Xcode.

## Remaining Blockers Before Real iPhone/Mac Test

- Run on macOS with Xcode for real iOS Simulator and physical iPhone QA.
- Verify native video surface, audio output, subtitle rendering, multiple audio tracks, background behavior, and fullscreen rotation on real iPhone.
- Stress-test the 378,977-channel M3U playlist on real hardware if M3U is expected to be a common production path.

## Supabase Completion Pass

Date: 2026-06-16

Scope: Supabase completion plus local Android-emulator iOS-preview verification. No deployment, no Vercel publish, and no live website route changes were performed.

Results:

- Supabase anonymous Auth is now enabled.
- Device registration now creates/updates app-owned `devices` rows through authenticated anonymous sessions.
- Favorites save to Supabase and reload after app restart.
- Watch history saves to Supabase and reloads.
- Continue watching saves through `watch_history`, reloads after app restart, and now uses `ios:` platform-scoped content IDs.
- Activation create/status was verified through the existing product-aware web API and QA activation rows were cleaned up.
- Platform separation is correct: iOS preview writes `platform = ios`, `product_slug = moplayer2`, and `device_type = android-emulator-ios-preview`.
- Logout/clear active session returns to the Login screen.
- Root-level Android Back on primary tabs now stays inside the iOS-preview app.
- Final checks passed: `flutter analyze`, `flutter test`, `flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios`, and `dart tool\local_real_server_qa.dart`.

Updated detailed report:

- `MOPLAYER_IOS_SUPABASE_QA.md`

Remaining:

- Real iPhone/iOS Simulator QA still requires macOS/Xcode.
- Legacy broad public RLS policies on unrelated dashboard-style tables need a separate hardening pass.
