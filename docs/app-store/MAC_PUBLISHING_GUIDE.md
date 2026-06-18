# Mac Publishing Guide

This project cannot be submitted to the App Store from Windows. Flutter's official iOS release flow requires macOS and Xcode.

Primary reference: https://docs.flutter.dev/deployment/ios

## 1. Clone The Repository

```bash
git clone https://github.com/moalfarras-sys/MoPlayerios.git
cd MoPlayerios
```

If publishing from the monorepo instead:

```bash
cd "apps/MoPlayer iphone ios"
```

## 2. Install Tools

Install:

- Flutter stable.
- Xcode from the Mac App Store.
- CocoaPods.
- Apple Developer account access.

Run:

```bash
flutter doctor -v
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

## 3. Install Dependencies

```bash
flutter clean
flutter pub get
cd ios
pod install
cd ..
```

## 4. Configure Build Values

Use `--dart-define` values or an approved CI secret mechanism:

```bash
flutter build ios --release --no-codesign \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
  --dart-define=MOPLAYER_WEB_URL=https://moalfarras.space
```

Do not commit real keys.

## 5. Configure Xcode Signing

Open:

```bash
open ios/Runner.xcworkspace
```

In Xcode:

1. Select Runner.
2. Confirm Bundle Identifier: `com.moalfarras.moplayerpro.ios`.
3. Select the Apple Developer Team.
4. Enable automatic signing or attach the correct provisioning profile.
5. Confirm Release build configuration.
6. Confirm app icon and launch screen.
7. Confirm iPhone orientations and full-screen behavior.

## 6. Archive And Upload

In Xcode:

1. Select Any iOS Device.
2. Product > Archive.
3. Validate App.
4. Distribute App.
5. Upload to App Store Connect.

Alternative CLI after signing is configured:

```bash
flutter build ipa --release \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your-publishable-key \
  --dart-define=MOPLAYER_WEB_URL=https://moalfarras.space
```

## 7. TestFlight

1. Wait for App Store Connect processing.
2. Add internal testers.
3. Run the TestFlight plan in `TESTFLIGHT_TEST_PLAN.md`.
4. Fix any crash, privacy warning, or playback issue before external testing.

## 8. Submit For Review

1. Complete metadata from `APP_STORE_METADATA.md`.
2. Complete review notes from `REVIEW_NOTES.md`.
3. Complete privacy answers from `PRIVACY_CHECKLIST.md`.
4. Upload safe screenshots from `SCREENSHOTS_GUIDE.md`.
5. Submit for review.

Do not claim the app provides content. Keep all wording focused on media playback for user-provided legal sources.
