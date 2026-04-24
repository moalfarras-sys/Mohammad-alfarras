-- Contact-form hardening metadata.
-- All columns are nullable to keep older deployments and existing inserts compatible.

alter table if exists public.contact_messages
  add column if not exists whatsapp text,
  add column if not exists project_type text,
  add column if not exists timeline text,
  add column if not exists consent_accepted boolean default false,
  add column if not exists source text default 'website';

comment on column public.contact_messages.whatsapp is
  'Optional WhatsApp number submitted intentionally through the contact form.';
comment on column public.contact_messages.consent_accepted is
  'Whether the sender accepted the contact/privacy note at submission time.';
comment on column public.contact_messages.source is
  'Submission source such as website, support, or MoPlayer.';
