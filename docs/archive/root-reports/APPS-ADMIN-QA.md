# Apps Admin QA

Date: 2026-06-15

## Scope

Apps checked:
- MoPlayer Pro
- MoPlayer Classic
- MoPlayer PC

## Changes

- MoPlayer family page now receives managed app ecosystem data from `readAppEcosystem`.
- MoPlayer PC now uses `readLatestWindowsRelease` for hero, card, gallery, status, download file, SHA-256, date, notes, and maintenance.
- Windows release mapping no longer drops admin image updates when version/file are empty.
- PC download route no longer returns a fake default installer when no file is configured.
- PC page release card shows status, version, file, release date, size, SHA-256, download count, and maintenance message.

## QA Matrix

| Area | Test | Result | Status |
| --- | --- | --- | --- |
| PC hero | temporary admin-managed image set as hero | public PC page changed | PASS |
| PC card | same image set as card | MoPlayer family page changed | PASS |
| PC screenshot | same image set as screenshot | PC gallery changed | PASS |
| PC restore | original release setting restored | QA image disappeared | PASS |
| PC no file | no installer file configured | download button hidden | PASS |
| PC API | no installer file configured | latest download API returns 404 instead of fake file | PASS |
| PC maintenance | code path reads `maintenance` and `maintenanceMessage` | page hides downloads and shows notice | PASS |
| Pro/Classic family cards | public hub reads managed ecosystem data first | no hardcoded-only card source | PASS |

Evidence:
- `tmp-admin/qa/pc-public-reflection-result.json`
- `tmp-admin/qa/public-moplayer-pc.png`
- `tmp-admin/qa/public-moplayer-family.png`

Remaining:
- Full browser mutation for every Pro/Classic field was not repeated this session. Existing admin controls and public readers were audited, but the critical failing PC path received the full reversible mutation proof.
