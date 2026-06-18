# Admin CMS Report - 2026-06-15

## Added

- Website Control now includes a Legal Pages accordion.
- Admin can manage:
  - publish toggle
  - responsible name
  - business name
  - address
  - email
  - phone
  - tax/VAT ID
  - register entry
  - privacy, terms, app disclaimer, and download disclaimer extra notes
- Server action `saveLegalPagesAction` blocks publication when responsible name, address, or email is missing.
- Toast messages were added for successful legal saves and blocked incomplete publish attempts.
- Key site images can be changed from the media library or by direct device upload in the same form:
  - homepage portrait
  - homepage product image
  - homepage activation image
  - apps hero
  - AI page hero
  - support page hero
  - legal pages hero

## Public Effects

- Published legal data controls public legal routes, footer links, and sitemap entries.
- Privacy can display an extra admin-managed note.
- CMS project cover/gallery selections are now respected; hard-coded project visual overrides were removed.

## Verification

- `npm run verify:admin` passed.
