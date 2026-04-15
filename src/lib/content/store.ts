import { cache } from "react";

import { createSupabaseAdminClient, createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { deleteWhere, hasDatabaseUrl, updateWhere, upsertRow } from "@/lib/server-db";
import type {
  AuditLog,
  Certification,
  CmsSnapshot,
  ContactChannel,
  Experience,
  Locale,
  MediaAsset,
  PageBlock,
  PageStatus,
  PageView,
  ServiceOffering,
  WorkProject,
  WorkProjectMedia,
  WorkProjectMetric,
  YoutubeVideo,
} from "@/types/cms";
import { defaultSnapshot } from "@/data/default-content";

const mutableSnapshot: CmsSnapshot = structuredClone(defaultSnapshot);

const conflictMap = {
  site_settings: ["key"],
  youtube_videos: ["id"],
  work_projects: ["id"],
  work_project_translations: ["project_id", "locale"],
  work_project_media: ["id"],
  work_project_metrics: ["id"],
  experiences: ["id"],
  experience_translations: ["experience_id", "locale"],
  certifications: ["id"],
  certification_translations: ["certification_id", "locale"],
  service_offerings: ["id"],
  service_offering_translations: ["service_id", "locale"],
  contact_channels: ["id"],
  contact_channel_translations: ["channel_id", "locale"],
  page_blocks: ["id"],
  page_block_translations: ["block_id", "locale"],
  pages: ["id"],
  page_translations: ["page_id", "locale"],
  sections: ["id"],
  section_translations: ["section_id", "locale"],
  navigation_items: ["id"],
  navigation_translations: ["nav_item_id", "locale"],
  media_assets: ["id"],
  audit_logs: ["id"],
} as const;

async function upsertDbRow(table: keyof typeof conflictMap, row: Record<string, unknown>) {
  if (!hasDatabaseUrl()) return;
  await upsertRow(table, row, [...conflictMap[table]]);
}

function deepClone<T>(input: T): T {
  return structuredClone(input);
}

function mergeByKey<T>(base: T[], incoming: T[], getKey: (value: T) => string): T[] {
  const merged = new Map<string, T>();
  for (const item of base) merged.set(getKey(item), deepClone(item));
  for (const item of incoming) merged.set(getKey(item), deepClone(item));
  return Array.from(merged.values());
}

function mergePreferBase<T>(base: T[], incoming: T[], getKey: (value: T) => string): T[] {
  const merged = new Map<string, T>();
  for (const item of incoming) merged.set(getKey(item), deepClone(item));
  for (const item of base) merged.set(getKey(item), deepClone(item));
  return Array.from(merged.values());
}

function isPlaceholderMediaPath(path: string | undefined | null): boolean {
  const p = (path ?? "").trim().toLowerCase();
  if (!p) return true;
  return p.includes("cine-fallback-wide") || p.includes("cine-fallback-portrait");
}

/** Supabase rows often keep old SVG fallbacks; curated defaults in repo win unless remote has a real URL or non-placeholder path. */
function mergeMediaAssets(base: MediaAsset[], incoming: MediaAsset[]): MediaAsset[] {
  const map = new Map<string, MediaAsset>();
  for (const item of base) {
    map.set(item.id, deepClone(item));
  }
  for (const inc of incoming) {
    const curated = map.get(inc.id);
    const incPath = inc.path?.trim() ?? "";
    if (!curated) {
      map.set(inc.id, deepClone(inc));
      continue;
    }
    const curatedPath = curated.path?.trim() ?? "";
    const remoteIsReal =
      incPath.startsWith("http") || (incPath.startsWith("/") && !isPlaceholderMediaPath(incPath));
    if (remoteIsReal) {
      map.set(inc.id, deepClone(inc));
      continue;
    }
    if (isPlaceholderMediaPath(incPath) && !isPlaceholderMediaPath(curatedPath)) {
      map.set(inc.id, {
        ...deepClone(inc),
        path: curated.path,
        type: curated.type,
        width: curated.width,
        height: curated.height,
        alt_ar: curated.alt_ar,
        alt_en: curated.alt_en,
      });
      continue;
    }
    map.set(inc.id, deepClone(inc));
  }
  return Array.from(map.values());
}

function mergeSnapshots(base: CmsSnapshot, incoming: CmsSnapshot): CmsSnapshot {
  return {
    pages: mergePreferBase(base.pages, incoming.pages, (item) => item.id),
    page_translations: mergePreferBase(base.page_translations, incoming.page_translations, (item) => `${item.page_id}-${item.locale}`),
    sections: mergeByKey(base.sections, incoming.sections, (item) => item.id),
    section_translations: mergeByKey(base.section_translations, incoming.section_translations, (item) => `${item.section_id}-${item.locale}`),
    page_blocks: mergePreferBase(base.page_blocks, incoming.page_blocks, (item) => item.id),
    page_block_translations: mergePreferBase(
      base.page_block_translations,
      incoming.page_block_translations,
      (item) => `${item.block_id}-${item.locale}`,
    ),
    navigation_items: mergePreferBase(base.navigation_items, incoming.navigation_items, (item) => item.id),
    navigation_translations: mergePreferBase(
      base.navigation_translations,
      incoming.navigation_translations,
      (item) => `${item.nav_item_id}-${item.locale}`,
    ),
    media_assets: mergeMediaAssets(base.media_assets, incoming.media_assets),
    youtube_videos: mergeByKey(base.youtube_videos, incoming.youtube_videos, (item) => item.id),
    work_projects: mergeByKey(base.work_projects, incoming.work_projects, (item) => item.id),
    work_project_translations: mergeByKey(base.work_project_translations, incoming.work_project_translations, (item) => `${item.project_id}-${item.locale}`),
    work_project_media: mergeByKey(base.work_project_media, incoming.work_project_media, (item) => item.id),
    work_project_metrics: mergeByKey(base.work_project_metrics, incoming.work_project_metrics, (item) => item.id),
    experiences: mergeByKey(base.experiences, incoming.experiences, (item) => item.id),
    experience_translations: mergeByKey(base.experience_translations, incoming.experience_translations, (item) => `${item.experience_id}-${item.locale}`),
    certifications: mergeByKey(base.certifications, incoming.certifications, (item) => item.id),
    certification_translations: mergeByKey(base.certification_translations, incoming.certification_translations, (item) => `${item.certification_id}-${item.locale}`),
    service_offerings: mergeByKey(base.service_offerings, incoming.service_offerings, (item) => item.id),
    service_offering_translations: mergeByKey(base.service_offering_translations, incoming.service_offering_translations, (item) => `${item.service_id}-${item.locale}`),
    contact_channels: mergeByKey(base.contact_channels, incoming.contact_channels, (item) => item.id),
    contact_channel_translations: mergeByKey(base.contact_channel_translations, incoming.contact_channel_translations, (item) => `${item.channel_id}-${item.locale}`),
    site_settings: mergeByKey(base.site_settings, incoming.site_settings, (item) => item.key),
    audit_logs: mergeByKey(base.audit_logs, incoming.audit_logs, (item) => item.id),
  };
}

async function readSnapshotFromSupabase(): Promise<CmsSnapshot | null> {
  if (!hasSupabasePublicEnv()) return null;

  try {
    const supabase = createSupabaseDataClient();
    const selectOptional = async <T extends Record<string, unknown>>(table: string, orderBy?: string): Promise<T[]> => {
      try {
        let query = supabase.from(table).select("*");
        if (orderBy) {
          query = query.order(orderBy);
        }
        const result = await query;
        return result.error ? [] : ((result.data ?? []) as T[]);
      } catch {
        return [];
      }
    };

    const [
      pages,
      pageTranslations,
      sections,
      sectionTranslations,
      pageBlocks,
      pageBlockTranslations,
      navItems,
      navTranslations,
      mediaAssets,
      youtubeVideos,
      workProjects,
      workProjectTranslations,
      experiences,
      experienceTranslations,
      certifications,
      certificationTranslations,
      serviceOfferings,
      serviceOfferingTranslations,
      contactChannels,
      contactChannelTranslations,
      siteSettings,
      auditLogs,
    ] = await Promise.all([
      supabase.from("pages").select("*").order("slug"),
      supabase.from("page_translations").select("*"),
      supabase.from("sections").select("*").order("sort_order"),
      supabase.from("section_translations").select("*"),
      supabase.from("page_blocks").select("*").order("sort_order"),
      supabase.from("page_block_translations").select("*"),
      supabase.from("navigation_items").select("*").order("sort_order"),
      supabase.from("navigation_translations").select("*"),
      supabase.from("media_assets").select("*"),
      supabase.from("youtube_videos").select("*").order("sort_order"),
      supabase.from("work_projects").select("*").order("sort_order"),
      supabase.from("work_project_translations").select("*"),
      supabase.from("experiences").select("*").order("sort_order"),
      supabase.from("experience_translations").select("*"),
      supabase.from("certifications").select("*").order("sort_order"),
      supabase.from("certification_translations").select("*"),
      supabase.from("service_offerings").select("*").order("sort_order"),
      supabase.from("service_offering_translations").select("*"),
      supabase.from("contact_channels").select("*").order("sort_order"),
      supabase.from("contact_channel_translations").select("*"),
      supabase.from("site_settings").select("*"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    const [workProjectMedia, workProjectMetrics] = await Promise.all([
      selectOptional<WorkProjectMedia>("work_project_media", "sort_order"),
      selectOptional<WorkProjectMetric>("work_project_metrics", "sort_order"),
    ]);

    const results = [
      pages,
      pageTranslations,
      sections,
      sectionTranslations,
      pageBlocks,
      pageBlockTranslations,
      navItems,
      navTranslations,
      mediaAssets,
      youtubeVideos,
      workProjects,
      workProjectTranslations,
      experiences,
      experienceTranslations,
      certifications,
      certificationTranslations,
      serviceOfferings,
      serviceOfferingTranslations,
      contactChannels,
      contactChannelTranslations,
      siteSettings,
      auditLogs,
    ];

    for (const result of results) {
      if (result.error) throw result.error;
    }

    return {
      pages: pages.data ?? [],
      page_translations: pageTranslations.data ?? [],
      sections: sections.data ?? [],
      section_translations: sectionTranslations.data ?? [],
      page_blocks: pageBlocks.data ?? [],
      page_block_translations: pageBlockTranslations.data ?? [],
      navigation_items: navItems.data ?? [],
      navigation_translations: navTranslations.data ?? [],
      media_assets: mediaAssets.data ?? [],
      youtube_videos: youtubeVideos.data ?? [],
      work_projects: workProjects.data ?? [],
      work_project_translations: workProjectTranslations.data ?? [],
      work_project_media: workProjectMedia,
      work_project_metrics: workProjectMetrics,
      experiences: experiences.data ?? [],
      experience_translations: experienceTranslations.data ?? [],
      certifications: certifications.data ?? [],
      certification_translations: certificationTranslations.data ?? [],
      service_offerings: serviceOfferings.data ?? [],
      service_offering_translations: serviceOfferingTranslations.data ?? [],
      contact_channels: contactChannels.data ?? [],
      contact_channel_translations: contactChannelTranslations.data ?? [],
      site_settings: siteSettings.data ?? [],
      audit_logs: auditLogs.data ?? [],
    };
  } catch {
    return null;
  }
}

async function readSnapshotUncached(): Promise<CmsSnapshot> {
  const remote = await readSnapshotFromSupabase();
  if (!remote || !remote.pages.length) {
    return deepClone(mutableSnapshot);
  }
  return mergeSnapshots(mutableSnapshot, remote);
}

export const readSnapshot = cache(readSnapshotUncached);

export async function readPage(locale: Locale, slug: string): Promise<PageView | null> {
  const snapshot = await readSnapshot();
  const normalized = slug || "home";
  const page = snapshot.pages.find((entry) => entry.slug === normalized);
  if (!page) return null;

  const translation = snapshot.page_translations.find(
    (entry) => entry.page_id === page.id && entry.locale === locale,
  );
  if (!translation) return null;

  const sections = snapshot.sections
    .filter((entry) => entry.page_id === page.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((section) => {
      const content = snapshot.section_translations.find(
        (entry) => entry.section_id === section.id && entry.locale === locale,
      );
      return {
        id: section.id,
        key: section.section_key,
        type: section.section_type,
        order: section.sort_order,
        enabled: section.is_enabled,
        content: content?.content_json ?? {},
      };
    });

  const blocks = snapshot.page_blocks
    .filter((block) => block.page_slug === normalized)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((block) => {
      const content = snapshot.page_block_translations.find(
        (entry) => entry.block_id === block.id && entry.locale === locale,
      );
      return {
        id: block.id,
        type: block.block_type,
        order: block.sort_order,
        enabled: block.is_enabled,
        config: block.config_json ?? {},
        content: content?.content_json ?? {},
      };
    });

  return {
    id: page.id,
    slug: page.slug,
    title: translation.title,
    seo: {
      title: translation.meta_title,
      description: translation.meta_description,
      ogTitle: translation.og_title,
      ogDescription: translation.og_description,
    },
    sections,
    blocks,
  };
}

export async function readNav(locale: Locale) {
  const snapshot = await readSnapshot();
  return snapshot.navigation_items
    .filter((item) => item.is_enabled)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => {
      const translation = snapshot.navigation_translations.find(
        (entry) => entry.nav_item_id === item.id && entry.locale === locale,
      );
      return {
        id: item.id,
        slug: item.href_slug,
        icon: item.icon,
        label: translation?.label ?? item.href_slug,
      };
    });
}

export function getSiteSetting<T extends Record<string, unknown>>(snapshot: CmsSnapshot, key: string, fallback: T): T {
  const setting = snapshot.site_settings.find((entry) => entry.key === key);
  if (!setting) return fallback;
  return setting.value_json as T;
}

export async function readSiteSetting<T extends Record<string, unknown>>(key: string, fallback: T): Promise<T> {
  const snapshot = await readSnapshot();
  return getSiteSetting(snapshot, key, fallback);
}

function updateMutableById<T extends { id: string }>(arr: T[], item: T): void {
  const idx = arr.findIndex((entry) => entry.id === item.id);
  if (idx === -1) {
    arr.push(item);
  } else {
    arr[idx] = item;
  }
}

function deleteMutableById<T extends { id: string }>(arr: T[], id: string): void {
  const idx = arr.findIndex((entry) => entry.id === id);
  if (idx >= 0) arr.splice(idx, 1);
}

export async function readVideos(): Promise<YoutubeVideo[]> {
  const snapshot = await readSnapshot();
  return snapshot.youtube_videos.filter((entry) => entry.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

function parseIsoDurationToClock(value: string): string {
  if (!value) return "00:00";
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "00:00";
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const totalMinutes = hours * 60 + minutes;
  return `${String(totalMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export async function upsertSiteSetting(key: string, value_json: Record<string, unknown>): Promise<void> {
  const idx = mutableSnapshot.site_settings.findIndex((entry) => entry.key === key);
  if (idx === -1) {
    mutableSnapshot.site_settings.push({ key, value_json });
  } else {
    mutableSnapshot.site_settings[idx] = { key, value_json };
  }

  await upsertDbRow("site_settings", { key, value_json });
}

export async function appendAuditLog(log: AuditLog): Promise<void> {
  updateMutableById(mutableSnapshot.audit_logs, log);

  if (!hasDatabaseUrl()) return;
  await upsertDbRow("audit_logs", log);
}

export async function syncYoutubeLatest(options?: { maxResults?: number; channelId?: string }): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY || "";
  const channelId = options?.channelId || process.env.YOUTUBE_CHANNEL_ID || "";
  const maxResults = Math.max(1, Math.min(25, options?.maxResults ?? 12));

  if (!apiKey || !channelId) {
    throw new Error("Missing YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID");
  }

  const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelUrl.searchParams.set("key", apiKey);
  channelUrl.searchParams.set("id", channelId);
  channelUrl.searchParams.set("part", "snippet,statistics");

  const channelRes = await fetch(channelUrl.toString(), { cache: "no-store" });
  if (!channelRes.ok) {
    throw new Error(`YouTube channel failed (${channelRes.status})`);
  }

  const channelJson = (await channelRes.json()) as {
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        description?: string;
        customUrl?: string;
        thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
      };
      statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string };
    }>;
  };

  const channel = channelJson.items?.[0];
  const channelSnippet = channel?.snippet ?? {};
  const channelStats = channel?.statistics ?? {};

  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("channelId", channelId);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("order", "date");
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", String(maxResults));

  const searchRes = await fetch(searchUrl.toString(), { cache: "no-store" });
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed (${searchRes.status})`);
  }

  const searchJson = (await searchRes.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: { title?: string; description?: string; publishedAt?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string } } };
    }>;
  };

  const items = searchJson.items ?? [];
  const videoIds = items.map((item) => item.id?.videoId).filter((id): id is string => Boolean(id));
  if (!videoIds.length) return 0;

  const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  detailsUrl.searchParams.set("key", apiKey);
  detailsUrl.searchParams.set("part", "contentDetails,statistics");
  detailsUrl.searchParams.set("id", videoIds.join(","));

  const detailsRes = await fetch(detailsUrl.toString(), { cache: "no-store" });
  if (!detailsRes.ok) {
    throw new Error(`YouTube details failed (${detailsRes.status})`);
  }

  const detailsJson = (await detailsRes.json()) as {
    items?: Array<{
      id?: string;
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
    }>;
  };

  const detailsMap = new Map<string, { duration: string; views: number }>();
  for (const detail of detailsJson.items ?? []) {
    const id = detail.id;
    if (!id) continue;
    detailsMap.set(id, {
      duration: parseIsoDurationToClock(detail.contentDetails?.duration || "PT0M0S"),
      views: Number(detail.statistics?.viewCount || 0),
    });
  }

  let synced = 0;
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    const id = item.id?.videoId;
    if (!id) continue;

    const snippet = item.snippet || {};
    const detail = detailsMap.get(id) ?? { duration: "00:00", views: 0 };
    const title = snippet.title || id;
    const description = snippet.description || "";
    const thumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || "";

    await upsertVideo({
      id: `yt-${id}`,
      youtube_id: id,
      title_ar: title,
      title_en: title,
      description_ar: description,
      description_en: description,
      thumbnail,
      duration: detail.duration,
      views: detail.views,
      published_at: new Date(snippet.publishedAt || new Date().toISOString()).toISOString(),
      sort_order: i + 1,
      is_featured: i === 0,
      is_active: true,
    });
    synced += 1;
  }

  await upsertSiteSetting("youtube_sync", {
    status: "ok",
    channel_id: channelId,
    synced_count: synced,
    last_sync: new Date().toISOString(),
  });

  await upsertSiteSetting("youtube_channel", {
    channel_id: channel?.id ?? channelId,
    handle: channelSnippet.customUrl ? `@${String(channelSnippet.customUrl).replace(/^@/, "")}` : "",
    title: channelSnippet.title ?? "Mohammad Alfarras",
    avatar: channelSnippet.thumbnails?.high?.url || channelSnippet.thumbnails?.medium?.url || "",
    subscribers: Number(channelStats.subscriberCount || 0),
    videos: Number(channelStats.videoCount || 0),
    views: Number(channelStats.viewCount || 0),
    description_ar: channelSnippet.description ?? "",
    description_en: channelSnippet.description ?? "",
  });

  return synced;
}

export async function upsertVideo(video: YoutubeVideo): Promise<void> {
  updateMutableById(mutableSnapshot.youtube_videos, video);
  await upsertDbRow("youtube_videos", video);
}

export async function upsertWorkProject(project: WorkProject): Promise<void> {
  updateMutableById(mutableSnapshot.work_projects, project);
  await upsertDbRow("work_projects", project);
}

export async function upsertWorkProjectTranslation(payload: {
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
}): Promise<void> {
  const idx = mutableSnapshot.work_project_translations.findIndex(
    (entry) => entry.project_id === payload.project_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.work_project_translations.push(payload);
  } else {
    mutableSnapshot.work_project_translations[idx] = payload;
  }

  await upsertDbRow("work_project_translations", payload);
}

export async function replaceWorkProjectMedia(projectId: string, items: WorkProjectMedia[]): Promise<void> {
  mutableSnapshot.work_project_media = mutableSnapshot.work_project_media.filter((entry) => entry.project_id !== projectId);
  mutableSnapshot.work_project_media.push(...items);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("work_project_media", "project_id", projectId);
  for (const item of items) {
    await upsertDbRow("work_project_media", item);
  }
}

export async function replaceWorkProjectMetrics(projectId: string, items: WorkProjectMetric[]): Promise<void> {
  mutableSnapshot.work_project_metrics = mutableSnapshot.work_project_metrics.filter((entry) => entry.project_id !== projectId);
  mutableSnapshot.work_project_metrics.push(...items);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("work_project_metrics", "project_id", projectId);
  for (const item of items) {
    await upsertDbRow("work_project_metrics", item);
  }
}

export async function deleteWorkProject(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.work_projects, id);
  mutableSnapshot.work_project_translations = mutableSnapshot.work_project_translations.filter((entry) => entry.project_id !== id);
  mutableSnapshot.work_project_media = mutableSnapshot.work_project_media.filter((entry) => entry.project_id !== id);
  mutableSnapshot.work_project_metrics = mutableSnapshot.work_project_metrics.filter((entry) => entry.project_id !== id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("work_projects", "id", id);
}

export async function upsertExperience(experience: Experience): Promise<void> {
  updateMutableById(mutableSnapshot.experiences, experience);

  await upsertDbRow("experiences", experience);
}

export async function upsertExperienceTranslation(payload: {
  experience_id: string;
  locale: Locale;
  role_title: string;
  description: string;
  highlights_json: string[];
}): Promise<void> {
  const idx = mutableSnapshot.experience_translations.findIndex(
    (entry) => entry.experience_id === payload.experience_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.experience_translations.push(payload);
  } else {
    mutableSnapshot.experience_translations[idx] = payload;
  }

  await upsertDbRow("experience_translations", payload);
}

export async function deleteExperience(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.experiences, id);
  mutableSnapshot.experience_translations = mutableSnapshot.experience_translations.filter((entry) => entry.experience_id !== id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("experiences", "id", id);
}

export async function upsertCertification(certification: Certification): Promise<void> {
  updateMutableById(mutableSnapshot.certifications, certification);

  await upsertDbRow("certifications", certification);
}

export async function upsertCertificationTranslation(payload: {
  certification_id: string;
  locale: Locale;
  name: string;
  description: string;
}): Promise<void> {
  const idx = mutableSnapshot.certification_translations.findIndex(
    (entry) => entry.certification_id === payload.certification_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.certification_translations.push(payload);
  } else {
    mutableSnapshot.certification_translations[idx] = payload;
  }

  await upsertDbRow("certification_translations", payload);
}

export async function deleteCertification(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.certifications, id);
  mutableSnapshot.certification_translations = mutableSnapshot.certification_translations.filter((entry) => entry.certification_id !== id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("certifications", "id", id);
}

export async function upsertServiceOffering(service: ServiceOffering): Promise<void> {
  updateMutableById(mutableSnapshot.service_offerings, service);

  await upsertDbRow("service_offerings", service);
}

export async function upsertServiceOfferingTranslation(payload: {
  service_id: string;
  locale: Locale;
  title: string;
  description: string;
  bullets_json: string[];
}): Promise<void> {
  const idx = mutableSnapshot.service_offering_translations.findIndex(
    (entry) => entry.service_id === payload.service_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.service_offering_translations.push(payload);
  } else {
    mutableSnapshot.service_offering_translations[idx] = payload;
  }

  await upsertDbRow("service_offering_translations", payload);
}

export async function deleteServiceOffering(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.service_offerings, id);
  mutableSnapshot.service_offering_translations = mutableSnapshot.service_offering_translations.filter((entry) => entry.service_id !== id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("service_offerings", "id", id);
}

export async function upsertContactChannel(channel: ContactChannel): Promise<void> {
  updateMutableById(mutableSnapshot.contact_channels, channel);

  await upsertDbRow("contact_channels", channel);
}

export async function upsertContactChannelTranslation(payload: {
  channel_id: string;
  locale: Locale;
  label: string;
  description: string;
}): Promise<void> {
  const idx = mutableSnapshot.contact_channel_translations.findIndex(
    (entry) => entry.channel_id === payload.channel_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.contact_channel_translations.push(payload);
  } else {
    mutableSnapshot.contact_channel_translations[idx] = payload;
  }

  await upsertDbRow("contact_channel_translations", payload);
}

export async function deleteContactChannel(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.contact_channels, id);
  mutableSnapshot.contact_channel_translations = mutableSnapshot.contact_channel_translations.filter((entry) => entry.channel_id !== id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("contact_channels", "id", id);
}

export async function upsertPageBlock(block: PageBlock): Promise<void> {
  updateMutableById(mutableSnapshot.page_blocks, block);

  await upsertDbRow("page_blocks", block);
}

export async function upsertPageBlockTranslation(payload: {
  block_id: string;
  locale: Locale;
  content_json: Record<string, unknown>;
}): Promise<void> {
  const idx = mutableSnapshot.page_block_translations.findIndex(
    (entry) => entry.block_id === payload.block_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.page_block_translations.push(payload);
  } else {
    mutableSnapshot.page_block_translations[idx] = payload;
  }

  await upsertDbRow("page_block_translations", payload);
}

export async function deletePageBlock(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.page_blocks, id);
  mutableSnapshot.page_block_translations = mutableSnapshot.page_block_translations.filter((entry) => entry.block_id !== id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("page_blocks", "id", id);
}

export async function duplicatePageBlock(id: string): Promise<void> {
  const target = mutableSnapshot.page_blocks.find((entry) => entry.id === id);
  if (!target) return;

  const clonedId = `blk-${crypto.randomUUID()}`;
  const clone = {
    ...target,
    id: clonedId,
    sort_order: target.sort_order + 1,
  };
  await upsertPageBlock(clone);

  const translations = mutableSnapshot.page_block_translations.filter((entry) => entry.block_id === id);
  for (const tr of translations) {
    await upsertPageBlockTranslation({
      block_id: clonedId,
      locale: tr.locale,
      content_json: tr.content_json,
    });
  }
}

export async function publishPageBySlug(slug: string, status: PageStatus): Promise<void> {
  const page = mutableSnapshot.pages.find((entry) => entry.slug === slug);
  if (page) {
    page.status = status;
    page.updated_at = new Date().toISOString();
  }

  if (!hasDatabaseUrl() || !page) return;
  await updateWhere("pages", "id", page.id, { status, updated_at: page.updated_at });
}

export async function updatePageCore(
  id: string,
  payload: { status: PageStatus; template: string },
): Promise<void> {
  const page = mutableSnapshot.pages.find((entry) => entry.id === id);
  if (page) {
    page.status = payload.status;
    page.template = payload.template;
    page.updated_at = new Date().toISOString();
  }

  if (!hasDatabaseUrl()) return;
  await updateWhere("pages", "id", id, {
    status: payload.status,
    template: payload.template,
    updated_at: new Date().toISOString(),
  });
}

export async function updatePageTranslation(
  pageId: string,
  locale: Locale,
  payload: {
    title: string;
    meta_title: string;
    meta_description: string;
    og_title: string;
    og_description: string;
  },
): Promise<void> {
  const translation = mutableSnapshot.page_translations.find(
    (entry) => entry.page_id === pageId && entry.locale === locale,
  );

  if (translation) {
    translation.title = payload.title;
    translation.meta_title = payload.meta_title;
    translation.meta_description = payload.meta_description;
    translation.og_title = payload.og_title;
    translation.og_description = payload.og_description;
  }

  await upsertDbRow("page_translations", {
    page_id: pageId,
    locale,
    ...payload,
  });
}

export async function updateSectionCore(
  id: string,
  payload: { sort_order: number; is_enabled: boolean },
): Promise<void> {
  const section = mutableSnapshot.sections.find((entry) => entry.id === id);
  if (section) {
    section.sort_order = payload.sort_order;
    section.is_enabled = payload.is_enabled;
  }

  if (!hasDatabaseUrl()) return;
  await updateWhere("sections", "id", id, {
    sort_order: payload.sort_order,
    is_enabled: payload.is_enabled,
  });
}

export async function updateSectionTranslation(
  sectionId: string,
  locale: Locale,
  contentJson: Record<string, unknown>,
): Promise<void> {
  const translation = mutableSnapshot.section_translations.find(
    (entry) => entry.section_id === sectionId && entry.locale === locale,
  );
  if (translation) {
    translation.content_json = contentJson;
  }

  await upsertDbRow("section_translations", {
    section_id: sectionId,
    locale,
    content_json: contentJson,
  });
}

export async function updateNavigationItem(
  id: string,
  payload: {
    href_slug: string;
    icon: string;
    sort_order: number;
    is_enabled: boolean;
  },
): Promise<void> {
  const item = mutableSnapshot.navigation_items.find((entry) => entry.id === id);
  if (item) {
    item.href_slug = payload.href_slug;
    item.icon = payload.icon;
    item.sort_order = payload.sort_order;
    item.is_enabled = payload.is_enabled;
  }

  if (!hasDatabaseUrl()) return;
  await updateWhere("navigation_items", "id", id, {
    href_slug: payload.href_slug,
    icon: payload.icon,
    sort_order: payload.sort_order,
    is_enabled: payload.is_enabled,
  });
}

export async function updateNavigationTranslation(
  navItemId: string,
  locale: Locale,
  label: string,
): Promise<void> {
  const translation = mutableSnapshot.navigation_translations.find(
    (entry) => entry.nav_item_id === navItemId && entry.locale === locale,
  );
  if (translation) {
    translation.label = label;
  }

  await upsertDbRow("navigation_translations", {
    nav_item_id: navItemId,
    locale,
    label,
  });
}

export async function upsertMediaAsset(asset: MediaAsset): Promise<void> {
  updateMutableById(mutableSnapshot.media_assets, asset);

  await upsertDbRow("media_assets", asset);
}

export async function deleteMediaAsset(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.media_assets, id);

  if (!hasDatabaseUrl()) return;
  await deleteWhere("media_assets", "id", id);
}

export async function uploadMediaToStorage(params: {
  bucket?: string;
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}): Promise<{ path: string; publicUrl: string }> {
  const supabase = createSupabaseAdminClient();
  const bucket = params.bucket ?? "media";
  const storagePath = `${new Date().getFullYear()}/${crypto.randomUUID()}-${params.filename}`;
  const blob = new Blob([Buffer.from(params.bytes)], { type: params.contentType || "application/octet-stream" });

  await supabase.storage.createBucket(bucket, { public: true }).catch(() => null);

  const upload = await supabase.storage.from(bucket).upload(storagePath, blob, {
    cacheControl: "3600",
    contentType: params.contentType || "application/octet-stream",
    upsert: false,
  });
  if (upload.error) {
    throw new Error(upload.error.message);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return {
    path: `${bucket}/${storagePath}`,
    publicUrl: data.publicUrl,
  };
}
