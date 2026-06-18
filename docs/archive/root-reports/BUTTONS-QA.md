# Buttons and Routes QA - 2026-06-15

## Browser QA

| Area | Result |
| --- | --- |
| `/en/ai` desktop | Page loaded, title/H1 rendered, chat thread and form present, navigation includes Mo Ai. |
| `/en/ai` mobile 390px | No horizontal overflow; chat console and form fit inside viewport. |
| `/en/support` desktop | Product, issue, device, version, contact, screenshot, message, and submit controls present. |
| `/en/support` mobile 390px | Form controls fit inside viewport; no internal TODO/legal text visible. |
| `/en/impressum` unpublished | Returned not-found state as expected. |
| Footer legal gate | Privacy remains visible; Impressum/terms links are hidden until admin publishes legal pages. |
| Admin image coverage | Key site image slots now support library selection and direct upload for home, apps, AI, support, and legal visuals. |

## Not Submitted

- Support form was not submitted in browser QA to avoid creating a real support request/email side effect.
- Admin legal form was build-verified but not submitted because admin authentication/session state was not part of this task.
