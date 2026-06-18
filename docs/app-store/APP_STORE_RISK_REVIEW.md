# App Store Risk Review

## Main Risks

1. IPTV/content policy confusion.
2. Screenshots showing protected logos or premium content.
3. Review team unable to test without a legal demo source.
4. Privacy answers not matching app behavior.
5. User source credentials appearing in logs, screenshots, or support requests.
6. Flutter/tvOS assumptions being overstated.

## Mitigations Implemented

- In-app legal disclaimer added to Login and Settings.
- Built-in Legal Demo source uses neutral HLS sample streams only.
- App Store review notes clearly state MoPlayer is a media player only.
- App Store screenshot guide forbids protected content.
- Provider credentials remain runtime/local secure storage inputs.
- QR source handoff is documented as temporary and non-permanent.
- Settings includes Wipe Local Data and data deletion instructions.
- Android/Windows debug QR URL logging was removed from the current diff.

## Remaining Manual Review

- Confirm final screenshots before upload.
- Confirm App Store privacy answers after generating Xcode privacy report.
- Confirm legal wording with a qualified legal reviewer.
- Confirm physical iPhone playback before submitting.
