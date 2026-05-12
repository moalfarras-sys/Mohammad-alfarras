alter table public.app_products
  add column if not exists downloader_code text;

comment on column public.app_products.downloader_code is
  'Optional numeric AFTVnews Downloader code generated from the public APK download URL. Leave null until a real code exists.';

update public.app_products
set
  downloader_code = null,
  hero_image_path = case
    when slug = 'moplayer2' then '/images/moplayer-pro-banner.jpeg'
    else hero_image_path
  end,
  tv_banner_path = case
    when slug = 'moplayer2' then '/images/moplayer-pro-banner.jpeg'
    else tv_banner_path
  end
where slug in ('moplayer', 'moplayer2');
