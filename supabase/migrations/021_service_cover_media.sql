alter table if exists public.service_offerings
  add column if not exists cover_media_id text references public.media_assets(id) on delete set null;
