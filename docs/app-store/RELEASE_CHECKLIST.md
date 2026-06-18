# MoPlayer iOS Release Checklist

## Code

- [ ] Version in `pubspec.yaml` updated.
- [ ] Bundle ID confirmed: `com.moalfarras.moplayerpro.ios`.
- [ ] App name confirmed: MoPlayer Pro.
- [ ] No secrets in git.
- [ ] `.env.example` updated.
- [ ] `PrivacyInfo.xcprivacy` reviewed.
- [ ] Legal disclaimer visible in app.
- [ ] Demo mode uses only legal demo streams.

## QA

- [ ] `flutter clean`.
- [ ] `flutter pub get`.
- [ ] `dart format --output=none --set-exit-if-changed lib test`.
- [ ] `flutter analyze`.
- [ ] `flutter test`.
- [ ] Android emulator preview build if working from Windows.
- [ ] iOS Simulator run from Mac.
- [ ] Physical iPhone playback test.
- [ ] Screenshot audit confirms no protected brands/content.

## App Store Connect

- [ ] App record created.
- [ ] Bundle ID registered.
- [ ] Signing configured.
- [ ] Privacy answers completed.
- [ ] Age rating completed.
- [ ] Review notes completed.
- [ ] Support URL added.
- [ ] Privacy Policy URL added.
- [ ] Screenshots uploaded.
- [ ] TestFlight build reviewed by internal tester.

## Production

- [ ] Public MoPlayer iOS page live or product page updated.
- [ ] Support page works.
- [ ] Activation page works for `product=moplayer2`.
- [ ] App config endpoint reachable.
- [ ] Release handoff updated.
