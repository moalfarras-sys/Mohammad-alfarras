# Android Projects

Both native clients live under `apps/`.

## MoPlayer Classic

- Path: `apps/moplayer-android`
- Public name: `MoPlayer`
- Internal slug: `moplayer`
- Android application ID: `com.mo.moplayer`
- Release task: `assembleSideloadRelease`
- Published APK folder: `apps/web/public/downloads/moplayer`
- Current published APK: `2.2.12` (`versionCode` 18), `52746532` bytes, SHA-256 `67b0fa3b55ca05e1ff7ea380b91c47d46d32748325669cb557a1b85487c305f7`

Classic QR links must use:

```text
https://moalfarras.space/activate?code=MO-XXXX
```

## MoPlayer Pro

- Path: `apps/moplayer2-android`
- Public name: `MoPlayer Pro`
- Internal slug: `moplayer2`
- Android application ID: `com.moalfarras.moplayerpro`
- Release task: `assembleRelease`
- Published APK: `apps/web/public/downloads/moplayer2/app-release.apk`
- Current published APK: `2.5.13` (`versionCode` 51), `49256351` bytes, SHA-256 `31e5648b5841182394f3b9bad96f779bdf475a014072ff1f18caf59b0e9af249`

Pro QR links must use:

```text
https://moalfarras.space/activate?product=moplayer2&code=MO-XXXX
```

Keep `moplayer2` as the slug in code and database rows. Only visible labels should say `MoPlayer Pro`.

## Optional Dashboard

`apps/moplayer-dashboard` is a separate Vite app and is not part of either Android project.
