create table if not exists page_blocks (
  id text primary key,
  page_slug text not null,
  block_type text not null,
  sort_order int not null default 0,
  is_enabled boolean not null default true,
  config_json jsonb not null default '{}'::jsonb
);

create table if not exists page_block_translations (
  block_id text not null references page_blocks(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  content_json jsonb not null default '{}'::jsonb,
  primary key (block_id, locale)
);

create table if not exists work_projects (
  id text primary key,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order int not null default 0,
  project_url text not null default '',
  repo_url text not null default '',
  cover_media_id text references media_assets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists work_project_translations (
  project_id text not null references work_projects(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  title text not null,
  summary text not null,
  description text not null,
  cta_label text not null,
  primary key (project_id, locale)
);

create table if not exists experiences (
  id text primary key,
  is_active boolean not null default true,
  sort_order int not null default 0,
  company text not null,
  location text not null,
  start_date date not null,
  end_date date,
  "current_role" boolean not null default false,
  logo_media_id text references media_assets(id) on delete set null
);

create table if not exists experience_translations (
  experience_id text not null references experiences(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  role_title text not null,
  description text not null,
  highlights_json jsonb not null default '[]'::jsonb,
  primary key (experience_id, locale)
);

create table if not exists certifications (
  id text primary key,
  is_active boolean not null default true,
  sort_order int not null default 0,
  issuer text not null,
  issue_date date not null,
  expiry_date date,
  credential_url text not null default '',
  certificate_media_id text references media_assets(id) on delete set null
);

create table if not exists certification_translations (
  certification_id text not null references certifications(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  name text not null,
  description text not null,
  primary key (certification_id, locale)
);

create table if not exists service_offerings (
  id text primary key,
  is_active boolean not null default true,
  sort_order int not null default 0,
  icon text not null,
  color_token text not null
);

create table if not exists service_offering_translations (
  service_id text not null references service_offerings(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  title text not null,
  description text not null,
  bullets_json jsonb not null default '[]'::jsonb,
  primary key (service_id, locale)
);

create table if not exists contact_channels (
  id text primary key,
  channel_type text not null check (channel_type in ('whatsapp','email','linkedin','telegram','instagram','youtube','custom')),
  value text not null,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  icon text not null default 'link',
  label_default text not null default ''
);

create table if not exists contact_channel_translations (
  channel_id text not null references contact_channels(id) on delete cascade,
  locale text not null check (locale in ('ar', 'en')),
  label text not null,
  description text not null,
  primary key (channel_id, locale)
);

alter table page_blocks enable row level security;
alter table page_block_translations enable row level security;
alter table work_projects enable row level security;
alter table work_project_translations enable row level security;
alter table experiences enable row level security;
alter table experience_translations enable row level security;
alter table certifications enable row level security;
alter table certification_translations enable row level security;
alter table service_offerings enable row level security;
alter table service_offering_translations enable row level security;
alter table contact_channels enable row level security;
alter table contact_channel_translations enable row level security;

drop policy if exists "public_read_page_blocks" on page_blocks;
create policy "public_read_page_blocks" on page_blocks for select using (true);

drop policy if exists "public_read_page_block_translations" on page_block_translations;
create policy "public_read_page_block_translations" on page_block_translations for select using (true);

drop policy if exists "public_read_work_projects" on work_projects;
create policy "public_read_work_projects" on work_projects for select using (true);

drop policy if exists "public_read_work_project_translations" on work_project_translations;
create policy "public_read_work_project_translations" on work_project_translations for select using (true);

drop policy if exists "public_read_experiences" on experiences;
create policy "public_read_experiences" on experiences for select using (true);

drop policy if exists "public_read_experience_translations" on experience_translations;
create policy "public_read_experience_translations" on experience_translations for select using (true);

drop policy if exists "public_read_certifications" on certifications;
create policy "public_read_certifications" on certifications for select using (true);

drop policy if exists "public_read_certification_translations" on certification_translations;
create policy "public_read_certification_translations" on certification_translations for select using (true);

drop policy if exists "public_read_service_offerings" on service_offerings;
create policy "public_read_service_offerings" on service_offerings for select using (true);

drop policy if exists "public_read_service_offering_translations" on service_offering_translations;
create policy "public_read_service_offering_translations" on service_offering_translations for select using (true);

drop policy if exists "public_read_contact_channels" on contact_channels;
create policy "public_read_contact_channels" on contact_channels for select using (true);

drop policy if exists "public_read_contact_channel_translations" on contact_channel_translations;
create policy "public_read_contact_channel_translations" on contact_channel_translations for select using (true);

drop policy if exists "public_write_page_blocks" on page_blocks;
create policy "public_write_page_blocks" on page_blocks for all using (true) with check (true);

drop policy if exists "public_write_page_block_translations" on page_block_translations;
create policy "public_write_page_block_translations" on page_block_translations for all using (true) with check (true);

drop policy if exists "public_write_work_projects" on work_projects;
create policy "public_write_work_projects" on work_projects for all using (true) with check (true);

drop policy if exists "public_write_work_project_translations" on work_project_translations;
create policy "public_write_work_project_translations" on work_project_translations for all using (true) with check (true);

drop policy if exists "public_write_experiences" on experiences;
create policy "public_write_experiences" on experiences for all using (true) with check (true);

drop policy if exists "public_write_experience_translations" on experience_translations;
create policy "public_write_experience_translations" on experience_translations for all using (true) with check (true);

drop policy if exists "public_write_certifications" on certifications;
create policy "public_write_certifications" on certifications for all using (true) with check (true);

drop policy if exists "public_write_certification_translations" on certification_translations;
create policy "public_write_certification_translations" on certification_translations for all using (true) with check (true);

drop policy if exists "public_write_service_offerings" on service_offerings;
create policy "public_write_service_offerings" on service_offerings for all using (true) with check (true);

drop policy if exists "public_write_service_offering_translations" on service_offering_translations;
create policy "public_write_service_offering_translations" on service_offering_translations for all using (true) with check (true);

drop policy if exists "public_write_contact_channels" on contact_channels;
create policy "public_write_contact_channels" on contact_channels for all using (true) with check (true);

drop policy if exists "public_write_contact_channel_translations" on contact_channel_translations;
create policy "public_write_contact_channel_translations" on contact_channel_translations for all using (true) with check (true);
