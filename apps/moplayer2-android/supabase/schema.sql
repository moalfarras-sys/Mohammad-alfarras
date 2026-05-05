create extension if not exists pgcrypto;

create table if not exists public.iptv_servers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  server_type text not null check (server_type in ('m3u', 'xtream')),
  base_url text not null default '',
  username text not null default '',
  password text not null default '',
  playlist_url text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aecodes (
  code text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  server_id uuid references public.iptv_servers(id) on delete set null,
  server_name text not null,
  server_type text not null check (server_type in ('m3u', 'xtream')),
  base_url text not null default '',
  username text not null default '',
  password text not null default '',
  playlist_url text not null default '',
  device_label text not null default '',
  max_devices int not null default 1,
  activated_count int not null default 0,
  expires_at timestamptz,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create table if not exists public.tv_devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  code text references public.aecodes(code) on delete set null,
  device_name text not null default 'Android TV',
  device_fingerprint text not null default '',
  app_version text not null default '',
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.device_activation_codes (
  device_code text primary key,
  user_code text not null unique,
  verification_url text not null,
  verification_url_complete text not null,
  device_name text not null default 'Android TV',
  device_label text not null default 'Android TV',
  app_version text not null default '',
  status text not null default 'pending' check (status in ('pending', 'activated', 'consumed', 'expired', 'error')),
  server_name text not null default '',
  server_type text not null default '',
  base_url text not null default '',
  username text not null default '',
  password text not null default '',
  playlist_url text not null default '',
  poll_interval_seconds int not null default 5,
  error_message text not null default '',
  expires_at timestamptz not null,
  activated_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.iptv_servers enable row level security;
alter table public.aecodes enable row level security;
alter table public.tv_devices enable row level security;
alter table public.device_activation_codes enable row level security;

drop policy if exists "servers owner read" on public.iptv_servers;
drop policy if exists "servers owner write" on public.iptv_servers;
drop policy if exists "aecodes owner read" on public.aecodes;
drop policy if exists "aecodes owner write" on public.aecodes;
drop policy if exists "aecodes public activation read" on public.aecodes;
drop policy if exists "devices owner read" on public.tv_devices;
drop policy if exists "devices owner write" on public.tv_devices;
drop policy if exists "device activation public create" on public.device_activation_codes;
drop policy if exists "device activation public read active" on public.device_activation_codes;
drop policy if exists "device activation public activate" on public.device_activation_codes;

create policy "servers owner read" on public.iptv_servers for select using (auth.uid() = owner_id);
create policy "servers owner write" on public.iptv_servers for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "aecodes owner read" on public.aecodes for select using (auth.uid() = owner_id);
create policy "aecodes owner write" on public.aecodes for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "aecodes public activation read" on public.aecodes for select using (revoked = false and (expires_at is null or expires_at > now()));

create policy "devices owner read" on public.tv_devices for select using (auth.uid() = owner_id);
create policy "devices owner write" on public.tv_devices for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "device activation public create" on public.device_activation_codes
for insert with check (expires_at > now() and status = 'pending');

create policy "device activation public read active" on public.device_activation_codes
for select using (expires_at > now() or status in ('activated', 'consumed', 'error'));

create policy "device activation public activate" on public.device_activation_codes
for update using (status in ('pending', 'activated')) with check (status in ('activated', 'consumed', 'expired', 'error'));

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists iptv_servers_touch on public.iptv_servers;
create trigger iptv_servers_touch
before update on public.iptv_servers
for each row execute function public.touch_updated_at();

drop trigger if exists device_activation_codes_touch on public.device_activation_codes;
create trigger device_activation_codes_touch
before update on public.device_activation_codes
for each row execute function public.touch_updated_at();
