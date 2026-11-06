-- Publish only after the signed GitHub release assets have been verified publicly.
-- Apply atomically; old releases/assets remain available for rollback.
insert into public.app_releases
(product_slug,slug,version_name,version_code,release_notes,compatibility_notes,published_at,is_published)
values ('moplayer2','moplayer2-2.7.3','2.7.3',72,'MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests.',
'Android 6.0+ / Android TV; ARM 32-bit and 64-bit. Universal APK recommended.',now(),
not exists(select 1 from public.app_releases where product_slug='moplayer2' and is_published and version_code>72))
on conflict(slug) do update set release_notes=excluded.release_notes,compatibility_notes=excluded.compatibility_notes,
version_code=excluded.version_code,version_name=excluded.version_name,is_published=excluded.is_published,updated_at=now();

insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','universal','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-universal-release.apk','application/vnd.android.package-archive',56183447,'603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c',true
from public.app_releases r where r.slug='moplayer2-2.7.3'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='universal');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-universal-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=56183447,checksum_sha256='603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c',is_primary=true
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.3' and a.abi='universal';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<72 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.3' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 72, "latestVersionName": "2.7.3", "update": {"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=72;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=72;
insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','arm64-v8a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-arm64-v8a-release.apk','application/vnd.android.package-archive',34945803,'3e6fa4f9979f18398e03f5eff261dfb21237aa5111bdb4174bc8474c0726be28',false
from public.app_releases r where r.slug='moplayer2-2.7.3'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='arm64-v8a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-arm64-v8a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=34945803,checksum_sha256='3e6fa4f9979f18398e03f5eff261dfb21237aa5111bdb4174bc8474c0726be28',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.3' and a.abi='arm64-v8a';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<72 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.3' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 72, "latestVersionName": "2.7.3", "update": {"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=72;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=72;
insert into public.app_release_assets
(release_id,asset_type,label,abi,external_url,mime_type,file_size_bytes,checksum_sha256,is_primary)
select id,'apk','MoPlayer Pro Android TV APK','armeabi-v7a','https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-armeabi-v7a-release.apk','application/vnd.android.package-archive',31227377,'a8110af2252fa9a8f75412ad212c144c24680df18af10f55279467b1271b8fd2',false
from public.app_releases r where r.slug='moplayer2-2.7.3'
and not exists(select 1 from public.app_release_assets a where a.release_id=r.id and a.abi='armeabi-v7a');
update public.app_release_assets a set external_url='https://github.com/moalfarras-sys/Mohammad-alfarras/releases/download/moplayer-pro-v2.7.3/app-armeabi-v7a-release.apk',storage_bucket=null,storage_path=null,
file_size_bytes=31227377,checksum_sha256='a8110af2252fa9a8f75412ad212c144c24680df18af10f55279467b1271b8fd2',is_primary=false
from public.app_releases r where r.id=a.release_id and r.slug='moplayer2-2.7.3' and a.abi='armeabi-v7a';

update public.app_releases set is_published=false,updated_at=now()
where product_slug='moplayer2' and version_code<72 and is_published
and exists(select 1 from public.app_releases where slug='moplayer2-2.7.3' and is_published);

insert into public.app_settings(key,value,description,updated_at)
values('moplayer2_public_config','{"latestVersionCode": 72, "latestVersionName": "2.7.3", "update": {"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}}'::jsonb,'Public app runtime configuration.',now())
on conflict(key) do update set
value=coalesce(app_settings.value,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(app_settings.value->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}'::jsonb),updated_at=now()
where coalesce((app_settings.value->>'latestVersionCode')::integer,0)<=72;

update public.site_settings set
value_json=coalesce(value_json,'{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3"}'::jsonb||jsonb_build_object('update',coalesce(value_json->'update','{}'::jsonb)||'{"latestVersionCode": 72, "latestVersionName": "2.7.3", "downloadUrl": "/api/app/download/latest?product=moplayer2", "apkSizeBytes": 56183447, "checksumSha256": "603c3d9bd3db24822129eea3ee5aed209ad3886bfcfca08362dab7c09e445e8c", "releaseNotes": "MoPlayer Pro 2.7.3: clearer Arabic and English TV typography, labeled remote navigation, smoother focus with reduced-motion support, correct channel metadata and stricter APK update integrity checks. Includes Android-backed playback, library and navigation regression tests."}'::jsonb)
where key='moplayer2_public_config' and coalesce((value_json->>'latestVersionCode')::integer,0)<=72;
