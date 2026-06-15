import { createHash } from "node:crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/client";

export type WebsiteSetting = {
  key: string;
  value_json: unknown;
};

export type WebsiteMediaAsset = {
  id: string;
  path: string;
  alt_ar: string;
  alt_en: string;
  type: string;
  width: number | null;
  height: number | null;
};

export type WebsitePage = {
  id: string;
  slug: string;
  status: "draft" | "published";
  template: string;
  seo_image_media_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WebsitePageTranslation = {
  page_id: string;
  locale: "ar" | "en";
  title: string;
  meta_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
};

export type WebsiteProject = {
  id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  category?: string | null;
  featured_rank?: number | null;
  project_url: string;
  repo_url: string;
  cover_media_id: string | null;
  created_at?: string;
  updated_at?: string;
};

export type WebsiteProjectTranslation = {
  project_id: string;
  locale: "ar" | "en";
  title: string;
  summary: string;
  description: string;
  cta_label: string;
  tags_json: string[];
  challenge: string;
  solution: string;
  result: string;
};

export type WebsiteProjectMetric = {
  id: string;
  project_id: string;
  sort_order: number;
  value: string;
  label_ar: string;
  label_en: string;
};

export type WebsiteServiceOffering = {
  id: string;
  is_active: boolean;
  sort_order: number;
  icon: string;
  color_token: string;
  cover_media_id: string | null;
};

export type WebsiteServiceTranslation = {
  service_id: string;
  locale: "ar" | "en";
  title: string;
  description: string;
  bullets_json: string[];
};

export type WebsiteContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsapp?: string | null;
  subject: string | null;
  message: string;
  budget: string | null;
  locale: string | null;
  project_types: unknown;
  project_type?: string | null;
  timeline?: string | null;
  source?: string | null;
  status?: "new" | "read" | "replied" | "resolved" | "archived" | null;
  read?: boolean | null;
  replied_at?: string | null;
  archived_at?: string | null;
  created_at: string;
};

export type WebsiteCmsData = {
  settings: WebsiteSetting[];
  pages: WebsitePage[];
  pageTranslations: WebsitePageTranslation[];
  mediaAssets: WebsiteMediaAsset[];
  projects: WebsiteProject[];
  projectTranslations: WebsiteProjectTranslation[];
  projectMetrics: WebsiteProjectMetric[];
  services: WebsiteServiceOffering[];
  serviceTranslations: WebsiteServiceTranslation[];
  messages: WebsiteContactMessage[];
};

const emptyWebsiteCmsData: WebsiteCmsData = {
  settings: [],
  pages: [],
  pageTranslations: [],
  mediaAssets: [],
  projects: [],
  projectTranslations: [],
  projectMetrics: [],
  services: [],
  serviceTranslations: [],
  messages: [],
};

export async function readWebsiteCmsData(): Promise<WebsiteCmsData> {
  try {
    const supabase = createSupabaseAdminClient();
    const [settings, pages, pageTranslations, mediaAssets, projects, projectTranslations, projectMetrics, services, serviceTranslations, messages] = await Promise.all([
      supabase.from("site_settings").select("key,value_json").order("key"),
      supabase.from("pages").select("*").order("slug"),
      supabase.from("page_translations").select("*"),
      supabase.from("media_assets").select("*").order("type").order("id").limit(80),
      supabase.from("work_projects").select("*").order("sort_order"),
      supabase.from("work_project_translations").select("*"),
      supabase.from("work_project_metrics").select("*").order("sort_order"),
      supabase.from("service_offerings").select("*").order("sort_order"),
      supabase.from("service_offering_translations").select("*"),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(80),
    ]);

    if (settings.error) throw settings.error;
    if (pages.error) throw pages.error;
    if (pageTranslations.error) throw pageTranslations.error;
    if (mediaAssets.error) throw mediaAssets.error;
    if (projects.error) throw projects.error;
    if (projectTranslations.error) throw projectTranslations.error;
    if (projectMetrics.error) throw projectMetrics.error;
    if (services.error) throw services.error;
    if (serviceTranslations.error) throw serviceTranslations.error;
    if (messages.error) throw messages.error;

    return {
      settings: (settings.data ?? []) as WebsiteSetting[],
      pages: (pages.data ?? []) as WebsitePage[],
      pageTranslations: (pageTranslations.data ?? []) as WebsitePageTranslation[],
      mediaAssets: (mediaAssets.data ?? []) as WebsiteMediaAsset[],
      projects: (projects.data ?? []) as WebsiteProject[],
      projectTranslations: (projectTranslations.data ?? []) as WebsiteProjectTranslation[],
      projectMetrics: (projectMetrics.data ?? []) as WebsiteProjectMetric[],
      services: (services.data ?? []) as WebsiteServiceOffering[],
      serviceTranslations: (serviceTranslations.data ?? []) as WebsiteServiceTranslation[],
      messages: (messages.data ?? []) as WebsiteContactMessage[],
    };
  } catch {
    return emptyWebsiteCmsData;
  }
}

export async function saveSiteSetting(key: string, value: unknown) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key,
      value_json: value,
    },
    { onConflict: "key" },
  );
  if (error) throw error;
}

function mergeDeep(base: unknown, override: unknown): unknown {
  if (!base || typeof base !== "object" || Array.isArray(base)) return override;
  if (!override || typeof override !== "object" || Array.isArray(override)) return override;
  const next: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(override as Record<string, unknown>)) {
    next[key] = key in next ? mergeDeep(next[key], value) : value;
  }
  return next;
}

export async function mergeSiteSetting(key: string, value: unknown) {
  const supabase = createSupabaseAdminClient();
  const current = await supabase.from("site_settings").select("value_json").eq("key", key).maybeSingle();
  if (current.error) throw current.error;
  await saveSiteSetting(key, mergeDeep(current.data?.value_json ?? {}, value));
}

export async function saveWebsitePage(params: {
  page: WebsitePage;
  translations: WebsitePageTranslation[];
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("pages").upsert(
    {
      ...params.page,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;

  const translationWrite = await supabase.from("page_translations").upsert(
    params.translations.map((translation) => ({ ...translation, page_id: params.page.id })),
    { onConflict: "page_id,locale" },
  );
  if (translationWrite.error) throw translationWrite.error;
}

export async function saveWebsiteProject(input: WebsiteProject) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("work_projects").upsert(
    {
      ...input,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function saveWebsiteProjectDetails(params: {
  project: WebsiteProject;
  translations: WebsiteProjectTranslation[];
  metrics: Omit<WebsiteProjectMetric, "id" | "project_id" | "sort_order">[];
}) {
  const supabase = createSupabaseAdminClient();
  await saveWebsiteProject(params.project);

  const translations = params.translations.map((translation) => ({
    ...translation,
    project_id: params.project.id,
  }));
  const translationWrite = await supabase.from("work_project_translations").upsert(translations, { onConflict: "project_id,locale" });
  if (translationWrite.error) throw translationWrite.error;

  const deleteMetrics = await supabase.from("work_project_metrics").delete().eq("project_id", params.project.id);
  if (deleteMetrics.error) throw deleteMetrics.error;
  const metrics = params.metrics
    .filter((metric) => metric.value.trim() && (metric.label_ar.trim() || metric.label_en.trim()))
    .map((metric, index) => ({
      id: `${params.project.id}-metric-${index + 1}`,
      project_id: params.project.id,
      sort_order: index + 1,
      value: metric.value.trim(),
      label_ar: metric.label_ar.trim() || metric.label_en.trim(),
      label_en: metric.label_en.trim() || metric.label_ar.trim(),
    }));
  if (metrics.length) {
    const metricWrite = await supabase.from("work_project_metrics").insert(metrics);
    if (metricWrite.error) throw metricWrite.error;
  }
}

export async function saveWebsiteService(params: {
  service: WebsiteServiceOffering;
  translations: WebsiteServiceTranslation[];
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("service_offerings").upsert(params.service, { onConflict: "id" });
  if (error) throw error;

  const translationWrite = await supabase.from("service_offering_translations").upsert(
    params.translations.map((translation) => ({ ...translation, service_id: params.service.id })),
    { onConflict: "service_id,locale" },
  );
  if (translationWrite.error) throw translationWrite.error;
}

export async function deleteWebsiteService(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("service_offerings").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteWebsiteProject(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("work_projects").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteWebsiteMedia(id: string) {
  const supabase = createSupabaseAdminClient();
  const existing = await supabase.from("media_assets").select("id,path").eq("id", id).maybeSingle();
  if (existing.error) throw existing.error;
  if (!existing.data) return;

  const usage = await findWebsiteMediaUsage(id, existing.data.path ?? "");
  if (usage.length) {
    throw new Error(`MEDIA_IN_USE:${usage.slice(0, 6).join(", ")}`);
  }

  const storagePath = extractSiteMediaStoragePath(existing.data?.path);
  if (storagePath) {
    await supabase.storage.from("site-media").remove([storagePath]);
  }

  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) throw error;
}

async function findWebsiteMediaUsage(id: string, mediaPath: string) {
  const supabase = createSupabaseAdminClient();
  const needles = [id, mediaPath].filter(Boolean);
  const usage = new Set<string>();

  const [services, projects, settings, pages, pageTranslations, appProducts, appScreenshots, appReleases] = await Promise.all([
    supabase.from("service_offerings").select("id,cover_media_id").eq("cover_media_id", id),
    supabase.from("work_projects").select("id,cover_media_id").eq("cover_media_id", id),
    supabase.from("site_settings").select("key,value_json").limit(500),
    supabase.from("pages").select("*").limit(500),
    supabase.from("page_translations").select("*").limit(500),
    supabase.from("app_products").select("*").limit(500),
    supabase.from("app_screenshots").select("*").limit(500),
    supabase.from("app_releases").select("*").limit(500),
  ]);

  for (const row of services.data ?? []) usage.add(`service:${row.id}`);
  for (const row of projects.data ?? []) usage.add(`project:${row.id}`);

  const scanRows = [
    ["setting", settings.data ?? [], "key"],
    ["page", pages.data ?? [], "id"],
    ["page_translation", pageTranslations.data ?? [], "page_id"],
    ["app_product", appProducts.data ?? [], "slug"],
    ["app_screenshot", appScreenshots.data ?? [], "id"],
    ["app_release", appReleases.data ?? [], "id"],
  ] as const;

  for (const [label, rows, key] of scanRows) {
    for (const row of rows) {
      const text = JSON.stringify(row);
      if (needles.some((needle) => text.includes(needle))) {
        const record = row as Record<string, unknown>;
        usage.add(`${label}:${String(record[key] ?? "row")}`);
      }
    }
  }

  return [...usage];
}

export async function deleteWebsiteMessage(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) throw error;
}

export async function updateWebsiteMessageStatus(id: string, status: NonNullable<WebsiteContactMessage["status"]>) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("contact_messages")
    .update({
      status,
      read: status !== "new",
      replied_at: status === "replied" || status === "resolved" ? now : null,
      archived_at: status === "archived" ? now : null,
    })
    .eq("id", id);
  if (error) throw error;
}

function extractSiteMediaStoragePath(path?: string | null) {
  if (!path) return "";
  try {
    const url = new URL(path);
    const marker = "/storage/v1/object/public/site-media/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) return "";
    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return "";
  }
}

async function ensureBucket(bucket: string, isPublic: boolean) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.createBucket(bucket, { public: isPublic }).catch(() => null);
}

export async function uploadWebsiteMedia(params: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  altAr: string;
  altEn: string;
  kind: string;
}) {
  const bucket = "site-media";
  await ensureBucket(bucket, true);
  const supabase = createSupabaseAdminClient();
  const checksum = createHash("sha256").update(Buffer.from(params.bytes)).digest("hex").slice(0, 14);
  const cleanName = params.filename.replace(/[^a-zA-Z0-9_.-]+/g, "-").replace(/^-+|-+$/g, "");
  const storagePath = `${params.kind}/${Date.now()}-${checksum}-${cleanName}`;
  const blob = new Blob([Buffer.from(params.bytes)], { type: params.contentType || "application/octet-stream" });

  const upload = await supabase.storage.from(bucket).upload(storagePath, blob, {
    cacheControl: "31536000",
    contentType: params.contentType || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) throw new Error(upload.error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  const id = `media-${checksum}`;
  const asset = {
    id,
    path: data.publicUrl,
    alt_ar: params.altAr || params.altEn || cleanName,
    alt_en: params.altEn || params.altAr || cleanName,
    type: params.contentType || "image/png",
    width: 0,
    height: 0,
  };

  const { error } = await supabase.from("media_assets").upsert(asset, { onConflict: "id" });
  if (error) throw error;
  return asset;
}
