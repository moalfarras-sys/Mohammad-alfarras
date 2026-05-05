insert into public.app_products (
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
  'moplayer2',
  'MoPlayer2',
  'Next Android TV Media Experience',
  'The newer MoPlayer generation with its own releases, page, and admin control.',
  'MoPlayer2 is the new Android and Android TV app line, managed separately while staying inside the same Moalfarras website and admin system.',
  'MoPlayer2 keeps the same Supabase, admin, and domain foundation but has its own product content, APK releases, visual assets, FAQs, support, and runtime settings.',
  'Mohammad.Alfarras@gmail.com',
  'https://wa.me/4917623419358',
  null,
  '/privacy',
  null,
  'com.mo.moplayer',
  24,
  35,
  true,
  'Download MoPlayer2 APK',
  '[
    {"title":"Separate product line","body":"Independent records for releases, screenshots, FAQs, and support.","icon":"box"},
    {"title":"Same admin system","body":"Managed from the existing admin without a new Vercel project.","icon":"shield"},
    {"title":"TV-first direction","body":"Prepared for Android TV and remote-first navigation.","icon":"tv"},
    {"title":"Growth-ready","body":"Runtime and release controls can evolve independently.","icon":"zap"}
  ]'::jsonb,
  '[
    {"title":"Switch product","body":"Choose MoPlayer2 in the admin product switcher."},
    {"title":"Publish assets","body":"Upload MoPlayer2 releases and screenshots separately."},
    {"title":"Open public page","body":"Users reach MoPlayer2 at /apps/moplayer2."}
  ]'::jsonb,
  '[
    {"title":"Download MoPlayer2","body":"Use the MoPlayer2 release card."},
    {"title":"Allow installation","body":"Enable install from trusted sources if Android asks."},
    {"title":"Open and configure","body":"Launch MoPlayer2 and connect permitted sources only."}
  ]'::jsonb,
  '["Android 7.0+ (API 24 and above)","Separate from the classic MoPlayer channel","Designed for Android TV and remote-first navigation"]'::jsonb,
  '["MoPlayer2 is a playback interface. It does not provide channels, playlists, or copyrighted media.","Users are responsible for the legality of the content sources they connect."]'::jsonb,
  'MoPlayer2 releases are tracked separately from classic MoPlayer.',
  '/images/moplayer-icon-512.png',
  '/images/moplayer-tv-hero.png',
  '/images/moplayer-tv-banner-final.png',
  'published'
)
on conflict (slug) do update set
  product_name = excluded.product_name,
  hero_badge = excluded.hero_badge,
  tagline = excluded.tagline,
  short_description = excluded.short_description,
  long_description = excluded.long_description,
  default_download_label = excluded.default_download_label,
  feature_highlights = excluded.feature_highlights,
  how_it_works = excluded.how_it_works,
  install_steps = excluded.install_steps,
  compatibility_notes = excluded.compatibility_notes,
  legal_notes = excluded.legal_notes,
  changelog_intro = excluded.changelog_intro,
  logo_path = excluded.logo_path,
  hero_image_path = excluded.hero_image_path,
  tv_banner_path = excluded.tv_banner_path,
  status = excluded.status,
  updated_at = timezone('utc', now());

insert into public.app_settings (key, value, description)
values (
  'moplayer2_public_config',
  '{
    "enabled": true,
    "maintenanceMode": false,
    "forceUpdate": false,
    "minimumVersionCode": 1,
    "latestVersionName": "v1 full",
    "message": "",
    "accentColor": "#00e5ff",
    "logoUrl": "/images/moplayer-icon-512.png",
    "backgroundUrl": "/images/moplayer-tv-banner-final.png",
    "widgets": {
      "weather": true,
      "football": true
    },
    "supportUrl": "https://moalfarras.space/en/support",
    "privacyUrl": "https://moalfarras.space/privacy"
  }'::jsonb,
  'Public MoPlayer2 runtime configuration consumed by Android and admin.'
)
on conflict (key) do update
set value = excluded.value,
    description = excluded.description,
    updated_at = timezone('utc', now());
