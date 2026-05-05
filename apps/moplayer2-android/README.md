# MoPlayer2 — `moplayer2-android`

Kotlin + Jetpack Compose client, **separate** from the production TV app in **`moplayer-android`**.

| | |
| --- | --- |
| **Gradle root name** | `MoPlayer2` |
| **Namespace** | `com.moalfarras.moplayer` |
| **applicationId** | `com.moalfarras.moplayer2` (debug: `…moplayer2.debug`) |
| **Site / admin slug** | `moplayer2` → `/{locale}/apps/moplayer2` |

Open this folder in Android Studio. Keys: `local.properties` / env as in `app/build.gradle.kts` (Supabase, weather, football, activation URL).

**vs `moplayer-android`:** different `applicationId` — side‑by‑side install. Release scripts in this repo target **`moplayer-android`** (`com.mo.moplayer`) unless you add one for this app.

Optional nested **`dashboard/`** is local tooling; main Vite UI is **`apps/moplayer-dashboard`**.
