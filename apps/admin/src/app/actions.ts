"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminRole, signInAdmin, signOutAdmin } from "@/lib/admin-auth";
import { resolveManagedAppSlug, type ManagedAppSlug } from "@moalfarras/shared/app-products";
import { createSupabaseAdminClient } from "@/lib/supabase/client";
import {
  cleanupStaleActivationRequests,
  deleteAppFaq,
  deleteAppRelease,
  deleteAppScreenshot,
  deleteActivationRequest,
  saveAppFaq,
  saveAppProduct,
  saveAppRelease,
  saveRuntimeConfig,
  saveAppScreenshot,
  updateActivationRequestStatus,
  updateDeviceStatus,
  updateProviderSourceStatus,
  updateSupportRequestStatus,
  upsertDeviceLicense,
  uploadAppScreenshot,
  uploadReleaseAsset,
} from "@/lib/app-ecosystem";
import { sendMail } from "@/lib/mailer";
import {
  deleteWebsiteMedia,
  deleteWebsiteMessage,
  deleteWebsiteProject,
  deleteWebsiteService,
  mergeSiteSetting,
  saveWebsitePage,
  saveWebsiteProjectDetails,
  saveWebsiteService,
  updateWebsiteMessageStatus,
  uploadWebsiteMedia,
} from "@/lib/website-cms";
import {
  deleteAiConversation,
  deleteAiFeedback,
  deleteAssistantEvent,
  updateAiConversationStatus,
  updateAutomationInboxStatus,
  updateAutomationEventStatus,
  updateAutomationRuleEnabled,
} from "@/lib/ai-ops";
import type { WebsiteMediaAsset } from "@/lib/website-cms";

function appRoute(slug: ManagedAppSlug) {
  return slug === "moplayer2" ? "/moplayer-pro" : "/moplayer";
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/website");
  revalidatePath("/moplayer");
  revalidatePath("/moplayer-pro");
}

function parseSimpleLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMetricLines(value: string) {
  return parseSimpleLines(value).map((line) => {
    const [valuePart = "", ar = "", en = ""] = line.split("|").map((part) => part.trim());
    return {
      value: valuePart,
      label_ar: ar || en || valuePart,
      label_en: en || ar || valuePart,
    };
  });
}

function parseStructuredLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [left, ...rest] = line.split("::");
      const title = left?.trim() ?? "";
      const body = rest.join("::").trim();
      if (!title || !body) {
        throw new Error("Use the format Title :: Body for structured fields.");
      }
      return { title, body };
    });
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionalNumber(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function optionalNumberList(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return undefined;
  const values = raw
    .split(/[\s,]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);
  return values.length ? values : undefined;
}

function optionalLineList(formData: FormData, key: string) {
  const values = parseSimpleLines(String(formData.get(key) ?? ""));
  return values.length ? values : undefined;
}

function formProductSlug(formData: FormData) {
  return resolveManagedAppSlug(String(formData.get("product_slug") ?? "moplayer"));
}

function appRedirect(updated: string, productSlug: ManagedAppSlug) {
  redirect(`${appRoute(productSlug)}?updated=${encodeURIComponent(updated)}`);
}

const WEBSITE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

function uploadFailureCode(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("too large") || message.includes("body exceeded") || message.includes("request entity too large")) return "website_upload_too_large";
  if (message.includes("image files")) return "website_upload_type";
  return "website_upload_failed";
}

function validateWebsiteImageFile(file: File) {
  if (file.size > WEBSITE_IMAGE_MAX_BYTES) {
    throw new Error("Image is too large.");
  }
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }
}

/* ───────────────────────── Auth ───────────────────────── */

export async function loginAdminAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  try {
    await signInAdmin(email, password);
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Sign-in failed. Check the password and confirm this account has an admin role.";
    redirect(`/login?error=${encodeURIComponent(message)}&email=${encodeURIComponent(email)}`);
  }

  redirect("/");
}

export async function logoutAdminAction() {
  await signOutAdmin();
  redirect("/login");
}

/* ───────────────────────── App product / content ───────────────────────── */

export async function saveProductAction(formData: FormData) {
  await requireAdminRole("editor");
  const productSlug = formProductSlug(formData);
  let logoPath = String(formData.get("logo_path") ?? "").trim();
  let heroImagePath = String(formData.get("hero_image_path") ?? "").trim();
  let tvBannerPath = String(formData.get("tv_banner_path") ?? "").trim();

  const uploadProductImage = async (key: string) => {
    const file = formData.get(key);
    if (!(file instanceof File) || file.size === 0) return null;
    validateWebsiteImageFile(file);
    const uploaded = await uploadAppScreenshot({
      filename: file.name,
      contentType: file.type || "image/png",
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    return uploaded.publicUrl;
  };

  try {
    logoPath = (await uploadProductImage("logo_file")) ?? logoPath;
    heroImagePath = (await uploadProductImage("hero_file")) ?? heroImagePath;
    tvBannerPath = (await uploadProductImage("tv_banner_file")) ?? tvBannerPath;
  } catch (error) {
    appRedirect(uploadFailureCode(error), productSlug);
  }

  await saveAppProduct({
    slug: productSlug,
    product_name: String(formData.get("product_name") ?? ""),
    hero_badge: String(formData.get("hero_badge") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    short_description: String(formData.get("short_description") ?? ""),
    long_description: String(formData.get("long_description") ?? ""),
    support_email: String(formData.get("support_email") ?? ""),
    support_whatsapp: String(formData.get("support_whatsapp") ?? ""),
    support_url: String(formData.get("support_url") ?? "").trim() || null,
    privacy_path: String(formData.get("privacy_path") ?? "/app/privacy"),
    play_store_url: String(formData.get("play_store_url") ?? "").trim() || null,
    package_name: String(formData.get("package_name") ?? ""),
    android_min_sdk: Number(formData.get("android_min_sdk") ?? 24),
    android_target_sdk: Number(formData.get("android_target_sdk") ?? 35),
    android_tv_ready: formData.get("android_tv_ready") === "on",
    default_download_label: String(formData.get("default_download_label") ?? "Download APK"),
    changelog_intro: String(formData.get("changelog_intro") ?? ""),
    logo_path: logoPath || null,
    hero_image_path: heroImagePath || null,
    tv_banner_path: tvBannerPath || null,
    feature_highlights: parseStructuredLines(String(formData.get("feature_highlights") ?? "")).map((item, index) => ({
      ...item,
      icon: ["tv", "zap", "shield", "box"][index % 4],
    })),
    how_it_works: parseStructuredLines(String(formData.get("how_it_works") ?? "")),
    install_steps: parseStructuredLines(String(formData.get("install_steps") ?? "")),
    compatibility_notes: parseSimpleLines(String(formData.get("compatibility_notes") ?? "")),
    legal_notes: parseSimpleLines(String(formData.get("legal_notes") ?? "")),
    last_updated_at: new Date().toISOString(),
  });

  revalidateAll();
  appRedirect("product", productSlug);
}

export async function saveFaqAction(formData: FormData) {
  await requireAdminRole("editor");
  const productSlug = formProductSlug(formData);
  await saveAppFaq({
    id: String(formData.get("id") ?? "").trim() || undefined,
    product_slug: productSlug,
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    sort_order: Number(formData.get("sort_order") ?? 1),
  });

  revalidateAll();
  appRedirect("faq", productSlug);
}

export async function deleteFaqAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  await deleteAppFaq(String(formData.get("id") ?? ""));
  revalidateAll();
  appRedirect("faq_deleted", productSlug);
}

export async function saveScreenshotAction(formData: FormData) {
  await requireAdminRole("editor");
  const productSlug = formProductSlug(formData);
  let imagePath = String(formData.get("image_path") ?? "").trim();
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadAppScreenshot({
      filename: file.name,
      contentType: file.type || "image/png",
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    imagePath = uploaded.publicUrl;
  }

  if (!imagePath) {
    throw new Error("Screenshot image is required.");
  }

  await saveAppScreenshot({
    id: String(formData.get("id") ?? "").trim() || undefined,
    product_slug: productSlug,
    title: String(formData.get("title") ?? ""),
    alt_text: String(formData.get("alt_text") ?? ""),
    image_path: imagePath,
    device_frame: String(formData.get("device_frame") ?? "phone") as "phone" | "tv" | "landscape",
    sort_order: Number(formData.get("sort_order") ?? 1),
    is_featured: formData.get("is_featured") === "on",
  });

  revalidateAll();
  appRedirect("screenshot", productSlug);
}

export async function deleteScreenshotAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  await deleteAppScreenshot(String(formData.get("id") ?? ""));
  revalidateAll();
  appRedirect("screenshot_deleted", productSlug);
}

/* ───────────────────────── Releases ───────────────────────── */

export async function saveReleaseAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  if (!slug) {
    throw new Error("Release slug is required.");
  }

  const releaseId = await saveAppRelease({
    id: String(formData.get("id") ?? "").trim() || undefined,
    product_slug: productSlug,
    slug,
    version_name: String(formData.get("version_name") ?? ""),
    version_code: Number(formData.get("version_code") ?? 1),
    release_notes: String(formData.get("release_notes") ?? ""),
    compatibility_notes: String(formData.get("compatibility_notes") ?? ""),
    published_at: String(formData.get("published_at") ?? new Date().toISOString()),
    is_published: formData.get("is_published") === "on",
  });

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    await uploadReleaseAsset({
      filename: file.name,
      contentType: file.type || "application/vnd.android.package-archive",
      bytes: new Uint8Array(await file.arrayBuffer()),
      releaseId,
      versionName: String(formData.get("version_name") ?? slug),
      abi: String(formData.get("abi") ?? "arm64-v8a"),
      isPrimary: true,
    });
  }

  revalidateAll();
  appRedirect("release", productSlug);
}

export async function deleteReleaseAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  await deleteAppRelease(String(formData.get("id") ?? ""));
  revalidateAll();
  appRedirect("release_deleted", productSlug);
}

/* ───────────────────────── Support ───────────────────────── */

export async function updateSupportRequestAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const status = String(formData.get("status") ?? "resolved");
  await updateSupportRequestStatus(
    String(formData.get("id") ?? ""),
    status === "archived" ? "archived" : status === "resolved" ? "resolved" : "new",
  );
  revalidateAll();
  appRedirect("support", productSlug);
}

export async function updateDeviceStatusAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const publicDeviceId = String(formData.get("public_device_id") ?? "").trim();
  const status = String(formData.get("status") ?? "pending") as "pending" | "active" | "blocked" | "revoked";
  if (!publicDeviceId) throw new Error("Device ID is required.");
  await updateDeviceStatus(publicDeviceId, status);
  revalidateAll();
  appRedirect("device", productSlug);
}

export async function updateActivationStatusAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "waiting") as "waiting" | "activated" | "expired" | "failed";
  if (!id) throw new Error("Activation request ID is required.");
  await updateActivationRequestStatus(id, status);
  revalidateAll();
  appRedirect("activation", productSlug);
}

export async function deleteActivationAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("Activation request ID is required.");
  await deleteActivationRequest(id);
  revalidateAll();
  appRedirect("activation_deleted", productSlug);
}

export async function cleanupStaleActivationsAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const count = await cleanupStaleActivationRequests(productSlug);
  revalidateAll();
  appRedirect(`cleanup_${count}`, productSlug);
}

export async function saveDeviceLicenseAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  await upsertDeviceLicense({
    publicDeviceId: String(formData.get("public_device_id") ?? "").trim(),
    plan: String(formData.get("plan") ?? "standard").trim(),
    status: String(formData.get("status") ?? "active") as "active" | "expired" | "revoked",
    validUntil: String(formData.get("valid_until") ?? "").trim() || null,
  });
  revalidateAll();
  appRedirect("license", productSlug);
}

export async function updateProviderSourceAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "pending") as "pending" | "fetched" | "imported" | "failed" | "revoked";
  if (!id) throw new Error("Source ID is required.");
  await updateProviderSourceStatus(id, status);
  revalidateAll();
  appRedirect("source", productSlug);
}

/* ───────────────────────── Runtime ───────────────────────── */

export async function saveRuntimeConfigAction(formData: FormData) {
  await requireAdminRole("admin");
  const productSlug = formProductSlug(formData);
  const latestVersionCode = optionalNumber(formData, "latestVersionCode");
  const updateApkSizeBytes = optionalNumber(formData, "updateApkSizeBytes");
  const weatherCity = String(formData.get("weatherCity") ?? "").trim();
  const footballMaxMatches = optionalNumber(formData, "footballMaxMatches");
  const footballLeagueIds = optionalNumberList(formData, "footballLeagueIds");
  const footballLeagueKeywords = optionalLineList(formData, "footballLeagueKeywords");
  const footballNewsMessage = String(formData.get("footballNewsMessage") ?? "").trim();
  const updateDownloadUrl = String(formData.get("updateDownloadUrl") ?? "").trim();
  const updateChecksumSha256 = String(formData.get("updateChecksumSha256") ?? "").trim();
  const updateReleaseNotes = String(formData.get("updateReleaseNotes") ?? "").trim();
  await saveRuntimeConfig(
    {
      enabled: formData.get("enabled") === "on",
      maintenanceMode: formData.get("maintenanceMode") === "on",
      forceUpdate: formData.get("forceUpdate") === "on",
      minimumVersionCode: Number(formData.get("minimumVersionCode") ?? 2),
      latestVersionName: String(formData.get("latestVersionName") ?? "2.0.0"),
      latestVersionCode,
      downloaderCode: String(formData.get("downloaderCode") ?? "").trim() || undefined,
      appName: String(formData.get("appName") ?? "").trim() || undefined,
      packageName: String(formData.get("packageName") ?? "").trim() || undefined,
      message: String(formData.get("message") ?? ""),
      accentColor: String(formData.get("accentColor") ?? "#00e5ff"),
      logoUrl: String(formData.get("logoUrl") ?? "/images/moplayer-icon-512.png"),
      backgroundUrl: String(formData.get("backgroundUrl") ?? "/images/moplayer-tv-banner-final.png"),
      syncIntervalMinutes: optionalNumber(formData, "syncIntervalMinutes"),
      sourceProtocolFallback: formData.get("sourceProtocolFallback") === "on",
      footballProviderMode: String(formData.get("footballProviderMode") ?? "").trim() || undefined,
      ...(footballLeagueIds ? { footballLeagueIds } : {}),
      ...(footballLeagueKeywords ? { footballLeagueKeywords } : {}),
      ...(footballNewsMessage ? { footballNewsMessage } : {}),
      allowFootballFallback: formData.get("allowFootballFallback") === "on",
      allowWeatherFallback: formData.get("allowWeatherFallback") === "on",
      weatherBackgroundMode: String(formData.get("weatherBackgroundMode") ?? "").trim() || undefined,
      weatherBackgroundUrl: String(formData.get("weatherBackgroundUrl") ?? "").trim() || undefined,
      widgets: {
        weather: formData.get("weather") === "on",
        football: formData.get("football") === "on",
        ...(weatherCity ? { weatherCity } : {}),
        ...(footballMaxMatches ? { footballMaxMatches } : {}),
      },
      update: {
        latestVersionName: String(formData.get("latestVersionName") ?? "2.0.0"),
        ...(latestVersionCode ? { latestVersionCode } : {}),
        ...(updateDownloadUrl ? { downloadUrl: updateDownloadUrl } : {}),
        ...(updateApkSizeBytes ? { apkSizeBytes: updateApkSizeBytes } : {}),
        ...(updateChecksumSha256 ? { checksumSha256: updateChecksumSha256 } : {}),
        ...(updateReleaseNotes ? { releaseNotes: updateReleaseNotes } : {}),
      },
      supportUrl: String(formData.get("supportUrl") ?? "https://moalfarras.space/en/contact"),
      privacyUrl: String(formData.get("privacyUrl") ?? "https://moalfarras.space/privacy"),
    },
    productSlug,
  );
  revalidateAll();
  appRedirect("runtime_config", productSlug);
}

/* ───────────────────────── Website ───────────────────────── */

export async function saveWebsiteHeroAction(formData: FormData) {
  await requireAdminRole("editor");
  const value = {
    ar: {
      hero: {
        title: String(formData.get("hero_ar_headline") ?? "").trim(),
        body: String(formData.get("hero_ar_subheadline") ?? "").trim(),
        primary: String(formData.get("hero_ar_primary_cta") ?? "ابدأ مشروعك").trim(),
        secondary: String(formData.get("hero_ar_secondary_cta") ?? "شاهد الأعمال").trim(),
      },
    },
    en: {
      hero: {
        title: String(formData.get("hero_en_headline") ?? "").trim(),
        body: String(formData.get("hero_en_subheadline") ?? "").trim(),
        primary: String(formData.get("hero_en_primary_cta") ?? "Start Project").trim(),
        secondary: String(formData.get("hero_en_secondary_cta") ?? "See Work").trim(),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  await mergeSiteSetting("home_content", value);
  revalidateAll();
  redirect("/website?updated=website_hero");
}

export async function saveWebsiteServicesAction(formData: FormData) {
  await requireAdminRole("editor");
  const value = {
    ar: {
      services: {
        title: String(formData.get("services_ar_title") ?? "").trim(),
        body: String(formData.get("services_ar_body") ?? "").trim(),
      },
    },
    en: {
      services: {
        title: String(formData.get("services_en_title") ?? "").trim(),
        body: String(formData.get("services_en_body") ?? "").trim(),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  await mergeSiteSetting("home_content", value);
  revalidateAll();
  redirect("/website?updated=website_services");
}

export async function saveWebsitePageAction(formData: FormData) {
  await requireAdminRole("editor");
  const id = String(formData.get("id") ?? "").trim();
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  if (!id || !slug) throw new Error("Page ID and slug are required.");

  await saveWebsitePage({
    page: {
      id,
      slug,
      status: formData.get("status") === "draft" ? "draft" : "published",
      template: String(formData.get("template") ?? "default").trim() || "default",
      seo_image_media_id: String(formData.get("seo_image_media_id") ?? "").trim() || null,
    },
    translations: [
      {
        page_id: id,
        locale: "ar",
        title: String(formData.get("title_ar") ?? slug).trim() || slug,
        meta_title: String(formData.get("meta_title_ar") ?? "").trim(),
        meta_description: String(formData.get("meta_description_ar") ?? "").trim(),
        og_title: String(formData.get("og_title_ar") ?? "").trim(),
        og_description: String(formData.get("og_description_ar") ?? "").trim(),
      },
      {
        page_id: id,
        locale: "en",
        title: String(formData.get("title_en") ?? slug).trim() || slug,
        meta_title: String(formData.get("meta_title_en") ?? "").trim(),
        meta_description: String(formData.get("meta_description_en") ?? "").trim(),
        og_title: String(formData.get("og_title_en") ?? "").trim(),
        og_description: String(formData.get("og_description_en") ?? "").trim(),
      },
    ],
  });

  revalidateAll();
  redirect("/website?updated=website_page");
}

export async function saveWebsiteProjectAction(formData: FormData) {
  await requireAdminRole("editor");
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const id = String(formData.get("id") ?? "").trim() || slug || crypto.randomUUID();
  if (!slug) throw new Error("Project slug is required.");
  let coverUpload: WebsiteMediaAsset | null = null;
  try {
    coverUpload = await maybeUploadBrandMedia(formData, "cover_file", `project-${slug}`);
  } catch (error) {
    redirect(`/website?updated=${uploadFailureCode(error)}#projects`);
  }
  const selectedCoverMediaId = String(formData.get("cover_media_id") ?? "").trim();
  const currentCoverMediaId = String(formData.get("current_cover_media_id") ?? "").trim();
  const coverMediaId = coverUpload?.id ?? (selectedCoverMediaId || currentCoverMediaId || null);

  await saveWebsiteProjectDetails({
    project: {
      id,
      slug,
      is_active: formData.get("is_active") === "on",
      sort_order: Number(formData.get("sort_order") ?? 0),
      category: String(formData.get("category") ?? "business").trim() || "business",
      featured_rank: Number(formData.get("featured_rank") ?? 99),
      project_url: String(formData.get("project_url") ?? "").trim(),
      repo_url: String(formData.get("repo_url") ?? "").trim(),
      cover_media_id: coverMediaId,
    },
    translations: [
      {
        project_id: id,
        locale: "ar",
        title: String(formData.get("title_ar") ?? slug).trim() || slug,
        summary: String(formData.get("summary_ar") ?? "").trim(),
        description: String(formData.get("description_ar") ?? "").trim(),
        cta_label: String(formData.get("cta_ar") ?? "عرض المشروع").trim() || "عرض المشروع",
        tags_json: parseSimpleLines(String(formData.get("tags_ar") ?? "")),
        challenge: String(formData.get("challenge_ar") ?? "").trim(),
        solution: String(formData.get("solution_ar") ?? "").trim(),
        result: String(formData.get("result_ar") ?? "").trim(),
      },
      {
        project_id: id,
        locale: "en",
        title: String(formData.get("title_en") ?? slug).trim() || slug,
        summary: String(formData.get("summary_en") ?? "").trim(),
        description: String(formData.get("description_en") ?? "").trim(),
        cta_label: String(formData.get("cta_en") ?? "View project").trim() || "View project",
        tags_json: parseSimpleLines(String(formData.get("tags_en") ?? "")),
        challenge: String(formData.get("challenge_en") ?? "").trim(),
        solution: String(formData.get("solution_en") ?? "").trim(),
        result: String(formData.get("result_en") ?? "").trim(),
      },
    ],
    metrics: parseMetricLines(String(formData.get("metrics") ?? "")),
  });

  revalidateAll();
  redirect("/website?updated=website_project");
}

export async function saveWebsiteServiceAction(formData: FormData) {
  await requireAdminRole("editor");
  const rawId = String(formData.get("id") ?? "").trim();
  const id = normalizeSlug(rawId || String(formData.get("title_en") ?? formData.get("title_ar") ?? ""));
  if (!id) throw new Error("Service title or ID is required.");
  let serviceUpload: WebsiteMediaAsset | null = null;
  try {
    serviceUpload = await maybeUploadBrandMedia(formData, "service_file", `service-${id}`);
  } catch (error) {
    redirect(`/website?updated=${uploadFailureCode(error)}#services`);
  }
  const selectedCoverMediaId = String(formData.get("cover_media_id") ?? "").trim();
  const currentCoverMediaId = String(formData.get("current_cover_media_id") ?? "").trim();

  await saveWebsiteService({
    service: {
      id,
      is_active: formData.get("is_active") === "on",
      sort_order: Number(formData.get("sort_order") ?? 0),
      icon: String(formData.get("icon") ?? "sparkles").trim() || "sparkles",
      color_token: String(formData.get("color_token") ?? "accent").trim() || "accent",
      cover_media_id: serviceUpload?.id ?? (selectedCoverMediaId || currentCoverMediaId || null),
    },
    translations: [
      {
        service_id: id,
        locale: "ar",
        title: String(formData.get("title_ar") ?? id).trim() || id,
        description: String(formData.get("description_ar") ?? "").trim(),
        bullets_json: parseSimpleLines(String(formData.get("bullets_ar") ?? "")),
      },
      {
        service_id: id,
        locale: "en",
        title: String(formData.get("title_en") ?? id).trim() || id,
        description: String(formData.get("description_en") ?? "").trim(),
        bullets_json: parseSimpleLines(String(formData.get("bullets_en") ?? "")),
      },
    ],
  });

  revalidateAll();
  redirect("/website?updated=website_service");
}

export async function deleteWebsiteServiceAction(formData: FormData) {
  await requireAdminRole("admin");
  await deleteWebsiteService(String(formData.get("id") ?? ""));
  revalidateAll();
  redirect("/website?updated=website_service_deleted");
}

export async function deleteWebsiteProjectAction(formData: FormData) {
  await requireAdminRole("admin");
  await deleteWebsiteProject(String(formData.get("id") ?? ""));
  revalidateAll();
  redirect("/website?updated=website_project_deleted");
}

export async function uploadWebsiteMediaAction(formData: FormData) {
  await requireAdminRole("editor");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect("/website?updated=website_upload_missing#media");
  }
  try {
    validateWebsiteImageFile(file);
    await uploadWebsiteMedia({
      filename: file.name,
      contentType: file.type || "image/png",
      bytes: new Uint8Array(await file.arrayBuffer()),
      altAr: String(formData.get("alt_ar") ?? "").trim(),
      altEn: String(formData.get("alt_en") ?? "").trim(),
      kind: String(formData.get("kind") ?? "general").trim() || "general",
    });
  } catch (error) {
    redirect(`/website?updated=${uploadFailureCode(error)}#media`);
  }

  revalidateAll();
  redirect("/website?updated=website_media");
}

export async function deleteWebsiteMediaAction(formData: FormData) {
  await requireAdminRole("admin");
  await deleteWebsiteMedia(String(formData.get("id") ?? ""));
  revalidateAll();
  redirect("/website?updated=website_media_deleted");
}

export async function saveSiteStatusAction(formData: FormData) {
  await requireAdminRole("admin");
  await mergeSiteSetting("site_status", {
    maintenance: formData.get("maintenance") === "on",
    message_ar: String(formData.get("message_ar") ?? "").trim(),
    message_en: String(formData.get("message_en") ?? "").trim(),
    updatedAt: new Date().toISOString(),
  });
  revalidateAll();
  redirect("/website?updated=site_status");
}

export async function saveWebsiteBrandAction(formData: FormData) {
  await requireAdminRole("editor");
  let logoUpload: WebsiteMediaAsset | null = null;
  let profileUpload: WebsiteMediaAsset | null = null;
  let contactUpload: WebsiteMediaAsset | null = null;
  try {
    logoUpload = await maybeUploadBrandMedia(formData, "logo_file", "website-logo");
    profileUpload = await maybeUploadBrandMedia(formData, "profile_file", "website-profile");
    contactUpload = await maybeUploadBrandMedia(formData, "contact_hero_file", "website-contact");
  } catch (error) {
    redirect(`/website?updated=${uploadFailureCode(error)}#brand`);
  }

  await mergeSiteSetting("brand_assets", {
    siteName: {
      ar: String(formData.get("site_name_ar") ?? "").trim(),
      en: String(formData.get("site_name_en") ?? "").trim(),
    },
    navTagline: {
      ar: String(formData.get("nav_tagline_ar") ?? "").trim(),
      en: String(formData.get("nav_tagline_en") ?? "").trim(),
    },
    logo: {
      mediaId: logoUpload?.id ?? (String(formData.get("logo_media_id") ?? "").trim() || null),
      path: logoUpload?.path ?? (String(formData.get("logo_path") ?? "").trim() || "/images/logo.png"),
    },
    profilePortrait: {
      mediaId: profileUpload?.id ?? (String(formData.get("profile_media_id") ?? "").trim() || null),
      path: profileUpload?.path ?? (String(formData.get("profile_path") ?? "").trim() || "/images/protofeilnew.jpeg"),
    },
    contactHero: {
      mediaId: contactUpload?.id ?? (String(formData.get("contact_hero_media_id") ?? "").trim() || null),
      path: contactUpload?.path ?? (String(formData.get("contact_hero_path") ?? "").trim() || "/images/hero_tech.png"),
    },
    updatedAt: new Date().toISOString(),
  });
  revalidateAll();
  redirect("/website?updated=website_brand");
}

async function maybeUploadBrandMedia(formData: FormData, key: string, kind: string): Promise<WebsiteMediaAsset | null> {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;
  validateWebsiteImageFile(file);

  return uploadWebsiteMedia({
    filename: file.name,
    contentType: file.type || "image/png",
    bytes: new Uint8Array(await file.arrayBuffer()),
    altAr: String(formData.get("site_name_ar") ?? "").trim(),
    altEn: String(formData.get("site_name_en") ?? "").trim(),
    kind,
  });
}

export async function saveWebsiteThemeAction(formData: FormData) {
  await requireAdminRole("editor");
  await mergeSiteSetting("site_theme", {
    accent: String(formData.get("accent") ?? "#22d3ee").trim(),
    background: String(formData.get("background") ?? "#060a18").trim(),
    panel: String(formData.get("panel") ?? "#0f172a").trim(),
    updatedAt: new Date().toISOString(),
  });
  revalidateAll();
  redirect("/website?updated=website_theme");
}

export async function saveWebsiteContactAction(formData: FormData) {
  await requireAdminRole("editor");
  await mergeSiteSetting("contact_page_content", {
    ar: {
      eyebrow: String(formData.get("contact_ar_eyebrow") ?? "").trim(),
      title: String(formData.get("contact_ar_title") ?? "").trim(),
      body: String(formData.get("contact_ar_body") ?? "").trim(),
      directTitle: String(formData.get("contact_ar_direct_title") ?? "").trim(),
      directBody: String(formData.get("contact_ar_direct_body") ?? "").trim(),
      primaryCta: String(formData.get("contact_ar_cta") ?? "").trim(),
      chips: parseSimpleLines(String(formData.get("contact_ar_chips") ?? "")),
    },
    en: {
      eyebrow: String(formData.get("contact_en_eyebrow") ?? "").trim(),
      title: String(formData.get("contact_en_title") ?? "").trim(),
      body: String(formData.get("contact_en_body") ?? "").trim(),
      directTitle: String(formData.get("contact_en_direct_title") ?? "").trim(),
      directBody: String(formData.get("contact_en_direct_body") ?? "").trim(),
      primaryCta: String(formData.get("contact_en_cta") ?? "").trim(),
      chips: parseSimpleLines(String(formData.get("contact_en_chips") ?? "")),
    },
    updatedAt: new Date().toISOString(),
  });
  revalidateAll();
  redirect("/website?updated=website_contact");
}

export async function saveWebsiteOffersAction(formData: FormData) {
  await requireAdminRole("editor");
  const supabase = createSupabaseAdminClient();
  const current = await supabase.from("site_settings").select("value_json").eq("key", "site_offers").maybeSingle();
  const existing = (current.data?.value_json && typeof current.data.value_json === "object" ? current.data.value_json : {}) as {
    items?: Array<Record<string, unknown>>;
  };
  const items = Array.isArray(existing.items) ? [...existing.items] : [];
  const rawIndex = String(formData.get("existing_index") ?? "").trim();
  const index = rawIndex === "" ? -1 : Number(rawIndex);
  let offerImage = "";
  const selectedMediaId = String(formData.get("image_media_id") ?? "").trim();
  if (selectedMediaId) {
    const asset = await supabase.from("media_assets").select("path").eq("id", selectedMediaId).maybeSingle();
    offerImage = String(asset.data?.path ?? "");
  }
  try {
    const uploaded = await maybeUploadBrandMedia(formData, "offer_file", "website-offer");
    if (uploaded?.path) offerImage = uploaded.path;
  } catch (error) {
    redirect(`/website?updated=${uploadFailureCode(error)}#offers`);
  }
  const previous = index >= 0 ? items[index] ?? {} : {};
  const offer = {
    id: String(formData.get("id") ?? "").trim() || String(previous.id ?? "") || crypto.randomUUID(),
    isActive: formData.get("is_active") === "on",
    placement: String(formData.get("placement") ?? "home"),
    style: String(formData.get("style") ?? "banner"),
    sortOrder: Number(formData.get("sort_order") ?? index + 1),
    badge: {
      ar: String(formData.get("badge_ar") ?? "").trim(),
      en: String(formData.get("badge_en") ?? "").trim(),
    },
    title: {
      ar: String(formData.get("title_ar") ?? "").trim(),
      en: String(formData.get("title_en") ?? "").trim(),
    },
    body: {
      ar: String(formData.get("body_ar") ?? "").trim(),
      en: String(formData.get("body_en") ?? "").trim(),
    },
    ctaLabel: {
      ar: String(formData.get("cta_ar") ?? "").trim(),
      en: String(formData.get("cta_en") ?? "").trim(),
    },
    ctaHref: String(formData.get("cta_href") ?? "/contact").trim() || "/contact",
    image: offerImage || String(previous.image ?? "/images/hero_tech.png"),
  };
  if (index >= 0) {
    items[index] = offer;
  } else {
    items.push(offer);
  }
  await mergeSiteSetting("site_offers", { items, updatedAt: new Date().toISOString() });
  revalidateAll();
  redirect("/website?updated=website_offer#offers");
}

/* ───────────────────────── Email replies to users ───────────────────────── */

export async function sendUserEmailAction(formData: FormData) {
  const admin = await requireAdminRole("editor");
  const to = String(formData.get("to") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim() || "Reply from Moalfarras";
  const body = String(formData.get("body") ?? "").trim();
  const redirectTo = String(formData.get("redirect_to") ?? "/website").trim() || "/website";
  const messageId = String(formData.get("message_id") ?? "").trim();

  if (!to || !body) {
    redirect(`${redirectTo}?updated=reply_invalid`);
  }

  try {
    await sendMail({
      to,
      subject,
      replyTo: admin.email,
      text: body,
      html: brandedEmailHtml({
        eyebrow: "Moalfarras Control Center",
        title: subject,
        body,
        footer: `Sent by ${admin.email} from admin.moalfarras.space`,
      }),
    });
    if (messageId) {
      await updateWebsiteMessageStatus(messageId, "replied");
    }
  } catch {
    redirect(`${redirectTo}?updated=reply_failed`);
  }

  redirect(`${redirectTo}?updated=reply_sent`);
}

export async function updateWebsiteMessageStatusAction(formData: FormData) {
  await requireAdminRole("editor");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const allowed = new Set(["new", "read", "replied", "resolved", "archived"]);
  if (!id || !allowed.has(status)) {
    redirect("/website?updated=message_invalid");
  }

  await updateWebsiteMessageStatus(id, status as "new" | "read" | "replied" | "resolved" | "archived");
  revalidateAll();
  redirect("/website?updated=message_status");
}

export async function deleteWebsiteMessageAction(formData: FormData) {
  await requireAdminRole("admin");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/website?updated=message_invalid");
  await deleteWebsiteMessage(id);
  revalidateAll();
  redirect("/website?updated=message_deleted");
}

/* ───────────────────────── AI operations ───────────────────────── */

export async function updateAiConversationStatusAction(formData: FormData) {
  await requireAdminRole("editor");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "closed");
  if (!id || !["open", "lead", "support", "closed", "archived"].includes(status)) {
    redirect("/ai?updated=ai_invalid");
  }
  await updateAiConversationStatus(id, status as "open" | "lead" | "support" | "closed" | "archived");
  revalidateAll();
  redirect("/ai?updated=ai_conversation");
}

export async function deleteAiConversationAction(formData: FormData) {
  await requireAdminRole("admin");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/ai?updated=ai_invalid");
  await deleteAiConversation(id);
  revalidateAll();
  redirect("/ai?updated=ai_deleted");
}

export async function deleteAiFeedbackAction(formData: FormData) {
  await requireAdminRole("admin");
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/ai?updated=ai_invalid");
  await deleteAiFeedback(id);
  revalidateAll();
  redirect("/ai?updated=feedback_deleted");
}

export async function updateAutomationEventStatusAction(formData: FormData) {
  await requireAdminRole("editor");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "processed");
  if (!id || !["queued", "sent", "processed", "failed", "ignored"].includes(status)) {
    redirect("/ai?updated=automation_invalid");
  }
  await updateAutomationEventStatus(id, status as "queued" | "sent" | "processed" | "failed" | "ignored");
  revalidateAll();
  redirect("/ai?updated=automation_event");
}

export async function updateAutomationInboxStatusAction(formData: FormData) {
  await requireAdminRole("editor");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "reviewing");
  if (!id || !["new", "reviewing", "approved", "resolved", "archived"].includes(status)) {
    redirect("/ai?updated=automation_invalid");
  }
  await updateAutomationInboxStatus(id, status as "new" | "reviewing" | "approved" | "resolved" | "archived");
  revalidateAll();
  redirect("/ai?updated=automation_inbox");
}

export async function updateAutomationRuleEnabledAction(formData: FormData) {
  await requireAdminRole("admin");
  const id = String(formData.get("id") ?? "").trim();
  const enabled = String(formData.get("enabled") ?? "") === "true";
  if (!id) redirect("/ai?updated=automation_invalid");
  await updateAutomationRuleEnabled(id, enabled);
  revalidateAll();
  redirect("/ai?updated=automation_rule");
}

export async function deleteAssistantEventAction(formData: FormData) {
  await requireAdminRole("admin");
  const key = String(formData.get("key") ?? "").trim();
  if (!key) redirect("/ai?updated=ai_invalid");
  await deleteAssistantEvent(key);
  revalidateAll();
  redirect("/ai?updated=assistant_event_deleted");
}

function brandedEmailHtml({ eyebrow, title, body, footer }: { eyebrow: string; title: string; body: string; footer: string }) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f1f5f9;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse">
      <tr>
        <td style="border:1px solid #cbd5e1;border-radius:28px;overflow:hidden;background:#ffffff;box-shadow:0 18px 50px rgba(15,23,42,.14)">
          <div style="padding:28px;background:linear-gradient(135deg,#ecfeff,#eef2ff 62%,#ffffff);border-bottom:1px solid #e2e8f0">
            <p style="margin:0 0 12px;color:#0891b2;font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
            <h1 style="margin:0;color:#0f172a;font-size:28px;line-height:1.2;letter-spacing:-.03em">${escapeHtml(title)}</h1>
          </div>
          <div style="padding:28px">
            <div style="border-radius:22px;background:#f8fafc;border:1px solid #dbeafe;padding:22px;color:#0f172a;font-size:16px;line-height:1.85">
              ${escapeHtml(body).replace(/\n/g, "<br/>")}
            </div>
            <div style="margin-top:24px;border-top:1px solid #e2e8f0;padding-top:18px;color:#64748b;font-size:13px;line-height:1.65">
              <strong style="color:#0f172a">Moalfarras.space</strong><br/>
              ${escapeHtml(footer)}
            </div>
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
