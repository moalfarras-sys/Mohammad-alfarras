import { useEffect, useMemo, useRef, useState } from "react";
import { History, Loader2, Play, Search, Tv } from "lucide-react";

import type { MediaItem } from "../../shared/types";
import type { EpgEntry } from "../lib/xtream";

type GuideLabels = {
  guideLabel: string;
  allCategories: string;
  search: string;
  noResults: string;
  liveBadge: string;
  catchupLabel: string;
  nowLabel: string;
};

type GuideGroup = { id: string; name: string; count: number };

const WINDOW_BACK_MS = 60 * 60 * 1000;
const WINDOW_AHEAD_MS = 3 * 60 * 60 * 1000;

function formatHm(ms: number) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function GuideRow({ channel, index, winStart, winEnd, loadEpg, onPlay, onCatchup, labels }: {
  channel: MediaItem;
  index: number;
  winStart: number;
  winEnd: number;
  loadEpg: (item: MediaItem) => Promise<EpgEntry[] | null>;
  onPlay: (item: MediaItem) => void;
  onCatchup: (channel: MediaItem, entry: EpgEntry) => void;
  labels: GuideLabels;
}) {
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [entries, setEntries] = useState<EpgEntry[] | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = rowRef.current;
    if (!node || seen) return undefined;
    const observer = new IntersectionObserver((hits) => {
      if (hits.some((hit) => hit.isIntersecting)) setSeen(true);
    }, { rootMargin: "300px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  useEffect(() => {
    if (!seen) return;
    let cancelled = false;
    void loadEpg(channel).then((result) => {
      if (!cancelled) setEntries(result ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, [channel, loadEpg, seen]);

  const span = winEnd - winStart;
  const now = Date.now();
  const blocks = (entries ?? [])
    .map((entry) => {
      const startMs = entry.start * 1000;
      const endMs = entry.end * 1000;
      if (endMs <= winStart || startMs >= winEnd) return null;
      const left = (Math.max(startMs, winStart) - winStart) / span;
      const width = (Math.min(endMs, winEnd) - Math.max(startMs, winStart)) / span;
      const isNow = startMs <= now && now < endMs;
      const isPast = endMs <= now;
      return { entry, left, width, isNow, isPast };
    })
    .filter((block): block is NonNullable<typeof block> => Boolean(block) && block!.width > 0.004);

  const canCatchup = (channel.tvArchiveDays ?? 0) > 0;

  return (
    <div ref={rowRef} className="guide-row">
      <button className="guide-channel" onClick={() => onPlay(channel)} title={channel.title}>
        <span className="guide-number">{index}</span>
        {channel.posterUrl
          ? <img src={channel.posterUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          : <Tv size={16} />}
        <strong>{channel.title}</strong>
        {canCatchup ? <History size={12} className="guide-archive" /> : null}
      </button>
      <div className="guide-timeline">
        {entries === null && seen ? <span className="guide-loading"><Loader2 className="spin" size={14} /></span> : null}
        {blocks.map(({ entry, left, width, isNow, isPast }) => {
          const clickable = isNow || (isPast && canCatchup);
          return (
            <button
              key={`${entry.start}-${entry.title}`}
              className={`guide-block ${isNow ? "is-now" : ""} ${isPast ? "is-past" : ""} ${clickable ? "is-clickable" : ""}`}
              style={{ insetInlineStart: `${left * 100}%`, width: `${width * 100}%` }}
              title={`${formatHm(entry.start * 1000)} – ${formatHm(entry.end * 1000)} · ${entry.title}${isPast && canCatchup ? ` (${labels.catchupLabel})` : ""}`}
              onClick={() => {
                if (isNow) onPlay(channel);
                else if (isPast && canCatchup) onCatchup(channel, entry);
              }}
              disabled={!clickable}
            >
              {(isPast && canCatchup) || isNow ? <Play size={10} /> : null}
              <span>{entry.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GuideScreen({ labels, channels, groups, loadEpg, onPlay, onCatchup }: {
  labels: GuideLabels;
  channels: MediaItem[];
  groups: GuideGroup[];
  loadEpg: (item: MediaItem) => Promise<EpgEntry[] | null>;
  onPlay: (item: MediaItem) => void;
  onCatchup: (channel: MediaItem, entry: EpgEntry) => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [filter, setFilter] = useState("");
  const [visibleCount, setVisibleCount] = useState(30);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Round the window start down to the half hour for stable ruler marks.
  const winStart = useMemo(() => {
    const base = nowTick - WINDOW_BACK_MS;
    return base - (base % (30 * 60 * 1000));
  }, [nowTick]);
  const winEnd = winStart + WINDOW_BACK_MS / 2 + WINDOW_AHEAD_MS;
  const span = winEnd - winStart;
  const nowRatio = Math.min(1, Math.max(0, (nowTick - winStart) / span));

  const filtered = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    let pool = categoryId ? channels.filter((channel) => channel.categoryId === categoryId) : channels;
    if (needle) pool = pool.filter((channel) => channel.title.toLowerCase().includes(needle));
    return pool;
  }, [categoryId, channels, filter]);

  useEffect(() => {
    setVisibleCount(30);
  }, [filtered]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= filtered.length) return undefined;
    const observer = new IntersectionObserver((hits) => {
      if (hits.some((hit) => hit.isIntersecting)) {
        setVisibleCount((current) => Math.min(filtered.length, current + 30));
      }
    }, { rootMargin: "500px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filtered.length, visibleCount]);

  const marks = useMemo(() => {
    const out: number[] = [];
    for (let t = winStart; t <= winEnd; t += 30 * 60 * 1000) out.push(t);
    return out;
  }, [winEnd, winStart]);

  return (
    <section className="guide-screen">
      <header className="guide-toolbar">
        <h2>{labels.guideLabel}</h2>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="">{labels.allCategories}</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.count})</option>)}
        </select>
        <div className="rail-search">
          <Search size={14} />
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder={labels.search} />
        </div>
      </header>

      <div className="guide-ruler">
        <span className="guide-channel-spacer" />
        <div className="guide-ruler-track">
          {marks.map((mark) => (
            <span key={mark} className="guide-mark" style={{ insetInlineStart: `${((mark - winStart) / span) * 100}%` }}>
              {formatHm(mark)}
            </span>
          ))}
          <span className="guide-nowline" style={{ insetInlineStart: `${nowRatio * 100}%` }}>
            <i>{labels.nowLabel}</i>
          </span>
        </div>
      </div>

      <div className="guide-body">
        {filtered.length ? filtered.slice(0, visibleCount).map((channel, index) => (
          <GuideRow
            key={channel.id}
            channel={channel}
            index={index + 1}
            winStart={winStart}
            winEnd={winEnd}
            loadEpg={loadEpg}
            onPlay={onPlay}
            onCatchup={onCatchup}
            labels={labels}
          />
        )) : <p className="status-note">{labels.noResults}</p>}
        {visibleCount < filtered.length ? <div ref={sentinelRef} className="grid-sentinel"><Loader2 className="spin" size={18} /></div> : null}
      </div>
    </section>
  );
}
