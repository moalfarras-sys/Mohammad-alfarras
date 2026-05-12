alter table public.app_products
  add column if not exists downloader_code text;

update public.app_products
set product_name = 'MoPlayer Pro',
    hero_badge = 'Premium Android TV Media Player',
    tagline = 'MoPlayer Pro is the TV-first player with QR activation, independent releases, and admin-controlled downloads.',
    short_description = 'MoPlayer Pro is a separate Android TV and Fire TV player for authorized Xtream or M3U sources.',
    long_description = 'MoPlayer Pro stays under the same moalfarras.space Supabase and admin system, but has its own product page, APK releases, runtime settings, Downloader code, screenshots, and activation flow.',
    package_name = 'com.moalfarras.moplayerpro',
    default_download_label = 'Download MoPlayer Pro APK',
    hero_image_path = '/images/moplayer-pro-banner.jpeg',
    tv_banner_path = '/images/moplayer-pro-banner.jpeg',
    legal_notes = '[
      "MoPlayer Pro is a player only. It does not provide channels, movies, series, playlists, subscriptions, or copyrighted content.",
      "Users connect only Xtream or M3U sources they are authorized to use."
    ]'::jsonb,
    changelog_intro = 'MoPlayer Pro releases are tracked separately from classic MoPlayer.',
    updated_at = timezone('utc', now())
where slug = 'moplayer2';

update public.app_products
set legal_notes = '[
      "MoPlayer is a player only. It does not provide channels, movies, series, playlists, subscriptions, or copyrighted content.",
      "Users connect only media sources they are authorized to use."
    ]'::jsonb,
    updated_at = timezone('utc', now())
where slug = 'moplayer';

insert into public.app_settings (key, value, description)
values (
  'moplayer2_public_config',
  '{
    "enabled": true,
    "maintenanceMode": false,
    "forceUpdate": false,
    "minimumVersionCode": 4,
    "latestVersionName": "2.1.0",
    "appName": "MoPlayer Pro",
    "packageName": "com.moalfarras.moplayerpro",
    "message": "",
    "accentColor": "#f5c66b",
    "logoUrl": "/images/moplayer-icon-512.png",
    "backgroundUrl": "/images/moplayer-pro-banner.jpeg",
    "widgets": {
      "weather": true,
      "football": true
    },
    "supportUrl": "https://moalfarras.space/en/support",
    "privacyUrl": "https://moalfarras.space/privacy"
  }'::jsonb,
  'Public MoPlayer Pro runtime configuration consumed by Android, website, and admin.'
)
on conflict (key) do update
set value = coalesce(public.app_settings.value, '{}'::jsonb) || excluded.value,
    description = excluded.description,
    updated_at = timezone('utc', now());

delete from public.app_screenshots
where product_slug = 'moplayer2'
  and image_path in (
    '/images/moplayer2-hero-banner.png',
    '/images/moplayer2-tv-room.png',
    '/images/moplayer2-app-screens.png',
    '/images/moplayer2-home-screen.png',
    '/images/moplayer2-live-tv.png',
    '/images/moplayer2-login.png',
    '/images/moplayer2-movies.png',
    '/images/moplayer2-player.png',
    '/images/moplayer2-remote.png'
  );

insert into public.app_screenshots (id, product_slug, title, alt_text, image_path, device_frame, sort_order, is_featured)
values
  ('44444444-4444-4444-4444-444444444421', 'moplayer2', 'MoPlayer Pro TV Home', 'MoPlayer Pro TV home interface preview', '/images/moplayer-pro-tv-home.jpeg', 'tv', 1, true),
  ('44444444-4444-4444-4444-444444444422', 'moplayer2', 'MoPlayer Pro TV Feature', 'MoPlayer Pro Android TV feature preview', '/images/moplayer-pro-tv-feature.jpeg', 'tv', 2, false),
  ('44444444-4444-4444-4444-444444444423', 'moplayer2', 'MoPlayer Pro Phone Flow', 'MoPlayer Pro phone activation and setup preview', '/images/moplayer-pro-phone-showcase.jpeg', 'phone', 3, false),
  ('44444444-4444-4444-4444-444444444424', 'moplayer2', 'MoPlayer Pro Large Screen', 'MoPlayer Pro large screen interface preview', '/images/moplayer-pro-tv-poster.jpeg', 'tv', 4, false),
  ('44444444-4444-4444-4444-444444444425', 'moplayer2', 'MoPlayer Pro Product Board', 'MoPlayer Pro product board preview', '/images/moplayer-pro-brand-board.jpeg', 'landscape', 5, false)
on conflict (id) do update
set title = excluded.title,
    alt_text = excluded.alt_text,
    image_path = excluded.image_path,
    device_frame = excluded.device_frame,
    sort_order = excluded.sort_order,
    is_featured = excluded.is_featured;
