# AI Widget Report

Date: 2026-06-15

## Standalone AI page removed
- `/{locale}/ai` (`apps/web/src/app/[locale]/(site)/ai/page.tsx`) returns `notFound()` for bad locales and otherwise **redirects to `/{locale}`**, with metadata `robots: { index: false, follow: false }` and canonical pointing to the home page.
- **Not** in main navigation (`navigationItems` in `content/site.ts`) or the footer.
- **Absent from sitemap** (`/sitemap.xml` contains no `/ai`).
- **Disallowed in robots**: `Disallow: /ai`, `/ar/ai`, `/en/ai`.

## In-site assistant widget
- The Mo Ai assistant is a **floating widget** (not a page). Confirmed present in `/en` HTML (`mo-ai` markers).
- Opens contextually (e.g. Work/case-study prompts dispatch a `mo-ai:open` browser event).
- Backed by `/api/ai/site-assistant`; conversations/feedback stored server-side.
- Fallback: when AI is unavailable, visitors are routed to the contact form.

## Naming
- Presented as a site assistant; no standalone "Mo Ai" page surfaces to visitors.

## Not verified this session
- Live multi-turn chat against the production AI provider and per-page context behaviour were not exercised end-to-end in a browser this session.
