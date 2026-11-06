-- Provider credentials belong on the device, delivered only by ephemeral QR.
-- These legacy tables were empty at the November production audit. Preserve
-- their schema/foreign keys, but prevent older authenticated clients from
-- resuming permanent provider storage.
do $$
declare legacy_table text;
begin
  foreach legacy_table in array array['servers', 'iptv_servers', 'epg_sources'] loop
    if to_regclass('public.' || legacy_table) is not null then
      execute format('revoke insert, update on public.%I from public, anon, authenticated', legacy_table);
    end if;
  end loop;
end $$;

-- Revoking only the named roles does not remove inherited PUBLIC execution.
-- This event-trigger function is internal and must not be exposed as an RPC.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

notify pgrst, 'reload schema';
