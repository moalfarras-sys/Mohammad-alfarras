# MoPlayer Pro Local Restore Notes

## Selected Local Source

`apps/moplayer-pro-android` was restored from:

`C:\Users\Moalfarras\Desktop\moappweb (2).zip`

This source was selected because it matches the approved Android TV UI direction:

- `World Cup 2026` home widget.
- `Movies` and `Series` home shelves.
- Login cues: `Local cache`, `Smart refresh`, and `Fast startup`.
- Xtream login copy with subscription and expiry information.

## Current Local App Identity

The restored local source builds as:

- package: `com.moalfarras.moplayerpro`
- debug package: `com.moalfarras.moplayerpro.debug`
- versionName: `2.5.3`
- versionCode: `41`

The running emulator build is:

- package: `com.moalfarras.moplayerpro.debug`
- versionName: `2.5.3-debug`
- versionCode: `41`
- ABI: `x86`

## Production State

The public production APK was not changed during this local restore.

Current production download on `moalfarras.space` remains:

- package: `com.moalfarras.moplayerpro`
- versionName: `2.5.2`
- versionCode: `40`
- SHA-256: `8254be6d2872e964158a8c5f001569d7d271a24893672dd2c328262a91784b02`

The local source is now prepared as the next publishable baseline (`2.5.3` / `41`) while preserving the approved restored UI source. The public production APK is still unchanged until an explicit deploy/publish step completes.

## Local Compatibility Fix

One compatibility fix was applied after restore:

- M3U import no longer emits progress from inside an IO dispatcher block.
- This avoids the Kotlin Flow invariant crash during local emulator testing.

## Verification Commands

From the repository root:

```powershell
npm run verify:android:pro
```

From this folder:

```powershell
.\gradlew.bat assembleDebug
```

## Scope Rules

- Keep this restore scoped to `apps/moplayer-pro-android`.
- Do not change `apps/web`, `apps/admin`, or `apps/moplayer-android` for this local restore.
- Do not publish this version unless explicitly requested and confirmed.
