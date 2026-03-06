import { z } from "zod";

export const localeSchema = z.enum(["ar", "en"]);
export const themeModeSchema = z.enum(["light", "dark"]);
export const pageStatusSchema = z.enum(["draft", "published"]);
export const blockTypeSchema = z.enum([
  "hero",
  "feature-grid",
  "media-gallery",
  "work-showcase",
  "experience-timeline",
  "certifications-grid",
  "services-grid",
  "contact-channels",
  "faq",
  "cta",
  "rich-text",
  "cards",
  "videos",
]);

export const themeTokenUpdateSchema = z.object({
  mode: themeModeSchema,
  tokenKey: z.string().min(1),
  tokenValue: z.string().min(1),
});

export const videoSchema = z.object({
  id: z.string().min(1),
  youtube_id: z.string().min(3),
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  description_ar: z.string().min(1),
  description_en: z.string().min(1),
  thumbnail: z.string().url(),
  duration: z.string().min(3),
  views: z.number().int().nonnegative(),
  published_at: z.string().datetime(),
  sort_order: z.number().int(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
});

export const pageCoreUpdateSchema = z.object({
  id: z.string().min(1),
  status: pageStatusSchema,
  template: z.string().min(1),
});

export const pageTranslationUpdateSchema = z.object({
  page_id: z.string().min(1),
  locale: localeSchema,
  title: z.string().min(1),
  meta_title: z.string().min(1),
  meta_description: z.string().min(1),
  og_title: z.string().min(1),
  og_description: z.string().min(1),
});

export const sectionCoreUpdateSchema = z.object({
  id: z.string().min(1),
  sort_order: z.number().int().min(0),
  is_enabled: z.boolean(),
});

export const sectionTranslationUpdateSchema = z.object({
  section_id: z.string().min(1),
  locale: localeSchema,
  content_json: z.record(z.string(), z.unknown()),
});

export const pageBlockSchema = z.object({
  id: z.string().min(1),
  page_slug: z.string().min(1),
  block_type: blockTypeSchema,
  sort_order: z.number().int().min(0),
  is_enabled: z.boolean(),
  config_json: z.record(z.string(), z.unknown()),
});

export const pageBlockTranslationSchema = z.object({
  block_id: z.string().min(1),
  locale: localeSchema,
  content_json: z.record(z.string(), z.unknown()),
});

export const navItemUpdateSchema = z.object({
  id: z.string().min(1),
  href_slug: z.string(),
  icon: z.string().min(1),
  sort_order: z.number().int().min(0),
  is_enabled: z.boolean(),
});

export const navTranslationUpdateSchema = z.object({
  nav_item_id: z.string().min(1),
  locale: localeSchema,
  label: z.string().min(1),
});

export const workProjectSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  project_url: z.string().optional().default(""),
  repo_url: z.string().optional().default(""),
  cover_media_id: z.string().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const workProjectTranslationSchema = z.object({
  project_id: z.string().min(1),
  locale: localeSchema,
  title: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  cta_label: z.string().min(1),
});

export const experienceSchema = z.object({
  id: z.string().min(1),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  company: z.string().min(1),
  location: z.string().min(1),
  start_date: z.string().min(1),
  end_date: z.string().min(1).nullable(),
  current_role: z.boolean(),
  logo_media_id: z.string().nullable(),
});

export const experienceTranslationSchema = z.object({
  experience_id: z.string().min(1),
  locale: localeSchema,
  role_title: z.string().min(1),
  description: z.string().min(1),
  highlights_json: z.array(z.string()).default([]),
});

export const certificationSchema = z.object({
  id: z.string().min(1),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  issuer: z.string().min(1),
  issue_date: z.string().min(1),
  expiry_date: z.string().min(1).nullable(),
  credential_url: z.string(),
  certificate_media_id: z.string().nullable(),
});

export const certificationTranslationSchema = z.object({
  certification_id: z.string().min(1),
  locale: localeSchema,
  name: z.string().min(1),
  description: z.string().min(1),
});

export const serviceOfferingSchema = z.object({
  id: z.string().min(1),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  icon: z.string().min(1),
  color_token: z.string().min(1),
  cover_media_id: z.string().nullable(),
});

export const serviceOfferingTranslationSchema = z.object({
  service_id: z.string().min(1),
  locale: localeSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  bullets_json: z.array(z.string()).default([]),
});

export const contactChannelSchema = z.object({
  id: z.string().min(1),
  channel_type: z.enum(["whatsapp", "email", "linkedin", "telegram", "instagram", "youtube", "custom"]),
  value: z.string().min(1),
  is_primary: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
  icon: z.string().min(1),
  label_default: z.string().min(1),
});

export const contactChannelTranslationSchema = z.object({
  channel_id: z.string().min(1),
  locale: localeSchema,
  label: z.string().min(1),
  description: z.string().min(1),
});

export const mediaAssetSchema = z.object({
  id: z.string().min(1),
  path: z.string().min(1),
  alt_ar: z.string().min(1),
  alt_en: z.string().min(1),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  type: z.string().min(1),
});
