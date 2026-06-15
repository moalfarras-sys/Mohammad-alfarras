# MoPlayer PC Admin Image QA

Date: 2026-06-15

Primary bug: owner changed MoPlayer PC images from admin but public pages did not update.

## Fixes

- Added real MoPlayer PC media controls in `apps/admin/src/components/admin/pages/pc-control.tsx`.
- PC admin now supports:
  - hero image upload
  - card image upload
  - multiple screenshots
  - screenshot alt text
  - screenshot order number
  - screenshot delete
  - hero/card clear
- PC uploads now go through `uploadWebsiteMedia`, which writes to `site-media` and `media_assets`.
- Public PC page now reads `heroImage`, `heroAlt`, `cardImage`, `cardAlt`, and ordered `screenshotItems`.
- MoPlayer family page now reads PC managed media instead of hardcoded fallback first.
- PC download buttons are hidden when no release file is configured.

## Reversible Proof

1. Created temporary QA image: `tmp-admin/qa/pc-admin-qa.png`.
2. Uploaded it into the same storage/media flow used by admin.
3. Set it as:
   - `windows_release.heroImage`
   - `windows_release.cardImage`
   - first `windows_release.screenshotItems` entry
4. Revalidated public CMS paths.
5. Opened `/en/apps/moplayer-pc`.
6. Verified the QA image URL appeared in hero/gallery.
7. Opened `/en/apps/moplayer`.
8. Verified the same QA image appeared in the MoPlayer PC family card/gallery.
9. Restored original `windows_release`.
10. Removed QA media asset/storage object.
11. Revalidated and verified the QA image no longer appeared.

Evidence:
- `tmp-admin/qa/pc-public-reflection-result.json`
- `tmp-admin/qa/pc-admin-image-qa-active.json`
- `tmp-admin/qa/pc-admin-image-qa-restore.json`
- `tmp-admin/qa/public-moplayer-pc-qa-active.png`
- `tmp-admin/qa/public-moplayer-family-qa-active.png`
- `tmp-admin/qa/admin-moplayer-pc.png`

Screenshots:

![MoPlayer PC public QA active](tmp-admin/qa/public-moplayer-pc-qa-active.png)

![MoPlayer family QA active](tmp-admin/qa/public-moplayer-family-qa-active.png)

## Result

| Test | Result |
| --- | --- |
| Admin has PC hero upload | PASS |
| Admin has PC card upload | PASS |
| Admin has PC screenshots gallery | PASS |
| Alt text editable | PASS |
| Order editable by number | PASS |
| Hero reflected on PC page | PASS |
| Screenshot reflected on PC page | PASS |
| Card reflected on MoPlayer family page | PASS |
| Restore removed QA image from public pages | PASS |

Note: Drag/drop was implemented as sortable order numbers, not pointer drag/drop. This is deliberate because it is simpler, accessible, and stable for admin use.
