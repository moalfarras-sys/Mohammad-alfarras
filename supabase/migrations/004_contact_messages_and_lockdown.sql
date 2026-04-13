create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  budget text,
  locale text not null check (locale in ('ar', 'en')),
  project_types jsonb not null default '[]'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;

drop policy if exists "deny_public_contact_messages" on contact_messages;
create policy "deny_public_contact_messages" on contact_messages for select using (false);

drop policy if exists "public_write_youtube_videos" on youtube_videos;
drop policy if exists "public_write_page_blocks" on page_blocks;
drop policy if exists "public_write_page_block_translations" on page_block_translations;
drop policy if exists "public_write_work_projects" on work_projects;
drop policy if exists "public_write_work_project_translations" on work_project_translations;
drop policy if exists "public_write_experiences" on experiences;
drop policy if exists "public_write_experience_translations" on experience_translations;
drop policy if exists "public_write_certifications" on certifications;
drop policy if exists "public_write_certification_translations" on certification_translations;
drop policy if exists "public_write_service_offerings" on service_offerings;
drop policy if exists "public_write_service_offering_translations" on service_offering_translations;
drop policy if exists "public_write_contact_channels" on contact_channels;
drop policy if exists "public_write_contact_channel_translations" on contact_channel_translations;
