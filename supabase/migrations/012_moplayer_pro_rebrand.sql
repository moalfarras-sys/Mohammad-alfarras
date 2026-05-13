update public.app_products
set product_name = 'MoPlayer Pro',
    hero_badge = 'Premium Android TV Media Player',
    tagline = 'The Pro MoPlayer generation with polished TV navigation, activation, widgets, and its own release channel.',
    short_description = 'MoPlayer Pro is the new Android and Android TV app line in the Moalfarras ecosystem, separated from the classic MoPlayer release channel.',
    long_description = 'MoPlayer Pro keeps the same domain, admin, and Supabase foundation while giving the new app its own public page, screenshots, releases, FAQs, support queue, runtime controls, and activation flow.',
    package_name = 'com.moalfarras.moplayerpro',
    default_download_label = 'Download MoPlayer Pro APK',
    feature_highlights = '[
      {"title":"Pro product line","body":"MoPlayer Pro has its own page, release channel, activation flow, and admin records.","icon":"box"},
      {"title":"Same trusted website","body":"Users still download, activate, and verify through moalfarras.space.","icon":"shield"},
      {"title":"TV-first control","body":"Built for Android TV navigation, remote focus, and long-session media browsing.","icon":"tv"},
      {"title":"Live data ready","body":"Runtime controls support weather, football widgets, activation, and future app settings.","icon":"zap"}
    ]'::jsonb,
    how_it_works = '[
      {"title":"Open MoPlayer Pro","body":"Use /apps/moplayer2 on moalfarras.space; the public route stays stable."},
      {"title":"Download or activate","body":"Install the Pro APK, then use the QR code to pair the TV with the website."},
      {"title":"Connect your source","body":"Send an authorized Xtream or M3U profile through the secure activation flow."}
    ]'::jsonb,
    install_steps = '[
      {"title":"Download MoPlayer Pro","body":"Use the MoPlayer Pro release card on this page."},
      {"title":"Allow installation","body":"Enable install from trusted sources if Android asks."},
      {"title":"Open and configure","body":"Launch MoPlayer Pro and connect only sources you are allowed to use."}
    ]'::jsonb,
    compatibility_notes = '["Android 7.0+ (API 24 and above)","Separate package: com.moalfarras.moplayerpro","Designed for Android TV and remote-first navigation"]'::jsonb,
    legal_notes = '["MoPlayer Pro is a playback interface. It does not provide channels, playlists, subscriptions, or copyrighted media.","Users are responsible for the legality of the content sources they connect."]'::jsonb,
    changelog_intro = 'MoPlayer Pro releases are tracked separately from classic MoPlayer.',
    hero_image_path = '/images/moplayer-pro-hero.webp',
    tv_banner_path = '/images/moplayer-pro-hero.webp',
    updated_at = timezone('utc', now())
where slug = 'moplayer2';

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
    "backgroundUrl": "/images/moplayer-pro-hero.webp",
    "widgets": {
      "weather": true,
      "football": true
    },
    "supportUrl": "https://moalfarras.space/en/support",
    "privacyUrl": "https://moalfarras.space/privacy"
  }'::jsonb,
  'Public MoPlayer Pro runtime configuration consumed by Android and admin.'
)
on conflict (key) do update
set value = public.app_settings.value || excluded.value,
    description = excluded.description,
    updated_at = timezone('utc', now());
