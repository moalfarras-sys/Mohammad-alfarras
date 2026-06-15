# Contact Page Report

Date: 2026-06-15 · Route: `/en/contact`, `/ar/contact` (HTTP 200 both)

## Current state (verified live)

The contact page is a **single full request form** — there is no two-step "Continue" flow. Fields present in the rendered HTML:

- `category` / `projectType` (request type — `<select>`)
- `name`, `email` (`type=email`), `whatsapp`
- `budgetRange` (`<select>`), `timeline` (`<select>`), `preferredTime`
- `description`, `message`
- `consent` (`type=checkbox`)
- `attachment` (`type=file`, optional — image or PDF, max 8 MB) — **added this session**
- `honeypot` (hidden anti-spam field)
- submit button (`type=submit`)

## Behavior / wiring

- Posts to `/api/contact`; stores into `contact_messages` (5 real rows already present in production → confirms intake works end-to-end).
- Routes the request by email to the owner (SMTP env configured: `SMTP_*`, `CONTACT_TO_EMAIL`).
- Captures locale; honeypot guards against basic spam bots.
- Loading / success / error states implemented in `apps/web/src/components/site/liquid-contact-form.tsx`.

## Attachment upload (added this session)
- Optional `attachment` file input (image PNG/JPG/WebP/GIF or PDF, max 8 MB) with bilingual labels and client-side size/type guard.
- `/api/contact` is now **dual-mode**: existing JSON path is unchanged; when a file is attached the form submits `multipart/form-data`, the API uploads to the `support-uploads` bucket under `contact/{requestId}/…`, creates a 14-day signed URL, and includes it in the owner email + stored message.
- Verified: typecheck + lint + build + tests green; file input renders on `/en/contact` and `/ar/contact` with correct `accept` types.

## Notes
- Live form submission / live file upload was **not** triggered this session to avoid writing test rows, sending owner email, and leaving a test object in storage. Intake is evidenced by 5 existing stored messages; the upload path mirrors the already-working support screenshot flow.
