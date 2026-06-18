# App Privacy Checklist — MoPlayer iOS

Use this to fill **App Store Connect → App Privacy** and the iOS privacy nutrition label.
Confirm each line against the current build before submitting.

## Data the app handles
| Data | Collected? | Where | Linked to user? | Tracking? |
| --- | --- | --- | --- | --- |
| Source URL / Xtream credentials | Stored locally only | `flutter_secure_storage` on device | No | No |
| Favorites / history / resume positions | Stored locally only | Hive / shared_preferences | No | No |
| Device identifier (for activation/sync) | Yes (functional) | Supabase (anonymous) | No real identity | No |
| Anonymous Supabase session | Yes (functional) | Supabase | No | No |
| Crash/diagnostics | Not collected by a third-party SDK | — | — | No |
| Ads / advertising ID | **No** | — | — | No |
| Contacts / photos / location / mic | **No** | — | — | No |

## Suggested App Privacy answers
- **Do you collect data?** Yes — minimal, for app functionality only.
- **Data types:** "Identifiers" → Device ID (App Functionality, **not** linked to identity, **not** used for tracking).
- **Data used for tracking?** **No.**
- **Third-party advertising?** **No.**
- Everything else (source credentials, favorites, history) is **stored on device** and is not
  collected by the developer, so it is not declared as "collected."

## Account deletion / data control
- No user account exists (anonymous device session only).
- The user can **delete each source** and clear app data from **Settings**.
- Document this in App Review notes so the reviewer doesn't expect an account-deletion screen.

## Age rating inputs
- Unrestricted web access / user-provided content → answer **Yes** to relevant questions →
  expected rating **17+**.

## Required Info.plist usage strings (verify present if a permission is used)
- `NSAppTransportSecurity` — IPTV sources are often plain HTTP. If you must allow HTTP streams,
  scope ATS exceptions as narrowly as possible and document why (user-supplied source URLs).
- No camera/mic/photos/location usage strings are needed unless a feature adds them later.
