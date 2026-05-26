-- AI and automation safety hardening.
-- This migration is intentionally additive/idempotent and should be reviewed before
-- applying to production.

alter table public.ai_assistant_settings
  drop constraint if exists ai_assistant_settings_id_check;

insert into public.ai_assistant_settings (id, enabled, provider, model, gemini_model, system_prompt_extra, updated_at)
select
  'default',
  coalesce(site.enabled, true),
  coalesce(site.provider, 'auto'),
  coalesce(site.model, ''),
  coalesce(site.gemini_model, 'gemini-2.5-flash'),
  coalesce(site.system_prompt_extra, ''),
  timezone('utc', now())
from (select * from public.ai_assistant_settings where id = 'site') site
on conflict (id) do update set
  enabled = excluded.enabled,
  provider = excluded.provider,
  model = excluded.model,
  gemini_model = excluded.gemini_model,
  system_prompt_extra = excluded.system_prompt_extra,
  updated_at = timezone('utc', now());

insert into public.ai_assistant_settings (id, enabled, provider, model, gemini_model, system_prompt_extra, updated_at)
values ('default', true, 'auto', '', 'gemini-2.5-flash', '', timezone('utc', now()))
on conflict (id) do nothing;

drop policy if exists "app_support_requests_insert" on public.app_support_requests;
create policy "app_support_requests_insert"
on public.app_support_requests for insert
to anon, authenticated
with check (
  product_slug in ('moplayer', 'moplayer2')
  and length(trim(coalesce(message, ''))) between 4 and 2000
);

drop policy if exists "app_device_events_insert" on public.app_device_events;
create policy "app_device_events_insert"
on public.app_device_events for insert
to anon, authenticated
with check (
  event_type <> ''
  and coalesce(product_slug, 'moplayer') in ('moplayer', 'moplayer2')
);

drop policy if exists "app_diagnostic_reports_insert" on public.app_diagnostic_reports;
create policy "app_diagnostic_reports_insert"
on public.app_diagnostic_reports for insert
to anon, authenticated
with check (
  public_device_id <> ''
  and customer_message <> ''
  and coalesce(product_slug, 'moplayer') in ('moplayer', 'moplayer2')
);

revoke execute on function public.rls_auto_enable() from anon, authenticated;

alter function public.is_admin(uuid) set search_path = public;
alter function public.touch_updated_at() set search_path = public;
