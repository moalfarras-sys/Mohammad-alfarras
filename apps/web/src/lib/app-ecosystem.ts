import { readSiteSetting, upsertSiteSetting } from "@/lib/content/store";
import { hasDatabaseUrl, queryRows } from "@/lib/server-db";
import { createSupabaseAdminClient, createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { managedApps, resolveManagedAppSlug } from "@moalfarras/shared/app-products";
import type {
  AppEcosystemData,
  AppFaq,
  AppFeatureItem,
  AppProduct,
  AppRelease,
  AppReleaseAsset,
  AppScreenshot,
  AppStepItem,
  AppSupportRequest,
} from "@/types/app-ecosystem";

const now = new Date().toISOString();
const moplayerDownloadUrls = {
  universal: "/downloads/moplayer/app-sideload-universal-release.apk",
};

function parseFeatureList(value: unknown, fallback: AppFeatureItem[]): AppFeatureItem[] {
  if (!Array.isArray(value)) return fallback;
  const items: AppFeatureItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const title = String(record.title ?? "").trim();
    const body = String(record.body ?? "").trim();
    const icon = String(record.icon ?? "").trim();
    if (!title || !body) continue;
    items.push({ title, body, icon: icon || undefined });
  }
  return items.length ? items : fallback;
}

function parseStepsList(value: unknown, fallback: AppStepItem[]): AppStepItem[] {
  if (!Array.isArray(value)) return fallback;
  const items: AppStepItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const title = String(record.title ?? "").trim();
    const body = String(record.body ?? "").trim();
    if (!title || !body) continue;
    items.push({ title, body });
  }
  return items.length ? items : fallback;
}

function parseStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return items.length ? items : fallback;
}

const fallbackProduct: AppProduct = {
  id: "moplayer-product",
  slug: "moplayer",
  product_name: "MoPlayer",
  hero_badge: "Android TV + Android Media Experience",
  tagline: "A focused media player surface for Android and Android TV.",
  short_description:
    "MoPlayer is a personal Android and Android TV media product with a clear release, support, and privacy story.",
  long_description:
    "MoPlayer is presented as a serious product surface inside the Moalfarras ecosystem: product positioning, APK releases, installation guidance, support, privacy notes, and case-study context in one place.",
  support_email: "Mohammad.Alfarras@gmail.com",
  support_whatsapp: "https://wa.me/4917623419358",
  support_url: null,
  privacy_path: "/privacy",
  play_store_url: null,
  package_name: "com.mo.moplayer",
  android_min_sdk: 24,
  android_target_sdk: 35,
  android_tv_ready: true,
  default_download_label: "Download APK",
  feature_highlights: [
    { title: "Android and Android TV", body: "Presented as one product surface across phone and TV contexts.", icon: "tv" },
    { title: "Release details", body: "Version, SDK, APK size, and architecture are shown from release data.", icon: "zap" },
    { title: "Legal clarity", body: "The product states what it does not provide: channels, playlists, subscriptions, or copyrighted media.", icon: "shield" },
    { title: "Integrated support", body: "Support and privacy live in the same site architecture as the product page.", icon: "shield" },
  ],
  how_it_works: [
    { title: "Download the APK", body: "Use the latest release route from the product page." },
    { title: "Install on Android", body: "Allow installation from this source only when you trust the download." },
    { title: "Use permitted sources", body: "Connect only media sources you are allowed to use." },
  ],
  install_steps: [
    { title: "Download the APK", body: "Use the latest release below and choose the recommended build for your device." },
    { title: "Allow installation", body: "Enable install from trusted sources if Android asks for permission." },
    { title: "Open and configure", body: "Launch MoPlayer, add your provider details, and start browsing immediately." },
  ],
  compatibility_notes: [
    "Android 7.0+ (API 24 and above)",
    "Positioned for Android TV and remote-based navigation",
    "Recommended TV download is the v2.2 full universal APK for Android 7.0+ TV devices",
  ],
  legal_notes: [
    "MoPlayer is a playback interface. It does not provide channels, playlists, or copyrighted media.",
    "Users are responsible for the legality of the content sources they connect.",
  ],
  changelog_intro: "Each release keeps the product story focused on compatibility, installation clarity, and support.",
  logo_path: "/images/moplayer-brand-logo-final.png",
  hero_image_path: "/images/moplayer-tv-hero.png",
  tv_banner_path: "/images/moplayer-tv-banner-final.png",
  status: "published",
  last_updated_at: now,
  created_at: now,
  updated_at: now,
};

const fallbackScreenshots: AppScreenshot[] = [
  {
    id: "moplayer-screen-1",
    product_slug: "moplayer",
    title: "TV product showcase",
    alt_text: "MoPlayer cinematic Android TV product preview",
    image_path: "/images/moplayer-hero-3d-final.png",
    device_frame: "tv",
    sort_order: 1,
    is_featured: true,
    created_at: now,
  },
  {
    id: "moplayer-screen-2",
    product_slug: "moplayer",
    title: "Guided activation",
    alt_text: "MoPlayer guided activation and source setup preview",
    image_path: "/images/moplayer-activation-flow.webp",
    device_frame: "phone",
    sort_order: 2,
    is_featured: false,
    created_at: now,
  },
  {
    id: "moplayer-screen-3",
    product_slug: "moplayer",
    title: "Android TV presence",
    alt_text: "MoPlayer Android TV banner",
    image_path: "/images/moplayer-tv-banner-final.png",
    device_frame: "tv",
    sort_order: 3,
    is_featured: false,
    created_at: now,
  },
  {
    id: "moplayer-screen-4",
    product_slug: "moplayer",
    title: "Release center",
    alt_text: "MoPlayer universal APK release and download preview",
    image_path: "/images/moplayer-release-panel.webp",
    device_frame: "tv",
    sort_order: 4,
    is_featured: false,
    created_at: now,
  },
];

const fallbackFaqs: AppFaq[] = [
  {
    id: "faq-1",
    product_slug: "moplayer",
    question: "Does MoPlayer include channels or playlists?",
    answer: "No. MoPlayer is a player shell only. You connect your own supported source.",
    sort_order: 1,
    created_at: now,
  },
  {
    id: "faq-2",
    product_slug: "moplayer",
    question: "Is the app built for Android TV?",
    answer: "Yes. The interface and navigation flow are optimized for Android TV and remote control usage.",
    sort_order: 2,
    created_at: now,
  },
  {
    id: "faq-3",
    product_slug: "moplayer",
    question: "Is there a Google Play release already?",
    answer: "No public Google Play release is shown until a real listing exists.",
    sort_order: 3,
    created_at: now,
  },
];

const fallbackSupportRequests: AppSupportRequest[] = [];

const fallbackReleases: AppRelease[] = [
  {
    id: "release-moplayer-2-2-16",
    product_slug: "moplayer",
    slug: "moplayer-2.2.16",
    version_name: "2.2.16",
    version_code: 22,
    release_notes:
      "MoPlayer Classic 2.2.16 keeps the 2.2.15 speed and football-data fixes, removes the duplicate Home watch-history row, and keeps only the working Continue watching row with resume progress.",
    compatibility_notes: "Recommended universal TV APK for Android 7.0+ with arm64-v8a and armeabi-v7a native code included.",
    published_at: now,
    is_published: true,
    created_at: now,
    updated_at: now,
    assets: [
      {
        id: "asset-moplayer-2-2-16-universal",
        release_id: "release-moplayer-2-2-16",
        asset_type: "apk",
        label: "Recommended TV APK",
        abi: "universal",
        storage_bucket: null,
        storage_path: null,
        external_url: moplayerDownloadUrls.universal,
        mime_type: "application/vnd.android.package-archive",
        file_size_bytes: 52792635,
        checksum_sha256: "79701639678373dda3b44c07347c22bd799975767a2eb260943c50609f1f9a0d",
        is_primary: true,
        created_at: now,
      },
    ],
  },
];

const fallbackProductBySlug: Record<string, AppProduct> = {
  moplayer: fallbackProduct,
  moplayer2: {
    ...fallbackProduct,
    id: "moplayer2-product",
    slug: "moplayer2",
    product_name: "MoPlayer Pro",
    hero_badge: "Next Android TV Media Experience",
    tagline: "Premium Android TV media playback with QR activation and receiver-style Live IPTV controls.",
    short_description:
      "MoPlayer Pro is the new Android and Android TV app line in the Moalfarras ecosystem, separated from the classic MoPlayer release channel.",
    long_description:
      "MoPlayer Pro keeps the same domain, admin, and Supabase foundation while giving the new app its own public page, screenshots, releases, FAQs, support queue, runtime controls, and QR activation flow.",
    package_name: "com.moalfarras.moplayerpro",
    default_download_label: "Download MoPlayer Pro APK",
    feature_highlights: [
      { title: "Pro product line", body: "MoPlayer Pro has its own page, release channel, activation flow, and admin records.", icon: "box" },
      { title: "Same trusted website", body: "Users still download and verify through moalfarras.space.", icon: "shield" },
      { title: "TV-first direction", body: "Built for Android TV navigation and long-session media browsing.", icon: "tv" },
      { title: "Ready for growth", body: "The structure supports future activation, runtime config, and support per app.", icon: "zap" },
    ],
    how_it_works: [
      { title: "Choose MoPlayer Pro", body: "Open the MoPlayer Pro product page from the Apps section." },
      { title: "Download the correct APK", body: "Use the latest MoPlayer Pro release when it is published." },
      { title: "Manage separately", body: "Control MoPlayer Pro from the same admin with its own product switch." },
    ],
    install_steps: [
      { title: "Download MoPlayer Pro", body: "Use the MoPlayer Pro release card on this page." },
      { title: "Allow installation", body: "Enable install from trusted sources if Android asks." },
      { title: "Open and configure", body: "Launch MoPlayer Pro and connect only sources you are allowed to use." },
    ],
    compatibility_notes: [
      "Android 7.0+ (API 24 and above)",
      "Separated from the classic MoPlayer public release channel",
      "Designed for Android TV and remote-first navigation",
    ],
    changelog_intro: "MoPlayer Pro releases are tracked separately from the classic MoPlayer app.",
    logo_path: "/images/moplayer-icon-512.png",
    hero_image_path: "/images/moplayer-pro-hero.webp",
    tv_banner_path: "/images/moplayer-pro-hero.webp",
  },
};

const fallbackScreenshotsBySlug: Record<string, AppScreenshot[]> = {
  moplayer: fallbackScreenshots,
  moplayer2: [
    { id: "moplayer2-screen-1", product_slug: "moplayer2", title: "Home Screen", alt_text: "MoPlayer Pro warm gold home screen with widgets and content rows", image_path: "/images/moplayer-pro-home.webp", device_frame: "tv", sort_order: 1, is_featured: true, created_at: now },
    { id: "moplayer2-screen-2", product_slug: "moplayer2", title: "Activation Flow", alt_text: "MoPlayer Pro QR activation and website pairing flow", image_path: "/images/moplayer-pro-activation.webp", device_frame: "tv", sort_order: 2, is_featured: false, created_at: now },
    { id: "moplayer2-screen-3", product_slug: "moplayer2", title: "Player Controls", alt_text: "MoPlayer Pro warm glass player controls and channel list", image_path: "/images/moplayer-pro-player.webp", device_frame: "tv", sort_order: 3, is_featured: false, created_at: now },
    { id: "moplayer2-screen-4", product_slug: "moplayer2", title: "TV and Phone", alt_text: "MoPlayer Pro product preview on TV and phone", image_path: "/images/moplayer-pro-hero.webp", device_frame: "tv", sort_order: 4, is_featured: false, created_at: now },
  ],
};

const fallbackFaqsBySlug: Record<string, AppFaq[]> = {
  moplayer: fallbackFaqs,
  moplayer2: fallbackFaqs.map((item, index) => ({
    ...item,
    id: `moplayer2-faq-${index + 1}`,
    product_slug: "moplayer2",
    question: item.question.replace("MoPlayer", "MoPlayer Pro"),
    answer: item.answer.replace("MoPlayer", "MoPlayer Pro"),
  })),
};

const fallbackReleasesBySlug: Record<string, AppRelease[]> = {
  moplayer: fallbackReleases,
  moplayer2: [
    {
      ...fallbackReleases[0],
      id: "release-moplayer2-v2-5-20",
      product_slug: "moplayer2",
      slug: "moplayer2-v2.5.20-full",
      version_name: "2.5.20",
      version_code: 58,
      release_notes:
        "MoPlayer Pro 2.5.20 hardens live and series playback for large Xtream panels: slow get_series_info calls retry with a longer Xtream API timeout, episodes use direct_source and normalized container extensions when available, Xtream VOD/episodes try compatible containers before fallback, and weak-device live playback switches recovery paths faster when video does not render.",
      compatibility_notes: "Recommended universal MoPlayer Pro APK for Android 6.0+ and Android TV devices with ARM 32-bit or 64-bit processors.",
      assets: [
        {
          ...fallbackReleases[0].assets[0],
          id: "asset-moplayer2-v2-5-20-universal",
          release_id: "release-moplayer2-v2-5-20",
          label: "MoPlayer Pro Universal Android TV APK",
          abi: "universal",
          external_url: "/downloads/moplayer2/app-release.apk",
          file_size_bytes: 49260800,
          checksum_sha256: "477beee677797ae489ec6afce71fe369a31f020ecb18fd3d12ec0d4192907a0f",
        },
      ],
    },
  ],
};

function fallbackFor(productSlug: string) {
  const slug = resolveManagedAppSlug(productSlug);
  return {
    product: fallbackProductBySlug[slug],
    screenshots: fallbackScreenshotsBySlug[slug],
    faqs: fallbackFaqsBySlug[slug],
    releases: fallbackReleasesBySlug[slug],
  };
}

function getRuntimeConfigKey(productSlug: string) {
  return `${resolveManagedAppSlug(productSlug)}_public_config`;
}

function fallbackDownloaderCode(productSlug: string) {
  return resolveManagedAppSlug(productSlug) === "moplayer2" ? "4608937" : "2418397";
}

function runtimeConfigSummary(value: unknown, productSlug: string): AppEcosystemData["runtimeConfig"] {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const downloaderCode = String(record.downloaderCode ?? fallbackDownloaderCode(productSlug)).trim();
  return {
    enabled: record.enabled === false ? false : true,
    maintenanceMode: record.maintenanceMode === true,
    message: typeof record.message === "string" ? record.message : "",
    downloaderCode,
  };
}

function asSiteSettingValue<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

function normalizeProduct(row: Partial<AppProduct> | null | undefined, productSlug = "moplayer"): AppProduct {
  const fallback = fallbackFor(productSlug).product;
  if (!row) return fallback;
  const merged = {
    ...fallback,
    ...row,
    feature_highlights: parseFeatureList(row.feature_highlights, fallback.feature_highlights),
    how_it_works: parseStepsList(row.how_it_works, fallback.how_it_works),
    install_steps: parseStepsList(row.install_steps, fallback.install_steps),
    compatibility_notes: parseStringList(row.compatibility_notes, fallback.compatibility_notes),
    legal_notes: parseStringList(row.legal_notes, fallback.legal_notes),
  };
  if (resolveManagedAppSlug(productSlug) === "moplayer2") {
    return {
      ...merged,
      logo_path: normalizeProAssetPath(merged.logo_path, fallback.logo_path),
      hero_image_path: normalizeProAssetPath(merged.hero_image_path, fallback.hero_image_path),
      tv_banner_path: normalizeProAssetPath(merged.tv_banner_path, fallback.tv_banner_path),
    };
  }
  return merged;
}

function normalizeProAssetPath(value: string | null | undefined, fallback: string | null) {
  const path = String(value ?? "").trim();
  if (!path) return fallback;
  const classicOnly = [
    "/images/moplayer-icon-512.png",
    "/images/moplayer-brand-logo-final.png",
    "/images/moplayer-tv-banner.png",
    "/images/moplayer-tv-banner-final.png",
    "/images/moplayer-tv-hero.png",
    "/images/moplayer-hero-3d-final.png",
    "/images/moplayer-app-cover.jpeg",
  ];
  return classicOnly.includes(path) ? fallback : path;
}

function normalizeScreenshots(items: AppScreenshot[], productSlug: string): AppScreenshot[] {
  const slug = resolveManagedAppSlug(productSlug);
  if (slug !== "moplayer2") return items;
  const classicOnly = ["/images/moplayer-tv-banner.png", "/images/moplayer-tv-banner-final.png", "/images/moplayer_ui_now_playing.png", "/images/moplayer_ui_playlist.png"];
  const filtered = items.filter((item) => !classicOnly.includes(item.image_path));
  return filtered.length ? filtered : fallbackFor(slug).screenshots;
}

function normalizeAppEcosystemData(data: AppEcosystemData, productSlug: string): AppEcosystemData {
  return {
    ...data,
    product: normalizeProduct(data.product, productSlug),
    screenshots: normalizeScreenshots(data.screenshots, productSlug),
  };
}

function normalizeAsset(row: Record<string, unknown>): AppReleaseAsset {
  const rawExternalUrl = row.external_url ? String(row.external_url) : null;
  return {
    id: String(row.id),
    release_id: String(row.release_id),
    asset_type: "apk",
    label: String(row.label ?? "APK"),
    abi: row.abi ? String(row.abi) : null,
    storage_bucket: row.storage_bucket ? String(row.storage_bucket) : null,
    storage_path: row.storage_path ? String(row.storage_path) : null,
    external_url: normalizeReleaseAssetUrl(rawExternalUrl),
    mime_type: String(row.mime_type ?? "application/vnd.android.package-archive"),
    file_size_bytes: typeof row.file_size_bytes === "number" ? row.file_size_bytes : Number(row.file_size_bytes ?? 0) || null,
    checksum_sha256: row.checksum_sha256 ? String(row.checksum_sha256) : null,
    is_primary: Boolean(row.is_primary),
    created_at: String(row.created_at ?? now),
  };
}

function normalizeReleaseAssetUrl(url: string | null) {
  if (!url) return null;
  if (url.includes("raw.githubusercontent.com/moalfarras-sys/Mohammad-alfarras/")) return null;
  return url;
}

function normalizeRelease(row: Record<string, unknown>, assets: AppReleaseAsset[]): AppRelease {
  return {
    id: String(row.id),
    product_slug: String(row.product_slug ?? "moplayer"),
    slug: String(row.slug),
    version_name: String(row.version_name),
    version_code: Number(row.version_code),
    release_notes: String(row.release_notes ?? ""),
    compatibility_notes: String(row.compatibility_notes ?? ""),
    published_at: String(row.published_at ?? now),
    is_published: Boolean(row.is_published),
    created_at: String(row.created_at ?? now),
    updated_at: String(row.updated_at ?? now),
    assets,
  };
}

async function readLegacyAppSettings(productSlug = "moplayer"): Promise<AppEcosystemData> {
  const slug = resolveManagedAppSlug(productSlug);
  const fallback = fallbackFor(slug);
  const prefix = `${slug}_app`;
  const [product, screenshots, faqs, releases] = await Promise.all([
    readSiteSetting(`${prefix}_product`, fallback.product),
    readSiteSetting(`${prefix}_screenshots`, asSiteSettingValue(fallback.screenshots)),
    readSiteSetting(`${prefix}_faqs`, asSiteSettingValue(fallback.faqs)),
    readSiteSetting(`${prefix}_releases`, asSiteSettingValue(fallback.releases)),
  ]);

  return normalizeAppEcosystemData({
    product: normalizeProduct(product as Partial<AppProduct>, slug),
    screenshots: (Array.isArray(screenshots) ? screenshots : fallback.screenshots) as AppScreenshot[],
    faqs: (Array.isArray(faqs) ? faqs : fallback.faqs) as AppFaq[],
    releases: (Array.isArray(releases) ? releases : fallback.releases) as AppRelease[],
    runtimeConfig: runtimeConfigSummary(null, slug),
  }, slug);
}

export async function readAppEcosystem(productSlug = "moplayer"): Promise<AppEcosystemData> {
  const slug = resolveManagedAppSlug(productSlug);
  const fallback = fallbackFor(slug);
  if (!hasSupabasePublicEnv()) {
    return readLegacyAppSettings(slug);
  }

  try {
    const supabase = createSupabaseDataClient();
    const [productRes, screenshotsRes, faqRes, releasesRes, settingsRes, legacySettingsRes] = await Promise.all([
      supabase.from("app_products").select("*").eq("slug", slug).maybeSingle(),
      supabase.from("app_screenshots").select("*").eq("product_slug", slug).order("sort_order"),
      supabase.from("app_faqs").select("*").eq("product_slug", slug).order("sort_order"),
      supabase.from("app_releases").select("*").eq("product_slug", slug).eq("is_published", true).order("published_at", { ascending: false }),
      supabase.from("app_settings").select("value").eq("key", getRuntimeConfigKey(slug)).maybeSingle(),
      supabase.from("site_settings").select("value_json").eq("key", getRuntimeConfigKey(slug)).maybeSingle(),
    ]);

    if (productRes.error && !String(productRes.error.message).includes("does not exist")) throw productRes.error;
    if (screenshotsRes.error && !String(screenshotsRes.error.message).includes("does not exist")) throw screenshotsRes.error;
    if (faqRes.error && !String(faqRes.error.message).includes("does not exist")) throw faqRes.error;
    if (releasesRes.error && !String(releasesRes.error.message).includes("does not exist")) throw releasesRes.error;
    if (settingsRes.error && !String(settingsRes.error.message).includes("does not exist")) throw settingsRes.error;
    if (legacySettingsRes.error && !String(legacySettingsRes.error.message).includes("does not exist")) throw legacySettingsRes.error;

    const releases = releasesRes.data ?? [];
    const releaseIds = releases.map((item) => item.id);
    const assetsMap = new Map<string, AppReleaseAsset[]>();

    if (releaseIds.length) {
      const assetsRes = await supabase.from("app_release_assets").select("*").in("release_id", releaseIds).order("created_at");
      if (assetsRes.error && !String(assetsRes.error.message).includes("does not exist")) throw assetsRes.error;

      for (const row of assetsRes.data ?? []) {
        const normalized = normalizeAsset(row);
        const current = assetsMap.get(normalized.release_id) ?? [];
        current.push(normalized);
        assetsMap.set(normalized.release_id, current);
      }
    }

    const data = normalizeAppEcosystemData({
      product: normalizeProduct(productRes.data as Partial<AppProduct> | null, slug),
      screenshots:
        (screenshotsRes.data as AppScreenshot[] | null)?.length
          ? ((screenshotsRes.data as AppScreenshot[]) ?? [])
          : fallback.screenshots,
      faqs: (faqRes.data as AppFaq[] | null)?.length ? ((faqRes.data as AppFaq[]) ?? []) : fallback.faqs,
      releases: releases.map((row) => normalizeRelease(row, assetsMap.get(row.id) ?? [])),
      runtimeConfig: runtimeConfigSummary(settingsRes.data?.value ?? legacySettingsRes.data?.value_json, slug),
    }, slug);

    if (!data.releases.length) {
      const legacy = await readLegacyAppSettings(slug);
      return { ...data, releases: legacy.releases };
    }

    return data;
  } catch {
    return readLegacyAppSettings(slug);
  }
}
export async function readManagedAppEcosystems(): Promise<AppEcosystemData[]> {
  return Promise.all(managedApps.map((app) => readAppEcosystem(app.slug)));
}

export async function saveSupportRequest(input: { id?: string; product_slug: string; name: string; email: string; message: string }) {
  const requestId = input.id || crypto.randomUUID();
  const fallbackPayload: AppSupportRequest = {
    id: requestId,
    product_slug: input.product_slug,
    name: input.name,
    email: input.email,
    message: input.message,
    status: "new",
    created_at: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_support_requests").insert({
      id: requestId,
      product_slug: input.product_slug,
      name: input.name,
      email: input.email,
      message: input.message,
      status: "new",
    });
    if (error) throw error;
    return requestId;
  } catch {
    if (hasDatabaseUrl()) {
      const inserted = await queryRows(
        `insert into contact_messages
          (name, email, phone, subject, message, budget, locale, project_types)
         values ($1, $2, null, $3, $4, null, 'en', $5::jsonb)`,
        [input.name, input.email, "MoPlayer support", input.message, JSON.stringify(["moplayer-support"])],
      ).then(() => true).catch(() => false);

      if (inserted) {
        return requestId;
      }
    }

    const slug = resolveManagedAppSlug(input.product_slug);
    const current = await readSiteSetting(`${slug}_app_support_requests`, asSiteSettingValue(fallbackSupportRequests));
    const next = [fallbackPayload, ...(Array.isArray(current) ? (current as AppSupportRequest[]) : fallbackSupportRequests)].slice(0, 100);
    await upsertSiteSetting(`${slug}_app_support_requests`, asSiteSettingValue(next));
    return requestId;
  }
}

function pickReleaseAsset(assets: AppReleaseAsset[], preferredAbi?: string | null) {
  const normalizedAbi = preferredAbi?.trim().toLowerCase();
  if (normalizedAbi) {
    const exact = assets.find((item) => item.abi?.toLowerCase() === normalizedAbi);
    if (exact) return exact;
  }
  const universal = assets.find((item) => item.abi?.toLowerCase() === "universal");
  if (universal) return universal;
  return assets.find((item) => item.is_primary) ?? assets[0];
}

export async function resolveDownloadBySlug(slug: string, preferredAbi?: string | null) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: release, error: releaseError } = await supabase
      .from("app_releases")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (releaseError || !release) throw releaseError ?? new Error("Release not found");

    const { data: assetRows, error: assetError } = await supabase
      .from("app_release_assets")
      .select("*")
      .eq("release_id", release.id)
      .order("is_primary", { ascending: false });

    if (assetError || !assetRows?.length) throw assetError ?? new Error("Release asset not found");

    const normalizedAssets = assetRows.map((item) => normalizeAsset(item));
    const primary = pickReleaseAsset(normalizedAssets, preferredAbi);
    if (primary.external_url) {
      return {
        filename: `${release.slug}.apk`,
        redirectUrl: primary.external_url,
        release,
        asset: primary,
      };
    }

    if (!primary.storage_bucket || !primary.storage_path) return null;

    const signed = await supabase.storage.from(primary.storage_bucket).createSignedUrl(primary.storage_path, 60);
    if (signed.error || !signed.data?.signedUrl) return null;

    return {
      filename: `${release.slug}.apk`,
      redirectUrl: signed.data.signedUrl,
      release,
      asset: normalizeAsset(primary),
    };
  } catch {
    const legacySets = await Promise.all(managedApps.map((app) => readLegacyAppSettings(app.slug)));
    const release = legacySets.flatMap((set) => set.releases).find((item) => item.slug === slug);
    if (!release) return null;
    const asset = pickReleaseAsset(release.assets, preferredAbi);
    if (!asset?.external_url) return null;
    return {
      filename: `${release.slug}.apk`,
      redirectUrl: asset.external_url,
      release,
      asset,
    };
  }
}
