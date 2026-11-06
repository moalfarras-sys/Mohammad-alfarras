-- Restore the verified release metadata after resuming the original production DB.
-- Previous records remain available in admin/history, unpublished. Only the
-- already published, fully hashed GitHub assets are made current here.

insert into public.app_releases
  (product_slug, slug, version_name, version_code, release_notes, compatibility_notes, published_at, is_published)
values ('moplayer', 'moplayer-2.5.1', '2.5.1', 26, 'MoPlayer Classic 2.5.1 builds on 2.5.0 (the same interface size on every TV with an Interface size option, real fonts, a working Arabic/English switch, a smoother Live TV browser with clear error messages, 2:3 poster grids, reliable website activation and EPG for M3U playlists). It adds a working parental lock for adult groups in Live TV, Movies and Series, shows the real channel count of each category, hides the guide card for channels without guide data, fixes the preview channel number, shows a connection message instead of invented weather when offline, and removes a duplicate settings store that could crash the app.', 'Recommended universal TV APK for Android 7.0+ with arm64-v8a and armeabi-v7a native code included.', '2026-10-04T16:32:21.000Z', true)
on conflict (slug) do update set
  version_name = excluded.version_name, version_code = excluded.version_code,
  release_notes = excluded.release_notes, compatibility_notes = excluded.compatibility_notes,
  published_at = excluded.published_at, is_published = true, updated_at = now();

update public.app_releases set is_published = false, updated_at = now()
where product_slug = 'moplayer' and version_code < 26 and is_published;

insert into public.app_release_assets
  (release_id, asset_type, label, abi, external_url, mime_type, file_size_bytes, checksum_sha256, is_primary)
select id, 'apk', 'Recommended TV APK', 'universal', 'https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-android-2.5.1/app-sideload-universal-release.apk',
  'application/vnd.android.package-archive', 53237761, '210aba349a743437c6610bb6712ba78b719bd0bfc43389c2cbf966c909f3ea1c', true
from public.app_releases r where slug = 'moplayer-2.5.1'
and not exists (select 1 from public.app_release_assets a where a.release_id = r.id and a.abi = 'universal');

update public.app_release_assets a set
  external_url = 'https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-android-2.5.1/app-sideload-universal-release.apk', storage_bucket = null, storage_path = null,
  file_size_bytes = 53237761, checksum_sha256 = '210aba349a743437c6610bb6712ba78b719bd0bfc43389c2cbf966c909f3ea1c', is_primary = true
from public.app_releases r
where a.release_id = r.id and r.slug = 'moplayer-2.5.1' and a.abi = 'universal';

update public.app_products set android_min_sdk = 24, android_target_sdk = 35, updated_at = now()
where slug = 'moplayer';

insert into public.app_settings (key, value, description, updated_at)
values ('moplayer_public_config', '{"latestVersionCode": 26, "latestVersionName": "2.5.1", "update": {"latestVersionCode": 26, "latestVersionName": "2.5.1", "downloadUrl": "/api/app/download/latest?product=moplayer", "apkSizeBytes": 53237761, "checksumSha256": "210aba349a743437c6610bb6712ba78b719bd0bfc43389c2cbf966c909f3ea1c", "releaseNotes": "MoPlayer Classic 2.5.1: working adult-content lock, correct channel counts, a cleaner guide card, no invented offline weather and a stability fix, on top of the 2.5.0 TV redesign."}}'::jsonb, 'Public app runtime configuration.', now())
on conflict (key) do update set value = coalesce(app_settings.value, '{}'::jsonb) || excluded.value, updated_at = now()
where coalesce((app_settings.value->>'latestVersionCode')::integer, 0) <= 26;

update public.site_settings set value_json = coalesce(value_json, '{}'::jsonb) || '{"latestVersionCode": 26, "latestVersionName": "2.5.1", "update": {"latestVersionCode": 26, "latestVersionName": "2.5.1", "downloadUrl": "/api/app/download/latest?product=moplayer", "apkSizeBytes": 53237761, "checksumSha256": "210aba349a743437c6610bb6712ba78b719bd0bfc43389c2cbf966c909f3ea1c", "releaseNotes": "MoPlayer Classic 2.5.1: working adult-content lock, correct channel counts, a cleaner guide card, no invented offline weather and a stability fix, on top of the 2.5.0 TV redesign."}}'::jsonb
where key = 'moplayer_public_config' and coalesce((value_json->>'latestVersionCode')::integer, 0) <= 26;

insert into public.app_releases
  (product_slug, slug, version_name, version_code, release_notes, compatibility_notes, published_at, is_published)
values ('moplayer2', 'moplayer2-2.7.2', '2.7.2', 71, 'MoPlayer Pro 2.7.2 makes the TV interface the same size on every TV: TVs and boxes that report a different screen density or use a larger system font no longer get an oversized interface with cut-off names. Group lists are wider and show full names, long channel names scroll when focused, and Settings > Look & Home has a new Interface size option (Compact, Standard, Large). Includes everything from 2.7.1.', 'Recommended universal MoPlayer Pro APK for Android 6.0+ and Android TV devices with ARM 32-bit or 64-bit processors.', '2026-09-30T21:04:05.000Z', true)
on conflict (slug) do update set
  version_name = excluded.version_name, version_code = excluded.version_code,
  release_notes = excluded.release_notes, compatibility_notes = excluded.compatibility_notes,
  published_at = excluded.published_at, is_published = true, updated_at = now();

update public.app_releases set is_published = false, updated_at = now()
where product_slug = 'moplayer2' and version_code < 71 and is_published;

insert into public.app_release_assets
  (release_id, asset_type, label, abi, external_url, mime_type, file_size_bytes, checksum_sha256, is_primary)
select id, 'apk', 'MoPlayer Pro Universal Android TV APK', 'universal', 'https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.2/app-universal-release.apk',
  'application/vnd.android.package-archive', 56178347, '8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a', true
from public.app_releases r where slug = 'moplayer2-2.7.2'
and not exists (select 1 from public.app_release_assets a where a.release_id = r.id and a.abi = 'universal');

update public.app_release_assets a set
  external_url = 'https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.2/app-universal-release.apk', storage_bucket = null, storage_path = null,
  file_size_bytes = 56178347, checksum_sha256 = '8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a', is_primary = true
from public.app_releases r
where a.release_id = r.id and r.slug = 'moplayer2-2.7.2' and a.abi = 'universal';

update public.app_products set android_min_sdk = 23, android_target_sdk = 36, updated_at = now()
where slug = 'moplayer2';

insert into public.app_settings (key, value, description, updated_at)
values ('moplayer2_public_config', '{"latestVersionCode": 71, "latestVersionName": "2.7.2", "update": {"latestVersionCode": 71, "latestVersionName": "2.7.2", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178347, "checksumSha256": "8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a", "releaseNotes": "MoPlayer Pro 2.7.2 draws the interface at the same size on every TV, shows full group and channel names, and adds an Interface size option (Compact, Standard, Large) in Settings."}}'::jsonb, 'Public app runtime configuration.', now())
on conflict (key) do update set value = coalesce(app_settings.value, '{}'::jsonb) || excluded.value, updated_at = now()
where coalesce((app_settings.value->>'latestVersionCode')::integer, 0) <= 71;

update public.site_settings set value_json = coalesce(value_json, '{}'::jsonb) || '{"latestVersionCode": 71, "latestVersionName": "2.7.2", "update": {"latestVersionCode": 71, "latestVersionName": "2.7.2", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178347, "checksumSha256": "8b5595ec9cc399a500f52896c4d7f7a09ba89951167a1e810c3d10c762ab677a", "releaseNotes": "MoPlayer Pro 2.7.2 draws the interface at the same size on every TV, shows full group and channel names, and adds an Interface size option (Compact, Standard, Large) in Settings."}}'::jsonb
where key = 'moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer, 0) <= 71;

notify pgrst, 'reload schema';
