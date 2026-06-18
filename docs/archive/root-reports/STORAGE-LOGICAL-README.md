# Storage

Logical buckets you described map to **hosted storage and static paths** — this folder is documentation only (no runtime sync).

| Role | Typical location in this ecosystem |
| --- | --- |
| Logos / brand | `site_settings` + `media_assets` in Postgres; files often in **Supabase Storage** or `apps/web/public` |
| Invoices / contracts | Not implemented as first-class buckets yet — would be Supabase Storage + DB metadata if you add billing |
| Generated files (PDF, etc.) | Generated on demand via **Next.js API routes** in `apps/web` (e.g. CV PDF/DOCX) or future workers |

Avoid committing large binaries to git; prefer Storage + signed URLs for private assets.
