# Optional iOS CI Setup

The repository includes a safe Linux Flutter quality workflow at `.github/workflows/flutter_quality.yml`. It does not require Apple secrets and does not sign iOS builds.

## Current Safe CI

Runs:

- `flutter pub get`
- `dart format --output=none --set-exit-if-changed lib test`
- `flutter analyze`
- `flutter test`
- `flutter build web --debug --dart-define=MOPLAYER_PLATFORM=ios`

## Future iOS Build Options

### Xcode Cloud

Best Apple-native option for App Store builds when the Apple Developer account is available.

Needs:

- Apple Developer Team.
- App Store Connect app record.
- Xcode project signing configured.
- Flutter install step in custom build script.

### Codemagic

Good Flutter-focused option.

Needs:

- App Store Connect API key.
- Signing certificate.
- Provisioning profile.
- Encrypted environment variables.

### GitHub Actions macOS Runner

Possible but requires careful secret handling.

Needs:

- `runs-on: macos-*`.
- Flutter stable setup.
- App Store Connect API key stored as GitHub secret.
- Certificate/profile stored as encrypted secrets or fetched from a secure signing store.
- No secrets in workflow files.

### Fastlane

Useful once signing is stable.

Potential lanes:

- `match` or manual signing import.
- `gym` for archive.
- `pilot` for TestFlight upload.

Do not commit:

- `.p8` API key files.
- Certificates.
- Provisioning profiles.
- Keychain passwords.
- Apple account passwords.
- Export options containing private team details unless intentionally public-safe.
