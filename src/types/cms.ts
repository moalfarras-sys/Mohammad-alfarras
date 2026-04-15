export const locales = ["ar", "en"] as const;

export type Locale = (typeof locales)[number];
export type PageStatus = "draft" | "published";
export type BlockType =
  | "hero"
  | "proof-metrics"
  | "service-pillars"
  | "timeline-preview"
  | "featured-video"
  | "profile-summary"
  | "case-study-grid"
  | "feature-grid"
  | "media-gallery"
  | "work-showcase"
  | "experience-timeline"
  | "certifications-grid"
  | "services-grid"
  | "contact-channels"
  | "faq"
  | "cta"
  | "conversion-cta"
  | "rich-text"
  | "cards"
  | "videos";

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

export type PageBlock = {
  id: string;
  page_slug: string;
  block_type: BlockType;
  sort_order: number;
  is_enabled: boolean;
  config_json: Record<string, unknown>;
};

export type PageBlockTranslation = {
  block_id: string;
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

export type WorkProject = {
  id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  category?: string | null;
  featured_rank?: number | null;
  project_url: string;
  repo_url: string;
  cover_media_id: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkProjectTranslation = {
  project_id: string;
  locale: Locale;
  title: string;
  summary: string;
  description: string;
  cta_label: string;
  tags_json?: string[];
  challenge?: string;
  solution?: string;
  result?: string;
};

export type WorkProjectMediaRole = "cover" | "gallery";

export type WorkProjectMedia = {
  id: string;
  project_id: string;
  media_id: string;
  role: WorkProjectMediaRole;
  sort_order: number;
};

export type WorkProjectMetric = {
  id: string;
  project_id: string;
  sort_order: number;
  value: string;
  label_ar: string;
  label_en: string;
};

export type Experience = {
  id: string;
  is_active: boolean;
  sort_order: number;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  current_role: boolean;
  logo_media_id: string | null;
};

export type ExperienceTranslation = {
  experience_id: string;
  locale: Locale;
  role_title: string;
  description: string;
  highlights_json: string[];
};

export type Certification = {
  id: string;
  is_active: boolean;
  sort_order: number;
  issuer: string;
  issue_date: string;
  expiry_date: string | null;
  credential_url: string;
  certificate_media_id: string | null;
};

export type CertificationTranslation = {
  certification_id: string;
  locale: Locale;
  name: string;
  description: string;
};

export type ServiceOffering = {
  id: string;
  is_active: boolean;
  sort_order: number;
  icon: string;
  color_token: string;
  cover_media_id: string | null;
};

export type ServiceOfferingTranslation = {
  service_id: string;
  locale: Locale;
  title: string;
  description: string;
  bullets_json: string[];
};

export type ContactChannelType = "whatsapp" | "email" | "linkedin" | "telegram" | "instagram" | "youtube" | "custom";

export type ContactChannel = {
  id: string;
  channel_type: ContactChannelType;
  value: string;
  is_primary: boolean;
  is_active: boolean;
  sort_order: number;
  icon: string;
  label_default: string;
};

export type ContactChannelTranslation = {
  channel_id: string;
  locale: Locale;
  label: string;
  description: string;
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
  page_blocks: PageBlock[];
  page_block_translations: PageBlockTranslation[];
  navigation_items: NavigationItem[];
  navigation_translations: NavigationTranslation[];
  media_assets: MediaAsset[];
  youtube_videos: YoutubeVideo[];
  work_projects: WorkProject[];
  work_project_translations: WorkProjectTranslation[];
  work_project_media: WorkProjectMedia[];
  work_project_metrics: WorkProjectMetric[];
  experiences: Experience[];
  experience_translations: ExperienceTranslation[];
  certifications: Certification[];
  certification_translations: CertificationTranslation[];
  service_offerings: ServiceOffering[];
  service_offering_translations: ServiceOfferingTranslation[];
  contact_channels: ContactChannel[];
  contact_channel_translations: ContactChannelTranslation[];
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

export type PageBlockView = {
  id: string;
  type: BlockType;
  order: number;
  enabled: boolean;
  config: Record<string, unknown>;
  content: Record<string, unknown>;
};

export type WorkProjectView = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  ctaLabel: string;
  category: string;
  featuredRank: number | null;
  tags: string[];
  challenge: string;
  solution: string;
  result: string;
  projectUrl: string;
  repoUrl: string;
  cover: MediaAsset | null;
  gallery: MediaAsset[];
  metrics: WorkProjectMetric[];
  order: number;
};

export type ExperienceView = {
  id: string;
  roleTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string | null;
  currentRole: boolean;
  description: string;
  highlights: string[];
  logo: MediaAsset | null;
  order: number;
};

export type CertificationView = {
  id: string;
  name: string;
  description: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialUrl: string;
  certificate: MediaAsset | null;
  order: number;
};

export type ServiceView = {
  id: string;
  title: string;
  description: string;
  bullets: string[];
  icon: string;
  colorToken: string;
  cover: MediaAsset | null;
  order: number;
};

export type ContactChannelView = {
  id: string;
  type: ContactChannelType;
  label: string;
  description: string;
  value: string;
  icon: string;
  isPrimary: boolean;
  order: number;
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
  blocks: PageBlockView[];
};
