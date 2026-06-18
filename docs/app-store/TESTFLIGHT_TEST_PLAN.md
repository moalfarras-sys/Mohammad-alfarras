# TestFlight Test Plan

## Build Entry Criteria

- `flutter analyze` passes.
- `flutter test` passes.
- Mac build command succeeds.
- Xcode archive uploads to App Store Connect.
- App privacy answers are complete.
- Screenshots use only legal demo content.

## Tester Instructions

1. Install the TestFlight build.
2. Open Legal Demo from the sign-in screen.
3. Confirm Home, Live, Search, Favorites, Settings, and Player routes open.
4. Add a legal personal M3U source if available.
5. Add a legal Xtream-compatible source if available.
6. Test QR activation through https://moalfarras.space/en/activate?product=moplayer2.
7. Verify Settings > Wipe Local Data removes local source data.
8. Confirm no provider password is shown in visible UI or support text.

## Regression Areas

- Source add/test/save.
- Source switch/delete.
- Large catalog scrolling.
- Search with keyboard.
- Live preview sizing on iPhone landscape.
- Movie and series detail pages.
- Episode resume.
- Player open/back/reopen loops.
- Offline/error states.
- Privacy/Terms/Support sheets.

## Exit Criteria

- No crash in 30 minutes of mixed navigation.
- Player resources release after leaving playback.
- Testers can recover from failed source URLs.
- No App Store compliance issue appears in metadata, screenshots, or review notes.
