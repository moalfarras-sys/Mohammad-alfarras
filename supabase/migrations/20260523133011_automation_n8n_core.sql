create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source text not null default 'web',
  product_slug text,
  subject_type text,
  subject_id text,
  idempotency_key text,
  priority text not null default 'normal',
  status text not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  n8n_execution_id text,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  processed_at timestamptz
);

create unique index if not exists automation_events_idempotency_key_idx
  on public.automation_events(idempotency_key)
  where idempotency_key is not null;

create index if not exists automation_events_status_created_idx
  on public.automation_events(status, created_at desc);

create index if not exists automation_events_product_created_idx
  on public.automation_events(product_slug, created_at desc);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.automation_events(id) on delete set null,
  workflow_key text not null,
  workflow_name text,
  status text not null default 'started',
  n8n_execution_id text,
  duration_ms integer,
  input_summary jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz
);

create index if not exists automation_runs_event_idx
  on public.automation_runs(event_id, started_at desc);

create index if not exists automation_runs_workflow_status_idx
  on public.automation_runs(workflow_key, status, started_at desc);

create table if not exists public.automation_inbox (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.automation_events(id) on delete set null,
  run_id uuid references public.automation_runs(id) on delete set null,
  product_slug text,
  title text not null,
  body text not null default '',
  severity text not null default 'info',
  status text not null default 'new',
  action_type text,
  action_payload jsonb not null default '{}'::jsonb,
  created_by text not null default 'n8n',
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  resolved_at timestamptz
);

create index if not exists automation_inbox_product_created_idx
  on public.automation_inbox(product_slug, created_at desc);

create index if not exists automation_inbox_status_created_idx
  on public.automation_inbox(status, created_at desc);

create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  description text not null default '',
  enabled boolean not null default true,
  trigger_type text not null default 'event',
  event_types text[] not null default '{}',
  workflow_key text not null,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.automation_events enable row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_inbox enable row level security;
alter table public.automation_rules enable row level security;

drop policy if exists "automation_events_admin_read" on public.automation_events;
create policy "automation_events_admin_read"
on public.automation_events for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "automation_runs_admin_read" on public.automation_runs;
create policy "automation_runs_admin_read"
on public.automation_runs for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "automation_inbox_admin_read" on public.automation_inbox;
create policy "automation_inbox_admin_read"
on public.automation_inbox for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "automation_rules_admin_read" on public.automation_rules;
create policy "automation_rules_admin_read"
on public.automation_rules for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

insert into public.automation_rules (key, label, description, event_types, workflow_key, config)
values
  ('site-assistant-lead', 'Site assistant lead', 'Notify or process high-intent website assistant conversations.', array['site_assistant.message'], 'site-assistant-lead', '{}'::jsonb),
  ('app-diagnostic-report', 'App diagnostic report', 'Review diagnostic reports coming from MoPlayer clients.', array['app.diagnostic'], 'app-diagnostic-report', '{}'::jsonb),
  ('contact-message', 'Contact message', 'Handle new website contact messages.', array['contact.message'], 'contact-message', '{}'::jsonb),
  ('release-health', 'Release health', 'Track release and runtime health signals.', array['app.release','app.runtime'], 'release-health', '{}'::jsonb)
on conflict (key) do nothing;
