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

import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const allowed = /^[A-HJ-NP-RT-Z2-46789]{4}$/;

const copy = {
  en: {
    back: "Back to MoPlayer",
    backPro: "Back to MoPlayer Pro",
    pageTitle: "Activate your TV",
    pageSubtitle: "Two simple steps and {product} is ready on your television.",
    step: "Step",
    of: "of",
    stepConfirm: "Confirm code",
    stepSource: "Add subscription",
    // Step 1
    step1Title: "Confirm your TV code",
    step1Lead: "Open {product} on your television. A code starting with MO- appears on screen — type the four characters here.",
    fromQr: "Code detected automatically from the QR scan.",
    codeLabel: "TV code",
    confirm: "Confirm TV",
    confirming: "Checking…",
    recheck: "Check again",
    // Step 2
    step2Title: "Add your subscription",
    step2Lead: "Enter your IPTV details. We send them securely straight to your TV — no typing on the television.",
    step2Locked: "Confirm your TV in step 1 to unlock this step.",
    typeLabel: "Subscription type",
    xtream: "Xtream Codes",
    xtreamDesc: "Username, password and portal URL",
    m3u: "M3U link",
    m3uDesc: "A single M3U playlist link",
    serverName: "Subscription name",
    serverNamePlaceholder: "My IPTV",
    portalUrl: "Portal URL",
    portalPlaceholder: "http://example.com:8080",
    username: "Username",
    password: "Password",
    playlistUrl: "M3U URL",
    playlistPlaceholder: "https://example.com/playlist.m3u8",
    epgUrl: "EPG guide URL (optional)",
    test: "Test connection",
    testing: "Testing…",
    send: "Send to TV",
    sending: "Sending…",
    // Done
    doneTitle: "Done — your TV is ready",
    doneBody: "Channels will appear on {product} in a few moments. You can close this page.",
    sendAnother: "Send another subscription",
    secure: "Secure: your subscription is encrypted and delivered only to your paired device via moalfarras.space.",
    needHelp: "Need help?",
    support: "Open support",
    // Statuses [title, helper]
    waiting: ["Waiting for your code", "Type the four characters exactly as shown on the TV after MO-."],
    invalid: ["Check the code", "Enter the four characters shown on your TV right now — the code can change."],
    pending: ["Almost there", "We found your code. Tap “Confirm TV” to finish pairing."],
    activated: ["TV confirmed", "Great — continue to step 2 and add your subscription."],
    expired: ["Code expired", "Generate a fresh code on the TV, then enter it again."],
    backend: ["Connection issue", "Something went wrong for a moment. Check your internet and try again."],
    // Source results
    testOk: "Connection works. You can send it now.",
    testFail: "Connection failed. Double-check the details and try again.",
    testUnavailable: "Could not test right now. Try again in a moment.",
    sendOk: "Sent. Import starts automatically on the TV.",
    sendFail: "Could not send the subscription.",
    sendUnavailable: "Could not send right now. Try again in a moment.",
  },
  ar: {
    back: "العودة إلى MoPlayer",
    backPro: "العودة إلى MoPlayer Pro",
    pageTitle: "فعِّل تلفزيونك",
    pageSubtitle: "خطوتان بسيطتان ويصبح {product} جاهزاً على التلفزيون.",
    step: "الخطوة",
    of: "من",
    stepConfirm: "تأكيد الكود",
    stepSource: "إضافة الاشتراك",
    // Step 1
    step1Title: "أكِّد كود التلفزيون",
    step1Lead: "افتح {product} على التلفزيون. سيظهر كود يبدأ بـ MO- على الشاشة — أدخل الرموز الأربعة هنا.",
    fromQr: "تم جلب الكود تلقائياً من مسح رمز QR.",
    codeLabel: "كود التلفزيون",
    confirm: "أكِّد التلفزيون",
    confirming: "جارٍ التحقق…",
    recheck: "إعادة الفحص",
    // Step 2
    step2Title: "أضف اشتراكك",
    step2Lead: "أدخل بيانات اشتراك IPTV وسنرسلها بأمان مباشرة إلى تلفزيونك — بدون أي كتابة على التلفزيون.",
    step2Locked: "أكمل تأكيد التلفزيون في الخطوة 1 لفتح هذه الخطوة.",
    typeLabel: "نوع الاشتراك",
    xtream: "Xtream Codes",
    xtreamDesc: "مستخدم وكلمة مرور ورابط بوابة",
    m3u: "رابط M3U",
    m3uDesc: "رابط تشغيل M3U واحد",
    serverName: "اسم الاشتراك",
    serverNamePlaceholder: "اشتراكي",
    portalUrl: "رابط البوابة (Portal)",
    portalPlaceholder: "http://example.com:8080",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    playlistUrl: "رابط M3U",
    playlistPlaceholder: "https://example.com/playlist.m3u8",
    epgUrl: "رابط دليل القنوات EPG (اختياري)",
    test: "اختبار الاتصال",
    testing: "جارٍ الاختبار…",
    send: "إرسال إلى التلفزيون",
    sending: "جارٍ الإرسال…",
    // Done
    doneTitle: "تم — تلفزيونك جاهز",
    doneBody: "ستظهر القنوات على {product} خلال لحظات. يمكنك إغلاق هذه الصفحة.",
    sendAnother: "إرسال اشتراك آخر",
    secure: "آمن: يُرسَل اشتراكك مشفّراً إلى جهازك المرتبط فقط عبر moalfarras.space.",
    needHelp: "تحتاج مساعدة؟",
    support: "افتح الدعم",
    // Statuses [title, helper]
    waiting: ["بانتظار الكود", "أدخل الرموز الأربعة كما تظهر على التلفزيون بعد MO- تماماً."],
    invalid: ["تأكد من الكود", "أدخل الرموز الأربعة الظاهرة على تلفزيونك الآن — قد يتغير الكود."],
    pending: ["اقتربت من النهاية", "وجدنا كودك. اضغط «أكِّد التلفزيون» لإكمال الربط."],
    activated: ["تم تأكيد التلفزيون", "رائع — تابع إلى الخطوة 2 وأضف اشتراكك."],
    expired: ["انتهت صلاحية الكود", "أنشئ كوداً جديداً على التلفزيون ثم أدخله مرة أخرى."],
    backend: ["مشكلة في الاتصال", "حدث خطأ مؤقت. تحقق من الإنترنت وحاول مرة أخرى."],
    // Source results
    testOk: "الاتصال يعمل. يمكنك الإرسال الآن.",
    testFail: "فشل الاتصال. راجع البيانات وحاول مرة أخرى.",
    testUnavailable: "تعذّر الاختبار حالياً. حاول بعد قليل.",
    sendOk: "تم الإرسال. يبدأ الاستيراد تلقائياً على التلفزيون.",
    sendFail: "تعذّر إرسال الاشتراك.",
    sendUnavailable: "تعذّر الإرسال حالياً. حاول بعد قليل.",
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
  const fill = (value: string) => value.replace(/\{product\}/g, productName);

  const [code, setCode] = useState(() => normalizeCode(initialCode));
  const [status, setStatus] = useState<Status>("waiting");
  const [checking, setChecking] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("xtream");
  const [sourceState, setSourceState] = useState<SourceState>("idle");
  const [sourceMessage, setSourceMessage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");

  const cameFromQr = normalizeCode(initialCode).length === 4;
  const activated = status === "activated";
  const sent = sourceState === "sent";
  const activeStep = sent ? 3 : activated ? 2 : 1;

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

  async function refreshStatus() {
    if (!allowed.test(code)) {
      setStatus("invalid");
      return;
    }

    setChecking(true);
    try {
      const response = await fetch(
        `/api/app/activation/status?code=${encodeURIComponent(`MO-${code}`)}&product=${encodeURIComponent(productSlug)}`,
        { method: "GET", cache: "no-store" },
      );
      const payload = (await response.json().catch(() => null)) as StatusPayload | null;

      if (payload?.status === "activated") {
        setStatus("activated");
      } else if (payload?.status === "expired") {
        setStatus("expired");
      } else if (payload?.status === "invalid") {
        setStatus("invalid");
      } else if (response.status === 202 || payload?.status === "pending") {
        setStatus("pending");
      } else {
        setStatus("backend");
      }
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
      const response = await fetch("/api/app/activation/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: `MO-${code}`, productSlug, deviceName: isPro ? "MoPlayer Pro TV" : "MoPlayer TV" }),
      });
      const payload = (await response.json().catch(() => null)) as StatusPayload | null;
      if (response.ok && payload?.status === "activated") {
        setStatus("activated");
      } else if (payload?.status === "expired") {
        setStatus("expired");
      } else if (payload?.status === "invalid") {
        setStatus("invalid");
      } else if (response.status === 202 || payload?.status === "pending") {
        setStatus("pending");
      } else {
        setStatus("backend");
      }
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
        body: JSON.stringify({ code: `MO-${code}`, productSlug, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      const ok = response.ok && payload?.ok;
      setSourceState(ok ? "ok" : "error");
      setSourceMessage(ok ? t.testOk : safeMessage(payload?.message || t.testFail));
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
        body: JSON.stringify({ code: `MO-${code}`, productSlug, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (response.ok && payload?.ok) {
        setSourceState("sent");
        setSourceMessage(t.sendOk);
        setPassword("");
        await refreshStatus();
      } else {
        setSourceState("error");
        setSourceMessage(safeMessage(payload?.message || t.sendFail));
      }
    } catch {
      setSourceState("error");
      setSourceMessage(t.sendUnavailable);
    }
  }

  function resetSource() {
    setSourceState("idle");
    setSourceMessage("");
    setServerUrl("");
    setUsername("");
    setPassword("");
    setPlaylistUrl("");
    setEpgUrl("");
    setSourceName("");
  }

  const StatusIcon = statusMeta.icon;
  const BackArrow = isAr ? ArrowRight : ArrowLeft;
  const NextArrow = isAr ? ArrowLeft : ArrowRight;
  const steps = [t.stepConfirm, t.stepSource];

  return (
    <main className={cn("mo-act", isPro && "mo-act-pro")} dir={isAr ? "rtl" : "ltr"}>
      <div className="mo-act-aura" aria-hidden />
      <div className="mo-act-shell">
        <Link href={withLocale(locale, isPro ? "apps/moplayer2" : "apps/moplayer")} className="mo-act-back">
          <BackArrow className="h-4 w-4" />
          {isPro ? t.backPro : t.back}
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
              onChange={(event) => setCode(normalizeCode(event.target.value))}
              placeholder="4C7K"
            />
          </div>
          {cameFromQr ? (
            <p className="mo-act-hint">
              <CheckCircle2 className="h-4 w-4" />
              {t.fromQr}
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

        {/* STEP 2 — Add subscription / Done */}
        {sent ? (
          <section className="mo-act-card mo-act-done" aria-live="polite">
            <span className="mo-act-done-icon">
              <Sparkles className="h-7 w-7" />
            </span>
            <h2>{t.doneTitle}</h2>
            <p>{fill(t.doneBody)}</p>
            <button type="button" onClick={resetSource} className="mo-act-btn">
              {t.sendAnother}
            </button>
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
                    <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} placeholder={t.portalPlaceholder} inputMode="url" />
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
                    <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} placeholder={t.playlistPlaceholder} inputMode="url" />
                  </label>
                  <label className="mo-act-label">
                    <span>{t.epgUrl}</span>
                    <input value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} inputMode="url" />
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
