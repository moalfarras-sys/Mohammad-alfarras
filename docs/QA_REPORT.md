# MoPlayer iOS QA Report

Date: 2026-06-18

Scope: `apps/MoPlayer iphone ios` plus release documentation and safe GitHub/App Store preparation.

## Commands Run

```powershell
cd "C:\Users\Moalf\Desktop\Moalfarrasspace\apps\MoPlayer iphone ios"
flutter clean
flutter pub get
dart format lib test
flutter analyze
flutter test
flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios
flutter build web --debug --dart-define=MOPLAYER_PLATFORM=ios
cd "C:\Users\Moalf\Desktop\Moalfarrasspace"
npm run verify:production
```

## Current Results

- `flutter analyze`: passed.
- `flutter test`: passed, 6 tests.
- Android emulator preview APK build: passed.
- Web debug build: passed with the known Flutter wasm dry-run warning from `flutter_secure_storage_web`.
- Build warnings observed: Java source/target 8 deprecation warnings and Flutter web symlink/developer-mode warning on Windows. They did not fail the build.
- Windows note: after `flutter clean`, `flutter pub get` initially required Developer Mode because Windows desktop plugin symlinks could not be created without administrator rights. For this iPhone-focused QA pass, Windows desktop was temporarily disabled with `flutter config --no-enable-windows-desktop`, checks were run, and `flutter config --enable-windows-desktop` was restored.
- Monorepo `npm run verify:production`: passed. This covered public web typecheck/lint/build/tests, admin typecheck/lint/build, MoPlayer dashboard build, MoPlayer Classic Android unit tests, and MoPlayer Pro Android unit tests.
- Public website `MoPlayer iOS` page visual smoke test: passed locally on `127.0.0.1:3010` for English and Arabic mobile viewport plus English desktop viewport. Verified no mojibake, no horizontal overflow, primary images loaded, support/privacy/QR links resolved, and browser console had no errors.
- Production website deploy: passed. `https://moalfarras.space/en/apps/moplayer-ios` returned 200, Arabic page returned 200, and `sitemap.xml` includes `/apps/moplayer-ios`.
- Production admin deploy: passed. `https://admin.moalfarras.space` returned 307 to the admin login flow after the production deploy.

## Manually Verified In Previous Emulator QA

- Login.
- Legal empty-login state after clearing app data.
- Home.
- Live with slim preview.
- Movies.
- Series.
- Series detail and episodes.
- Search with keyboard open.
- Favorites empty state.
- Settings.
- Live player controls.
- Movie player controls.
- Episode player controls.

## Real Provider API QA

A temporary real provider source was tested at runtime only. It was not committed to code or docs.

Confirmed:

- Active Xtream login.
- Live categories and channels loaded.
- Movie categories and VOD loaded.
- Series categories, series list, and episode details loaded.
- Direct live/movie/episode HTTP probes returned valid media data.

## Known Windows/Android Emulator Limitation

The Android emulator preview advanced playback state and controls, but rendered tested provider video surfaces black while logging emulator media/EGL limitations. Direct stream probes returned valid media. Final native video rendering must be verified on macOS/Xcode with iOS Simulator and a physical iPhone.

## App Store Readiness Status

Ready for Mac-side build preparation:

- App identity is present.
- iOS bundle ID is configured.
- App icon assets exist.
- Privacy manifest exists and must be verified in Xcode privacy report.
- App Store docs exist under `docs/app-store`.
- Legal Demo source exists.
- No production Apple credentials are required in the repository.

Not yet complete until Mac verification:

- `flutter build ios --release --no-codesign`.
- Xcode archive.
- App Store Connect upload.
- TestFlight playback on real iPhone.
- Final screenshots.
