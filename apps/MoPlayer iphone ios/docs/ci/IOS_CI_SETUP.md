# iOS CI Setup (optional, future) — MoPlayer

The committed workflow [`.github/workflows/flutter_quality.yml`](../../.github/workflows/flutter_quality.yml)
runs **analyze + format + test** on every push/PR. It needs **no Apple secrets** and is the
only CI that should run by default.

Building/signing/uploading iOS requires Apple credentials and a macOS runner. **Never commit**
certificates, provisioning profiles, App Store Connect API keys, or `.env` files. Below are the
options for when you want automated iOS builds.

## Option A — Xcode Cloud (simplest if you have ASC)
- Configure in App Store Connect → Xcode Cloud. Signing handled by Apple.
- Add `--dart-define` values as Xcode Cloud environment variables (mark secrets as secret).

## Option B — Codemagic (Flutter-native)
- Connect the repo, pick the iOS workflow.
- Add the App Store Connect API key + signing in Codemagic's encrypted vault (UI), not in git.

## Option C — GitHub Actions on `macos-latest` (+ Fastlane)
Store these as **GitHub Encrypted Secrets** (Settings → Secrets and variables → Actions):
- `APP_STORE_CONNECT_API_KEY_ID`, `APP_STORE_CONNECT_API_ISSUER_ID`, `APP_STORE_CONNECT_API_KEY` (base64 .p8)
- `IOS_DIST_CERT_P12` (base64), `IOS_DIST_CERT_PASSWORD`, `IOS_PROVISIONING_PROFILE` (base64)
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (for `--dart-define`)

Sketch (do **not** enable until secrets exist):
```yaml
# .github/workflows/ios_release.yml  (EXAMPLE — keep disabled until secrets are set)
on: workflow_dispatch
jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { channel: stable, flutter-version: 3.41.9, cache: true }
      - run: flutter pub get
      # import signing assets from secrets into a temp keychain (Fastlane match or manual)
      # flutter build ipa --release --dart-define=SUPABASE_URL=... --dart-define=SUPABASE_PUBLISHABLE_KEY=...
      # upload via Fastlane `pilot`/`deliver` using the ASC API key
```

## Fastlane (recommended wrapper)
- `fastlane match` for signing assets (store in a private git/secret backend, never this repo).
- `fastlane pilot` → TestFlight, `fastlane deliver` → App Store metadata/screenshots.

## Golden rule
Default CI = quality only. Any iOS build CI must read all credentials from the provider's
**encrypted secret store**, never from the repository.
