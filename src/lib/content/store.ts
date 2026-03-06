import { createSupabaseAdminClient, createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import type {
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
  ThemeMode,
  ThemeToken,
  WorkProject,
  YoutubeVideo,
} from "@/types/cms";
import { defaultSnapshot } from "@/data/default-content";

const mutableSnapshot: CmsSnapshot = structuredClone(defaultSnapshot);

function deepClone<T>(input: T): T {
  return structuredClone(input);
}

async function readSnapshotFromSupabase(): Promise<CmsSnapshot | null> {
  if (!hasSupabasePublicEnv()) return null;

  try {
    const supabase = createSupabaseDataClient();

    const [
      pages,
      pageTranslations,
      sections,
      sectionTranslations,
      pageBlocks,
      pageBlockTranslations,
      navItems,
      navTranslations,
      themeTokens,
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
      supabase.from("theme_tokens").select("*"),
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

    const results = [
      pages,
      pageTranslations,
      sections,
      sectionTranslations,
      pageBlocks,
      pageBlockTranslations,
      navItems,
      navTranslations,
      themeTokens,
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
      theme_tokens: themeTokens.data ?? [],
      media_assets: mediaAssets.data ?? [],
      youtube_videos: youtubeVideos.data ?? [],
      work_projects: workProjects.data ?? [],
      work_project_translations: workProjectTranslations.data ?? [],
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

export async function readSnapshot(): Promise<CmsSnapshot> {
  const remote = await readSnapshotFromSupabase();
  if (!remote || !remote.pages.length) {
    return deepClone(mutableSnapshot);
  }
  return remote;
}

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

export async function readThemeTokens(mode: ThemeMode): Promise<ThemeToken[]> {
  const snapshot = await readSnapshot();
  return snapshot.theme_tokens.filter((token) => token.mode === mode);
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

export async function updateThemeToken(mode: ThemeMode, tokenKey: string, value: string): Promise<void> {
  const token = mutableSnapshot.theme_tokens.find((entry) => entry.mode === mode && entry.token_key === tokenKey);
  if (!token) {
    mutableSnapshot.theme_tokens.push({
      id: `custom-${mode}-${tokenKey}`,
      mode,
      token_key: tokenKey,
      token_value: value,
    });
  } else {
    token.token_value = value;
  }

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("theme_tokens").upsert(
    {
      id: token?.id ?? `custom-${mode}-${tokenKey}`,
      mode,
      token_key: tokenKey,
      token_value: value,
    },
    { onConflict: "mode,token_key" },
  );
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

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("site_settings").upsert({ key, value_json }, { onConflict: "key" });
}

export async function syncYoutubeLatest(options?: { maxResults?: number; channelId?: string }): Promise<number> {
  const apiKey = process.env.YOUTUBE_API_KEY || "";
  const channelId = options?.channelId || process.env.YOUTUBE_CHANNEL_ID || "";
  const maxResults = Math.max(1, Math.min(25, options?.maxResults ?? 12));

  if (!apiKey || !channelId) {
    throw new Error("Missing YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID");
  }

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

  return synced;
}

export async function upsertVideo(video: YoutubeVideo): Promise<void> {
  updateMutableById(mutableSnapshot.youtube_videos, video);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("youtube_videos").upsert(video, { onConflict: "id" });
}

export async function upsertWorkProject(project: WorkProject): Promise<void> {
  updateMutableById(mutableSnapshot.work_projects, project);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("work_projects").upsert(project, { onConflict: "id" });
}

export async function upsertWorkProjectTranslation(payload: {
  project_id: string;
  locale: Locale;
  title: string;
  summary: string;
  description: string;
  cta_label: string;
}): Promise<void> {
  const idx = mutableSnapshot.work_project_translations.findIndex(
    (entry) => entry.project_id === payload.project_id && entry.locale === payload.locale,
  );
  if (idx === -1) {
    mutableSnapshot.work_project_translations.push(payload);
  } else {
    mutableSnapshot.work_project_translations[idx] = payload;
  }

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("work_project_translations").upsert(payload, { onConflict: "project_id,locale" });
}

export async function deleteWorkProject(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.work_projects, id);
  mutableSnapshot.work_project_translations = mutableSnapshot.work_project_translations.filter((entry) => entry.project_id !== id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("work_projects").delete().eq("id", id);
}

export async function upsertExperience(experience: Experience): Promise<void> {
  updateMutableById(mutableSnapshot.experiences, experience);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("experiences").upsert(experience, { onConflict: "id" });
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

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("experience_translations").upsert(payload, { onConflict: "experience_id,locale" });
}

export async function deleteExperience(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.experiences, id);
  mutableSnapshot.experience_translations = mutableSnapshot.experience_translations.filter((entry) => entry.experience_id !== id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("experiences").delete().eq("id", id);
}

export async function upsertCertification(certification: Certification): Promise<void> {
  updateMutableById(mutableSnapshot.certifications, certification);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("certifications").upsert(certification, { onConflict: "id" });
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

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("certification_translations").upsert(payload, { onConflict: "certification_id,locale" });
}

export async function deleteCertification(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.certifications, id);
  mutableSnapshot.certification_translations = mutableSnapshot.certification_translations.filter((entry) => entry.certification_id !== id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("certifications").delete().eq("id", id);
}

export async function upsertServiceOffering(service: ServiceOffering): Promise<void> {
  updateMutableById(mutableSnapshot.service_offerings, service);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("service_offerings").upsert(service, { onConflict: "id" });
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

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("service_offering_translations").upsert(payload, { onConflict: "service_id,locale" });
}

export async function deleteServiceOffering(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.service_offerings, id);
  mutableSnapshot.service_offering_translations = mutableSnapshot.service_offering_translations.filter((entry) => entry.service_id !== id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("service_offerings").delete().eq("id", id);
}

export async function upsertContactChannel(channel: ContactChannel): Promise<void> {
  updateMutableById(mutableSnapshot.contact_channels, channel);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("contact_channels").upsert(channel, { onConflict: "id" });
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

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("contact_channel_translations").upsert(payload, { onConflict: "channel_id,locale" });
}

export async function deleteContactChannel(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.contact_channels, id);
  mutableSnapshot.contact_channel_translations = mutableSnapshot.contact_channel_translations.filter((entry) => entry.channel_id !== id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("contact_channels").delete().eq("id", id);
}

export async function upsertPageBlock(block: PageBlock): Promise<void> {
  updateMutableById(mutableSnapshot.page_blocks, block);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("page_blocks").upsert(block, { onConflict: "id" });
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

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("page_block_translations").upsert(payload, { onConflict: "block_id,locale" });
}

export async function deletePageBlock(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.page_blocks, id);
  mutableSnapshot.page_block_translations = mutableSnapshot.page_block_translations.filter((entry) => entry.block_id !== id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("page_blocks").delete().eq("id", id);
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

  if (!hasSupabasePublicEnv() || !page) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("pages").update({ status, updated_at: page.updated_at }).eq("id", page.id);
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

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase
    .from("pages")
    .update({
      status: payload.status,
      template: payload.template,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
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

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase.from("page_translations").upsert(
    {
      page_id: pageId,
      locale,
      ...payload,
    },
    { onConflict: "page_id,locale" },
  );
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

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase
    .from("sections")
    .update({
      sort_order: payload.sort_order,
      is_enabled: payload.is_enabled,
    })
    .eq("id", id);
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

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase.from("section_translations").upsert(
    {
      section_id: sectionId,
      locale,
      content_json: contentJson,
    },
    { onConflict: "section_id,locale" },
  );
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

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase
    .from("navigation_items")
    .update({
      href_slug: payload.href_slug,
      icon: payload.icon,
      sort_order: payload.sort_order,
      is_enabled: payload.is_enabled,
    })
    .eq("id", id);
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

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase.from("navigation_translations").upsert(
    {
      nav_item_id: navItemId,
      locale,
      label,
    },
    { onConflict: "nav_item_id,locale" },
  );
}

export async function upsertMediaAsset(asset: MediaAsset): Promise<void> {
  updateMutableById(mutableSnapshot.media_assets, asset);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("media_assets").upsert(asset, { onConflict: "id" });
}

export async function deleteMediaAsset(id: string): Promise<void> {
  deleteMutableById(mutableSnapshot.media_assets, id);

  if (!hasSupabasePublicEnv()) return;
  const supabase = createSupabaseDataClient();
  await supabase.from("media_assets").delete().eq("id", id);
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

