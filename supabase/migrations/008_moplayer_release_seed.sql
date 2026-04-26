insert into public.app_releases (
  product_slug,
  slug,
  version_name,
  version_code,
  release_notes,
  compatibility_notes,
  published_at,
  is_published
) values (
  'moplayer',
  'moplayer-v2.0.0',
  '2.0.0',
  2,
  'Production repair build with refreshed Android sideload artifacts, SDK 35 target, and verified emulator launch.',
  'Android 7.0+ (API 24), target SDK 35, Android TV and phone compatible. Primary build: arm64-v8a.',
  timezone('utc', now()),
  true
)
on conflict (slug) do update set
  version_name = excluded.version_name,
  version_code = excluded.version_code,
  release_notes = excluded.release_notes,
  compatibility_notes = excluded.compatibility_notes,
  published_at = excluded.published_at,
  is_published = true,
  updated_at = timezone('utc', now());

update public.app_releases
set is_published = false,
    updated_at = timezone('utc', now())
where product_slug = 'moplayer'
  and slug <> 'moplayer-v2.0.0';

do $$
declare
  release_uuid uuid;
begin
  select id
    into release_uuid
  from public.app_releases
  where slug = 'moplayer-v2.0.0';

  delete from public.app_release_assets
  where release_id = release_uuid;

  insert into public.app_release_assets (
    release_id,
    asset_type,
    label,
    abi,
    storage_bucket,
    storage_path,
    external_url,
    mime_type,
    file_size_bytes,
    checksum_sha256,
    is_primary
  ) values
    (
      release_uuid,
      'apk',
      'arm64-v8a sideload APK',
      'arm64-v8a',
      null,
      null,
      'https://ckefrnalgnbuaxsuufyx.supabase.co/storage/v1/object/public/app-releases/moplayer/2.0.0/app-sideload-arm64-v8a-release.apk',
      'application/vnd.android.package-archive',
      51925872,
      '62781a44a2a2424b8a1c8457a91e17af3c904d361157639b10058e350a5bc65e',
      true
    ),
    (
      release_uuid,
      'apk',
      'armeabi-v7a sideload APK',
      'armeabi-v7a',
      null,
      null,
      'https://ckefrnalgnbuaxsuufyx.supabase.co/storage/v1/object/public/app-releases/moplayer/2.0.0/app-sideload-armeabi-v7a-release.apk',
      'application/vnd.android.package-archive',
      47874576,
      'b01facd268a360c4c78578d067d58e7dd1c82f1277df0691b350b21016fc6d8b',
      false
    );
end $$;

notify pgrst, 'reload schema';
