import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

import type { AppSettings, LibraryData, MoPlayerApi, NetRequest, SourceMeta, SourceSecret, UpdaterEvent } from "./shared/types.js";

const api: MoPlayerApi = {
  app: {
    getState: () => ipcRenderer.invoke("app:getState"),
    getDevice: () => ipcRenderer.invoke("app:getDevice"),
    openExternal: (url: string) => ipcRenderer.invoke("app:openExternal", url),
    toggleFullscreen: () => ipcRenderer.invoke("app:toggleFullscreen"),
    setFullscreen: (value: boolean) => ipcRenderer.invoke("app:setFullscreen", value),
    exportLogs: () => ipcRenderer.invoke("app:exportLogs"),
    pickPlaylistFile: () => ipcRenderer.invoke("app:pickPlaylistFile"),
    openDataFolder: () => ipcRenderer.invoke("app:openDataFolder"),
    setAlwaysOnTop: (value: boolean) => ipcRenderer.invoke("app:setAlwaysOnTop", value),
    checkWindowsUpdate: () => ipcRenderer.invoke("app:checkWindowsUpdate"),
    checkForUpdates: () => ipcRenderer.invoke("app:checkForUpdates"),
    installUpdate: () => ipcRenderer.invoke("app:installUpdate"),
    onUpdaterEvent: (listener: (event: UpdaterEvent) => void) => {
      const handler = (_event: IpcRendererEvent, payload: UpdaterEvent) => listener(payload);
      ipcRenderer.on("updates:event", handler);
      return () => ipcRenderer.removeListener("updates:event", handler);
    },
    smokeReady: () => ipcRenderer.invoke("app:smokeReady"),
  },
  store: {
    updateSettings: (settings: Partial<AppSettings>) => ipcRenderer.invoke("store:updateSettings", settings),
    saveSource: (secret: SourceSecret, meta?: SourceMeta) => ipcRenderer.invoke("store:saveSource", secret, meta),
    getActiveSecret: () => ipcRenderer.invoke("store:getActiveSecret"),
    setActiveSource: (sourceId: string) => ipcRenderer.invoke("store:setActiveSource", sourceId),
    deleteSource: (sourceId: string) => ipcRenderer.invoke("store:deleteSource", sourceId),
    saveLibrary: (library: LibraryData) => ipcRenderer.invoke("store:saveLibrary", library),
    clearLibrary: () => ipcRenderer.invoke("store:clearLibrary"),
    setFavorite: (itemId: string, value: boolean) => ipcRenderer.invoke("store:setFavorite", itemId, value),
    saveWatchProgress: (itemId: string, positionMs: number, durationMs: number) =>
      ipcRenderer.invoke("store:saveWatchProgress", itemId, positionMs, durationMs),
  },
  activation: {
    create: (deviceName?: string) => ipcRenderer.invoke("activation:create", deviceName),
    status: (code: string) => ipcRenderer.invoke("activation:status", code),
    source: (publicDeviceId: string, token: string) => ipcRenderer.invoke("activation:source", publicDeviceId, token),
    ack: (publicDeviceId: string, token: string, sourceId: string, imported: boolean, message?: string) =>
      ipcRenderer.invoke("activation:ack", publicDeviceId, token, sourceId, imported, message),
  },
  net: {
    json: <T = unknown,>(request: NetRequest) => ipcRenderer.invoke("net:json", request) as Promise<T>,
    text: (request: NetRequest) => ipcRenderer.invoke("net:text", request),
  },
  stream: {
    proxyUrl: (url: string) => ipcRenderer.invoke("stream:proxyUrl", url),
    base: () => ipcRenderer.invoke("stream:base"),
  },
};

contextBridge.exposeInMainWorld("moPlayer", api);
