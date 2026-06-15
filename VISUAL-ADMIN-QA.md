# Visual Admin QA

Date: 2026-06-15

## Screens and Sections Inspected

Inspected locally:
- Admin login
- Dashboard shell
- Website control
- Media Library code and UI structure
- Services controls
- Projects controls
- MoPlayer PC control
- Email/contact/support storage path
- Public PC page
- Public MoPlayer family page

Evidence screenshots:
- `tmp-admin/qa/admin-moplayer-pc.png`
- `tmp-admin/qa/public-moplayer-pc.png`
- `tmp-admin/qa/public-moplayer-family.png`
- `tmp-admin/qa/public-moplayer-pc-qa-active.png`
- `tmp-admin/qa/public-moplayer-family-qa-active.png`

## Findings

| Area | Finding | Fix | Status |
| --- | --- | --- | --- |
| MoPlayer PC images | hero/screenshots existed but did not fully control public PC/family pages | added hero/card/screenshot item flow and public readers | PASS |
| PC gallery | no alt/order editing for individual screenshots | added alt/order forms | PASS |
| PC card image | missing dedicated card image | added card image form/action/public reader | PASS |
| Media Library | used media could be deleted without a clear server guard | added `MEDIA_IN_USE` block and usage labels | PASS |
| Save feedback | existing updated toast supports success/error | added in-use media error toast | PASS |
| Contact/support | public forms needed storage proof | submitted QA contact/support requests and archived them | PASS |

Limitations:
- Full pointer-based drag/drop was not implemented; order number is used instead.
- A fresh Media Library screenshot could not be captured because local Playwright browser binaries were missing and the in-app browser tool was not available in this tool context.
