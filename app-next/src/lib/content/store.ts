import { createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import type { CmsSnapshot, Locale, PageView, ThemeMode, ThemeToken, YoutubeVideo } from "@/types/cms";
import { defaultSnapshot } from "@/data/default-content";

const mutableSnapshot: CmsSnapshot = structuredClone(defaultSnapshot);

function deepClone<T>(input: T): T {
  return structuredClone(input);
}

async function readSnapshotFromSupabase(): Promise<CmsSnapshot | null> {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  try {
    const supabase = createSupabaseDataClient();

    const [
      pages,
      pageTranslations,
      sections,
      sectionTranslations,
      navItems,
      navTranslations,
      themeTokens,
      mediaAssets,
      youtubeVideos,
      siteSettings,
      auditLogs,
    ] = await Promise.all([
      supabase.from("pages").select("*").order("slug"),
      supabase.from("page_translations").select("*"),
      supabase.from("sections").select("*").order("sort_order"),
      supabase.from("section_translations").select("*"),
      supabase.from("navigation_items").select("*").order("sort_order"),
      supabase.from("navigation_translations").select("*"),
      supabase.from("theme_tokens").select("*"),
      supabase.from("media_assets").select("*"),
      supabase.from("youtube_videos").select("*").order("sort_order"),
      supabase.from("site_settings").select("*"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    ]);

    const results = [
      pages,
      pageTranslations,
      sections,
      sectionTranslations,
      navItems,
      navTranslations,
      themeTokens,
      mediaAssets,
      youtubeVideos,
      siteSettings,
      auditLogs,
    ];

    for (const result of results) {
      if (result.error) {
        throw result.error;
      }
    }

    return {
      pages: pages.data ?? [],
      page_translations: pageTranslations.data ?? [],
      sections: sections.data ?? [],
      section_translations: sectionTranslations.data ?? [],
      navigation_items: navItems.data ?? [],
      navigation_translations: navTranslations.data ?? [],
      theme_tokens: themeTokens.data ?? [],
      media_assets: mediaAssets.data ?? [],
      youtube_videos: youtubeVideos.data ?? [],
      site_settings: siteSettings.data ?? [],
      audit_logs: auditLogs.data ?? [],
    } as CmsSnapshot;
  } catch {
    return null;
  }
}

export async function readSnapshot(): Promise<CmsSnapshot> {
  const remote = await readSnapshotFromSupabase();
  if (!remote) {
    return deepClone(mutableSnapshot);
  }

  if (!remote.pages.length) {
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

export async function updateThemeToken(mode: ThemeMode, tokenKey: string, value: string): Promise<void> {
  const token = mutableSnapshot.theme_tokens.find(
    (entry) => entry.mode === mode && entry.token_key === tokenKey,
  );

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
  await supabase
    .from("theme_tokens")
    .upsert(
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

export async function upsertVideo(video: YoutubeVideo): Promise<void> {
  const index = mutableSnapshot.youtube_videos.findIndex((entry) => entry.id === video.id);
  if (index === -1) {
    mutableSnapshot.youtube_videos.push(video);
  } else {
    mutableSnapshot.youtube_videos[index] = video;
  }

  if (!hasSupabasePublicEnv()) return;

  const supabase = createSupabaseDataClient();
  await supabase.from("youtube_videos").upsert(video, { onConflict: "id" });
}
