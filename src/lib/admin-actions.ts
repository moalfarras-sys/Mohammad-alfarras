"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminSession, destroyAdminSession } from "@/lib/auth";
import {
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
  updateThemeToken,
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
  upsertVideo,
  upsertWorkProject,
  upsertWorkProjectTranslation,
  uploadMediaToStorage,
} from "@/lib/content/store";
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
  themeTokenUpdateSchema,
  videoSchema,
  workProjectSchema,
  workProjectTranslationSchema,
} from "@/lib/validation";

function revalidateAll() {
  revalidatePath("/[locale]", "layout");
  revalidatePath("/ar");
  revalidatePath("/en");
  revalidatePath("/ar/admin");
  revalidatePath("/en/admin");
  revalidatePath("/ar/blog");
  revalidatePath("/en/blog");
  revalidatePath("/ar/youtube");
  revalidatePath("/en/youtube");
  revalidatePath("/ar/cv");
  revalidatePath("/en/cv");
  revalidatePath("/ar/contact");
  revalidatePath("/en/contact");
}

function parseStringArray(input: string): string[] {
  return input
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function loginAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await createAdminSession(email, password);
  if (!ok) {
    redirect("/ar/admin?error=invalid_credentials");
  }

  redirect("/ar/admin?ok=1");
}

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/ar/admin");
}

export async function updateThemeTokenAction(formData: FormData) {
  const parsed = themeTokenUpdateSchema.safeParse({
    mode: formData.get("mode"),
    tokenKey: formData.get("tokenKey"),
    tokenValue: formData.get("tokenValue"),
  });

  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updateThemeToken(parsed.data.mode, parsed.data.tokenKey, parsed.data.tokenValue);
  revalidateAll();
}

export async function upsertVideoAction(formData: FormData) {
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
  revalidateAll();
}

export async function syncYoutubeAction(formData: FormData) {
  const maxResults = Number(formData.get("max_results") || 12);
  await syncYoutubeLatest({ maxResults });
  revalidateAll();
}

export async function updatePageCoreAction(formData: FormData) {
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
  revalidateAll();
}

export async function publishPageAction(formData: FormData) {
  const status = pageStatusSchema.safeParse(String(formData.get("status") || "draft"));
  if (!status.success) throw new Error("Invalid status");

  const slug = String(formData.get("slug") || "");
  if (!slug) throw new Error("Missing page slug");

  await publishPageBySlug(slug, status.data);
  revalidateAll();
}

export async function updatePageTranslationAction(formData: FormData) {
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
  revalidateAll();
}

export async function updateSectionCoreAction(formData: FormData) {
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
  revalidateAll();
}

export async function updateSectionTranslationAction(formData: FormData) {
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
  revalidateAll();
}

export async function upsertPageBlockAction(formData: FormData) {
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
  revalidateAll();
}

export async function upsertPageBlockTranslationAction(formData: FormData) {
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
  revalidateAll();
}

export async function deletePageBlockAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing block id");
  await deletePageBlock(id);
  revalidateAll();
}

export async function duplicatePageBlockAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing block id");
  await duplicatePageBlock(id);
  revalidateAll();
}

export async function updateNavigationItemAction(formData: FormData) {
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
  revalidateAll();
}

export async function updateNavigationTranslationAction(formData: FormData) {
  const parsed = navTranslationUpdateSchema.safeParse({
    nav_item_id: formData.get("nav_item_id"),
    locale: formData.get("locale"),
    label: formData.get("label"),
  });
  if (!parsed.success) throw new Error(parsed.error.flatten().formErrors.join(", "));

  await updateNavigationTranslation(parsed.data.nav_item_id, parsed.data.locale, parsed.data.label);
  revalidateAll();
}

export async function upsertWorkProjectAction(formData: FormData) {
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

  revalidateAll();
}

export async function deleteWorkProjectAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing project id");
  await deleteWorkProject(id);
  revalidateAll();
}

export async function upsertExperienceAction(formData: FormData) {
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

  revalidateAll();
}

export async function deleteExperienceAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing experience id");
  await deleteExperience(id);
  revalidateAll();
}

export async function upsertCertificationAction(formData: FormData) {
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

  revalidateAll();
}

export async function deleteCertificationAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing certification id");
  await deleteCertification(id);
  revalidateAll();
}

export async function upsertServiceOfferingAction(formData: FormData) {
  const parsed = serviceOfferingSchema.safeParse({
    id: String(formData.get("id") || `srv-${crypto.randomUUID()}`),
    is_active: formData.get("is_active") !== null,
    sort_order: Number(formData.get("sort_order") || 0),
    icon: String(formData.get("icon") || ""),
    color_token: String(formData.get("color_token") || ""),
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

  revalidateAll();
}

export async function deleteServiceOfferingAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing service id");
  await deleteServiceOffering(id);
  revalidateAll();
}

export async function upsertContactChannelAction(formData: FormData) {
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

  revalidateAll();
}

export async function deleteContactChannelAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing channel id");
  await deleteContactChannel(id);
  revalidateAll();
}

export async function uploadMediaAction(formData: FormData) {
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
  revalidateAll();
}

export async function deleteMediaAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing media id");
  await deleteMediaAsset(id);
  revalidateAll();
}

