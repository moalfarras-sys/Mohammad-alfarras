# MOPLAYER_IOS_AUDIT.md

Audit date: 2026-06-15  
Project path: `apps/MoPlayer iphone ios`  
Target product: MoPlayer Pro iOS  
Canonical ecosystem slug: `moplayer2`

## Existing Features

- Flutter app exists with iOS, Web, Android emulator preview, and Windows desktop scaffold.
- Premium Glass Orange visual system exists across theme, buttons, cards, skeletons, empty states, and error states.
- Landscape-first app flow is implemented in Flutter and native iOS/Android metadata.
- Login supports Xtream, M3U URL, and MoPlayer QR activation.
- QR activation now uses the production web API flow on `https://moalfarras.space/api/app/activation/*`.
- One-time provider source pull and best-effort source acknowledgement are implemented.
- Device IDs now use the production `MO-D-...` public device format.
- Runtime platform separation exists through `ios`, `android`, `windows`, `web`, `macos`, `linux`, and `fuchsia`.
- Home, Live TV, Movies, Series, Search, Favorites, Settings, Movie Detail, Series Detail, Episodes, and Player screens exist.
- Xtream catalog, movie detail, series detail, EPG, and stream URL building are implemented.
- M3U parsing and live playback are implemented.
- Favorites, history, settings, caching, and continue-watching local storage exist through Hive/secure storage.
- Supabase bootstrap uses `publishableKey`, with `SUPABASE_ANON_KEY` only as a legacy fallback.
- Player uses `media_kit` with fullscreen, landscape, wakelock, history/progress persistence, retry/backoff, stall recovery, and audio/subtitle track selection.
- Branded iOS, Android, Web, and Windows app icons were generated from the MoPlayer logo.
- iOS launch assets, URL scheme, ATS media/local-network policy, bundle id, and privacy manifest are present.

## Broken Features

- Native Windows build is blocked on this machine because Windows symlink creation requires Administrator rights or Developer Mode. `flutter doctor -v` is otherwise clean and detects Visual Studio Build Tools.
- Full iOS build/run was not possible on this Windows machine; macOS/Xcode is required.
- QR activation UI was visually verified, but I did not create a production activation code during visual QA to avoid writing unnecessary live activation records.

## Missing Features

- Native iOS archive validation in Xcode.
- App Store screenshots, review notes, final content/legal wording, and owner-approved privacy nutrition answers.
- Flutter CI workflow for this app.
- Real provider-backed manual QA with a live Xtream/M3U account and QR-delivered source.
- Production schema/API cleanup for a first-class shared continue-watching table if the ecosystem wants cross-platform resume outside the current `watch_history` adapter.
- Native Windows run/build on this machine after enabling Developer Mode or running the shell as Administrator.

## UI Problems

- The main visible surfaces now follow the Glass Orange direction and compile.
- The web visual smoke test confirmed the first login viewport and Activation tab render correctly.
- The app still needs real-content visual QA with large playlists to tune dense grids, poster fallbacks, and very long names.
- Native iOS device screenshots were not verified because this environment is Windows-only.

## Performance Problems

- Xtream live, movies, and series are still fetched as full arrays before filtering. Large providers may need pagination/indexing later.
- Search still filters in memory across live, movies, and series.
- Web debug build warns that `flutter_secure_storage_web` is not compatible with Flutter wasm dry-run. JavaScript web build succeeds.
- The player now retries errors/stalls, but provider-specific stream fallback rules still need real IPTV QA.

## Architecture Problems

- The Flutter app lives in a folder with spaces, which works but is fragile for CI/scripts.
- The app is currently untracked in this checkout, so there is no committed baseline history for the iOS project.
- Supabase direct table sync is still best-effort and adapter-based. Long term, shared library sync should move behind stable backend APIs or migrations matching the ecosystem contract.
- No GitHub Actions workflow currently verifies Flutter analyze/test/build for this app.

## Security Problems

- Provider credentials are stored only in local secure storage after manual login or QR source import. This matches the MoPlayer rule better than persistent Supabase credential rows.
- QR activation uses a generated source pull token and one-time source pull/ack.
- ATS is not globally disabled; iOS allows arbitrary loads for media and local networking only.
- Android preview enables cleartext traffic for IPTV preview compatibility.
- `.env.example` exists, but no real Flutter env file was provided in this turn. Existing ignored repo env files were inspected only for schema/key presence and secrets were not copied into tracked files.
- Privacy manifest is present, but final App Store privacy labels must still be confirmed by the owner before submission.

## Supabase Integration Status

Connected:

- Supabase client initialization from compile-time defines.
- Anonymous session attempt.
- Production-style device payload fields in the service adapter: `public_device_id`, `name`, `platform`, `device_type`, `app_version`, `product_slug`.
- Activation is aligned to the existing web API, not a new Supabase project or duplicated tables.
- Favorites/history/continue-watching local repositories can best-effort sync through adapters.

Inspected production state:

- `devices`, `activation_requests`, and `app_settings` exist.
- `favorites` exists with `content_id`, `content_type`, `title`, `poster_url`, and `server_id`.
- `watch_history` exists with `content_id`, `content_type`, `position_ms`, `duration_ms`, `title`, `poster_url`, and `server_id`.
- A separate `continue_watching` table was not present in the REST schema inspection.

Still incomplete:

- Cross-platform continue-watching is currently mapped through `watch_history`; a dedicated shared schema/API would be cleaner.
- RLS/live auth behavior must be verified against real production users and policies.
- No provider credentials are intentionally persisted in Supabase by the Flutter client.

## Local Testing Results

- `flutter --version`: passed. Flutter 3.41.9 stable, Dart 3.11.5.
- `flutter clean`: passed.
- `flutter pub get`: passed after plugin metadata was rebuilt.
- `flutter analyze`: passed, no issues.
- `flutter test`: passed, 2 tests.
- `flutter build apk --debug`: passed. Output: `build/app/outputs/flutter-apk/app-debug.apk`.
- `flutter run -d emulator-5554 --debug --no-resident`: passed on Android 15 API 35 emulator.
- Android emulator visual smoke test: passed after fixing a compact landscape login overflow.
- `flutter build web --debug`: passed. Output: `build/web`.
- Web visual smoke test: passed for login and Activation tab on `http://127.0.0.1:8787`.
- `flutter build windows --debug`: blocked by Windows symlink permission. Test symlink creation failed with Administrator-rights required.
- `flutter devices`: Android emulator, Windows, Chrome, and Edge detected.
- `flutter doctor -v`: no issues found.

## App Store Preparation Status

- iOS bundle id: `com.moalfarras.moplayerpro.ios`.
- Display name: `MoPlayer Pro`.
- Version: `1.0.0+1`.
- iOS deployment target: 13.0.
- App icons: branded.
- Launch images: branded.
- Orientation: landscape left/right.
- URL scheme: `moplayerpro://`.
- ATS: media/local-network exception only.
- Privacy manifest: `ios/Runner/PrivacyInfo.xcprivacy`.
- Missing before submission: Apple Developer Team/signing, Xcode archive, App Store screenshots, final privacy labels, review notes, and production device QA.

## Production Readiness Score

Score: 78 / 100

Reason: the app now compiles, tests pass, Android emulator run works, Android and web builds work, key missing screens are implemented, QR activation matches the existing ecosystem flow, and App Store metadata is materially improved. It is not yet 100 because native iOS archive, native Windows build, real provider QA, CI, final privacy/store assets, and production Supabase/RLS verification remain.

## Completion Plan

1. Enable Windows Developer Mode or run as Administrator, then verify `flutter build windows --debug`.
2. Re-run Android emulator QA with real dart defines and provider data.
3. On macOS, run `flutter build ios --release --no-codesign`, then archive/sign in Xcode.
4. Test manual Xtream, manual M3U, QR activation, playback, subtitles, multiple audio tracks, favorites, history, and continue-watching with real provider data.
5. Add CI for `flutter analyze`, `flutter test`, Android debug build, and web debug build.
6. Finalize App Store privacy labels, screenshots, and review notes with the project owner.
