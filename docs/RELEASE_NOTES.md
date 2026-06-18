# MoPlayer iOS Release Notes

## 1.0.0+1 - App Store preparation

Prepared the MoPlayer Pro iOS Flutter app for GitHub/App Store handoff.

### Added

- Legal Demo source for reviewer-safe M3U/HLS testing.
- In-app legal disclaimer on Login and Settings.
- Source Management in Settings for source switching, deletion, and adding another source.
- Support, Privacy, Terms, App Disclaimer, and Data Deletion surfaces in Settings.
- App Store metadata, privacy, review notes, screenshot, TestFlight, release, and Mac publishing guides.
- iOS CI quality workflow for analyze/test/web-preview build.
- tvOS feasibility report.
- Root `.env.example`.

### Improved

- Home latest content ordering by provider timestamps.
- Live preview density for phone landscape.
- Search keyboard behavior.
- Series detail landscape layout.
- Android 12+ preview splash branding.

### Security/Compliance

- No provider credentials are committed.
- No Apple signing assets are committed.
- Removed a debug QR URL console log from the current Windows app diff.
- Documented media-player-only positioning for App Store review.

### Remaining

- Build and archive on macOS/Xcode.
- Validate privacy report.
- Run TestFlight on a physical iPhone.
- Upload final safe screenshots.
