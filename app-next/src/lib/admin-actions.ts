"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminSession, destroyAdminSession } from "@/lib/auth";
import { updateThemeToken, upsertVideo } from "@/lib/content/store";
import { themeTokenUpdateSchema, videoSchema } from "@/lib/validation";

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

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(", "));
  }

  await updateThemeToken(parsed.data.mode, parsed.data.tokenKey, parsed.data.tokenValue);
  revalidatePath("/[locale]", "layout");
  revalidatePath("/ar/admin");
  revalidatePath("/en");
  revalidatePath("/ar");
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
  if (!parsed.success) {
    throw new Error(parsed.error.flatten().formErrors.join(", "));
  }

  await upsertVideo(parsed.data);
  revalidatePath("/ar/youtube");
  revalidatePath("/en/youtube");
  revalidatePath("/ar/admin");
}
