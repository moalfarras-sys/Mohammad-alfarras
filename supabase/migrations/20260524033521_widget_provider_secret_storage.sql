insert into public.app_private_settings (key, value, description)
values (
  'moplayer_widget_provider_settings',
  '{}'::jsonb,
  'Server-only widget provider credentials and tuning values for weather and football integrations.'
)
on conflict (key) do nothing;
