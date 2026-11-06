# Development workstation audit — 2026-11-06

This pass repairs the Linux development environment and Codex in VS Code.
Existing source edits were preserved. No commit, push, deployment, database
migration, release publication, or reboot was performed.

## Installed tools and updates

| Component | Result |
| --- | --- |
| VS Code | Official stable 1.145.2, replacing 1.143.1; download SHA-256 verified |
| Codex extension / audio | Official Marketplace 26.1021.22027; modified Codex extension directories backed up and isolated |
| Other VS Code extensions | Update checked; newer GitHub Pull Requests 0.176.1 is now compatible with the editor |
| ChatGPT desktop | Updated through Mo Store from 26.1027.30824 to 26.1103.31037; restart needed to use the new build |
| Flatpak / Mo Store apps | Available updates installed; final Mo Store check reported zero pending updates |
| MoOS image | Configured stable channel already current at 44.20261031.1119 |
| Development container | Existing packages upgraded through dnf |
| Node / npm | Node 24.22.2 / npm 11.19.1, matching `.nvmrc` and `packageManager`; previous Node 26 installation retained |
| Java | Temurin JDK 17.0.21, official download checksum verified |
| Android | Verified official command-line tools, SDK platform 36, build-tools 35.0.0/36.0.0, platform-tools 37.0.1 |
| Flutter / Dart | Stable Flutter 3.47.9 / Dart 3.13.7 |
| Browser QA | Playwright 1.65.0 with matching Chromium installed and launched successfully |

Store checks cover registered catalogue apps and Flatpaks. Manually imported
applications without an update source are not independently certified current.

## Codex repair evidence

The original Codex app-server initialized, but its webview timed out. Separate
VS Code renderer testing exposed a fatal Skia/Fontconfig failure. The user's
font cache was backed up and regenerated, after which the new editor remained
responsive. Modified Codex extension files, including a local diagnostic overlay,
were isolated before downloading the official extension again.

A fresh, separate VS Code profile loaded the clean Codex onboarding interface;
its logs confirmed mounted application routes and successful recognition of the
existing ChatGPT authentication. No task message was submitted from that profile.
This verifies startup and account discovery, not a new model response.

## Project changes

- Added `npm run doctor`, which reports tool/env-file presence without displaying
  secret values or contacting production.
- Added a cross-platform Gradle runner for both Android verification commands.
- Normalized the Pro Gradle shell wrapper to LF and added a Git attribute to keep
  Gradle wrappers usable on Unix systems.
- Updated npm packages within existing compatible ranges in the root lockfile;
  Electron was explicitly patched from 42.11.3 to 42.11.18.
- Refreshed Flutter's dependency lockfile for the upgraded SDK and handled Dio's
  new `transformTimeout` enum case as a timeout, restoring exhaustive analysis.
- Corrected ignored Android `local.properties` SDK paths, including the stale
  Windows SDK path in Classic.
- Configured local VS Code tasks, recommended Codex, portable CMake source path,
  workspace TypeScript/ESLint, generated-folder watcher exclusions, and terminal
  tool paths. `.vscode` remains ignored by the existing repository policy.

## Validation

| Check | Result |
| --- | --- |
| `npm run doctor` | Passed with the configured environment loaded |
| `npm run verify:web` | Typecheck, lint, build, 8 test files / 57 tests passed |
| `npm run verify:admin` | Typecheck, lint, build passed |
| `npm run verify:moplayer-dashboard` | Build passed |
| `npm run verify:windows` | Typecheck, lint and renderer/Electron builds passed; repeated after the Electron patch |
| `npm run verify:android:classic` | 61 tests, zero failures/errors |
| `npm run verify:android:pro` | 401 tests, zero failures/errors |
| `flutter analyze` / `dart analyze` | Passed after the corrections below |
| `flutter test` | 6 tests passed |
| `flutter doctor -v` | All toolchain categories passed; no issues found |
| Flutter debug web preview | Built successfully; existing secure-storage plugin produces a Wasm dry-run compatibility warning |
| Local route smoke | Web `/en`, Pro page, activation, config returned 200; admin `/` returned expected 307 |
| Headless browser smoke | Local web home loaded successfully with its expected title and visible page text |

The initial combined Android command stopped at Pro's CRLF wrapper after Classic
passed; Pro passed separately after normalization. The aggregate
`verify:production` command was not run because this was not a deployment.
Windows installer packaging and native iOS signing were not performed; iOS
requires macOS/Xcode. No physical-device playback QA was performed.

The final npm audit contains **13 moderate** findings, all in development /
packaging dependency chains involving minimatch, with **zero high or critical**
findings. npm suggests framework/builder downgrades for some chains; those were
not applied. Electron 42 is end-of-support: its patch reduces known findings,
but moving to a supported major still needs a separate desktop compatibility
and packaging validation pass.

## Local environment and reversible backups

New Bash terminals source `~/.config/moalfarras-dev/env.sh`, which selects the
installed JDK, Android tools, Flutter SDK, Node wrappers, and Chromium executable.
Local VS Code terminal settings carry the same paths.

Backups are retained at:

- `~/Applications/vscode-native-backup-20261106`
- `~/.local/state/moalfarras-dev-setup/20261106/` — previous font cache,
  Codex extension directories, and Flutter tool source/cache
- `~/.config/moalfarras-dev/` — previous Bash, VS Code, and Android local settings
- `/tmp/moalfarras-dev-audit/` — command logs, pre-change package/lock snapshots,
  smoke-test profiles and screenshots; temporary and not committed

### Flutter UTF-8 tool workaround

Flutter 3.47.9's local `packages/flutter_tools/lib/src/dart/analysis.dart` used
`message.length` for the LSP Content-Length. With this workstation's Arabic
workspace path, the analysis server received truncated JSON and exited 255.
The local SDK now uses `utf8.encode(message).length`, and its tool snapshot was
rebuilt. `flutter analyze` subsequently completed with no issues. The original
source and snapshot are preserved in the backup folder above.

This is a local SDK patch, not a project dependency fork. A later Flutter upgrade
may require restoring or re-evaluating it. If it recurs, `dart analyze` is a
verified alternative while the tool issue is investigated.

## Primary references

- [OpenAI Codex IDE documentation](https://learn.chatgpt.com/docs/codex/ide)
- [VS Code Linux installation](https://code.visualstudio.com/docs/setup/linux)
- [VS Code CLI extension update command](https://code.visualstudio.com/docs/configure/command-line)
- [VS Code upstream Fontconfig crash and cache repair](https://github.com/microsoft/vscode/issues/294024)
- [Node release support policy](https://nodejs.org/en/about/previous-releases)
- [Android JDK guidance](https://developer.android.com/build/jdks)
- [Gradle compatibility matrix](https://docs.gradle.org/current/userguide/compatibility.html)
- [Next.js system requirements](https://nextjs.org/docs/app/getting-started/installation)
- [npm update behavior](https://docs.npmjs.com/cli/v11/commands/npm-update/)
- [Dio exception types](https://pub.dev/documentation/dio/latest/dio/DioExceptionType.html)
- [Electron 42.11.18 notes and support status](https://github.com/electron/electron/releases/tag/v42.11.18)

## Follow-up: daily development readiness

Fresh login-shell checks on both the host and `moos-dev` confirm Node 24,
JDK 17, Android SDK 36 and Flutter are loaded automatically. `npm run doctor`
and `flutter doctor -v` pass without sourcing an extra file manually.

The original editor profile still recorded a Codex webview timeout. It was
preserved, and a separate persistent project editor configuration was prepared:

- Settings: `~/.config/Code-Moalfarras`
- Project extensions: `~/.local/share/moalfarras-vscode/extensions`
- Launcher: `~/.local/bin/moalfarras-code`
- Applications-menu entry: **Moalfarras Development / تطوير Moalfarras**

This editor opens the existing repository with Codex, ESLint, Prettier,
Tailwind, Dart/Flutter, Java, EditorConfig and Vitest. Its actual running Codex
webview mounted successfully in about 17 seconds and recognized the existing
ChatGPT authentication. The old editor profile and its data were not deleted.
No model-response test was submitted.

`npm run dev` now starts the public site on `http://127.0.0.1:3000/en` and the
admin on `http://127.0.0.1:3100`. It sets cross-app URLs for the child processes
only, leaves env files untouched, checks both ports before starting, and stops
the session if either app exits. The individual root commands use the same
fixed ports. A VS Code task starts both together.

Live development-mode checks passed for English/Arabic home, Pro, activation,
config and admin login. The old public admin route redirects to the local admin
instead of production in the combined development session. Chromium loaded the
home page at 1440px and 390px; screenshots were reviewed after fonts and entry
animations settled. An initial `networkidle` wait timed out because the page
keeps background connections active; DOM/content-based browser checks passed.
The launcher shutdown test exited zero and freed
both ports; the occupied-port test exited one without leaving another server
running or terminating the pre-existing listener. Windows process-tree cleanup
is implemented but was not executed on this Linux workstation.

The development servers were started again for immediate local use. These
follow-up changes affect root development scripts, documentation and local
editor configuration; application business logic and dependencies were not
changed during this follow-up. Full build/unit suites from the initial audit
were not repeated because the app code and dependencies were unchanged.

## Codex/MCP verification follow-up

The bundled Codex CLI subsequently completed a real model request and returned
`MOALFARRAS_CODEX_OK`; the working project editor was also observed executing a
real task. Local MCP servers were upgraded and tested through actual tool calls,
and the public documentation MCP services passed discovery and tool-call checks.
See [VS Code, Codex and MCP setup](VSCODE_CODEX_MCP.md) for exact scopes and results.

The original editor profile still has a webview startup defect. Automatic review
rejected a proposed process shutdown because unsaved work had not been reliably
checked. The owner then explicitly requested that VS Code remain open and that
only settings work continue. No editor process was closed and no original-profile
cache reset was applied during this follow-up. This supersedes any implication
that the original profile's frontend repair was fully validated.
