alter table if exists public.contact_messages
  add column if not exists status text not null default 'new',
  add column if not exists replied_at timestamptz,
  add column if not exists archived_at timestamptz;

alter table if exists public.contact_messages
  drop constraint if exists contact_messages_status_check;

alter table if exists public.contact_messages
  add constraint contact_messages_status_check
  check (status in ('new', 'read', 'replied', 'resolved', 'archived'));
