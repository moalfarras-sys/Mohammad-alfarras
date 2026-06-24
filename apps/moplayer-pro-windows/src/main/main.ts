import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import electronUpdater from "electron-updater";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACTIVATION_URL,
  APP_PRODUCT_SLUG,
  WEB_BASE_URL,
  type ActivationSession,
  type NetRequest,
  type PlaylistFilePick,
  type SourceMeta,
  type SourceSecret,
  type UpdaterEvent,
  type WindowsUpdateInfo,
} from "../shared/types.js";
import { AppStore } from "./store.js";
import { StreamProxy } from "./streamProxy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const isSmokeTest = process.argv.includes("--smoke-test");
const qaFixture = process.argv.includes("--qa-fixture");
const qaScreen = process.argv.find((arg) => arg.startsWith("--qa-screen="))?.split("=")[1] ?? "";
const qaScreenshot = process.argv.find((arg) => arg.startsWith("--qa-screenshot="))?.slice("--qa-screenshot=".length) ?? "";
const qaUserData = process.argv.find((arg) => arg.startsWith("--qa-user-data="))?.slice("--qa-user-data=".length) ?? "";
const qaDebugPort = process.argv.find((arg) => arg.startsWith("--qa-debug-port="))?.slice("--qa-debug-port=".length) ?? "";
const qaLanguageArg = process.argv.find((arg) => arg.startsWith("--qa-language="))?.split("=")[1];
const qaLanguage = qaLanguageArg === "ar" || qaLanguageArg === "en" ? qaLanguageArg : "";
const qaMultiCount = Number(/^multi-([1-4])$/.exec(qaScreen)?.[1] ?? 0);
if (/^\d{2,5}$/.test(qaDebugPort)) {
  app.commandLine.appendSwitch("remote-debugging-port", qaDebugPort);
}

// Keep HD/4K live playback smooth and light on the CPU by leaning on the GPU.
// PlatformHEVCDecoderSupport lets H.265 feeds (common on 4K sports channels) decode
// in hardware where the OS ships the codec, instead of stuttering on software decode;
// D3D11VideoDecoder keeps the decode path on the GPU on Windows.
app.commandLine.appendSwitch(
  "enable-features",
  "PlatformHEVCDecoderSupport,D3D11VideoDecoder",
);
// Persist posters, channel logos, and stream segments in a large on-disk cache so
// they load instantly on the next launch instead of re-downloading from the server.
app.commandLine.appendSwitch("disk-cache-size", String(600 * 1024 * 1024));
const packageVersion = app.getVersion() || "1.0.0";
const qaFixtureDataPath = qaUserData || path.join(tmpdir(), "moplayer-pro-windows-qa");
if (qaFixture || qaUserData) {
  app.setPath("userData", qaFixture ? qaFixtureDataPath : qaUserData);
}
const store = new AppStore(packageVersion, qaFixture ? qaFixtureDataPath : qaUserData || undefined);
const streamProxy = new StreamProxy();

let mainWindow: BrowserWindow | null = null;

// Full in-app updates: packaged NSIS installs only. Portable builds, dev runs,
// and screenshot/smoke QA fall back to the website download banner instead.
const { autoUpdater } = electronUpdater;
const updaterSupported =
  app.isPackaged && !isSmokeTest && !qaFixture && !qaScreen && !process.env.PORTABLE_EXECUTABLE_DIR;

function sendUpdaterEvent(event: UpdaterEvent) {
  mainWindow?.webContents.send("updates:event", event);
  if (event.type !== "progress") {
    void store.log(`Updater: ${JSON.stringify(event)}`);
  }
}

function installUpdaterEvents() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on("checking-for-update", () => sendUpdaterEvent({ type: "checking" }));
  autoUpdater.on("update-available", (info) => sendUpdaterEvent({ type: "available", version: info.version }));
  autoUpdater.on("update-not-available", () => sendUpdaterEvent({ type: "not-available" }));
  autoUpdater.on("download-progress", (progress) =>
    sendUpdaterEvent({
      type: "progress",
      percent: Math.round(progress.percent),
      transferredBytes: progress.transferred,
      totalBytes: progress.total,
    }),
  );
  autoUpdater.on("update-downloaded", (info) => sendUpdaterEvent({ type: "downloaded", version: info.version }));
  autoUpdater.on("error", (error) => sendUpdaterEvent({ type: "error", message: String(error?.message ?? error).slice(0, 240) }));
}

function rendererUrl() {
  const rendererScreen = qaScreen === "multi-picker" || qaMultiCount > 0 ? "multi" : qaScreen;
  const hash = rendererScreen ? `#screen=${encodeURIComponent(rendererScreen)}` : "";
  if (isDev && process.env.VITE_DEV_SERVER_URL) return `${process.env.VITE_DEV_SERVER_URL}${hash}`;
  return `file://${path.join(__dirname, "../../dist/index.html")}${hash}`;
}

function createWindow(state = store.publicState()) {
  const windowState = state.windowState;
  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1024,
    minHeight: 660,
    backgroundColor: "#060608",
    title: "MoPlayer PC",
    show: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#06060800",
      symbolColor: "#faf9f7",
      height: 42,
    },
    webPreferences: {
      preload: path.join(__dirname, "../preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      // Never throttle the renderer's media/timer loop when the window is
      // backgrounded or occluded — that throttling is what makes live streams
      // (especially multi-view tiles) stutter when the app loses focus.
      backgroundThrottling: false,
    },
  });

  mainWindow.removeMenu();
  mainWindow.loadURL(rendererUrl());

  mainWindow.webContents.on("console-message", (details) => {
    void store.log(`Renderer console ${details.level}: ${details.message}`);
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    void store.log(`Renderer failed to load ${validatedUrl}: ${errorCode} ${errorDescription}`);
    if (isSmokeTest) {
      app.exit(1);
    }
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    void store.log(`Renderer process gone: ${details.reason}`);
    if (isSmokeTest) {
      app.exit(1);
    }
  });

  mainWindow.webContents.on("did-finish-load", () => {
    void store.log("Renderer finished loading.");
    if (isSmokeTest) {
      setTimeout(() => app.exit(0), 1500);
    }
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    if (windowState.fullscreen || state.settings.fullscreenOnLaunch) {
      mainWindow.setFullScreen(true);
    }
    mainWindow.show();
    if (qaScreenshot) {
      setTimeout(async () => {
        if (!mainWindow) return;
        try {
          await mkdir(path.dirname(qaScreenshot), { recursive: true });
          await mainWindow.webContents.executeJavaScript(`
            (async () => {
            document.querySelectorAll(".page-stack, .login-surface, .settings-grid, .browse-layout, .content-panel, .screen-area").forEach((node) => {
              if ("scrollTo" in node) node.scrollTo(0, 0);
            });
            window.scrollTo(0, 0);
            const multiCount = ${qaMultiCount};
            for (let index = 0; index < multiCount; index += 1) {
              const addButton = document.querySelector(index === 0 ? ".multi-empty" : ".multi-add-button");
              addButton?.click();
              await new Promise((resolve) => window.setTimeout(resolve, 180));
              const channels = document.querySelectorAll(".picker-list button");
              channels[index % Math.max(channels.length, 1)]?.click();
              await new Promise((resolve) => window.setTimeout(resolve, 320));
            }
            if (${JSON.stringify(qaScreen)} === "multi-picker") {
              for (let attempt = 0; attempt < 3 && !document.querySelector(".picker-overlay"); attempt += 1) {
                document.querySelector(".multi-empty")?.click();
                await new Promise((resolve) => window.setTimeout(resolve, 350));
              }
            }
            if (multiCount > 0) {
              await new Promise((resolve) => window.setTimeout(resolve, 3500));
            }
            })();
          `);
          const image = await mainWindow.webContents.capturePage();
          await writeFile(qaScreenshot, image.toPNG());
          app.exit(0);
        } catch (error) {
          await store.log(`QA screenshot failed: ${String(error)}`);
          app.exit(1);
        }
      }, qaScreen === "player" ? 6500 : 3200);
    }
  });

  mainWindow.on("close", () => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    void store.updateWindowState({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      fullscreen: mainWindow.isFullScreen(),
    });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      void shell.openExternal(url);
    }
    return { action: "deny" };
  });
}

async function requestText(input: NetRequest): Promise<string> {
  if (/^file:\/\//i.test(input.url)) {
    return readFile(fileURLToPath(input.url), "utf8");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 45000);
  try {
    const response = await fetch(input.url, {
      method: input.method ?? "GET",
      headers: {
        "User-Agent": "MoPlayer Pro Windows/1.0",
        ...(input.body ? { "Content-Type": "application/json" } : {}),
        ...input.headers,
      },
      body: input.body ? JSON.stringify(input.body) : undefined,
      signal: controller.signal,
      redirect: "follow",
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text.slice(0, 400) || `Request failed with HTTP ${response.status}`);
    }
    return text;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("The server took too long to respond. Check the address and your connection.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson<T = unknown>(input: NetRequest): Promise<T> {
  const text = await requestText(input);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`The server returned an unexpected response (not JSON): ${text.slice(0, 160)}`);
  }
}

async function readWindowsUpdateInfo(): Promise<WindowsUpdateInfo | null> {
  try {
    const meta = await requestJson<Record<string, unknown>>({
      url: `${WEB_BASE_URL}/downloads/moplayer/windows/latest-windows.json`,
      timeoutMs: 15000,
    });
    const version = typeof meta.version === "string" ? meta.version.trim() : "";
    const productSlug = typeof meta.productSlug === "string" ? meta.productSlug.trim() : "";
    if (!version || productSlug !== APP_PRODUCT_SLUG) return null;

    const releaseDate = typeof meta.releaseDate === "string" ? meta.releaseDate.trim() : undefined;
    const sha256 = typeof meta.sha256 === "string" ? meta.sha256.trim() : undefined;
    const fileSizeBytes = Number(meta.fileSizeBytes);
    return {
      version,
      releaseDate,
      sha256,
      fileSizeBytes: Number.isFinite(fileSizeBytes) && fileSizeBytes > 0 ? fileSizeBytes : undefined,
    };
  } catch (error) {
    await store.log(`Windows update metadata unavailable: ${String(error).slice(0, 220)}`);
    return null;
  }
}

function activationApi(pathname: string, params: Record<string, string> = {}) {
  const url = new URL(`/api/app/activation/${pathname.replace(/^\//, "")}`, WEB_BASE_URL);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

function installIpc() {
  ipcMain.handle("app:getState", () => store.publicState());
  ipcMain.handle("app:getDevice", () => store.publicState().device);
  ipcMain.handle("app:openExternal", async (_event, url: string) => {
    await shell.openExternal(url);
  });
  ipcMain.handle("app:toggleFullscreen", () => {
    const next = !mainWindow?.isFullScreen();
    mainWindow?.setFullScreen(next);
    void store.updateWindowState({ fullscreen: next });
    return next;
  });
  ipcMain.handle("app:setFullscreen", (_event, value: boolean) => {
    mainWindow?.setFullScreen(value);
    void store.updateWindowState({ fullscreen: value });
    return value;
  });
  ipcMain.handle("app:exportLogs", async () => {
    const options = {
      title: "Export MoPlayer PC logs",
      defaultPath: "moplayer-pro-logs.txt",
      filters: [{ name: "Text logs", extensions: ["txt", "log"] }],
    };
    const target = mainWindow
      ? await dialog.showSaveDialog(mainWindow, options)
      : await dialog.showSaveDialog(options);
    if (target.canceled || !target.filePath) return null;
    await store.exportLogs(target.filePath);
    return target.filePath;
  });
  ipcMain.handle("app:smokeReady", async () => {
    await store.log("Smoke test renderer ready.");
    if (isSmokeTest) {
      setTimeout(() => app.exit(0), 400);
    }
  });
  ipcMain.handle("app:pickPlaylistFile", async (): Promise<PlaylistFilePick | null> => {
    const options = {
      title: "Open M3U playlist",
      filters: [
        { name: "M3U playlists", extensions: ["m3u", "m3u8"] },
        { name: "All files", extensions: ["*"] },
      ],
      properties: ["openFile" as const],
    };
    const picked = mainWindow
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options);
    if (picked.canceled || !picked.filePaths[0]) return null;
    const filePath = picked.filePaths[0];
    const content = await readFile(filePath, "utf8");
    return { name: path.basename(filePath), path: filePath, content };
  });

  ipcMain.handle("store:updateSettings", (_event, settings) => store.updateSettings(settings));
  ipcMain.handle("store:saveSource", (_event, secret: SourceSecret, meta?: SourceMeta) => store.saveSource(secret, meta));
  ipcMain.handle("store:getActiveSecret", () => store.getActiveSecret());
  ipcMain.handle("store:setActiveSource", (_event, sourceId: string) => store.setActiveSource(sourceId));
  ipcMain.handle("store:deleteSource", (_event, sourceId: string) => store.deleteSource(sourceId));
  ipcMain.handle("store:saveLibrary", (_event, library) => store.saveLibrary(library));
  ipcMain.handle("store:clearLibrary", () => store.clearLibrary());
  ipcMain.handle("app:openDataFolder", async () => {
    await shell.openPath(store.publicState().device.userDataPath);
  });
  ipcMain.handle("app:setAlwaysOnTop", (_event, value: boolean) => {
    mainWindow?.setAlwaysOnTop(value, "floating");
    return Boolean(mainWindow?.isAlwaysOnTop());
  });

  ipcMain.handle("app:checkWindowsUpdate", () => readWindowsUpdateInfo());
  ipcMain.handle("app:checkForUpdates", async () => {
    if (!updaterSupported) return { supported: false };
    autoUpdater.checkForUpdates().catch((error) => {
      sendUpdaterEvent({ type: "error", message: String(error?.message ?? error).slice(0, 240) });
    });
    return { supported: true };
  });
  ipcMain.handle("app:installUpdate", () => {
    if (!updaterSupported) return;
    autoUpdater.quitAndInstall(true, true);
  });
  ipcMain.handle("store:setFavorite", (_event, itemId: string, value: boolean) => store.setFavorite(itemId, value));
  ipcMain.handle("store:saveWatchProgress", (_event, itemId: string, positionMs: number, durationMs: number) => {
    store.saveWatchProgress(itemId, positionMs, durationMs);
  });

  ipcMain.handle("activation:create", async (_event, deviceName?: string): Promise<ActivationSession> => {
    const sourcePullToken = await store.rotateSourcePullToken();
    const device = store.publicState().device;
    const response = await requestJson<{ status: string; code: string; expiresAt: string; ttlSeconds: number; message?: string }>({
      url: activationApi("create"),
      method: "POST",
      body: {
        publicDeviceId: device.publicDeviceId,
        deviceName: deviceName || device.deviceName,
        deviceType: "pc",
        platform: "windows",
        appVersion: packageVersion,
        sourcePullToken,
        productSlug: APP_PRODUCT_SLUG,
      },
    });
    const code = String(response.code ?? "").trim().toUpperCase();
    const complete = `${ACTIVATION_URL}&code=${encodeURIComponent(code)}`;
    return {
      code,
      verificationUrl: ACTIVATION_URL,
      verificationUrlComplete: complete,
      expiresAt: response.expiresAt,
      ttlSeconds: response.ttlSeconds ?? 900,
      publicDeviceId: device.publicDeviceId,
      sourcePullToken,
      status: "waiting",
      message: response.message,
    };
  });

  ipcMain.handle("activation:status", (_event, code: string) =>
    requestJson({
      url: activationApi("status", { code, product: APP_PRODUCT_SLUG }),
      timeoutMs: 20000,
    }),
  );
  ipcMain.handle("activation:source", (_event, publicDeviceId: string, token: string) =>
    requestJson({
      url: activationApi("source", { publicDeviceId, token, product: APP_PRODUCT_SLUG }),
      timeoutMs: 20000,
    }),
  );
  ipcMain.handle("activation:ack", (_event, publicDeviceId: string, token: string, sourceId: string, imported: boolean, message = "") =>
    requestJson({
      url: activationApi("source/ack"),
      method: "POST",
      body: {
        publicDeviceId,
        token,
        sourceId,
        status: imported ? "imported" : "failed",
        message,
      },
      timeoutMs: 20000,
    }),
  );

  ipcMain.handle("net:json", (_event, request: NetRequest) => requestJson(request));
  ipcMain.handle("net:text", (_event, request: NetRequest) => requestText(request));
  ipcMain.handle("stream:proxyUrl", (_event, url: string) => streamProxy.proxyUrl(url));
  ipcMain.handle("stream:base", () => streamProxy.start());
}

app.whenReady().then(async () => {
  let state = await store.load();
  if (qaFixture) {
    state = await store.installQaFixture();
  }
  if (qaLanguage) {
    state = await store.updateSettings({ language: qaLanguage });
  }
  streamProxy.setImageCacheDir(path.join(app.getPath("userData"), "image-cache"));
  await streamProxy.start();
  installIpc();
  if (updaterSupported) {
    installUpdaterEvents();
  }
  createWindow(state);
});

app.on("before-quit", () => {
  void store.flush();
});

app.on("window-all-closed", () => {
  streamProxy.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
