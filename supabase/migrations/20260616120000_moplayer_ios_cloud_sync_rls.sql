-- MoPlayer iOS cloud sync support.
--
-- This keeps activation/source handoff server-owned while allowing authenticated
-- app sessions, including Supabase anonymous users, to register and update only
-- their own non-sensitive device metadata.

alter table if exists public.devices
  add column if not exists user_id uuid;

create index if not exists devices_user_product_last_seen_idx
  on public.devices(user_id, product_slug, last_seen_at desc)
  where user_id is not null;

drop policy if exists "devices_user_read_own" on public.devices;
create policy "devices_user_read_own"
on public.devices
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "devices_user_insert_own" on public.devices;
create policy "devices_user_insert_own"
on public.devices
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public_device_id ~ '^MO-D-[A-Z0-9-]{8,64}$'
  and product_slug in ('moplayer', 'moplayer2')
  and platform in ('ios', 'android', 'android_tv', 'windows', 'web', 'macos', 'linux', 'fuchsia')
);

drop policy if exists "devices_user_update_own" on public.devices;
create policy "devices_user_update_own"
on public.devices
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and public_device_id ~ '^MO-D-[A-Z0-9-]{8,64}$'
  and product_slug in ('moplayer', 'moplayer2')
  and platform in ('ios', 'android', 'android_tv', 'windows', 'web', 'macos', 'linux', 'fuchsia')
);

comment on column public.devices.user_id is
  'Supabase Auth owner for app-side device registration. Null legacy/service-created rows remain controlled by server/service-role APIs.';

-- Rollback notes:
-- 1. Disable anonymous sign-ins in Supabase Auth if this feature is rolled back.
-- 2. Drop devices_user_read_own, devices_user_insert_own, and devices_user_update_own policies.
-- 3. Drop devices_user_product_last_seen_idx.
-- 4. Drop public.devices.user_id only after confirming no app-side device rows need to be preserved.
