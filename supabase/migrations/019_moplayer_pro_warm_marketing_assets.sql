update public.app_products
set hero_image_path = '/images/moplayer-pro-hero.webp',
    tv_banner_path = '/images/moplayer-pro-hero.webp',
    updated_at = timezone('utc', now())
where slug = 'moplayer2';

update public.app_settings
set value = coalesce(value, '{}'::jsonb) || jsonb_build_object(
      'backgroundUrl', '/images/moplayer-pro-hero.webp',
      'accentColor', '#f0a23a'
    ),
    updated_at = timezone('utc', now())
where key = 'moplayer2_public_config';

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
    '/images/moplayer2-remote.png',
    '/images/moplayer-pro-banner.jpeg',
    '/images/moplayer-pro-brand-board.jpeg',
    '/images/moplayer-pro-phone-showcase.jpeg',
    '/images/moplayer-pro-tv-feature.jpeg',
    '/images/moplayer-pro-tv-home.jpeg',
    '/images/moplayer-pro-tv-poster.jpeg'
  );

insert into public.app_screenshots (id, product_slug, title, alt_text, image_path, device_frame, sort_order, is_featured)
values
  ('44444444-4444-4444-4444-444444444421', 'moplayer2', 'MoPlayer Pro Home', 'MoPlayer Pro warm gold Android TV home screen', '/images/moplayer-pro-home.webp', 'tv', 1, true),
  ('44444444-4444-4444-4444-444444444422', 'moplayer2', 'MoPlayer Pro Activation', 'MoPlayer Pro QR activation and website pairing flow', '/images/moplayer-pro-activation.webp', 'tv', 2, false),
  ('44444444-4444-4444-4444-444444444423', 'moplayer2', 'MoPlayer Pro Player', 'MoPlayer Pro warm glass media player controls', '/images/moplayer-pro-player.webp', 'tv', 3, false),
  ('44444444-4444-4444-4444-444444444424', 'moplayer2', 'MoPlayer Pro TV + Phone', 'MoPlayer Pro warm product preview on TV and phone', '/images/moplayer-pro-hero.webp', 'landscape', 4, false)
on conflict (id) do update
set title = excluded.title,
    alt_text = excluded.alt_text,
    image_path = excluded.image_path,
    device_frame = excluded.device_frame,
    sort_order = excluded.sort_order,
    is_featured = excluded.is_featured;
