# MoPlayer iOS Supabase QA

Date: 2026-06-16

Scope: Supabase completion and local verification for the MoPlayer Pro iOS Flutter app, using Windows plus the Android emulator as an iPhone landscape preview. No Vercel deploy, no production website publish, and no live route changes were performed.

## Secret Handling

- Supabase values used by name only: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ACCESS_TOKEN`.
- `SUPABASE_SERVICE_ROLE_KEY` was not provided and was not used.
- Database password was not provided and was not used.
- No Supabase key values, provider URLs, usernames, passwords, playlist URLs, or tokens are recorded in this report.
- The Flutter client does not contain a service-role key.
- Temporary Dart defines were generated under ignored `build/` for emulator launch and deleted after QA.

## Auth Status

- Supabase Auth health: HTTP 200.
- Anonymous Auth before fix: disabled, returning HTTP 422 `anonymous_provider_disabled`.
- Anonymous Auth after fix: enabled.
- Signup remains enabled.
- CAPTCHA is not enabled.
- Anonymous-user rate limit observed through Management API: 30.

## RLS And Schema Status

- `devices`: exists, RLS enabled, now includes nullable `user_id` for app-owned device rows.
- `activation_requests`: exists, RLS enabled, remains admin/service controlled; Flutter uses the existing web API for activation.
- `favorites`: exists, RLS enabled, user-owned policy `user_id = auth.uid()`.
- `watch_history`: exists, RLS enabled, user-owned policy `user_id = auth.uid()`.
- `continue_watching`: not present; continue watching is stored in `watch_history` with positive `duration_ms`.
- `playlists`: not present and not used by the Flutter client.
- `playlist_sources`: not present and not used by the Flutter client.

## Migration Applied

- Added `supabase/migrations/20260616120000_moplayer_ios_cloud_sync_rls.sql`.
- Applied it to Supabase through the Management API.
- Added `devices.user_id`, an owned-device index, and authenticated user policies for app-side device select/insert/update.
- Rollback notes are included in the migration comments.

## App Changes

- `SupabaseService.upsertDevice` now writes `user_id` with the current anonymous session.
- Continue-watching cloud IDs are now platform-scoped with the `ios:` prefix, matching favorites and watch history.
- The local real-server QA script now verifies owned device upsert, duplicate-free device readback, and iOS-scoped favorite/history/continue rows.
- Main shell Android Back handling now returns primary tabs to Home and prevents root-level emulator Back from leaving the iOS-preview app.

## Records Verified

- Device registration: created/updated iOS preview device rows with `platform = ios`, `product_slug = moplayer2`, `device_type = android-emulator-ios-preview`, and non-null `user_id`.
- Favorites: saved a live favorite, read it back locally after restart, and verified an `ios:`-scoped Supabase row.
- Watch history: live, movie, and episode rows were written to Supabase under `ios:` content IDs.
- Continue watching: movie and episode progress rows were written/read through `watch_history` with positive progress/duration and `ios:` content IDs.
- Duplicate prevention: QA script upserted the same device twice in one session and read back one row.
- QA content rows created by the CLI probe were cleaned up; emulator app rows were left as the verified app-side records.

## Activation Result

- Existing `/api/app/activation/create` returned `waiting` for a QA iOS preview device.
- Existing `/api/app/activation/status?product=moplayer2&code=...` returned `pending`.
- Flutter-constructed activation URL remains product-scoped with `product=moplayer2`.
- QA activation/device rows from the activation probe were cleaned up.
- No conflict with Classic Android activation was observed; product separation stayed on `moplayer2`.

## Platform Separation

- iOS preview writes use `platform = ios`.
- Android emulator preview device type remains `android-emulator-ios-preview`, so QA hardware does not masquerade as Android TV/mobile.
- Supabase `moplayer2` device platforms observed after QA: `android`, `ios`.
- iOS favorites/history/continue records use `ios:` content IDs and do not collide with Android TV, Android Mobile, Windows, or Web content IDs.
- Device IDs use the `MO-D-...` format.

## Local App QA

- Fresh preview package install/clear: passed.
- Xtream login: passed.
- Home loads: passed.
- Live loads: passed.
- Movies load with posters: passed.
- Series and series detail load: passed.
- Live player opens: passed.
- Movie player opens: passed.
- Series episode player opens: passed.
- Search works: passed with real results.
- Favorites save and reload after app restart: passed.
- Continue watching saves and reloads after app restart: passed.
- Settings works and shows `ios - moplayer2`: passed.
- Logout/clear active session returns to Login: passed.
- Back navigation from player returns inside the app: passed.
- Root Back on primary tabs now stays inside the iOS-preview app: fixed and passed.
- Old Android package did not open; foreground package remained `com.moalfarras.moplayerpro.iospreview`.
- Landscape overflow: none observed on checked Home, Login, Live, Movies, Series, Search, Favorites, Settings, and Player routes.

## Real Server QA Summary

- Xtream account: active.
- Live categories: 124.
- Live channels in sampled category: 26.
- Movie categories: 70.
- Movies in sampled category: 489.
- Series categories: 41.
- Series in sampled category: 611.
- First movie detail: poster and plot present.
- First series detail: 3 seasons, 59 episodes.
- M3U parsed: 378,977 channels, 235 categories.
- Stream probes: live HTTP 200, movie HTTP 206, episode HTTP 206.
- Poster probes: one external live logo returned HTTP 400; movie and series poster probes passed.

## Bugs Found

- Anonymous Auth was disabled, causing HTTP 422 and blocking direct user-owned sync.
- `devices` lacked a safe app-owned RLS path for anonymous sessions.
- Continue-watching cloud rows were not platform-scoped.
- Root-level Android Back could leave the iOS-preview app from a main tab.
- One unrelated security issue remains: several legacy dashboard-style tables have broad public `ALL` policies. They were not changed in this iOS pass to avoid breaking unknown legacy control surfaces.

## Bugs Fixed

- Enabled Supabase anonymous Auth for the project.
- Added app-owned device RLS and schema support.
- Added `user_id` to Flutter device upserts.
- Platform-scoped continue-watching IDs with `ios:`.
- Hardened top-level Back behavior in the main shell.
- Updated the local real-server QA probe to verify the corrected cloud behavior.

## Commands Run

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios
dart tool\local_real_server_qa.dart
flutter run -d emulator-5554 --debug --dart-define-from-file=build/runtime_dart_defines.env --no-resident
```

Notes:

- `flutter pub get` initially hit the known Windows symlink/Developer Mode blocker while Windows desktop was enabled. Flutter Windows desktop was temporarily disabled for Android-only verification, `pub get` passed, and Windows desktop was restored afterward.
- Final `flutter analyze`, `flutter test`, and `flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios` passed after the code changes.

## Remaining Blockers

- Real iPhone/iOS Simulator QA still requires macOS, Xcode, CocoaPods, and Apple signing.
- The legacy broad public RLS policies should be reviewed in a separate security-hardening pass.
- Native video-surface screenshots on emulator can appear blank; route state and logs were used for player verification.

## Deployment Confirmation

- No deployment performed.
- No Vercel publish performed.
- No live `moalfarras.space` route code changed.
- No secrets committed.
