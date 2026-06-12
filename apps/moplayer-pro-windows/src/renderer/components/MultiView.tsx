import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
import { Loader2, Maximize2, Plus, Search, Tv, Volume2, VolumeX, X } from "lucide-react";

import type { MediaItem } from "../../shared/types";

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
};

function isHls(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

function isTs(url: string) {
  return /\.ts($|\?)/i.test(url);
}

/** Minimal stream engine for a multi-view tile: muted by default, no controls. */
function LiveTile({ item, focused, startDelayMs, onFocus, onRemove, onExpand, labels }: {
  item: MediaItem;
  focused: boolean;
  /** Tiles boot one after another so four simultaneous starts don't choke the app. */
  startDelayMs: number;
  onFocus: () => void;
  onRemove: () => void;
  onExpand: () => void;
  labels: MultiLabels;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    let cancelled = false;
    let hls: Hls | null = null;
    let tsPlayer: mpegts.Player | null = null;
    let bootTimer = 0;
    setLoading(true);
    setFailed(false);

    const boot = () => window.moPlayer.stream.proxyUrl(item.streamUrl).then((url) => {
      if (cancelled) return;
      if (isHls(item.streamUrl) && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          maxBufferLength: 8,
          backBufferLength: 4,
          // Each tile only decodes what its small viewport needs — this is what
          // keeps four parallel streams from freezing the app.
          capLevelToPlayerSize: true,
          startLevel: 0,
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setFailed(true);
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (isTs(item.streamUrl) && mpegts.getFeatureList().mseLivePlayback) {
        tsPlayer = mpegts.createPlayer(
          { type: "mse", isLive: true, url },
          { enableWorker: true, lazyLoad: false, liveBufferLatencyChasing: true, autoCleanupSourceBuffer: true },
        );
        tsPlayer.on(mpegts.Events.ERROR, () => setFailed(true));
        tsPlayer.attachMediaElement(video);
        tsPlayer.load();
      } else {
        video.src = url;
      }
      video.muted = true;
      void video.play().catch(() => setFailed(true));
    }).catch(() => setFailed(true));

    bootTimer = window.setTimeout(() => void boot(), startDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimer);
      hls?.destroy();
      try {
        tsPlayer?.destroy();
      } catch {
        // tile already detached
      }
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // startDelayMs only matters on first boot of this tile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

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
        onPlaying={() => setLoading(false)}
        onWaiting={() => setLoading(true)}
      />
      {loading && !failed ? <span className="tile-loading"><Loader2 className="spin" size={26} /></span> : null}
      {failed ? <span className="tile-loading"><Tv size={26} /></span> : null}
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

export function MultiViewScreen({ labels, channels, onExpand }: {
  labels: MultiLabels;
  channels: MediaItem[];
  onExpand: (item: MediaItem) => void;
}) {
  const [slots, setSlots] = useState<(MediaItem | null)[]>([null, null, null, null]);
  const [focusIndex, setFocusIndex] = useState(0);
  const [pickerFor, setPickerFor] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [category, setCategory] = useState("");

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
    if (needle) {
      pool = pool.filter((channel) => `${channel.title} ${channel.categoryName}`.toLowerCase().includes(needle));
    }
    return pool.slice(0, 200);
  }, [category, channels, filter]);

  const setSlot = (index: number, item: MediaItem | null) => {
    setSlots((current) => current.map((slot, slotIndex) => (slotIndex === index ? item : slot)));
  };

  return (
    <section className="multi-screen">
      <div className="multi-grid">
        {slots.map((slot, index) => slot ? (
          <LiveTile
            key={`${index}-${slot.id}`}
            item={slot}
            focused={focusIndex === index}
            startDelayMs={index * 600}
            onFocus={() => setFocusIndex(index)}
            onRemove={() => setSlot(index, null)}
            onExpand={() => onExpand(slot)}
            labels={labels}
          />
        ) : (
          <button key={`empty-${index}`} className="multi-empty" onClick={() => { setPickerFor(index); setFilter(""); setCategory(""); }}>
            <Plus size={30} />
            <span>{labels.addTile}</span>
          </button>
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
                  {channel.posterUrl ? <img src={channel.posterUrl} alt="" loading="lazy" /> : <Tv size={16} />}
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
