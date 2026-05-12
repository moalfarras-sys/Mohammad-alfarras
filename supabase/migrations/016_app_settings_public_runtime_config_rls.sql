drop policy if exists "app_settings_public_read" on public.app_settings;

create policy "app_settings_public_read"
on public.app_settings for select
to anon, authenticated
using (key in ('moplayer_public_config', 'moplayer2_public_config'));
