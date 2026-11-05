-- The external city image host returns HTTP 402. Use the existing repository
-- capture of the same website; preserve the media record and its relationships.
update public.media_assets
set path = '/images/projects/alhasakah-home.webp',
    alt_en = 'Alhasakah website preview',
    alt_ar = 'معاينة موقع الحسكة'
where id = 'project-alhasakah-gallery'
  and path like 'https://xubrjnbolomqrgeutcfw.supabase.co/%';
