-- Remove visitor-facing technical jargon from CMS content.
-- Visitors must not see framework/internal terms (Next.js, Supabase, Vercel,
-- "admin-controlled", "runtime settings", "CMS-Controlled", "Digital OS", etc.).
-- These updates were applied to production Supabase on 2026-06-15; this migration
-- documents them and keeps any rebuild / fresh seed in sync. Idempotent.

-- Service: "CMS-Controlled Business Websites" -> plain-language title + body.
update public.service_offering_translations
set title = 'Business Websites You Can Edit Yourself',
    description = 'Marketing websites for services and businesses where you can update images, text, services, and projects yourself — quickly and easily.'
where service_id = 'business-websites' and locale = 'en';

-- Service: web apps/interfaces — drop "built with Next.js, React, TypeScript".
update public.service_offering_translations
set description = 'Structured interfaces for a product, dashboard, or interactive experience, built on a clean foundation that scales as you grow.'
where service_id = 'srv-uiux' and locale = 'en';

update public.service_offering_translations
set description = 'واجهات منظمة لمنتج، أو لوحة تحكم، أو تجربة تفاعلية، مبنية على أساس نظيف وقابل للتوسع مع نمو مشروعك.'
where service_id = 'srv-uiux' and locale = 'ar';

-- Work project tags: drop "Next.js" / "RTL/LTR" technical labels.
update public.work_project_translations
set tags_json = '["Web Platform","Arabic & English","Admin Panel"]'::jsonb
where project_id = 'wp-ecosystem' and locale = 'en';

update public.work_project_translations
set tags_json = '["منصة ويب","عربي وإنجليزي","لوحة تحكم"]'::jsonb
where project_id = 'wp-ecosystem' and locale = 'ar';

-- MoPlayer Pro product copy: replace internal/developer notes
-- (Supabase, Vercel, "admin-controlled", "runtime settings", "admin product switcher")
-- with customer-facing copy.
update public.app_products
set tagline = 'A premium Android TV player with fast QR activation, regular updates, and a clean, focused viewing experience.',
    long_description = 'MoPlayer Pro is built for the big screen — simple setup, quick activation, and smooth, stable playback for the Xtream or M3U sources you are authorized to use, with clear download and support pages.',
    feature_highlights = '[{"icon":"tv","title":"Made for the big screen","body":"Remote-first navigation tuned for Android TV and Fire TV."},{"icon":"zap","title":"Fast QR activation","body":"Activate your device in seconds and start watching right away."},{"icon":"box","title":"Clean, focused player","body":"Live TV, movies, and series in one tidy, easy-to-use experience."},{"icon":"shield","title":"Regular updates","body":"New releases and improvements delivered through the official page."}]'::jsonb,
    how_it_works = '[{"title":"Download the app","body":"Get the official MoPlayer Pro APK from this page."},{"title":"Activate with a QR code","body":"Scan the on-screen QR code to activate your device in seconds."},{"title":"Add your source","body":"Connect an Xtream or M3U source you are authorized to use and start watching."}]'::jsonb
where slug = 'moplayer2';
