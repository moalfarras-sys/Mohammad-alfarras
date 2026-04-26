create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  public_device_id text not null unique,
  name text,
  platform text not null default 'android',
  device_type text not null default 'unknown',
  app_version text,
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked', 'revoked')),
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.activation_requests (
  id uuid primary key default gen_random_uuid(),
  public_device_id text not null references public.devices(public_device_id) on delete cascade,
  device_code text not null unique,
  status text not null default 'waiting' check (status in ('waiting', 'activated', 'expired', 'failed')),
  expires_at timestamptz not null,
  activated_at timestamptz,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists activation_requests_code_idx on public.activation_requests(device_code);
create index if not exists activation_requests_device_idx on public.activation_requests(public_device_id, created_at desc);
create index if not exists devices_last_seen_idx on public.devices(last_seen_at desc);

create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  device_id uuid not null references public.devices(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  valid_until timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists licenses_device_unique_idx on public.licenses(device_id);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  description text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_settings add column if not exists key text;
alter table public.app_settings add column if not exists value jsonb not null default '{}'::jsonb;
alter table public.app_settings add column if not exists description text;
alter table public.app_settings add column if not exists updated_at timestamptz not null default timezone('utc', now());
create unique index if not exists app_settings_key_unique_idx on public.app_settings(key);

alter table public.devices enable row level security;
alter table public.activation_requests enable row level security;
alter table public.licenses enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "devices_admin_read" on public.devices;
create policy "devices_admin_read"
on public.devices for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "activation_requests_admin_read" on public.activation_requests;
create policy "activation_requests_admin_read"
on public.activation_requests for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "licenses_admin_read" on public.licenses;
create policy "licenses_admin_read"
on public.licenses for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "app_settings_public_read" on public.app_settings;
create policy "app_settings_public_read"
on public.app_settings for select
to anon, authenticated
using (key in ('moplayer_public_config'));

drop policy if exists "app_settings_admin_read" on public.app_settings;
create policy "app_settings_admin_read"
on public.app_settings for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

insert into public.app_settings (key, value, description)
values (
  'moplayer_public_config',
  '{
    "enabled": true,
    "maintenanceMode": false,
    "forceUpdate": false,
    "minimumVersionCode": 2,
    "latestVersionName": "2.0.0",
    "message": "",
    "accentColor": "#00e5ff",
    "logoUrl": "/images/moplayer-icon-512.png",
    "backgroundUrl": "/images/moplayer-tv-banner.png",
    "widgets": {
      "weather": true,
      "football": true
    },
    "supportUrl": "https://moalfarras.space/en/contact",
    "privacyUrl": "https://moalfarras.space/privacy"
  }'::jsonb,
  'Public MoPlayer runtime configuration consumed by Android and admin.'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = timezone('utc', now());
