import { getSiteSetting } from "@/lib/content/store";
import { resolveMediaPath } from "@/lib/projects-studio";
import type { CmsSnapshot } from "@/types/cms";

export type SiteImageSlots = Record<string, string>;

export function resolveSiteImages(snapshot: CmsSnapshot): SiteImageSlots {
  const siteImagesRaw = getSiteSetting<Record<string, unknown>>(snapshot, "site_images", {});
  const siteImages: SiteImageSlots = {};
  for (const [slot, mediaId] of Object.entries(siteImagesRaw)) {
    if (typeof mediaId === "string" && mediaId.trim()) {
      const resolved = resolveMediaPath(snapshot.media_assets, mediaId.trim(), "");
      if (resolved) siteImages[slot] = resolved;
    }
  }
  return siteImages;
}

export function siteImage(siteImages: SiteImageSlots, slot: string, fallback: string): string {
  return siteImages[slot]?.trim() || fallback;
}
