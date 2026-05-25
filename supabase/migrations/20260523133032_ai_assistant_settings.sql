create table if not exists public.ai_assistant_settings (
  id text primary key default 'site',
  enabled boolean not null default true,
  model text not null default 'gpt-5.2',
  openai_api_key text,
  system_prompt_extra text not null default '',
  chips_ar jsonb not null default '["أريد موقع", "عندي سؤال عن MoPlayer", "كم يكلف مشروع؟", "أريد دعم"]'::jsonb,
  chips_en jsonb not null default '["I need a website", "Question about MoPlayer", "How much does a project cost?", "I need support"]'::jsonb,
  lead_threshold integer not null default 70,
  high_intent_threshold integer not null default 85,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.ai_assistant_settings enable row level security;

drop policy if exists "ai_assistant_settings_admin_read" on public.ai_assistant_settings;
create policy "ai_assistant_settings_admin_read"
on public.ai_assistant_settings for select
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid()));

drop policy if exists "ai_assistant_settings_admin_write" on public.ai_assistant_settings;
create policy "ai_assistant_settings_admin_write"
on public.ai_assistant_settings for all
to authenticated
using (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'owner')))
with check (exists (select 1 from public.app_admin_roles where user_id = auth.uid() and role in ('admin', 'owner')));

insert into public.ai_assistant_settings (id)
values ('site')
on conflict (id) do nothing;
