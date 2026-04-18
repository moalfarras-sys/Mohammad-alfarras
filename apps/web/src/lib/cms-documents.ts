import {
  rebuildContent,
  type RebuildLocaleContent,
  type RebuildPageKey,
  type SeoEntry,
} from "@/data/rebuild-content";
import type { CmsSnapshot, Locale } from "@/types/cms";

export type Localized<T> = Record<Locale, T>;

export type BrandAssetsDocument = {
  siteName: Localized<string>;
  navTagline: Localized<string>;
  nav: Localized<Record<RebuildPageKey, string>>;
  footer: Localized<RebuildLocaleContent["footer"]>;
  common: Localized<RebuildLocaleContent["common"]>;
  logo: {
    mediaId: string | null;
    path: string;
  };
  profilePortrait: {
    mediaId: string | null;
    path: string;
  };
  youtubeHero: {
    mediaId: string | null;
    path: string;
  };
  contactHero: {
    mediaId: string | null;
    path: string;
  };
  gallery: {
    techMediaId: string | null;
    techPath: string;
    brandMediaId: string | null;
    brandPath: string;
    logisticsMediaId: string | null;
    logisticsPath: string;
    mediaMediaId: string | null;
    mediaPath: string;
  };
};

export type AdminProfileDocument = {
  displayName: Localized<string>;
  role: Localized<string>;
  email: string;
  avatarMediaId: string | null;
  avatarPath: string;
};

export type HomeContentDocument = Localized<
  Pick<
    RebuildLocaleContent,
    "hero" | "identity" | "services" | "logistics" | "featuredWork" | "media" | "insights" | "liveLayer"
  >
>;

export type ProjectsPageContentDocument = Localized<RebuildLocaleContent["projects"]>;
export type YoutubePageContentDocument = Localized<RebuildLocaleContent["youtube"]>;
export type CvPageContentDocument = Localized<Pick<RebuildLocaleContent, "journey" | "cv">>;
export type ContactPageContentDocument = Localized<RebuildLocaleContent["contact"]>;

export type SiteSeoDocument = Localized<Record<RebuildPageKey, SeoEntry>>;

export type PdfRegistryDocument = {
  active: {
    branded: "generated" | "uploaded";
    ats: "generated" | "uploaded";
  };
  uploads: {
    branded: { url: string; filename: string; uploadedAt: string } | null;
    ats: { url: string; filename: string; uploadedAt: string } | null;
  };
};

type SettingKey =
  | "brand_assets"
  | "admin_profile"
  | "home_content"
  | "projects_page_content"
  | "youtube_page_content"
  | "cv_page_content"
  | "contact_page_content"
  | "pdf_registry"
  | "site_seo";

function findSetting<T>(snapshot: CmsSnapshot, key: SettingKey): Partial<T> | null {
  const setting = snapshot.site_settings.find((entry) => entry.key === key);
  if (!setting || typeof setting.value_json !== "object") return null;
  return setting.value_json as Partial<T>;
}

function deepMerge<T>(base: T, override: Partial<T> | null | undefined): T {
  if (!override) return structuredClone(base);
  if (Array.isArray(base)) {
    return structuredClone((override as T) ?? base);
  }
  if (base && typeof base === "object") {
    const next = { ...(base as Record<string, unknown>) } as Record<string, unknown>;
    for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
      if (value === undefined) continue;
      const current = next[key];
      if (Array.isArray(value)) {
        next[key] = structuredClone(value);
      } else if (value && typeof value === "object" && current && typeof current === "object" && !Array.isArray(current)) {
        next[key] = deepMerge(current, value as Record<string, unknown>);
      } else {
        next[key] = value;
      }
    }
    return next as T;
  }
  return structuredClone((override as T) ?? base);
}

function defaultBrandAssets(): BrandAssetsDocument {
  return {
    siteName: {
      ar: rebuildContent.ar.brandName,
      en: rebuildContent.en.brandName,
    },
    navTagline: {
      ar: rebuildContent.ar.navTagline,
      en: rebuildContent.en.navTagline,
    },
    nav: {
      ar: rebuildContent.ar.nav,
      en: rebuildContent.en.nav,
    },
    footer: {
      ar: rebuildContent.ar.footer,
      en: rebuildContent.en.footer,
    },
    common: {
      ar: rebuildContent.ar.common,
      en: rebuildContent.en.common,
    },
    logo: {
      mediaId: "logo",
      path: "/images/moplayer-brand-logo-final.png",
    },
    profilePortrait: {
      mediaId: "m7",
      path: "/images/protofeilnew.jpeg",
    },
    youtubeHero: {
      mediaId: null,
      path: "/images/yt-hero-2026.png",
    },
    contactHero: {
      mediaId: null,
      path: "/images/contact-hero-2026.png",
    },
    gallery: {
      techMediaId: "m6",
      techPath: "/images/service_tech.png",
      brandMediaId: "logo",
      brandPath: "/images/moplayer-brand-logo-final.png",
      logisticsMediaId: "m4",
      logisticsPath: "/images/service_logistics.png",
      mediaMediaId: null,
      mediaPath: "/images/yt-hero-2026.png",
    },
  };
}

function defaultAdminProfile(snapshot: CmsSnapshot): AdminProfileDocument {
  const brandProfile = snapshot.site_settings.find((item) => item.key === "brand_profile")?.value_json ?? {};
  const contact = snapshot.site_settings.find((item) => item.key === "contact")?.value_json ?? {};

  return {
    displayName: {
      ar: String((brandProfile as Record<string, unknown>).title_ar ?? rebuildContent.ar.brandName),
      en: String((brandProfile as Record<string, unknown>).title_en ?? rebuildContent.en.brandName),
    },
    role: {
      ar: "مدير النظام",
      en: "Control Center Admin",
    },
    email: String((contact as Record<string, unknown>).email ?? "mohammad.alfarras@gmail.com"),
    avatarMediaId: null,
    avatarPath: "/images/portrait.jpg",
  };
}

function defaultHomeContent(): HomeContentDocument {
  return {
    ar: {
      hero: rebuildContent.ar.hero,
      identity: rebuildContent.ar.identity,
      services: rebuildContent.ar.services,
      logistics: rebuildContent.ar.logistics,
      featuredWork: rebuildContent.ar.featuredWork,
      media: rebuildContent.ar.media,
      insights: rebuildContent.ar.insights,
      liveLayer: rebuildContent.ar.liveLayer,
    },
    en: {
      hero: rebuildContent.en.hero,
      identity: rebuildContent.en.identity,
      services: rebuildContent.en.services,
      logistics: rebuildContent.en.logistics,
      featuredWork: rebuildContent.en.featuredWork,
      media: rebuildContent.en.media,
      insights: rebuildContent.en.insights,
      liveLayer: rebuildContent.en.liveLayer,
    },
  };
}

function defaultProjectsPageContent(): ProjectsPageContentDocument {
  return {
    ar: rebuildContent.ar.projects,
    en: rebuildContent.en.projects,
  };
}

function defaultYoutubePageContent(): YoutubePageContentDocument {
  return {
    ar: rebuildContent.ar.youtube,
    en: rebuildContent.en.youtube,
  };
}

function defaultCvPageContent(): CvPageContentDocument {
  return {
    ar: {
      journey: rebuildContent.ar.journey,
      cv: rebuildContent.ar.cv,
    },
    en: {
      journey: rebuildContent.en.journey,
      cv: rebuildContent.en.cv,
    },
  };
}

function defaultContactPageContent(): ContactPageContentDocument {
  return {
    ar: rebuildContent.ar.contact,
    en: rebuildContent.en.contact,
  };
}

function defaultPdfRegistry(): PdfRegistryDocument {
  return {
    active: {
      branded: "generated",
      ats: "generated",
    },
    uploads: {
      branded: null,
      ats: null,
    },
  };
}

function defaultSiteSeo(): SiteSeoDocument {
  return {
    ar: rebuildContent.ar.seo,
    en: rebuildContent.en.seo,
  };
}

export function getBrandAssets(snapshot: CmsSnapshot): BrandAssetsDocument {
  return deepMerge(defaultBrandAssets(), findSetting<BrandAssetsDocument>(snapshot, "brand_assets"));
}

export function getAdminProfileDocument(snapshot: CmsSnapshot): AdminProfileDocument {
  return deepMerge(defaultAdminProfile(snapshot), findSetting<AdminProfileDocument>(snapshot, "admin_profile"));
}

export function getHomeContentDocument(snapshot: CmsSnapshot): HomeContentDocument {
  return deepMerge(defaultHomeContent(), findSetting<HomeContentDocument>(snapshot, "home_content"));
}

export function getProjectsPageContentDocument(snapshot: CmsSnapshot): ProjectsPageContentDocument {
  return deepMerge(
    defaultProjectsPageContent(),
    findSetting<ProjectsPageContentDocument>(snapshot, "projects_page_content"),
  );
}

export function getYoutubePageContentDocument(snapshot: CmsSnapshot): YoutubePageContentDocument {
  return deepMerge(
    defaultYoutubePageContent(),
    findSetting<YoutubePageContentDocument>(snapshot, "youtube_page_content"),
  );
}

export function getCvPageContentDocument(snapshot: CmsSnapshot): CvPageContentDocument {
  return deepMerge(defaultCvPageContent(), findSetting<CvPageContentDocument>(snapshot, "cv_page_content"));
}

export function getContactPageContentDocument(snapshot: CmsSnapshot): ContactPageContentDocument {
  return deepMerge(
    defaultContactPageContent(),
    findSetting<ContactPageContentDocument>(snapshot, "contact_page_content"),
  );
}

export function getSiteSeoDocument(snapshot: CmsSnapshot): SiteSeoDocument {
  return deepMerge(defaultSiteSeo(), findSetting<SiteSeoDocument>(snapshot, "site_seo"));
}

export function getPdfRegistry(snapshot: CmsSnapshot): PdfRegistryDocument {
  const legacy = snapshot.site_settings.find((entry) => entry.key === "cv_pdf_url")?.value_json as
    | { url?: string; filename?: string; uploadedAt?: string }
    | undefined;
  const base = defaultPdfRegistry();
  if (legacy?.url) {
    base.uploads.branded = {
      url: legacy.url,
      filename: legacy.filename ?? "cv.pdf",
      uploadedAt: legacy.uploadedAt ?? new Date().toISOString(),
    };
    base.active.branded = "uploaded";
  }
  return deepMerge(base, findSetting<PdfRegistryDocument>(snapshot, "pdf_registry"));
}

export function resolveMediaPath(snapshot: CmsSnapshot, mediaId: string | null | undefined, fallback: string): string {
  if (!mediaId) return fallback;
  return snapshot.media_assets.find((item) => item.id === mediaId)?.path ?? fallback;
}

export function resolveBrandAssetPaths(snapshot: CmsSnapshot) {
  const doc = getBrandAssets(snapshot);
  return {
    logo: resolveMediaPath(snapshot, doc.logo.mediaId, doc.logo.path),
    profilePortrait: resolveMediaPath(snapshot, doc.profilePortrait.mediaId, doc.profilePortrait.path),
    youtubeHero: resolveMediaPath(snapshot, doc.youtubeHero.mediaId, doc.youtubeHero.path),
    contactHero: resolveMediaPath(snapshot, doc.contactHero.mediaId, doc.contactHero.path),
    gallery: {
      tech: resolveMediaPath(snapshot, doc.gallery.techMediaId, doc.gallery.techPath),
      brand: resolveMediaPath(snapshot, doc.gallery.brandMediaId, doc.gallery.brandPath),
      logistics: resolveMediaPath(snapshot, doc.gallery.logisticsMediaId, doc.gallery.logisticsPath),
      media: resolveMediaPath(snapshot, doc.gallery.mediaMediaId, doc.gallery.mediaPath),
    },
  };
}

export function resolveRebuildLocaleContent(snapshot: CmsSnapshot, locale: Locale): RebuildLocaleContent {
  const base = structuredClone(rebuildContent[locale]);
  const brand = getBrandAssets(snapshot);
  const home = getHomeContentDocument(snapshot);
  const projects = getProjectsPageContentDocument(snapshot);
  const youtube = getYoutubePageContentDocument(snapshot);
  const cv = getCvPageContentDocument(snapshot);
  const contact = getContactPageContentDocument(snapshot);
  const siteSeo = getSiteSeoDocument(snapshot);

  return {
    ...base,
    brandName: brand.siteName[locale],
    navTagline: brand.navTagline[locale],
    nav: brand.nav[locale],
    footer: brand.footer[locale],
    common: brand.common[locale],
    seo: siteSeo[locale],
    hero: home[locale].hero,
    identity: home[locale].identity,
    services: home[locale].services,
    logistics: home[locale].logistics,
    featuredWork: home[locale].featuredWork,
    media: home[locale].media,
    insights: home[locale].insights,
    liveLayer: home[locale].liveLayer,
    projects: projects[locale],
    youtube: youtube[locale],
    journey: cv[locale].journey,
    cv: cv[locale].cv,
    contact: contact[locale],
  };
}

