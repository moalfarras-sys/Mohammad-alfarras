# MoPlayer Pro Android

Kotlin + Jetpack Compose IPTV client for Android TV first, with adaptive phone/tablet layouts.

| | |
| --- | --- |
| **Gradle root name** | `MoPlayerPro` |
| **Namespace** | `com.moalfarras.moplayerpro` |
| **applicationId** | `com.moalfarras.moplayerpro` (debug: `com.moalfarras.moplayerpro.debug`) |
| **Product name** | `MoPlayer Pro` |
| **Build version** | `2.7.3` / code `72` |

Open this folder in Android Studio. Before AI-assisted edits, read [AGENTS.md](AGENTS.md). This app is connected to `apps/web`, `apps/admin`, `packages/shared`, and Supabase migrations.

Runtime keys can come from `local.properties`, Gradle properties, or environment variables as defined in `app/build.gradle.kts`:
Supabase, activation URL, web API base URL, and product slug. No weather or football API key ships in the APK: weather comes from the site's `/api/weather` (key kept server-side) and key-less Open-Meteo.

This is the Pro line that evolved from the earlier Compose prototype. The installed app identity, Play package, launcher label, user-agent, and visible UI are now MoPlayer Pro.

## Verification and update integrity

`npm run verify:android:pro` runs unit tests and Android Lint. With an emulator/device connected, run `node scripts/run-gradle.mjs pro connectedDebugAndroidTest`. Device tests cover Room catalog persistence, Android Keystore, update rejection and a real Media3 session using generated local audio. They do not certify physical TV codecs or 4K playback.

Updates require a valid matching SHA-256, the exact advertised package/version, and the advertised file size when supplied. Preserve release metadata when publishing; Android also enforces the signing identity during installation.
