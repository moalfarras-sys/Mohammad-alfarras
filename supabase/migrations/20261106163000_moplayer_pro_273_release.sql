-- Publish only after the signed GitHub release assets have been verified publicly.
-- Apply atomically; old releases/assets remain available for rollback.
insert into public.app_releases
(product_slug,slug,version_name,version_code,release_notes,compatibility_notes,published_at,is_published)
values ('moplayer2','moplayer2-2.7.3','2.7.3',72,'MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence.',
'Android 6.0+ / Android TV; ARM 32-bit and 64-bit. Universal APK recommended.',now(),
not exists(select 1 from public.app_releases where product_slug='moplayer2' and is_published and version_code>72))
on conflict(slug) do update set release_notes=excluded.release_notes,compatibility_notes=excluded.compatibility_notes,
version_code=excluded.version_code,version_name=excluded.version_name,is_published=excluded.is_published,updated_at=now();

insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','universal','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-universal-release.apk','application/vnd.android.package-archive',56178052,'abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d',true
from public.app_releases r where r.slug='moplayer2-2.7.3'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='universal');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-universal-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=56178052,checksum_sha256='abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d',is_primary=true
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.3' and a.abi='universal';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<72 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.3' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 72, "latestVersionName": "2.7.3", "update": {"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=72;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=72;
insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','arm64-v8a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-arm64-v8a-release.apk','application/vnd.android.package-archive',34940404,'3d4d9f71a7a942a9f0928d78666e0504aca748752f66d1ca55c9537ee761c9df',false
from public.app_releases r where r.slug='moplayer2-2.7.3'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='arm64-v8a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-arm64-v8a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=34940404,checksum_sha256='3d4d9f71a7a942a9f0928d78666e0504aca748752f66d1ca55c9537ee761c9df',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.3' and a.abi='arm64-v8a';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<72 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.3' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 72, "latestVersionName": "2.7.3", "update": {"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=72;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=72;
insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','armeabi-v7a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-armeabi-v7a-release.apk','application/vnd.android.package-archive',31221974,'82cf13c738722580389d0cecad3fba095cf22863f20c251aa35e2199ae85d5fd',false
from public.app_releases r where r.slug='moplayer2-2.7.3'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='armeabi-v7a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-armeabi-v7a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=31221974,checksum_sha256='82cf13c738722580389d0cecad3fba095cf22863f20c251aa35e2199ae85d5fd',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.3' and a.abi='armeabi-v7a';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<72 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.3' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 72, "latestVersionName": "2.7.3", "update": {"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=72;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56178052, "checksumSha256": "abf62fc783f2fb6ce60159018cec3d6aabbc9a87945c7294849d39952725ab4d", "releaseNotes": "MoPlayer Pro 2.7.3: stricter APK update integrity checks and correct Home channel metadata. Android TV regression coverage for playback sessions, encrypted sources and large-library persistence."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=72;
