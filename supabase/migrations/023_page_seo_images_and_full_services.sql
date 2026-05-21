alter table if exists public.pages
  add column if not exists seo_image_media_id text references public.media_assets(id) on delete set null;

insert into public.service_offerings (id, is_active, sort_order, icon, color_token, cover_media_id)
values
  ('srv-web', true, 4, 'globe', 'accent', null),
  ('srv-app', true, 5, 'play', 'violet', null),
  ('srv-yt', true, 6, 'briefcase', 'success', null)
on conflict (id) do update set
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  icon = excluded.icon,
  color_token = excluded.color_token,
  cover_media_id = coalesce(service_offerings.cover_media_id, excluded.cover_media_id);

insert into public.service_offering_translations (service_id, locale, title, description, bullets_json)
values
  (
    'srv-web',
    'ar',
    'مواقع تشرح الفكرة',
    'مواقع أعمال وصفحات إطلاق ثنائية اللغة تنقل قيمة الخدمة بسرعة وتبني الثقة من أول شاشة.',
    '["بنية بصرية تقود الزائر","رسالة تسويقية واضحة","تصميم عربي/إنجليزي وRTL","صور ونصوص قابلة للتعديل من الأدمن"]'::jsonb
  ),
  (
    'srv-web',
    'en',
    'Websites that speak first',
    'Bilingual business websites and launch pages that explain value fast and build trust from the first screen.',
    '["Visual structure that guides","Sharp marketing message","Arabic/English RTL-ready delivery","CMS-managed copy and images"]'::jsonb
  ),
  (
    'srv-app',
    'ar',
    'صفحات منتجات وتطبيقات',
    'صفحات تطبيقات ومنتجات مثل MoPlayer مع تحميل APK، تفعيل، دعم، SEO، ورسائل واضحة للمستخدم.',
    '["صفحات تطبيق احترافية","تحميل وتحديثات واضحة","تفعيل ودعم متصل بالأدمن","محتوى قابل للتعديل"]'::jsonb
  ),
  (
    'srv-app',
    'en',
    'Product and app surfaces',
    'Product pages for apps like MoPlayer with APK download, activation, support, SEO, and clear user messaging.',
    '["Professional app pages","Download and update clarity","Admin-connected activation and support","Editable product content"]'::jsonb
  ),
  (
    'srv-yt',
    'ar',
    'محتوى تقني وحضور بصري',
    'تحويل الخبرة التقنية ويوتيوب إلى حضور رقمي مفهوم، صور قوية، ونسخة تسويقية قابلة للتطوير.',
    '["سرد واضح للقيمة","صور ومعارض للمحتوى","ربط يوتيوب بالموقع","هوية بصرية متماسكة"]'::jsonb
  ),
  (
    'srv-yt',
    'en',
    'Tech content and visual presence',
    'Turn technical experience and YouTube content into a clearer digital presence with stronger visuals and scalable copy.',
    '["Clear value storytelling","Content galleries and visuals","YouTube connected to the site","Consistent visual identity"]'::jsonb
  )
on conflict (service_id, locale) do update set
  title = coalesce(nullif(service_offering_translations.title, ''), excluded.title),
  description = coalesce(nullif(service_offering_translations.description, ''), excluded.description),
  bullets_json = case
    when jsonb_array_length(coalesce(service_offering_translations.bullets_json, '[]'::jsonb)) > 0
      then service_offering_translations.bullets_json
    else excluded.bullets_json
  end;

update public.service_offerings
set cover_media_id = case id
  when 'srv-web' then 'project-ecosystem-cover'
  when 'srv-app' then 'm34'
  when 'srv-yt' then 'm57'
  else cover_media_id
end
where id in ('srv-web', 'srv-app', 'srv-yt');
