-- Admin operations, app telemetry, and stale activation cleanup.

alter table if exists public.app_support_requests
  drop constraint if exists app_support_requests_status_check;

alter table if exists public.app_support_requests
  add constraint app_support_requests_status_check
  check (status in ('new', 'resolved', 'archived'));

alter table if exists public.contact_messages
  add column if not exists status text not null default 'new',
  add column if not exists replied_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table if exists public.contact_messages
  drop constraint if exists contact_messages_status_check;

alter table if exists public.contact_messages
  add constraint contact_messages_status_check
  check (status in ('new', 'read', 'replied', 'resolved', 'archived'));

create table if not exists public.app_device_events (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null default 'moplayer' check (product_slug in ('moplayer', 'moplayer2')),
  public_device_id text not null,
  event_type text not null,
  app_version text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_device_events_product_created_idx
  on public.app_device_events(product_slug, created_at desc);

create index if not exists app_device_events_device_created_idx
  on public.app_device_events(public_device_id, created_at desc);

alter table public.app_device_events enable row level security;

drop policy if exists "app_device_events_insert" on public.app_device_events;
create policy "app_device_events_insert"
on public.app_device_events
for insert
to anon, authenticated
with check (event_type <> '');

drop policy if exists "app_device_events_admin_read" on public.app_device_events;
create policy "app_device_events_admin_read"
on public.app_device_events
for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

create or replace function public.cleanup_stale_activation_requests(retention interval default interval '24 hours')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.activation_requests
  where status in ('waiting', 'expired', 'failed')
    and created_at < timezone('utc', now()) - retention;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.cleanup_stale_activation_requests(interval) is
  'Deletes unactivated stale activation/password requests older than the configured retention window.';

revoke execute on function public.cleanup_stale_activation_requests(interval) from public;
revoke execute on function public.cleanup_stale_activation_requests(interval) from anon;
revoke execute on function public.cleanup_stale_activation_requests(interval) from authenticated;
