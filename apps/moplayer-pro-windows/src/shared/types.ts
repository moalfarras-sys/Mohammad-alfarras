export const APP_PRODUCT_SLUG = "moplayer2";
export const APP_NAME = "MoPlayer PC";
export const WEB_BASE_URL = "https://moalfarras.space";
export const ACTIVATION_URL = `${WEB_BASE_URL}/activate?product=${APP_PRODUCT_SLUG}`;

export type SourceKind = "xtream" | "m3u";
export type ContentType = "live" | "movie" | "series" | "episode";
export type ScreenId =
  | "home"
  | "live"
  | "guide"
  | "multi"
  | "matches"
  | "movies"
  | "series"
  | "episodes"
  | "search"
  | "favorites"
  | "settings"
  | "license"
  | "support"
  | "player";

export type PlayerStatus = "idle" | "loading" | "buffering" | "playing" | "paused" | "error";

export type SourceSecret = {
  kind: SourceKind;
  name: string;
  baseUrl?: string;
  username?: string;
  password?: string;
  playlistUrl?: string;
  epgUrl?: string;
};

export type XtreamAccountInfo = {
  status: string;
  expDate: number;
  isTrial: boolean;
  activeConnections: number;
  maxConnections: number;
  createdAt: number;
  allowedOutputFormats: string[];
  serverTimezone?: string;
  serverMessage?: string;
  usernameMasked?: string;
};

export type SourceMeta = {
  account?: XtreamAccountInfo | null;
  liveExtension?: "m3u8" | "ts";
};

export type StoredSource = {
  id: string;
  kind: SourceKind;
  name: string;
  host: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  account?: XtreamAccountInfo | null;
  liveExtension?: "m3u8" | "ts";
};

export type Category = {
  id: string;
  sourceId: string;
  type: ContentType;
  name: string;
  count: number;
};

export type MediaItem = {
  id: string;
  sourceId: string;
  type: ContentType;
  categoryId: string;
  categoryName: string;
  title: string;
  streamUrl: string;
  posterUrl?: string;
  backdropUrl?: string;
  description?: string;
  rating?: string;
  durationSecs?: number;
  addedAt?: number;
  seriesId?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  containerExtension?: string;
  favorite?: boolean;
  watchPositionMs?: number;
  watchDurationMs?: number;
  lastPlayedAt?: number;
  /** Catch-up archive window in days (Xtream tv_archive_duration), 0 = none. */
  tvArchiveDays?: number;
};

/** Rich metadata fetched on demand from the provider (get_vod_info / get_series_info). */
export type MediaDetails = {
  plot?: string;
  rating?: string;
  genre?: string;
  durationSecs?: number;
  director?: string;
  cast?: string;
  releaseDate?: string;
  posterUrl?: string;
  backdropUrl?: string;
  youtubeTrailer?: string;
};

export type LibraryData = {
  sourceId: string;
  sourceName: string;
  syncedAt: string;
  categories: Category[];
  media: MediaItem[];
};

export type AppSettings = {
  language: "en" | "ar";
  accentColor: string;
  compactDensity: boolean;
  autoPlayLastLive: boolean;
  hideEmptyCategories: boolean;
  fullscreenOnLaunch: boolean;
  showWeatherWidget: boolean;
  showFootballWidget: boolean;
  weatherCity: string;
  playerFit: "contain" | "cover";
  defaultPlaybackSpeed: number;
  parentalControlsEnabled: boolean;
  parentalPin?: string;
  /** Category ids the user chose to hide everywhere. */
  hiddenCategories?: string[];
};

export type DeviceInfo = {
  publicDeviceId: string;
  deviceName: string;
  platform: "windows";
  deviceType: "pc";
  appVersion: string;
  sourcePullToken: string;
  encryptionAvailable: boolean;
  userDataPath: string;
};

export type ActivationSession = {
  code: string;
  verificationUrl: string;
  verificationUrlComplete: string;
  expiresAt: string;
  ttlSeconds: number;
  publicDeviceId: string;
  sourcePullToken: string;
  status: "waiting" | "pending" | "activated" | "expired" | "invalid" | "error";
  message?: string;
  qrDataUrl?: string;
};

export type ActivationSourceResponse = {
  status: string;
  message?: string;
  sourceId?: string;
  source?: {
    type?: string;
    name?: string;
    serverUrl?: string;
    username?: string;
    password?: string;
    playlistUrl?: string;
    epgUrl?: string;
  };
};

export type PersistedState = {
  schemaVersion: 1;
  device: DeviceInfo;
  settings: AppSettings;
  sources: StoredSource[];
  library: LibraryData | null;
  favorites: Record<string, boolean>;
  watchProgress: Record<string, { positionMs: number; durationMs: number; updatedAt: number }>;
  windowState: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    fullscreen: boolean;
  };
};

export type NetRequest = {
  url: string;
  method?: "GET" | "POST" | "PATCH";
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export type WindowsUpdateInfo = {
  version: string;
  releaseDate?: string;
  fileSizeBytes?: number;
  sha256?: string;
};

/** Progress events streamed from the electron-updater pipeline in the main process. */
export type UpdaterEvent =
  | { type: "checking" }
  | { type: "available"; version: string }
  | { type: "not-available" }
  | { type: "progress"; percent: number; transferredBytes: number; totalBytes: number }
  | { type: "downloaded"; version: string }
  | { type: "error"; message: string };

export type PlaylistFilePick = {
  name: string;
  path: string;
  content: string;
};

export type MoPlayerApi = {
  app: {
    getState(): Promise<PersistedState>;
    getDevice(): Promise<DeviceInfo>;
    openExternal(url: string): Promise<void>;
    toggleFullscreen(): Promise<boolean>;
    setFullscreen(value: boolean): Promise<boolean>;
    exportLogs(): Promise<string | null>;
    pickPlaylistFile(): Promise<PlaylistFilePick | null>;
    openDataFolder(): Promise<void>;
    setAlwaysOnTop(value: boolean): Promise<boolean>;
    checkWindowsUpdate(): Promise<WindowsUpdateInfo | null>;
    /** Triggers an electron-updater check. supported=false means use the metadata fallback. */
    checkForUpdates(): Promise<{ supported: boolean }>;
    /** Quits and installs a downloaded update. */
    installUpdate(): Promise<void>;
    onUpdaterEvent(listener: (event: UpdaterEvent) => void): () => void;
    smokeReady(): Promise<void>;
  };
  store: {
    updateSettings(settings: Partial<AppSettings>): Promise<PersistedState>;
    saveSource(secret: SourceSecret, meta?: SourceMeta): Promise<{ source: StoredSource; state: PersistedState }>;
    getActiveSecret(): Promise<SourceSecret | null>;
    setActiveSource(sourceId: string): Promise<PersistedState>;
    deleteSource(sourceId: string): Promise<PersistedState>;
    saveLibrary(library: LibraryData): Promise<PersistedState>;
    clearLibrary(): Promise<PersistedState>;
    setFavorite(itemId: string, value: boolean): Promise<Record<string, boolean>>;
    saveWatchProgress(itemId: string, positionMs: number, durationMs: number): Promise<void>;
  };
  activation: {
    create(deviceName?: string): Promise<ActivationSession>;
    status(code: string): Promise<Record<string, unknown>>;
    source(publicDeviceId: string, token: string): Promise<ActivationSourceResponse>;
    ack(publicDeviceId: string, token: string, sourceId: string, imported: boolean, message?: string): Promise<Record<string, unknown>>;
  };
  net: {
    json<T = unknown>(request: NetRequest): Promise<T>;
    text(request: NetRequest): Promise<string>;
  };
  stream: {
    proxyUrl(url: string): Promise<string>;
    base(): Promise<string>;
  };
};
