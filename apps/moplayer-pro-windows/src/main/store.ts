import { app, safeStorage } from "electron";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { hostname } from "node:os";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";

import type {
  AppSettings,
  DeviceInfo,
  LibraryData,
  PersistedState,
  SourceMeta,
  SourceSecret,
  StoredSource,
} from "../shared/types.js";

type EncryptedSecret = {
  sourceId: string;
  scheme: "safeStorage" | "base64";
  value: string;
};

type StoreFile = Omit<PersistedState, "library"> & {
  encryptedSecrets?: EncryptedSecret[];
  library?: LibraryData | null;
};

const schemaVersion = 1 as const;

const defaultSettings: AppSettings = {
  language: "en",
  accentColor: "#ff6b2c",
  compactDensity: false,
  autoPlayLastLive: false,
  hideEmptyCategories: true,
  fullscreenOnLaunch: false,
  showWeatherWidget: true,
  showFootballWidget: true,
  weatherCity: "Berlin",
  playerFit: "contain",
  defaultPlaybackSpeed: 1,
  parentalControlsEnabled: false,
  parentalPin: "",
  hiddenCategories: [],
};

function publicDeviceId() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let index = 0; index < 24; index += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MO-D-PC-${suffix}`;
}

function validPublicDeviceId(value: string) {
  return /^MO-D-[A-Z0-9-]{8,40}$/.test(value);
}

function token() {
  return randomBytes(32).toString("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function hostLabel(secret: SourceSecret) {
  const raw = secret.baseUrl || secret.playlistUrl || "";
  try {
    return new URL(raw).host.replace(/^www\./, "") || "Local file";
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/^file:\/\//i, "").split(/[\\/]/).pop() || "Local source";
  }
}

function createDevice(appVersion: string, userDataPath = app.getPath("userData")): DeviceInfo {
  return {
    publicDeviceId: publicDeviceId(),
    deviceName: `${hostname() || "Windows"} PC`,
    platform: "windows",
    deviceType: "pc",
    appVersion,
    sourcePullToken: token(),
    encryptionAvailable: safeStorage.isEncryptionAvailable(),
    userDataPath,
  };
}

function initialState(appVersion: string, userDataPath = app.getPath("userData")): StoreFile {
  return {
    schemaVersion,
    device: createDevice(appVersion, userDataPath),
    settings: defaultSettings,
    sources: [],
    favorites: {},
    watchProgress: {},
    windowState: {
      width: 1360,
      height: 820,
      fullscreen: false,
    },
    encryptedSecrets: [],
  };
}

export class AppStore {
  private state: StoreFile;
  private library: LibraryData | null = null;
  private readonly dataPath: string;
  private readonly libraryPath: string;
  private readonly logPath: string;
  private persistTimer: NodeJS.Timeout | null = null;

  constructor(private readonly appVersion: string, userData = app.getPath("userData")) {
    this.dataPath = path.join(userData, "moplayer-pro-data.json");
    this.libraryPath = path.join(userData, "moplayer-pro-library.json");
    this.logPath = path.join(userData, "logs", "app.log");
    this.state = initialState(appVersion, userData);
  }

  async load() {
    await mkdir(path.dirname(this.dataPath), { recursive: true });
    await mkdir(path.dirname(this.logPath), { recursive: true });
    if (!existsSync(this.dataPath)) {
      await this.persist();
      return this.publicState();
    }

    try {
      const raw = await readFile(this.dataPath, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoreFile>;
      this.state = {
        ...initialState(this.appVersion, path.dirname(this.dataPath)),
        ...parsed,
        schemaVersion,
        device: {
          ...createDevice(this.appVersion, path.dirname(this.dataPath)),
          ...parsed.device,
          platform: "windows",
          deviceType: "pc",
          appVersion: this.appVersion,
          encryptionAvailable: safeStorage.isEncryptionAvailable(),
          userDataPath: path.dirname(this.dataPath),
          sourcePullToken: parsed.device?.sourcePullToken || token(),
        },
        settings: {
          ...defaultSettings,
          ...parsed.settings,
        },
        sources: parsed.sources ?? [],
        favorites: parsed.favorites ?? {},
        watchProgress: parsed.watchProgress ?? {},
        encryptedSecrets: parsed.encryptedSecrets ?? [],
      };
      if (parsed.library) {
        this.library = parsed.library;
        delete this.state.library;
        await this.persistLibrary();
        await this.persist();
      } else if (existsSync(this.libraryPath)) {
        try {
          this.library = JSON.parse(await readFile(this.libraryPath, "utf8")) as LibraryData;
        } catch {
          this.library = null;
        }
      }
      if (!validPublicDeviceId(this.state.device.publicDeviceId)) {
        this.state.device.publicDeviceId = publicDeviceId();
        this.state.device.sourcePullToken = token();
        await this.persist();
      }
    } catch (error) {
      await this.log(`Store load failed, creating a fresh state: ${String(error)}`);
      this.state = initialState(this.appVersion, path.dirname(this.dataPath));
      await this.persist();
    }
    return this.publicState();
  }

  publicState(): PersistedState {
    const { encryptedSecrets: _secrets, library: _legacy, ...safe } = this.state;
    return { ...safe, library: this.library };
  }

  async installQaFixture() {
    const sourceId = "qa-source";
    const streamUrl = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";
    const poster = "https://moalfarras.space/images/moplayer-pro-player.webp";
    const timestamp = nowIso();
    this.state = {
      ...initialState(this.appVersion, path.dirname(this.dataPath)),
      device: {
        ...createDevice(this.appVersion, path.dirname(this.dataPath)),
        publicDeviceId: "MO-D-PC-QA-FIXTURE-LOCAL",
        deviceName: "MoPlayer Pro QA PC",
      },
      settings: {
        ...defaultSettings,
        fullscreenOnLaunch: false,
      },
      sources: [{
        id: sourceId,
        kind: "m3u",
        name: "QA technical stream",
        host: "test-streams.mux.dev",
        active: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      }],
      favorites: { "qa-live-1": true, "qa-movie-2": true },
      watchProgress: {
        "qa-movie-1": { positionMs: 620000, durationMs: 3600000, updatedAt: Date.now() },
      },
      windowState: {
        width: 1440,
        height: 920,
        fullscreen: false,
      },
      encryptedSecrets: [],
    };
    this.library = {
      sourceId,
      sourceName: "QA technical stream",
      syncedAt: timestamp,
      categories: [
        { id: "qa-live", sourceId, type: "live", name: "Live QA", count: 6 },
        { id: "qa-movies", sourceId, type: "movie", name: "Movies QA", count: 6 },
        { id: "qa-series", sourceId, type: "series", name: "Series QA", count: 3 },
        { id: "qa-episodes", sourceId, type: "episode", name: "Episodes QA", count: 6 },
      ],
      media: [
        ...Array.from({ length: 6 }, (_, index) => ({
          id: `qa-live-${index + 1}`,
          sourceId,
          type: "live" as const,
          categoryId: "qa-live",
          categoryName: "Live QA",
          title: `QA Live Channel ${index + 1}`,
          streamUrl,
          posterUrl: poster,
          description: "Technical QA HLS stream.",
          addedAt: Date.now() - index * 1000,
        })),
        ...Array.from({ length: 6 }, (_, index) => ({
          id: `qa-movie-${index + 1}`,
          sourceId,
          type: "movie" as const,
          categoryId: "qa-movies",
          categoryName: "Movies QA",
          title: `QA Movie ${index + 1}`,
          streamUrl,
          posterUrl: poster,
          description: "Technical QA movie item.",
          durationSecs: 3600 + index * 120,
          addedAt: Date.now() - index * 2000,
        })),
        ...Array.from({ length: 3 }, (_, index) => ({
          id: `qa-series-${index + 1}`,
          sourceId,
          type: "series" as const,
          categoryId: "qa-series",
          categoryName: "Series QA",
          title: `QA Series ${index + 1}`,
          streamUrl: "",
          posterUrl: poster,
          description: "Technical QA series shell.",
          seriesId: `qa-series-${index + 1}`,
          addedAt: Date.now() - index * 3000,
        })),
        ...Array.from({ length: 6 }, (_, index) => ({
          id: `qa-episode-${index + 1}`,
          sourceId,
          type: "episode" as const,
          categoryId: "qa-episodes",
          categoryName: "Episodes QA",
          title: `QA Episode ${index + 1}`,
          streamUrl,
          posterUrl: poster,
          description: "Technical QA episode item.",
          seriesId: "qa-series-1",
          seasonNumber: 1,
          episodeNumber: index + 1,
          addedAt: Date.now() - index * 4000,
        })),
      ],
    };
    await this.persist();
    await this.persistLibrary();
    return this.publicState();
  }

  async persist() {
    const { library: _legacy, ...rest } = this.state;
    await writeFile(this.dataPath, JSON.stringify(rest), "utf8");
  }

  private async persistLibrary() {
    if (!this.library) {
      await rm(this.libraryPath, { force: true });
      return;
    }
    await writeFile(this.libraryPath, JSON.stringify(this.library), "utf8");
  }

  private schedulePersist() {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      void this.persist();
    }, 1500);
  }

  async flush() {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    await this.persist();
  }

  async log(message: string) {
    const clean = message.replace(/password|username|token/gi, "[redacted]");
    await mkdir(path.dirname(this.logPath), { recursive: true });
    await writeFile(this.logPath, `[${new Date().toISOString()}] ${clean}\n`, { flag: "a" });
  }

  async exportLogs(targetPath: string) {
    if (!existsSync(this.logPath)) {
      await this.log("Log export requested.");
    }
    await copyFile(this.logPath, targetPath);
  }

  async updateSettings(settings: Partial<AppSettings>) {
    this.state.settings = { ...this.state.settings, ...settings };
    await this.persist();
    return this.publicState();
  }

  async updateWindowState(windowState: Partial<PersistedState["windowState"]>) {
    this.state.windowState = { ...this.state.windowState, ...windowState };
    await this.persist();
    return this.publicState();
  }

  async rotateSourcePullToken() {
    this.state.device.sourcePullToken = token();
    await this.persist();
    return this.state.device.sourcePullToken;
  }

  async saveSource(secret: SourceSecret, meta: SourceMeta = {}) {
    const existing = this.state.sources.find(
      (source) => source.kind === secret.kind && source.host === hostLabel(secret) && source.name === secret.name,
    );
    const timestamp = nowIso();
    const source: StoredSource = existing
      ? {
          ...existing,
          name: secret.name,
          host: hostLabel(secret),
          active: true,
          updatedAt: timestamp,
          account: meta.account !== undefined ? meta.account : existing.account,
          liveExtension: meta.liveExtension ?? existing.liveExtension,
        }
      : {
          id: randomUUID(),
          kind: secret.kind,
          name: secret.name || hostLabel(secret),
          host: hostLabel(secret),
          active: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          account: meta.account ?? null,
          liveExtension: meta.liveExtension,
        };

    this.state.sources = this.state.sources
      .filter((item) => item.id !== source.id)
      .map((item) => ({ ...item, active: false }));
    this.state.sources.unshift(source);
    this.state.encryptedSecrets = [
      ...this.state.encryptedSecrets?.filter((item) => item.sourceId !== source.id) ?? [],
      {
        sourceId: source.id,
        ...this.encryptSecret(secret),
      },
    ];
    if (this.library?.sourceId !== source.id) {
      this.library = null;
      await this.persistLibrary();
    }
    await this.persist();
    return { source, state: this.publicState() };
  }

  async setActiveSource(sourceId: string) {
    if (this.state.sources.some((item) => item.id === sourceId)) {
      this.state.sources = this.state.sources.map((item) => ({ ...item, active: item.id === sourceId }));
      if (this.library?.sourceId !== sourceId) {
        this.library = null;
        await this.persistLibrary();
      }
      await this.persist();
    }
    return this.publicState();
  }

  async getActiveSecret(): Promise<SourceSecret | null> {
    const source = this.state.sources.find((item) => item.active) ?? this.state.sources[0];
    if (!source) return null;
    const entry = this.state.encryptedSecrets?.find((item) => item.sourceId === source.id);
    if (!entry) return null;
    return this.decryptSecret(entry);
  }

  async deleteSource(sourceId: string) {
    this.state.sources = this.state.sources.filter((item) => item.id !== sourceId);
    this.state.encryptedSecrets = this.state.encryptedSecrets?.filter((item) => item.sourceId !== sourceId) ?? [];
    if (this.library?.sourceId === sourceId) {
      this.library = null;
      await this.persistLibrary();
    }
    if (this.state.sources.length && !this.state.sources.some((item) => item.active)) {
      this.state.sources[0] = { ...this.state.sources[0], active: true };
    }
    await this.persist();
    return this.publicState();
  }

  async saveLibrary(library: LibraryData) {
    this.library = library;
    await this.persistLibrary();
    return this.publicState();
  }

  async clearLibrary() {
    this.library = null;
    await this.persistLibrary();
    return this.publicState();
  }

  /** Returns only the favorites map — the full state is too heavy to ship over IPC per click. */
  async setFavorite(itemId: string, value: boolean) {
    if (value) {
      this.state.favorites[itemId] = true;
    } else {
      delete this.state.favorites[itemId];
    }
    await this.persist();
    return { ...this.state.favorites };
  }

  /** Fire-and-forget: called every few seconds during playback, must stay cheap. */
  saveWatchProgress(itemId: string, positionMs: number, durationMs: number) {
    this.state.watchProgress[itemId] = {
      positionMs: Math.max(0, Math.floor(positionMs)),
      durationMs: Math.max(0, Math.floor(durationMs)),
      updatedAt: Date.now(),
    };
    this.schedulePersist();
  }

  private encryptSecret(secret: SourceSecret): Omit<EncryptedSecret, "sourceId"> {
    const raw = JSON.stringify(secret);
    if (safeStorage.isEncryptionAvailable()) {
      return {
        scheme: "safeStorage",
        value: safeStorage.encryptString(raw).toString("base64"),
      };
    }
    return {
      scheme: "base64",
      value: Buffer.from(raw, "utf8").toString("base64"),
    };
  }

  private decryptSecret(entry: EncryptedSecret): SourceSecret | null {
    try {
      const raw =
        entry.scheme === "safeStorage"
          ? safeStorage.decryptString(Buffer.from(entry.value, "base64"))
          : Buffer.from(entry.value, "base64").toString("utf8");
      return JSON.parse(raw) as SourceSecret;
    } catch {
      return null;
    }
  }
}
