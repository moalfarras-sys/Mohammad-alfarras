-- Restore the original service cards/copy and keep them active in the admin.

insert into public.service_offerings (id, is_active, sort_order, icon, color_token, cover_media_id)
values
  ('srv-web', true, 1, 'globe', 'accent', coalesce((select id from public.media_assets where id = 'project-ecosystem-cover'), null)),
  ('srv-app', true, 2, 'play', 'accent', coalesce((select id from public.media_assets where id = 'm34'), null)),
  ('srv-yt', true, 3, 'briefcase', 'accent', coalesce((select id from public.media_assets where id = 'm57'), null))
on conflict (id) do update set
  is_active = true,
  sort_order = excluded.sort_order,
  icon = excluded.icon,
  color_token = excluded.color_token,
  cover_media_id = coalesce(service_offerings.cover_media_id, excluded.cover_media_id);

insert into public.service_offering_translations (service_id, locale, title, description, bullets_json)
values
  ('srv-web', 'ar', 'مواقع تشرح الفكرة', 'لا أصنع مواقع جميلة فحسب. أصنع مواقع تنقل القيمة بسرعة وتجعل الزائر يثق قبل أن يقرأ كلمة ثانية.', '["بنية بصرية تقود الزائر","رسالة تسويقية حادة","تصميم يحتمل التوسع","انطباع أول لا ينسى"]'::jsonb),
  ('srv-web', 'en', 'Websites that speak first', 'Not just beautiful — built to communicate value in seconds and earn trust before the visitor reads a second sentence.', '["Visual structure that guides","Sharp marketing message","Scalable design architecture","A first impression that sticks"]'::jsonb),
  ('srv-app', 'ar', 'محتوى يقنع لا يصف', 'على يوتيوب وخارجه، أشرح المنتج بطريقة تقربه من المستخدم وتبعد الشك عنه. لأن الشرح الصحيح يبيع بدون ضغط.', '["مراجعات تقنية صادقة","سرد بصري للمنتج","لغة تبني الثقة","محتوى قابل للتذكر"]'::jsonb),
  ('srv-app', 'en', 'Content that persuades, not describes', 'On YouTube and beyond, I explain products in a way that brings them closer to the user and removes doubt — because the right explanation sells without pressure.', '["Honest product reviews","Visual product storytelling","Language that builds trust","Memorable content"]'::jsonb),
  ('srv-yt', 'ar', 'تنفيذ لا يتزعزع', 'من إدارة المستودعات إلى بناء المواقع، أفهم ما يعنيه التسليم في الوقت المحدد. النظام والوضوح ليسا رفاهية — هما الأساس.', '["أولويات واضحة من البداية","تنفيذ منضبط بلا فوضى","حل المشكلات بعقل عملي","تسليم يمكن الاعتماد عليه"]'::jsonb),
  ('srv-yt', 'en', 'Execution that does not break', 'From warehouse management to web builds, I understand what on-time delivery means. Order and clarity are not luxuries — they are the foundation.', '["Clear priorities from day one","Disciplined, noise-free execution","Practical problem solving","Delivery you can count on"]'::jsonb)
on conflict (service_id, locale) do update set
  title = excluded.title,
  description = excluded.description,
  bullets_json = excluded.bullets_json;
