-- Restore the remaining original website service cards so every service can be managed from admin.
insert into public.service_offerings (id, is_active, sort_order, icon, color_token, cover_media_id)
values
  ('srv-landing', true, 4, 'rocket', 'accent', null),
  ('srv-uiux', true, 5, 'layout', 'accent', null),
  ('srv-product', true, 6, 'monitor', 'accent', 'm34')
on conflict (id) do update set
  is_active = true,
  sort_order = excluded.sort_order,
  icon = excluded.icon,
  color_token = excluded.color_token,
  cover_media_id = coalesce(public.service_offerings.cover_media_id, excluded.cover_media_id);

insert into public.service_offering_translations (service_id, locale, title, description, bullets_json)
values
  (
    'srv-landing',
    'ar',
    'صفحات هبوط للحملات والمنتجات',
    'صفحة مركّزة لإطلاق منتج أو خدمة أو عرض، بترتيب بصري قوي ونص مقنع ومسار واضح يحوّل الزائر إلى خطوة فعلية.',
    '["هدف واحد واضح","نص يحفّز القرار","سرعة وأداء عالٍ","مسار تحويل مباشر"]'::jsonb
  ),
  (
    'srv-landing',
    'en',
    'Landing pages for campaigns & products',
    'A focused page for a launch, service, or offer — strong visual hierarchy, persuasive copy, and a direct path that turns a visitor into a real next step.',
    '["One clear goal","Decision-driving copy","Fast and high-performing","Direct conversion path"]'::jsonb
  ),
  (
    'srv-uiux',
    'ar',
    'واجهات وتطبيقات ويب',
    'واجهات منظمة لمنتج، لوحة تحكم، أو تجربة تفاعلية مبنية بـ Next.js و React وTypeScript مع تصميم قابل للتوسع.',
    '["تصميم UI/UX حديث","لوحات تحكم عملية","أداء وسلاسة","بنية قابلة للنمو"]'::jsonb
  ),
  (
    'srv-uiux',
    'en',
    'Web apps & interfaces',
    'Structured interfaces for a product, dashboard, or interactive experience — built with Next.js, React, and TypeScript on a design that scales cleanly.',
    '["Modern UI/UX design","Practical dashboards","Performance & polish","Architecture that grows"]'::jsonb
  ),
  (
    'srv-product',
    'ar',
    'دعم منتج MoPlayer و Android TV',
    'تموضع المنتج، صفحات التفعيل والتحميل، بيانات الإصدارات، الدعم والخصوصية، وتجربة عرض مناسبة لـ Android TV.',
    '["تموضع منتج واضح","تفعيل وتحميل سلس","بيانات إصدارات موثوقة","تجربة Android TV"]'::jsonb
  ),
  (
    'srv-product',
    'en',
    'MoPlayer & Android TV product support',
    'Product positioning, activation and download flows, release metadata, support and privacy, and a presentation built for Android TV.',
    '["Clear product positioning","Smooth activation & download","Trusted release data","Android TV experience"]'::jsonb
  )
on conflict (service_id, locale) do update set
  title = coalesce(nullif(public.service_offering_translations.title, ''), excluded.title),
  description = coalesce(nullif(public.service_offering_translations.description, ''), excluded.description),
  bullets_json = case
    when jsonb_array_length(coalesce(public.service_offering_translations.bullets_json, '[]'::jsonb)) > 0
      then public.service_offering_translations.bullets_json
    else excluded.bullets_json
  end;
