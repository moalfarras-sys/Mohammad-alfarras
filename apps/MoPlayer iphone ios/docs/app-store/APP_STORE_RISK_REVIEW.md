# App Store Risk Review — MoPlayer iOS

Honest assessment of App Review risk for a media-player app, and how each risk is mitigated.

## Primary risk: "IPTV player" guideline scrutiny
Apple reviews media players that can load IPTV closely (Guidelines 1.2, 4.3, 5.2 — content,
spam, intellectual property). Rejections usually happen when an app **bundles or implies
access to copyrighted streams**.

| Risk | Mitigation in this project |
| --- | --- |
| App appears to provide content | No content bundled. Only a legal demo (Apple BipBop HLS). Disclaimer in-app + on listing. |
| Marketing implies piracy ("free TV/sports") | Metadata avoids all such wording (see APP_STORE_METADATA.md). |
| Screenshots show copyrighted logos/channels | SCREENSHOTS_GUIDE.md forbids brand/channel logos; use demo/neutral UI only. |
| Reviewer can't test | Built-in legal demo source — no account needed (REVIEW_NOTES.md). |
| User-generated/unfiltered content (1.2) | Age rating 17+, disclaimer, and source is user-supplied & user-removable. |
| Hidden features / different behavior in review | None. Same build, same demo path, no remote feature flags that change app nature. |
| IP infringement (5.2) | App does not reproduce third-party marks; no channel/brand assets shipped. |

## Secondary considerations
- **Account deletion (5.1.1(v))**: there is **no user account** (anonymous device session only),
  so the full account-deletion requirement does not strictly apply. The app still offers
  **data control**: remove sources and clear local data from Settings. Document this in review notes.
- **Privacy (5.1)**: minimal data, stored locally/securely; see PRIVACY_CHECKLIST.md.
- **Payments**: none. No IAP, no external purchase links.
- **Background audio / PiP**: only standard playback; no policy-sensitive background modes added.

## Residual risk & recommendation
Residual risk is **moderate-but-manageable** — typical for the player category. The strongest
levers are: (1) the player-only disclaimer everywhere, (2) clean metadata, (3) clean
screenshots, (4) a working legal demo for the reviewer. If rejected under 4.3/1.2, respond
with the disclaimer + demo instructions and emphasize the app ships no content.
