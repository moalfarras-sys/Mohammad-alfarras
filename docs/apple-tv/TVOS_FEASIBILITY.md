# Apple TV / tvOS Feasibility

Status: feasibility only. Do not treat MoPlayer Pro iOS Flutter as production-ready for Apple TV.

## Finding

The current production target is iPhone iOS. Flutter's official release flow supports iOS app deployment through macOS/Xcode, but tvOS is not a standard stable target in this project. Attempting to force the iPhone Flutter project into tvOS would risk destabilizing the iPhone app and App Store package.

## Recommendation

Use a separate tvOS project if Apple TV becomes a real product goal.

Best path:

1. Create a native Swift/SwiftUI tvOS app.
2. Use AVKit for playback.
3. Share backend contracts, activation API, source model, and product identity with MoPlayer Pro.
4. Design for Siri Remote focus navigation, not touch.
5. Keep the iPhone Flutter app separate.

## Shared Architecture For Future tvOS

Reusable concepts:

- Product slug: `moplayer2`.
- QR activation API.
- Xtream URL builder behavior.
- M3U parser behavior.
- Favorites/history/continue-watching schema.
- Legal disclaimer and App Store wording.
- Dark glass/orange visual language.

tvOS-specific requirements:

- Focus engine states for every tile and action.
- Remote-control category and channel navigation.
- AVPlayer/AVKit lifecycle.
- Top Shelf assets if applicable.
- Large-screen safe areas and overscan.
- No mobile keyboard assumptions.

## Do Not Do

- Do not mark Apple TV as supported in App Store metadata.
- Do not submit screenshots implying tvOS support.
- Do not add experimental tvOS hacks to the iPhone Flutter project.
- Do not share provider credentials through cloud storage.

Primary references:

- Flutter iOS deployment: https://docs.flutter.dev/deployment/ios
- Flutter supported platforms: https://docs.flutter.dev/reference/supported-platforms
- Apple tvOS platform documentation: https://developer.apple.com/tvos/
