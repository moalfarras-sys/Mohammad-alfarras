export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];
export type ThemeMode = "light" | "dark";
export type PageStatus = "draft" | "published";

export type Page = {
  id: string;
  slug: string;
  status: PageStatus;
  template: string;
  created_at: string;
  updated_at: string;
};

export type PageTranslation = {
  page_id: string;
  locale: Locale;
  title: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
};

export type Section = {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  sort_order: number;
  is_enabled: boolean;
};

export type SectionTranslation = {
  section_id: string;
  locale: Locale;
  content_json: Record<string, unknown>;
};

export type NavigationItem = {
  id: string;
  sort_order: number;
  href_slug: string;
  icon: string;
  is_enabled: boolean;
};

export type NavigationTranslation = {
  nav_item_id: string;
  locale: Locale;
  label: string;
};

export type ThemeToken = {
  id: string;
  mode: ThemeMode;
  token_key: string;
  token_value: string;
};

export type MediaAsset = {
  id: string;
  path: string;
  alt_ar: string;
  alt_en: string;
  width: number;
  height: number;
  type: string;
};

export type YoutubeVideo = {
  id: string;
  youtube_id: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  thumbnail: string;
  duration: string;
  views: number;
  published_at: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
};

export type SiteSetting = {
  key: string;
  value_json: Record<string, unknown>;
};

export type AuditLog = {
  id: string;
  admin_user_id: string;
  action: string;
  entity: string;
  entity_id: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type CmsSnapshot = {
  pages: Page[];
  page_translations: PageTranslation[];
  sections: Section[];
  section_translations: SectionTranslation[];
  navigation_items: NavigationItem[];
  navigation_translations: NavigationTranslation[];
  theme_tokens: ThemeToken[];
  media_assets: MediaAsset[];
  youtube_videos: YoutubeVideo[];
  site_settings: SiteSetting[];
  audit_logs: AuditLog[];
};

export type SectionView = {
  id: string;
  key: string;
  type: string;
  order: number;
  enabled: boolean;
  content: Record<string, unknown>;
};

export type PageView = {
  id: string;
  slug: string;
  title: string;
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  sections: SectionView[];
};
