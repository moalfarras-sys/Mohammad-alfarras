# Release Checklist — MoPlayer iOS

Run top-to-bottom before every App Store submission.

## Code & quality (no Mac needed)
- [ ] `flutter pub get` clean
- [ ] `dart format --output=none --set-exit-if-changed lib test` passes
- [ ] `flutter analyze` → no issues
- [ ] `flutter test` → all pass
- [ ] No secrets in git (`git ls-files | grep -iE '\.env|\.p12|\.mobileprovision'` is empty)
- [ ] `version:` in `pubspec.yaml` bumped (e.g. `1.0.0+1` → `1.0.1+2`)

## App content & compliance
- [ ] In-app player-only disclaimer present (Settings → Legal & Support)
- [ ] Privacy & Terms links open the live website
- [ ] Legal demo source works end-to-end
- [ ] No bundled channel/brand/copyrighted assets anywhere in the repo or screenshots
- [ ] Metadata wording reviewed against APP_STORE_METADATA.md (no "free TV/sports" etc.)

## Mac / Xcode
- [ ] `flutter doctor` clean on the Mac
- [ ] Signing Team selected, Bundle ID `com.moalfarras.moplayerpro.ios`
- [ ] Deployment target set (iOS 13+)
- [ ] App icon + launch screen render on a real device
- [ ] `flutter build ipa --release` (with `--dart-define`s) succeeds
- [ ] Upload to App Store Connect succeeds, build finishes processing

## App Store Connect
- [ ] Metadata (name/subtitle/description/keywords/URLs/copyright) filled
- [ ] Screenshots uploaded for all required device sizes (SCREENSHOTS_GUIDE.md)
- [ ] App Privacy completed (PRIVACY_CHECKLIST.md)
- [ ] Age rating set (17+ recommended)
- [ ] Review notes pasted (REVIEW_NOTES.md), demo path verified
- [ ] Build attached to the version
- [ ] TestFlight smoke test passed (TESTFLIGHT_TEST_PLAN.md)
- [ ] Submit for Review
