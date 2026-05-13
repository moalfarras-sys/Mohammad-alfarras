export type AppAdminRole = "admin" | "editor";

export type AppFeatureItem = {
  title: string;
  body: string;
  icon?: string;
};

export type AppStepItem = {
  title: string;
  body: string;
};

export type AppProduct = {
  id: string;
  slug: string;
  product_name: string;
  hero_badge: string;
  tagline: string;
  short_description: string;
  long_description: string;
  support_email: string;
  support_whatsapp: string;
  support_url: string | null;
  privacy_path: string;
  play_store_url: string | null;
  package_name: string;
  android_min_sdk: number;
  android_target_sdk: number;
  android_tv_ready: boolean;
  default_download_label: string;
  feature_highlights: AppFeatureItem[];
  how_it_works: AppStepItem[];
  install_steps: AppStepItem[];
  compatibility_notes: string[];
  legal_notes: string[];
  changelog_intro: string;
  logo_path: string | null;
  hero_image_path: string | null;
  tv_banner_path: string | null;
  status: "draft" | "published";
  last_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type AppScreenshot = {
  id: string;
  product_slug: string;
  title: string;
  alt_text: string;
  image_path: string;
  device_frame: "phone" | "tv" | "landscape";
  sort_order: number;
  is_featured: boolean;
  created_at: string;
};

export type AppFaq = {
  id: string;
  product_slug: string;
  question: string;
  answer: string;
  sort_order: number;
  created_at: string;
};

export type AppReleaseAsset = {
  id: string;
  release_id: string;
  asset_type: "apk";
  label: string;
  abi: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  external_url: string | null;
  mime_type: string;
  file_size_bytes: number | null;
  checksum_sha256: string | null;
  is_primary: boolean;
  created_at: string;
};

export type AppRelease = {
  id: string;
  product_slug: string;
  slug: string;
  version_name: string;
  version_code: number;
  release_notes: string;
  compatibility_notes: string;
  published_at: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  assets: AppReleaseAsset[];
};

export type AppSupportRequest = {
  id: string;
  product_slug: string;
  name: string;
  email: string;
  message: string;
  status: "new" | "resolved";
  created_at: string;
};

export type AppDevice = {
  id: string;
  public_device_id: string;
  name: string | null;
  platform: string;
  device_type: string;
  app_version: string | null;
  status: "pending" | "active" | "blocked" | "revoked";
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export type ActivationRequest = {
  id: string;
  public_device_id: string;
  product_slug?: string | null;
  device_code: string;
  status: "waiting" | "activated" | "expired" | "failed";
  expires_at: string;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppLicense = {
  id: string;
  device_id: string;
  public_device_id?: string | null;
  plan: string;
  status: "active" | "expired" | "revoked";
  valid_until: string | null;
  created_at: string;
  updated_at: string;
};

export type DeviceProviderSourceQueue = {
  id: string;
  publicDeviceId: string;
  productSlug?: string;
  sourceType: "xtream" | "m3u";
  displayName: string;
  status: "pending" | "fetched" | "imported" | "failed" | "revoked";
  lastTestStatus?: "success" | "failed";
  lastTestMessage?: string;
  createdAt: string;
  updatedAt: string;
  pulledAt?: string;
  importedAt?: string;
  failedAt?: string;
  failureMessage?: string;
};

export type AppRuntimeConfig = {
  enabled: boolean;
  maintenanceMode: boolean;
  forceUpdate: boolean;
  minimumVersionCode: number;
  latestVersionName: string;
  latestVersionCode?: number;
  appName?: string;
  packageName?: string;
  message: string;
  accentColor: string;
  logoUrl: string;
  backgroundUrl: string;
  syncIntervalMinutes?: number;
  sourceProtocolFallback?: boolean;
  footballProviderMode?: string;
  weatherBackgroundMode?: string;
  weatherBackgroundUrl?: string;
  widgets: {
    weather: boolean;
    football: boolean;
    weatherCity?: string;
    footballMaxMatches?: number;
  };
  update?: {
    latestVersionName?: string;
    latestVersionCode?: number;
    downloadUrl?: string;
    apkSizeBytes?: number;
    checksumSha256?: string;
    releaseNotes?: string;
  };
  supportUrl: string;
  privacyUrl: string;
};

export type AppEcosystemData = {
  product: AppProduct;
  screenshots: AppScreenshot[];
  faqs: AppFaq[];
  releases: AppRelease[];
};
