# SEO Report - 2026-06-15

## Updated

- Added metadata, Open Graph, canonical alternates, breadcrumb JSON-LD, and WebPage JSON-LD for `/en/ai` and `/ar/ai`.
- Added `/ai` to `sitemap.ts`.
- Added legal routes to the sitemap only when the `legal_pages` setting is complete and published.
- Legal pages return `notFound()` while unpublished, preventing incomplete Impressum/terms pages from being indexed.

## Checked

- `next build` generated localized AI and legal routes successfully.
- Local hidden `/en/impressum` returned a not-found state before admin publication.
- Footer does not expose Impressum/terms links while legal pages are unpublished.

## Notes

- Privacy remains public.
- Search Console submission still requires the owner account after deployment.
