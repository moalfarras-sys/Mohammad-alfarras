alter table public.devices
  add column if not exists source_pull_token_hash text;

create table if not exists public.device_provider_sources (
  id uuid primary key default gen_random_uuid(),
  public_device_id text not null references public.devices(public_device_id) on delete cascade,
  source_type text not null check (source_type in ('xtream', 'm3u')),
  display_name text not null default 'MoPlayer source',
  encrypted_payload text not null,
  encryption_version text not null default 'aes-256-gcm:v1',
  status text not null default 'pending' check (status in ('pending', 'fetched', 'imported', 'failed', 'revoked')),
  last_test_status text,
  last_test_message text,
  pulled_at timestamptz,
  imported_at timestamptz,
  failed_at timestamptz,
  failure_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists device_provider_sources_device_status_idx
  on public.device_provider_sources(public_device_id, status, created_at desc);

alter table public.device_provider_sources enable row level security;

drop policy if exists "device_provider_sources_admin_read" on public.device_provider_sources;
create policy "device_provider_sources_admin_read"
on public.device_provider_sources for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

comment on table public.device_provider_sources is
  'Encrypted provider source delivery queue for MoPlayer website activation. Provider credentials are encrypted server-side and fetched only by the paired device.';

comment on column public.devices.source_pull_token_hash is
  'Server-side HMAC hash of the device pull token used by MoPlayer to fetch encrypted website-provided sources.';
