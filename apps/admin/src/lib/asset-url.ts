const publicAssetBaseUrl = "https://moalfarras.space";
const proxyableHosts = new Set([
  "moalfarras.space",
  "www.moalfarras.space",
  "alhasakah.net",
  "www.alhasakah.net",
  "qamishli.net",
  "www.qamishli.net",
  "ckefrnalgnbuaxsuufyx.supabase.co",
  "xubrjnbolomqrgeutcfw.supabase.co",
]);

function proxyPublicAsset(path: string) {
  return `/api/asset-proxy?src=${encodeURIComponent(`${publicAssetBaseUrl}${path.startsWith("/") ? path : `/${path}`}`)}`;
}

function proxyAbsoluteAsset(url: string) {
  return `/api/asset-proxy?src=${encodeURIComponent(url)}`;
}

export function resolveAdminAssetUrl(path?: string | null): string {
  if (!path?.trim()) return proxyPublicAsset("/images/logo.png");
  const raw = path.trim();
  const normalized =
    raw === "/images/moplayer_ui_now_playing.png" || raw === "images/moplayer_ui_now_playing.png"
      ? "/images/moplayer_ui_now_playing-final.png"
      : raw === "/images/moplayer_ui_playlist.png" || raw === "images/moplayer_ui_playlist.png"
        ? "/images/moplayer_ui_playlist-final.png"
        : raw === "/images/moplayer-tv-banner.png" || raw === "images/moplayer-tv-banner.png"
          ? "/images/moplayer-tv-banner-final.png"
          : raw === "/images/moplayer-cinema-frame.webp" || raw === "images/moplayer-cinema-frame.webp"
            ? "/images/moplayer-hero-3d-final.png"
            : raw;
  if (normalized.startsWith("data:") || normalized.startsWith("blob:")) {
    return normalized;
  }
  if (/^\/\//i.test(normalized)) {
    return proxyAbsoluteAsset(`https:${normalized}`);
  }
  if (/^https:\/\//i.test(normalized)) {
    try {
      const url = new URL(normalized);
      return proxyableHosts.has(url.hostname) ? proxyAbsoluteAsset(url.toString()) : normalized;
    } catch {
      return normalized;
    }
  }
  if (/^http:\/\//i.test(normalized)) {
    return normalized;
  }
  if (normalized.startsWith("images/") || normalized.startsWith("icons/") || normalized.startsWith("downloads/")) {
    return proxyPublicAsset(normalized);
  }
  if (normalized.startsWith("/images/") || normalized.startsWith("/icons/") || normalized.startsWith("/downloads/")) {
    return proxyPublicAsset(normalized);
  }
  return normalized;
}
