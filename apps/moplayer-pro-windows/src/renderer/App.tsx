import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import QRCode from "qrcode";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock3,
  CloudSun,
  Copy,
  Download,
  ExternalLink,
  Film,
  FolderOpen,
  Heart,
  Home,
  Info,
  KeyRound,
  Languages,
  LayoutGrid,
  LifeBuoy,
  ListVideo,
  Lock,
  Pin,
  PinOff,
  Loader2,
  Maximize2,
  MonitorPlay,
  Play,
  Plus,
  Power,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  Trophy,
  Tv,
} from "lucide-react";

import {
  ACTIVATION_URL,
  APP_NAME,
  WEB_BASE_URL,
  type ActivationSession,
  type AppSettings,
  type ContentType,
  type LibraryData,
  type MediaDetails,
  type MediaItem,
  type PersistedState,
  type ScreenId,
  type SourceSecret,
  type StoredSource,
} from "../shared/types";
import { PlayerView } from "./components/PlayerView";
import { MultiViewScreen } from "./components/MultiView";
import { GuideScreen } from "./components/GuideScreen";
import { HubCard } from "./components/ui/HubCard";
import { PremiumDock } from "./components/ui/PremiumDock";
import { SplashScreen } from "./components/ui/SplashScreen";
import tvBanner from "./assets/moplayer-tv-banner.png";
import markLogo from "./assets/moplayer-mark.png";
import { labelsFor, type Labels } from "./copy";
import { byNewest, hostLabel } from "./lib/hash";
import { parseM3u } from "./lib/m3u";
import {
  applyHiddenCategories,
  applyParentalFilter,
  categoriesByType,
  categoryLabel,
  favorites,
  featuredRows,
  filterByCategory,
  mediaByType,
  searchMedia,
  withLocalFlags,
} from "./lib/library";
import { authenticateXtream, buildTimeshiftUrl, extractXtreamFromM3uUrl, loadShortEpg, loadXtream, loadXtreamEpisodes, loadXtreamVodInfo, type EpgEntry } from "./lib/xtream";

type LoginMode = "activation" | "xtream" | "m3u";
type Toast = { tone: "ok" | "error" | "info"; message: string };
type WeatherWidget = {
  city?: string;
  country?: string;
  temp_c?: number;
  condition?: string;
  humidity?: number;
  wind_kph?: number;
  error?: string | boolean;
};
type FootballMatch = {
  league?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeLogo?: string;
  awayLogo?: string;
  homeGoals?: number | null;
  awayGoals?: number | null;
  status?: string;
  date?: string;
};
type FootballWidget = {
  primaryMatch?: FootballMatch | null;
  matches?: FootballMatch[];
  source?: string;
  error?: string;
};

const dockItems: Array<{ id: ScreenId; icon: React.ElementType; key: keyof Labels }> = [
  { id: "search", icon: Search, key: "search" },
  { id: "home", icon: Home, key: "home" },
  { id: "live", icon: Tv, key: "live" },
  { id: "guide", icon: CalendarRange, key: "guideLabel" },
  { id: "multi", icon: LayoutGrid, key: "multiView" },
  { id: "movies", icon: Film, key: "movies" },
  { id: "series", icon: Clapperboard, key: "series" },
  { id: "favorites", icon: Heart, key: "favorites" },
  { id: "settings", icon: Settings, key: "settings" },
];

function safeError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en", { notation: value > 9999 ? "compact" : "standard" }).format(value);
}

/** Numeric semver-style comparison so "1.10.0" beats "1.9.0". */
function isNewerVersion(latest: string, current: string) {
  const pa = latest.split(".").map((part) => parseInt(part, 10) || 0);
  const pb = current.split(".").map((part) => parseInt(part, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const a = pa[i] ?? 0;
    const b = pb[i] ?? 0;
    if (a !== b) return a > b;
  }
  return false;
}

const UPDATE_DOWNLOAD_URL = `${WEB_BASE_URL}/api/app/download/latest?product=moplayer2&platform=windows`;

function formatDate(raw?: string) {
  if (!raw) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(raw));
}

function formatUnixDate(raw?: number) {
  if (!raw || raw <= 0) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(raw * 1000));
}

function sourceStatusLine(source: StoredSource | null, labels: Labels) {
  if (!source) return labels.noContent;
  if (!source.account) return source.host || labels.localSource;
  const account = source.account;
  return [
    account.status || "Active",
    account.expDate ? `${labels.accountExpiry} ${formatUnixDate(account.expDate)}` : "",
  ].filter(Boolean).join(" · ");
}

function isPlayable(item: MediaItem) {
  return item.type !== "series" && Boolean(item.streamUrl);
}

function initialScreenFromHash(): ScreenId {
  const raw = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("screen") as ScreenId | null;
  const allowed: ScreenId[] = ["home", "live", "guide", "multi", "movies", "series", "episodes", "search", "favorites", "settings", "license", "support", "player"];
  return raw && allowed.includes(raw) ? raw : "home";
}

/** Abstract Palmyra-inspired Syrian colonnade line art, soft and barely there. */
function LandmarkLineArt() {
  return (
    <svg className="landmark-art" viewBox="0 0 640 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M24 230 H616" strokeLinecap="round" />
      <path d="M70 230 C132 176 206 156 292 164 C388 173 450 130 572 92" strokeLinecap="round" />
      <path d="M86 230 V126 M106 230 V126 M82 126 H110 M78 112 H114" strokeLinecap="round" />
      <path d="M152 230 V108 M172 230 V108 M148 108 H176 M144 94 H180" strokeLinecap="round" />
      <path d="M218 230 V98 M238 230 V98 M214 98 H242 M210 84 H246" strokeLinecap="round" />
      <path d="M284 230 V104 M304 230 V104 M280 104 H308 M276 90 H312" strokeLinecap="round" />
      <path d="M350 230 V118 M370 230 V118 M346 118 H374 M342 104 H378" strokeLinecap="round" />
      <path d="M416 230 V136 M436 230 V136 M412 136 H440 M408 122 H444" strokeLinecap="round" />
      <path d="M62 146 C90 122 122 122 150 146 M128 132 C154 104 196 104 222 132 M204 124 C236 92 284 92 316 124 M302 132 C336 110 382 112 416 140" strokeLinecap="round" />
      <path d="M116 78 C210 44 324 42 434 74 C478 86 528 82 590 56" strokeLinecap="round" />
      <circle cx="116" cy="78" r="4" />
      <circle cx="590" cy="56" r="4" />
    </svg>
  );
}

/** Drifting aurora wallpaper recreated from the Android AtmosphericBackground. */
function AuroraBackground() {
  const hour = new Date().getHours();
  const tone = hour < 5 || hour >= 20 ? "night" : hour < 7 ? "dawn" : hour < 17 ? "day" : "dusk";
  return (
    <div className={`aurora is-${tone}`} aria-hidden="true">
      <span className="aurora-blob is-a" />
      <span className="aurora-blob is-b" />
      <span className="aurora-blob is-c" />
      <span className="aurora-blob is-d" />
      <RibbonArt />
      <LandmarkLineArt />
      <span className="aurora-vignette" />
    </div>
  );
}

function BrandMark({ size = 34 }: { size?: number }) {
  return <img className="brand-mark-img" src={markLogo} alt="" style={{ height: size }} />;
}

/** Theme accent presets — applied as CSS variables so the whole UI re-tints live. */
const ACCENT_PRESETS = [
  { value: "#ff6b2c", name: "Orange" },
  { value: "#f1cc83", name: "Gold" },
  { value: "#ff3b4d", name: "Red" },
  { value: "#34d399", name: "Green" },
  { value: "#4da3ff", name: "Blue" },
  { value: "#9b6bff", name: "Purple" },
];

function hexChannel(hex: string, index: number) {
  return parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
}

function useAccentTheme(accent?: string) {
  useEffect(() => {
    const valid = accent && /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#ff6b2c";
    const r = hexChannel(valid, 0);
    const g = hexChannel(valid, 1);
    const b = hexChannel(valid, 2);
    const lift = (channel: number, t: number) => Math.round(channel + (255 - channel) * t);
    const lighter = `rgb(${lift(r, 0.26)}, ${lift(g, 0.26)}, ${lift(b, 0.26)})`;
    const lightest = `rgb(${lift(r, 0.45)}, ${lift(g, 0.45)}, ${lift(b, 0.45)})`;
    const root = document.documentElement.style;
    root.setProperty("--accent", valid);
    root.setProperty("--accent-b", lighter);
    root.setProperty("--accent-c", lightest);
    root.setProperty("--accent-deep", `rgb(${Math.round(r * 0.88)}, ${Math.round(g * 0.88)}, ${Math.round(b * 0.88)})`);
    root.setProperty("--glow", `rgba(${r}, ${g}, ${b}, 0.55)`);
    root.setProperty("--glow-soft", `rgba(${r}, ${g}, ${b}, 0.12)`);
    root.setProperty("--glow-strong", `rgba(${r}, ${g}, ${b}, 0.28)`);
    root.setProperty("--glass-border", `rgba(${r}, ${g}, ${b}, 0.14)`);
    root.setProperty("--glass-border-strong", `rgba(${r}, ${g}, ${b}, 0.38)`);
    root.setProperty("--gradient-orange", `linear-gradient(135deg, ${valid} 0%, ${lighter} 52%, ${lightest} 100%)`);
    root.setProperty("--gradient-orange-subtle", `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2), rgba(${r}, ${g}, ${b}, 0.06))`);
    root.setProperty("--shadow-button", `0 10px 28px rgba(${r}, ${g}, ${b}, 0.36)`);
    root.setProperty("--neon-orange", `0 0 24px rgba(${r}, ${g}, ${b}, 0.45), 0 0 48px rgba(${r}, ${g}, ${b}, 0.15)`);
  }, [accent]);
}

/** Flowing light ribbons echoing the logo swoosh — the signature backdrop. */
function RibbonArt() {
  return (
    <svg className="ribbon-art" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ribbon-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="0.45" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="0.62" stopColor="var(--accent-b)" stopOpacity="0.4" />
          <stop offset="1" stopColor="var(--accent-c)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="ribbon is-a" d="M-120,650 C 260,520 480,780 830,610 S 1330,430 1560,540" />
      <path className="ribbon is-b" d="M-120,740 C 300,660 570,860 910,690 S 1350,540 1560,640" />
      <path className="ribbon is-c" d="M-120,190 C 330,330 650,130 990,260 S 1390,370 1560,250" />
    </svg>
  );
}

export function App() {
  const [state, setState] = useState<PersistedState | null>(null);
  const [screen, setScreen] = useState<ScreenId>(initialScreenFromHash);
  const [returnScreen, setReturnScreen] = useState<ScreenId>("home");
  const [loginMode, setLoginMode] = useState<LoginMode>("activation");
  const [showLogin, setShowLogin] = useState(() => window.location.hash.includes("screen=login"));
  const [loading, setLoading] = useState("Preparing");
  const [toast, setToast] = useState<Toast | null>(null);
  const [weather, setWeather] = useState<WeatherWidget | null>(null);
  const [football, setFootball] = useState<FootballWidget | null>(null);
  const [updateVersion, setUpdateVersion] = useState("");
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [activation, setActivation] = useState<ActivationSession | null>(null);
  const [activationBusy, setActivationBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState<ContentType | "">("");
  const [categoryId, setCategoryId] = useState("");
  const [playing, setPlaying] = useState<MediaItem | null>(null);
  const [seriesFocus, setSeriesFocus] = useState<MediaItem | null>(null);
  const [seriesDetails, setSeriesDetails] = useState<MediaDetails | null>(null);
  const [episodes, setEpisodes] = useState<MediaItem[]>([]);
  const autoPlayDone = useRef(false);
  const [pinned, setPinned] = useState(false);
  const detailsCache = useRef(new Map<string, MediaDetails>());
  const epgCache = useRef(new Map<string, { entries: EpgEntry[]; fetchedAt: number }>());
  const [playingEpg, setPlayingEpg] = useState<EpgEntry[] | null>(null);
  const [pinPrompt, setPinPrompt] = useState<"set" | "enter" | null>(null);
  const [forms, setForms] = useState({
    xtreamName: "",
    xtreamUrl: "",
    xtreamUser: "",
    xtreamPassword: "",
    m3uName: "",
    m3uUrl: "",
    epgUrl: "",
  });

  const labels = labelsFor(state?.settings.language ?? "en");
  const library = useMemo(() => {
    const merged = withLocalFlags(state?.library ?? null, state?.favorites ?? {}, state?.watchProgress ?? {});
    const visible = applyHiddenCategories(merged, state?.settings.hiddenCategories ?? []);
    return applyParentalFilter(visible, Boolean(state?.settings.parentalControlsEnabled));
  }, [state]);
  const activeSource = state?.sources.find((source) => source.active) ?? state?.sources[0] ?? null;
  const rows = useMemo(() => featuredRows(library), [library]);
  const counts = useMemo(() => ({
    live: mediaByType(library, "live").length,
    movies: mediaByType(library, "movie").length,
    series: mediaByType(library, "series").length,
    favorites: favorites(library).length,
  }), [library]);
  const loginVisible = Boolean(state) && (!activeSource || showLogin);

  useAccentTheme(state?.settings.accentColor);

  const showToast = useCallback((tone: Toast["tone"], message: string) => {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 4200);
  }, []);

  const hydrate = useCallback(async () => {
    const fresh = await window.moPlayer.app.getState();
    setState(fresh);
    if (fresh.settings.fullscreenOnLaunch) {
      await window.moPlayer.app.setFullscreen(true);
    }
  }, []);

  useEffect(() => {
    hydrate().then(() => {
      setLoading("");
      void window.moPlayer.app.smokeReady();
    }).catch((error) => {
      setLoading("");
      showToast("error", safeError(error, "Could not load local app state."));
    });
  }, [hydrate, showToast]);

  useEffect(() => {
    if (!state) return;
    if (window.location.hash.includes("screen=player") && !playing) {
      const firstPlayable = (state.library?.media ?? []).find(isPlayable);
      if (firstPlayable) {
        setPlaying(firstPlayable);
        setReturnScreen("home");
        setScreen("player");
      }
    }
  }, [playing, state]);

  // Resume the last watched live channel once on launch when the setting is on.
  useEffect(() => {
    if (!state || autoPlayDone.current || !state.settings.autoPlayLastLive || playing) return;
    if (window.location.hash.includes("screen=")) {
      autoPlayDone.current = true;
      return;
    }
    const lastLive = (library?.media ?? [])
      .filter((item) => item.type === "live" && (item.lastPlayedAt ?? 0) > 0)
      .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))[0];
    if (lastLive) {
      autoPlayDone.current = true;
      setPlaying(lastLive);
      setReturnScreen("home");
      setScreen("player");
    }
  }, [library, playing, state]);

  useEffect(() => {
    if (!state) return;
    let cancelled = false;
    const loadServices = async () => {
      const tasks: Promise<void>[] = [];
      if (state.settings.showWeatherWidget) {
        tasks.push(
          window.moPlayer.net.json<WeatherWidget>({
            url: `${WEB_BASE_URL}/api/weather?city=${encodeURIComponent(state.settings.weatherCity || "Berlin")}`,
            timeoutMs: 18000,
          }).then((data) => {
            if (!cancelled) setWeather(data);
          }).catch(() => {
            if (!cancelled) setWeather({ error: "unavailable" });
          }),
        );
      }
      if (state.settings.showFootballWidget) {
        tasks.push(
          window.moPlayer.net.json<FootballWidget>({
            url: `${WEB_BASE_URL}/api/football`,
            timeoutMs: 22000,
          }).then((data) => {
            if (!cancelled) setFootball(data);
          }).catch(() => {
            if (!cancelled) setFootball({ error: "unavailable" });
          }),
        );
      }
      await Promise.allSettled(tasks);
    };
    void loadServices();
    return () => {
      cancelled = true;
    };
  }, [state?.settings.showFootballWidget, state?.settings.showWeatherWidget, state?.settings.weatherCity, state]);

  const importXtreamSource = useCallback(async (secret: SourceSecret, successMessage = "Xtream source ready.") => {
    setSyncBusy(true);
    setLoading(labels.connectingSource);
    try {
      const handshake = await authenticateXtream(secret);
      const saved = await window.moPlayer.store.saveSource(secret, {
        account: handshake.account,
        liveExtension: handshake.liveExtension,
      });
      setState(saved.state);
      setLoading(labels.loadingXtream);
      const nextLibrary = await loadXtream(secret, saved.source.id, handshake.liveExtension);
      const fresh = await window.moPlayer.store.saveLibrary(nextLibrary);
      setState(fresh);
      setShowLogin(false);
      setScreen("home");
      const expiry = handshake.account.expDate ? ` · ${labels.accountExpiry} ${formatUnixDate(handshake.account.expDate)}` : "";
      showToast("ok", `${successMessage} ${formatCount(nextLibrary.media.length)} ${labels.itemsLabel}${expiry}`);
      return { source: saved.source, library: nextLibrary, account: handshake.account };
    } catch (error) {
      showToast("error", safeError(error, labels.networkError));
      return null;
    } finally {
      setSyncBusy(false);
      setLoading("");
    }
  }, [labels.accountExpiry, labels.connectingSource, labels.itemsLabel, labels.loadingXtream, labels.networkError, showToast]);

  const refreshLibrary = useCallback(async () => {
    const activeSecret = await window.moPlayer.store.getActiveSecret();
    const source = (await window.moPlayer.app.getState()).sources.find((item) => item.active);
    if (!activeSecret || !source) {
      showToast("info", labels.noContent);
      return;
    }
    setSyncBusy(true);
    setLoading(activeSecret.kind === "xtream" ? labels.loadingXtream : labels.loadingM3u);
    try {
      let nextLibrary: LibraryData;
      if (activeSecret.kind === "xtream") {
        const handshake = await authenticateXtream(activeSecret);
        const saved = await window.moPlayer.store.saveSource(activeSecret, {
          account: handshake.account,
          liveExtension: handshake.liveExtension,
        });
        nextLibrary = await loadXtream(activeSecret, saved.source.id, handshake.liveExtension);
      } else {
        const playlistUrl = activeSecret.playlistUrl ?? "";
        const extracted = extractXtreamFromM3uUrl(playlistUrl);
        if (extracted) {
          const secret = { ...extracted, name: activeSecret.name || extracted.name };
          const handshake = await authenticateXtream(secret);
          const saved = await window.moPlayer.store.saveSource(secret, {
            account: handshake.account,
            liveExtension: handshake.liveExtension,
          });
          nextLibrary = await loadXtream(secret, saved.source.id, handshake.liveExtension);
        } else {
          const playlist = await window.moPlayer.net.text({ url: playlistUrl, timeoutMs: 120000 });
          nextLibrary = await parseM3u(activeSecret, playlist, source.id);
        }
      }
      const fresh = await window.moPlayer.store.saveLibrary(nextLibrary);
      setState(fresh);
      setShowLogin(false);
      showToast("ok", `${labels.libraryReady}: ${formatCount(nextLibrary.media.length)} ${labels.itemsLabel}`);
    } catch (error) {
      showToast("error", safeError(error, labels.networkError));
    } finally {
      setSyncBusy(false);
      setLoading("");
    }
  }, [labels.itemsLabel, labels.libraryReady, labels.loadingM3u, labels.loadingXtream, labels.networkError, labels.noContent, showToast]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setScreen("search");
        window.setTimeout(() => document.getElementById("global-search")?.focus(), 40);
      }
      if (event.ctrlKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        void refreshLibrary();
      }
      if (!event.ctrlKey && event.key.toLowerCase() === "f" && screen === "player") {
        event.preventDefault();
        void window.moPlayer.app.toggleFullscreen();
      }
      // Ctrl+1..9 jumps straight to a dock section — desktop muscle memory.
      if (event.ctrlKey && /^[1-9]$/.test(event.key)) {
        const target = dockItems[Number(event.key) - 1];
        if (target) {
          event.preventDefault();
          setCategoryId("");
          setScreen(target.id);
        }
      }
      if (event.key === "Escape") {
        if (showLogin) {
          setShowLogin(false);
        } else if (screen === "player") {
          setPlaying(null);
          setScreen(returnScreen);
        } else if (screen === "episodes") {
          setScreen("series");
        } else if (screen !== "home") {
          setScreen("home");
        }
      }
    };
    // Mouse "back" side button mirrors Escape — natural desktop navigation.
    const onMouseBack = (event: MouseEvent) => {
      if (event.button !== 3) return;
      event.preventDefault();
      if (showLogin) setShowLogin(false);
      else if (screen === "player") {
        setPlaying(null);
        setScreen(returnScreen);
      } else if (screen === "episodes") setScreen("series");
      else if (screen !== "home") setScreen("home");
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mouseup", onMouseBack);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mouseup", onMouseBack);
    };
  }, [refreshLibrary, returnScreen, screen, showLogin]);

  useEffect(() => {
    if (!activation || activation.status === "activated" || activation.status === "expired") return undefined;
    const timer = window.setInterval(async () => {
      try {
        const status = await window.moPlayer.activation.status(activation.code);
        const nextStatus = String(status.status ?? "pending") as ActivationSession["status"];
        if (nextStatus === "activated") {
          const sourceResponse = await window.moPlayer.activation.source(activation.publicDeviceId, activation.sourcePullToken);
          if (sourceResponse.source) {
            const source = sourceResponse.source;
            const kind = source.type?.toLowerCase().includes("xtream") ? "xtream" : "m3u";
            const secret: SourceSecret = {
              kind,
              name: source.name || (source.serverUrl ? hostLabel(source.serverUrl) : "QR source"),
              baseUrl: source.serverUrl,
              username: source.username,
              password: source.password,
              playlistUrl: source.playlistUrl || source.serverUrl,
              epgUrl: source.epgUrl,
            };
            let imported = false;
            if (secret.kind === "xtream") {
              imported = Boolean(await importXtreamSource(secret, labels.qrXtreamImported));
            } else {
              await window.moPlayer.store.saveSource(secret);
              imported = true;
            }
            if (sourceResponse.sourceId) {
              await window.moPlayer.activation.ack(activation.publicDeviceId, activation.sourcePullToken, sourceResponse.sourceId, imported);
            }
            if (!imported) return;
            await hydrate();
            setActivation((current) => current ? { ...current, status: "activated", message: "Source imported" } : current);
            showToast("ok", labels.qrSaved);
            if (secret.kind !== "xtream") void refreshLibrary();
          } else {
            setActivation((current) => current ? { ...current, message: String(sourceResponse.message ?? labels.waitingForSource) } : current);
          }
        } else {
          setActivation((current) => current ? { ...current, status: nextStatus, message: String(status.message ?? "") } : current);
        }
      } catch (error) {
        setActivation((current) => current ? { ...current, message: safeError(error, labels.activationCheckFailed) } : current);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activation, hydrate, importXtreamSource, labels.activationCheckFailed, labels.qrSaved, labels.qrXtreamImported, labels.waitingForSource, refreshLibrary, showToast]);

  const createActivation = useCallback(async () => {
    setActivationBusy(true);
    try {
      const session = await window.moPlayer.activation.create();
      const qrDataUrl = await QRCode.toDataURL(session.verificationUrlComplete, {
        errorCorrectionLevel: "M",
        margin: 1,
        color: { dark: "#15100b", light: "#ffffff" },
        width: 280,
      });
      setActivation({ ...session, qrDataUrl });
      showToast("ok", labels.activationCreated);
    } catch (error) {
      showToast("error", safeError(error, labels.activationFailed));
    } finally {
      setActivationBusy(false);
    }
  }, [labels.activationCreated, labels.activationFailed, showToast]);

  // Mirror Android: the QR screen creates a code as soon as it is shown.
  useEffect(() => {
    if (loginVisible && loginMode === "activation" && !activation && !activationBusy) {
      void createActivation();
    }
  }, [activation, activationBusy, createActivation, loginMode, loginVisible]);

  const saveXtream = async () => {
    if (!forms.xtreamUrl.trim() || !forms.xtreamUser.trim() || !forms.xtreamPassword.trim()) {
      showToast("error", labels.sourceRequired);
      return;
    }
    const secret: SourceSecret = {
      kind: "xtream",
      name: forms.xtreamName.trim() || hostLabel(forms.xtreamUrl),
      baseUrl: forms.xtreamUrl.trim(),
      username: forms.xtreamUser.trim(),
      password: forms.xtreamPassword,
    };
    await importXtreamSource(secret, labels.xtreamLoaded);
  };

  const saveM3u = async () => {
    if (!forms.m3uUrl.trim()) {
      showToast("error", labels.m3uRequired);
      return;
    }
    const extracted = extractXtreamFromM3uUrl(forms.m3uUrl.trim());
    const secret: SourceSecret = extracted ?? {
      kind: "m3u",
      name: forms.m3uName.trim() || hostLabel(forms.m3uUrl),
      playlistUrl: forms.m3uUrl.trim(),
      epgUrl: forms.epgUrl.trim(),
    };
    const namedSecret = { ...secret, name: forms.m3uName.trim() || secret.name };
    if (namedSecret.kind === "xtream") {
      await importXtreamSource(namedSecret, labels.m3uXtreamLoaded);
      return;
    }
    const saved = await window.moPlayer.store.saveSource(namedSecret);
    setState(saved.state);
    showToast("ok", labels.m3uSaved);
    setShowLogin(false);
    void refreshLibrary();
  };

  const openM3uFile = async () => {
    const picked = await window.moPlayer.app.pickPlaylistFile();
    if (!picked) return;
    setSyncBusy(true);
    setLoading(labels.loadingM3u);
    try {
      const secret: SourceSecret = {
        kind: "m3u",
        name: forms.m3uName.trim() || picked.name.replace(/\.(m3u8?|txt)$/i, ""),
        playlistUrl: `file:///${picked.path.replace(/\\/g, "/")}`,
      };
      const saved = await window.moPlayer.store.saveSource(secret);
      const nextLibrary = await parseM3u(secret, picked.content, saved.source.id);
      const fresh = await window.moPlayer.store.saveLibrary(nextLibrary);
      setState(fresh);
      setShowLogin(false);
      setScreen("home");
      showToast("ok", `${labels.libraryReady}: ${formatCount(nextLibrary.media.length)} ${labels.itemsLabel}`);
    } catch (error) {
      showToast("error", safeError(error, labels.networkError));
    } finally {
      setSyncBusy(false);
      setLoading("");
    }
  };

  const useSource = async (sourceId: string) => {
    const fresh = await window.moPlayer.store.setActiveSource(sourceId);
    setState(fresh);
    showToast("info", labels.sourceSwitched);
    void refreshLibrary();
  };

  const removeSource = async (sourceId: string) => {
    if (!window.confirm(labels.deleteConfirm)) return;
    const fresh = await window.moPlayer.store.deleteSource(sourceId);
    setState(fresh);
  };

  const checkUpdates = async () => {
    try {
      const meta = await window.moPlayer.app.checkWindowsUpdate();
      const latest = String(meta?.version ?? "").trim();
      if (!latest) {
        showToast("error", labels.updateCheckFailed);
        return;
      }
      if (state && isNewerVersion(latest, state.device.appVersion)) {
        setUpdateVersion(latest);
        setUpdateDismissed(false);
        showToast("info", `${labels.updateAvailable} (${latest})`);
      } else {
        setUpdateVersion("");
        showToast("ok", labels.upToDate);
      }
    } catch {
      showToast("error", labels.updateCheckFailed);
    }
  };

  const playItem = async (item: MediaItem) => {
    if (item.type === "series") {
      setSeriesFocus(item);
      setSeriesDetails(null);
      setEpisodes([]);
      setScreen("episodes");
      const secret = await window.moPlayer.store.getActiveSecret();
      if (secret?.kind === "xtream") {
        setLoading(labels.loadingEpisodes);
        try {
          const bundle = await loadXtreamEpisodes(secret, item.sourceId, item);
          setEpisodes(bundle.episodes);
          setSeriesDetails(bundle.details);
        } catch (error) {
          showToast("error", safeError(error, labels.episodesLoadFailed));
        } finally {
          setLoading("");
        }
      } else {
        setEpisodes((library?.media ?? []).filter((episode) => episode.type === "episode" && episode.seriesId === item.seriesId));
        setSeriesDetails({ plot: item.description, rating: item.rating, posterUrl: item.posterUrl });
      }
      return;
    }
    if (!isPlayable(item)) {
      showToast("error", labels.itemNotPlayable);
      return;
    }
    setPlaying(item);
    setReturnScreen(screen === "player" ? returnScreen : screen);
    setScreen("player");
  };

  const toggleFavorite = async (item: MediaItem) => {
    const favoritesMap = await window.moPlayer.store.setFavorite(item.id, !item.favorite);
    setState((old) => (old ? { ...old, favorites: favoritesMap } : old));
  };

  // Stable identity: a new callback per render used to restart the player every progress tick.
  const handleProgress = useCallback((item: MediaItem, positionMs: number, durationMs: number) => {
    void window.moPlayer.store.saveWatchProgress(item.id, positionMs, durationMs);
  }, []);

  const closePlayer = useCallback(() => {
    setPlaying(null);
    setScreen(returnScreen);
    // Refresh watch progress so "Continue watching" is current after a session.
    void window.moPlayer.app.getState().then(setState);
  }, [returnScreen]);

  /** On-demand provider metadata for the preview pane, cached per item. */
  const loadDetails = useCallback(async (item: MediaItem): Promise<MediaDetails | null> => {
    if (item.type !== "movie") return null;
    const cached = detailsCache.current.get(item.id);
    if (cached) return cached;
    const secret = await window.moPlayer.store.getActiveSecret();
    if (secret?.kind !== "xtream") return null;
    try {
      const details = await loadXtreamVodInfo(secret, item);
      detailsCache.current.set(item.id, details);
      return details;
    } catch {
      return null;
    }
  }, []);

  /** Now/next guide for a live channel, cached for 5 minutes per channel. */
  const loadEpg = useCallback(async (item: MediaItem): Promise<EpgEntry[] | null> => {
    if (item.type !== "live") return null;
    const cached = epgCache.current.get(item.id);
    if (cached && Date.now() - cached.fetchedAt < 5 * 60 * 1000) return cached.entries;
    const secret = await window.moPlayer.store.getActiveSecret();
    if (secret?.kind !== "xtream") return null;
    try {
      const entries = await loadShortEpg(secret, item, 6);
      epgCache.current.set(item.id, { entries, fetchedAt: Date.now() });
      return entries;
    } catch {
      return null;
    }
  }, []);

  // Guide info for the channel that is currently playing.
  useEffect(() => {
    setPlayingEpg(null);
    if (!playing || playing.type !== "live") return undefined;
    let cancelled = false;
    void loadEpg(playing).then((entries) => {
      if (!cancelled && entries?.length) setPlayingEpg(entries);
    });
    return () => {
      cancelled = true;
    };
  }, [loadEpg, playing]);

  // Quiet update check shortly after launch — only speaks up when something is newer.
  useEffect(() => {
    if (!state) return undefined;
    const timer = window.setTimeout(async () => {
      const meta = await window.moPlayer.app.checkWindowsUpdate();
      const latest = String(meta?.version ?? "").trim();
      if (latest && isNewerVersion(latest, state.device.appVersion)) {
        setUpdateVersion(latest);
      }
    }, 6000);
    return () => window.clearTimeout(timer);
    // Run once per session after the first state load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(state)]);

  const updateSettings = async (settings: Partial<AppSettings>) => {
    const fresh = await window.moPlayer.store.updateSettings(settings);
    setState(fresh);
  };

  /** Play an archived programme through the provider's timeshift endpoint. */
  const playCatchup = useCallback(async (channel: MediaItem, entry: EpgEntry) => {
    const secret = await window.moPlayer.store.getActiveSecret();
    if (secret?.kind !== "xtream") return;
    const url = buildTimeshiftUrl(secret, channel, entry.start, Math.max(60, entry.end - entry.start));
    setPlaying({
      ...channel,
      id: `catchup:${channel.id}:${entry.start}`,
      title: `${entry.title} — ${channel.title}`,
      streamUrl: url,
      tvArchiveDays: 0,
      watchPositionMs: 0,
    });
    setReturnScreen("guide");
    setScreen("player");
  }, []);

  const hideCategory = useCallback((categoryId: string, categoryName: string) => {
    if (!window.confirm(`${labels.hideCategory}: ${categoryName}?`)) return;
    const current = state?.settings.hiddenCategories ?? [];
    void window.moPlayer.store
      .updateSettings({ hiddenCategories: [...new Set([...current, categoryId])] })
      .then(setState);
  }, [labels.hideCategory, state?.settings.hiddenCategories]);

  // The parental filter is locked behind a 4-digit PIN once one is set.
  const handleParentalToggle = (value: boolean) => {
    const pin = state?.settings.parentalPin ?? "";
    if (value && !pin) {
      setPinPrompt("set");
      return;
    }
    if (!value && pin) {
      setPinPrompt("enter");
      return;
    }
    void updateSettings({ parentalControlsEnabled: value });
  };

  const submitPin = (pin: string) => {
    if (pinPrompt === "set") {
      void updateSettings({ parentalPin: pin, parentalControlsEnabled: true });
      setPinPrompt(null);
      return;
    }
    if (pinPrompt === "enter") {
      if (pin === (state?.settings.parentalPin ?? "")) {
        void updateSettings({ parentalControlsEnabled: false });
        setPinPrompt(null);
      } else {
        showToast("error", labels.wrongPin);
      }
    }
  };

  if (!state || loading === "Preparing") {
    return (
      <>
        <AuroraBackground />
        <SplashScreen label={labels.connecting} progress={42} />
      </>
    );
  }

  const playerMode = screen === "player" && Boolean(playing);
  const shellClass = [
    "app-shell",
    playerMode ? "is-player-mode" : "",
    loginVisible ? "is-login-mode" : "",
    state.settings.compactDensity ? "is-compact" : "",
  ].filter(Boolean).join(" ");

  return (
    <main className={shellClass} dir={state.settings.language === "ar" ? "rtl" : "ltr"}>
      <AuroraBackground />

      <header className="titlebar">
        <div className="brand-lockup titlebar-brand">
          <BrandMark />
          <span>
            <strong>{APP_NAME}</strong>
            <small>{labels.windowsPc}</small>
          </span>
        </div>
        <div className="titlebar-drag" />
        <div className="titlebar-actions">
          {activeSource ? (
            <button className="source-chip" onClick={() => setScreen("settings")} title={sourceStatusLine(activeSource, labels)}>
              <ShieldCheck size={15} />
              <span>{activeSource.name}</span>
              <small>{activeSource.account?.status || activeSource.kind.toUpperCase()}</small>
            </button>
          ) : null}
          <button className="icon-button" onClick={refreshLibrary} disabled={syncBusy} aria-label={labels.sync} title={`${labels.sync} (Ctrl+R)`}>
            {syncBusy ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}
          </button>
          <button className="icon-button" onClick={() => updateSettings({ language: state.settings.language === "en" ? "ar" : "en" })} aria-label={labels.arabicInterface} title={labels.arabicInterface}><Languages size={17} /></button>
          <button className="icon-button" onClick={() => setScreen("support")} aria-label={labels.support} title={labels.support}><LifeBuoy size={17} /></button>
          <button className="icon-button" onClick={() => setScreen("license")} aria-label={labels.license} title={labels.license}><KeyRound size={17} /></button>
          <button
            className={`icon-button ${pinned ? "is-on" : ""}`}
            onClick={() => void window.moPlayer.app.setAlwaysOnTop(!pinned).then(setPinned)}
            aria-label={labels.alwaysOnTop}
            title={labels.alwaysOnTop}
          >
            {pinned ? <Pin size={17} /> : <PinOff size={17} />}
          </button>
          <button className="icon-button" onClick={() => window.moPlayer.app.toggleFullscreen()} aria-label={labels.fullscreen} title={`${labels.fullscreen} (F)`}><Maximize2 size={17} /></button>
        </div>
        <div className="titlebar-caption-space" />
      </header>

      {toast ? <div className={`toast is-${toast.tone}`}>{toast.message}</div> : null}
      {loading && loading !== "Preparing" ? <div className="loading-strip"><Loader2 className="spin" size={16} /> {loading}</div> : null}

      {updateVersion && !updateDismissed && !playerMode ? (
        <div className="update-banner" role="status">
          <Download size={15} />
          <span>{labels.updateAvailable} (v{updateVersion})</span>
          <button className="primary-button is-small" onClick={() => void window.moPlayer.app.openExternal(UPDATE_DOWNLOAD_URL)}>
            {labels.downloadUpdate}
          </button>
          <button className="ghost-button is-small" onClick={() => setUpdateDismissed(true)}>{labels.updateLater}</button>
        </div>
      ) : null}

      <section className="screen-area">
        {loginVisible ? (
          <LoginSurface
            labels={labels}
            canClose={Boolean(activeSource)}
            onClose={() => setShowLogin(false)}
            loginMode={loginMode}
            setLoginMode={setLoginMode}
            forms={forms}
            setForms={setForms}
            activation={activation}
            activationBusy={activationBusy}
            busy={syncBusy}
            createActivation={createActivation}
            saveXtream={saveXtream}
            saveM3u={saveM3u}
            openM3uFile={openM3uFile}
          />
        ) : playerMode && playing ? (
          <PlayerView
            item={playing}
            related={(library?.media ?? []).filter((item) => item.type === playing.type && item.id !== playing.id).slice(0, 40)}
            zapList={
              playing.type === "live"
                ? (library?.media ?? []).filter((item) => item.type === "live" && (!playing.categoryId || item.categoryId === playing.categoryId))
                : playing.type === "episode"
                  ? episodes
                  : undefined
            }
            channelGroups={playing.type === "live" ? categoriesByType(library, "live", false) : undefined}
            allChannels={playing.type === "live" ? mediaByType(library, "live") : undefined}
            initialPositionMs={playing.watchPositionMs ?? 0}
            epg={playingEpg ?? undefined}
            favorite={Boolean(playing.favorite)}
            labels={labels}
            fit={state.settings.playerFit}
            defaultSpeed={state.settings.defaultPlaybackSpeed}
            onBack={closePlayer}
            onPlayItem={playItem}
            onToggleFavorite={toggleFavorite}
            onProgress={handleProgress}
          />
        ) : (
          <div className="screen-fade" key={screen}>
          <ScreenContent
            screen={screen}
            labels={labels}
            state={state}
            library={library}
            rows={rows}
            counts={counts}
            query={query}
            setQuery={setQuery}
            searchType={searchType}
            setSearchType={setSearchType}
            categoryId={categoryId}
            setCategoryId={setCategoryId}
            seriesFocus={seriesFocus}
            seriesDetails={seriesDetails}
            episodes={episodes}
            playItem={playItem}
            toggleFavorite={toggleFavorite}
            loadDetails={loadDetails}
            refreshLibrary={refreshLibrary}
            updateSettings={updateSettings}
            weather={weather}
            football={football}
            goScreen={setScreen}
            showToast={showToast}
            onAddSource={() => { setShowLogin(true); setLoginMode("xtream"); }}
            onUseSource={useSource}
            onRemoveSource={removeSource}
            onCheckUpdates={checkUpdates}
            onParentalToggle={handleParentalToggle}
            onClearCache={() => void window.moPlayer.store.clearLibrary().then((fresh) => { setState(fresh); showToast("ok", labels.cacheCleared); })}
            loadEpg={loadEpg}
            onCatchup={playCatchup}
            onHideCategory={hideCategory}
            syncBusy={syncBusy}
          />
          </div>
        )}
      </section>

      {pinPrompt ? (
        <PinModal
          labels={labels}
          mode={pinPrompt}
          onSubmit={submitPin}
          onCancel={() => setPinPrompt(null)}
        />
      ) : null}

      {!playerMode && !loginVisible ? (
        <PremiumDock
          items={dockItems.map((item) => ({ id: item.id, icon: item.icon, label: labels[item.key] }))}
          activeId={screen}
          onNavigate={(id) => {
            setCategoryId("");
            if (id === "search") {
              setScreen("search");
              window.setTimeout(() => document.getElementById("global-search")?.focus(), 60);
            } else {
              setScreen(id);
            }
          }}
        />
      ) : null}
    </main>
  );
}

function screenTitle(screen: ScreenId, labels: Labels) {
  if (screen === "live") return labels.live;
  if (screen === "movies") return labels.movies;
  if (screen === "series") return labels.series;
  if (screen === "episodes") return labels.episodes;
  if (screen === "search") return labels.search;
  if (screen === "favorites") return labels.favorites;
  if (screen === "settings") return labels.settings;
  if (screen === "license") return labels.license;
  if (screen === "support") return labels.support;
  return labels.home;
}

function CountdownChip({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return (
    <span className="glass-tag is-countdown">
      <Clock3 size={13} /> {minutes}:{String(seconds).padStart(2, "0")}
    </span>
  );
}

function LoginSurface(props: {
  labels: Labels;
  canClose: boolean;
  onClose: () => void;
  loginMode: LoginMode;
  setLoginMode: (mode: LoginMode) => void;
  forms: {
    xtreamName: string;
    xtreamUrl: string;
    xtreamUser: string;
    xtreamPassword: string;
    m3uName: string;
    m3uUrl: string;
    epgUrl: string;
  };
  setForms: React.Dispatch<React.SetStateAction<{
    xtreamName: string;
    xtreamUrl: string;
    xtreamUser: string;
    xtreamPassword: string;
    m3uName: string;
    m3uUrl: string;
    epgUrl: string;
  }>>;
  activation: ActivationSession | null;
  activationBusy: boolean;
  busy: boolean;
  createActivation: () => void;
  saveXtream: () => void;
  saveM3u: () => void;
  openM3uFile: () => void;
}) {
  const { labels, canClose, onClose, loginMode, setLoginMode, forms, setForms, activation, activationBusy, busy, createActivation, saveXtream, saveM3u, openM3uFile } = props;
  return (
    <section className="login-surface">
      <div className="login-card">
        <div className="login-hero">
          {canClose ? (
            <button className="icon-button login-back" onClick={onClose} aria-label={labels.backToApp}>
              <ArrowLeft size={18} />
            </button>
          ) : null}
          <img className="login-art" src={tvBanner} alt="" />
          <span className="pill"><ShieldCheck size={15} /> {labels.legalPlayerOnly}</span>
          <h2>{labels.loginTitle}</h2>
          <p>{labels.loginBody}</p>
          <p className="legal-note"><AlertTriangle size={15} /> {labels.legal}</p>
        </div>
        <div className="login-panel">
          <div className="mode-tabs">
            <button className={loginMode === "activation" ? "is-active" : ""} onClick={() => setLoginMode("activation")}><QrCode size={17} /> QR</button>
            <button className={loginMode === "xtream" ? "is-active" : ""} onClick={() => setLoginMode("xtream")}><KeyRound size={17} /> {labels.xtream}</button>
            <button className={loginMode === "m3u" ? "is-active" : ""} onClick={() => setLoginMode("m3u")}><ListVideo size={17} /> {labels.m3u}</button>
          </div>
          {loginMode === "activation" ? (
            <div className={`activation-panel ${activation?.code ? "is-waiting" : ""}`}>
              <h3>{labels.activateTitle}</h3>
              <p>{activation?.code ? labels.waitingActivation : labels.activateBody}</p>
              <div className="qr-frame">
                {activation?.qrDataUrl
                  ? <img src={activation.qrDataUrl} alt="QR activation code" />
                  : <span className="qr-placeholder">{activationBusy ? <Loader2 className="spin" size={48} /> : <QrCode size={56} />}</span>}
              </div>
              {activation?.code ? (
                <div className="activation-meta">
                  <strong className="activation-code">{activation.code}</strong>
                  {activation.expiresAt ? <CountdownChip expiresAt={activation.expiresAt} /> : null}
                  <button
                    type="button"
                    className="ghost-button is-small"
                    onClick={() => void navigator.clipboard.writeText(activation.code)}
                    aria-label={labels.copyCode}
                  >
                    <Copy size={15} /> {labels.copyCode}
                  </button>
                </div>
              ) : null}
              {activation?.message ? <p className="status-note">{activation.message}</p> : null}
              <div className="button-row">
                <button className="primary-button" onClick={createActivation} disabled={activationBusy}>
                  {activationBusy ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {activation ? labels.refreshQr : labels.createQr}
                </button>
                <button className="ghost-button" onClick={() => window.moPlayer.app.openExternal(activation?.verificationUrlComplete ?? ACTIVATION_URL)}>
                  <ExternalLink size={16} /> {labels.openWebsite}
                </button>
              </div>
            </div>
          ) : loginMode === "xtream" ? (
            <form className="source-form" onSubmit={(event) => { event.preventDefault(); void saveXtream(); }}>
              <label>{labels.profileName}<input value={forms.xtreamName} onChange={(event) => setForms((old) => ({ ...old, xtreamName: event.target.value }))} placeholder={labels.profilePlaceholder} /></label>
              <label>{labels.serverUrl}<input value={forms.xtreamUrl} onChange={(event) => setForms((old) => ({ ...old, xtreamUrl: event.target.value }))} placeholder="http://example.com:8080" autoCapitalize="off" spellCheck={false} /></label>
              <label>{labels.username}<input value={forms.xtreamUser} onChange={(event) => setForms((old) => ({ ...old, xtreamUser: event.target.value }))} autoComplete="username" autoCapitalize="off" spellCheck={false} /></label>
              <label>{labels.password}<input type="password" value={forms.xtreamPassword} onChange={(event) => setForms((old) => ({ ...old, xtreamPassword: event.target.value }))} autoComplete="current-password" /></label>
              <button className="primary-button is-wide" type="submit" disabled={busy}>
                {busy ? <Loader2 className="spin" size={16} /> : <KeyRound size={16} />} {labels.save}
              </button>
            </form>
          ) : (
            <form className="source-form" onSubmit={(event) => { event.preventDefault(); void saveM3u(); }}>
              <label>{labels.profileName}<input value={forms.m3uName} onChange={(event) => setForms((old) => ({ ...old, m3uName: event.target.value }))} placeholder={labels.playlistPlaceholder} /></label>
              <label>{labels.m3uUrlLabel}<input value={forms.m3uUrl} onChange={(event) => setForms((old) => ({ ...old, m3uUrl: event.target.value }))} placeholder="https://example.com/playlist.m3u8" autoCapitalize="off" spellCheck={false} /></label>
              <label>{labels.epgUrl}<input value={forms.epgUrl} onChange={(event) => setForms((old) => ({ ...old, epgUrl: event.target.value }))} placeholder={labels.epgPlaceholder} autoCapitalize="off" spellCheck={false} /></label>
              <div className="button-row">
                <button className="primary-button" type="submit" disabled={busy}>
                  {busy ? <Loader2 className="spin" size={16} /> : <ListVideo size={16} />} {labels.save}
                </button>
                <button className="ghost-button" type="button" onClick={openM3uFile} disabled={busy}>
                  <FolderOpen size={16} /> {labels.openM3uFile}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/** Renders grid items incrementally so 10k+ libraries stay smooth. */
function useVisibleSlice<T>(items: T[], step = 60) {
  const [count, setCount] = useState(step);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    setCount(step);
  }, [items, step]);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || count >= items.length) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setCount((current) => Math.min(items.length, current + step));
      }
    }, { rootMargin: "600px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [count, items.length, step]);
  return { visible: items.slice(0, count), hasMore: count < items.length, sentinelRef };
}

function ScreenContent(props: {
  screen: ScreenId;
  labels: Labels;
  state: PersistedState;
  library: LibraryData | null;
  rows: ReturnType<typeof featuredRows>;
  counts: Record<string, number>;
  query: string;
  setQuery: (query: string) => void;
  searchType: ContentType | "";
  setSearchType: (type: ContentType | "") => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  seriesFocus: MediaItem | null;
  seriesDetails: MediaDetails | null;
  episodes: MediaItem[];
  playItem: (item: MediaItem) => void;
  toggleFavorite: (item: MediaItem) => void;
  loadDetails: (item: MediaItem) => Promise<MediaDetails | null>;
  refreshLibrary: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  weather: WeatherWidget | null;
  football: FootballWidget | null;
  goScreen: (screen: ScreenId) => void;
  showToast: (tone: Toast["tone"], message: string) => void;
  onAddSource: () => void;
  onUseSource: (sourceId: string) => void;
  onRemoveSource: (sourceId: string) => void;
  onCheckUpdates: () => void;
  onParentalToggle: (value: boolean) => void;
  onClearCache: () => void;
  loadEpg: (item: MediaItem) => Promise<EpgEntry[] | null>;
  onCatchup: (channel: MediaItem, entry: EpgEntry) => void;
  onHideCategory: (categoryId: string, categoryName: string) => void;
  syncBusy: boolean;
}) {
  const {
    screen, labels, state, library, rows, counts, query, setQuery, searchType, setSearchType,
    categoryId, setCategoryId, seriesFocus, seriesDetails, episodes, playItem, toggleFavorite, loadDetails,
    refreshLibrary, updateSettings, weather, football, goScreen, showToast, onAddSource, onUseSource, onRemoveSource,
    onCheckUpdates, onParentalToggle, onClearCache, loadEpg, onCatchup, onHideCategory, syncBusy,
  } = props;
  const activeSource = state.sources.find((source) => source.active) ?? state.sources[0] ?? null;
  const account = activeSource?.account ?? null;

  if (screen === "home") {
    const heroArt = rows.movies.find((item) => item.posterUrl)?.posterUrl
      ?? rows.series.find((item) => item.posterUrl)?.posterUrl
      ?? "";
    return (
      <section className="page-stack home-screen">
        <div className="hero-panel is-premium">
          {heroArt ? <img className="hero-backdrop" src={heroArt} alt="" /> : null}
          <div className="hero-overlay" />
          <div className="hero-copy">
            <div className="hero-header-row">
              <h2>{library ? labels.welcomeBack : labels.noContent}</h2>
              <img className="hero-logo-small" src={markLogo} alt={APP_NAME} />
            </div>
            <p className="hero-subtitle">{activeSource ? sourceStatusLine(activeSource, labels) : labels.legal}</p>

            {!library ? (
              <div className="button-row">
                <button className="primary-button is-small" onClick={refreshLibrary} disabled={syncBusy}>
                  {syncBusy ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />} {labels.sync}
                </button>
                <button className="ghost-button is-small" onClick={onAddSource}><Plus size={14} /> {labels.addSource}</button>
              </div>
            ) : null}
          </div>
          <div className="hero-widgets">
            {state.settings.showWeatherWidget ? <WeatherCard labels={labels} weather={weather} /> : null}
            {state.settings.showFootballWidget ? <FootballCard labels={labels} football={football} /> : null}
          </div>
        </div>
        <div className="hub-grid">
          <HubCard icon={Tv} title={labels.live} count={formatCount(counts.live)} onClick={() => goScreen("live")} accent="live" />
          <HubCard icon={Film} title={labels.movies} count={formatCount(counts.movies)} onClick={() => goScreen("movies")} />
          <HubCard icon={Clapperboard} title={labels.series} count={formatCount(counts.series)} onClick={() => goScreen("series")} accent="copper" />
          <HubCard icon={Heart} title={labels.favorites} count={formatCount(counts.favorites)} onClick={() => goScreen("favorites")} />
          <HubCard icon={Search} title={labels.search} subtitle={labels.typeToSearch} onClick={() => { goScreen("search"); window.setTimeout(() => document.getElementById("global-search")?.focus(), 60); }} />
          <HubCard icon={LayoutGrid} title={labels.multiView} subtitle={labels.live} onClick={() => goScreen("multi")} accent="copper" />
        </div>
        {rows.continueWatching.length ? <MediaRow title={labels.continueWatching} items={rows.continueWatching} onPlay={playItem} onFavorite={toggleFavorite} /> : null}
        <MediaRow title={labels.live} items={rows.live} onPlay={playItem} onFavorite={toggleFavorite} onMore={() => goScreen("live")} moreLabel={labels.showMore} />
        <MediaRow title={labels.movies} items={rows.movies} onPlay={playItem} onFavorite={toggleFavorite} poster onMore={() => goScreen("movies")} moreLabel={labels.showMore} />
        <MediaRow title={labels.series} items={rows.series} onPlay={playItem} onFavorite={toggleFavorite} poster onMore={() => goScreen("series")} moreLabel={labels.showMore} />
      </section>
    );
  }

  if (screen === "live" || screen === "movies" || screen === "series") {
    const type = screen === "live" ? "live" : screen === "movies" ? "movie" : "series";
    const categories = categoriesByType(library, type, state.settings.hideEmptyCategories);
    const items = filterByCategory(mediaByType(library, type), categoryId);
    return <BrowseScreen labels={labels} type={type} categories={categories} items={items} categoryId={categoryId} setCategoryId={setCategoryId} playItem={playItem} toggleFavorite={toggleFavorite} loadDetails={loadDetails} loadEpg={loadEpg} onHideCategory={onHideCategory} />;
  }

  if (screen === "multi") {
    return <MultiViewScreen labels={labels} channels={mediaByType(library, "live")} onExpand={playItem} />;
  }

  if (screen === "guide") {
    return (
      <GuideScreen
        labels={labels}
        channels={mediaByType(library, "live")}
        groups={categoriesByType(library, "live", false)}
        loadEpg={loadEpg}
        onPlay={playItem}
        onCatchup={onCatchup}
      />
    );
  }

  if (screen === "episodes") {
    return (
      <EpisodesScreen
        labels={labels}
        series={seriesFocus}
        details={seriesDetails}
        episodes={episodes}
        playItem={playItem}
        onBack={() => goScreen("series")}
      />
    );
  }

  if (screen === "search") {
    const results = searchMedia(library, query, searchType);
    const chips: Array<{ id: ContentType | ""; label: string }> = [
      { id: "", label: labels.all },
      { id: "live", label: labels.live },
      { id: "movie", label: labels.movies },
      { id: "series", label: labels.series },
    ];
    return (
      <section className="page-stack">
        <div className="search-bar">
          <Search size={19} />
          <input id="global-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.typeToSearch} autoFocus />
        </div>
        <div className="chip-row">
          {chips.map((chip) => (
            <button key={chip.id || "all"} className={`chip ${searchType === chip.id ? "is-active" : ""}`} onClick={() => setSearchType(chip.id)}>
              {chip.label}
            </button>
          ))}
        </div>
        <MediaGrid labels={labels} items={results} onPlay={playItem} onFavorite={toggleFavorite} poster />
      </section>
    );
  }

  if (screen === "favorites") {
    return (
      <section className="page-stack">
        <div className="section-heading">
          <span className="pill"><Heart size={15} /> {labels.favorites}</span>
          <h2>{formatCount(favorites(library).length)} {labels.itemsLabel}</h2>
        </div>
        <MediaGrid labels={labels} items={favorites(library)} onPlay={playItem} onFavorite={toggleFavorite} poster />
      </section>
    );
  }

  if (screen === "settings") {
    return (
      <section className="settings-grid">
        <SettingsCard title={labels.sources} icon={ListVideo}>
          {state.sources.length ? state.sources.map((source) => (
            <div key={source.id} className={`source-row ${source.active ? "is-active" : ""}`}>
              <div className="source-row-copy">
                <strong>{source.name}</strong>
                <span>{source.kind.toUpperCase()} · {source.host}</span>
                {source.account ? <small>{source.account.status} · {labels.accountExpiry} {formatUnixDate(source.account.expDate)}</small> : null}
              </div>
              {source.active
                ? <span className="glass-tag is-on"><Check size={13} /> {labels.activeSource}</span>
                : <button className="ghost-button is-small" onClick={() => onUseSource(source.id)}>{labels.useSource}</button>}
              <button className="icon-button is-danger" onClick={() => onRemoveSource(source.id)} aria-label={labels.removeSource} title={labels.removeSource}>
                <Trash2 size={15} />
              </button>
            </div>
          )) : <p className="status-note">{labels.noSources}</p>}
          <div className="button-row">
            <button className="primary-button" onClick={onAddSource}><Plus size={16} /> {labels.addSource}</button>
            <button className="ghost-button" onClick={refreshLibrary} disabled={syncBusy}>
              {syncBusy ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />} {labels.sync}
            </button>
          </div>
        </SettingsCard>
        <SettingsCard title={labels.appearance} icon={Settings}>
          <div className="swatch-row">
            <span>{labels.themeLabel}</span>
            <div className="swatch-set">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  className={`swatch ${(state.settings.accentColor || "#ff6b2c").toLowerCase() === preset.value ? "is-active" : ""}`}
                  style={{ background: preset.value }}
                  onClick={() => updateSettings({ accentColor: preset.value })}
                  aria-label={preset.name}
                  title={preset.name}
                />
              ))}
            </div>
          </div>
          <Toggle label={labels.arabicInterface} value={state.settings.language === "ar"} onChange={(value) => updateSettings({ language: value ? "ar" : "en" })} />
          <Toggle label={labels.compactDensityLabel} value={state.settings.compactDensity} onChange={(value) => updateSettings({ compactDensity: value })} />
          <Toggle label={labels.fullscreenOnLaunchLabel} value={state.settings.fullscreenOnLaunch} onChange={(value) => updateSettings({ fullscreenOnLaunch: value })} />
        </SettingsCard>
        <SettingsCard title={labels.playbackCache} icon={Play}>
          <Toggle label={labels.autoPlayLastLiveLabel} value={state.settings.autoPlayLastLive} onChange={(value) => updateSettings({ autoPlayLastLive: value })} />
          <Toggle label={labels.hideEmptyCategoriesLabel} value={state.settings.hideEmptyCategories} onChange={(value) => updateSettings({ hideEmptyCategories: value })} />
          <Toggle label={labels.coverVideoLabel} value={state.settings.playerFit === "cover"} onChange={(value) => updateSettings({ playerFit: value ? "cover" : "contain" })} />
          <Toggle label={labels.parentalLabel} value={state.settings.parentalControlsEnabled} onChange={onParentalToggle} locked={Boolean(state.settings.parentalPin)} />
          <label className="select-row">
            <span>{labels.defaultSpeedLabel}</span>
            <select
              value={state.settings.defaultPlaybackSpeed}
              onChange={(event) => updateSettings({ defaultPlaybackSpeed: Number(event.target.value) })}
            >
              {[0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}x</option>)}
            </select>
          </label>
        </SettingsCard>
        {activeSource ? (
          <SettingsCard title={labels.sourceSubscription} icon={ShieldCheck}>
            <InfoRow label={labels.source} value={activeSource.name} />
            <InfoRow label={labels.host} value={activeSource.host} />
            <InfoRow label={labels.accountStatus} value={account?.status || labels.localSource} />
            <InfoRow label={labels.accountExpiry} value={formatUnixDate(account?.expDate)} />
            <InfoRow label={labels.accountConnections} value={account ? `${account.activeConnections}/${account.maxConnections || "?"}` : labels.unknown} />
            <InfoRow label={labels.liveFormat} value={activeSource.liveExtension ?? labels.auto} />
            <InfoRow label={labels.timezone} value={account?.serverTimezone || labels.unknown} />
          </SettingsCard>
        ) : null}
        {(state.settings.hiddenCategories ?? []).length ? (
          <SettingsCard title={labels.hiddenCategoriesTitle} icon={Lock}>
            <div className="chip-row">
              {(state.settings.hiddenCategories ?? []).map((hiddenId) => {
                const name = library?.categories.find((category) => category.id === hiddenId)?.name
                  ?? state.library?.categories.find((category) => category.id === hiddenId)?.name
                  ?? hiddenId.slice(0, 12);
                return (
                  <button
                    key={hiddenId}
                    className="chip"
                    title={labels.restoreLabel}
                    onClick={() => updateSettings({ hiddenCategories: (state.settings.hiddenCategories ?? []).filter((id) => id !== hiddenId) })}
                  >
                    {name} ✕
                  </button>
                );
              })}
            </div>
          </SettingsCard>
        ) : null}
        <SettingsCard title={labels.widgetsControls} icon={CloudSun}>
          <Toggle label={labels.showWeatherLabel} value={state.settings.showWeatherWidget} onChange={(value) => updateSettings({ showWeatherWidget: value })} />
          <Toggle label={labels.showMatchesLabel} value={state.settings.showFootballWidget} onChange={(value) => updateSettings({ showFootballWidget: value })} />
          <label className="field-row">{labels.weatherCityLabel}<input value={state.settings.weatherCity} onChange={(event) => updateSettings({ weatherCity: event.target.value })} placeholder="Berlin" /></label>
        </SettingsCard>
        <SettingsCard title={labels.about} icon={Info}>
          <InfoRow label={labels.appVersion} value={state.device.appVersion} />
          <InfoRow label={labels.deviceId} value={state.device.publicDeviceId} />
          <InfoRow label={labels.localEncryption} value={state.device.encryptionAvailable ? labels.encryptionOk : labels.encryptionFallback} />
          <div className="button-row">
            <button className="ghost-button" onClick={onCheckUpdates}><Download size={16} /> {labels.checkUpdates}</button>
            <button className="ghost-button" onClick={onClearCache}>
              <Trash2 size={16} /> {labels.clearCache}
            </button>
            <button className="ghost-button" onClick={() => void window.moPlayer.app.openDataFolder()}><FolderOpen size={16} /> {labels.openDataFolder}</button>
          </div>
          <p className="legal-note">{labels.legal}</p>
        </SettingsCard>
        <SettingsCard title={labels.shortcutsTitle} icon={KeyRound}>
          <InfoRow label="Space" value={labels.player} />
          <InfoRow label="F / Esc" value={labels.fullscreen} />
          <InfoRow label="← →" value="±10s" />
          <InfoRow label="↑ ↓" value={`${labels.live}: ${labels.channelsLabel}`} />
          <InfoRow label="0–9" value={labels.goToChannel} />
          <InfoRow label="M" value={labels.audioTrack} />
          <InfoRow label="Ctrl+F" value={labels.search} />
          <InfoRow label="Ctrl+R" value={labels.sync} />
        </SettingsCard>
      </section>
    );
  }

  if (screen === "license") {
    return (
      <section className="settings-grid">
        <SettingsCard title={labels.licenseStatus} icon={ShieldCheck}>
          <InfoRow label={labels.deviceLabel} value={state.device.deviceName} />
          <InfoRow label={labels.platformLabel} value={`${state.device.platform} / ${state.device.deviceType}`} />
          <InfoRow label={labels.statusLabel} value={labels.statusRegistered} />
          {activeSource ? <InfoRow label={labels.activeSource} value={`${activeSource.name} · ${account?.status || activeSource.kind.toUpperCase()}`} /> : null}
          {account ? <InfoRow label={labels.providerExpiry} value={formatUnixDate(account.expDate)} /> : null}
          <div className="button-row">
            <button className="primary-button" onClick={onAddSource}><QrCode size={16} /> {labels.activate}</button>
            <button className="ghost-button" onClick={() => window.moPlayer.app.openExternal(`${WEB_BASE_URL}/en/activate?product=moplayer2`)}>
              <ExternalLink size={16} /> {labels.openActivation}
            </button>
          </div>
        </SettingsCard>
      </section>
    );
  }

  return (
    <section className="settings-grid">
      <SettingsCard title={labels.supportDeviceInfo} icon={LifeBuoy}>
        <InfoRow label={labels.deviceId} value={state.device.publicDeviceId} />
        <InfoRow label={labels.userData} value={state.device.userDataPath} />
        <div className="button-row">
          <button className="primary-button" onClick={() => navigator.clipboard.writeText(state.device.publicDeviceId).then(() => showToast("ok", labels.copied))}><Copy size={16} /> {labels.copyDevice}</button>
          <button className="ghost-button" onClick={() => window.moPlayer.app.openExternal(`${WEB_BASE_URL}/en/support`)}><LifeBuoy size={16} /> {labels.contactSupport}</button>
          <button className="ghost-button" onClick={() => window.moPlayer.app.exportLogs().then((path) => path && showToast("ok", `${labels.logsExported}: ${path}`))}><Download size={16} /> {labels.exportLogs}</button>
        </div>
      </SettingsCard>
    </section>
  );
}

function BrowseScreen({ labels, type, categories, items, categoryId, setCategoryId, playItem, toggleFavorite, loadDetails, loadEpg, onHideCategory }: {
  labels: Labels;
  type: ContentType;
  categories: ReturnType<typeof categoriesByType>;
  items: MediaItem[];
  categoryId: string;
  setCategoryId: (id: string) => void;
  playItem: (item: MediaItem) => void;
  toggleFavorite: (item: MediaItem) => void;
  loadDetails: (item: MediaItem) => Promise<MediaDetails | null>;
  loadEpg: (item: MediaItem) => Promise<EpgEntry[] | null>;
  onHideCategory: (categoryId: string, categoryName: string) => void;
}) {
  const sorted = type === "live" ? items : byNewest(items);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [previewDetails, setPreviewDetails] = useState<MediaDetails | null>(null);
  const [previewEpg, setPreviewEpg] = useState<EpgEntry[] | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const previewItem = preview ?? sorted[0] ?? null;
  const title = type === "live" ? labels.live : type === "movie" ? labels.movies : labels.series;
  const visibleCategories = categoryFilter.trim()
    ? categories.filter((category) => category.name.toLowerCase().includes(categoryFilter.trim().toLowerCase()))
    : categories;
  const { visible, hasMore, sentinelRef } = useVisibleSlice(sorted, type === "live" ? 120 : 60);

  // Debounced provider metadata + programme guide for the hovered item.
  useEffect(() => {
    setPreviewDetails(null);
    setPreviewEpg(null);
    if (!previewItem) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (previewItem.type === "movie") {
        void loadDetails(previewItem).then((details) => {
          if (!cancelled && details) setPreviewDetails(details);
        });
      } else if (previewItem.type === "live") {
        void loadEpg(previewItem).then((entries) => {
          if (!cancelled && entries?.length) setPreviewEpg(entries);
        });
      }
    }, 320);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [loadDetails, loadEpg, previewItem]);

  const backdrop = previewDetails?.backdropUrl || previewItem?.backdropUrl || previewItem?.posterUrl || "";

  return (
    <section className={`browse-layout ${type === "live" ? "is-live" : "is-poster"}`}>
      {backdrop ? <CinematicBackdrop src={backdrop} /> : null}
      <aside className="category-rail">
        <h3>{title}</h3>
        <div className="rail-search">
          <Search size={14} />
          <input value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} placeholder={labels.search} />
        </div>
        <div className="rail-list">
          <button className={!categoryId ? "is-active" : ""} onClick={() => setCategoryId("")}>
            <span>{labels.allCategories}</span>
          </button>
          {visibleCategories.map((category) => (
            <button
              key={category.id}
              className={categoryId === category.id ? "is-active" : ""}
              onClick={() => setCategoryId(category.id)}
              onContextMenu={(event) => { event.preventDefault(); onHideCategory(category.id, category.name); }}
              title={`${category.name} — ${labels.hideCategory}: right-click`}
            >
              <span>{category.name}</span>
              <small>{category.count}</small>
            </button>
          ))}
        </div>
      </aside>
      <div className="content-panel">
        <div className="section-heading">
          <span className="pill">{categoryLabel(categories, categoryId)}</span>
          <h2>{formatCount(sorted.length)} {labels.itemsLabel}</h2>
        </div>
        <div className="panel-scroll">
          {type === "live" ? (
            <div className="channel-list">
              {visible.length ? visible.map((item, index) => (
                <LiveChannelRow
                  key={item.id}
                  index={index + 1}
                  item={item}
                  onPreview={setPreview}
                  onPlay={playItem}
                  onFavorite={toggleFavorite}
                />
              )) : <div className="empty-state"><Power size={42} /><p>{labels.noResults}</p></div>}
            </div>
          ) : (
            <MediaGrid labels={labels} items={visible} onPlay={playItem} onFavorite={toggleFavorite} onPreview={setPreview} poster />
          )}
          {hasMore ? <div ref={sentinelRef} className="grid-sentinel"><Loader2 className="spin" size={18} /></div> : null}
        </div>
      </div>
      <PreviewPane labels={labels} item={previewItem} details={previewDetails} epg={previewEpg} live={type === "live"} onPlay={playItem} onFavorite={toggleFavorite} />
    </section>
  );
}

/** Blurred ambient poster wallpaper behind browse content (port of Android CinematicBackdrop). */
function CinematicBackdrop({ src }: { src: string }) {
  return (
    <div className="cinematic-backdrop" aria-hidden="true">
      <img key={src} src={src} alt="" />
    </div>
  );
}

function formatDuration(totalSecs?: number, minutesLabel = "min") {
  if (!totalSecs || totalSecs <= 0) return "";
  const minutes = Math.round(totalSecs / 60);
  if (minutes < 60) return `${minutes} ${minutesLabel}`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function EpisodesScreen({ labels, series, details, episodes, playItem, onBack }: {
  labels: Labels;
  series: MediaItem | null;
  details: MediaDetails | null;
  episodes: MediaItem[];
  playItem: (item: MediaItem) => void;
  onBack: () => void;
}) {
  const seasons = useMemo(
    () => [...new Set(episodes.map((episode) => episode.seasonNumber ?? 1))].sort((a, b) => a - b),
    [episodes],
  );
  const [season, setSeason] = useState(0);
  useEffect(() => {
    setSeason(seasons[0] ?? 0);
  }, [seasons]);
  const seasonEpisodes = episodes.filter((episode) => (episode.seasonNumber ?? 1) === season);
  const poster = details?.posterUrl || series?.posterUrl || "";
  const backdrop = details?.backdropUrl || poster;
  const rating = details?.rating || series?.rating || "";
  const plot = details?.plot || series?.description || "";

  return (
    <section className="page-stack episodes-screen">
      {backdrop ? <CinematicBackdrop src={backdrop} /> : null}
      <div className="series-hero">
        {backdrop ? <img className="series-hero-backdrop" src={backdrop} alt="" /> : null}
        <div className="series-hero-overlay" />
        <button className="icon-button series-back" onClick={onBack} aria-label={labels.backToApp}>
          <ArrowLeft size={18} />
        </button>
        <div className="series-hero-body">
          {poster ? <img className="series-poster" src={poster} alt="" /> : null}
          <div className="series-meta">
            <span className="pill"><Clapperboard size={14} /> {series?.categoryName ?? labels.series}</span>
            <h2>{series?.title ?? labels.episodes}</h2>
            <div className="series-tags">
              {rating ? <span className="glass-tag"><Star size={12} fill="currentColor" /> {rating}</span> : null}
              {details?.genre ? <span className="glass-tag">{details.genre}</span> : null}
              {details?.releaseDate ? <span className="glass-tag">{details.releaseDate.slice(0, 10)}</span> : null}
              <span className="glass-tag">{episodes.length} {labels.episodes}</span>
            </div>
            {plot ? <p className="series-plot">{plot}</p> : null}
            {details?.cast ? <p className="series-cast"><strong>{labels.castLabel}:</strong> {details.cast}</p> : null}
          </div>
        </div>
      </div>

      {seasons.length > 1 ? (
        <div className="chip-row">
          {seasons.map((value) => (
            <button key={value} className={`chip ${season === value ? "is-active" : ""}`} onClick={() => setSeason(value)}>
              {labels.seasonLabel} {value}
            </button>
          ))}
        </div>
      ) : null}

      <div className="episode-list">
        {seasonEpisodes.length ? seasonEpisodes.map((episode) => {
          const progress = episode.watchDurationMs && episode.watchPositionMs
            ? Math.min(100, Math.round((episode.watchPositionMs / episode.watchDurationMs) * 100))
            : 0;
          return (
            <article key={episode.id} className="episode-row" onDoubleClick={() => playItem(episode)} tabIndex={0}>
              <span className="episode-number">{episode.episodeNumber ?? "•"}</span>
              <button className="episode-thumb" onClick={() => playItem(episode)} aria-label={episode.title}>
                {episode.posterUrl ? <PosterImage src={episode.posterUrl} poster={false} /> : <MonitorPlay size={20} />}
                {progress > 0 && progress < 98 ? <span className="watch-bar"><i style={{ width: `${progress}%` }} /></span> : null}
              </button>
              <button className="episode-copy" onClick={() => playItem(episode)}>
                <strong>{episode.title}</strong>
                <span>
                  {labels.seasonLabel} {episode.seasonNumber ?? 1}
                  {episode.durationSecs ? ` · ${formatDuration(episode.durationSecs, labels.minutes)}` : ""}
                </span>
              </button>
              <button className="channel-action" onClick={() => playItem(episode)} aria-label="Play"><Play size={15} /></button>
            </article>
          );
        }) : <div className="empty-state"><Power size={42} /><p>{labels.noEpisodesLoaded}</p></div>}
      </div>
    </section>
  );
}

function LiveChannelRow({ index, item, onPreview, onPlay, onFavorite }: {
  index: number;
  item: MediaItem;
  onPreview: (item: MediaItem) => void;
  onPlay: (item: MediaItem) => void;
  onFavorite: (item: MediaItem) => void;
}) {
  return (
    <article className="channel-row" onMouseEnter={() => onPreview(item)} onFocus={() => onPreview(item)} onDoubleClick={() => onPlay(item)} tabIndex={0}>
      <span className="channel-number">{index}</span>
      <button className="channel-logo" onClick={() => onPlay(item)} aria-label={item.title}>
        {item.posterUrl ? <PosterImage src={item.posterUrl} poster={false} /> : <Tv size={18} />}
      </button>
      <button className="channel-copy" onClick={() => onPlay(item)}>
        <strong>{item.title}</strong>
        <span>{item.categoryName}</span>
      </button>
      <button className="channel-action" onClick={() => onPlay(item)} aria-label="Play"><Play size={15} /></button>
      <button className={`favorite-dot ${item.favorite ? "is-on" : ""}`} onClick={() => onFavorite(item)} aria-label="Favorite"><Heart size={14} /></button>
    </article>
  );
}

function formatClockApp(unixSecs: number) {
  if (!unixSecs) return "";
  return new Date(unixSecs * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function youtubeTrailerUrl(item: MediaItem, details: MediaDetails | null) {
  const raw = details?.youtubeTrailer?.trim() ?? "";
  if (raw) return /^https?:\/\//i.test(raw) ? raw : `https://www.youtube.com/watch?v=${encodeURIComponent(raw)}`;
  const query = `${item.title} ${item.type === "series" ? "series" : "movie"} trailer`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function PreviewPane({ labels, item, details, epg, live, onPlay, onFavorite }: {
  labels: Labels;
  item: MediaItem | null;
  details: MediaDetails | null;
  epg?: EpgEntry[] | null;
  live: boolean;
  onPlay: (item: MediaItem) => void;
  onFavorite: (item: MediaItem) => void;
}) {
  const art = details?.backdropUrl || item?.backdropUrl || details?.posterUrl || item?.posterUrl || "";
  const rating = details?.rating || item?.rating || "";
  const plot = details?.plot || item?.description || "";
  const duration = formatDuration(details?.durationSecs || item?.durationSecs, labels.minutes);
  const nowSecs = Date.now() / 1000;
  const epgNow = epg?.find((entry) => entry.nowPlaying) ?? epg?.find((entry) => entry.start <= nowSecs && nowSecs < entry.end) ?? null;
  const epgUpcoming = (epg ?? []).filter((entry) => entry !== epgNow && entry.end > nowSecs).slice(0, 3);
  const epgProgress = epgNow && epgNow.end > epgNow.start
    ? Math.min(100, Math.max(0, Math.round(((nowSecs - epgNow.start) / (epgNow.end - epgNow.start)) * 100)))
    : 0;
  const trailerUrl = item && !live ? youtubeTrailerUrl(item, details) : "";
  return (
    <aside className="preview-pane">
      {item ? (
        <>
          <div className="preview-art">
            {art ? <PosterImage key={art} src={art} poster={false} /> : <MonitorPlay size={44} />}
            <span className="preview-art-fade" />
          </div>
          <div className="preview-copy">
            <span className="glass-tag">{live ? labels.liveBadge : item.type === "movie" ? labels.movies : labels.series}</span>
            <h3>{item.title}</h3>
            <div className="preview-tags">
              {rating ? <span className="preview-rating"><Star size={13} fill="currentColor" /> {rating}</span> : null}
              {duration ? <span className="glass-tag"><Clock3 size={12} /> {duration}</span> : null}
              {details?.releaseDate ? <span className="glass-tag">{details.releaseDate.slice(0, 4)}</span> : null}
            </div>
            {details?.genre ? <p className="preview-line"><strong>{labels.genreLabel}:</strong> {details.genre}</p> : null}
            {details?.director ? <p className="preview-line"><strong>{labels.directorLabel}:</strong> {details.director}</p> : null}
            {details?.cast ? <p className="preview-line is-cast"><strong>{labels.castLabel}:</strong> {details.cast}</p> : null}
            {live && epgNow ? (
              <div className="preview-epg">
                <div className="epg-now">
                  <span className="glass-tag is-on">{labels.nowLabel}</span>
                  <div className="epg-now-copy">
                    <strong>{epgNow.title}</strong>
                    <small>{formatClockApp(epgNow.start)} – {formatClockApp(epgNow.end)}</small>
                    <span className="epg-bar"><i style={{ width: `${epgProgress}%` }} /></span>
                  </div>
                </div>
                {epgUpcoming.map((entry) => (
                  <div key={`${entry.start}-${entry.title}`} className="epg-upcoming">
                    <small>{formatClockApp(entry.start)}</small>
                    <span>{entry.title}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="preview-desc">{(live && epgNow?.description) || plot || item.categoryName || labels.nowPlaying}</p>
            <div className="button-row">
              {isPlayable(item) || item.type === "series" ? <button className="primary-button" onClick={() => onPlay(item)}><Play size={16} /> {item.type === "series" ? labels.episodes : labels.player}</button> : null}
              <button className={`ghost-button ${item.favorite ? "is-on" : ""}`} onClick={() => onFavorite(item)}><Heart size={16} /> {labels.favorites}</button>
              {trailerUrl ? (
                <button
                  className="ghost-button"
                  onClick={() => void window.moPlayer.app.openExternal(trailerUrl)}
                >
                  <ExternalLink size={16} /> {labels.trailerLabel}
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="preview-empty">
          <MonitorPlay size={44} />
          <p>{labels.noResults}</p>
        </div>
      )}
    </aside>
  );
}

function ClockNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return <strong className="widget-clock">{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong>;
}

function getWeatherIcon(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes("sun") || c.includes("clear")) return "☀️";
  if (c.includes("partly")) return "⛅";
  if (c.includes("cloud") || c.includes("overcast")) return "☁️";
  if (c.includes("rain") || c.includes("drizzle")) return "🌧️";
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("snow") || c.includes("ice")) return "❄️";
  if (c.includes("fog") || c.includes("mist")) return "🌫️";
  return "🌤️";
}

function WeatherCard({ labels, weather }: { labels: Labels; weather: WeatherWidget | null }) {
  const hasWeather = weather && !weather.error && typeof weather.temp_c === "number";
  return (
    <article className="service-card is-premium">
      <header>
        <span className="service-title"><CloudSun size={15} /> {labels.weather}</span>
        <ClockNow />
      </header>
      {hasWeather ? (
        <div className="service-body">
          <div className="service-icon-large">{getWeatherIcon(weather.condition ?? "")}</div>
          <div className="service-info">
            <strong className="service-value">{Math.round(weather.temp_c ?? 0)}°</strong>
            <p>{weather.condition ?? labels.currentWeather} · {weather.city ?? labels.weather}</p>
            <small>{labels.humidity} {weather.humidity ?? "–"}% · {labels.wind} {Math.round(weather.wind_kph ?? 0)} km/h</small>
          </div>
        </div>
      ) : (
        <div className="service-body">
          <div className="service-info">
            <strong className="service-value">--°</strong>
            <p>{labels.weatherUnavailable}</p>
            <small>{labels.weatherApiNote}</small>
          </div>
        </div>
      )}
    </article>
  );
}

const ISO_MAP: Record<string, string> = {
  "Argentina": "ar", "Australia": "au", "Austria": "at", "Belgium": "be", "Brazil": "br",
  "Cameroon": "cm", "Canada": "ca", "Costa Rica": "cr", "Croatia": "hr", "Denmark": "dk",
  "Ecuador": "ec", "England": "gb-eng", "France": "fr", "Germany": "de", "Ghana": "gh",
  "Iran": "ir", "Japan": "jp", "Mexico": "mx", "Morocco": "ma", "Netherlands": "nl",
  "Poland": "pl", "Portugal": "pt", "Qatar": "qa", "Saudi Arabia": "sa", "Senegal": "sn",
  "Serbia": "rs", "South Korea": "kr", "Spain": "es", "Switzerland": "ch", "Tunisia": "tn",
  "United States": "us", "Uruguay": "uy", "Wales": "gb-wls", "Bosnia": "ba", "Bosnia-Herzegovina": "ba",
  "Italy": "it", "Egypt": "eg", "Algeria": "dz", "Colombia": "co", "Chile": "cl"
};

function getTeamIcon(teamName: string | undefined | null, logoUrl?: string) {
  // Prefer the real team logo delivered by the football API.
  if (logoUrl) {
    return <img src={logoUrl} alt={teamName ?? ""} className="team-flag-img" loading="lazy" />;
  }
  if (!teamName) return <Trophy size={28} className="fallback-shield" />;
  for (const [country, iso] of Object.entries(ISO_MAP)) {
    if (teamName.includes(country)) {
      return <img src={`https://flagcdn.com/w80/${iso}.png`} alt={country} className="team-flag-img" />;
    }
  }
  // Fallback for clubs: beautiful initials avatar with team colors
  const seed = encodeURIComponent(teamName);
  return <img src={`https://api.dicebear.com/9.x/initials/svg?seed=${seed}&radius=50&fontFamily=Inter&fontWeight=700&backgroundColor=1a0d04,ff6b2c,2a1f1a`} alt={teamName} className="team-flag-img club-logo" />;
}

function matchScore(match: FootballMatch, labels: Labels) {
  return match.homeGoals != null && match.awayGoals != null
    ? `${match.homeGoals} – ${match.awayGoals}`
    : match.status ?? labels.scheduled;
}

function formatKickoff(raw?: string) {
  if (!raw) return "";
  try {
    return new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" }).format(new Date(raw));
  } catch {
    return "";
  }
}

function FootballCard({ labels, football }: { labels: Labels; football: FootballWidget | null }) {
  const match = football?.primaryMatch ?? football?.matches?.[0] ?? null;
  const score = match ? matchScore(match, labels) : labels.scheduled;
  const upcoming = (football?.matches ?? [])
    .filter((entry) => entry !== match && (entry.homeTeam !== match?.homeTeam || entry.awayTeam !== match?.awayTeam))
    .slice(0, 3);

  return (
    <article className="service-card is-premium is-football">
      <header>
        <span className="service-title"><Trophy size={15} /> {labels.matches}</span>
        {match?.league ? <small className="service-league">{match.league}</small> : null}
      </header>
      {match ? (
        <div className="service-body">
          <div className="match-layout">
            <div className="team-col">
              <span className="team-flag">{getTeamIcon(match.homeTeam, match.homeLogo)}</span>
              <span className="team-name">{match.homeTeam ?? "Home"}</span>
            </div>
            <div className="score-col">
              <strong className="service-value">{score}</strong>
            </div>
            <div className="team-col">
              <span className="team-flag">{getTeamIcon(match.awayTeam, match.awayLogo)}</span>
              <span className="team-name">{match.awayTeam ?? "Away"}</span>
            </div>
          </div>
          <div className="match-meta">
            <small>{match.date ? formatDate(match.date) : labels.liveService}</small>
          </div>
          {upcoming.length ? (
            <ul className="match-list">
              {upcoming.map((entry, index) => (
                <li key={`${entry.homeTeam}-${entry.awayTeam}-${index}`}>
                  <span className="match-list-flag">{getTeamIcon(entry.homeTeam, entry.homeLogo)}</span>
                  <span className="match-list-team">{entry.homeTeam}</span>
                  <span className="match-list-score">{matchScore(entry, labels) === labels.scheduled ? formatKickoff(entry.date) || labels.scheduled : matchScore(entry, labels)}</span>
                  <span className="match-list-team is-away">{entry.awayTeam}</span>
                  <span className="match-list-flag">{getTeamIcon(entry.awayTeam, entry.awayLogo)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="service-body">
          <div className="service-info">
            <strong className="service-value">{labels.noMatch}</strong>
            <p>{labels.footballUnavailable}</p>
            <small>{football?.source ?? "Football API"}</small>
          </div>
        </div>
      )}
    </article>
  );
}

function MediaRow({ title, items, onPlay, onFavorite, poster = false, onMore, moreLabel }: {
  title: string;
  items: MediaItem[];
  onPlay: (item: MediaItem) => void;
  onFavorite: (item: MediaItem) => void;
  poster?: boolean;
  onMore?: () => void;
  moreLabel?: string;
}) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  if (!items.length) return null;
  const scrollStrip = (direction: number) => {
    const strip = stripRef.current;
    if (!strip) return;
    const rtl = getComputedStyle(strip).direction === "rtl";
    strip.scrollBy({ left: direction * (rtl ? -1 : 1) * Math.round(strip.clientWidth * 0.85), behavior: "smooth" });
  };
  return (
    <section className="media-row">
      <header className="row-heading">
        <h3>{title}</h3>
        <div className="row-tools">
          {onMore ? <button className="row-more" onClick={onMore}>{moreLabel} <ExternalLink size={13} /></button> : null}
          <button className="strip-nav" onClick={() => scrollStrip(-1)} aria-label="Scroll back"><ChevronLeft size={16} /></button>
          <button className="strip-nav" onClick={() => scrollStrip(1)} aria-label="Scroll forward"><ChevronRight size={16} /></button>
        </div>
      </header>
      <div className="media-strip" ref={stripRef}>
        {items.map((item) => <MediaCard key={item.id} item={item} onPlay={onPlay} onFavorite={onFavorite} poster={poster} />)}
      </div>
    </section>
  );
}

function MediaGrid({ labels, items, onPlay, onFavorite, onPreview, poster = false }: { labels: Labels; items: MediaItem[]; onPlay: (item: MediaItem) => void; onFavorite: (item: MediaItem) => void; onPreview?: (item: MediaItem) => void; poster?: boolean }) {
  if (!items.length) {
    return (
      <div className="empty-state is-premium">
        <span className="empty-state-icon"><Power size={30} /></span>
        <strong>{labels.noResults}</strong>
        <p>{labels.noContent}</p>
      </div>
    );
  }
  return <div className="media-grid">{items.map((item) => <MediaCard key={item.id} item={item} onPlay={onPlay} onFavorite={onFavorite} onPreview={onPreview} poster={poster} />)}</div>;
}

function PosterImage({ src, poster }: { src: string; poster: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MonitorPlay size={poster ? 40 : 26} />;
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function MediaCard({ item, onPlay, onFavorite, onPreview, poster }: { item: MediaItem; onPlay: (item: MediaItem) => void; onFavorite: (item: MediaItem) => void; onPreview?: (item: MediaItem) => void; poster: boolean }) {
  const progress = item.watchDurationMs && item.watchPositionMs
    ? Math.min(100, Math.round((item.watchPositionMs / item.watchDurationMs) * 100))
    : 0;
  return (
    <article className={`media-card ${poster ? "is-poster" : ""}`} onMouseEnter={() => onPreview?.(item)} onFocus={() => onPreview?.(item)} onDoubleClick={() => onPlay(item)} tabIndex={0}>
      <button className="media-art" onClick={() => onPlay(item)}>
        {item.posterUrl ? <PosterImage src={item.posterUrl} poster={poster} /> : <MonitorPlay size={poster ? 40 : 26} />}
        <span className="art-overlay" />
        <span className="play-badge"><Play size={16} /></span>
        {item.rating ? <span className="rating-chip"><Star size={11} fill="currentColor" /> {item.rating}</span> : null}
        {progress > 0 && progress < 98 ? <span className="watch-bar"><i style={{ width: `${progress}%` }} /></span> : null}
      </button>
      <div className="media-copy">
        <strong>{item.title}</strong>
        <span>{item.categoryName}</span>
      </div>
      <button className={`favorite-dot ${item.favorite ? "is-on" : ""}`} onClick={() => onFavorite(item)} aria-label="Favorite"><Heart size={14} /></button>
    </article>
  );
}

function SettingsCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <article className="settings-card">
      <div className="settings-title"><Icon size={19} /><h3>{title}</h3></div>
      {children}
    </article>
  );
}

function Toggle({ label, value, onChange, locked = false }: { label: string; value: boolean; onChange: (value: boolean) => void; locked?: boolean }) {
  return (
    <label className="toggle-row">
      <span>{label}{locked ? <Lock size={12} className="toggle-lock" /> : null}</span>
      <button className={value ? "is-on" : ""} onClick={() => onChange(!value)} type="button" role="switch" aria-checked={value}>
        <span>{value ? <Check size={13} /> : null}</span>
      </button>
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;
}

function PinModal({ labels, mode, onSubmit, onCancel }: {
  labels: Labels;
  mode: "set" | "enter";
  onSubmit: (pin: string) => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  return (
    <div className="picker-overlay" onClick={onCancel}>
      <div className="picker-card is-pin" onClick={(event) => event.stopPropagation()}>
        <span className="pin-icon"><Lock size={26} /></span>
        <h3>{labels.parentalPinTitle}</h3>
        <p className="status-note">{mode === "set" ? labels.setPinBody : labels.enterPinBody}</p>
        <input
          className="pin-input"
          autoFocus
          inputMode="numeric"
          type="password"
          maxLength={4}
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(event) => {
            if (event.key === "Enter" && pin.length === 4) onSubmit(pin);
          }}
          placeholder="••••"
        />
        <div className="button-row">
          <button className="primary-button" disabled={pin.length !== 4} onClick={() => onSubmit(pin)}>
            <Check size={16} /> {labels.confirm}
          </button>
          <button className="ghost-button" onClick={onCancel}>{labels.cancel}</button>
        </div>
      </div>
    </div>
  );
}

export { screenTitle };
