# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

This is the **moalfarras.space** monorepo containing:
- `apps/web` — Next.js 16 public website (port 3000)
- `apps/admin` — Next.js 16 admin dashboard (port 3001)
- `packages/shared` — Shared TypeScript helpers
- `android/moplayer` — Android app (not needed for web dev)

### Node version

Use Node.js 20 (matches CI). nvm is installed; load it with:
```bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
```

### Key commands

All commands from repo root — see `package.json` `scripts` for the full list:

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev web | `npm run dev:web` |
| Dev admin | `cd apps/admin && npx next dev --port 3001` |
| Lint web | `npm run lint:web` |
| Lint admin | `npm run lint:admin` |
| Typecheck web | `npm run typecheck:web` |
| Typecheck admin | `npm run typecheck:admin` |
| Tests (vitest) | `npm run test:web` |
| Build both | `npm run build` |

### Environment files

Both apps need `.env.local` files (copied from `.env.example`). For local dev without a real Supabase instance, placeholder values in these files allow the dev servers to start and serve pages. Supabase-dependent features (auth, data fetching) will gracefully degrade.

### Gotchas

- `npm run dev:admin -- --port 3001` does NOT work due to how npm forwards the argument. Use `cd apps/admin && npx next dev --port 3001` instead, or just run `npm run dev:admin` (defaults to 3000, so run web first on a different port or run them separately).
- The web app redirects `/` to `/{defaultLocale}` (307). Hit `/en` or `/ar` directly to see content.
- Build requires the `.env.local` files to be present (Next.js reads env at build time).
- The `@moalfarras/shared` package is a local workspace dependency (`file:../../packages/shared`) — no separate build step needed.
