insert into public.app_settings (key, value, description, updated_at)
values
  (
    'moplayer_public_config',
    jsonb_build_object('downloaderCode', '2418397'),
    'Public MoPlayer runtime configuration consumed by Android and admin.',
    now()
  ),
  (
    'moplayer2_public_config',
    jsonb_build_object('downloaderCode', '4608937'),
    'Public MoPlayer Pro runtime configuration consumed by Android and admin.',
    now()
  )
on conflict (key) do update set
  value = coalesce(app_settings.value, '{}'::jsonb) || jsonb_build_object(
    'downloaderCode',
    case when excluded.key = 'moplayer2_public_config' then '4608937' else '2418397' end
  ),
  updated_at = now();
