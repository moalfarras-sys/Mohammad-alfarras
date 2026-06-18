# MoPlayer Pro iOS

Flutter client for the MoPlayer Pro iOS app in the `moalfarras.space` ecosystem.
The app uses the shared MoPlayer backend/product slug `moplayer2`, supports
manual Xtream/M3U login, QR activation through the public web API, local secure
source storage, library caching, favorites, history, and continue watching.

MoPlayer Pro is a media player only. It does not provide channels, playlists,
movies, TV streams, sports broadcasts, premium content, or copyrighted content.
Users must add their own legally obtained M3U or Xtream source.

## Local Setup

Use Flutter 3.41+ / Dart 3.11+.

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
```

Run on Windows preview:

```powershell
flutter run -d windows `
  --dart-define=SUPABASE_URL=https://your-project.supabase.co `
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your-publishable-key `
  --dart-define=MOPLAYER_WEB_URL=https://moalfarras.space
```

Native Windows builds require Windows Developer Mode or an Administrator shell
because Flutter desktop plugins create symbolic links during plugin setup.

Run on Android emulator preview:

```powershell
flutter run -d emulator `
  --dart-define=MOPLAYER_PLATFORM=ios `
  --dart-define=SUPABASE_URL=https://your-project.supabase.co `
  --dart-define=SUPABASE_PUBLISHABLE_KEY=your-publishable-key `
  --dart-define=MOPLAYER_WEB_URL=https://moalfarras.space
```

iOS builds require macOS, Xcode, CocoaPods, and the production signing team.

## Environment

Do not commit real secrets. Use the existing production Supabase project values
provided by the owner. The app accepts:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_ANON_KEY` as a legacy fallback only
- `MOPLAYER_WEB_URL`, defaulting to `https://moalfarras.space`

The repository includes a neutral legal demo playlist at
`assets/demo/review_playlist.m3u`. It is opened through the "Open Legal Demo"
button on the sign-in screen and must stay free of protected channel, movie,
or sports branding.

## Platform Identity

- iOS bundle id: `com.moalfarras.moplayerpro.ios`
- Android emulator preview id: `com.moalfarras.moplayerpro.iospreview`
- Product slug sent to backend APIs: `moplayer2`
- Runtime platform values: `ios`, `android`, `windows`, `web`, `macos`,
  `linux`, or `fuchsia`

## Verification

Before handing off iOS work:

```powershell
flutter clean
flutter pub get
flutter analyze
flutter test
flutter build apk --debug
flutter build windows --debug
```

On macOS, also run:

```bash
flutter build ios --release --no-codesign
```

## App Store Notes

The iOS runner includes branded icons, a branded launch asset, landscape
orientation, media-scoped ATS allowance for IPTV streams, a `moplayerpro://`
deep-link scheme, and `PrivacyInfo.xcprivacy`. Before App Store submission,
archive in Xcode and generate the privacy report, then confirm the final privacy
nutrition labels with the project owner.

Release/App Store documentation (in this repo, under `docs/`):

- `docs/app-store/MAC_PUBLISHING_GUIDE.md` — clone → build → sign → submit
- `docs/app-store/APP_STORE_METADATA.md`
- `docs/app-store/REVIEW_NOTES.md`
- `docs/app-store/PRIVACY_CHECKLIST.md`
- `docs/app-store/RELEASE_CHECKLIST.md`
- `docs/app-store/SCREENSHOTS_GUIDE.md`
- `docs/app-store/TESTFLIGHT_TEST_PLAN.md`
- `docs/app-store/APP_STORE_RISK_REVIEW.md`
- `docs/app-store/PRIVACY_POLICY_TEMPLATE.md`, `docs/app-store/TERMS_TEMPLATE.md`
- `docs/ARCHITECTURE.md`, `docs/QA_REPORT.md`, `docs/RELEASE_NOTES.md`
- CI: `.github/workflows/flutter_quality.yml` (analyze + format + test; no Apple secrets)
- Optional iOS build CI: `docs/ci/IOS_CI_SETUP.md`

Apple TV/tvOS is not production-ready from this Flutter project. See
`docs/apple-tv/TVOS_FEASIBILITY.md`.

## Latest Local QA

The latest UI/settings completion pass is documented in
`MOPLAYER_IOS_UI_COMPLETION_QA.md`.

Current verified local checks:

```powershell
flutter analyze
flutter test
flutter build web --debug --dart-define=MOPLAYER_PLATFORM=ios
flutter build apk --debug --dart-define=MOPLAYER_PLATFORM=ios
```

The local browser preview can be served from `build/web`, for example:

```powershell
python -m http.server 8787 --bind 127.0.0.1 -d build/web
```

Use a phone-landscape viewport around `932x430` to verify the compact iOS UI.

Latest emulator QA used an Android phone emulator as the Windows-side iPhone
landscape preview, installed the debug APK, and exercised Login, Home, Live,
Movies, Series, Episodes, Search, Favorites, Settings, and player routes with a
temporary real provider source. Provider credentials must be entered only at
runtime and must not be committed to this repository.

The Android 12+ preview splash is explicitly themed with a dark MoPlayer mark so
the emulator does not show the default white launcher-icon disc during cold
start. After QA, clear local source data with:

```powershell
adb -s emulator-5554 shell pm clear com.moalfarras.moplayerpro.iospreview
```

Known emulator limitation: the tested Android emulator advanced playback state
and controls while rendering the video surface black for the provider streams.
Direct live/movie/episode HTTP probes returned valid media data, so final video
rendering still needs macOS/Xcode validation on an iOS Simulator or iPhone.
