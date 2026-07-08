import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
import { Loader2, Maximize2, Plus, Search, Tv, Volume2, VolumeX, X } from "lucide-react";

import type { MediaItem } from "../../shared/types";
import {
  hlsPlaybackConfig,
  isAbortError,
  isHlsUrl,
  isTsUrl,
  LIVE_STALL_RECONNECT_MS,
  LIVE_STALL_RECOVERY_MS,
  LIVE_START_TIMEOUT_MS,
  mpegtsPlaybackConfig,
  streamCandidates,
} from "../lib/playback";
import { posterSrc } from "../lib/imageCache";

type MultiLabels = {
  multiView: string;
  pickChannel: string;
  addTile: string;
  removeTile: string;
  expandTile: string;
  audioOn: string;
  search: string;
  noResults: string;
  liveBadge: string;
  failedStream: string;
  retry: string;
  connectionLimitWarning: string;
};

/** Lightweight stream engine for a multi-view tile. */
function LiveTile({ item, focused, startDelayMs, onFocus, onRemove, onExpand, labels }: {
  item: MediaItem;
  focused: boolean;
  startDelayMs: number;
  onFocus: () => void;
  onRemove: () => void;
  onExpand: () => void;
  labels: MultiLabels;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    const element = videoRef.current;
    if (!element) return undefined;
    const video: HTMLVideoElement = element;

    let cancelled = false;
    let hls: Hls | null = null;
    let tsPlayer: mpegts.Player | null = null;
    let bootTimer = 0;
    let startupTimer = 0;
    let stallRecoveryTimer = 0;
    let stallReconnectTimer = 0;
    let candidateIndex = 0;
    let hasPlayed = false;
    const candidates = streamCandidates(item);
    setLoading(true);
    setFailed(false);

    function clearTimers() {
      window.clearTimeout(startupTimer);
      window.clearTimeout(stallRecoveryTimer);
      window.clearTimeout(stallReconnectTimer);
      startupTimer = 0;
      stallRecoveryTimer = 0;
      stallReconnectTimer = 0;
    }

    function destroyEngine() {
      hls?.destroy();
      hls = null;
      try {
        tsPlayer?.destroy();
      } catch {
        // The tile may already be detached while React is unmounting it.
      }
      tsPlayer = null;
    }

    function startPlayback(index: number) {
      void video.play().catch((reason) => {
        if (cancelled || isAbortError(reason)) return;
        failCandidate(index);
      });
    }

    function failCandidate(index: number) {
      if (cancelled || index !== candidateIndex) return;
      clearTimers();
      destroyEngine();
      video.pause();
      video.removeAttribute("src");
      video.load();

      const nextIndex = index + 1;
      if (nextIndex < candidates.length) {
        candidateIndex = nextIndex;
        void startCandidate(nextIndex);
        return;
      }

      candidateIndex = candidates.length;
      setLoading(false);
      setFailed(true);
    }

    async function startCandidate(index: number) {
      if (cancelled) return;
      candidateIndex = index;
      hasPlayed = false;
      setLoading(true);
      setFailed(false);
      video.muted = true;
      startupTimer = window.setTimeout(() => failCandidate(index), LIVE_START_TIMEOUT_MS);

      try {
        const sourceUrl = candidates[index];
        const url = await window.moPlayer.stream.proxyUrl(sourceUrl);
        if (cancelled || index !== candidateIndex) return;

        if (isHlsUrl(sourceUrl) && Hls.isSupported()) {
          const engine = new Hls(hlsPlaybackConfig("multi", true));
          hls = engine;
          let recoveredNetwork = false;
          let recoveredMedia = false;
          engine.on(Hls.Events.MANIFEST_PARSED, () => startPlayback(index));
          engine.on(Hls.Events.ERROR, (_event, data) => {
            if (!data.fatal || cancelled || index !== candidateIndex) return;
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !recoveredNetwork) {
              recoveredNetwork = true;
              engine.startLoad();
              return;
            }
            if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
              recoveredMedia = true;
              engine.recoverMediaError();
              return;
            }
            failCandidate(index);
          });
          engine.on(Hls.Events.MEDIA_ATTACHED, () => {
            if (!cancelled && index === candidateIndex) engine.loadSource(url);
          });
          engine.attachMedia(video);
        } else if (isTsUrl(sourceUrl) && mpegts.getFeatureList().mseLivePlayback) {
          const engine = mpegts.createPlayer(
            { type: "mse", isLive: true, url },
            mpegtsPlaybackConfig(true),
          );
          tsPlayer = engine;
          engine.on(mpegts.Events.ERROR, () => failCandidate(index));
          engine.attachMediaElement(video);
          engine.load();
          startPlayback(index);
        } else {
          video.src = url;
          video.load();
          startPlayback(index);
        }
      } catch {
        failCandidate(index);
      }
    }

    function onPlaying() {
      hasPlayed = true;
      clearTimers();
      video.muted = !focusedRef.current;
      setLoading(false);
    }

    function onStalled() {
      if (!hasPlayed || cancelled || candidateIndex >= candidates.length) return;
      setLoading(true);
      const index = candidateIndex;

      if (!stallRecoveryTimer) {
        stallRecoveryTimer = window.setTimeout(() => {
          if (cancelled || index !== candidateIndex || video.paused) return;
          if (hls) {
            const livePosition = hls.liveSyncPosition;
            if (livePosition && livePosition - video.currentTime > 4) {
              video.currentTime = Math.max(0, livePosition - 0.5);
            }
            hls.startLoad(-1);
          } else if (tsPlayer) {
            try {
              tsPlayer.unload();
              tsPlayer.load();
            } catch {
              // The reconnect timer will try the alternate live format.
            }
          }
          startPlayback(index);
        }, LIVE_STALL_RECOVERY_MS);
      }

      if (!stallReconnectTimer) {
        stallReconnectTimer = window.setTimeout(
          () => failCandidate(index),
          LIVE_STALL_RECONNECT_MS,
        );
      }
    }

    video.addEventListener("playing", onPlaying);
    video.addEventListener("waiting", onStalled);
    video.addEventListener("stalled", onStalled);
    bootTimer = window.setTimeout(() => void startCandidate(0), startDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      clearTimers();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("waiting", onStalled);
      video.removeEventListener("stalled", onStalled);
      destroyEngine();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // The delay is intentionally read only when a tile is first mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, retryNonce]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = !focused;
  }, [focused]);

  return (
    <article className={`multi-tile ${focused ? "is-focused" : ""}`} onClick={onFocus}>
      <video
        ref={videoRef}
        playsInline
        muted
        preload="auto"
        onPlaying={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
      />
      {loading && !failed ? <span className="tile-loading"><Loader2 className="spin" size={26} /></span> : null}
      {failed ? (
        <span className="tile-loading is-failed">
          <Tv size={26} />
          <small>{labels.failedStream}</small>
          <button onClick={(event) => { event.stopPropagation(); setRetryNonce((value) => value + 1); }}>{labels.retry}</button>
        </span>
      ) : null}
      <header className="tile-bar">
        <span className="live-badge">{labels.liveBadge}</span>
        <strong>{item.title}</strong>
        <span className="tile-actions">
          <button onClick={(event) => { event.stopPropagation(); onExpand(); }} title={labels.expandTile} aria-label={labels.expandTile}><Maximize2 size={14} /></button>
          <button onClick={(event) => { event.stopPropagation(); onRemove(); }} title={labels.removeTile} aria-label={labels.removeTile}><X size={14} /></button>
        </span>
      </header>
      <span className={`tile-audio ${focused ? "is-on" : ""}`} title={labels.audioOn}>
        {focused ? <Volume2 size={14} /> : <VolumeX size={14} />}
      </span>
    </article>
  );
}

export function MultiViewScreen({ labels, channels, connectionLimit = 0, onExpand }: {
  labels: MultiLabels;
  channels: MediaItem[];
  connectionLimit?: number;
  onExpand: (item: MediaItem) => void;
}) {
  const [slots, setSlots] = useState<(MediaItem | null)[]>([null, null, null, null]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("");
  const activeSlots = useMemo(
    () => slots.filter((slot): slot is MediaItem => slot !== null),
    [slots],
  );
  const activeIds = useMemo(() => new Set(activeSlots.map((slot) => slot.id)), [activeSlots]);
  const layoutCount = Math.max(1, activeSlots.length);
  const canAddSlot = activeSlots.length > 0 && activeSlots.length < 4;
  const overConnectionLimit = connectionLimit > 0 && activeSlots.length > connectionLimit;
  const showToolbar = canAddSlot || overConnectionLimit;

  const groups = useMemo(() => {
    const counts = new Map<string, { id: string; name: string; count: number }>();
    channels.forEach((channel) => {
      const id = channel.categoryId || channel.categoryName || "all";
      const current = counts.get(id);
      if (current) current.count += 1;
      else counts.set(id, { id, name: channel.categoryName || "Live", count: 1 });
    });
    return [...counts.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [channels]);

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    let pool = category ? channels.filter((channel) => channel.categoryId === category) : channels;
    pool = pool.filter((channel) => !activeIds.has(channel.id));
    if (needle) {
      pool = pool.filter((channel) => `${channel.title} ${channel.categoryName}`.toLowerCase().includes(needle));
    }
    return pool.slice(0, 200);
  }, [activeIds, category, channels, filter]);

  const setSlot = (index: number, item: MediaItem | null) => {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? item : slot)));
  };

  const removeSlot = useCallback((index: number) => {
    setSlots((current) => {
      const next = current.filter((slot): slot is MediaItem => slot !== null);
      next.splice(index, 1);
      return [...next, ...Array.from({ length: 4 - next.length }, () => null)];
    });
    setFocusIndex((current) => {
      const remainingCount = Math.max(0, activeSlots.length - 1);
      if (remainingCount === 0) return 0;
      if (current > index) return current - 1;
      return Math.min(current, remainingCount - 1);
    });
  }, [activeSlots.length]);

  const openPicker = (index: number) => {
    setPickerFor(index);
    setFilter("");
    setCategory("");
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (pickerFor !== null || activeSlots.length === 0) return;
      const target = event.target;
      if (target instanceof Element && target.matches("input, select, textarea, button")) return;

      let next = focusIndex;
      if (event.key === "ArrowLeft") next -= 1;
      else if (event.key === "ArrowRight") next += 1;
      else if (event.key === "ArrowUp") next -= 2;
      else if (event.key === "ArrowDown") next += 2;
      else if (event.key === "Enter") {
        event.preventDefault();
        onExpand(activeSlots[focusIndex]);
        return;
      } else if (event.key === "Delete") {
        event.preventDefault();
        removeSlot(focusIndex);
        return;
      } else {
        return;
      }

      event.preventDefault();
      setFocusIndex(Math.max(0, Math.min(activeSlots.length - 1, next)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlots, focusIndex, onExpand, pickerFor, removeSlot]);

  return (
    <section className={`multi-screen ${showToolbar ? "has-add-action" : ""}`}>
      {showToolbar ? (
        <div className="multi-toolbar">
          {overConnectionLimit ? (
            <span className="multi-connection-warning">
              {labels.connectionLimitWarning.replace("{count}", String(connectionLimit))}
            </span>
          ) : <span />}
          {canAddSlot ? (
            <button
              className="multi-add-button"
              onClick={() => openPicker(activeSlots.length)}
              title={labels.addTile}
              aria-label={labels.addTile}
            >
              <Plus size={18} />
              <span>{labels.addTile}</span>
            </button>
          ) : null}
        </div>
      ) : null}

      <div className={`multi-grid is-layout-${layoutCount}`} data-layout={layoutCount}>
        {activeSlots.length === 0 ? (
          <button className="multi-empty" onClick={() => openPicker(0)} aria-label={labels.addTile}>
            <Plus size={38} />
            <span>{labels.addTile}</span>
          </button>
        ) : activeSlots.map((slot, index) => (
          <LiveTile
            key={`${index}-${slot.id}`}
            item={slot}
            focused={focusIndex === index}
            startDelayMs={index * 700}
            onFocus={() => setFocusIndex(index)}
            onRemove={() => removeSlot(index)}
            onExpand={() => onExpand(slot)}
            labels={labels}
          />
        ))}
      </div>

      {pickerFor !== null ? (
        <div className="picker-overlay" onClick={() => setPickerFor(null)}>
          <div className="picker-card is-channel-picker" onClick={(event) => event.stopPropagation()}>
            <h3>{labels.pickChannel}</h3>
            <div className="picker-tools">
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{labels.pickChannel}</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name} ({group.count})</option>
                ))}
              </select>
              <div className="rail-search">
                <Search size={14} />
                <input autoFocus value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={labels.search} />
              </div>
            </div>
            <div className="picker-list">
              {filtered.length ? filtered.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => {
                    setSlot(pickerFor, channel);
                    setFocusIndex(pickerFor);
                    setPickerFor(null);
                  }}
                >
                  {channel.posterUrl ? <img src={posterSrc(channel.posterUrl)} alt="" loading="lazy" /> : <Tv size={16} />}
                  <span>
                    <strong>{channel.title}</strong>
                    <small>{channel.categoryName}</small>
                  </span>
                </button>
              )) : <p className="status-note">{labels.noResults}</p>}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
