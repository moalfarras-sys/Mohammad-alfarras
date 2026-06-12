# MoPlayer PC Playback QA

Date: 2026-06-12

## Scope

Playback was tested against the real encrypted local Xtream profile by copying `moplayer-pro-data.json` and `moplayer-pro-library.json` into a temporary Electron `--qa-user-data` directory. No provider URL, username, password, or stream URL was printed or committed.

The tested library contained:

- 12,520 live channels
- 20,007 movies
- 10,430 series
- 42,957 total media items
- HLS and MPEG-TS live outputs
- MP4, MKV, AVI, TS, MPG, and FLV VOD containers

The provider account metadata reported one maximum simultaneous connection. The server accepted four streams during this QA run, but it may enforce the declared limit during busy match periods. Multi-view now surfaces that limit instead of silently presenting provider rejection as an app failure.

## Baseline Installed App

- First live channel: 2.05 seconds to first frame
- Five BEIN SPORT 4K channels: 1.02 to 1.57 seconds to first frame
- Two multi-view tiles: 2.55 seconds until both were playing
- MP4 movie: 1.54 seconds to first frame
- MKV movie: 1.02 seconds to first frame

The baseline code had no bounded startup timeout, no persistent-stall reconnect, incomplete HLS URI rewriting, and a CSP that blocked blob workers.

## Updated App

- BEIN SPORT 4K HLS: 1.69 seconds to first frame
- The same live stream advanced 11.3 seconds during a 12-second stability window with no buffering state
- Four multi-view tiles: 2.90 seconds until all four were playing
- MP4 movie: 1.24 seconds to first frame
- MKV movie: 1.23 seconds to first frame
- Raw MPEG-TS: 2.04 seconds to first frame
- Renderer log: zero CSP, uncaught promise, or renderer-crash lines
- Stream proxy fixture: HLS audio/init-map URI rewriting and byte-range forwarding passed
- The packaged Portable EXE passed the normal startup smoke test before the final QA-only command-line rebuild.
- Keyboard QA passed for K/M playback controls, input-field shortcut isolation, multi-view arrow focus, and Delete removal.

## Remaining Limits

- The app cannot remove provider-side congestion or a provider-enforced connection cap. It can reconnect, switch HLS/TS, and report the condition clearly.
- HLS quality levels are supported through adaptive mode and manual selection when the provider publishes a master playlist.
- MP4 and the tested MKV codec combination played successfully. AVI, FLV, MPG, and unusual MKV codecs still depend on Chromium's bundled codec support; they cannot honestly be guaranteed without adding a native engine such as libVLC.
- Match-day behavior should still be checked during an actual congested event because normal-time server performance cannot reproduce provider overload.
- Final unsigned package hashes were blocked from execution by this PC's Windows Application Control policy. Source-build real-provider QA passed, but release binaries still require trusted Windows code signing before production distribution.

Final local artifacts (not published):

- `MoPlayer-PC-Setup.exe`: 115,190,926 bytes, SHA-256 `4a0a2758c1a9994342574e9448a6411f427873c9eba427f3e74d32e4dc1791b6`
- `MoPlayer-PC-Portable.exe`: 114,973,010 bytes, SHA-256 `27f3b38e4268e3c842dd21c4e5d7ffb304635add04cb4626ca96e522d4999957`
