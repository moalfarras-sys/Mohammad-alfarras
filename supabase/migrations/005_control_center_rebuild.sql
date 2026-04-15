alter table if exists work_projects
  add column if not exists category text not null default 'general',
  add column if not exists featured_rank int;

alter table if exists work_project_translations
  add column if not exists tags_json jsonb not null default '[]'::jsonb,
  add column if not exists challenge text not null default '',
  add column if not exists solution text not null default '',
  add column if not exists result text not null default '';

create table if not exists work_project_media (
  id text primary key,
  project_id text not null references work_projects(id) on delete cascade,
  media_id text not null references media_assets(id) on delete cascade,
  role text not null check (role in ('cover', 'gallery')),
  sort_order int not null default 0
);

create table if not exists work_project_metrics (
  id text primary key,
  project_id text not null references work_projects(id) on delete cascade,
  sort_order int not null default 0,
  value text not null,
  label_ar text not null,
  label_en text not null
);

create index if not exists work_project_media_project_idx on work_project_media(project_id, role, sort_order);
create index if not exists work_project_metrics_project_idx on work_project_metrics(project_id, sort_order);

alter table if exists work_project_media enable row level security;
alter table if exists work_project_metrics enable row level security;

drop policy if exists "public_read_work_project_media" on work_project_media;
create policy "public_read_work_project_media" on work_project_media for select using (true);

drop policy if exists "public_read_work_project_metrics" on work_project_metrics;
create policy "public_read_work_project_metrics" on work_project_metrics for select using (true);

drop policy if exists "public_write_pages" on pages;
drop policy if exists "public_write_page_translations" on page_translations;
drop policy if exists "public_write_sections" on sections;
drop policy if exists "public_write_section_translations" on section_translations;
drop policy if exists "public_write_navigation_items" on navigation_items;
drop policy if exists "public_write_navigation_translations" on navigation_translations;
drop policy if exists "public_write_media_assets" on media_assets;
drop policy if exists "public_write_site_settings" on site_settings;
drop policy if exists "public_write_audit_logs" on audit_logs;
drop policy if exists "public_write_theme_tokens" on theme_tokens;
drop policy if exists "public_write_youtube_videos" on youtube_videos;
drop policy if exists "public_write_page_blocks" on page_blocks;
drop policy if exists "public_write_page_block_translations" on page_block_translations;
drop policy if exists "public_write_work_projects" on work_projects;
drop policy if exists "public_write_work_project_translations" on work_project_translations;
drop policy if exists "public_write_work_project_media" on work_project_media;
drop policy if exists "public_write_work_project_metrics" on work_project_metrics;
drop policy if exists "public_write_experiences" on experiences;
drop policy if exists "public_write_experience_translations" on experience_translations;
drop policy if exists "public_write_certifications" on certifications;
drop policy if exists "public_write_certification_translations" on certification_translations;
drop policy if exists "public_write_service_offerings" on service_offerings;
drop policy if exists "public_write_service_offering_translations" on service_offering_translations;
drop policy if exists "public_write_contact_channels" on contact_channels;
drop policy if exists "public_write_contact_channel_translations" on contact_channel_translations;

drop policy if exists "public_storage_insert_media" on storage.objects;
drop policy if exists "public_storage_update_media" on storage.objects;
drop policy if exists "public_storage_delete_media" on storage.objects;
