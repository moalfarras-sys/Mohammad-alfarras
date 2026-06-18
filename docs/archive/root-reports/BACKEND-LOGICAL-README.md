# Backend (logical)

This monorepo does **not** use a separate deployable `backend/` service folder. Instead, capabilities are grouped as follows:

| Logical piece | Implementation |
| --- | --- |
| **api** | [`apps/web/src/app/api`](../apps/web/src/app/api) (Route Handlers) |
| **auth** | Supabase Auth + [`apps/admin/src/lib/admin-auth.ts`](../apps/admin/src/lib/admin-auth.ts) and related web auth |
| **pdf-generator** | e.g. [`apps/web/src/app/api/cv-pdf`](../apps/web/src/app/api), [`cv-docx`](../apps/web/src/app/api) |
| **email / contact** | e.g. [`apps/web/src/app/api/contact`](../apps/web/src/app/api) |
| **payments / orders** | Not present as a module — integrate a provider + new routes when you add commerce |

Extracting these into `packages/*` or a small Node service is a future refactor if you need one deployment boundary.
