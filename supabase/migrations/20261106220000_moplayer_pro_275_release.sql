-- Publish only after the signed GitHub release assets have been verified publicly.
-- Apply atomically; old releases/assets remain available for rollback.
insert into public.app_releases
(product_slug,slug,version_name,version_code,release_notes,compatibility_notes,published_at,is_published)
values ('moplayer2','moplayer2-2.7.5','2.7.5',75,'MoPlayer Pro 2.7.5: cleaner Home without recent/new live shelves, larger posters and gentle motion, smarter Arabic/English channel search, latest-episode resume, reliable series access, recurring library freshness checks and update notices outside playback.',
'Android 6.0+ / Android TV; ARM 32-bit and 64-bit. Universal APK recommended.',now(),
not exists(select 1 from public.app_releases where product_slug='moplayer2' and is_published and version_code>75))
on conflict(slug) do update set release_notes=excluded.release_notes,compatibility_notes=excluded.compatibility_notes,
version_code=excluded.version_code,version_name=excluded.version_name,is_published=excluded.is_published,updated_at=now();

insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','universal','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.5/app-universal-release.apk','application/vnd.android.package-archive',56203839,'21353385f397483c0b0afb0d1219ac4ddd7f00d20f16dfcc1d50e96e2af2ffff',true
from public.app_releases r where r.slug='moplayer2-2.7.5'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='universal');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.5/app-universal-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=56203839,checksum_sha256='21353385f397483c0b0afb0d1219ac4ddd7f00d20f16dfcc1d50e96e2af2ffff',is_primary=true
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.5' and a.abi='universal';

insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','arm64-v8a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.5/app-arm64-v8a-release.apk','application/vnd.android.package-archive',34966194,'ac35aee64d11b4857a390d2a7425633abe73fcfce0099710e98c25d8a700a93b',false
from public.app_releases r where r.slug='moplayer2-2.7.5'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='arm64-v8a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.5/app-arm64-v8a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=34966194,checksum_sha256='ac35aee64d11b4857a390d2a7425633abe73fcfce0099710e98c25d8a700a93b',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.5' and a.abi='arm64-v8a';

insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','armeabi-v7a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.5/app-armeabi-v7a-release.apk','application/vnd.android.package-archive',31247764,'9230d24585c00350a3f088149814e15bed590b11807d7fb70d9c98d0baa40e3c',false
from public.app_releases r where r.slug='moplayer2-2.7.5'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='armeabi-v7a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.5/app-armeabi-v7a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=31247764,checksum_sha256='9230d24585c00350a3f088149814e15bed590b11807d7fb70d9c98d0baa40e3c',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.5' and a.abi='armeabi-v7a';


update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<75 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.5' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 75, "latestVersionName": "2.7.5", "update": {"latestVersionCode": 75, "latestVersionName": "2.7.5", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56203839, "checksumSha256": "21353385f397483c0b0afb0d1219ac4ddd7f00d20f16dfcc1d50e96e2af2ffff", "releaseNotes": "MoPlayer Pro 2.7.5: cleaner Home without recent/new live shelves, larger posters and gentle motion, smarter Arabic/English channel search, latest-episode resume, reliable series access, recurring library freshness checks and update notices outside playback."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 75, "latestVersionName": "2.7.5"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 75, "latestVersionName": "2.7.5", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56203839, "checksumSha256": "21353385f397483c0b0afb0d1219ac4ddd7f00d20f16dfcc1d50e96e2af2ffff", "releaseNotes": "MoPlayer Pro 2.7.5: cleaner Home without recent/new live shelves, larger posters and gentle motion, smarter Arabic/English channel search, latest-episode resume, reliable series access, recurring library freshness checks and update notices outside playback."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=75;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 75, "latestVersionName": "2.7.5"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 75, "latestVersionName": "2.7.5", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56203839, "checksumSha256": "21353385f397483c0b0afb0d1219ac4ddd7f00d20f16dfcc1d50e96e2af2ffff", "releaseNotes": "MoPlayer Pro 2.7.5: cleaner Home without recent/new live shelves, larger posters and gentle motion, smarter Arabic/English channel search, latest-episode resume, reliable series access, recurring library freshness checks and update notices outside playback."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=75;