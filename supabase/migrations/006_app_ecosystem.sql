create table if not exists public.app_admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'editor')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.app_admin_roles enable row level security;

drop policy if exists "app_admin_roles_select_own" on public.app_admin_roles;
create policy "app_admin_roles_select_own"
on public.app_admin_roles
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.app_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_name text not null,
  hero_badge text not null default '',
  tagline text not null default '',
  short_description text not null default '',
  long_description text not null default '',
  support_email text not null default '',
  support_whatsapp text not null default '',
  support_url text,
  privacy_path text not null default '/app/privacy',
  play_store_url text,
  package_name text not null default '',
  android_min_sdk integer not null default 24,
  android_target_sdk integer not null default 35,
  android_tv_ready boolean not null default true,
  default_download_label text not null default 'Download APK',
  feature_highlights jsonb not null default '[]'::jsonb,
  how_it_works jsonb not null default '[]'::jsonb,
  install_steps jsonb not null default '[]'::jsonb,
  compatibility_notes jsonb not null default '[]'::jsonb,
  legal_notes jsonb not null default '[]'::jsonb,
  changelog_intro text not null default '',
  logo_path text,
  hero_image_path text,
  tv_banner_path text,
  status text not null default 'published' check (status in ('draft', 'published')),
  last_updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_screenshots (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.app_products(slug) on delete cascade,
  title text not null,
  alt_text text not null,
  image_path text not null,
  device_frame text not null default 'phone' check (device_frame in ('phone', 'tv', 'landscape')),
  sort_order integer not null default 1,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_faqs (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.app_products(slug) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_releases (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.app_products(slug) on delete cascade,
  slug text not null unique,
  version_name text not null,
  version_code integer not null,
  release_notes text not null default '',
  compatibility_notes text not null default '',
  published_at timestamptz not null default timezone('utc', now()),
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_release_assets (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.app_releases(id) on delete cascade,
  asset_type text not null default 'apk' check (asset_type in ('apk')),
  label text not null,
  abi text,
  storage_bucket text,
  storage_path text,
  external_url text,
  mime_type text not null default 'application/vnd.android.package-archive',
  file_size_bytes bigint,
  checksum_sha256 text,
  is_primary boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.app_support_requests (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null references public.app_products(slug) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'resolved')),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.app_products enable row level security;
alter table public.app_screenshots enable row level security;
alter table public.app_faqs enable row level security;
alter table public.app_releases enable row level security;
alter table public.app_release_assets enable row level security;
alter table public.app_support_requests enable row level security;

drop policy if exists "app_products_public_read" on public.app_products;
create policy "app_products_public_read"
on public.app_products
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "app_screenshots_public_read" on public.app_screenshots;
create policy "app_screenshots_public_read"
on public.app_screenshots
for select
to anon, authenticated
using (true);

drop policy if exists "app_faqs_public_read" on public.app_faqs;
create policy "app_faqs_public_read"
on public.app_faqs
for select
to anon, authenticated
using (true);

drop policy if exists "app_releases_public_read" on public.app_releases;
create policy "app_releases_public_read"
on public.app_releases
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "app_release_assets_public_read" on public.app_release_assets;
create policy "app_release_assets_public_read"
on public.app_release_assets
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.app_releases releases
    where releases.id = release_id
      and releases.is_published = true
  )
);

drop policy if exists "app_support_requests_insert" on public.app_support_requests;
create policy "app_support_requests_insert"
on public.app_support_requests
for insert
to anon, authenticated
with check (true);

insert into public.app_products (
  id,
  slug,
  product_name,
  hero_badge,
  tagline,
  short_description,
  long_description,
  support_email,
  support_whatsapp,
  support_url,
  privacy_path,
  play_store_url,
  package_name,
  android_min_sdk,
  android_target_sdk,
  android_tv_ready,
  default_download_label,
  feature_highlights,
  how_it_works,
  install_steps,
  compatibility_notes,
  legal_notes,
  changelog_intro,
  logo_path,
  hero_image_path,
  tv_banner_path,
  status
) values (
  '11111111-1111-1111-1111-111111111111',
  'moplayer',
  'MoPlayer',
  'Android TV + Android Media Experience',
  'A focused streaming shell with fast navigation, TV-first ergonomics, and a cleaner playback flow.',
  'MoPlayer is your branded Android and Android TV player experience, designed for speed, clarity, and stable long-session playback.',
  'Built as a serious product layer over IPTV-style content sources, MoPlayer focuses on cleaner playback, smarter navigation, credential handling, and a polished visual rhythm that feels native on both remote and touch surfaces.',
  'Mohammad.Alfarras@gmail.com',
  'https://wa.me/4917623419358',
  null,
  '/app/privacy',
  null,
  'com.mo.moplayer',
  24,
  35,
  true,
  'Download APK',
  '[
    {"title":"TV-first playback","body":"Designed to feel natural with a remote, not just stretched mobile UI.","icon":"tv"},
    {"title":"Fast sign-in flow","body":"Quick entry into playlists and providers with a cleaner setup rhythm.","icon":"zap"},
    {"title":"Credential handling","body":"Sensitive credentials stay encrypted on device instead of being exposed in the UI.","icon":"shield"},
    {"title":"Release-ready shell","body":"Structured for repeatable Android builds, release packaging, and future scaling.","icon":"sparkles"}
  ]'::jsonb,
  '[
    {"title":"Connect your source","body":"Use supported IPTV-style inputs and provider credentials already handled by the Android app."},
    {"title":"Browse faster","body":"Navigate channels and playlists through a cleaner interface built for long sessions."},
    {"title":"Play with less friction","body":"Jump straight into content with reduced UI noise and a steadier playback flow."}
  ]'::jsonb,
  '[
    {"title":"Download the APK","body":"Use the latest release below and choose the recommended build for your device."},
    {"title":"Allow installation","body":"Enable install from trusted sources if Android asks for permission."},
    {"title":"Open and configure","body":"Launch MoPlayer, add your provider details, and start browsing immediately."}
  ]'::jsonb,
  '["Android 7.0+ (API 24 and above)","Optimized for Android TV and remote-based navigation","Primary release channel targets arm64-v8a devices"]'::jsonb,
  '["MoPlayer is a playback interface. It does not provide channels, playlists, or copyrighted media.","Users are responsible for the legality of the content sources they connect."]'::jsonb,
  'Each release keeps the product focused on stability, faster navigation, and cleaner playback.',
  '/images/moplayer-icon-512.png',
  '/images/moplayer-app-cover.jpeg',
  '/images/moplayer-tv-banner.png',
  'published'
)
on conflict (slug) do nothing;

insert into public.app_screenshots (id, product_slug, title, alt_text, image_path, device_frame, sort_order, is_featured) values
  ('22222222-2222-2222-2222-222222222221', 'moplayer', 'Now playing', 'MoPlayer now playing screen', '/images/moplayer_ui_now_playing.png', 'phone', 1, true),
  ('22222222-2222-2222-2222-222222222222', 'moplayer', 'Playlist view', 'MoPlayer playlist browsing screen', '/images/moplayer_ui_playlist.png', 'phone', 2, false),
  ('22222222-2222-2222-2222-222222222223', 'moplayer', 'Android TV presence', 'MoPlayer Android TV banner', '/images/moplayer-tv-banner.png', 'tv', 3, false)
on conflict (id) do nothing;

insert into public.app_faqs (id, product_slug, question, answer, sort_order) values
  ('33333333-3333-3333-3333-333333333331', 'moplayer', 'Does MoPlayer include channels or playlists?', 'No. MoPlayer is a player shell only. You connect your own supported source.', 1),
  ('33333333-3333-3333-3333-333333333332', 'moplayer', 'Is the app built for Android TV?', 'Yes. The interface and navigation flow are optimized for Android TV and remote control usage.', 2),
  ('33333333-3333-3333-3333-333333333333', 'moplayer', 'Is there a Google Play release already?', 'No public Google Play release is shown until a real listing exists.', 3)
on conflict (id) do nothing;
