# MoPlayer Google Play Readiness

Last updated: 2026-05-09

## Current Release State

| Product | Package | Version | Target SDK | Artifact for Play |
| --- | --- | --- | --- | --- |
| MoPlayer Classic | `com.mo.moplayer` | `2.2.3` / code `9` | `35` | `bundlePlayRelease` AAB |
| MoPlayer Pro | `com.moalfarras.moplayerpro` | `2.1.0` / code `4` | `35` | `bundleRelease` AAB |

Google Play currently requires new apps and app updates to target Android 15 / API 35 or higher, except Android TV apps may target Android 14 / API 34 or higher. Both local projects are now aligned at API 35 so the package is safer for phone + TV submission.

## Store Listing Draft

### App Name

MoPlayer

### Short Description

Android TV media player for your own M3U and Xtream sources.

### Full Description

MoPlayer is an Android and Android TV media player built for clean navigation, TV remote control, website activation, and clear source management.

Use MoPlayer to connect media sources you are allowed to use, including M3U playlists and Xtream-compatible provider details. The app focuses on playback ergonomics, local favorites, server sync, weather and football widgets, and a polished TV-first interface.

Important: MoPlayer is a player only. It does not provide channels, movies, series, playlists, subscriptions, or copyrighted media. Users are responsible for the legality of every source they connect.

Key features:

- Android TV and remote-friendly interface
- M3U and Xtream source support
- Website activation flow through moalfarras.space
- Runtime configuration from the server
- Weather and football widgets from server-side providers
- Favorites and continue-watching surfaces
- Support and privacy pages on the official website

Official website: https://moalfarras.space/en/apps/moplayer
Privacy policy: https://moalfarras.space/en/privacy
Support: https://moalfarras.space/en/support

### Search Keywords To Use Naturally

MoPlayer, Android TV media player, M3U player, Xtream player, IPTV player, APK download, TV media app, Moalfarras.

Do not claim free channels, free movies, live TV subscriptions, or copyrighted media access.

## Data Safety Draft

Use this as the Play Console starting point, then confirm against the actual build and any enabled third-party SDKs.

| Data Area | Expected Answer |
| --- | --- |
| Personal info | The website support flow may collect name, email, optional WhatsApp, and message when the user submits support/contact forms. |
| App activity | Local playback history/favorites may be stored on device for user functionality. |
| App info and performance | Crash/performance data only if a crash analytics SDK is added. No crash SDK is currently identified in the Android dependencies. |
| Location | Weather widget can use coarse/fine location if the user grants permission. |
| User IDs/device IDs | Activation uses a generated app/device identifier, not hardware MAC address. |
| Sharing | Do not share user data with third parties except configured infrastructure providers needed to operate support/API flows. |
| Encryption in transit | Yes, website/API traffic uses HTTPS. User-provided media sources may use HTTP when the provider only supports HTTP. |
| Account deletion | No first-party account is required for base use. Support deletion requests should go through the published privacy contact. |

## Release Checklist

- Confirm Play Console developer account and app package name before first upload.
- Use Play App Signing and keep the upload key private.
- Build an AAB, not the sideload APK, for Play distribution.
- Upload screenshots for TV and phone/tablet if both form factors remain enabled.
- Complete App content forms: Privacy Policy, Data Safety, Target audience, Ads, App access, Content rating.
- Keep provider/API keys server-side. Do not ship SportMonks, API-Football, Supabase service-role, or admin secrets inside Android.
- Verify `https://moalfarras.space/.well-known/assetlinks.json` after setting `ANDROID_APP_CERT_SHA256` in Vercel.
- Run a real device/TV smoke test before production rollout.

## Build Commands

```powershell
cd apps/moplayer-android
.\gradlew.bat clean bundlePlayRelease
```

```powershell
cd apps/moplayer2-android
.\gradlew.bat clean bundleRelease
```

## Website Indexing Checklist

- `robots.txt` allows public pages and disallows admin/API.
- `sitemap.xml` includes localized app/product/support/privacy URLs.
- Product pages include canonical URLs and language alternates.
- Product pages include `SoftwareApplication` / `MobileApplication` JSON-LD with a free offer and package name.
- Submit `https://moalfarras.space/sitemap.xml` in Google Search Console.
- Use URL Inspection for:
  - `https://moalfarras.space/en/apps/moplayer`
  - `https://moalfarras.space/ar/apps/moplayer`
  - `https://moalfarras.space/en/support`
  - `https://moalfarras.space/en/privacy`
