-- Publish only after the signed GitHub release assets have been verified publicly.
-- Apply atomically; old releases/assets remain available for rollback.
insert into public.app_releases
(product_slug,slug,version_name,version_code,release_notes,compatibility_notes,published_at,is_published)
values ('moplayer2','moplayer2-2.7.4','2.7.4',74,'MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback.',
'Android 6.0+ / Android TV; ARM 32-bit and 64-bit. Universal APK recommended.',now(),
not exists(select 1 from public.app_releases where product_slug='moplayer2' and is_published and version_code>74))
on conflict(slug) do update set release_notes=excluded.release_notes,compatibility_notes=excluded.compatibility_notes,
version_code=excluded.version_code,version_name=excluded.version_name,is_published=excluded.is_published,updated_at=now();

insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','universal','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.4/app-universal-release.apk','application/vnd.android.package-archive',56199797,'05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84',true
from public.app_releases r where r.slug='moplayer2-2.7.4'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='universal');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.4/app-universal-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=56199797,checksum_sha256='05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84',is_primary=true
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.4' and a.abi='universal';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<74 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.4' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 74, "latestVersionName": "2.7.4", "update": {"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=74;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=74;
insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','arm64-v8a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.4/app-arm64-v8a-release.apk','application/vnd.android.package-archive',34962165,'c5d5e2e6bbeec3df978564ceabc8ec2ba8dbf8c044be9333b2b8c83662e3e987',false
from public.app_releases r where r.slug='moplayer2-2.7.4'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='arm64-v8a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.4/app-arm64-v8a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=34962165,checksum_sha256='c5d5e2e6bbeec3df978564ceabc8ec2ba8dbf8c044be9333b2b8c83662e3e987',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.4' and a.abi='arm64-v8a';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<74 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.4' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 74, "latestVersionName": "2.7.4", "update": {"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=74;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=74;
insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','armeabi-v7a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.4/app-armeabi-v7a-release.apk','application/vnd.android.package-archive',31243733,'2be4c92a10d3590cc5ac65c62846dfed5322133c605d5fb1264643d8f1a010ba',false
from public.app_releases r where r.slug='moplayer2-2.7.4'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='armeabi-v7a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.4/app-armeabi-v7a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=31243733,checksum_sha256='2be4c92a10d3590cc5ac65c62846dfed5322133c605d5fb1264643d8f1a010ba',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.4' and a.abi='armeabi-v7a';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<74 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.4' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 74, "latestVersionName": "2.7.4", "update": {"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=74;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 74, "latestVersionName": "2.7.4", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56199797, "checksumSha256": "05d8ee4d8fdec8ffbc3326efa90a78798e5edd031116b112dab3f54cbb440d84", "releaseNotes": "MoPlayer Pro 2.7.4: cleaner cinematic Home without duplicate shelves, labeled remote-friendly player tools, corrected narrow Arabic controls and background native audio preparation before playback."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=74;
