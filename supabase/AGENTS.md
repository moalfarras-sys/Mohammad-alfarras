# Agent Guide: Supabase Schema

This folder owns database migrations and Supabase project schema history. It is not application runtime code.

## Ecosystem Context

- Public APIs live in `../apps/web/src/app/api`.
- Admin actions live in `../apps/admin/src/app/actions.ts`.
- Server DB helpers live in `../packages/db`.
- Product slug helpers live in `../packages/shared`.
- Android apps consume activation/config/source data through web APIs.

## What This Folder Owns

- Ordered SQL migrations in `migrations/`.
- Schema changes for app products, releases, activation, devices, sources, website CMS, media, and support flows.

## Critical Rules

- Do not edit old applied migrations unless the user explicitly asks and the production migration state is understood.
- Add a new migration for schema/data changes.
- Preserve product separation: `moplayer` and `moplayer2`.
- Treat service role and database credentials as secrets.
- RLS/security changes must be reviewed carefully against public web APIs and admin operations.

## Modern Skills Required

For Supabase Auth, RLS, Storage, Postgres policies, performance indexes, and migrations, verify current Supabase docs and advisors before changing production behavior.

## Verification

After migration changes:

- verify affected public API routes in `../apps/web`;
- verify affected admin flows in `../apps/admin`;
- document the migration order and any manual production step in `../docs/PROJECT_HANDOFF.md` or `../docs/PRODUCTION_GUIDE.md`.
