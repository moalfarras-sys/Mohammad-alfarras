create table if not exists pages (
  id text primary key,
  slug text not null unique,
  status text not null check (status in ('draft', 'published')),
  template text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists page_translations (
  page_id text not null references pages(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  title text not null,
  meta_title text not null,
  meta_description text not null,
  og_title text not null,
  og_description text not null,
  primary key (page_id, locale)
);

create table if not exists sections (
  id text primary key,
  page_id text not null references pages(id) on delete cascade,
  section_key text not null,
  section_type text not null,
  sort_order int not null,
  is_enabled boolean not null default true
);

create table if not exists section_translations (
  section_id text not null references sections(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  content_json jsonb not null default '{}'::jsonb,
  primary key (section_id, locale)
);

create table if not exists navigation_items (
  id text primary key,
  sort_order int not null,
  href_slug text not null,
  icon text not null,
  is_enabled boolean not null default true
);

create table if not exists navigation_translations (
  nav_item_id text not null references navigation_items(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  label text not null,
  primary key (nav_item_id, locale)
);

create table if not exists theme_tokens (
  id text primary key,
  mode text not null check (mode in ('light', 'dark')),
  token_key text not null,
  token_value text not null,
  unique(mode, token_key)
);

create table if not exists media_assets (
  id text primary key,
  path text not null,
  alt_ar text not null,
  alt_en text not null,
  width int not null,
  height int not null,
  type text not null
);

create table if not exists youtube_videos (
  id text primary key,
  youtube_id text not null,
  title_ar text not null,
  title_en text not null,
  description_ar text not null,
  description_en text not null,
  thumbnail text not null,
  duration text not null,
  views int not null default 0,
  published_at timestamptz not null,
  sort_order int not null,
  is_featured boolean not null default false,
  is_active boolean not null default true
);

create table if not exists site_settings (
  key text primary key,
  value_json jsonb not null
);

create table if not exists audit_logs (
  id text primary key,
  admin_user_id text not null,
  action text not null,
  entity text not null,
  entity_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table pages enable row level security;
alter table page_translations enable row level security;
alter table sections enable row level security;
alter table section_translations enable row level security;
alter table navigation_items enable row level security;
alter table navigation_translations enable row level security;
alter table theme_tokens enable row level security;
alter table media_assets enable row level security;
alter table youtube_videos enable row level security;
alter table site_settings enable row level security;
alter table audit_logs enable row level security;

drop policy if exists "public_read_pages" on pages;
create policy "public_read_pages" on pages for select using (true);

drop policy if exists "public_read_page_translations" on page_translations;
create policy "public_read_page_translations" on page_translations for select using (true);

drop policy if exists "public_read_sections" on sections;
create policy "public_read_sections" on sections for select using (true);

drop policy if exists "public_read_section_translations" on section_translations;
create policy "public_read_section_translations" on section_translations for select using (true);

drop policy if exists "public_read_navigation_items" on navigation_items;
create policy "public_read_navigation_items" on navigation_items for select using (true);

drop policy if exists "public_read_navigation_translations" on navigation_translations;
create policy "public_read_navigation_translations" on navigation_translations for select using (true);

drop policy if exists "public_read_theme_tokens" on theme_tokens;
create policy "public_read_theme_tokens" on theme_tokens for select using (true);

drop policy if exists "public_read_media_assets" on media_assets;
create policy "public_read_media_assets" on media_assets for select using (true);

drop policy if exists "public_read_youtube_videos" on youtube_videos;
create policy "public_read_youtube_videos" on youtube_videos for select using (true);

drop policy if exists "public_read_site_settings" on site_settings;
create policy "public_read_site_settings" on site_settings for select using (true);

drop policy if exists "public_write_theme_tokens" on theme_tokens;
create policy "public_write_theme_tokens" on theme_tokens for all using (true) with check (true);

drop policy if exists "public_write_youtube_videos" on youtube_videos;
create policy "public_write_youtube_videos" on youtube_videos for all using (true) with check (true);
