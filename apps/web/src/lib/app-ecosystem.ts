import { createHash } from "node:crypto";

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
    id: "release-v2-2-full",
    product_slug: "moplayer",
    slug: "moplayer-v2.2-full",
    version_name: "v2.2 full",
    version_code: 6,
    release_notes:
      "v2.2 full fixes LibVLC native library extraction on emulator and x86 devices, adds safe VLC preflight loading, improves live MPEG-TS/HLS fallback, hardens large Xtream movie and series sync, and recovers empty catalogs after interrupted imports.",
    compatibility_notes: "Recommended universal TV APK for Android 7.0+ with arm64-v8a and armeabi-v7a native code included.",
    published_at: now,
    is_published: true,
    created_at: now,
    updated_at: now,
    assets: [
      {
        id: "asset-v2-2-full-universal",
        release_id: "release-v2-2-full",
        asset_type: "apk",
        label: "Recommended TV APK",
        abi: "universal",
        storage_bucket: null,
        storage_path: null,
        external_url: moplayerDownloadUrls.universal,
        mime_type: "application/vnd.android.package-archive",
        file_size_bytes: 47948265,
        checksum_sha256: "594364262f5a46c76e54c4e8d5d6961a59dfa2ba4308b616eec987b88ba573b1",
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
    product_name: "MoPlayer2",
    hero_badge: "Next Android TV Media Experience",
    tagline: "The newer MoPlayer generation with a cleaner TV-first control and release path.",
    short_description:
      "MoPlayer2 is the new Android and Android TV app line in the Moalfarras ecosystem, separated from the classic MoPlayer release channel.",
    long_description:
      "MoPlayer2 keeps the same domain, admin, and Supabase foundation while giving the new app its own public page, screenshots, releases, FAQs, support queue, and future runtime controls.",
    package_name: "com.mo.moplayer",
    default_download_label: "Download MoPlayer2 APK",
    feature_highlights: [
      { title: "Separate product line", body: "MoPlayer2 has its own page, release channel, and admin records.", icon: "box" },
      { title: "Same trusted website", body: "Users still download and verify through moalfarras.space.", icon: "shield" },
      { title: "TV-first direction", body: "Built for Android TV navigation and long-session media browsing.", icon: "tv" },
      { title: "Ready for growth", body: "The structure supports future activation, runtime config, and support per app.", icon: "zap" },
    ],
    how_it_works: [
      { title: "Choose MoPlayer2", body: "Open the MoPlayer2 product page from the Apps section." },
      { title: "Download the correct APK", body: "Use the latest MoPlayer2 release when it is published." },
      { title: "Manage separately", body: "Control MoPlayer2 from the same admin with its own product switch." },
    ],
    install_steps: [
      { title: "Download MoPlayer2", body: "Use the MoPlayer2 release card on this page." },
      { title: "Allow installation", body: "Enable install from trusted sources if Android asks." },
      { title: "Open and configure", body: "Launch MoPlayer2 and connect only sources you are allowed to use." },
    ],
    compatibility_notes: [
      "Android 7.0+ (API 24 and above)",
      "Separated from the classic MoPlayer public release channel",
      "Designed for Android TV and remote-first navigation",
    ],
    changelog_intro: "MoPlayer2 releases are tracked separately from the classic MoPlayer app.",
    logo_path: "/images/moplayer-icon-512.png",
    hero_image_path: "/images/moplayer2-hero-banner.png",
    tv_banner_path: "/images/moplayer2-hero-banner.png",
  },
};

const fallbackScreenshotsBySlug: Record<string, AppScreenshot[]> = {
  moplayer: fallbackScreenshots,
  moplayer2: [
    { id: "moplayer2-screen-1", product_slug: "moplayer2", title: "Home Screen", alt_text: "MoPlayer2 home screen with content rows", image_path: "/images/moplayer2-home-screen.png", device_frame: "tv", sort_order: 1, is_featured: true, created_at: now },
    { id: "moplayer2-screen-2", product_slug: "moplayer2", title: "Live TV", alt_text: "MoPlayer2 live TV channel grid", image_path: "/images/moplayer2-live-tv.png", device_frame: "tv", sort_order: 2, is_featured: false, created_at: now },
    { id: "moplayer2-screen-3", product_slug: "moplayer2", title: "Movies", alt_text: "MoPlayer2 movies and series browser", image_path: "/images/moplayer2-movies.png", device_frame: "tv", sort_order: 3, is_featured: false, created_at: now },
    { id: "moplayer2-screen-4", product_slug: "moplayer2", title: "Player", alt_text: "MoPlayer2 media player screen", image_path: "/images/moplayer2-player.png", device_frame: "tv", sort_order: 4, is_featured: false, created_at: now },
    { id: "moplayer2-screen-5", product_slug: "moplayer2", title: "Login", alt_text: "MoPlayer2 login and activation screen", image_path: "/images/moplayer2-login.png", device_frame: "tv", sort_order: 5, is_featured: false, created_at: now },
  ],
};

const fallbackFaqsBySlug: Record<string, AppFaq[]> = {
  moplayer: fallbackFaqs,
  moplayer2: fallbackFaqs.map((item, index) => ({
    ...item,
    id: `moplayer2-faq-${index + 1}`,
    product_slug: "moplayer2",
    question: item.question.replace("MoPlayer", "MoPlayer2"),
    answer: item.answer.replace("MoPlayer", "MoPlayer2"),
  })),
};

const fallbackReleasesBySlug: Record<string, AppRelease[]> = {
  moplayer: fallbackReleases,
  moplayer2: [
    {
      ...fallbackReleases[0],
      id: "release-moplayer2-v1",
      product_slug: "moplayer2",
      slug: "moplayer2-v1-full",
      version_name: "v1 full",
      version_code: 1,
      release_notes:
        "Initial MoPlayer2 product channel. Publish the production APK from the admin panel when the new app is ready for public download.",
      assets: [
        {
          ...fallbackReleases[0].assets[0],
          id: "asset-moplayer2-v1-placeholder",
          release_id: "release-moplayer2-v1",
          label: "MoPlayer2 APK",
          external_url: null,
          file_size_bytes: null,
          checksum_sha256: null,
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

function asSiteSettingValue<T>(value: T): Record<string, unknown> {
  return value as unknown as Record<string, unknown>;
}

function normalizeProduct(row: Partial<AppProduct> | null | undefined, productSlug = "moplayer"): AppProduct {
  const fallback = fallbackFor(productSlug).product;
  if (!row) return fallback;
  return {
    ...fallback,
    ...row,
    feature_highlights: parseFeatureList(row.feature_highlights, fallback.feature_highlights),
    how_it_works: parseStepsList(row.how_it_works, fallback.how_it_works),
    install_steps: parseStepsList(row.install_steps, fallback.install_steps),
    compatibility_notes: parseStringList(row.compatibility_notes, fallback.compatibility_notes),
    legal_notes: parseStringList(row.legal_notes, fallback.legal_notes),
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

  return {
    product: normalizeProduct(product as Partial<AppProduct>, slug),
    screenshots: (Array.isArray(screenshots) ? screenshots : fallback.screenshots) as AppScreenshot[],
    faqs: (Array.isArray(faqs) ? faqs : fallback.faqs) as AppFaq[],
    releases: (Array.isArray(releases) ? releases : fallback.releases) as AppRelease[],
  };
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

    const data = {
      product: normalizeProduct(productRes.data as Partial<AppProduct> | null, slug),
      screenshots:
        (screenshotsRes.data as AppScreenshot[] | null)?.length
          ? ((screenshotsRes.data as AppScreenshot[]) ?? [])
          : fallback.screenshots,
      faqs: (faqRes.data as AppFaq[] | null)?.length ? ((faqRes.data as AppFaq[]) ?? []) : fallback.faqs,
      releases: releases.map((row) => normalizeRelease(row, assetsMap.get(row.id) ?? [])),
    };

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

export async function readAdminAppData(productSlug = "moplayer") {
  const ecosystem = await readAppEcosystem(productSlug);
  let supportRequests: AppSupportRequest[] = [];

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("app_support_requests")
      .select("*")
      .eq("product_slug", productSlug)
      .order("created_at", { ascending: false })
      .limit(50);
    supportRequests = (data as AppSupportRequest[] | null) ?? [];
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
          product_slug: productSlug,
          name: row.name,
          email: row.email,
          message: row.message,
          status: row.subject.includes("[resolved]") ? "resolved" : "new",
          created_at: row.created_at,
        })) ?? [];
    }

    if (!supportRequests.length) {
      const current = await readSiteSetting("moplayer_app_support_requests", asSiteSettingValue(fallbackSupportRequests));
      supportRequests = (Array.isArray(current) ? (current as AppSupportRequest[]) : fallbackSupportRequests)
        .filter((item) => item.product_slug === productSlug)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
    }
  }

  return {
    ...ecosystem,
    supportRequests,
  };
}

export async function saveAppProduct(input: Partial<AppProduct> & { slug: string }) {
  const fallback = fallbackFor(input.slug).product;
  const payload = {
    ...fallback,
    ...input,
    slug: resolveManagedAppSlug(input.slug),
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_products").upsert(payload, { onConflict: "slug" });
    if (error) throw error;
  } catch {
    await upsertSiteSetting(`${payload.slug}_app_product`, asSiteSettingValue(payload));
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
    const fallback = fallbackFor(payload.product_slug);
    const current = await readSiteSetting(`${resolveManagedAppSlug(payload.product_slug)}_app_faqs`, asSiteSettingValue(fallback.faqs));
    const next = [...(Array.isArray(current) ? (current as AppFaq[]) : fallback.faqs).filter((item) => item.id !== payload.id), payload].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    await upsertSiteSetting(`${resolveManagedAppSlug(payload.product_slug)}_app_faqs`, asSiteSettingValue(next));
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
    const fallback = fallbackFor(payload.product_slug);
    const current = await readSiteSetting(`${resolveManagedAppSlug(payload.product_slug)}_app_screenshots`, asSiteSettingValue(fallback.screenshots));
    const next = [...(Array.isArray(current) ? (current as AppScreenshot[]) : fallback.screenshots).filter((item) => item.id !== payload.id), payload].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    await upsertSiteSetting(`${resolveManagedAppSlug(payload.product_slug)}_app_screenshots`, asSiteSettingValue(next));
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
    const fallback = fallbackFor(payload.product_slug);
    const current = await readSiteSetting(`${resolveManagedAppSlug(payload.product_slug)}_app_releases`, asSiteSettingValue(fallback.releases));
    const next = [
      ...(Array.isArray(current) ? (current as AppRelease[]) : fallback.releases).filter((item) => item.slug !== payload.slug),
      { ...payload, assets: input.assets ?? [] },
    ].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    await upsertSiteSetting(`${resolveManagedAppSlug(payload.product_slug)}_app_releases`, asSiteSettingValue(next));
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
  const fallbackPayload: AppSupportRequest = {
    id: crypto.randomUUID(),
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
      product_slug: input.product_slug,
      name: input.name,
      email: input.email,
      message: input.message,
      status: "new",
    });
    if (error) throw error;
  } catch {
    if (hasDatabaseUrl()) {
      const inserted = await queryRows(
        `insert into contact_messages
          (name, email, phone, subject, message, budget, locale, project_types)
         values ($1, $2, null, $3, $4, null, 'en', $5::jsonb)`,
        [input.name, input.email, "MoPlayer support", input.message, JSON.stringify(["moplayer-support"])],
      ).then(() => true).catch(() => false);

      if (inserted) {
        return;
      }
    }

    const slug = resolveManagedAppSlug(input.product_slug);
    const current = await readSiteSetting(`${slug}_app_support_requests`, asSiteSettingValue(fallbackSupportRequests));
    const next = [fallbackPayload, ...(Array.isArray(current) ? (current as AppSupportRequest[]) : fallbackSupportRequests)].slice(0, 100);
    await upsertSiteSetting(`${slug}_app_support_requests`, asSiteSettingValue(next));
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
