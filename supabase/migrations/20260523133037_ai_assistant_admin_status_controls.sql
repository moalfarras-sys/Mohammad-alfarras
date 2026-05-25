alter table if exists public.ai_conversations
  add column if not exists visitor_email text,
  add column if not exists visitor_email_verified_at timestamptz,
  add column if not exists owner_summary_sent_at timestamptz;

alter table if exists public.ai_leads
  add column if not exists email_verified_at timestamptz,
  add column if not exists owner_summary_sent_at timestamptz,
  add column if not exists follow_up_sent_at timestamptz;

alter table if exists public.ai_assistant_settings
  add column if not exists provider text not null default 'openai',
  add column if not exists gemini_api_key text,
  add column if not exists gemini_model text not null default 'gemini-2.5-flash';

create index if not exists ai_conversations_verified_email_idx
  on public.ai_conversations(visitor_email, visitor_email_verified_at desc)
  where visitor_email is not null;

create index if not exists ai_leads_email_verified_idx
  on public.ai_leads(email, email_verified_at desc)
  where email is not null;
