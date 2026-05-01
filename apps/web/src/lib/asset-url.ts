export function normalizePublicImagePath(path?: string | null): string {
  if (!path) return "";
  const value = path.trim().replace(/\\/g, "/");
  if (!value) return "";
  if (value === "/images/moplayer_ui_now_playing.png") return "/images/moplayer_ui_now_playing-final.png";
  if (value === "/images/moplayer_ui_playlist.png") return "/images/moplayer_ui_playlist-final.png";
  if (value === "/images/moplayer-tv-banner.png") return "/images/moplayer-tv-banner-final.png";
  if (value === "/images/moplayer-cinema-frame.webp") return "/images/moplayer-hero-3d-final.png";
  if (value.startsWith("images/")) return `/${value}`;
  return value;
}
