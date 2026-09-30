"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Cloud,
  KeyRound,
  Link2,
  Loader2,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Tv,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  adoptableActivationProduct,
  IMPORT_POLL_BUDGET_MS,
  importPollDelayMs,
  importProgressIsFinal,
  nextImportProgress,
  type ActivationPageProduct,
  type ImportProgress,
} from "@/lib/activation-flow";
import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const allowed = /^[A-HJ-NP-RT-Z2-46789]{4}$/;

const copy = {
  en: {
    back: "Back to MoPlayer",
    backPro: "Back to MoPlayer Pro",
    pageTitle: "Activate your device",
    pageSubtitle: "Two simple steps and {product} is ready on your screen.",
    step: "Step",
    of: "of",
    stepConfirm: "Confirm code",
    stepSource: "Add source",
    // Step 1
    step1Title: "Confirm your device code",
    step1Lead: "Open {product} on your device. A code starting with MO- appears on screen — type the four characters here.",
    fromQr: "Code detected automatically from the QR scan.",
    productDetected: "This code belongs to {product}.",
    codeLabel: "Device code",
    confirm: "Confirm device",
    confirming: "Checking…",
    recheck: "Check again",
    // Step 2
    step2Title: "Add your private source",
    step2Lead: "Enter your source details. We send them securely straight to your device — no typing on the television.",
    step2Locked: "Confirm your TV in step 1 to unlock this step.",
    typeLabel: "Source type",
    xtream: "Provider account",
    xtreamDesc: "Server link, username and password",
    m3u: "Playlist link",
    m3uDesc: "A single private playlist link",
    serverName: "Source name",
    serverNamePlaceholder: "My source",
    portalUrl: "Server link",
    portalPlaceholder: "http://example.com:8080",
    username: "Username",
    password: "Password",
    playlistUrl: "Playlist URL",
    playlistPlaceholder: "https://example.com/playlist.m3u8",
    epgUrl: "EPG guide URL (optional)",
    test: "Test connection",
    testing: "Testing…",
    send: "Send to device",
    sending: "Sending…",
    // Done
    doneTitle: "Imported on your TV",
    doneBody: "{product} imported your source and is ready to watch. You can close this page.",
    sendAgain: "Send again",
    startOver: "Start again with a new code",
    secure: "Secure: your source is encrypted and delivered only to your paired device via moalfarras.space.",
    needHelp: "Need help?",
    support: "Open support",
    // Statuses [title, helper]
    waiting: ["Waiting for your code", "Type the four characters exactly as shown on the device after MO-."],
    invalid: ["Check the code", "Enter the four characters shown on your device right now — the code can change."],
    pending: ["Almost there", "We found your code. Tap “Confirm device” to finish pairing."],
    activated: ["Device confirmed", "Great — continue to step 2 and add your source."],
    expired: ["Code expired", "Generate a fresh code on the device, then enter it again."],
    backend: ["Connection issue", "Something went wrong for a moment. Check your internet and try again."],
    rateLimited: ["Too many attempts", "Please wait a minute, then check the code again."],
    // Source results
    testOk: "Connection works. You can send it now.",
    testFail: "Connection failed. Double-check the details and try again.",
    testUnavailable: "Could not test right now. Try again in a moment.",
    sendOk: "Sent. Import starts automatically on the TV.",
    sendFail: "Could not send the source.",
    sendUnavailable: "Could not send right now. Try again in a moment.",
    sourceRateLimited: "Too many attempts. Wait a minute, then try again.",
    deviceNotReady: "Your TV is no longer waiting for a source. Open the activation screen on the TV, then start again with the new code.",
    // Device import (after send)
    waitingTvTitle: "Waiting for your TV…",
    waitingTvBody: "Keep the activation screen open on {product}. It picks up the source automatically within a few seconds.",
    importingTitle: "Importing on your TV…",
    importingBody: "Your TV received the source and {product} is loading your channels. Large playlists can take a few minutes — this page updates by itself.",
    importFailedTitle: "Import did not finish",
    importFailedBody: "Your TV could not import the source.",
    importRevokedBody: "The source was cancelled before your TV imported it.",
    deviceSaid: "Your TV reported:",
    importRetryHint: "Check the source details, then start again with the new code shown on your TV.",
    sourceExpiredTitle: "Your TV did not pick up the source in time",
    sourceExpiredBody: "For your security the source was deleted. Open the activation screen on your TV and start again with the new code.",
    checkTvTitle: "Check your TV",
    checkTvWaitingBody: "Your TV has not picked up the source yet. Make sure the activation screen is still open on {product}, then send the source again.",
    checkTvFetchedBody: "Your TV received the source and may still be loading channels. Check the TV screen for the result.",
  },
  ar: {
    back: "العودة إلى MoPlayer",
    backPro: "العودة إلى MoPlayer Pro",
    pageTitle: "فعِّل جهازك",
    pageSubtitle: "خطوتان بسيطتان ويصبح {product} جاهزاً على شاشتك.",
    step: "الخطوة",
    of: "من",
    stepConfirm: "تأكيد الكود",
    stepSource: "إضافة المصدر",
    // Step 1
    step1Title: "أكِّد كود الجهاز",
    step1Lead: "افتح {product} على جهازك. سيظهر كود يبدأ بـ MO- على الشاشة — أدخل الرموز الأربعة هنا.",
    fromQr: "تم جلب الكود تلقائياً من مسح رمز QR.",
    productDetected: "هذا الكود خاص بـ {product}.",
    codeLabel: "كود الجهاز",
    confirm: "أكِّد الجهاز",
    confirming: "جارٍ التحقق…",
    recheck: "إعادة الفحص",
    // Step 2
    step2Title: "أضف مصدرك الخاص",
    step2Lead: "أدخل بيانات المصدر وسنرسلها بأمان مباشرة إلى جهازك — بدون أي كتابة على التلفزيون.",
    step2Locked: "أكمل تأكيد التلفزيون في الخطوة 1 لفتح هذه الخطوة.",
    typeLabel: "نوع المصدر",
    xtream: "حساب المزود",
    xtreamDesc: "رابط الخادم واسم المستخدم وكلمة المرور",
    m3u: "رابط قائمة",
    m3uDesc: "رابط قائمة خاص واحد",
    serverName: "اسم المصدر",
    serverNamePlaceholder: "مصدري",
    portalUrl: "رابط الخادم",
    portalPlaceholder: "http://example.com:8080",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    playlistUrl: "رابط القائمة",
    playlistPlaceholder: "https://example.com/playlist.m3u8",
    epgUrl: "رابط دليل القنوات EPG (اختياري)",
    test: "اختبار الاتصال",
    testing: "جارٍ الاختبار…",
    send: "إرسال إلى الجهاز",
    sending: "جارٍ الإرسال…",
    // Done
    doneTitle: "تم الاستيراد على تلفزيونك",
    doneBody: "استورد {product} مصدرك وأصبح جاهزاً للمشاهدة. يمكنك إغلاق هذه الصفحة.",
    sendAgain: "أرسل مرة أخرى",
    startOver: "ابدأ من جديد بكود جديد",
    secure: "آمن: يُرسَل مصدرك مشفّراً إلى جهازك المرتبط فقط عبر moalfarras.space.",
    needHelp: "تحتاج مساعدة؟",
    support: "افتح الدعم",
    // Statuses [title, helper]
    waiting: ["بانتظار الكود", "أدخل الرموز الأربعة كما تظهر على الجهاز بعد MO- تماماً."],
    invalid: ["تأكد من الكود", "أدخل الرموز الأربعة الظاهرة على جهازك الآن — قد يتغير الكود."],
    pending: ["اقتربت من النهاية", "وجدنا كودك. اضغط «أكِّد الجهاز» لإكمال الربط."],
    activated: ["تم تأكيد الجهاز", "رائع — تابع إلى الخطوة 2 وأضف مصدرك."],
    expired: ["انتهت صلاحية الكود", "أنشئ كوداً جديداً على الجهاز ثم أدخله مرة أخرى."],
    backend: ["مشكلة في الاتصال", "حدث خطأ مؤقت. تحقق من الإنترنت وحاول مرة أخرى."],
    rateLimited: ["محاولات كثيرة", "انتظر دقيقة ثم أعد فحص الكود."],
    // Source results
    testOk: "الاتصال يعمل. يمكنك الإرسال الآن.",
    testFail: "فشل الاتصال. راجع البيانات وحاول مرة أخرى.",
    testUnavailable: "تعذّر الاختبار حالياً. حاول بعد قليل.",
    sendOk: "تم الإرسال. يبدأ الاستيراد تلقائياً على التلفزيون.",
    sendFail: "تعذّر إرسال المصدر.",
    sendUnavailable: "تعذّر الإرسال حالياً. حاول بعد قليل.",
    sourceRateLimited: "محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.",
    deviceNotReady: "لم يعد تلفزيونك بانتظار مصدر. افتح شاشة التفعيل على التلفزيون ثم ابدأ من جديد بالكود الجديد.",
    // Device import (after send)
    waitingTvTitle: "بانتظار تلفزيونك…",
    waitingTvBody: "أبقِ شاشة التفعيل مفتوحة في {product}، وسيستلم المصدر تلقائياً خلال ثوانٍ.",
    importingTitle: "جارٍ الاستيراد على تلفزيونك…",
    importingBody: "استلم تلفزيونك المصدر ويحمّل {product} قنواتك الآن. قد تستغرق القوائم الكبيرة بضع دقائق، وستتحدّث هذه الصفحة تلقائياً.",
    importFailedTitle: "لم يكتمل الاستيراد",
    importFailedBody: "تعذّر على تلفزيونك استيراد المصدر.",
    importRevokedBody: "أُلغي المصدر قبل أن يستورده تلفزيونك.",
    deviceSaid: "رسالة التلفزيون:",
    importRetryHint: "راجع بيانات المصدر، ثم ابدأ من جديد بالكود الجديد الظاهر على التلفزيون.",
    sourceExpiredTitle: "لم يستلم تلفزيونك المصدر في الوقت المحدد",
    sourceExpiredBody: "حُذف المصدر حفاظاً على أمانك. افتح شاشة التفعيل على التلفزيون وابدأ من جديد بالكود الجديد.",
    checkTvTitle: "تحقّق من تلفزيونك",
    checkTvWaitingBody: "لم يستلم تلفزيونك المصدر بعد. تأكد أن شاشة التفعيل ما زالت مفتوحة في {product}، ثم أرسل المصدر مرة أخرى.",
    checkTvFetchedBody: "استلم تلفزيونك المصدر وقد يكون ما زال يحمّل القنوات. تحقّق من شاشة التلفزيون لمعرفة النتيجة.",
  },
} as const;

type Status = "waiting" | "pending" | "invalid" | "activated" | "expired" | "backend" | "rateLimited";
type SourceType = "xtream" | "m3u";
type SourceState = "idle" | "testing" | "ok" | "sending" | "sent" | "error";

type StatusPayload = {
  status?: string;
  productSlug?: string;
  expiresAt?: string;
  activatedAt?: string;
  sourceStatus?: string;
  sourceMessage?: string;
  message?: string;
};

type ApiResult = { response: Response; payload: StatusPayload | null };

function statusUrl(code: string, product: ActivationPageProduct | null) {
  const params = new URLSearchParams({ code: `MO-${code}` });
  if (product) params.set("product", product);
  return `/api/app/activation/status?${params.toString()}`;
}

async function readApiResult(request: Promise<Response>): Promise<ApiResult> {
  const response = await request;
  const payload = (await response.json().catch(() => null)) as StatusPayload | null;
  return { response, payload };
}

function statusFromResult({ response, payload }: ApiResult): Status {
  if (payload?.status === "activated") return "activated";
  if (payload?.status === "expired") return "expired";
  if (payload?.status === "invalid" || payload?.status === "wrong_product") return "invalid";
  if (response.status === 429) return "rateLimited";
  if (response.status === 202 || payload?.status === "pending") return "pending";
  return "backend";
}

// The code expired or is gone (410/404), or the TV's handoff session ended: the TV must show a new
// code. Said in the page language instead of the API's English message.
function pairingEnded(response: Response, payload: { status?: string } | null) {
  return response.status === 404 || response.status === 410 || payload?.status === "device_not_ready";
}

function normalizeCode(value: string) {
  return value
    .toUpperCase()
    .replace(/^MO-?/, "")
    .replace(/[^A-Z2-9]/g, "")
    .replace(/[O0I1S5]/g, "")
    .slice(0, 4);
}

function safeMessage(value: string) {
  return value
    .replace(/username=[^&\s]+/gi, "username=***")
    .replace(/password=[^&\s]+/gi, "password=***")
    .replace(/\/\/([^/\s:]+):([^@\s]+)@/g, "//***:***@");
}

export function MoPlayerActivationPage({
  locale,
  initialCode = "",
  productSlug,
}: {
  locale: Locale;
  initialCode?: string;
  /** Omitted when the URL names no product: the page then detects the app from the code. */
  productSlug?: ActivationPageProduct;
}) {
  const isAr = locale === "ar";
  const [product, setProduct] = useState<ActivationPageProduct | null>(productSlug ?? null);
  const [productDetected, setProductDetected] = useState(false);
  const isPro = product === "moplayer2";
  const isPc = product === "moplayer-pc";
  const t = repairMojibakeDeep(copy[locale]);
  const productName = isPc ? "MoPlayer PC" : isPro ? "MoPlayer Pro" : "MoPlayer";
  const fill = (value: string) => value.replace(/\{product\}/g, productName);

  const [code, setCode] = useState(() => normalizeCode(initialCode));
  const [status, setStatus] = useState<Status>("waiting");
  const [checking, setChecking] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("xtream");
  const [sourceState, setSourceState] = useState<SourceState>("idle");
  const [sourceMessage, setSourceMessage] = useState("");
  const [sentAt, setSentAt] = useState(0);
  const [importProgress, setImportProgress] = useState<ImportProgress>("waiting");
  const [importTimedOut, setImportTimedOut] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");

  const qrCode = normalizeCode(initialCode);
  const cameFromQr = qrCode.length === 4 && code === qrCode;
  const activated = status === "activated";
  const sent = sourceState === "sent";
  // Step 2 only counts as done once the TV reports the import.
  const activeStep = sent && importProgress === "imported" ? 3 : activated ? 2 : 1;

  const canSubmit =
    activated &&
    (sourceType === "xtream"
      ? Boolean(serverUrl.trim() && username.trim() && password)
      : Boolean(playlistUrl.trim()));

  const statusMeta = useMemo(() => {
    if (status === "invalid") return { icon: AlertCircle, tone: "is-error", data: t.invalid };
    if (status === "activated") return { icon: CheckCircle2, tone: "is-success", data: t.activated };
    if (status === "expired") return { icon: Clock3, tone: "is-warn", data: t.expired };
    if (status === "backend") return { icon: AlertCircle, tone: "is-error", data: t.backend };
    if (status === "rateLimited") return { icon: Clock3, tone: "is-warn", data: t.rateLimited };
    if (status === "pending") return { icon: Clock3, tone: "is-pending", data: t.pending };
    return { icon: KeyRound, tone: "is-waiting", data: t.waiting };
  }, [status, t]);

  useEffect(() => {
    if (normalizeCode(initialCode).length === 4) {
      void refreshStatus();
    }
    // Run once for a QR-provided initial code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After a send, follow the device: fetched → loading channels → imported/failed. The TV acks only
  // after its first library sync, so keep polling (backing off) for up to ten minutes.
  useEffect(() => {
    if (sourceState !== "sent" || !product || importTimedOut || importProgressIsFinal(importProgress)) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (Date.now() - sentAt >= IMPORT_POLL_BUDGET_MS) {
        setImportTimedOut(true);
        return;
      }
      try {
        const { payload } = await readApiResult(fetch(statusUrl(code, product), { method: "GET", cache: "no-store" }));
        if (cancelled) return;
        const next = nextImportProgress(importProgress, payload?.sourceStatus);
        if (next !== importProgress) {
          if (next === "failed") setImportMessage(payload?.sourceMessage ? safeMessage(payload.sourceMessage) : "");
          // Changing the progress re-runs this effect, which schedules the next poll.
          setImportProgress(next);
          return;
        }
      } catch {
        // Transient network issue — keep polling until the budget runs out.
      }
      if (!cancelled) timer = setTimeout(() => void poll(), importPollDelayMs(Date.now() - sentAt));
    };
    timer = setTimeout(() => void poll(), importPollDelayMs(Date.now() - sentAt));
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sourceState, product, code, sentAt, importProgress, importTimedOut]);

  // Codes are unique across apps, so the page follows the code: on the bare /activate URL (no product)
  // or on the other app's page the API names the right app and the page switches to it.
  function adoptProduct(next: ActivationPageProduct) {
    setProduct(next);
    setProductDetected(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("product", next);
      window.history.replaceState(null, "", url);
    } catch {
      // The URL is only a convenience for reloads; the page keeps working without it.
    }
    return next;
  }

  async function lookupStatus(): Promise<ApiResult & { product: ActivationPageProduct | null }> {
    let target = product;
    let result = await readApiResult(fetch(statusUrl(code, target), { method: "GET", cache: "no-store" }));
    const reported = adoptableActivationProduct(result.payload?.productSlug);
    if (result.payload?.status === "wrong_product" && reported) {
      target = adoptProduct(reported);
      result = await readApiResult(fetch(statusUrl(code, target), { method: "GET", cache: "no-store" }));
    } else if (!target && reported) {
      target = adoptProduct(reported);
    }
    return { ...result, product: target };
  }

  function confirmRequest(target: ActivationPageProduct) {
    const deviceName = target === "moplayer-pc" ? "MoPlayer PC" : target === "moplayer2" ? "MoPlayer Pro TV" : "MoPlayer TV";
    return readApiResult(
      fetch("/api/app/activation/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug: target, deviceName }),
      }),
    );
  }

  async function refreshStatus() {
    if (!allowed.test(code)) {
      setStatus("invalid");
      return;
    }

    setChecking(true);
    try {
      setStatus(statusFromResult(await lookupStatus()));
    } catch {
      setStatus("backend");
    } finally {
      setChecking(false);
    }
  }

  async function verifyCode() {
    if (!allowed.test(code)) {
      setStatus("invalid");
      return;
    }

    setChecking(true);
    try {
      let target = product;
      if (!target) {
        const lookup = await lookupStatus();
        if (!lookup.product || lookup.payload?.status !== "pending") {
          setStatus(statusFromResult(lookup));
          return;
        }
        target = lookup.product;
      }
      let result = await confirmRequest(target);
      const reported = adoptableActivationProduct(result.payload?.productSlug);
      if (result.payload?.status === "wrong_product" && reported) {
        result = await confirmRequest(adoptProduct(reported));
      }
      setStatus(statusFromResult(result));
    } catch {
      setStatus("backend");
    } finally {
      setChecking(false);
    }
  }

  function sourcePayload() {
    if (sourceType === "xtream") {
      return { type: "xtream", name: sourceName.trim() || productName, serverUrl, username, password };
    }
    return { type: "m3u", name: sourceName.trim() || productName, playlistUrl, epgUrl };
  }

  async function testSource() {
    if (!activated) return;
    setSourceState("testing");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug: product ?? undefined, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; status?: string; message?: string } | null;
      if (response.status === 429) {
        setSourceState("error");
        setSourceMessage(t.sourceRateLimited);
        return;
      }
      const ok = response.ok && payload?.ok;
      setSourceState(ok ? "ok" : "error");
      setSourceMessage(ok ? t.testOk : pairingEnded(response, payload) ? t.deviceNotReady : safeMessage(payload?.message || t.testFail));
    } catch {
      setSourceState("error");
      setSourceMessage(t.testUnavailable);
    }
  }

  async function sendSource() {
    if (!activated || !canSubmit) return;
    setSourceState("sending");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug: product ?? undefined, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; status?: string; message?: string } | null;
      if (response.status === 429) {
        setSourceState("error");
        setSourceMessage(t.sourceRateLimited);
        return;
      }
      if (response.ok && payload?.ok) {
        setSourceState("sent");
        setSourceMessage(t.sendOk);
        setSentAt(Date.now());
        setImportProgress("waiting");
        setImportTimedOut(false);
        setImportMessage("");
        setPassword("");
      } else {
        setSourceState("error");
        setSourceMessage(pairingEnded(response, payload) ? t.deviceNotReady : safeMessage(payload?.message || t.sendFail));
      }
    } catch {
      setSourceState("error");
      setSourceMessage(t.sendUnavailable);
    }
  }

  // Back to the source form for another send; the details stay filled in except the password.
  function resetSource() {
    setSourceState("idle");
    setSourceMessage("");
    setImportProgress("waiting");
    setImportTimedOut(false);
    setImportMessage("");
  }

  // A different code is a different pairing: the old result, and any send that followed it, no longer
  // apply. This is also how "start again with the new code" works from the source form.
  function changeCode(next: string) {
    if (next === code) return;
    setCode(next);
    if (status === "waiting" && sourceState === "idle") return;
    resetSource();
    setStatus("waiting");
    setProductDetected(false);
  }

  // Another send needs a fresh code from the TV's activation screen, so the flow restarts at step 1.
  function startOver() {
    resetSource();
    setServerUrl("");
    setUsername("");
    setPassword("");
    setPlaylistUrl("");
    setEpgUrl("");
    setSourceName("");
    setCode("");
    setStatus("waiting");
    setProductDetected(false);
  }

  // Shown when the send did not end in "imported": device failure, expired handoff, or no answer in time.
  const importIssue =
    importProgress === "failed" || importProgress === "revoked"
      ? {
          tone: "is-error",
          icon: AlertCircle,
          title: t.importFailedTitle,
          body: `${importProgress === "revoked" ? t.importRevokedBody : t.importFailedBody} ${t.importRetryHint}`,
          resend: false,
        }
      : importProgress === "expired"
        ? { tone: "is-warn", icon: Clock3, title: t.sourceExpiredTitle, body: t.sourceExpiredBody, resend: false }
        : {
            tone: "is-warn",
            icon: Tv,
            title: t.checkTvTitle,
            body: fill(importProgress === "fetched" ? t.checkTvFetchedBody : t.checkTvWaitingBody),
            resend: importProgress !== "fetched",
          };
  const ImportIssueIcon = importIssue.icon;
  const StatusIcon = statusMeta.icon;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;
  const NextArrow = isAr ? ArrowLeft : ArrowRight;
  const steps = [t.stepConfirm, t.stepSource];

  return (
    <main className={cn("mo-act", isPro && "mo-act-pro", isPc && "mo-act-pc")} dir={isAr ? "rtl" : "ltr"}>
      <div className="mo-act-aura" aria-hidden />
      <div className="mo-act-shell">
        <Link href={withLocale(locale, isPc ? "apps/moplayer-pc" : isPro ? "apps/moplayer2" : "apps/moplayer")} className="mo-act-back">
          <BackArrow className="h-4 w-4" />
          {isPc ? (isAr ? "العودة إلى MoPlayer PC" : "Back to MoPlayer PC") : isPro ? t.backPro : t.back}
        </Link>

        <header className="mo-act-head">
          <span className="mo-act-badge">
            <Tv className="h-4 w-4" />
            {productName}
          </span>
          <h1>{t.pageTitle}</h1>
          <p>{fill(t.pageSubtitle)}</p>
        </header>

        <ol className="mo-act-steps" aria-label={`${t.step} ${activeStep > 2 ? 2 : activeStep} ${t.of} 2`}>
          {steps.map((label, index) => {
            const stepNumber = index + 1;
            const state = activeStep > stepNumber ? "done" : activeStep === stepNumber ? "active" : "todo";
            return (
              <li key={label} className={cn("mo-act-step", `is-${state}`)}>
                <span className="mo-act-step-dot">{state === "done" ? <CheckCircle2 className="h-4 w-4" /> : stepNumber}</span>
                <span className="mo-act-step-label">{label}</span>
              </li>
            );
          })}
        </ol>

        {/* STEP 1 — Confirm code */}
        <section className={cn("mo-act-card", activated && "is-complete")} aria-labelledby="mo-act-step1">
          <div className="mo-act-card-head">
            <span className="mo-act-card-num">{activated ? <CheckCircle2 className="h-5 w-5" /> : "1"}</span>
            <div>
              <h2 id="mo-act-step1">{t.step1Title}</h2>
              <p>{fill(t.step1Lead)}</p>
            </div>
          </div>

          <div className="mo-act-code-field" dir="ltr">
            <span className="mo-act-code-prefix">MO-</span>
            <input
              value={code}
              maxLength={4}
              inputMode="text"
              autoCapitalize="characters"
              spellCheck={false}
              aria-label={t.codeLabel}
              onChange={(event) => changeCode(normalizeCode(event.target.value))}
              placeholder="4C7K"
            />
          </div>
          {cameFromQr ? (
            <p className="mo-act-hint">
              <CheckCircle2 className="h-4 w-4" />
              {t.fromQr}
            </p>
          ) : null}
          {productDetected ? (
            <p className="mo-act-hint">
              <Tv className="h-4 w-4" />
              {fill(t.productDetected)}
            </p>
          ) : null}

          <div className={cn("mo-act-status", statusMeta.tone)}>
            <StatusIcon className={cn("h-5 w-5", checking && "animate-spin")} />
            <div>
              <strong>{checking ? t.confirming : statusMeta.data[0]}</strong>
              <span>{statusMeta.data[1]}</span>
            </div>
          </div>

          {!activated ? (
            <div className="mo-act-actions">
              <button
                type="button"
                onClick={verifyCode}
                disabled={checking || code.length < 4}
                className="mo-act-btn mo-act-btn-primary"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {checking ? t.confirming : t.confirm}
              </button>
              <button type="button" onClick={refreshStatus} disabled={checking || code.length < 4} className="mo-act-btn">
                {t.recheck}
              </button>
            </div>
          ) : null}
        </section>

        {/* STEP 2 — Add source / Waiting for the TV / Imported / Problem */}
        {sent && !importTimedOut && (importProgress === "waiting" || importProgress === "fetched") ? (
          <section className="mo-act-card mo-act-done" aria-live="polite">
            <span className="mo-act-done-icon">
              <Loader2 className="h-7 w-7 animate-spin" />
            </span>
            <h2>{importProgress === "fetched" ? t.importingTitle : t.waitingTvTitle}</h2>
            <p>{fill(importProgress === "fetched" ? t.importingBody : t.waitingTvBody)}</p>
          </section>
        ) : sent && importProgress === "imported" ? (
          <section className="mo-act-card mo-act-done" aria-live="polite">
            <span className="mo-act-done-icon">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2>{t.doneTitle}</h2>
            <p>{fill(t.doneBody)}</p>
          </section>
        ) : sent ? (
          <section className="mo-act-card" aria-live="polite">
            <div className={cn("mo-act-status", importIssue.tone)}>
              <ImportIssueIcon className="h-5 w-5" />
              <div>
                <strong>{importIssue.title}</strong>
                <span>{importIssue.body}</span>
              </div>
            </div>
            {importProgress === "failed" && importMessage ? (
              <div className="mo-act-msg is-info">
                <Tv className="h-4 w-4" />
                <span>
                  {t.deviceSaid} <bdi dir="auto">{importMessage}</bdi>
                </span>
              </div>
            ) : null}
            <div className="mo-act-actions">
              <button
                type="button"
                onClick={importIssue.resend ? resetSource : startOver}
                className={cn("mo-act-btn", importIssue.resend && "mo-act-btn-primary")}
              >
                {importIssue.resend ? t.sendAgain : t.startOver}
              </button>
            </div>
          </section>
        ) : (
          <section className={cn("mo-act-card", !activated && "is-locked")} aria-labelledby="mo-act-step2">
            <div className="mo-act-card-head">
              <span className="mo-act-card-num">2</span>
              <div>
                <h2 id="mo-act-step2">{t.step2Title}</h2>
                <p>{activated ? fill(t.step2Lead) : t.step2Locked}</p>
              </div>
            </div>

            <fieldset className="mo-act-form" disabled={!activated}>
              <span className="mo-act-field-label">{t.typeLabel}</span>
              <div className="mo-act-type">
                <button
                  type="button"
                  onClick={() => setSourceType("xtream")}
                  className={cn("mo-act-type-card", sourceType === "xtream" && "is-active")}
                  aria-pressed={sourceType === "xtream"}
                >
                  <Cloud className="h-5 w-5" />
                  <strong>{t.xtream}</strong>
                  <span>{t.xtreamDesc}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceType("m3u")}
                  className={cn("mo-act-type-card", sourceType === "m3u" && "is-active")}
                  aria-pressed={sourceType === "m3u"}
                >
                  <Link2 className="h-5 w-5" />
                  <strong>{t.m3u}</strong>
                  <span>{t.m3uDesc}</span>
                </button>
              </div>

              <label className="mo-act-label">
                <span>{t.serverName}</span>
                <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder={t.serverNamePlaceholder} />
              </label>

              {sourceType === "xtream" ? (
                <>
                  <label className="mo-act-label">
                    <span>{t.portalUrl}</span>
                    <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} placeholder={t.portalPlaceholder} inputMode="url" dir="ltr" className="mo-act-url-input" />
                  </label>
                  <div className="mo-act-split">
                    <label className="mo-act-label">
                      <span>{t.username}</span>
                      <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="off" />
                    </label>
                    <label className="mo-act-label">
                      <span>{t.password}</span>
                      <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="off" />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <label className="mo-act-label">
                    <span>{t.playlistUrl}</span>
                    <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} placeholder={t.playlistPlaceholder} inputMode="url" dir="ltr" className="mo-act-url-input" />
                  </label>
                  <label className="mo-act-label">
                    <span>{t.epgUrl}</span>
                    <input value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} inputMode="url" dir="ltr" className="mo-act-url-input" />
                  </label>
                </>
              )}

              <div className="mo-act-actions">
                <button type="button" onClick={testSource} disabled={!canSubmit || sourceState === "testing"} className="mo-act-btn">
                  {sourceState === "testing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  {sourceState === "testing" ? t.testing : t.test}
                </button>
                <button type="button" onClick={sendSource} disabled={!canSubmit || sourceState === "sending"} className="mo-act-btn mo-act-btn-primary">
                  {sourceState === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sourceState === "sending" ? t.sending : t.send}
                  {canSubmit && sourceState !== "sending" ? <NextArrow className="h-4 w-4 mo-act-btn-arrow" /> : null}
                </button>
              </div>

              {sourceMessage ? (
                <div className={cn("mo-act-msg", sourceState === "ok" ? "is-ok" : sourceState === "error" ? "is-error" : "is-info")}>
                  {sourceState === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  {sourceMessage}
                </div>
              ) : null}
            </fieldset>
          </section>
        )}

        <footer className="mo-act-foot">
          <p className="mo-act-secure">
            <ShieldCheck className="h-4 w-4" />
            {t.secure}
          </p>
          <Link href={withLocale(locale, "support")} className="mo-act-help">
            {t.needHelp} <span>{t.support}</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
