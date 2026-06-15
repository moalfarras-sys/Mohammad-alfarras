create table if not exists public.app_download_baselines (
  product_slug text not null,
  platform text not null default 'android',
  baseline_count bigint not null default 0 check (baseline_count >= 0),
  baseline_since timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (product_slug, platform)
);

create table if not exists public.app_download_events (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  platform text not null default 'android',
  release_slug text,
  asset_id text,
  file_name text,
  target_url text,
  user_agent text,
  referer text,
  ip_hash text,
  country text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_download_events_product_created_idx
  on public.app_download_events(product_slug, platform, created_at desc);

create index if not exists app_download_events_release_created_idx
  on public.app_download_events(release_slug, created_at desc)
  where release_slug is not null;

alter table public.app_download_baselines enable row level security;
alter table public.app_download_events enable row level security;

drop policy if exists "app_download_baselines_admin_read" on public.app_download_baselines;
create policy "app_download_baselines_admin_read"
on public.app_download_baselines
for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "app_download_events_admin_read" on public.app_download_events;
create policy "app_download_events_admin_read"
on public.app_download_events
for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

with legacy as (
  select value_json
  from public.site_settings
  where key = 'download_counts'
  limit 1
),
counts as (
  select
    case
      when key like '%:%' then split_part(key, ':', 1)
      else key
    end as product_slug,
    case
      when key like '%:windows' then 'windows'
      else 'android'
    end as platform,
    greatest(0, value::bigint) as baseline_count,
    nullif(legacy.value_json->>'since', '')::timestamptz as baseline_since
  from legacy, jsonb_each_text(coalesce(legacy.value_json->'counts', '{}'::jsonb))
  where value ~ '^[0-9]+$'
)
insert into public.app_download_baselines (product_slug, platform, baseline_count, baseline_since, updated_at)
select product_slug, platform, baseline_count, baseline_since, timezone('utc', now())
from counts
where product_slug in ('moplayer', 'moplayer2')
on conflict (product_slug, platform) do update
set baseline_count = greatest(public.app_download_baselines.baseline_count, excluded.baseline_count),
    baseline_since = coalesce(public.app_download_baselines.baseline_since, excluded.baseline_since),
    updated_at = timezone('utc', now());

create or replace view public.app_download_counts as
with totals as (
  select
    product_slug,
    platform,
    baseline_count as downloads,
    baseline_since as since,
    updated_at
  from public.app_download_baselines
  union all
  select
    product_slug,
    platform,
    count(*)::bigint as downloads,
    min(created_at) as since,
    max(created_at) as updated_at
  from public.app_download_events
  group by product_slug, platform
)
select
  product_slug,
  platform,
  sum(downloads)::bigint as downloads,
  min(since) as since,
  max(updated_at) as updated_at
from totals
group by product_slug, platform;

grant select on public.app_download_counts to anon, authenticated;
grant all on table public.app_download_baselines to service_role;
grant all on table public.app_download_events to service_role;
grant select on public.app_download_counts to service_role;

comment on table public.app_download_events is
  'Append-only analytics events for public app and PC download clicks.';

comment on table public.app_download_baselines is
  'Historical download counts migrated from site_settings.download_counts so counters do not reset when event tracking starts.';

notify pgrst, 'reload schema';
