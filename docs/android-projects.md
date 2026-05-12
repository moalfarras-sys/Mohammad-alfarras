# Android Projects

Both native clients live under `apps/`.

## MoPlayer Classic

- Path: `apps/moplayer-android`
- Public name: `MoPlayer`
- Internal slug: `moplayer`
- Android application ID: `com.mo.moplayer`
- Release task: `assembleSideloadRelease -PincludeX86Abis=true`
- Published APK folder: `apps/web/public/downloads/moplayer`

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

Pro QR links must use:

```text
https://moalfarras.space/activate?product=moplayer2&code=MO-XXXX
```

Keep `moplayer2` as the slug in code and database rows. Only visible labels should say `MoPlayer Pro`.

## Optional Dashboard

`apps/moplayer-dashboard` is a separate Vite app and is not part of either Android project.
