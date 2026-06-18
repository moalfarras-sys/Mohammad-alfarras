# MoPlayer iOS UI Completion QA

Date: 2026-06-18

Scope: MoPlayer Pro iOS Flutter app in `apps/MoPlayer iphone ios`. This pass focused on phone landscape sizing, Live preview density, Settings completion, login polish, latest-content ordering, real-server emulator QA, and local verification. No production website deploy, no Vercel deploy, and no live route changes were performed.

## What Changed

- Added real persisted settings in Hive:
  - Prefer HLS.
  - Autoplay episodes.
  - Remember last live channel.
  - Slim live preview.
  - Compact poster grids.
  - Sync library on launch.
  - Cinematic motion.
- Wired settings into runtime behavior:
  - Live playback remembers the last channel only when enabled.
  - Splash cloud sync respects the Sync on Launch setting.
  - Live preview width and content density follow the Slim Live Preview setting.
  - Home, Movies, Series, and Favorites use Compact Poster Grids.
  - Router transitions use the Cinematic Motion setting.
- Rebuilt Settings into a real operational panel:
  - Source summary.
  - Device metadata.
  - Product/platform identity.
  - Favorites, Continue Watching, and History counters.
  - Playback, Interface, Cloud/Privacy, and Maintenance sections.
  - Sync Now, Clear Cache, Clear History, Wipe Local Data, and Logout actions.
- Slimmed the Live channel preview:
  - Preview now targets roughly a quarter of the available landscape width.
  - Channel logo, title, stream badges, now/next EPG, progress, and Watch action are preserved in a compact layout.
  - Last watched channel auto-selects when available and enabled.
- Corrected server-wide ordering:
  - Home now loads all cached/server movies and series, then shows the newest content by provider `added` and `last_modified` timestamps.
  - Movies and Series now open on All content by default instead of forcing the first provider category.
  - Series has a Recent sort mode and uses provider `last_modified` data in cached rows.
- Fixed phone-landscape regressions found during emulator QA:
  - Search now avoids keyboard bottom overflow in landscape phone mode.
  - Series detail uses a compact landscape layout so Play and Season sections remain reachable.
  - Player and resume titles use an ASCII separator to avoid text-encoding artifacts.
- Improved phone-landscape UI sizing:
  - Shared compact breakpoint raised to 470px height.
  - Navigation rail, category rails, poster grids, Home hero, Home quick actions, QR activation, and login fields are denser on landscape phones.
- Improved login:
  - Added an animated 3D brand preview panel.
  - Added 3D method transitions for Xtream, M3U, and Activation.
  - Compressed field/button heights in landscape phone mode so Save & Enter is visible at 932x430.
- Polished native preview startup:
  - Android 12+ emulator splash now uses the MoPlayer launcher mark on a dark background instead of the default white icon disc.
  - Cold start after clearing app data returns to the clean Login screen.
- Added App Store readiness surfaces:
  - Legal Demo M3U source opened through the real source pipeline.
  - Login and Settings media-player-only disclaimer.
  - Settings Source Management for source switching/deletion/add-source.
  - Support, Privacy, Terms, App Disclaimer, and Data Deletion sheets.

## Local Visual QA

- Served the debug web build locally from `build/web` on `http://127.0.0.1:8787`.
- Browser viewport tested at `932x430`.
- Verified Login screen:
  - No text overlap.
  - Save & Enter visible without scrolling.
  - Left brand preview renders and stays within height.
- Verified Activation tab:
  - Device ID, backend URL, and Create QR Code fit cleanly in landscape.
  - QR panel code path uses compact sizing for generated sessions.
- Installed the debug APK on Android emulator `emulator-5554`, configured as a phone-size landscape iPhone preview at `2400x1080`.
- Verified emulator screens against a real provider source without saving provider credentials in code or docs:
  - Login, Home, Live, Movies, Series, Movie Detail, Series Detail, Episodes, Search, Favorites empty state, Settings, Live player, Movie player, and Episode player.
  - Home featured content and Recently Added Series matched the provider's newest movie/series timestamps.
  - Live preview rendered as a slim side panel instead of occupying half the screen.
  - Settings showed real source/device/library counters and working maintenance actions.
  - Search with keyboard open had no `BOTTOM OVERFLOWED` Flutter error.
- Verified Android 12+ cold start after `pm clear`:
  - Splash is dark and branded.
  - Login opens with empty runtime fields.
  - No provider credential remained in local app state.

## Command Verification

```powershell
dart format lib test
flutter analyze
flutter test
flutter build web --debug --dart-define=MOPLAYER_PLATFORM=ios
flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios
```

Results:

- `flutter analyze`: passed, no issues.
- `flutter test`: passed, 6 tests.
- `flutter build web --debug --dart-define=MOPLAYER_PLATFORM=ios`: passed.
- `flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios`: passed.
- Final debug APK install on `emulator-5554`: passed.

Real-server QA summary:

- Xtream login active: true.
- Live categories: 124.
- Live channels: 12,616.
- Movie categories: 70.
- Movies: 20,041.
- Series categories: 41.
- Series: 10,450.
- Live HLS probe: HTTP 200, playlist returned, time to first byte about 0.30s.
- Movie file probe: HTTP 206, media bytes returned, time to first byte about 0.51s.
- Episode file probe: HTTP 206, media bytes returned, time to first byte about 0.33s.
- Provider detail APIs returned movie info and series episodes.

## Notes

- The web build still reports the existing Flutter wasm dry-run warning for `flutter_secure_storage_web` using `dart:html`/`dart:js_util`. JavaScript web debug build succeeds. This is not an iOS runtime blocker.
- On the Android emulator, media controls, buffering state, duration/progress, and recovery paths worked, and direct stream probes returned valid media. The emulator still rendered video black for the tested streams while logging emulator EGL/media rendering limitations from the media stack. Real native iPhone/iOS Simulator video QA still requires macOS, Xcode, CocoaPods, Apple signing, and a real iOS run.
- After emulator QA, local app data was cleared from `com.moalfarras.moplayerpro.iospreview`.
- No secrets, provider URLs, usernames, passwords, playlist URLs, Supabase keys, or tokens are recorded here.
