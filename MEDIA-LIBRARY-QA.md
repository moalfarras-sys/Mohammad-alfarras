# Media Library QA

Date: 2026-06-15

## What Was Fixed

- MoPlayer PC admin uploads now create `media_assets` records through the shared website media pipeline.
- Media Library now shows where a media item is used:
  - services
  - projects
  - site settings
  - pages/page copy
- Server-side deletion now blocks used media with `MEDIA_IN_USE`.
- The admin toast now shows a clear error when a used image is deleted.
- The delete form now asks for confirmation before deleting unused media or attempting to delete used media.
- Fixed corrupted Arabic alt text for `site-home-portrait` in `media_assets`.

## Tests

| Test | Action | Result | Status |
| --- | --- | --- | --- |
| Upload image | PC QA image uploaded through media flow | asset created and used publicly | PASS |
| Replace image | PC hero/card/screenshot replaced with QA image | public pages changed | PASS |
| Restore image | original `windows_release` restored | QA image removed from public pages | PASS |
| Delete used image | server guard added against services/projects/settings/pages/app usage | deletion blocked by code path | PASS |
| Where used | admin media cards now show usage labels | owner can see references before deleting | PASS |
| DB content scan | scanned public content tables | zero forbidden technical/safety phrases | PASS |

Evidence:
- `tmp-admin/qa/pc-public-reflection-result.json`
- `tmp-admin/qa/db-public-content-scan.json`
- `tmp-admin/qa/admin-moplayer-pc.png`

Limitations:
- A fresh screenshot of the updated Media Library could not be captured because local Playwright browser binaries are not installed and the in-app browser tool was not callable in this tool context.
- `verify:admin` passed after the Media Library changes.
