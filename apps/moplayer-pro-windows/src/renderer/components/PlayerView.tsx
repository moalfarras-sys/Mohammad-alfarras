import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import mpegts from "mpegts.js";
import {
  ArrowLeft,
  AudioLines,
  Captions,
  CircleDot,
  FastForward,
  Gauge,
  ListVideo,
  Loader2,
  Maximize2,
  MonitorPlay,
  Moon,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Rewind,
  Scaling,
  Search,
  Star,
  Tv,
  Volume2,
  VolumeX,
} from "lucide-react";

import type { MediaItem, PlayerStatus } from "../../shared/types";
import type { EpgEntry } from "../lib/xtream";

type PlayerLabels = {
  failedStream: string;
  retry: string;
  unsupported: string;
  liveBadge: string;
  buffering: string;
  audioTrack: string;
  subtitlesLabel: string;
  offLabel: string;
  nowLabel: string;
  nextLabel: string;
  relatedTitle: string;
  nowPlaying: string;
  qualityLabel: string;
  auto: string;
  channelsLabel: string;
  allCategories: string;
  search: string;
  noResults: string;
  recordLabel: string;
  recordingLabel: string;
  sleepTimer: string;
  pipLabel: string;
  aspectLabel: string;
  offLabel2?: string;
};

type ChannelGroup = { id: string; name: string; count: number };

type PlayerViewProps = {
  item: MediaItem;
  related: MediaItem[];
  /** Ordered neighbours for channel zapping with ArrowUp/ArrowDown on live items. */
  zapList?: MediaItem[];
  /** Every live category, so the in-player browser can reach all groups. */
  channelGroups?: ChannelGroup[];
  /** The full live channel list backing the in-player browser. */
  allChannels?: MediaItem[];
  /** Resume position for VOD content, in milliseconds. */
  initialPositionMs?: number;
  /** Now/next programme guide for the playing live channel. */
  epg?: EpgEntry[];
  favorite: boolean;
  fit: "contain" | "cover";
  defaultSpeed: number;
  labels: PlayerLabels;
  onBack: () => void;
  onPlayItem: (item: MediaItem) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onProgress: (item: MediaItem, positionMs: number, durationMs: number) => void;
};

type AudioTrackOption = { id: number; label: string };

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "00:00";
  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function isHlsUrl(url: string) {
  return /\.m3u8($|\?)/i.test(url);
}

function isTsUrl(url: string) {
  return /\.ts($|\?)/i.test(url);
}

/** Live Xtream streams exist in both HLS and raw TS variants on the same path. */
function streamCandidates(item: MediaItem): string[] {
  const url = item.streamUrl;
  if (item.type !== "live") return [url];
  const liveXtream = /\/live\/[^/]+\/[^/]+\/[^/.]+\.(m3u8|ts)$/i;
  if (liveXtream.test(url)) {
    if (isHlsUrl(url)) return [url, url.replace(/\.m3u8$/i, ".ts")];
    return [url, url.replace(/\.ts$/i, ".m3u8")];
  }
  return [url];
}

function RelatedPoster({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="related-fallback"><Play size={14} /></span>;
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function formatClock(unixSecs: number) {
  if (!unixSecs) return "";
  return new Date(unixSecs * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function PlayerView({ item, related, zapList, channelGroups, allChannels, initialPositionMs = 0, epg, favorite, fit, defaultSpeed, labels, onBack, onPlayItem, onToggleFavorite, onProgress }: PlayerViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const mpegtsRef = useRef<mpegts.Player | null>(null);
  const hideTimer = useRef<number>(0);
  // Live in a ref so the playback effect never restarts because a parent re-render
  // produced a new callback identity (this used to reset the stream every 5s).
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const resumeMsRef = useRef(initialPositionMs);
  const [status, setStatus] = useState<PlayerStatus>("idle");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [nonce, setNonce] = useState(0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.86);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(defaultSpeed || 1);
  const [uiVisible, setUiVisible] = useState(true);
  const [showRelated, setShowRelated] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrackOption[]>([]);
  const [audioTrack, setAudioTrack] = useState(-1);
  const [subtitleTracks, setSubtitleTracks] = useState<AudioTrackOption[]>([]);
  const [subtitleTrack, setSubtitleTrack] = useState(-1);
  const [qualityLevels, setQualityLevels] = useState<AudioTrackOption[]>([]);
  const [qualityLevel, setQualityLevel] = useState(-1);
  const [zapDigits, setZapDigits] = useState("");
  const zapTimer = useRef<number>(0);
  const [panelCategory, setPanelCategory] = useState("");
  const [panelFilter, setPanelFilter] = useState("");
  const [fitMode, setFitMode] = useState<"contain" | "cover" | "fill">(fit);
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [recordingPath, setRecordingPath] = useState("");

  const isLive = item.type === "live";

  // Sleep timer: pause playback when it elapses.
  useEffect(() => {
    if (!sleepMinutes) return undefined;
    const timer = window.setTimeout(() => {
      videoRef.current?.pause();
      setSleepMinutes(0);
    }, sleepMinutes * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [sleepMinutes]);

  // Stop any active recording when leaving the channel or the player.
  useEffect(() => {
    setRecordingPath("");
    return () => {
      void window.moPlayer.app.stopRecording();
    };
  }, [item.id]);

  const toggleRecording = async () => {
    if (recordingPath) {
      await window.moPlayer.app.stopRecording();
      setRecordingPath("");
      return;
    }
    // Record the raw TS variant — a single continuous stream that muxes cleanly to disk.
    const recordUrl = /\.m3u8($|\?)/i.test(item.streamUrl) && /\/live\//i.test(item.streamUrl)
      ? item.streamUrl.replace(/\.m3u8($|\?.*)/i, ".ts")
      : item.streamUrl;
    const path = await window.moPlayer.app.startRecording(recordUrl, item.title);
    if (path) setRecordingPath(path);
  };

  const togglePictureInPicture = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch {
      // PiP unavailable for this stream — ignore.
    }
  };

  const cycleFit = () => {
    setFitMode((current) => (current === "contain" ? "cover" : current === "cover" ? "fill" : "contain"));
  };

  const panelChannels = useMemo(() => {
    if (!isLive || !allChannels?.length) return [];
    const needle = panelFilter.trim().toLowerCase();
    let pool = panelCategory ? allChannels.filter((channel) => channel.categoryId === panelCategory) : allChannels;
    if (needle) pool = pool.filter((channel) => channel.title.toLowerCase().includes(needle));
    return pool.slice(0, 400);
  }, [allChannels, isLive, panelCategory, panelFilter]);
  const candidates = useMemo(() => streamCandidates(item), [item]);

  const destroyEngines = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.destroy();
      } catch {
        // engine already detached
      }
      mpegtsRef.current = null;
    }
  }, []);

  useEffect(() => {
    setAttempt(0);
    resumeMsRef.current = initialPositionMs;
    // The resume offset is read once per item change; later prop updates must not re-seek.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;
    if (!video) return undefined;
    const sourceUrl = candidates[Math.min(attempt, candidates.length - 1)];
    const hasFallback = attempt < candidates.length - 1;
    setStatus("loading");
    setError("");
    setAudioTracks([]);
    setAudioTrack(-1);
    setSubtitleTracks([]);
    setSubtitleTrack(-1);
    setQualityLevels([]);
    setQualityLevel(-1);
    destroyEngines();
    video.volume = volume;
    video.muted = muted;
    video.playbackRate = speed;

    const failOrFallback = (message: string) => {
      if (cancelled) return;
      if (hasFallback) {
        setAttempt((current) => current + 1);
        return;
      }
      setStatus("error");
      setError(message);
    };

    window.moPlayer.stream.proxyUrl(sourceUrl).then((url) => {
      if (cancelled) return;
      if (isHlsUrl(sourceUrl) && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          backBufferLength: 60,
          maxBufferLength: 30,
        });
        hlsRef.current = hls;
        let recoveredNetwork = false;
        let recoveredMedia = false;
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
          setAudioTracks(hls.audioTracks.map((track, index) => ({
            id: index,
            label: track.name || track.lang || `Track ${index + 1}`,
          })));
          setAudioTrack(hls.audioTrack);
        });
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          setSubtitleTracks(hls.subtitleTracks.map((track, index) => ({
            id: index,
            label: track.name || track.lang || `Sub ${index + 1}`,
          })));
          setSubtitleTrack(hls.subtitleTrack);
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (hls.levels.length > 1) {
            setQualityLevels(hls.levels.map((level, index) => ({
              id: index,
              label: level.height ? `${level.height}p` : `${Math.round((level.bitrate || 0) / 1000)} kbps`,
            })));
            setQualityLevel(-1);
          }
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !recoveredNetwork) {
            recoveredNetwork = true;
            hls.startLoad();
            return;
          }
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recoveredMedia) {
            recoveredMedia = true;
            hls.recoverMediaError();
            return;
          }
          hls.destroy();
          failOrFallback(data.details || labels.failedStream);
        });
        hls.loadSource(url);
        hls.attachMedia(video);
      } else if (isTsUrl(sourceUrl) && mpegts.getFeatureList().mseLivePlayback) {
        const player = mpegts.createPlayer(
          { type: "mse", isLive, url },
          { enableWorker: true, liveBufferLatencyChasing: true, lazyLoad: false },
        );
        mpegtsRef.current = player;
        player.on(mpegts.Events.ERROR, () => {
          try {
            player.destroy();
          } catch {
            // engine already detached
          }
          if (mpegtsRef.current === player) mpegtsRef.current = null;
          failOrFallback(labels.failedStream);
        });
        player.attachMediaElement(video);
        player.load();
      } else {
        video.src = url;
      }
      video.play().then(() => {
        if (!cancelled) setStatus("playing");
      }).catch((reason) => {
        failOrFallback(reason instanceof Error ? reason.message : labels.unsupported);
      });
    }).catch((reason) => {
      failOrFallback(reason instanceof Error ? reason.message : labels.failedStream);
    });

    const progressTimer = window.setInterval(() => {
      if (!video || isLive || video.paused || !video.currentTime) return;
      onProgressRef.current(item, video.currentTime * 1000, Number.isFinite(video.duration) ? video.duration * 1000 : 0);
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(progressTimer);
      destroyEngines();
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
    // volume/muted/speed/onProgress are applied through refs or their own effect;
    // re-running this effect restarts the stream, so the dep list stays minimal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, candidates, destroyEngines, isLive, item, labels.failedStream, labels.unsupported, nonce]);

  const scheduleHide = useCallback(() => {
    setUiVisible(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setUiVisible(false), 3200);
  }, []);

  useEffect(() => {
    scheduleHide();
    return () => window.clearTimeout(hideTimer.current);
  }, [scheduleHide]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setStatus("playing");
    } else {
      video.pause();
      setStatus("paused");
    }
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || isLive) return;
    video.currentTime = Math.max(0, Math.min(video.duration || video.currentTime, video.currentTime + seconds));
  }, [isLive]);

  const zapBy = useCallback((step: number) => {
    if (!zapList?.length) return;
    const index = zapList.findIndex((entry) => entry.id === item.id);
    const next = zapList[(index + step + zapList.length) % zapList.length];
    if (next && next.id !== item.id) onPlayItem(next);
  }, [item.id, onPlayItem, zapList]);

  // Receiver-style channel jump: type the channel number, it commits after a pause.
  const pushZapDigit = useCallback((digit: string) => {
    if (!isLive || !zapList?.length) return;
    setZapDigits((current) => {
      const next = (current + digit).slice(0, 4);
      window.clearTimeout(zapTimer.current);
      zapTimer.current = window.setTimeout(() => {
        setZapDigits("");
        const channelIndex = Number(next) - 1;
        const target = zapList[channelIndex];
        if (target && target.id !== item.id) onPlayItem(target);
      }, 1400);
      return next;
    });
  }, [isLive, item.id, onPlayItem, zapList]);

  useEffect(() => () => window.clearTimeout(zapTimer.current), []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      scheduleHide();
      if (event.key === " ") {
        event.preventDefault();
        togglePlay();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        seekBy(10);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-10);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (isLive) zapBy(1);
        else setVolume((value) => Math.min(1, value + 0.05));
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (isLive) zapBy(-1);
        else setVolume((value) => Math.max(0, value - 0.05));
      }
      if (event.key.toLowerCase() === "m") {
        event.preventDefault();
        video.muted = !video.muted;
        setMuted(video.muted);
      }
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        pushZapDigit(event.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLive, pushZapDigit, scheduleHide, seekBy, togglePlay, zapBy]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
    video.playbackRate = speed;
  }, [muted, speed, volume]);

  const setVideoVolume = (next: number) => {
    const value = Math.max(0, Math.min(1, next));
    setVolume(value);
    if (value > 0) setMuted(false);
  };

  const selectAudioTrack = (id: number) => {
    setAudioTrack(id);
    if (hlsRef.current) hlsRef.current.audioTrack = id;
  };

  const selectSubtitleTrack = (id: number) => {
    setSubtitleTrack(id);
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = id;
      hlsRef.current.subtitleDisplay = id >= 0;
    }
  };

  const selectQualityLevel = (id: number) => {
    setQualityLevel(id);
    if (hlsRef.current) hlsRef.current.currentLevel = id;
  };

  const nowSecs = Date.now() / 1000;
  const epgNow = epg?.find((entry) => entry.nowPlaying) ?? epg?.find((entry) => entry.start <= nowSecs && nowSecs < entry.end) ?? null;
  const epgNext = epg?.find((entry) => entry.start > (epgNow?.start ?? nowSecs)) ?? null;
  const epgProgress = epgNow && epgNow.end > epgNow.start
    ? Math.min(100, Math.max(0, Math.round(((nowSecs - epgNow.start) / (epgNow.end - epgNow.start)) * 100)))
    : 0;

  const controlsVisible = uiVisible || status === "paused" || status === "loading" || status === "error";

  return (
    <section
      className={`player-shell ${controlsVisible ? "" : "is-immersive"}`}
      onMouseMove={scheduleHide}
    >
      <video
        ref={videoRef}
        className="player-video"
        style={{ objectFit: fitMode }}
        controls={false}
        playsInline
        onClick={togglePlay}
        onDoubleClick={() => window.moPlayer.app.toggleFullscreen()}
        onWheel={(event) => setVideoVolume(volume + (event.deltaY < 0 ? 0.05 : -0.05))}
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          const total = Number.isFinite(video.duration) ? video.duration : 0;
          setDuration(total);
          const resumeSecs = resumeMsRef.current / 1000;
          resumeMsRef.current = 0;
          if (!isLive && resumeSecs > 20 && (!total || resumeSecs < total * 0.95)) {
            video.currentTime = resumeSecs;
          }
        }}
        onWaiting={() => setStatus("buffering")}
        onPlaying={() => setStatus("playing")}
        onPause={() => setStatus("paused")}
        onError={() => {
          if (!hlsRef.current && !mpegtsRef.current) {
            if (attempt < candidates.length - 1) {
              setAttempt((current) => current + 1);
            } else {
              setStatus("error");
              setError(labels.failedStream);
            }
          }
        }}
      />

      {status === "buffering" || status === "loading" ? (
        <div className="player-buffering">
          <Loader2 className="spin" size={42} />
          <span>{labels.buffering}</span>
        </div>
      ) : null}

      <div className="player-scrim" aria-hidden="true" />

      <div className="player-topbar">
        <button className="icon-button" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        {isLive && item.posterUrl ? <span className="player-channel-logo"><RelatedPoster src={item.posterUrl} /></span> : null}
        <div>
          <p>
            {isLive ? <span className="live-badge">{labels.liveBadge}</span> : null}
            {item.categoryName}
          </p>
          <h1>{item.title}</h1>
          {epgNow ? (
            <div className="player-epg">
              <span className="epg-now-title">{epgNow.title}</span>
              <span className="epg-times">{formatClock(epgNow.start)} – {formatClock(epgNow.end)}</span>
              <span className="epg-bar"><i style={{ width: `${epgProgress}%` }} /></span>
              {epgNext ? <span className="epg-next">{labels.nextLabel}: {epgNext.title}</span> : null}
            </div>
          ) : null}
        </div>
        <button
          className={`icon-button ${showRelated ? "is-on" : ""}`}
          onClick={() => setShowRelated((value) => !value)}
          aria-label={labels.relatedTitle}
          title={labels.relatedTitle}
        >
          <ListVideo size={20} />
        </button>
        <button className="icon-button" onClick={() => window.moPlayer.app.toggleFullscreen()} aria-label="Fullscreen">
          <Maximize2 size={20} />
        </button>
      </div>

      <div className="player-controls">
        {!isLive ? <button className="round-control" onClick={() => seekBy(-10)} aria-label="Back 10 seconds"><Rewind /></button> : null}
        <button className="round-control is-primary" onClick={togglePlay} aria-label="Play / pause">
          {status === "playing" || status === "buffering" ? <Pause /> : <Play />}
        </button>
        {!isLive ? <button className="round-control" onClick={() => seekBy(10)} aria-label="Forward 10 seconds"><FastForward /></button> : null}
        <button className={`round-control ${favorite ? "is-on" : ""}`} onClick={() => onToggleFavorite(item)} aria-label="Favorite"><Star /></button>
        <button className="round-control" onClick={() => { setAttempt(0); setNonce((value) => value + 1); }} aria-label="Reload"><RotateCcw /></button>
        <button className="round-control" onClick={() => setMuted((value) => !value)} aria-label="Mute">{muted ? <VolumeX /> : <Volume2 />}</button>
        <label className="player-slider" aria-label="Volume">
          <input type="range" min="0" max="1" step="0.02" value={muted ? 0 : volume} onChange={(event) => setVideoVolume(Number(event.target.value))} />
        </label>
        {!isLive ? (
          <label className="speed-select" aria-label="Playback speed">
            <Gauge size={16} />
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}>
              {[0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}x</option>)}
            </select>
          </label>
        ) : null}
        {audioTracks.length > 1 ? (
          <label className="speed-select" aria-label={labels.audioTrack}>
            <AudioLines size={16} />
            <select value={audioTrack} onChange={(event) => selectAudioTrack(Number(event.target.value))}>
              {audioTracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
            </select>
          </label>
        ) : null}
        {subtitleTracks.length > 0 ? (
          <label className="speed-select" aria-label={labels.subtitlesLabel}>
            <Captions size={16} />
            <select value={subtitleTrack} onChange={(event) => selectSubtitleTrack(Number(event.target.value))}>
              <option value={-1}>{labels.offLabel}</option>
              {subtitleTracks.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}
            </select>
          </label>
        ) : null}
        {qualityLevels.length > 0 ? (
          <label className="speed-select" aria-label={labels.qualityLabel}>
            <MonitorPlay size={16} />
            <select value={qualityLevel} onChange={(event) => selectQualityLevel(Number(event.target.value))}>
              <option value={-1}>{labels.auto}</option>
              {qualityLevels.map((level) => <option key={level.id} value={level.id}>{level.label}</option>)}
            </select>
          </label>
        ) : null}
        {isLive ? (
          <button
            className={`round-control ${recordingPath ? "is-recording" : ""}`}
            onClick={() => void toggleRecording()}
            aria-label={labels.recordLabel}
            title={recordingPath ? `${labels.recordingLabel} — ${recordingPath}` : labels.recordLabel}
          >
            <CircleDot />
          </button>
        ) : null}
        <button className="round-control" onClick={() => void togglePictureInPicture()} aria-label={labels.pipLabel} title={labels.pipLabel}>
          <PictureInPicture2 />
        </button>
        <button className="round-control" onClick={cycleFit} aria-label={labels.aspectLabel} title={`${labels.aspectLabel}: ${fitMode}`}>
          <Scaling />
        </button>
        <label className="speed-select" aria-label={labels.sleepTimer} title={labels.sleepTimer}>
          <Moon size={16} />
          <select value={sleepMinutes} onChange={(event) => setSleepMinutes(Number(event.target.value))}>
            <option value={0}>{labels.offLabel}</option>
            {[30, 60, 90, 120].map((value) => <option key={value} value={value}>{value}m</option>)}
          </select>
        </label>
      </div>

      {recordingPath ? (
        <span className="rec-indicator"><CircleDot size={13} /> {labels.recordingLabel}</span>
      ) : null}

      {zapDigits ? (
        <div className="zap-overlay" aria-hidden="true">
          <span>{zapDigits}</span>
        </div>
      ) : null}

      {!isLive && duration > 0 ? (
        <div className="player-progress">
          <span>{formatTime(position)}</span>
          <input type="range" min="0" max={duration} step="1" value={Math.min(position, duration)} onChange={(event) => {
            const video = videoRef.current;
            const next = Number(event.target.value);
            if (video) video.currentTime = next;
            setPosition(next);
          }} />
          <span>{formatTime(duration)}</span>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="player-error">
          <strong>{labels.failedStream}</strong>
          <p>{error || labels.unsupported}</p>
          <button className="primary-button" onClick={() => { setAttempt(0); setNonce((value) => value + 1); }}>{labels.retry}</button>
        </div>
      ) : null}

      {showRelated && isLive && allChannels?.length ? (
        <aside className="player-channels">
          <header>
            <h4><Tv size={14} /> {labels.channelsLabel}</h4>
            <select value={panelCategory} onChange={(event) => setPanelCategory(event.target.value)}>
              <option value="">{labels.allCategories}</option>
              {(channelGroups ?? []).map((group) => (
                <option key={group.id} value={group.id}>{group.name} ({group.count})</option>
              ))}
            </select>
            <div className="rail-search">
              <Search size={13} />
              <input value={panelFilter} onChange={(event) => setPanelFilter(event.target.value)} placeholder={labels.search} />
            </div>
          </header>
          <div className="player-channel-list">
            {panelChannels.length ? panelChannels.map((channel) => (
              <button
                key={channel.id}
                className={channel.id === item.id ? "is-playing" : ""}
                onClick={() => onPlayItem(channel)}
              >
                {channel.posterUrl ? <RelatedPoster src={channel.posterUrl} /> : <span className="related-fallback"><Tv size={13} /></span>}
                <span className="related-copy">
                  <span>{channel.title}</span>
                  <small>{channel.categoryName}</small>
                </span>
                {channel.id === item.id ? <span className="live-badge">{labels.liveBadge}</span> : null}
              </button>
            )) : <p className="status-note">{labels.noResults}</p>}
          </div>
        </aside>
      ) : showRelated && related.length ? (
        <aside className="player-related">
          <h4>{labels.relatedTitle}</h4>
          {related.slice(0, 14).map((next) => (
            <button key={next.id} onClick={() => onPlayItem(next)}>
              {next.posterUrl ? <RelatedPoster src={next.posterUrl} /> : <span className="related-fallback"><Play size={14} /></span>}
              <span className="related-copy">
                <span>{next.title}</span>
                <small>{next.categoryName}</small>
              </span>
            </button>
          ))}
        </aside>
      ) : null}
    </section>
  );
}
