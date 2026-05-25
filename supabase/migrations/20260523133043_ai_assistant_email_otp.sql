create table if not exists public.ai_email_otps (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_email_otps_conversation_created_idx
  on public.ai_email_otps(conversation_id, created_at desc);

alter table public.ai_email_otps enable row level security;

drop policy if exists "ai_email_otps_admin_read" on public.ai_email_otps;
create policy "ai_email_otps_admin_read"
on public.ai_email_otps for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));
