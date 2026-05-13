"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Cloud,
  KeyRound,
  Link2,
  Monitor,
  PlayCircle,
  QrCode,
  RefreshCw,
  Shield,
  ShieldCheck,
  Tv,
  Wifi,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const allowed = /^[A-HJ-NP-RT-Z2-46789]{4}$/;

const copy = {
  en: {
    backApps: "Back to MoPlayer",
    brand: "MoPlayer Control",
    navActivation: "Activation",
    navProfiles: "Profiles",
    navDevices: "Devices",
    navSecurity: "Security",
    title: "TV Activation",
    ready: "Ready for a TV code.",
    refresh: "Refresh",
    heroTitle: "Pair this Android TV without typing passwords on the TV.",
    heroBody:
      "Open MoPlayer on Android TV, scan the QR code, confirm the short code here, then send one Xtream or M3U profile through the official moalfarras.space activation service.",
    scan: "Scan the TV QR code",
    codeLabel: "Activation code",
    codeHint: "Use the four characters after MO-. QR links can pass code or device_code.",
    verify: "Verify code",
    verifying: "Verifying...",
    statusTitle: "Device status",
    userCode: "User code",
    status: "Status",
    endpoint: "Endpoint",
    expires: "Expires",
    notLoaded: "not loaded",
    waiting: ["Ready for your TV code", "Enter the four-character code shown inside MoPlayer. The app displays it as MO-XXXX."],
    invalid: ["Code needs attention", "Use exactly four valid characters. Ambiguous characters are ignored for safer typing."],
    activated: ["Activation successful", "Your TV is paired. You can now send an IPTV source to MoPlayer securely."],
    pending: ["Still waiting", "The code exists, but the TV has not been activated yet."],
    expired: ["Code expired", "Generate a fresh code on the TV and verify it again."],
    backend: ["Connection issue", "The activation service did not respond correctly. Try again in a moment."],
    sourceTitle: "Attach IPTV profile",
    device: "Device",
    deviceReady: "Paired MoPlayer TV",
    deviceWaiting: "Waiting for QR",
    serverName: "Server name",
    type: "Type",
    xtream: "Xtream",
    m3u: "M3U",
    portalUrl: "Portal URL",
    username: "User",
    password: "Password",
    playlistUrl: "M3U URL",
    epgUrl: "EPG URL, optional",
    test: "Test source",
    testing: "Testing...",
    send: "Send to app",
    sending: "Sending...",
    securityTitle: "Security notes",
    securityBody:
      "MoPlayer and the website share one domain, but they stay distinct: the website confirms the device and the Android TV app imports only the encrypted source queued for that paired device.",
    successTest: "Connection test successful.",
    failureTest: "Connection test failed.",
    unavailableTest: "Could not test the source right now.",
    successSend: "Source sent to the app. Import will begin automatically.",
    failureSend: "Could not send the source.",
    unavailableSend: "Could not send the source right now.",
  },
  ar: {
    backApps: "العودة إلى MoPlayer",
    brand: "MoPlayer Control",
    navActivation: "التفعيل",
    navProfiles: "المصادر",
    navDevices: "الأجهزة",
    navSecurity: "الأمان",
    title: "تفعيل التلفزيون",
    ready: "جاهز لكود التلفزيون.",
    refresh: "تحديث",
    heroTitle: "اربط Android TV بدون كتابة كلمات المرور على التلفزيون.",
    heroBody:
      "افتح MoPlayer على Android TV، امسح رمز QR، أكد الكود القصير هنا، ثم أرسل مصدر Xtream أو M3U عبر خدمة التفعيل الرسمية على moalfarras.space.",
    scan: "امسح رمز QR من التلفزيون",
    codeLabel: "كود التفعيل",
    codeHint: "استخدم الأحرف الأربعة بعد MO-. روابط QR يمكنها تمرير code أو device_code.",
    verify: "تحقق من الكود",
    verifying: "جار التحقق...",
    statusTitle: "حالة الجهاز",
    userCode: "كود المستخدم",
    status: "الحالة",
    endpoint: "المصدر",
    expires: "ينتهي",
    notLoaded: "غير محمل",
    waiting: ["جاهز لكود التلفزيون", "أدخل الكود المكون من أربعة أحرف كما يظهر داخل MoPlayer بصيغة MO-XXXX."],
    invalid: ["الكود يحتاج تصحيح", "استخدم أربعة أحرف صحيحة فقط. الأحرف المربكة يتم تجاهلها لتسهيل الكتابة."],
    activated: ["تم التفعيل بنجاح", "تم ربط التلفزيون. يمكنك الآن إرسال مصدر IPTV إلى MoPlayer بأمان."],
    pending: ["بانتظار التأكيد", "الكود موجود، لكن لم يتم تفعيل التلفزيون بعد."],
    expired: ["انتهت صلاحية الكود", "أنشئ كودا جديدا من التلفزيون ثم حاول مرة أخرى."],
    backend: ["مشكلة اتصال", "خدمة التفعيل لم تستجب بشكل صحيح. حاول بعد قليل."],
    sourceTitle: "إضافة مصدر IPTV",
    device: "الجهاز",
    deviceReady: "تلفزيون MoPlayer مربوط",
    deviceWaiting: "بانتظار QR",
    serverName: "اسم السيرفر",
    type: "النوع",
    xtream: "Xtream",
    m3u: "M3U",
    portalUrl: "رابط البوابة",
    username: "المستخدم",
    password: "كلمة المرور",
    playlistUrl: "رابط M3U",
    epgUrl: "رابط EPG اختياري",
    test: "اختبار المصدر",
    testing: "جار الاختبار...",
    send: "إرسال إلى التطبيق",
    sending: "جار الإرسال...",
    securityTitle: "ملاحظات الأمان",
    securityBody:
      "MoPlayer والموقع يعملان على نفس الدومين، لكنهما يبقيان تطبيقين مختلفين: الموقع يؤكد الجهاز، وتطبيق Android TV يستورد فقط المصدر المشفر المخصص للجهاز المرتبط.",
    successTest: "تم اختبار الاتصال بنجاح.",
    failureTest: "فشل اختبار الاتصال.",
    unavailableTest: "تعذر اختبار المصدر حاليا.",
    successSend: "تم إرسال المصدر إلى التطبيق. سيبدأ الاستيراد تلقائيا.",
    failureSend: "تعذر إرسال المصدر.",
    unavailableSend: "تعذر إرسال المصدر حاليا.",
  },
} as const;

type Status = "waiting" | "pending" | "invalid" | "activated" | "expired" | "backend";
type SourceType = "xtream" | "m3u";
type SourceState = "idle" | "testing" | "ok" | "sending" | "sent" | "error";

type StatusPayload = {
  status?: string;
  expiresAt?: string;
  activatedAt?: string;
  sourceStatus?: string;
  message?: string;
};

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

function maskEndpoint(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}/...`;
  } catch {
    return value ? "configured" : "not set";
  }
}

function displayDate(value?: string) {
  if (!value) return "-";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "-";
  return new Date(value).toLocaleString();
}

export function MoPlayerActivationPage({
  locale,
  initialCode = "",
  productSlug = "moplayer",
}: {
  locale: Locale;
  initialCode?: string;
  productSlug?: "moplayer" | "moplayer2";
}) {
  const isAr = locale === "ar";
  const isPro = productSlug === "moplayer2";
  const t = repairMojibakeDeep(copy[locale]);
  const productName = isPro ? "MoPlayer Pro" : "MoPlayer";
  const controlBrand = isPro ? "MoPlayer Pro Control" : t.brand;
  const [code, setCode] = useState(() => normalizeCode(initialCode));
  const [status, setStatus] = useState<Status>("waiting");
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>(t.ready);
  const [activationMeta, setActivationMeta] = useState<StatusPayload | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("xtream");
  const [sourceState, setSourceState] = useState<SourceState>("idle");
  const [sourceMessage, setSourceMessage] = useState("");
  const [sourceName, setSourceName] = useState("Premium IPTV");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");

  const fullCode = code ? `MO-${code}` : "MO-XXXX";
  const canSubmit =
    status === "activated" &&
    (sourceType === "xtream"
      ? sourceName.trim() && serverUrl.trim() && username.trim() && password
      : sourceName.trim() && playlistUrl.trim());

  const statusMeta = useMemo(() => {
    if (status === "invalid") return { icon: XCircle, tone: "is-error", data: t.invalid };
    if (status === "activated") return { icon: CheckCircle2, tone: "is-success", data: t.activated };
    if (status === "expired") return { icon: Clock3, tone: "is-warn", data: t.expired };
    if (status === "backend") return { icon: XCircle, tone: "is-error", data: t.backend };
    if (status === "pending") return { icon: Clock3, tone: "is-waiting", data: t.pending };
    return { icon: Clock3, tone: "is-waiting", data: t.waiting };
  }, [status, t]);

  useEffect(() => {
    if (code.length === 4) {
      void refreshStatus();
    }
    // Run only for a QR-provided initial code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshStatus() {
    if (!allowed.test(code)) {
      setStatus("invalid");
      setStatusMessage(t.invalid[1]);
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(
        `/api/app/activation/status?code=${encodeURIComponent(`MO-${code}`)}&product=${encodeURIComponent(productSlug)}`,
        {
        method: "GET",
        cache: "no-store",
        },
      );
      const payload = (await response.json().catch(() => null)) as StatusPayload | null;
      setActivationMeta(payload);

      if (payload?.status === "activated") {
        setStatus("activated");
        setStatusMessage(payload.sourceStatus ? `Activation status: ${payload.sourceStatus}` : t.activated[0]);
      } else if (payload?.status === "expired") {
        setStatus("expired");
        setStatusMessage(t.expired[0]);
      } else if (payload?.status === "invalid") {
        setStatus("invalid");
        setStatusMessage(payload.message ? safeMessage(payload.message) : t.invalid[0]);
      } else if (response.status === 202 || payload?.status === "pending") {
        setStatus("pending");
        setStatusMessage(t.pending[0]);
      } else {
        setStatus("backend");
        setStatusMessage(payload?.message ? safeMessage(payload.message) : t.backend[0]);
      }
    } catch {
      setStatus("backend");
      setStatusMessage(t.backend[0]);
    } finally {
      setChecking(false);
    }
  }

  async function verifyCode() {
    if (!allowed.test(code)) {
      setStatus("invalid");
      setStatusMessage(t.invalid[1]);
      return;
    }

    setChecking(true);
    try {
      const response = await fetch("/api/app/activation/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug, deviceName: isPro ? "MoPlayer Pro TV" : "MoPlayer TV" }),
      });
      const payload = (await response.json().catch(() => null)) as StatusPayload | null;
      setActivationMeta(payload);
      if (response.ok && payload?.status === "activated") {
        setStatus("activated");
        setStatusMessage(t.activated[0]);
      } else if (payload?.status === "expired") {
        setStatus("expired");
        setStatusMessage(t.expired[0]);
      } else if (payload?.status === "invalid") {
        setStatus("invalid");
        setStatusMessage(payload.message ? safeMessage(payload.message) : t.invalid[0]);
      } else {
        setStatus("backend");
        setStatusMessage(payload?.message ? safeMessage(payload.message) : t.backend[0]);
      }
    } catch {
      setStatus("backend");
      setStatusMessage(t.backend[0]);
    } finally {
      setChecking(false);
    }
  }

  function sourcePayload() {
    if (sourceType === "xtream") {
      return { type: "xtream", name: sourceName, serverUrl, username, password };
    }
    return { type: "m3u", name: sourceName, playlistUrl, epgUrl };
  }

  async function testSource() {
    if (status !== "activated") return;
    setSourceState("testing");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setSourceState(response.ok && payload?.ok ? "ok" : "error");
      setSourceMessage(safeMessage(payload?.message || (response.ok ? t.successTest : t.failureTest)));
    } catch {
      setSourceState("error");
      setSourceMessage(t.unavailableTest);
    }
  }

  async function sendSource() {
    if (status !== "activated" || !canSubmit) return;
    setSourceState("sending");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (response.ok && payload?.ok) {
        setSourceState("sent");
        setSourceMessage(safeMessage(payload?.message || t.successSend));
        setPassword("");
        await refreshStatus();
      } else {
        setSourceState("error");
        setSourceMessage(safeMessage(payload?.message || t.failureSend));
      }
    } catch {
      setSourceState("error");
      setSourceMessage(t.unavailableSend);
    }
  }

  const StatusIcon = statusMeta.icon;
  const endpointValue = sourceType === "xtream" ? serverUrl : playlistUrl;

  return (
    <main className={cn("activation-lux activation-control", isPro && "activation-control-pro")} dir={isAr ? "rtl" : "ltr"}>
      <div className="activation-aura" aria-hidden />
      <aside className="activation-control-sidebar">
        <Link href={withLocale(locale, isPro ? "apps/moplayer2" : "apps/moplayer")} className="activation-control-back">
          {isPro ? (isAr ? "العودة إلى MoPlayer Pro" : "Back to MoPlayer Pro") : t.backApps}
        </Link>
        <div className="activation-control-brand">
          <Image src="/images/moplayer-icon-512.png" alt="" width={48} height={48} />
          <span>{controlBrand}</span>
        </div>
        <nav aria-label="MoPlayer control">
          <a className="is-active">
            <KeyRound className="h-4 w-4" />
            {t.navActivation}
          </a>
          <a>
            <Cloud className="h-4 w-4" />
            {t.navProfiles}
          </a>
          <a>
            <Monitor className="h-4 w-4" />
            {t.navDevices}
          </a>
          <a>
            <Shield className="h-4 w-4" />
            {t.navSecurity}
          </a>
        </nav>
      </aside>

      <section className="activation-control-workspace">
        <header className="activation-control-topbar">
          <div>
            <h1>{t.title}</h1>
            <p>
              <Wifi className="h-4 w-4" />
              {statusMessage}
            </p>
          </div>
          <button type="button" onClick={refreshStatus} disabled={checking || code.length < 4} className="activation-button">
            <RefreshCw className={cn("h-4 w-4", checking && "animate-spin")} />
            {t.refresh}
          </button>
        </header>

        <section className="activation-control-hero">
          <div>
            <span className="activation-kicker">
              <ShieldCheck className="h-4 w-4" />
              {controlBrand}
            </span>
            <h2>{t.heroTitle}</h2>
            <p>{t.heroBody}</p>
          </div>
          <div className="activation-control-tv">
            <Tv className="h-11 w-11" />
            <strong>{fullCode}</strong>
            <span>{status === "activated" ? t.deviceReady.replace("MoPlayer", productName) : t.scan}</span>
          </div>
        </section>

        <section className="activation-control-grid">
          <div className="activation-control-panel activation-control-form">
            <h3>{t.sourceTitle}</h3>
            <label>
              <span>{t.codeLabel}</span>
              <input value={code} maxLength={4} onChange={(event) => setCode(normalizeCode(event.target.value))} placeholder="4C7K" />
              <small>{t.codeHint}</small>
            </label>
            <button type="button" onClick={verifyCode} disabled={checking || code.length < 4} className="activation-button activation-button-primary">
              <CheckCircle2 className="h-4 w-4" />
              {checking ? t.verifying : t.verify}
            </button>

            <label>
              <span>{t.device}</span>
              <input readOnly value={status === "activated" ? `${t.deviceReady.replace("MoPlayer", productName)} (${fullCode})` : t.deviceWaiting} />
            </label>
            <label>
              <span>{t.serverName}</span>
              <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} />
            </label>
            <label>
              <span>{t.type}</span>
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value as SourceType)}>
                <option value="xtream">{t.xtream}</option>
                <option value="m3u">{t.m3u}</option>
              </select>
            </label>

            {sourceType === "xtream" ? (
              <>
                <label>
                  <span>{t.portalUrl}</span>
                  <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} />
                </label>
                <div className="activation-control-split">
                  <label>
                    <span>{t.username}</span>
                    <input value={username} onChange={(event) => setUsername(event.target.value)} />
                  </label>
                  <label>
                    <span>{t.password}</span>
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </label>
                </div>
              </>
            ) : (
              <>
                <label>
                  <span>{t.playlistUrl}</span>
                  <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} />
                </label>
                <label>
                  <span>{t.epgUrl}</span>
                  <input value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} />
                </label>
              </>
            )}

            <div className="activation-source-actions">
              <button type="button" onClick={testSource} disabled={status !== "activated" || sourceState === "testing"} className="activation-button">
                <PlayCircle className="h-4 w-4" />
                {sourceState === "testing" ? t.testing : t.test}
              </button>
              <button type="button" onClick={sendSource} disabled={!canSubmit || sourceState === "sending"} className="activation-button activation-button-primary">
                <CheckCircle2 className="h-4 w-4" />
                {sourceState === "sending" ? t.sending : t.send}
              </button>
            </div>

            {sourceMessage ? (
              <div className={cn("activation-source-message", sourceState === "ok" || sourceState === "sent" ? "is-success" : "is-error")}>
                {sourceMessage}
              </div>
            ) : null}
          </div>

          <div className="activation-control-panel">
            <h3>{t.statusTitle}</h3>
            <div className="activation-control-list">
              <div className="activation-control-row">
                <div>
                  <strong>{t.userCode}</strong>
                  <span>{fullCode}</span>
                </div>
                <KeyRound className="h-4 w-4" />
              </div>
              <div className="activation-control-row">
                <div>
                  <strong>{t.status}</strong>
                  <span>{activationMeta?.status ?? status ?? t.notLoaded}</span>
                </div>
                <StatusIcon className="h-4 w-4" />
              </div>
              <div className="activation-control-row">
                <div>
                  <strong>{t.expires}</strong>
                  <span>{displayDate(activationMeta?.expiresAt)}</span>
                </div>
                <RefreshCw className="h-4 w-4" />
              </div>
              <div className="activation-control-row">
                <div>
                  <strong>{t.endpoint}</strong>
                  <span>{maskEndpoint(endpointValue)}</span>
                </div>
                <Link2 className="h-4 w-4" />
              </div>
            </div>
            <div className={cn("activation-status activation-control-status", statusMeta.tone)}>
              <StatusIcon className="h-7 w-7" />
              <h3>{statusMeta.data[0]}</h3>
              <p>{statusMeta.data[1]}</p>
            </div>
          </div>

          <div className="activation-control-panel activation-control-wide">
            <h3>{t.securityTitle}</h3>
            <p>{t.securityBody}</p>
            <div className="activation-trust">
              <span>
                <ShieldCheck className="h-4 w-4" />
                moalfarras.space
              </span>
              <span>
                <QrCode className="h-4 w-4" />
                /activate?device_code=XXXX
              </span>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
