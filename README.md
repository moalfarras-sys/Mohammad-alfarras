# MOALFARRAS

Next.js 16 bilingual personal website for `moalfarras.space`.

## Current Structure
- `src/app`: routes, layout, metadata, global styles
- `src/components`: site UI, admin UI, shared layout pieces
- `src/data/default-content.ts`: fallback CMS seed
- `src/lib/content/store.ts`: content read layer with Supabase fallback
- `supabase/migrations`: schema for the CMS-backed admin
- `public/images`: local image assets used by the live site
- `tests`: unit and e2e coverage for the current app

## Routes
- `/ar`
- `/en`
- `/{locale}/cv`
- `/{locale}/blog`
- `/{locale}/youtube`
- `/{locale}/contact`
- `/{locale}/privacy`
- `/{locale}/admin`

## Quick Start
```bash
npm install
npm run dev
```

## Required Runtime Environment
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUTUBE_API_KEY`
- `YOUTUBE_CHANNEL_ID`

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`
- `npm run setup:supabase`

## Deployment
- Vercel project: `mohammad-alfarras`
- Production domain: `https://moalfarras.space`
