create table if not exists public.app_diagnostic_reports (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null default 'moplayer',
  public_device_id text not null,
  app_version text,
  app_version_code integer,
  locale text not null default 'en',
  category text not null default 'general',
  severity text not null default 'normal',
  status text not null default 'new',
  customer_email text,
  customer_message text not null default '',
  diagnostic_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists app_diagnostic_reports_product_created_idx
  on public.app_diagnostic_reports(product_slug, created_at desc);

create index if not exists app_diagnostic_reports_status_created_idx
  on public.app_diagnostic_reports(status, created_at desc);

alter table public.app_diagnostic_reports enable row level security;

drop policy if exists "app_diagnostic_reports_insert" on public.app_diagnostic_reports;
create policy "app_diagnostic_reports_insert"
on public.app_diagnostic_reports for insert
to anon, authenticated
with check (public_device_id <> '' and customer_message <> '');

drop policy if exists "app_diagnostic_reports_admin_read" on public.app_diagnostic_reports;
create policy "app_diagnostic_reports_admin_read"
on public.app_diagnostic_reports for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "app_diagnostic_reports_admin_update" on public.app_diagnostic_reports;
create policy "app_diagnostic_reports_admin_update"
on public.app_diagnostic_reports for update
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'editor')))
with check (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'editor')));
