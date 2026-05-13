update public.app_release_assets
set file_size_bytes = case abi
    when 'universal' then 90259499
    when 'arm64-v8a' then 29477370
    when 'armeabi-v7a' then 29156078
    when 'x86' then 30432474
    when 'x86_64' then 31214242
    else file_size_bytes
  end,
  checksum_sha256 = case abi
    when 'universal' then '68795d7fadcf1de9f91d8394fece0d090248d6a48eb6d46ad365a0466c02d7d4'
    when 'arm64-v8a' then '134649046b058e15585fdebeab1e63281164e5c7e0fe481cd10f609ec4e9f2c4'
    when 'armeabi-v7a' then '973c28324ddec0e8be835f936f3baad8465dc18fa9646f0405c595176110f7fa'
    when 'x86' then 'f829dbdd31bfcebcf4fd3ccfc6c82c5af3e03906405f13182d885a090737ffb9'
    when 'x86_64' then 'ed85b95750a5247bf0988c95c0b14b5011b94cb8f17a02f731f17d4246279b77'
    else checksum_sha256
  end
where release_id in (
  select id from public.app_releases
  where product_slug = 'moplayer'
    and slug in ('moplayer-2.2.2', 'moplayer-v2.2-full')
);

update public.app_release_assets
set file_size_bytes = 49112730,
    checksum_sha256 = '4f65faac40a057e0674ccbac72b83a72178cdf544cc91b80377ca74ccabe3357',
    external_url = '/downloads/moplayer2/app-release.apk',
    abi = 'universal',
    label = 'MoPlayer Pro Universal Android TV APK'
where release_id in (
  select id from public.app_releases
  where product_slug = 'moplayer2'
    and slug = 'moplayer2-v2.1.2-full'
)
and is_primary = true;

update public.app_products
set product_name = 'MoPlayer Pro',
    default_download_label = 'Download MoPlayer Pro APK',
    updated_at = timezone('utc', now())
where slug = 'moplayer2';
