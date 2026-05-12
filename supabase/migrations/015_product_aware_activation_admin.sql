alter table public.activation_requests
  add column if not exists product_slug text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activation_requests_product_slug_check'
      and conrelid = 'public.activation_requests'::regclass
  ) then
    alter table public.activation_requests
      add constraint activation_requests_product_slug_check
      check (product_slug is null or product_slug in ('moplayer', 'moplayer2'))
      not valid;
  end if;
end $$;

create index if not exists activation_requests_product_status_created_idx
  on public.activation_requests (product_slug, status, created_at desc);
