# Database (PostgreSQL)

| What you might expect | Where it lives in this repo |
| --- | --- |
| `schema/` | Table definitions are **versioned SQL** — read the `create table` / `alter` statements in each migration file. |
| `migrations/` | [`../supabase/migrations`](../supabase/migrations) |
| `seed/` | [`../supabase/seed.sql`](../supabase/seed.sql) (when present) + app-specific seed scripts in docs/README |

Apply migrations with Supabase CLI (`supabase db push`) or your SQL runner; see the root [README.md](../README.md) **Supabase** section.

There is no separate ORM schema file yet: the source of truth is **SQL migrations** plus app types in TypeScript.
