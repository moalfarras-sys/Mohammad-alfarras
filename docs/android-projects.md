# Android MoPlayer projects

Both native clients live under **`apps/`** in this monorepo.

## `apps/moplayer-android` — production MoPlayer (TV / sideload)

- **Open in Android Studio:** [`../apps/moplayer-android`](../apps/moplayer-android)
- **applicationId:** `com.mo.moplayer`
- **Gradle project name:** `MoPlayerapp`
- Integrated with website downloads, `npm run release:moplayer`, and `scripts/publish-android-release.mjs`.

## `apps/moplayer2-android` — MoPlayer2 (Compose)

- **Open in Android Studio:** [`../apps/moplayer2-android`](../apps/moplayer2-android)
- **applicationId:** `com.moalfarras.moplayer2`
- **Gradle project name:** `MoPlayer2`
- Kotlin + Compose stack; pairs with the public product page **`/{locale}/apps/moplayer2`** and admin slug `moplayer2`.
- Was previously kept **outside** the repo as `moplayer2/`; it is now **inside** the monorepo for a single clear tree.

The two apps **do not share** the same `applicationId` — you can install both on one device for testing.

## Optional Vite dashboard

The cross-app MoPlayer admin SPA is **`apps/moplayer-dashboard`**, not inside either Android folder.
