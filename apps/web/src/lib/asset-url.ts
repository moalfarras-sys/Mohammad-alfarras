export function normalizePublicImagePath(path?: string | null): string {
  if (!path) return "";
  if (path === "/images/moplayer_ui_now_playing.png") return "/images/moplayer_ui_now_playing-final.png";
  if (path === "/images/moplayer_ui_playlist.png") return "/images/moplayer_ui_playlist-final.png";
  if (path === "/images/moplayer-tv-banner.png") return "/images/moplayer-tv-banner-final.png";
  if (path === "/images/moplayer-cinema-frame.webp") return "/images/moplayer-hero-3d-final.png";
  return path;
}
