create table if not exists public.app_private_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_private_settings enable row level security;

drop policy if exists "app_private_settings_no_client_read" on public.app_private_settings;
drop policy if exists "app_private_settings_no_client_write" on public.app_private_settings;

create policy "app_private_settings_no_client_read"
on public.app_private_settings for select
to anon, authenticated
using (false);

create policy "app_private_settings_no_client_write"
on public.app_private_settings for all
to anon, authenticated
using (false)
with check (false);
