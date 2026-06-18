# Release Notes — MoPlayer iOS

## 1.0.0 (build 1) — initial App Store preparation
First production-ready iPhone release of MoPlayer Pro.

**Highlights**
- Premium dark, mobile-first interface for iPhone (safe areas, notch/dynamic island aware).
- Add a source via **Xtream login**, **M3U URL**, or **QR activation**; switch and delete sources.
- Organized **Live / Movies / Series** browsing with seasons and episodes.
- **Search**, **Favorites**, **Continue Watching**, and history.
- Smooth **HLS / MPEG-TS** playback (media_kit / libmpv): landscape controls, buffering state,
  retry, resume position, wakelock, and clean resource disposal.
- **Private by design**: source credentials kept in the device keychain; minimal anonymous
  backend session; no ads, no tracking.
- **App-Store-safe**: built-in legal demo source (Apple public HLS), clear player-only
  disclaimer, in-app Privacy/Terms links.

**Quality**
- `flutter analyze` clean, `flutter test` green (6/6), `dart format` clean.

**App Store "What's New" (paste-ready)**
```
First release of MoPlayer for iPhone — a premium media player for the M3U and Xtream sources
you are legally allowed to use. Live, Movies, and Series browsing, search, favorites, continue
watching, and smooth HLS playback. You add your own source; no content is included.
```

> Bump `version:` in `pubspec.yaml` for each new build (e.g. `1.0.0+1` → `1.0.1+2`).
