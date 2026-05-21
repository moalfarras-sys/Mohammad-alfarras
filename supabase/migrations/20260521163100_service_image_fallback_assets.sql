-- Ensure service image replacements always start from valid, public image assets.
insert into public.media_assets (id, path, alt_ar, alt_en, type, width, height)
values
  ('service-web-local', '/images/service_web.png', 'صورة خدمة مواقع الأعمال', 'Business website service image', 'image/png', 0, 0),
  ('service-tech-local', '/images/service_tech.png', 'صورة خدمة الواجهات والتقنية', 'Web apps and interfaces service image', 'image/png', 0, 0),
  ('service-logistics-local', '/images/service_logistics.png', 'صورة خدمة التنفيذ والتشغيل', 'Execution and operations service image', 'image/png', 0, 0)
on conflict (id) do update set
  path = excluded.path,
  alt_ar = excluded.alt_ar,
  alt_en = excluded.alt_en,
  type = excluded.type,
  width = excluded.width,
  height = excluded.height;

update public.service_offerings
set cover_media_id = 'service-web-local'
where id = 'srv-landing'
  and (cover_media_id is null or cover_media_id = '');

update public.service_offerings
set cover_media_id = 'service-tech-local'
where id = 'srv-uiux'
  and (cover_media_id is null or cover_media_id = '');

update public.service_offerings
set cover_media_id = 'service-logistics-local'
where id = 'srv-yt'
  and (cover_media_id is null or cover_media_id = '');
