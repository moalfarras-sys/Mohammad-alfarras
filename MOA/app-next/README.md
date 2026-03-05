# MOALFARRAS App (Next.js)

## Stack
- Next.js App Router (TypeScript)
- Bilingual routes: `/ar` and `/en`
- Admin panel: `/{locale}/admin`
- Supabase-ready schema under `supabase/migrations`
- PWA: `manifest` + `public/sw.js`

## Quick Start
```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `ADMIN_PASSWORD` to secure `/admin` login.

## Scripts
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run migrate:static`

## Supabase
Run SQL migration from:
- `supabase/migrations/001_init.sql`

Then wire env vars in `.env.local`.

## Content Migration
To generate imported legacy data summary:
```bash
npm run migrate:static
```
Output: `src/data/legacy-import.json`
