"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createAdminSession,
  destroyAdminSession,
  getAdminSessionEmail,
  requireAdmin,
} from "@/lib/auth";
import {
  appendAuditLog,
  deleteCertification,
  deleteContactChannel,
  deleteExperience,
  deleteMediaAsset,
  deletePageBlock,
  deleteServiceOffering,
  deleteWorkProject,
  duplicatePageBlock,
  publishPageBySlug,
  updateNavigationItem,
  updateNavigationTranslation,
  updatePageCore,
  updatePageTranslation,
  updateSectionCore,
  updateSectionTranslation,
  syncYoutubeLatest,
  upsertCertification,
  upsertCertificationTranslation,
  upsertContactChannel,
  upsertContactChannelTranslation,
  upsertExperience,
  upsertExperienceTranslation,
  upsertMediaAsset,
  upsertPageBlock,
  upsertPageBlockTranslation,
  upsertServiceOffering,
  upsertServiceOfferingTranslation,
  upsertSiteSetting,
  upsertVideo,
  upsertWorkProject,
  upsertWorkProjectTranslation,
  uploadMediaToStorage,
  readSnapshot,
  replaceWorkProjectMedia,
  replaceWorkProjectMetrics,
} from "@/lib/content/store";
import { getPdfRegistry, type PdfRegistryDocument } from "@/lib/cms-documents";
import { getProjectsStudioData, type ProjectStudioItem } from "@/lib/projects-studio";
import {
  certificationSchema,
  certificationTranslationSchema,
  contactChannelSchema,
  contactChannelTranslationSchema,
  experienceSchema,
  experienceTranslationSchema,
  mediaAssetSchema,
  navItemUpdateSchema,
  navTranslationUpdateSchema,
  pageBlockSchema,
  pageBlockTranslationSchema,
  pageCoreUpdateSchema,
  pageStatusSchema,
  pageTranslationUpdateSchema,
  sectionCoreUpdateSchema,
  sectionTranslationUpdateSchema,
  serviceOfferingSchema,
  serviceOfferingTranslationSchema,
  videoSchema,
  workProjectMediaSchema,
  workProjectMetricSchema,
  workProjectSchema,
  workProjectTranslationSchema,
} from "@/lib/validation";

function revalidateAll() {
  revalidatePath("/[locale]", "layout");
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/admin");
  revalidatePath("/en/admin");
  revalidatePath("/ar/admin/projects");
  revalidatePath("/en/admin/projects");
  revalidatePath("/ar/admin/pages");
  revalidatePath("/en/admin/pages");
  revalidatePath("/ar/admin/cv");
  revalidatePath("/en/admin/cv");
  revalidatePath("/ar/admin/media");
  revalidatePath("/en/admin/media");
  revalidatePath("/ar/admin/pdfs");
  revalidatePath("/en/admin/pdfs");
  revalidatePath("/ar/admin/settings");
  revalidatePath("/en/admin/settings");
  revalidatePath("/ar/admin/advanced");
  revalidatePath("/en/admin/advanced");
  revalidatePath("/ar/blog");
  revalidatePath("/en/blog");
  revalidatePath("/ar/projects");
  revalidatePath("/en/projects");
  revalidatePath("/ar/youtube");
  revalidatePath("/en/youtube");
  revalidatePath("/ar/cv");
  revalidatePath("/en/cv");
  revalidatePath("/ar/contact");
  revalidatePath("/en/contact");
}

/** Keys the Control Center may persist via `updateSiteSettingAction` (typed CMS + CV builder). */
export const ALLOWED_SITE_SETTING_KEYS = new Set([
  "brand_assets",
  "admin_profile",
  "home_content",
  "projects_page_content",
  "youtube_page_content",
  "cv_page_content",
  "contact_page_content",
  "pdf_registry",
  "site_seo",
  "cv_builder",
]);

function parseStringArray(input: string): string[] {
  return input
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function ensureAdmin() {
  await requireAdmin();
}

async function audit(action: string, entity: string, entityId: string, payload: Record<string, unknown>) {
  await appendAuditLog({
    id: `audit-${crypto.randomUUID()}`,
    admin_user_id: (await getAdminSessionEmail()) ?? "admin",
    action,
    entity,
    entity_id: entityId,
    payload,
    created_at: new Date().toISOString(),
  });
}

function parseList(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonField<T>(formData: FormData, key: string): T {
  const raw = String(formData.get(key) || "");
  if (!raw) {
    throw new Error(`Missing ${key}`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`Invalid JSON for ${key}`);
  }
}

function upsertStudioItem(items: ProjectStudioItem[], nextItem: ProjectStudioItem) {
  const remaining = items.filter((item) => item.project_id !== nextItem.project_id);
  return [...remaining, nextItem].sort((a, b) => a.featured_rank - b.featured_rank || a.project_id.localeCompare(b.project_id));
}

export async function loginAdminAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await createAdminSession(email, password);
  if (!ok) {
    redirect(`/${locale}/admin?error=invalid_credentials`);
  }

  redirect(`/${locale}/admin?ok=1`);
}

export async function logoutAdminAction(formData: FormData) {
  await destroyAdminSession();
  const locale = String(formData.get("locale") ?? "ar") === "en" ? "en" : "ar";
  redirect(`/${locale}/admin`);
}

export async function updateAdminCredentialsAction(formData: FormData) {
  void formData;
  throw new Error("Admin credentials are managed through runtime environment variables.");
}

export async function updateSiteSettingAction(formData: FormData) {
  await ensureAdmin();
  const key = String(formData.get("key") || "").trim();
  if (!key) throw new Error("Missing setting key");
  if (!ALLOWED_SITE_SETTING_KEYS.has(key)) {
    throw new Error(`Unknown or disallowed site setting key: ${key}`);
  }

  let parsedJson: Record<string, unknown> = {};
  const prefixedEntries = Array.from(formData.entries()).filter(([entryKey]) => entryKey.startsWith("value_json_"));

  if (prefixedEntries.length > 0) {
    parsedJson = Object.fromEntries(
      prefixedEntries.map(([entryKey, value]) => [entryKey.replace("value_json_", ""), String(value || "").trim()]),
    );
  } else {
    const raw = String(formData.get("value_json") || "{}");
    try {
      parsedJson = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid setting JSON");
    }
  }

  await upsertSiteSetting(key, parsedJson);
  await audit("upsert", "site_setting", key, parsedJson);
  revalidateAll();
}

export async function upsertVideoAction(formData: FormData) {
  await ensureAdmin();
  const payload = {
    id: String(formData.get("id") || crypto.randomUUID()),
    youtube_id: String(formData.get("youtube_id") || ""),
    title_ar: String(formData.get("title_ar") || ""),
    title_en: String(formData.get("title_en") || ""),
    description_ar: String(formData.get("description_ar") || ""),
    description_en: String(formData.get("description_en") || ""),
    thumbnail: String(formData.get("thumbnail") || ""),
    duration: String(formData.get("duration") || "00:00"),
    views: Number(formData.get("views") || 0),
    published_at: new Date(String(formData.get("published_at") || new Date().toISOString())).toISOString(),
    sort_order: Number(formData.get("sort_order") || 1),
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") !== null,
  };

  const parsed = videoSchema.safeParse(payload);
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertVideo(parsed.data);
  await audit("upsert", "youtube_video", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function syncYoutubeAction(formData: FormData) {
  await ensureAdmin();
  const maxResults = Number(formData.get("max_results") || 12);
  await syncYoutubeLatest({ maxResults });
  await audit("sync", "youtube_video", "latest", { maxResults });
  revalidateAll();
}

export async function updatePageCoreAction(formData: FormData) {
  await ensureAdmin();
  const parsed = pageCoreUpdateSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    template: formData.get("template"),
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updatePageCore(parsed.data.id, {
    status: parsed.data.status,
    template: parsed.data.template,
  });
  await audit("update", "page_core", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function publishPageAction(formData: FormData) {
  await ensureAdmin();
  const status = pageStatusSchema.safeParse(String(formData.get("status") || "draft"));
  if (!status.success) throw new Error("Invalid status");

  const slug = String(formData.get("slug") || "");
  if (!slug) throw new Error("Missing page slug");

  await publishPageBySlug(slug, status.data);
  await audit("publish", "page", slug, { status: status.data });
  revalidateAll();
}

export async function updatePageTranslationAction(formData: FormData) {
  await ensureAdmin();
  const parsed = pageTranslationUpdateSchema.safeParse({
    page_id: formData.get("page_id"),
    locale: formData.get("locale"),
    title: formData.get("title"),
    meta_title: formData.get("meta_title"),
    meta_description: formData.get("meta_description"),
    og_title: formData.get("og_title"),
    og_description: formData.get("og_description"),
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updatePageTranslation(parsed.data.page_id, parsed.data.locale, {
    title: parsed.data.title,
    meta_title: parsed.data.meta_title,
    meta_description: parsed.data.meta_description,
    og_title: parsed.data.og_title,
    og_description: parsed.data.og_description,
  });
  await audit("update", "page_translation", parsed.data.page_id, parsed.data);
  revalidateAll();
}

export async function updateSectionCoreAction(formData: FormData) {
  await ensureAdmin();
  const parsed = sectionCoreUpdateSchema.safeParse({
    id: formData.get("id"),
    sort_order: Number(formData.get("sort_order") || 0),
    is_enabled: formData.get("is_enabled") !== null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updateSectionCore(parsed.data.id, {
    sort_order: parsed.data.sort_order,
    is_enabled: parsed.data.is_enabled,
  });
  await audit("update", "section_core", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function updateSectionTranslationAction(formData: FormData) {
  await ensureAdmin();
  const contentRaw = String(formData.get("content_json") || "{}");
  let parsedJson: Record<string, unknown> = {};
  try {
    parsedJson = JSON.parse(contentRaw) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON content");
  }

  const parsed = sectionTranslationUpdateSchema.safeParse({
    section_id: formData.get("section_id"),
    locale: formData.get("locale"),
    content_json: parsedJson,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updateSectionTranslation(parsed.data.section_id, parsed.data.locale, parsed.data.content_json);
  await audit("update", "section_translation", parsed.data.section_id, {
    locale: parsed.data.locale,
    content_json: parsed.data.content_json,
  });
  revalidateAll();
}

export async function upsertPageBlockAction(formData: FormData) {
  await ensureAdmin();
  const configRaw = String(formData.get("config_json") || "{}");
  let configJson: Record<string, unknown> = {};
  try {
    configJson = JSON.parse(configRaw) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid block config JSON");
  }

  const parsed = pageBlockSchema.safeParse({
    id: String(formData.get("id") || `blk-${crypto.randomUUID()}`),
    page_slug: formData.get("page_slug"),
    block_type: formData.get("block_type"),
    sort_order: Number(formData.get("sort_order") || 0),
    is_enabled: formData.get("is_enabled") !== null,
    config_json: configJson,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertPageBlock(parsed.data);
  await audit("upsert", "page_block", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function upsertPageBlockTranslationAction(formData: FormData) {
  await ensureAdmin();
  const contentRaw = String(formData.get("content_json") || "{}");
  let parsedJson: Record<string, unknown> = {};
  try {
    parsedJson = JSON.parse(contentRaw) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid block content JSON");
  }

  const parsed = pageBlockTranslationSchema.safeParse({
    block_id: formData.get("block_id"),
    locale: formData.get("locale"),
    content_json: parsedJson,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertPageBlockTranslation(parsed.data);
  await audit("upsert", "page_block_translation", parsed.data.block_id, parsed.data);
  revalidateAll();
}

export async function deletePageBlockAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing block id");
  await deletePageBlock(id);
  await audit("delete", "page_block", id, {});
  revalidateAll();
}

export async function duplicatePageBlockAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing block id");
  await duplicatePageBlock(id);
  await audit("duplicate", "page_block", id, {});
  revalidateAll();
}

export async function updateNavigationItemAction(formData: FormData) {
  await ensureAdmin();
  const parsed = navItemUpdateSchema.safeParse({
    id: formData.get("id"),
    href_slug: formData.get("href_slug"),
    icon: formData.get("icon"),
    sort_order: Number(formData.get("sort_order") || 0),
    is_enabled: formData.get("is_enabled") !== null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updateNavigationItem(parsed.data.id, {
    href_slug: parsed.data.href_slug,
    icon: parsed.data.icon,
    sort_order: parsed.data.sort_order,
    is_enabled: parsed.data.is_enabled,
  });
  await audit("update", "navigation_item", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function updateNavigationTranslationAction(formData: FormData) {
  await ensureAdmin();
  const parsed = navTranslationUpdateSchema.safeParse({
    nav_item_id: formData.get("nav_item_id"),
    locale: formData.get("locale"),
    label: formData.get("label"),
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updateNavigationTranslation(parsed.data.nav_item_id, parsed.data.locale, parsed.data.label);
  await audit("update", "navigation_translation", parsed.data.nav_item_id, parsed.data);
  revalidateAll();
}

export async function upsertWorkProjectAction(formData: FormData) {
  await ensureAdmin();
  const now = new Date().toISOString();
  const parsed = workProjectSchema.safeParse({
    id: String(formData.get("id") || `wp-${crypto.randomUUID()}`),
    slug: String(formData.get("slug") || ""),
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    project_url: String(formData.get("project_url") || ""),
    repo_url: String(formData.get("repo_url") || ""),
    cover_media_id: (formData.get("cover_media_id") ? String(formData.get("cover_media_id")) : null),
    created_at: String(formData.get("created_at") || now),
    updated_at: now,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertWorkProject(parsed.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = workProjectTranslationSchema.safeParse({
      project_id: parsed.data.id,
      locale,
      title: String(formData.get(`title_${locale}`) || ""),
      summary: String(formData.get(`summary_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || ""),
      cta_label: String(formData.get(`cta_label_${locale}`) || ""),
    });
    if (!translation.success) throw new Error(translation.error.flatten().formErrors.join(", "));
    await upsertWorkProjectTranslation(translation.data);
  }

  await audit("upsert", "work_project", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function upsertProjectStudioAction(formData: FormData) {
  await ensureAdmin();

  const now = new Date().toISOString();
  const parsed = workProjectSchema.safeParse({
    id: String(formData.get("id") || `wp-${crypto.randomUUID()}`),
    slug: String(formData.get("slug") || ""),
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    project_url: String(formData.get("project_url") || ""),
    repo_url: String(formData.get("repo_url") || ""),
    cover_media_id: formData.get("cover_media_id") ? String(formData.get("cover_media_id")) : null,
    created_at: String(formData.get("created_at") || now),
    updated_at: now,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertWorkProject(parsed.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = workProjectTranslationSchema.safeParse({
      project_id: parsed.data.id,
      locale,
      title: String(formData.get(`title_${locale}`) || ""),
      summary: String(formData.get(`summary_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || ""),
      cta_label: String(formData.get(`cta_label_${locale}`) || ""),
    });
    if (!translation.success) throw new Error(translation.error.flatten().formErrors.join(", "));
    await upsertWorkProjectTranslation(translation.data);
  }

  const snapshot = await readSnapshot();
  const current = getProjectsStudioData(snapshot);
  const nextItem: ProjectStudioItem = {
    project_id: parsed.data.id,
    is_featured: formData.get("studio_is_featured") !== null,
    featured_rank: Number(formData.get("studio_featured_rank") || 99),
    accent: ["green", "orange", "cyan", "purple"].includes(String(formData.get("studio_accent") || "green"))
      ? (String(formData.get("studio_accent")) as ProjectStudioItem["accent"])
      : "green",
    highlight_style: ["operations", "trust", "app", "editorial"].includes(String(formData.get("studio_highlight_style") || "editorial"))
      ? (String(formData.get("studio_highlight_style")) as ProjectStudioItem["highlight_style"])
      : "editorial",
    device_frame: ["browser", "phone", "floating"].includes(String(formData.get("studio_device_frame") || "browser"))
      ? (String(formData.get("studio_device_frame")) as ProjectStudioItem["device_frame"])
      : "browser",
    eyebrow_ar: String(formData.get("studio_eyebrow_ar") || ""),
    eyebrow_en: String(formData.get("studio_eyebrow_en") || ""),
    challenge_ar: String(formData.get("studio_challenge_ar") || ""),
    challenge_en: String(formData.get("studio_challenge_en") || ""),
    solution_ar: String(formData.get("studio_solution_ar") || ""),
    solution_en: String(formData.get("studio_solution_en") || ""),
    result_ar: String(formData.get("studio_result_ar") || ""),
    result_en: String(formData.get("studio_result_en") || ""),
    tags_ar: parseList(formData.get("studio_tags_ar")),
    tags_en: parseList(formData.get("studio_tags_en")),
    gallery_media_ids: [
      String(formData.get("gallery_media_id_1") || "").trim(),
      String(formData.get("gallery_media_id_2") || "").trim(),
      String(formData.get("gallery_media_id_3") || "").trim(),
    ].filter(Boolean),
    metrics: [0, 1, 2]
      .map((index) => ({
        value: String(formData.get(`metric_value_${index + 1}`) || "").trim(),
        label_ar: String(formData.get(`metric_label_ar_${index + 1}`) || "").trim(),
        label_en: String(formData.get(`metric_label_en_${index + 1}`) || "").trim(),
      }))
      .filter((metric) => metric.value || metric.label_ar || metric.label_en),
  };

  await upsertSiteSetting("projects_studio", {
    version: 1,
    items: upsertStudioItem(current.items, nextItem),
  });

  await audit("upsert", "project_studio", parsed.data.id, nextItem);
  revalidateAll();
}

export async function deleteWorkProjectAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing project id");
  await deleteWorkProject(id);
  const snapshot = await readSnapshot();
  const current = getProjectsStudioData(snapshot);
  await upsertSiteSetting("projects_studio", {
    version: 1,
    items: current.items.filter((item) => item.project_id !== id),
  });
  await audit("delete", "work_project", id, {});
  revalidateAll();
}

export async function upsertExperienceAction(formData: FormData) {
  await ensureAdmin();
  const parsed = experienceSchema.safeParse({
    id: String(formData.get("id") || `ex-${crypto.randomUUID()}`),
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    company: String(formData.get("company") || ""),
    location: String(formData.get("location") || ""),
    start_date: String(formData.get("start_date") || ""),
    end_date: formData.get("end_date") ? String(formData.get("end_date")) : null,
    current_role: formData.get("current_role") !== null,
    logo_media_id: formData.get("logo_media_id") ? String(formData.get("logo_media_id")) : null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertExperience(parsed.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = experienceTranslationSchema.safeParse({
      experience_id: parsed.data.id,
      locale,
      role_title: String(formData.get(`role_title_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || ""),
      highlights_json: parseStringArray(String(formData.get(`highlights_${locale}`) || "")),
    });
    if (!translation.success) throw new Error(translation.error.flatten().formErrors.join(", "));
    await upsertExperienceTranslation(translation.data);
  }

  await audit("upsert", "experience", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function deleteExperienceAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing experience id");
  await deleteExperience(id);
  await audit("delete", "experience", id, {});
  revalidateAll();
}

export async function upsertCertificationAction(formData: FormData) {
  await ensureAdmin();
  const parsed = certificationSchema.safeParse({
    id: String(formData.get("id") || `cert-${crypto.randomUUID()}`),
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    issuer: String(formData.get("issuer") || ""),
    issue_date: String(formData.get("issue_date") || ""),
    expiry_date: formData.get("expiry_date") ? String(formData.get("expiry_date")) : null,
    credential_url: String(formData.get("credential_url") || ""),
    certificate_media_id: formData.get("certificate_media_id") ? String(formData.get("certificate_media_id")) : null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertCertification(parsed.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = certificationTranslationSchema.safeParse({
      certification_id: parsed.data.id,
      locale,
      name: String(formData.get(`name_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || ""),
    });
    if (!translation.success) throw new Error(translation.error.flatten().formErrors.join(", "));
    await upsertCertificationTranslation(translation.data);
  }

  await audit("upsert", "certification", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function deleteCertificationAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing certification id");
  await deleteCertification(id);
  await audit("delete", "certification", id, {});
  revalidateAll();
}

export async function upsertServiceOfferingAction(formData: FormData) {
  await ensureAdmin();
  const parsed = serviceOfferingSchema.safeParse({
    id: String(formData.get("id") || `srv-${crypto.randomUUID()}`),
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    icon: String(formData.get("icon") || ""),
    color_token: "accent",
    cover_media_id: formData.get("cover_media_id") ? String(formData.get("cover_media_id")) : null,
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertServiceOffering(parsed.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = serviceOfferingTranslationSchema.safeParse({
      service_id: parsed.data.id,
      locale,
      title: String(formData.get(`title_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || ""),
      bullets_json: parseStringArray(String(formData.get(`bullets_${locale}`) || "")),
    });
    if (!translation.success) throw new Error(translation.error.flatten().formErrors.join(", "));
    await upsertServiceOfferingTranslation(translation.data);
  }

  await audit("upsert", "service_offering", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function deleteServiceOfferingAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing service id");
  await deleteServiceOffering(id);
  await audit("delete", "service_offering", id, {});
  revalidateAll();
}

export async function upsertContactChannelAction(formData: FormData) {
  await ensureAdmin();
  const parsed = contactChannelSchema.safeParse({
    id: String(formData.get("id") || `ch-${crypto.randomUUID()}`),
    channel_type: String(formData.get("channel_type") || "custom"),
    value: String(formData.get("value") || ""),
    is_primary: formData.get("is_primary") !== null,
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    icon: String(formData.get("icon") || "link"),
    label_default: String(formData.get("label_default") || ""),
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await upsertContactChannel(parsed.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = contactChannelTranslationSchema.safeParse({
      channel_id: parsed.data.id,
      locale,
      label: String(formData.get(`label_${locale}`) || ""),
      description: String(formData.get(`description_${locale}`) || ""),
    });
    if (!translation.success) throw new Error(translation.error.flatten().formErrors.join(", "));
    await upsertContactChannelTranslation(translation.data);
  }

  await audit("upsert", "contact_channel", parsed.data.id, parsed.data);
  revalidateAll();
}

export async function deleteContactChannelAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing channel id");
  await deleteContactChannel(id);
  await audit("delete", "contact_channel", id, {});
  revalidateAll();
}

async function runUploadMedia(formData: FormData): Promise<{ id: string }> {
  await ensureAdmin();
  const file = formData.get("file");
  const fallbackPath = String(formData.get("path") || "");
  let path = fallbackPath;
  let type = String(formData.get("type") || "image");

  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await uploadMediaToStorage({
      filename: file.name || "media.bin",
      contentType: file.type || "application/octet-stream",
      bytes,
    });
    path = uploaded.publicUrl;
    type = file.type || type;
  }

  const parsed = mediaAssetSchema.safeParse({
    id: String(formData.get("id") || `media-${crypto.randomUUID()}`),
    path,
    alt_ar: String(formData.get("alt_ar") || ""),
    alt_en: String(formData.get("alt_en") || ""),
    width: Number(formData.get("width") || 0),
    height: Number(formData.get("height") || 0),
    type,
  });

  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));
  await upsertMediaAsset(parsed.data);
  await audit("upsert", "media_asset", parsed.data.id, parsed.data);
  revalidateAll();
  return { id: parsed.data.id };
}

export async function uploadMediaAction(formData: FormData): Promise<void> {
  await runUploadMedia(formData);
}

export async function uploadMediaWithResult(formData: FormData): Promise<{ id: string }> {
  return runUploadMedia(formData);
}

export async function deleteMediaAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing media id");
  await deleteMediaAsset(id);
  await audit("delete", "media_asset", id, {});
  revalidateAll();
}

export async function uploadCvPdfAction(formData: FormData): Promise<{ url: string }> {
  await ensureAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("No file provided");
  if (file.type !== "application/pdf") throw new Error("File must be a PDF");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploaded = await uploadMediaToStorage({
    filename: `cv-${Date.now()}.pdf`,
    contentType: "application/pdf",
    bytes,
  });

  await upsertSiteSetting("cv_pdf_url", { url: uploaded.publicUrl, uploadedAt: new Date().toISOString(), filename: file.name });
  await audit("upload", "pdf", "cv_pdf_url", { url: uploaded.publicUrl, filename: file.name });
  revalidateAll();
  return { url: uploaded.publicUrl };
}

type StructuredProjectPayload = {
  id?: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  category?: string | null;
  featured_rank?: number | null;
  project_url?: string;
  repo_url?: string;
  cover_media_id?: string | null;
  translations: Record<
    "ar" | "en",
    {
      title: string;
      summary: string;
      description: string;
      cta_label: string;
      tags_json?: string[];
      challenge?: string;
      solution?: string;
      result?: string;
    }
  >;
  gallery_media_ids?: string[];
  metrics?: Array<{ value: string; label_ar: string; label_en: string }>;
};

export async function saveProjectControlAction(formData: FormData) {
  await ensureAdmin();
  const payload = parseJsonField<StructuredProjectPayload>(formData, "payload_json");
  const now = new Date().toISOString();
  const projectId = payload.id || `wp-${crypto.randomUUID()}`;

  const project = workProjectSchema.safeParse({
    id: projectId,
    slug: payload.slug,
    is_active: payload.is_active,
    sort_order: payload.sort_order,
    category: payload.category ?? "general",
    featured_rank: payload.featured_rank ?? null,
    project_url: payload.project_url ?? "",
    repo_url: payload.repo_url ?? "",
    cover_media_id: payload.cover_media_id ?? null,
    created_at: String(formData.get("created_at") || now),
    updated_at: now,
  });
  if (!project.success) {
    throw new Error(project.error.flatten().formErrors.join(", "));
  }

  await upsertWorkProject(project.data);

  for (const locale of ["ar", "en"] as const) {
    const translation = workProjectTranslationSchema.safeParse({
      project_id: projectId,
      locale,
      title: payload.translations[locale]?.title ?? "",
      summary: payload.translations[locale]?.summary ?? "",
      description: payload.translations[locale]?.description ?? "",
      cta_label: payload.translations[locale]?.cta_label ?? "",
      tags_json: payload.translations[locale]?.tags_json ?? [],
      challenge: payload.translations[locale]?.challenge ?? "",
      solution: payload.translations[locale]?.solution ?? "",
      result: payload.translations[locale]?.result ?? "",
    });
    if (!translation.success) {
      throw new Error(translation.error.flatten().formErrors.join(", "));
    }
    await upsertWorkProjectTranslation(translation.data);
  }

  const galleryItems = (payload.gallery_media_ids ?? [])
    .filter(Boolean)
    .map((mediaId, index) =>
      workProjectMediaSchema.parse({
        id: `wpm-${projectId}-${index + 1}`,
        project_id: projectId,
        media_id: mediaId,
        role: "gallery",
        sort_order: index + 1,
      }),
    );
  const mediaItems = payload.cover_media_id
    ? [
        workProjectMediaSchema.parse({
          id: `wpm-${projectId}-cover`,
          project_id: projectId,
          media_id: payload.cover_media_id,
          role: "cover",
          sort_order: 0,
        }),
        ...galleryItems,
      ]
    : galleryItems;

  const metricItems = (payload.metrics ?? []).map((metric, index) =>
    workProjectMetricSchema.parse({
      id: `wpmetric-${projectId}-${index + 1}`,
      project_id: projectId,
      sort_order: index + 1,
      value: metric.value,
      label_ar: metric.label_ar,
      label_en: metric.label_en,
    }),
  );

  await replaceWorkProjectMedia(projectId, mediaItems);
  await replaceWorkProjectMetrics(projectId, metricItems);
  await audit("save", "work_project_control", projectId, payload as Record<string, unknown>);
  revalidateAll();
}

export async function deleteProjectControlAction(formData: FormData) {
  await ensureAdmin();
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing project id");
  await deleteWorkProject(id);
  await audit("delete", "work_project_control", id, {});
  revalidateAll();
}

type PdfUploadSlot = "branded" | "ats";

export async function uploadPdfSlotAction(formData: FormData): Promise<PdfRegistryDocument> {
  await ensureAdmin();
  const slot = String(formData.get("slot") || "branded") as PdfUploadSlot;
  if (slot !== "branded" && slot !== "ats") {
    throw new Error("Invalid PDF slot");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("No file provided");
  if (file.type !== "application/pdf") throw new Error("File must be a PDF");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const uploaded = await uploadMediaToStorage({
    bucket: "documents",
    filename: `cv-${slot}-${Date.now()}.pdf`,
    contentType: "application/pdf",
    bytes,
  });

  const snapshot = await readSnapshot();
  const registry = getPdfRegistry(snapshot);
  registry.uploads[slot] = {
    url: uploaded.publicUrl,
    filename: file.name,
    uploadedAt: new Date().toISOString(),
  };
  registry.active[slot] = "uploaded";
  await upsertSiteSetting("pdf_registry", registry as unknown as Record<string, unknown>);
  await audit("upload", "pdf_registry", slot, registry as unknown as Record<string, unknown>);
  revalidateAll();
  return registry;
}

export async function savePdfRegistryAction(formData: FormData) {
  await ensureAdmin();
  const payload = parseJsonField<PdfRegistryDocument>(formData, "payload_json");
  await upsertSiteSetting("pdf_registry", payload as unknown as Record<string, unknown>);
  await audit("save", "pdf_registry", "pdf_registry", payload as unknown as Record<string, unknown>);
  revalidateAll();
}
