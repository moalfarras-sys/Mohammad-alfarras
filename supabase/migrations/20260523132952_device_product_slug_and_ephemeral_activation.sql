alter table if exists public.devices
  add column if not exists product_slug text not null default 'moplayer';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'devices_product_slug_check'
      and conrelid = 'public.devices'::regclass
  ) then
    alter table public.devices
      add constraint devices_product_slug_check
      check (product_slug in ('moplayer', 'moplayer2'))
      not valid;
  end if;
end $$;

create index if not exists devices_product_public_idx
  on public.devices(product_slug, public_device_id);

alter table if exists public.activation_requests
  add column if not exists public_device_name text,
  add column if not exists source_pull_token_hash text,
  add column if not exists source_last_pulled_at timestamptz,
  add column if not exists source_last_ack_at timestamptz;

create index if not exists activation_requests_product_code_idx
  on public.activation_requests(product_slug, device_code);
