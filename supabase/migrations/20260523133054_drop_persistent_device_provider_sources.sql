drop table if exists public.device_provider_sources;

comment on table public.app_settings is
  'General app settings and short-lived app runtime queues. Provider source payloads are encrypted server-side and queued under hashed keys.';
