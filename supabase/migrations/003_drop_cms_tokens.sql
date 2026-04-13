-- Drop legacy CMS color-token table (styling is fixed in CSS).

drop policy if exists "public_read_theme_tokens" on theme_tokens;
drop policy if exists "public_write_theme_tokens" on theme_tokens;

drop table if exists theme_tokens;
