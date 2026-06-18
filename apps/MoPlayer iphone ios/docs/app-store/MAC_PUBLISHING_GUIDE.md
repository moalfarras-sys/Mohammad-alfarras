# Mac Publishing Guide — MoPlayer iOS

Step-by-step to build, sign, and submit MoPlayer iOS to TestFlight / the App Store from a Mac.
No Apple credentials are stored in this repo — you sign in with **your own** Apple Developer account.

**App identity**
- App name: **MoPlayer Pro**
- Bundle ID: **`com.moalfarras.moplayerpro.ios`**
- Version / build: **1.0.0 (1)** (from `pubspec.yaml` `version: 1.0.0+1`)
- Min iOS: see `ios/Podfile` / Xcode deployment target (raise to **iOS 13+** if not already).

## 0. Prerequisites
- A Mac (Apple Silicon or Intel) on a recent macOS.
- An **Apple Developer Program** membership ($99/yr) for the Team that owns the Bundle ID.
- Xcode (latest stable) + Command Line Tools.
- Flutter **stable** (3.41.9 verified) and CocoaPods.

## 1. Clone & install
```bash
git clone https://github.com/moalfarras-sys/moplayerios.git
cd moplayerios
flutter --version            # expect stable 3.41.x
flutter doctor               # resolve any ❌ before continuing
flutter pub get
```

## 2. Provide runtime config (no secrets in git)
Supabase keys are injected at build time, never committed:
```bash
cp .env.example .env.local   # then fill values locally (gitignored)
```
Pass them to release builds with `--dart-define` (see step 5). The app is fully functional
offline without Supabase keys (cloud sync/activation simply stay disabled).

## 3. CocoaPods
```bash
cd ios
pod install --repo-update
cd ..
```

## 4. Configure signing in Xcode
```bash
open ios/Runner.xcworkspace      # ALWAYS the .xcworkspace, not .xcodeproj
```
In Xcode:
1. Select the **Runner** target → **Signing & Capabilities**.
2. Check **Automatically manage signing**.
3. Select your **Team** (your Apple Developer account).
4. Confirm **Bundle Identifier** = `com.moalfarras.moplayerpro.ios` (or set your own and update App Store Connect).
5. Verify **Deployment Target** (iOS 13+ recommended) and **Display Name** = MoPlayer.
6. Capabilities: none beyond defaults are required (no push, no IAP, no sign-in-with-Apple).

## 5. Build the release archive
Option A — Flutter (recommended first pass):
```bash
flutter build ipa --release \
  --dart-define=SUPABASE_URL=https://YOUR.supabase.co \
  --dart-define=SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx \
  --dart-define=MOPLAYER_WEB_URL=https://moalfarras.space
```
Output: `build/ios/ipa/*.ipa` and an Xcode archive.

Option B — Xcode: **Product → Archive** from the Runner scheme (Any iOS Device).

## 6. Upload to App Store Connect
- **Xcode Organizer** → select the archive → **Distribute App** → **App Store Connect** → Upload, **or**
- **Transporter** app with the exported `.ipa`.

## 7. Create the App Store Connect record
1. https://appstoreconnect.apple.com → **Apps → +** → New App.
2. Platform iOS, Bundle ID `com.moalfarras.moplayerpro.ios`, SKU e.g. `moplayer-ios-001`.
3. Fill metadata from [APP_STORE_METADATA.md](APP_STORE_METADATA.md).
4. Complete **App Privacy** from [PRIVACY_CHECKLIST.md](PRIVACY_CHECKLIST.md).
5. Paste **App Review Information → Notes** from [REVIEW_NOTES.md](REVIEW_NOTES.md).
6. Upload screenshots per [SCREENSHOTS_GUIDE.md](SCREENSHOTS_GUIDE.md).

## 8. TestFlight
- Once the build finishes processing, add it under **TestFlight**.
- Add internal testers; for external testers, submit the build for Beta App Review.
- Use [TESTFLIGHT_TEST_PLAN.md](TESTFLIGHT_TEST_PLAN.md) as the tester script.

## 9. Submit for review
- Attach the processed build to the version, confirm metadata/privacy/screenshots, **Submit for Review**.
- Run [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) first and read [APP_STORE_RISK_REVIEW.md](APP_STORE_RISK_REVIEW.md).

## Troubleshooting
- `pod install` fails → `sudo gem install cocoapods`, then `pod repo update`.
- Signing errors → confirm Team membership + unique Bundle ID; let Xcode auto-manage.
- "No profiles found" → register the device / let Xcode create profiles after Team selection.
- Flutter plugin build issues → `flutter clean && flutter pub get && (cd ios && pod install)`.
