-- Counts are returned through server APIs; web/admin readers use service_role.
-- Do not let direct PostgREST view access bypass the event tables' RLS.
alter view public.app_download_counts set (security_invoker = true);
revoke all on public.app_download_counts from public, anon, authenticated;
grant select on public.app_download_counts to service_role;

notify pgrst, 'reload schema';
