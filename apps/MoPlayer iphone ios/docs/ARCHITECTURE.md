# Architecture — MoPlayer iOS

Flutter app (iPhone-first; Android/Windows/web compile for preview). State via **Riverpod**,
routing via **go_router**, playback via **media_kit (libmpv)**, optional backend via **Supabase**.

## Layering (`lib/`)
```
core/        config, constants, error types, theme, utils  (no feature deps)
models/      plain data models (channels, vod, series, episodes, source, favorite)
services/    integrations & IO — each isolated and testable
  ├ xtream/        Xtream Codes API client + URL builder
  ├ m3u/           M3U/M3U8 parser
  ├ player/        media_kit player wrapper + lifecycle
  ├ storage/       secure storage (credentials) 
  ├ cache/         Hive / preferences (favorites, history, resume)
  ├ device/        device id / info
  ├ connectivity/  online/offline
  ├ activation/    QR / code activation against moalfarras.space
  └ supabase/      anonymous session + config sync
repositories/  combine services into feature-facing data sources
providers/     Riverpod providers wiring repositories/services to UI
features/      one folder per screen area (UI + local widgets)
  splash · auth(add source) · home · live · movies · series · player · search · favorites · settings
widgets/       shared UI components
app/           app root, router, theme application
```

## Key flows
- **Add source** → `auth/login_screen` → validates → `services/{xtream,m3u}` + `storage` → repository → providers refresh.
- **Browse** → providers read from repositories (Xtream/M3U) with cache fallbacks → feature screens render with loading/empty/error states.
- **Play** → `player/player_screen` uses `services/player` (media_kit) → wakelock on, resume position restored, dispose on exit.
- **Activation** → `services/activation` talks to the website activation endpoints; QR via `qr_flutter`.
- **Sync (optional)** → `services/supabase` anonymous session; absent keys → fully offline-functional.

## Design principles
- Services never import features; UI never calls IO directly (goes through repositories/providers).
- Defensive parsing: missing fields, broken logos, and failed streams must not crash the UI.
- Secrets only via `--dart-define`; nothing sensitive in source or git.

## Cross-platform note
The same Dart core (models/services/repositories) is portable. iOS is the production target;
other platforms are previews. See [apple-tv/TVOS_FEASIBILITY.md](apple-tv/TVOS_FEASIBILITY.md)
for what the shared core means for a future Apple TV app.
