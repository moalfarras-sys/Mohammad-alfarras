import type { HlsConfig } from "hls.js";

import type { MediaItem } from "../../shared/types";

export const LIVE_START_TIMEOUT_MS = 12_000;
export const VOD_START_TIMEOUT_MS = 20_000;
export const LIVE_STALL_RECOVERY_MS = 6_000;
export const LIVE_STALL_RECONNECT_MS = 14_000;

export function isHlsUrl(url: string) {
  return /\.m3u8(?:$|\?)/i.test(url);
}

export function isTsUrl(url: string) {
  return /\.ts(?:$|\?)/i.test(url);
}

export function isAbortError(reason: unknown) {
  return reason instanceof DOMException
    ? reason.name === "AbortError"
    : reason instanceof Error && reason.name === "AbortError";
}

/** Xtream live streams commonly expose the same channel as HLS and raw MPEG-TS. */
export function streamCandidates(item: MediaItem): string[] {
  const url = item.streamUrl;
  if (item.type !== "live" || !/\/live\/[^/]+\/[^/]+\/[^/?]+\.(?:m3u8|ts)(?:$|\?)/i.test(url)) {
    return [url];
  }
  if (isHlsUrl(url)) {
    return [url, url.replace(/\.m3u8(?=$|\?)/i, ".ts")];
  }
  return [url, url.replace(/\.ts(?=$|\?)/i, ".m3u8")];
}

export function hlsPlaybackConfig(mode: "main" | "multi", isLive: boolean): Partial<HlsConfig> {
  const multi = mode === "multi";
  return {
    enableWorker: true,
    startFragPrefetch: true,
    backBufferLength: isLive ? (multi ? 3 : 12) : 60,
    // A deeper forward buffer on the single live view rides out network jitter
    // without buffering on screen; multi-view stays lean to keep memory in check.
    maxBufferLength: isLive ? (multi ? 10 : 30) : 30,
    maxMaxBufferLength: isLive ? (multi ? 18 : 60) : 90,
    maxBufferSize: multi ? 24 * 1024 * 1024 : 64 * 1024 * 1024,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: 8,
    maxStarvationDelay: 4,
    maxLoadingDelay: 4,
    manifestLoadingTimeOut: 12_000,
    manifestLoadingMaxRetry: 3,
    levelLoadingTimeOut: 12_000,
    levelLoadingMaxRetry: 4,
    fragLoadingTimeOut: 15_000,
    fragLoadingMaxRetry: 5,
    abrEwmaDefaultEstimate: multi ? 1_200_000 : 2_000_000,
    abrBandWidthFactor: 0.85,
    capLevelToPlayerSize: multi,
    startLevel: multi ? 0 : -1,
  };
}

export function mpegtsPlaybackConfig(isLive: boolean) {
  return {
    enableWorker: true,
    enableStashBuffer: true,
    stashInitialSize: isLive ? 128 * 1024 : 384 * 1024,
    lazyLoad: !isLive,
    // Chase the live edge, but only correct on real drift. The old 2.5s ceiling
    // had the player constantly speeding up / nudging the playhead, which surfaced
    // as micro-stutter and audio glitches on jittery IPTV feeds.
    liveBufferLatencyChasing: isLive,
    liveBufferLatencyMaxLatency: 6,
    liveBufferLatencyMinRemain: 1.5,
    autoCleanupSourceBuffer: true,
    autoCleanupMaxBackwardDuration: isLive ? 24 : 180,
    autoCleanupMinBackwardDuration: isLive ? 8 : 120,
  };
}
