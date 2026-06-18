# TestFlight Test Plan — MoPlayer iOS

Smoke + regression script for internal/external TestFlight testers. Target ~15 minutes.

## Setup
- Install via TestFlight invite. Note device model + iOS version.
- Start with the **Legal Demo** source (no account needed).

## 1. First run & onboarding
- [ ] App launches, splash → first screen, no crash.
- [ ] Safe areas / notch / dynamic island spacing look correct.

## 2. Add source
- [ ] Add **Legal Demo** → returns to Home/Live populated.
- [ ] (Optional) Add **M3U URL** you own → parses without error.
- [ ] (Optional) Add **Xtream** (server/user/pass) → categories load.
- [ ] Invalid URL → clear, friendly error (no crash, no freeze).

## 3. Browsing
- [ ] Live, Movies, Series tabs load; large lists scroll smoothly.
- [ ] Series → seasons → episodes navigation works.
- [ ] Broken logo/poster does not crash or block the UI.
- [ ] Search returns results; empty search shows empty state.

## 4. Player
- [ ] Open a stream → plays (HLS demo).
- [ ] Play/pause, seek (where supported), buffering indicator.
- [ ] Rotate to landscape → fullscreen controls.
- [ ] Stream error → error overlay + retry button.
- [ ] Exit player → audio stops, no leak across repeated open/close.
- [ ] Reopen item → resume position respected.

## 5. Library
- [ ] Add/remove Favorite; appears/disappears under Favorites.
- [ ] Continue Watching / history updates after playback.

## 6. Settings & legal
- [ ] Disclaimer visible and correct.
- [ ] Privacy/Terms links open the website.
- [ ] Switch source; delete source (with confirm) → removed locally only.

## 7. Resilience
- [ ] Toggle airplane mode mid-load → graceful offline/error state.
- [ ] Background/foreground the app during playback → recovers cleanly.

## Reporting
For each issue: device, iOS version, steps, expected vs actual, screenshot. File against the
GitHub repo Issues.
