delete from public.app_settings
where key like 'moplayer_device_source:%'
   or key like 'moplayer_device_auth:%';

comment on table public.app_settings is
  'General app settings plus short-lived, non-sensitive app runtime receipts. Provider source credentials must only exist during QR handoff and must be cleared after first device fetch.';
