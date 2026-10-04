import { createHash } from "node:crypto";

import { hasDatabaseUrl, queryRows, upsertRow } from "@/lib/server-db";
import { createSupabaseAdminClient, createSupabaseDataClient, hasSupabasePublicEnv } from "@/lib/supabase/client";
import { isMailerConfigured } from "@/lib/mailer";
import { getManagedApp, managedApps, resolveManagedAppSlug, type ManagedAppSlug } from "@moalfarras/shared/app-products";
import { currentAppReleases } from "@moalfarras/shared/app-releases";
import type {
  AdminHealthStatus,
  AppEcosystemData,
  AppFaq,
  AppFeatureItem,
  AppLicense,
  AppProduct,
  AppRelease,
  AppReleaseAsset,
  ActivationRequest,
  AppDevice,
  AppDeviceEvent,
  AppDiagnosticReport,
  AppDownloadMetrics,
  AppOperationalMetrics,
  AppScreenshot,
  AppRuntimeConfig,
  DeviceProviderSourceQueue,
  WidgetProviderSettingsStatus,
  AppStepItem,
  AppSupportRequest,
} from "@/types/app-ecosystem";

const now = new Date().toISOString();
const widgetProviderSettingsKey = "moplayer_widget_provider_settings";
const classicRelease = currentAppReleases.moplayer;
const proRelease = currentAppReleases.moplayer2;

// Offline fallback built from the same verified release constants the public
// site uses (@moalfarras/shared/app-releases), so admin and web cannot drift.
function fallbackReleaseFor(slug: ManagedAppSlug): AppRelease {
  const release = currentAppReleases[slug];
  return {
    id: release.releaseId,
    product_slug: release.productSlug,
    slug: release.releaseSlug,
    version_name: release.versionName,
    version_code: release.versionCode,
    release_notes: release.releaseNotes,
    compatibility_notes: release.compatibilityNotes,
    published_at: release.publishedAt,
    is_published: true,
    created_at: release.publishedAt,
    updated_at: release.publishedAt,
    assets: [
      {
        id: release.asset.id,
        release_id: release.releaseId,
        asset_type: "apk",
        label: release.asset.label,
        abi: release.asset.abi,
        storage_bucket: null,
        storage_path: null,
        external_url: release.asset.url,
        mime_type: "application/vnd.android.package-archive",
        file_size_bytes: release.asset.fileSizeBytes,
        checksum_sha256: release.asset.checksumSha256,
        is_primary: true,
        created_at: release.publishedAt,
      },
    ],
  };
}
const localSettings = new Map<string, unknown>();
const downloadCountsSettingKey = "download_counts";

function downloadCountId(productSlug: string, platform?: string | null) {
  const slug = resolveManagedAppSlug(productSlug);
  return platform?.toLowerCase() === "windows" ? `${slug}:windows` : slug;
}

function normalizeDownloadMetrics(value: unknown, productSlug: string, platform?: string | null): AppDownloadMetrics {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const counts = raw.counts && typeof raw.counts === "object" ? (raw.counts as Record<string, unknown>) : {};
  const id = downloadCountId(productSlug, platform);
  return {
    value: Math.max(0, Number(counts[id]) || 0),
    total: Math.max(0, Number(raw.total) || 0),
    since: typeof raw.since === "string" ? raw.since : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
  };
}

export async function readAppDownloadMetrics(productSlug: string, platform?: string | null): Promise<AppDownloadMetrics> {
  try {
    const supabase = createSupabaseAdminClient();
    const normalizedPlatform = platform?.toLowerCase() === "windows" ? "windows" : "android";
    const { data, error } = await supabase
      .from("app_download_counts")
      .select("downloads,since,updated_at")
      .eq("product_slug", resolveManagedAppSlug(productSlug))
      .eq("platform", normalizedPlatform)
      .maybeSingle();
    if (!error && data) {
      return {
        value: Math.max(0, Number(data.downloads) || 0),
        total: Math.max(0, Number(data.downloads) || 0),
        since: typeof data.since === "string" ? data.since : undefined,
        updatedAt: typeof data.updated_at === "string" ? data.updated_at : undefined,
      };
    }
  } catch {
    // Environments without the download-events migration still use the legacy aggregate.
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value_json")
      .eq("key", downloadCountsSettingKey)
      .maybeSingle();
    if (error) throw error;
    return normalizeDownloadMetrics(data?.value_json, productSlug, platform);
  } catch {
    const value = await readSiteSetting(downloadCountsSettingKey, {});
    return normalizeDownloadMetrics(value, productSlug, platform);
  }
}

function sourceQueueExpired(queue: Partial<DeviceProviderSourceQueue> | null | undefined) {
  if (!queue?.expiresAt) return false;
  return new Date(queue.expiresAt).getTime() <= Date.now();
}

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

function parseNumberList(value: unknown, fallback: number[]): number[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\s]+/) : [];
  const items = raw.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);
  return items.length ? items : fallback;
}

const fallbackProduct: AppProduct = {
  id: "moplayer-product",
  slug: "moplayer",
  product_name: "MoPlayer",
  hero_badge: "Android TV + Android media player",
  tagline: "Live TV, movies and series from your own Xtream or M3U source, built for the remote.",
  short_description:
    "MoPlayer Classic is a player only: it reads the Xtream Codes account or M3U link you already have and organises it into Live TV, Movies and Series. It runs on Android 7.0 or newer and keeps your source on the device.",
  long_description:
    "MoPlayer Classic plays your own Xtream Codes or M3U source on Android TV boxes, TVs, phones and tablets in landscape: Live TV with an EPG guide, Movies, Series, Favorites and Search. Add your source by scanning a QR code with your phone at moalfarras.space/activate.",
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
    { title: "Live TV with EPG", body: "Channel groups, quick zapping and a programme guide for your Xtream or M3U source.", icon: "tv" },
    { title: "Movies and Series", body: "Browse your provider's video library with posters, details, seasons and episodes.", icon: "zap" },
    { title: "QR activation", body: "Scan the QR code on the TV and add your source from your phone at moalfarras.space/activate instead of typing long links with the remote.", icon: "shield" },
    { title: "Favorites and Search", body: "Pin channels and titles to Favorites and search across Live TV, Movies and Series.", icon: "box" },
  ],
  how_it_works: [
    { title: "Install the APK", body: "Download the universal APK from this page on any Android 7.0+ TV, box, phone or tablet." },
    { title: "Add your source", body: "Scan the QR code shown in the app and send your Xtream or M3U details from moalfarras.space/activate." },
    { title: "Watch", body: "Browse Live TV with the EPG guide, Movies and Series with the remote or touch." },
  ],
  install_steps: [
    { title: "Download the APK", body: "Download the latest universal APK from this page. It runs on Android 7.0 or newer." },
    { title: "Allow installation", body: "If Android asks, allow installs from your browser or file manager for this download." },
    { title: "Activate with QR (recommended)", body: "Open MoPlayer Classic, scan the QR code on screen with your phone and add your Xtream or M3U source at moalfarras.space/activate. The source is sent to the TV once and saved only on the device." },
    { title: "Or sign in on the TV", body: "You can also type your Xtream details or M3U link directly in the app." },
  ],
  compatibility_notes: [
    "Android 7.0 or newer (API 24+)",
    "Android TV, Google TV and Android boxes with a remote; phones and tablets in landscape",
    "One universal APK for ARM 64-bit and 32-bit devices",
  ],
  legal_notes: [
    "MoPlayer is a playback interface. It does not provide channels, playlists, or copyrighted media.",
    "Users are responsible for the legality of the content sources they connect.",
    "A source added through QR activation is delivered to your TV once and is not kept on the website.",
  ],
  changelog_intro: "Release notes for each MoPlayer Classic version.",
  logo_path: "/images/moplayer-brand-logo-final.png",
  hero_image_path: "/images/moplayer-tv-hero.png",
  tv_banner_path: "/images/moplayer-tv-banner-final.png",
  status: "published",
  last_updated_at: now,
  created_at: now,
  updated_at: now,
};

const fallbackScreenshots: AppScreenshot[] = [
  { id: "moplayer-screen-1", product_slug: "moplayer", title: "Home", alt_text: "MoPlayer Classic home screen with content rows", image_path: "/images/apps/classic/classic-home-after.webp", device_frame: "tv", sort_order: 1, is_featured: true, created_at: now },
  { id: "moplayer-screen-2", product_slug: "moplayer", title: "Live TV", alt_text: "MoPlayer Classic live channel playback", image_path: "/images/apps/classic/classic-live-playing-after.webp", device_frame: "tv", sort_order: 2, is_featured: false, created_at: now },
  { id: "moplayer-screen-3", product_slug: "moplayer", title: "Movies", alt_text: "MoPlayer Classic movies library", image_path: "/images/apps/classic/classic-movies-cyan-after.webp", device_frame: "tv", sort_order: 3, is_featured: false, created_at: now },
  { id: "moplayer-screen-4", product_slug: "moplayer", title: "Settings", alt_text: "MoPlayer Classic settings and update screen", image_path: "/images/apps/classic/classic-settings-update-ahead-fixed.webp", device_frame: "tv", sort_order: 4, is_featured: false, created_at: now },
  { id: "moplayer-screen-5", product_slug: "moplayer", title: "Activation", alt_text: "MoPlayer Classic device activation screen", image_path: "/images/apps/classic/classic-activation-before.webp", device_frame: "tv", sort_order: 5, is_featured: false, created_at: now },
  { id: "moplayer-screen-6", product_slug: "moplayer", title: "Sign in", alt_text: "MoPlayer Classic modern login screen", image_path: "/images/apps/classic/classic-modern-api36-login-final.webp", device_frame: "tv", sort_order: 6, is_featured: false, created_at: now },
  { id: "moplayer-screen-7", product_slug: "moplayer", title: "Add source", alt_text: "MoPlayer Classic add M3U source screen", image_path: "/images/apps/classic/classic-m3u-before.webp", device_frame: "tv", sort_order: 7, is_featured: false, created_at: now },
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
    answer: "Yes. MoPlayer Classic is built for Android TV and remote navigation, and also runs on Android phones and tablets in landscape. It needs Android 7.0 or newer.",
    sort_order: 2,
    created_at: now,
  },
  {
    id: "faq-3",
    product_slug: "moplayer",
    question: "Is MoPlayer on Google Play?",
    answer: "No. MoPlayer Classic is distributed as an APK from this page only.",
    sort_order: 3,
    created_at: now,
  },
];

const fallbackSupportRequests: AppSupportRequest[] = [];

function calculateOperationalMetrics(devices: AppDevice[], activationRequests: ActivationRequest[]): AppOperationalMetrics {
  const current = Date.now();
  const activeWindowMs = 15 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const activated = activationRequests.filter((request) => request.status === "activated").length;
  const completed = activationRequests.filter((request) => request.status !== "waiting").length;

  return {
    activeNow: devices.filter((device) => current - new Date(device.last_seen_at).getTime() <= activeWindowMs).length,
    activeLast24h: devices.filter((device) => current - new Date(device.last_seen_at).getTime() <= dayMs).length,
    staleDevices: devices.filter((device) => current - new Date(device.last_seen_at).getTime() > dayMs).length,
    expiredWaitingActivations: activationRequests.filter(
      (request) => request.status === "waiting" && new Date(request.expires_at).getTime() < current,
    ).length,
    waitingOlderThan24h: activationRequests.filter(
      (request) => request.status === "waiting" && current - new Date(request.created_at).getTime() > dayMs,
    ).length,
    activationSuccessRate: completed ? Math.round((activated / completed) * 100) : 0,
  };
}

export async function readAdminHealthStatus(): Promise<AdminHealthStatus> {
  const health: AdminHealthStatus = {
    supabase: false,
    storage: false,
    smtp: isMailerConfigured(),
    websiteDomain: process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space",
    adminDomain: process.env.NEXT_PUBLIC_ADMIN_APP_URL || "https://admin.moalfarras.space",
    generatedAt: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseAdminClient();
    const probe = await supabase.from("app_products").select("slug").limit(1);
    health.supabase = !probe.error;
    const buckets = await supabase.storage.listBuckets();
    health.storage = !buckets.error;
  } catch {
    health.supabase = false;
    health.storage = false;
  }

  return health;
}

export const fallbackRuntimeConfig: AppRuntimeConfig = {
  enabled: true,
  maintenanceMode: false,
  forceUpdate: false,
  minimumVersionCode: 18,
  latestVersionName: classicRelease.versionName,
  latestVersionCode: classicRelease.versionCode,
  downloaderCode: "2418397",
  message: "",
  accentColor: "#00e5ff",
  logoUrl: "/images/moplayer-brand-logo-final.png",
  backgroundUrl: "/images/moplayer-tv-banner-final.png",
    widgets: { weather: true, football: true },
    footballProviderMode: "auto",
    footballLeagueIds: [39, 140, 135, 78, 61, 2, 3, 848, 1, 15],
    footballLeagueKeywords: ["world cup", "fifa", "champions league", "europa", "premier", "la liga", "serie a", "bundesliga", "ligue 1"],
    footballNewsMessage: "",
    allowFootballFallback: false,
    allowWeatherFallback: false,
  homeNotification: {
    mode: "auto",
    type: "world_cup_2026",
    title: "",
    message: "",
    startDate: "",
  },
  campaignWidgets: {
    worldCup: true,
    liveSports: true,
    announcement: true,
    promoTitle: "",
    promoMessage: "",
    promoUrl: "",
  },
  supportUrl: "https://moalfarras.space/en/contact",
  privacyUrl: "https://moalfarras.space/privacy",
  update: {
    latestVersionName: classicRelease.versionName,
    latestVersionCode: classicRelease.versionCode,
    downloadUrl: "/api/app/download/latest?product=moplayer",
    apkSizeBytes: classicRelease.asset.fileSizeBytes,
    checksumSha256: classicRelease.asset.checksumSha256,
    releaseNotes: classicRelease.updateNotes,
  },
};

const fallbackReleases: AppRelease[] = [fallbackReleaseFor("moplayer")];

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
    android_min_sdk: proRelease.minSdk,
    android_target_sdk: proRelease.targetSdk,
    default_download_label: "Download MoPlayer Pro APK",
    feature_highlights: [
      { title: "Separate product line", body: "Independent records for releases, screenshots, FAQs, and support.", icon: "box" },
      { title: "Same admin system", body: "Managed from the existing admin without a new Vercel project.", icon: "shield" },
      { title: "TV-first direction", body: "Prepared for Android TV and remote-first navigation.", icon: "tv" },
      { title: "Growth-ready", body: "Runtime and release controls can evolve independently.", icon: "zap" },
    ],
    how_it_works: [
      { title: "Switch product", body: "Choose MoPlayer Pro in the admin product switcher." },
      { title: "Publish assets", body: "Upload MoPlayer Pro releases and screenshots separately." },
      { title: "Open public page", body: "Users reach MoPlayer Pro at /apps/moplayer2." },
    ],
    install_steps: [
      { title: "Download MoPlayer Pro", body: "Use the MoPlayer Pro release card." },
      { title: "Allow installation", body: "Enable install from trusted sources if Android asks." },
      { title: "Open and configure", body: "Launch MoPlayer Pro and connect permitted sources only." },
    ],
    compatibility_notes: [
      "Android 6.0+ (API 23 and above)",
      "Separate from the classic MoPlayer channel",
      "Designed for Android TV and remote-first navigation",
    ],
    changelog_intro: "MoPlayer Pro releases are tracked separately from classic MoPlayer.",
    logo_path: "/images/moplayer-pro-hero.webp",
    hero_image_path: "/images/moplayer-pro-hero.webp",
    tv_banner_path: "/images/moplayer-pro-home.webp",
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
  moplayer2: [fallbackReleaseFor("moplayer2")],
};

const fallbackRuntimeConfigBySlug: Record<string, AppRuntimeConfig> = {
  moplayer: fallbackRuntimeConfig,
  moplayer2: {
    ...fallbackRuntimeConfig,
    minimumVersionCode: 50,
    latestVersionName: proRelease.versionName,
    latestVersionCode: proRelease.versionCode,
    downloaderCode: "4608937",
    appName: "MoPlayer Pro",
    packageName: "com.moalfarras.moplayerpro",
    logoUrl: "/images/moplayer-pro-hero.webp",
    backgroundUrl: "/images/moplayer-pro-home.webp",
    syncIntervalMinutes: 60,
    sourceProtocolFallback: true,
    supportUrl: "https://moalfarras.space/en/support",
    footballProviderMode: "auto",
    footballLeagueIds: [39, 140, 135, 78, 61, 2, 3, 848, 1, 15],
    footballLeagueKeywords: ["world cup", "fifa", "champions league", "europa", "premier", "la liga", "serie a", "bundesliga", "ligue 1"],
    footballNewsMessage: "",
    allowFootballFallback: false,
    allowWeatherFallback: false,
    homeNotification: {
      mode: "auto",
      type: "world_cup_2026",
      title: "World Cup 2026 is coming",
      message: "MoPlayer Pro is ready for live football nights, match widgets, and cinematic TV browsing.",
      startDate: "2026-06-11",
      ctaLabel: "Open football hub",
      ctaUrl: "/football",
    },
    campaignWidgets: {
      worldCup: true,
      liveSports: true,
      announcement: true,
      promoTitle: "MoPlayer Pro live season",
      promoMessage: "Weather, football, posters, and premium TV surfaces are controlled from Admin.",
      promoUrl: "https://moalfarras.space/en/apps/moplayer2",
    },
    update: {
      latestVersionName: proRelease.versionName,
      latestVersionCode: proRelease.versionCode,
      downloadUrl: "/api/app/download/latest?product=moplayer2",
      apkSizeBytes: proRelease.asset.fileSizeBytes,
      checksumSha256: proRelease.asset.checksumSha256,
      releaseNotes: proRelease.updateNotes,
    },
    ios: {
      enabled: true,
      status: "coming_soon",
      storeUrl: "/en/apps/moplayer-ios#app-store-coming-soon",
      activationUrl: "/en/activate?product=moplayer2&platform=ios",
      buttonLabel: "App Store soon",
      heroImageUrl: "/images/moplayer-pro-home.webp",
      note: "Temporary public page link until the App Store listing is live.",
    },
  },
};

function fallbackFor(productSlug: string) {
  const slug = resolveManagedAppSlug(productSlug);
  return {
    product: fallbackProductBySlug[slug],
    screenshots: fallbackScreenshotsBySlug[slug],
    faqs: fallbackFaqsBySlug[slug],
    releases: fallbackReleasesBySlug[slug],
    runtimeConfig: fallbackRuntimeConfigBySlug[slug],
  };
}

const fallbackWidgetProviderSettings: WidgetProviderSettingsStatus = {
  weatherApiConfigured: Boolean(process.env.WEATHER_API_KEY),
  sportmonksConfigured: Boolean(process.env.SPORTMONKS_TOKEN),
  apiFootballConfigured: Boolean(process.env.API_FOOTBALL_KEY),
  rapidApiFootballConfigured: Boolean(process.env.RAPIDAPI_FOOTBALL_KEY),
  defaultWeatherCity: "Berlin",
  sportmonksResultsRoundId: process.env.SPORTMONKS_RESULTS_ROUND_ID,
  footballLeagueIds: [39, 140, 135, 78, 61],
  footballMaxMatches: 8,
  footballMinPriority: 70,
};

async function readWidgetProviderSettingsStatus(): Promise<WidgetProviderSettingsStatus> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("app_private_settings")
      .select("value")
      .eq("key", widgetProviderSettingsKey)
      .maybeSingle();
    if (error) throw error;
    const value = data?.value && typeof data.value === "object" ? (data.value as Record<string, unknown>) : {};
    return {
      weatherApiConfigured: Boolean(String(value.weatherApiKey ?? process.env.WEATHER_API_KEY ?? "").trim()),
      sportmonksConfigured: Boolean(String(value.sportmonksToken ?? process.env.SPORTMONKS_TOKEN ?? "").trim()),
      apiFootballConfigured: Boolean(String(value.apiFootballKey ?? process.env.API_FOOTBALL_KEY ?? "").trim()),
      rapidApiFootballConfigured: Boolean(String(value.rapidApiFootballKey ?? process.env.RAPIDAPI_FOOTBALL_KEY ?? "").trim()),
      defaultWeatherCity: String(value.defaultWeatherCity ?? fallbackWidgetProviderSettings.defaultWeatherCity).trim() || fallbackWidgetProviderSettings.defaultWeatherCity,
      sportmonksResultsRoundId: String(value.sportmonksResultsRoundId ?? process.env.SPORTMONKS_RESULTS_ROUND_ID ?? "").trim() || undefined,
      footballLeagueIds: parseNumberList(value.footballLeagueIds, fallbackWidgetProviderSettings.footballLeagueIds),
      footballMaxMatches: Math.min(20, Math.max(1, Number(value.footballMaxMatches ?? fallbackWidgetProviderSettings.footballMaxMatches) || fallbackWidgetProviderSettings.footballMaxMatches)),
      footballMinPriority: Math.min(100, Math.max(0, Number(value.footballMinPriority ?? fallbackWidgetProviderSettings.footballMinPriority) || fallbackWidgetProviderSettings.footballMinPriority)),
    };
  } catch {
    return fallbackWidgetProviderSettings;
  }
}

function asSiteSettingValue<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

async function readSiteSetting<T>(key: string, fallback: T): Promise<T> {
  if (localSettings.has(key)) {
    return (localSettings.get(key) as T) ?? fallback;
  }

  if (hasDatabaseUrl()) {
    const result = await queryRows<{ value_json: T }>(
      `select value_json from site_settings where key = $1 limit 1`,
      [key],
    ).catch(() => null);

    const value = result?.rows[0]?.value_json;
    if (value !== undefined) {
      localSettings.set(key, value);
      return value;
    }
  }

  return fallback;
}

async function upsertSiteSetting(key: string, value: Record<string, unknown>): Promise<void> {
  localSettings.set(key, value);

  if (!hasDatabaseUrl()) return;

  await upsertRow(
    "site_settings",
    {
      key,
      value_json: value,
    },
    ["key"],
  );
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

function normalizeRuntimeConfig(input: Partial<AppRuntimeConfig> | null | undefined, productSlug: string): AppRuntimeConfig {
  const slug = resolveManagedAppSlug(productSlug);
  const fallback = fallbackFor(slug).runtimeConfig;
  const savedConfig = input ?? {};
  const merged: AppRuntimeConfig = {
    ...fallback,
    ...savedConfig,
    widgets: {
      ...fallback.widgets,
      ...(savedConfig.widgets ?? {}),
    },
    homeNotification: {
      ...(fallback.homeNotification ?? {}),
      ...(savedConfig.homeNotification ?? {}),
    },
    campaignWidgets: {
      ...(fallback.campaignWidgets ?? {}),
      ...(savedConfig.campaignWidgets ?? {}),
    },
    update: {
      ...(fallback.update ?? {}),
      ...(savedConfig.update ?? {}),
    },
    ios: {
      ...(fallback.ios ?? {}),
      ...(savedConfig.ios ?? {}),
    },
  };
  if (slug === "moplayer2") {
    return {
      ...merged,
      logoUrl: normalizeProAssetPath(merged.logoUrl, fallback.logoUrl) ?? fallback.logoUrl,
      backgroundUrl: normalizeProAssetPath(merged.backgroundUrl, fallback.backgroundUrl) ?? fallback.backgroundUrl,
    };
  }
  return merged;
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
    const [productRes, screenshotsRes, faqRes, releasesRes] = await Promise.all([
      supabase.from("app_products").select("*").eq("slug", slug).maybeSingle(),
      supabase.from("app_screenshots").select("*").eq("product_slug", slug).order("sort_order"),
      supabase.from("app_faqs").select("*").eq("product_slug", slug).order("sort_order"),
      supabase.from("app_releases").select("*").eq("product_slug", slug).eq("is_published", true).order("published_at", { ascending: false }),
    ]);

    if (productRes.error && !String(productRes.error.message).includes("does not exist")) throw productRes.error;
    if (screenshotsRes.error && !String(screenshotsRes.error.message).includes("does not exist")) throw screenshotsRes.error;
    if (faqRes.error && !String(faqRes.error.message).includes("does not exist")) throw faqRes.error;
    if (releasesRes.error && !String(releasesRes.error.message).includes("does not exist")) throw releasesRes.error;

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
export async function readAdminAppData(productSlug = "moplayer") {
  const slug = resolveManagedAppSlug(productSlug);
  const ecosystem = await readAppEcosystem(productSlug);
  let supportRequests: AppSupportRequest[] = [];
  let devices: AppDevice[] = [];
  let activationRequests: ActivationRequest[] = [];
  let licenses: AppLicense[] = [];
  let providerSources: DeviceProviderSourceQueue[] = [];
  let deviceEvents: AppDeviceEvent[] = [];
  let diagnostics: AppDiagnosticReport[] = [];
  let runtimeConfig: AppRuntimeConfig = fallbackFor(slug).runtimeConfig;

  try {
    const supabase = createSupabaseAdminClient();
    await cleanupStaleActivationRequests(slug).catch(() => 0);
    const [
      { data },
      { data: deviceRows },
      { data: activationRows },
      { data: licenseRows },
      { data: settingsRow },
      { data: legacySettingsRow },
      { data: sourceRows },
      { data: eventRows },
      { data: diagnosticRows },
    ] = await Promise.all([
      supabase
      .from("app_support_requests")
      .select("*")
      .eq("product_slug", slug)
      .order("created_at", { ascending: false })
      .limit(50),
      supabase.from("devices").select("*").order("last_seen_at", { ascending: false }).limit(100),
      supabase
        .from("activation_requests")
        .select("*")
        .or(slug === "moplayer" ? "product_slug.eq.moplayer,product_slug.is.null" : `product_slug.eq.${slug}`)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.from("licenses").select("*, devices(public_device_id, product_slug)").order("created_at", { ascending: false }).limit(100),
      supabase.from("app_settings").select("value").eq("key", getManagedApp(slug).runtimeConfigKey).maybeSingle(),
      supabase.from("site_settings").select("value_json").eq("key", getManagedApp(slug).runtimeConfigKey).maybeSingle(),
      supabase.from("app_settings").select("key,value").like("key", "%device_source:%").order("updated_at", { ascending: false }).limit(100),
      supabase
        .from("app_device_events")
        .select("*")
        .eq("product_slug", slug)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("app_diagnostic_reports")
        .select("*")
        .eq("product_slug", slug)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    supportRequests = (data as AppSupportRequest[] | null) ?? [];
    activationRequests = (activationRows as ActivationRequest[] | null) ?? [];
    deviceEvents = (eventRows as AppDeviceEvent[] | null) ?? [];
    diagnostics = (diagnosticRows as AppDiagnosticReport[] | null) ?? [];
    const scopedDeviceIds = new Set([
      ...activationRequests.map((request) => request.public_device_id),
      ...deviceEvents.map((event) => event.public_device_id),
      ...diagnostics.map((report) => report.public_device_id),
    ]);
    devices = ((deviceRows as AppDevice[] | null) ?? []).filter((device) => {
      const deviceSlug = device.product_slug ? resolveManagedAppSlug(device.product_slug) : null;
      return deviceSlug === slug || scopedDeviceIds.has(device.public_device_id);
    });
    licenses = ((licenseRows as Array<AppLicense & { devices?: { public_device_id?: string | null; product_slug?: string | null } | null }> | null) ?? [])
      .map((license) => ({
        ...license,
        public_device_id: license.public_device_id ?? license.devices?.public_device_id ?? null,
      }))
      .filter((license) => {
        const deviceSlug = license.devices?.product_slug ? resolveManagedAppSlug(license.devices.product_slug) : null;
        return deviceSlug === slug || (license.public_device_id ? scopedDeviceIds.has(license.public_device_id) : false);
      });
    const savedConfig = ((settingsRow?.value ?? legacySettingsRow?.value_json) as Partial<AppRuntimeConfig> | null) ?? {};
    runtimeConfig = normalizeRuntimeConfig(savedConfig, slug);
    const sourceSettings = (sourceRows as Array<{ key: string; value: unknown }> | null) ?? [];
    const expiredSourceKeys = sourceSettings
      .filter((row) => sourceQueueExpired(row.value as Partial<DeviceProviderSourceQueue>))
      .map((row) => row.key);
    if (expiredSourceKeys.length) {
      await supabase.from("app_settings").delete().in("key", expiredSourceKeys);
    }
    providerSources = sourceSettings
      .map((row) => {
        // Never ship the encrypted provider payload to the admin client.
        const value = { ...(row.value as Partial<DeviceProviderSourceQueue> & { encryptedPayload?: string }) };
        delete value.encryptedPayload;
        return value as Partial<DeviceProviderSourceQueue>;
      })
      .filter((row): row is DeviceProviderSourceQueue =>
        Boolean(
          row?.id &&
          row?.publicDeviceId &&
          row?.status &&
          !sourceQueueExpired(row) &&
          (row.productSlug ?? "moplayer") === slug,
        ),
      );
  } catch {
    if (hasDatabaseUrl()) {
      const result = await queryRows<{
        id: string;
        name: string;
        email: string;
        message: string;
        subject: string;
        created_at: string;
      }>(
        `select id, name, email, message, subject, created_at
         from contact_messages
         where subject ilike 'MoPlayer support%'
         order by created_at desc
         limit 50`,
      ).catch(() => null);

      supportRequests =
        result?.rows.map((row) => ({
          id: row.id,
          product_slug: slug,
          name: row.name,
          email: row.email,
          message: row.message,
          status: row.subject.includes("[resolved]") ? "resolved" : "new",
          created_at: row.created_at,
        })) ?? [];
    }

    if (!supportRequests.length) {
      const current = await readSiteSetting(`${slug}_app_support_requests`, asSiteSettingValue(fallbackSupportRequests));
      supportRequests = (Array.isArray(current) ? (current as AppSupportRequest[]) : fallbackSupportRequests)
        .filter((item) => item.product_slug === slug)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
    }
  }

  return {
    ...ecosystem,
    supportRequests,
    devices,
    activationRequests,
    licenses,
    providerSources,
    deviceEvents,
    diagnostics,
    runtimeConfig,
    widgetProviderSettings: await readWidgetProviderSettingsStatus(),
    metrics: calculateOperationalMetrics(devices, activationRequests),
    downloadStats: await readAppDownloadMetrics(slug),
  };
}

export async function saveRuntimeConfig(input: AppRuntimeConfig, productSlug = "moplayer") {
  const slug = resolveManagedAppSlug(productSlug);
  const payload: AppRuntimeConfig = {
    ...fallbackFor(slug).runtimeConfig,
    ...input,
    widgets: {
      ...fallbackFor(slug).runtimeConfig.widgets,
      ...(input.widgets ?? {}),
    },
    homeNotification: {
      ...(fallbackFor(slug).runtimeConfig.homeNotification ?? {}),
      ...(input.homeNotification ?? {}),
    },
    campaignWidgets: {
      ...(fallbackFor(slug).runtimeConfig.campaignWidgets ?? {}),
      ...(input.campaignWidgets ?? {}),
    },
    update: {
      ...(fallbackFor(slug).runtimeConfig.update ?? {}),
      ...(input.update ?? {}),
    },
    ios: {
      ...(fallbackFor(slug).runtimeConfig.ios ?? {}),
      ...(input.ios ?? {}),
    },
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("app_settings").upsert(
    {
      key: getManagedApp(slug).runtimeConfigKey,
      value: payload,
      description: `Public ${getManagedApp(slug).name} runtime configuration consumed by Android and admin.`,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw error;
}

export async function saveWidgetProviderSettings(input: {
  weatherApiKey?: string;
  sportmonksToken?: string;
  apiFootballKey?: string;
  rapidApiFootballKey?: string;
  defaultWeatherCity?: string;
  sportmonksResultsRoundId?: string;
  footballLeagueIds?: number[];
  footballMaxMatches?: number;
  footballMinPriority?: number;
}) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("app_private_settings")
    .select("value")
    .eq("key", widgetProviderSettingsKey)
    .maybeSingle();
  const current = data?.value && typeof data.value === "object" ? (data.value as Record<string, unknown>) : {};
  const payload = {
    ...current,
    ...(input.weatherApiKey ? { weatherApiKey: input.weatherApiKey } : {}),
    ...(input.sportmonksToken ? { sportmonksToken: input.sportmonksToken } : {}),
    ...(input.apiFootballKey ? { apiFootballKey: input.apiFootballKey } : {}),
    ...(input.rapidApiFootballKey ? { rapidApiFootballKey: input.rapidApiFootballKey } : {}),
    ...(input.defaultWeatherCity ? { defaultWeatherCity: input.defaultWeatherCity } : {}),
    ...(input.sportmonksResultsRoundId ? { sportmonksResultsRoundId: input.sportmonksResultsRoundId } : {}),
    ...(input.footballLeagueIds?.length ? { footballLeagueIds: input.footballLeagueIds } : {}),
    ...(input.footballMaxMatches ? { footballMaxMatches: Math.min(20, Math.max(1, input.footballMaxMatches)) } : {}),
    ...(input.footballMinPriority !== undefined ? { footballMinPriority: Math.min(100, Math.max(0, input.footballMinPriority)) } : {}),
  };

  const { error } = await supabase.from("app_private_settings").upsert(
    {
      key: widgetProviderSettingsKey,
      value: payload,
      description: "Server-only widget provider credentials and tuning values for weather and football integrations.",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
  if (error) throw error;
}

export async function saveAppProduct(input: Partial<AppProduct> & { slug: string }) {
  const slug = resolveManagedAppSlug(input.slug);
  const fallback = fallbackFor(slug).product;
  const payload = {
    ...fallback,
    ...input,
    slug,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_products").upsert(payload, { onConflict: "slug" });
    if (error) throw error;
  } catch {
    await upsertSiteSetting(`${slug}_app_product`, asSiteSettingValue(payload));
  }
}

export async function saveAppFaq(input: Partial<AppFaq> & { product_slug: string; question: string; answer: string; sort_order: number }) {
  const payload = {
    id: input.id ?? crypto.randomUUID(),
    product_slug: input.product_slug,
    question: input.question,
    answer: input.answer,
    sort_order: input.sort_order,
    created_at: now,
  };
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_faqs").upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch {
    const slug = resolveManagedAppSlug(payload.product_slug);
    const fallback = fallbackFor(slug);
    const current = await readSiteSetting(`${slug}_app_faqs`, asSiteSettingValue(fallback.faqs));
    const next = [...(Array.isArray(current) ? (current as AppFaq[]) : fallback.faqs).filter((item) => item.id !== payload.id), payload].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    await upsertSiteSetting(`${slug}_app_faqs`, asSiteSettingValue(next));
  }
}

export async function deleteAppFaq(id: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_faqs").delete().eq("id", id);
    if (error) throw error;
  } catch {
    const current = await readSiteSetting("moplayer_app_faqs", asSiteSettingValue(fallbackFaqs));
    const next = (Array.isArray(current) ? (current as AppFaq[]) : fallbackFaqs).filter((item) => item.id !== id);
    await upsertSiteSetting("moplayer_app_faqs", asSiteSettingValue(next));
  }
}

async function ensureBucket(bucket: string, isPublic: boolean) {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.createBucket(bucket, { public: isPublic }).catch(() => null);
}

export async function uploadAppScreenshot(params: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
}) {
  const bucket = "app-media";
  await ensureBucket(bucket, true);
  const supabase = createSupabaseAdminClient();
  const storagePath = `screenshots/${Date.now()}-${params.filename.replace(/\s+/g, "-")}`;
  const blob = new Blob([Buffer.from(params.bytes)], { type: params.contentType || "application/octet-stream" });
  const { error } = await supabase.storage.from(bucket).upload(storagePath, blob, {
    cacheControl: "3600",
    contentType: params.contentType || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return {
    bucket,
    storagePath,
    publicUrl: data.publicUrl,
  };
}

export async function saveAppScreenshot(input: Partial<AppScreenshot> & { product_slug: string; title: string; alt_text: string; image_path: string; sort_order: number }) {
  const payload = {
    id: input.id ?? crypto.randomUUID(),
    product_slug: input.product_slug,
    title: input.title,
    alt_text: input.alt_text,
    image_path: input.image_path,
    device_frame: input.device_frame ?? "phone",
    sort_order: input.sort_order,
    is_featured: Boolean(input.is_featured),
    created_at: now,
  };
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_screenshots").upsert(payload, { onConflict: "id" });
    if (error) throw error;
  } catch {
    const slug = resolveManagedAppSlug(payload.product_slug);
    const fallback = fallbackFor(slug);
    const current = await readSiteSetting(`${slug}_app_screenshots`, asSiteSettingValue(fallback.screenshots));
    const next = [...(Array.isArray(current) ? (current as AppScreenshot[]) : fallback.screenshots).filter((item) => item.id !== payload.id), payload].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    await upsertSiteSetting(`${slug}_app_screenshots`, asSiteSettingValue(next));
  }
}

export async function deleteAppScreenshot(id: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_screenshots").delete().eq("id", id);
    if (error) throw error;
  } catch {
    const current = await readSiteSetting("moplayer_app_screenshots", asSiteSettingValue(fallbackScreenshots));
    const next = (Array.isArray(current) ? (current as AppScreenshot[]) : fallbackScreenshots).filter((item) => item.id !== id);
    await upsertSiteSetting("moplayer_app_screenshots", asSiteSettingValue(next));
  }
}

export async function saveAppRelease(input: Partial<AppRelease> & { product_slug: string; slug: string; version_name: string; version_code: number; release_notes: string; compatibility_notes: string; published_at: string }) {
  const payload = {
    id: input.id ?? crypto.randomUUID(),
    product_slug: input.product_slug,
    slug: input.slug,
    version_name: input.version_name,
    version_code: input.version_code,
    release_notes: input.release_notes,
    compatibility_notes: input.compatibility_notes,
    published_at: input.published_at,
    is_published: input.is_published ?? true,
    created_at: input.created_at ?? now,
    updated_at: new Date().toISOString(),
  };
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_releases").upsert(payload, { onConflict: "slug" });
    if (error) throw error;
  } catch {
    const slug = resolveManagedAppSlug(payload.product_slug);
    const fallback = fallbackFor(slug);
    const current = await readSiteSetting(`${slug}_app_releases`, asSiteSettingValue(fallback.releases));
    const next = [
      ...(Array.isArray(current) ? (current as AppRelease[]) : fallback.releases).filter((item) => item.slug !== payload.slug),
      { ...payload, assets: input.assets ?? [] },
    ].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    await upsertSiteSetting(`${slug}_app_releases`, asSiteSettingValue(next));
  }
  return payload.id;
}

export async function deleteAppRelease(id: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_releases").delete().eq("id", id);
    if (error) throw error;
  } catch {
    const current = await readSiteSetting("moplayer_app_releases", asSiteSettingValue(fallbackReleases));
    const next = (Array.isArray(current) ? (current as AppRelease[]) : fallbackReleases).filter((item) => item.id !== id);
    await upsertSiteSetting("moplayer_app_releases", asSiteSettingValue(next));
  }
}

export async function uploadReleaseAsset(params: {
  filename: string;
  contentType: string;
  bytes: Uint8Array;
  releaseId: string;
  versionName: string;
  abi: string | null;
  isPrimary: boolean;
}) {
  const bucket = "app-downloads";
  await ensureBucket(bucket, false);
  const supabase = createSupabaseAdminClient();
  const storagePath = `${params.versionName}/${Date.now()}-${params.filename.replace(/\s+/g, "-")}`;
  const blob = new Blob([Buffer.from(params.bytes)], { type: params.contentType || "application/vnd.android.package-archive" });

  const upload = await supabase.storage.from(bucket).upload(storagePath, blob, {
    cacheControl: "3600",
    contentType: params.contentType || "application/vnd.android.package-archive",
    upsert: false,
  });
  if (upload.error) throw new Error(upload.error.message);

  const checksum = createHash("sha256").update(Buffer.from(params.bytes)).digest("hex");
  const assetPayload = {
    id: crypto.randomUUID(),
    release_id: params.releaseId,
    asset_type: "apk",
    label: params.isPrimary ? "Recommended APK" : `${params.abi ?? "APK"} build`,
    abi: params.abi,
    storage_bucket: bucket,
    storage_path: storagePath,
    external_url: null,
    mime_type: params.contentType || "application/vnd.android.package-archive",
    file_size_bytes: params.bytes.byteLength,
    checksum_sha256: checksum,
    is_primary: params.isPrimary,
    created_at: now,
  };

  const { error } = await supabase.from("app_release_assets").insert(assetPayload);
  if (error) throw new Error(error.message);
  return assetPayload;
}

export async function saveSupportRequest(input: { product_slug: string; name: string; email: string; message: string }) {
  const requestId = crypto.randomUUID();
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

export async function updateSupportRequestStatus(id: string, status: AppSupportRequest["status"]) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_support_requests").update({ status }).eq("id", id);
    if (error) throw error;
  } catch {
    if (hasDatabaseUrl()) {
      const updated = await queryRows(`update contact_messages set subject = $1 where id = $2`, [status === "resolved" ? "MoPlayer support [resolved]" : "MoPlayer support", id])
        .then(() => true)
        .catch(() => false);
      if (updated) {
        return;
      }
    }

    const current = await readSiteSetting("moplayer_app_support_requests", asSiteSettingValue(fallbackSupportRequests));
    const next = (Array.isArray(current) ? (current as AppSupportRequest[]) : fallbackSupportRequests).map((item) =>
      item.id === id ? { ...item, status } : item,
    );
    await upsertSiteSetting("moplayer_app_support_requests", asSiteSettingValue(next));
  }
}

export async function updateDeviceStatus(publicDeviceId: string, status: AppDevice["status"]) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("devices")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("public_device_id", publicDeviceId);
  if (error) throw error;
}

export async function updateActivationRequestStatus(id: string, status: ActivationRequest["status"]) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("activation_requests")
    .update({
      status,
      activated_at: status === "activated" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteActivationRequest(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("activation_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function cleanupStaleActivationRequests(productSlug = "moplayer") {
  const slug = resolveManagedAppSlug(productSlug);
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("activation_requests").delete({ count: "exact" }).in("status", ["waiting", "expired", "failed"]).lt("created_at", cutoff);
  query = slug === "moplayer" ? query.or("product_slug.eq.moplayer,product_slug.is.null") : query.eq("product_slug", slug);
  const { error, count } = await query;
  if (error) throw error;
  return count ?? 0;
}

export async function upsertDeviceLicense(input: {
  publicDeviceId: string;
  plan: string;
  status: AppLicense["status"];
  validUntil?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const device = await supabase.from("devices").select("id").eq("public_device_id", input.publicDeviceId).maybeSingle();
  if (device.error || !device.data?.id) {
    throw new Error(device.error?.message || "Device not found.");
  }

  const { error } = await supabase.from("licenses").upsert(
    {
      device_id: device.data.id,
      plan: input.plan || "standard",
      status: input.status,
      valid_until: input.validUntil || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id" },
  );
  if (error) throw error;
}

export async function updateProviderSourceStatus(id: string, status: DeviceProviderSourceQueue["status"]) {
  const supabase = createSupabaseAdminClient();
  const settings = await supabase.from("app_settings").select("key,value").like("key", "%device_source:%").limit(200);
  if (settings.error) throw settings.error;

  for (const row of settings.data ?? []) {
    const value = row.value as Partial<DeviceProviderSourceQueue>;
    if (value?.id !== id) continue;
    if (status === "imported" || status === "revoked") {
      const { error } = await supabase.from("app_settings").delete().eq("key", row.key);
      if (error) throw error;
      return;
    }
    const safeValue = { ...value } as Partial<DeviceProviderSourceQueue> & { encryptedPayload?: string };
    delete safeValue.encryptedPayload;
    const { error } = await supabase
      .from("app_settings")
      .update({
        value: {
          ...safeValue,
          status,
          updatedAt: new Date().toISOString(),
          failedAt: status === "failed" ? new Date().toISOString() : value.failedAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("key", row.key);
    if (error) throw error;
    return;
  }

  throw new Error("Source delivery receipt was not found. It may already be cleared.");
}

export async function updateDiagnosticReportStatus(id: string, status: "new" | "reviewing" | "resolved" | "archived") {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("app_diagnostic_reports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function resolveDownloadBySlug(slug: string) {
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

    const primary = assetRows.find((item) => item.is_primary) ?? assetRows[0];
    if (primary.external_url) {
      return {
        filename: `${release.slug}.apk`,
        redirectUrl: primary.external_url,
        release,
        asset: normalizeAsset(primary),
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
    const asset = release.assets.find((item) => item.is_primary) ?? release.assets[0];
    if (!asset?.external_url) return null;
    return {
      filename: `${release.slug}.apk`,
      redirectUrl: asset.external_url,
      release,
      asset,
    };
  }
}
