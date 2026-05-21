-- Keep activated records forever unless an admin deletes them, and clean only stale unused activation requests.

create or replace function public.cleanup_stale_activation_requests(retention interval default interval '24 hours')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.activation_requests
  where status in ('waiting', 'expired', 'failed')
    and created_at < timezone('utc', now()) - retention;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

comment on function public.cleanup_stale_activation_requests(interval) is
  'Deletes only stale unused activation requests older than the retention window. Activated records are preserved until manually deleted by an admin.';

revoke execute on function public.cleanup_stale_activation_requests(interval) from public;
revoke execute on function public.cleanup_stale_activation_requests(interval) from anon;
revoke execute on function public.cleanup_stale_activation_requests(interval) from authenticated;
