const publicSiteUrl =
  process.env.NEXT_PUBLIC_WEB_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://moalfarras.space";

export function resolveAdminAssetUrl(path?: string | null): string {
  if (!path) return "";
  const normalized =
    path === "/images/moplayer_ui_now_playing.png"
      ? "/images/moplayer_ui_now_playing-final.png"
      : path === "/images/moplayer_ui_playlist.png"
        ? "/images/moplayer_ui_playlist-final.png"
        : path === "/images/moplayer-tv-banner.png"
          ? "/images/moplayer-tv-banner-final.png"
          : path === "/images/moplayer-cinema-frame.webp"
            ? "/images/moplayer-hero-3d-final.png"
            : path;
  if (/^(https?:)?\/\//i.test(normalized) || normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return normalized;
  }
  if (normalized.startsWith("/images/") || normalized.startsWith("/icons/") || normalized.startsWith("/downloads/")) {
    return `${publicSiteUrl.replace(/\/$/, "")}${normalized}`;
  }
  return normalized;
}
