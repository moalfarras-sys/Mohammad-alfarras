import type {
  CmsSnapshot,
  ContactChannelView,
  ExperienceView,
  Locale,
  MediaAsset,
  PageBlockView,
  PageView,
  ServiceView,
  WorkProjectView,
  YoutubeVideo,
} from "@/types/cms";

export function findBlock(page: PageView, type: PageBlockView["type"]) {
  return page.blocks.find((block) => block.type === type && block.enabled) ?? null;
}

export function getProjects(snapshot: CmsSnapshot, locale: Locale): WorkProjectView[] {
  return snapshot.work_projects
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.work_project_translations.find((item) => item.project_id === entry.id && item.locale === locale);
      const cover = entry.cover_media_id
        ? snapshot.media_assets.find((item) => item.id === entry.cover_media_id) ?? null
        : null;

      return {
        id: entry.id,
        slug: entry.slug,
        title: tr?.title ?? entry.slug,
        summary: tr?.summary ?? "",
        description: tr?.description ?? "",
        ctaLabel: tr?.cta_label ?? (locale === "ar" ? "زيارة المشروع" : "Open project"),
        projectUrl: entry.project_url,
        repoUrl: entry.repo_url,
        cover,
        order: entry.sort_order,
      };
    });
}

export function getExperiences(snapshot: CmsSnapshot, locale: Locale): ExperienceView[] {
  return snapshot.experiences
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.experience_translations.find((item) => item.experience_id === entry.id && item.locale === locale);
      const logo = entry.logo_media_id ? snapshot.media_assets.find((item) => item.id === entry.logo_media_id) ?? null : null;

      return {
        id: entry.id,
        roleTitle: tr?.role_title ?? "",
        company: entry.company,
        location: entry.location,
        startDate: entry.start_date,
        endDate: entry.end_date,
        currentRole: entry.current_role,
        description: tr?.description ?? "",
        highlights: tr?.highlights_json ?? [],
        logo,
        order: entry.sort_order,
      };
    });
}

export function getServices(snapshot: CmsSnapshot, locale: Locale): ServiceView[] {
  return snapshot.service_offerings
    .filter((entry) => entry.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((entry) => {
      const tr = snapshot.service_offering_translations.find((item) => item.service_id === entry.id && item.locale === locale);
      const cover = entry.cover_media_id
        ? snapshot.media_assets.find((item) => item.id === entry.cover_media_id) ?? null
        : null;

      return {
        id: entry.id,
        title: tr?.title ?? entry.id,
        description: tr?.description ?? "",
        bullets: tr?.bullets_json ?? [],
        icon: entry.icon,
        colorToken: entry.color_token,
        cover,
        order: entry.sort_order,
      };
    });
}

export function getChannels(snapshot: CmsSnapshot, locale: Locale): ContactChannelView[] {
  return snapshot.contact_channels
    .filter((entry) => entry.is_active)
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    })
    .map((entry) => {
      const tr = snapshot.contact_channel_translations.find((item) => item.channel_id === entry.id && item.locale === locale);

      return {
        id: entry.id,
        type: entry.channel_type,
        label: tr?.label ?? entry.label_default,
        description: tr?.description ?? "",
        value: entry.value,
        icon: entry.icon,
        isPrimary: entry.is_primary,
        order: entry.sort_order,
      };
    });
}

export function getPortrait(snapshot: CmsSnapshot, _locale: Locale): MediaAsset | null {
  void _locale;

  const portrait =
    snapshot.media_assets.find((asset) => asset.path.includes("portrait.jpg")) ??
    snapshot.media_assets.find((asset) => asset.path.includes("portrait")) ??
    null;

  if (!portrait) {
    return null;
  }

  return {
    ...portrait,
    alt_ar: portrait.alt_ar || "صورة محمد الفراس",
    alt_en: portrait.alt_en || "Portrait of Mohammad Alfarras",
  };
}

function getDefaultGallery(snapshot: CmsSnapshot) {
  return snapshot.media_assets.filter((asset) => asset.path.startsWith("/images/") && !asset.path.endsWith(".svg"));
}

export function getGallery(snapshot: CmsSnapshot, block: PageBlockView | null): MediaAsset[] {
  if (!block) {
    return getDefaultGallery(snapshot);
  }

  const wantedIds = Array.isArray(block.content.items) ? block.content.items.map((entry) => String(entry)) : [];
  if (!wantedIds.length) {
    return getDefaultGallery(snapshot);
  }

  return wantedIds
    .map((id) => snapshot.media_assets.find((asset) => asset.id === id) ?? null)
    .filter((asset): asset is MediaAsset => asset !== null && !asset.path.endsWith(".svg"));
}

export function getVideoStats(videos: YoutubeVideo[]) {
  const totalViews = videos.reduce((sum, video) => sum + Math.max(0, video.views), 0);
  const oldest = videos.reduce<number | null>((acc, video) => {
    const ts = new Date(video.published_at).getTime();
    if (!Number.isFinite(ts)) {
      return acc;
    }
    if (acc === null) {
      return ts;
    }
    return Math.min(acc, ts);
  }, null);

  return {
    totalViews,
    yearsActive: oldest ? Math.max(1, new Date().getFullYear() - new Date(oldest).getFullYear() + 1) : 1,
  };
}

export function iconForChannel(type: string) {
  switch (type) {
    case "whatsapp":
      return "💬";
    case "email":
      return "✉️";
    case "linkedin":
      return "💼";
    case "telegram":
      return "📨";
    case "instagram":
      return "📸";
    case "youtube":
      return "▶️";
    default:
      return "🔗";
  }
}
