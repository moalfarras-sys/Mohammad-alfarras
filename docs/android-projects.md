# Android Projects

Both native clients live under `apps/`.

## MoPlayer Classic

- Path: `apps/moplayer-android`
- Public name: `MoPlayer`
- Internal slug: `moplayer`
- Android application ID: `com.mo.moplayer`
- Release task: `assembleSideloadRelease`
- Published APK folder: `apps/web/public/downloads/moplayer`
- Current published APK: `2.2.16` (`versionCode` 22), `52790603` bytes, SHA-256 `5e51b5e9e6ed7c46d172f3f97a5bf3201b41cefd7e27fdd59f3ef4e3b899f895`

Classic QR links must use:

```text
https://moalfarras.space/activate?code=MO-XXXX
```

## MoPlayer Pro

- Path: `apps/moplayer-pro-android`
- Public name: `MoPlayer Pro`
- Internal slug: `moplayer2`
- Android application ID: `com.moalfarras.moplayerpro`
- Release task: `assembleRelease`
- Published APK: `apps/web/public/downloads/moplayer2/app-release.apk`
- Current published APK: `2.5.23` (`versionCode` 61), `49276473` bytes, SHA-256 `abd79199b9b074d5ce5130847dd16b9c8f2823d548cbd2f6314067a4a50b4ddd`

Pro QR links must use:

```text
https://moalfarras.space/activate?product=moplayer2&code=MO-XXXX
```

Keep `moplayer2` as the slug in code and database rows. Only visible labels should say `MoPlayer Pro`.

## Optional Dashboard

`apps/moplayer-dashboard` is a separate Vite app and is not part of either Android project.
