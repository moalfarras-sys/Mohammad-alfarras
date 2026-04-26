"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminRole, signInAdmin, signOutAdmin } from "@/lib/admin-auth";
import {
  deleteAppFaq,
  deleteAppRelease,
  deleteAppScreenshot,
  saveAppFaq,
  saveAppProduct,
  saveAppRelease,
  saveRuntimeConfig,
  saveAppScreenshot,
  updateSupportRequestStatus,
  uploadAppScreenshot,
  uploadReleaseAsset,
} from "@/lib/app-ecosystem";

function revalidateAppSurface() {
  revalidatePath("/");
}

function parseSimpleLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
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
    redirect(`/?error=${encodeURIComponent(message)}&email=${encodeURIComponent(email)}`);
  }

  redirect("/");
}

export async function logoutAdminAction() {
  await signOutAdmin();
  redirect("/");
}

export async function saveProductAction(formData: FormData) {
  await requireAdminRole("editor");
  await saveAppProduct({
    slug: "moplayer",
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
    logo_path: String(formData.get("logo_path") ?? "").trim() || null,
    hero_image_path: String(formData.get("hero_image_path") ?? "").trim() || null,
    tv_banner_path: String(formData.get("tv_banner_path") ?? "").trim() || null,
    feature_highlights: parseStructuredLines(String(formData.get("feature_highlights") ?? "")).map((item, index) => ({
      ...item,
      icon: ["tv", "zap", "shield", "sparkles"][index % 4],
    })),
    how_it_works: parseStructuredLines(String(formData.get("how_it_works") ?? "")),
    install_steps: parseStructuredLines(String(formData.get("install_steps") ?? "")),
    compatibility_notes: parseSimpleLines(String(formData.get("compatibility_notes") ?? "")),
    legal_notes: parseSimpleLines(String(formData.get("legal_notes") ?? "")),
    last_updated_at: new Date().toISOString(),
  });

  revalidateAppSurface();
  redirect("/?updated=product");
}

export async function saveFaqAction(formData: FormData) {
  await requireAdminRole("editor");
  await saveAppFaq({
    id: String(formData.get("id") ?? "").trim() || undefined,
    product_slug: "moplayer",
    question: String(formData.get("question") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    sort_order: Number(formData.get("sort_order") ?? 1),
  });

  revalidateAppSurface();
  redirect("/?updated=faq");
}

export async function deleteFaqAction(formData: FormData) {
  await requireAdminRole("admin");
  await deleteAppFaq(String(formData.get("id") ?? ""));
  revalidateAppSurface();
  redirect("/?updated=faq_deleted");
}

export async function saveScreenshotAction(formData: FormData) {
  await requireAdminRole("editor");
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
    product_slug: "moplayer",
    title: String(formData.get("title") ?? ""),
    alt_text: String(formData.get("alt_text") ?? ""),
    image_path: imagePath,
    device_frame: String(formData.get("device_frame") ?? "phone") as "phone" | "tv" | "landscape",
    sort_order: Number(formData.get("sort_order") ?? 1),
    is_featured: formData.get("is_featured") === "on",
  });

  revalidateAppSurface();
  redirect("/?updated=screenshot");
}

export async function deleteScreenshotAction(formData: FormData) {
  await requireAdminRole("admin");
  await deleteAppScreenshot(String(formData.get("id") ?? ""));
  revalidateAppSurface();
  redirect("/?updated=screenshot_deleted");
}

export async function saveReleaseAction(formData: FormData) {
  const admin = await requireAdminRole("admin");
  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  if (!slug) {
    throw new Error("Release slug is required.");
  }

  const releaseId = await saveAppRelease({
    id: String(formData.get("id") ?? "").trim() || undefined,
    product_slug: "moplayer",
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

  revalidateAppSurface();
  redirect(`/?updated=release&by=${encodeURIComponent(admin.email)}`);
}

export async function deleteReleaseAction(formData: FormData) {
  await requireAdminRole("admin");
  await deleteAppRelease(String(formData.get("id") ?? ""));
  revalidateAppSurface();
  redirect("/?updated=release_deleted");
}

export async function updateSupportRequestAction(formData: FormData) {
  await requireAdminRole("admin");
  await updateSupportRequestStatus(
    String(formData.get("id") ?? ""),
    String(formData.get("status") ?? "resolved") === "resolved" ? "resolved" : "new",
  );
  revalidateAppSurface();
  redirect("/?updated=support");
}

export async function saveRuntimeConfigAction(formData: FormData) {
  await requireAdminRole("admin");
  await saveRuntimeConfig({
    enabled: formData.get("enabled") === "on",
    maintenanceMode: formData.get("maintenanceMode") === "on",
    forceUpdate: formData.get("forceUpdate") === "on",
    minimumVersionCode: Number(formData.get("minimumVersionCode") ?? 2),
    latestVersionName: String(formData.get("latestVersionName") ?? "2.0.0"),
    message: String(formData.get("message") ?? ""),
    accentColor: String(formData.get("accentColor") ?? "#00e5ff"),
    logoUrl: String(formData.get("logoUrl") ?? "/images/moplayer-icon-512.png"),
    backgroundUrl: String(formData.get("backgroundUrl") ?? "/images/moplayer-tv-banner.png"),
    widgets: {
      weather: formData.get("weather") === "on",
      football: formData.get("football") === "on",
    },
    supportUrl: String(formData.get("supportUrl") ?? "https://moalfarras.space/en/contact"),
    privacyUrl: String(formData.get("privacyUrl") ?? "https://moalfarras.space/privacy"),
  });
  revalidateAppSurface();
  redirect("/?updated=runtime_config");
}
