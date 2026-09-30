import type { HlsConfig } from "hls.js";

import type { MediaItem } from "../../shared/types";

export const LIVE_START_TIMEOUT_MS = 12_000;
export const VOD_START_TIMEOUT_MS = 20_000;
export const LIVE_STALL_RECOVERY_MS = 3_500;
export const LIVE_STALL_RECONNECT_MS = 13_000;

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
  // HLS has a bounded media buffer, adaptive bitrate and native recovery for
  // timestamp holes. Raw TS remains a fast fallback for providers that do not
  // expose an HLS endpoint, but should not be the default on a desktop player:
  // malformed provider audio timestamps otherwise surface as visible stutter.
  return [url.replace(/\.ts(?=$|\?)/i, ".m3u8"), url];
}

export function hlsPlaybackConfig(mode: "main" | "multi", isLive: boolean): Partial<HlsConfig> {
  const multi = mode === "multi";
  return {
    enableWorker: true,
    startFragPrefetch: true,
    backBufferLength: isLive ? (multi ? 3 : 15) : 60,
    // The main view trades a little live-edge latency for a resilient forward
    // buffer. Multi-view stays intentionally lean so four tiles cannot exhaust
    // GPU memory or a provider connection allowance.
    maxBufferLength: isLive ? (multi ? 10 : 45) : 30,
    maxMaxBufferLength: isLive ? (multi ? 18 : 75) : 90,
    maxBufferSize: multi ? 24 * 1024 * 1024 : 96 * 1024 * 1024,
    maxBufferHole: isLive ? 0.5 : 0.1,
    detectStallWithCurrentTimeMs: 1_500,
    highBufferWatchdogPeriod: 2,
    nudgeOffset: 0.2,
    nudgeMaxRetry: 5,
    nudgeOnVideoHole: true,
    // Starting one segment further behind the edge avoids the fragile newest
    // segment while keeping sports/news genuinely live. The max distance leaves
    // enough room for recovery instead of oscillating around the live edge.
    liveSyncDurationCount: 4,
    liveMaxLatencyDurationCount: 12,
    liveSyncMode: "buffered",
    liveSyncOnStallIncrease: 1,
    maxLiveSyncPlaybackRate: 1.05,
    startOnSegmentBoundary: true,
    maxStarvationDelay: 4,
    maxLoadingDelay: 4,
    manifestLoadingTimeOut: 12_000,
    manifestLoadingMaxRetry: 3,
    levelLoadingTimeOut: 12_000,
    levelLoadingMaxRetry: 4,
    fragLoadingTimeOut: 15_000,
    fragLoadingMaxRetry: 5,
    abrEwmaDefaultEstimate: multi ? 1_200_000 : 2_000_000,
    abrBandWidthFactor: 0.72,
    abrBandWidthUpFactor: 0.6,
    // Auto quality should never decode 4K for a smaller window. A user-picked
    // quality level still takes precedence in PlayerView.
    capLevelToPlayerSize: true,
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
