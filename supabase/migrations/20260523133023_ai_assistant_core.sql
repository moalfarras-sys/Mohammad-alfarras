create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  locale text not null default 'en',
  channel text not null default 'website',
  page_path text not null default '/',
  status text not null default 'open',
  intent text,
  summary text not null default '',
  lead_score integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_conversations_status_created_idx
  on public.ai_conversations(status, created_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages(conversation_id, created_at);

create table if not exists public.ai_leads (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  locale text not null default 'en',
  name text,
  email text,
  phone text,
  intent text not null default '',
  service_interest text not null default '',
  priority text not null default 'normal',
  summary text not null default '',
  status text not null default 'new',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_leads_status_created_idx
  on public.ai_leads(status, created_at desc);

create table if not exists public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  message_id uuid references public.ai_messages(id) on delete set null,
  rating text not null,
  comment text not null default '',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_feedback_created_idx
  on public.ai_feedback(created_at desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_leads enable row level security;
alter table public.ai_feedback enable row level security;

drop policy if exists "ai_conversations_admin_read" on public.ai_conversations;
create policy "ai_conversations_admin_read"
on public.ai_conversations for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "ai_conversations_admin_update" on public.ai_conversations;
create policy "ai_conversations_admin_update"
on public.ai_conversations for update
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'owner', 'editor')))
with check (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'owner', 'editor')));

drop policy if exists "ai_messages_admin_read" on public.ai_messages;
create policy "ai_messages_admin_read"
on public.ai_messages for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "ai_leads_admin_read" on public.ai_leads;
create policy "ai_leads_admin_read"
on public.ai_leads for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "ai_leads_admin_update" on public.ai_leads;
create policy "ai_leads_admin_update"
on public.ai_leads for update
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'owner', 'editor')))
with check (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'owner', 'editor')));

drop policy if exists "ai_feedback_admin_read" on public.ai_feedback;
create policy "ai_feedback_admin_read"
on public.ai_feedback for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));
