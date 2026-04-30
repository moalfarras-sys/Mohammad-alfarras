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
  kind: string;
  width: number | null;
  height: number | null;
};

export type WebsiteProject = {
  id: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
  project_url: string;
  repo_url: string;
  cover_media_id: string | null;
  created_at?: string;
  updated_at?: string;
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
  created_at: string;
};

export type WebsiteCmsData = {
  settings: WebsiteSetting[];
  mediaAssets: WebsiteMediaAsset[];
  projects: WebsiteProject[];
  messages: WebsiteContactMessage[];
};

const emptyWebsiteCmsData: WebsiteCmsData = {
  settings: [],
  mediaAssets: [],
  projects: [],
  messages: [],
};

export async function readWebsiteCmsData(): Promise<WebsiteCmsData> {
  try {
    const supabase = createSupabaseAdminClient();
    const [settings, mediaAssets, projects, messages] = await Promise.all([
      supabase.from("site_settings").select("key,value_json").order("key"),
      supabase.from("media_assets").select("*").order("kind").order("id").limit(80),
      supabase.from("work_projects").select("*").order("sort_order"),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(80),
    ]);

    if (settings.error) throw settings.error;
    if (mediaAssets.error) throw mediaAssets.error;
    if (projects.error) throw projects.error;
    if (messages.error) throw messages.error;

    return {
      settings: (settings.data ?? []) as WebsiteSetting[],
      mediaAssets: (mediaAssets.data ?? []) as WebsiteMediaAsset[],
      projects: (projects.data ?? []) as WebsiteProject[],
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

export async function deleteWebsiteProject(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("work_projects").delete().eq("id", id);
  if (error) throw error;
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
    kind: params.kind || "general",
    width: null,
    height: null,
  };

  const { error } = await supabase.from("media_assets").upsert(asset, { onConflict: "id" });
  if (error) throw error;
  return asset;
}
