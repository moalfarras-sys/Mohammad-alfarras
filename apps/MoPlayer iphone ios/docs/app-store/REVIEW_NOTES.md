# App Review Notes — MoPlayer iOS

Paste into **App Store Connect → App Review Information → Notes**. Keep it concise and factual.

---

```
WHAT THIS APP IS
MoPlayer is a media player only. It does NOT provide, sell, bundle, or stream any
channels, playlists, movies, sports, or copyrighted content. The user adds their own
legally obtained M3U or Xtream source. The app ships with no content.

HOW TO TEST WITHOUT ANY ACCOUNT (built-in legal demo)
1. Launch the app.
2. On the Add-Source / Login screen, choose "Legal Demo" (or open Settings and add the
   bundled demo source).
3. The demo loads Apple's public BipBop HLS test stream
   (https://devstreaming-cdn.apple.com/.../master.m3u8) so you can exercise the full
   interface — Live list, player, search, favorites — with no external credentials and no
   copyrighted material.

HOW TO TEST WITH A REAL SOURCE (optional)
- Xtream: Settings/Add source → Xtream → enter Server URL, Username, Password.
- M3U: Settings/Add source → M3U URL → paste a playlist URL you are authorized to use.
- QR activation: Settings/Add source → QR (used with the moalfarras.space activation flow).

ACCOUNTS / SIGN-IN
There is no user account or password. The app uses anonymous, device-scoped Supabase
sign-in only for optional config sync. Nothing personal is required to use the app.

LEGAL / DISCLAIMER
An in-app disclaimer (Settings → Legal & Support) states the player-only nature. Privacy
Policy: https://moalfarras.space/en/privacy  Terms: https://moalfarras.space/en/terms

CONTACT
Support: https://moalfarras.space/en/support  Email: mohammad.alfarras@gmail.com
```

---

## Reviewer feature checklist (what to try)
- Add the **Legal Demo** source → confirm Live list populates.
- Open a stream → player shows, plays, buffering/▶︎/❚❚ work, rotate to landscape.
- Back out → resource cleanup (no audio continues).
- Search, mark a Favorite, see it under Favorites.
- Settings → read the disclaimer, open Privacy/Terms links, delete the source.

## Demo source (for reference)
`assets/demo/review_playlist.m3u` — two entries pointing at Apple's official public HLS
test stream. 100% legal, no third-party or copyrighted content.
