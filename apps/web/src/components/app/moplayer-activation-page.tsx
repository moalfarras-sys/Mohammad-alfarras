"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Apple,
  CheckCircle2,
  ChevronRight,
  Clock3,
  KeyRound,
  Mail,
  PlayCircle,
  QrCode,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Tv,
  UserRound,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

const allowed = /^[A-HJ-NP-RT-Z2-46789]{4}$/;

const copy = {
  en: {
    kicker: "Guided MoPlayer activation",
    title: "Unlock the full cinematic experience in seconds.",
    body:
      "Choose MoPlayer, continue with your account layer, then enter the short MO code shown on your Android TV. The flow stays simple on a phone and secure for your TV setup.",
    productStep: "Choose your Product",
    loginStep: "Login or Register",
    codeStep: "Enter Activation Code",
    productTitle: "MoPlayer for Android TV",
    productBody: "Pair your TV, connect sources, and keep the setup controlled from the official website.",
    continue: "Continue",
    welcome: "Welcome Back",
    loginBody: "Use an email or a social sign-in entry point before pairing the device. This keeps the activation journey clear for normal users.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    google: "Continue with Google",
    apple: "Continue with Apple",
    emailContinue: "Continue with email",
    skip: "Continue to activation",
    codeLabel: "Activation code",
    check: "Verify code",
    checking: "Verifying...",
    testing: "Testing...",
    sending: "Sending...",
    waiting: ["Ready for your TV code", "Enter the four-character code shown inside MoPlayer. The app displays it as MO-XXXX."],
    invalid: ["Code needs attention", "Use exactly four valid characters. Ambiguous characters are ignored for safer typing."],
    activated: ["Activation successful", "Your TV is paired. You can now send an IPTV source to MoPlayer securely."],
    expired: ["Code expired", "Generate a fresh code on the TV and verify it again."],
    backend: ["Connection issue", "The activation service did not respond correctly. Try again in a moment."],
    success: "Activation Successful",
    sourceTitle: "Send your playlist securely",
    sourceBody: "After pairing, choose the provider type, test the connection, then send the source directly to the app.",
    sourceName: "Source name",
    xtream: "Xtream",
    m3u: "M3U playlist",
    serverUrl: "Server URL",
    username: "Username",
    password: "Password",
    playlistUrl: "Playlist URL",
    epgUrl: "EPG URL, optional",
    test: "Test source",
    send: "Send to app",
    privacy: "Only the paired app receives the source. The public page never displays provider credentials.",
    codeHint: "Open MoPlayer on Android TV and choose website activation to see your code.",
    successTest: "Connection test successful.",
    failureTest: "Connection test failed.",
    unavailableTest: "Could not test the source right now.",
    successSend: "Source sent to the app. Import will begin automatically.",
    failureSend: "Could not send the source.",
    unavailableSend: "Could not send the source right now.",
    backApps: "Back to apps",
  },
  ar: {
    kicker: "تفعيل MoPlayer الموجّه",
    title: "افتح التجربة السينمائية الكاملة في ثوانٍ.",
    body:
      "اختر MoPlayer، تابع عبر طبقة الحساب، ثم أدخل كود MO القصير الظاهر على Android TV. المسار واضح على الجوال وآمن لإعداد التلفزيون.",
    productStep: "اختر المنتج",
    loginStep: "تسجيل الدخول أو إنشاء حساب",
    codeStep: "أدخل كود التفعيل",
    productTitle: "MoPlayer لتلفزيون Android",
    productBody: "اربط التلفزيون، أرسل المصادر، وتحكم بالإعداد من الموقع الرسمي بسهولة.",
    continue: "متابعة",
    welcome: "أهلًا بعودتك",
    loginBody: "استخدم البريد أو خيار دخول اجتماعي قبل ربط الجهاز حتى تبقى تجربة التفعيل واضحة للمستخدم العادي.",
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    google: "المتابعة عبر Google",
    apple: "المتابعة عبر Apple",
    emailContinue: "المتابعة بالبريد",
    skip: "الانتقال للتفعيل",
    codeLabel: "كود التفعيل",
    check: "تحقق من الكود",
    checking: "جارٍ التحقق...",
    testing: "جارٍ الاختبار...",
    sending: "جارٍ الإرسال...",
    waiting: ["جاهز لكود التلفزيون", "أدخل الكود المكوّن من أربع خانات كما يظهر داخل MoPlayer بصيغة MO-XXXX."],
    invalid: ["الكود يحتاج تصحيح", "استخدم أربع خانات صحيحة فقط. الأحرف والأرقام المربكة يتم تجاهلها لتسهيل الكتابة."],
    activated: ["تم التفعيل بنجاح", "تم ربط التلفزيون. يمكنك الآن إرسال مصدر IPTV إلى MoPlayer بشكل آمن."],
    expired: ["انتهت صلاحية الكود", "أنشئ كودًا جديدًا من التلفزيون ثم حاول التحقق مرة أخرى."],
    backend: ["مشكلة اتصال", "خدمة التفعيل لم تستجب بشكل صحيح. حاول بعد قليل."],
    success: "تم التفعيل بنجاح",
    sourceTitle: "أرسل قائمتك بأمان",
    sourceBody: "بعد الربط، اختر نوع المزود، اختبر الاتصال، ثم أرسل المصدر مباشرة إلى التطبيق.",
    sourceName: "اسم المصدر",
    xtream: "Xtream",
    m3u: "رابط M3U",
    serverUrl: "رابط السيرفر",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    playlistUrl: "رابط القائمة",
    epgUrl: "رابط EPG، اختياري",
    test: "اختبار المصدر",
    send: "إرسال إلى التطبيق",
    privacy: "المصدر يصل إلى التطبيق المرتبط فقط. الصفحة العامة لا تعرض بيانات المزود.",
    codeHint: "افتح MoPlayer على Android TV واختر التفعيل عبر الموقع لرؤية الكود.",
    successTest: "تم اختبار الاتصال بنجاح.",
    failureTest: "فشل اختبار الاتصال.",
    unavailableTest: "تعذر اختبار المصدر حاليًا.",
    successSend: "تم إرسال المصدر إلى التطبيق. سيبدأ الاستيراد تلقائيًا.",
    failureSend: "تعذر إرسال المصدر.",
    unavailableSend: "تعذر إرسال المصدر حاليًا.",
    backApps: "العودة للتطبيقات",
  },
} as const;

type Status = "waiting" | "invalid" | "activated" | "expired" | "backend";
type SourceType = "xtream" | "m3u";
type SourceState = "idle" | "testing" | "ok" | "sending" | "sent" | "error";
type WizardStep = 1 | 2 | 3;

function normalizeCode(value: string) {
  return value
    .toUpperCase()
    .replace(/^MO-?/, "")
    .replace(/[^A-Z2-9]/g, "")
    .replace(/[O0I1S5]/g, "")
    .slice(0, 4);
}

export function MoPlayerActivationPage({ locale, initialCode = "" }: { locale: Locale; initialCode?: string }) {
  const isAr = locale === "ar";
  const t = copy[locale];
  const [wizardStep, setWizardStep] = useState<WizardStep>(() => (initialCode ? 3 : 1));
  const [accountEmail, setAccountEmail] = useState("");
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

  const fullCode = `MO-${code}`;

  const statusMeta = useMemo(() => {
    if (status === "invalid") return { icon: XCircle, tone: "is-error", data: t.invalid };
    if (status === "activated") return { icon: CheckCircle2, tone: "is-success", data: t.activated };
    if (status === "expired") return { icon: Clock3, tone: "is-warn", data: t.expired };
    if (status === "backend") return { icon: XCircle, tone: "is-error", data: t.backend };
    return { icon: Clock3, tone: "is-waiting", data: t.waiting };
  }, [status, t]);

  async function checkCode() {
    if (!allowed.test(code)) {
      setStatus("invalid");
      return;
    }

    setChecking(true);
    try {
      const response = await fetch("/api/app/activation/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: fullCode, deviceName: "MoPlayer TV" }),
      });
      const payload = (await response.json().catch(() => null)) as { status?: string } | null;
      if (response.ok && payload?.status === "activated") setStatus("activated");
      else if (payload?.status === "expired") setStatus("expired");
      else if (payload?.status === "invalid") setStatus("invalid");
      else setStatus("backend");
    } catch {
      setStatus("backend");
    } finally {
      setChecking(false);
    }
  }

  function sourcePayload() {
    if (sourceType === "xtream") return { type: "xtream", name: sourceName, serverUrl, username, password };
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
        body: JSON.stringify({ code: fullCode, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setSourceState(response.ok && payload?.ok ? "ok" : "error");
      setSourceMessage(payload?.message || (response.ok ? t.successTest : t.failureTest));
    } catch {
      setSourceState("error");
      setSourceMessage(t.unavailableTest);
    }
  }

  async function sendSource() {
    if (status !== "activated") return;
    setSourceState("sending");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: fullCode, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (response.ok && payload?.ok) {
        setSourceState("sent");
        setSourceMessage(payload?.message || t.successSend);
        setPassword("");
      } else {
        setSourceState("error");
        setSourceMessage(payload?.message || t.failureSend);
      }
    } catch {
      setSourceState("error");
      setSourceMessage(t.unavailableSend);
    }
  }

  const StatusIcon = statusMeta.icon;
  const steps = [t.productStep, t.loginStep, t.codeStep];

  return (
    <main className="activation-lux" dir={isAr ? "rtl" : "ltr"}>
      <div className="activation-aura" aria-hidden />
      <section className="activation-hero">
        <div className="activation-copy">
          <Link href={withLocale(locale, "apps")} className="activation-back">
            <ChevronRight className="h-4 w-4" />
            {t.backApps}
          </Link>
          <span className="activation-kicker">
            <Sparkles className="h-4 w-4" />
            {t.kicker}
          </span>
          <h1>{t.title}</h1>
          <p>{t.body}</p>
          <div className="activation-trust">
            <span>
              <ShieldCheck className="h-4 w-4" />
              {t.privacy}
            </span>
            <span>
              <QrCode className="h-4 w-4" />
              {t.codeHint}
            </span>
          </div>
        </div>

        <div className="activation-device">
          <Image src="/images/moplayer-hero-3d-final.png" alt="MoPlayer Android TV activation" width={820} height={620} priority />
          <div className="activation-code-chip">
            <KeyRound className="h-4 w-4" />
            {fullCode || "MO-XXXX"}
          </div>
        </div>
      </section>

      <section className="activation-wizard">
        <div className="activation-stepper">
          {steps.map((step, index) => {
            const current = (index + 1) as WizardStep;
            return (
              <button
                key={step}
                type="button"
                onClick={() => setWizardStep(current)}
                className={cn("activation-step", wizardStep === current && "is-active", wizardStep > current && "is-done")}
              >
                <span>{index + 1}</span>
                {step}
              </button>
            );
          })}
        </div>

        <div className="activation-panel">
          <AnimatePresence mode="wait">
            {wizardStep === 1 ? (
              <motion.div key="product" initial={{ opacity: 0, x: isAr ? -28 : 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isAr ? 28 : -28 }} transition={{ duration: 0.28 }}>
                <div className="activation-product-card">
                  <div className="activation-product-visual">
                    <Image src="/images/moplayer-icon-512.png" alt="" width={88} height={88} />
                    <PlayCircle className="h-10 w-10" />
                  </div>
                  <div>
                    <span>Android TV</span>
                    <h2>{t.productTitle}</h2>
                    <p>{t.productBody}</p>
                  </div>
                  <button type="button" onClick={() => setWizardStep(2)} className="activation-button activation-button-primary">
                    {t.continue}
                  </button>
                </div>
              </motion.div>
            ) : null}

            {wizardStep === 2 ? (
              <motion.div key="login" initial={{ opacity: 0, x: isAr ? -28 : 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isAr ? 28 : -28 }} transition={{ duration: 0.28 }}>
                <div className="activation-login-grid">
                  <div>
                    <span className="activation-kicker">
                      <UserRound className="h-4 w-4" />
                      {t.loginStep}
                    </span>
                    <h2>{t.welcome}</h2>
                    <p>{t.loginBody}</p>
                  </div>
                  <div className="activation-login-form">
                    <button type="button" onClick={() => setWizardStep(3)} className="activation-social">
                      <Mail className="h-4 w-4" />
                      {t.google}
                    </button>
                    <button type="button" onClick={() => setWizardStep(3)} className="activation-social">
                      <Apple className="h-4 w-4" />
                      {t.apple}
                    </button>
                    <label>
                      <span>{t.emailLabel}</span>
                      <input value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder={t.emailPlaceholder} type="email" />
                    </label>
                    <button type="button" onClick={() => setWizardStep(3)} className="activation-button activation-button-primary">
                      {accountEmail ? t.emailContinue : t.skip}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {wizardStep === 3 ? (
              <motion.div key="code" initial={{ opacity: 0, x: isAr ? -28 : 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isAr ? 28 : -28 }} transition={{ duration: 0.28 }}>
                <div className="activation-code-grid">
                  <div className="activation-code-entry">
                    <div className="activation-code-preview">MO-{code || "XXXX"}</div>
                    <label>
                      <span>{t.codeLabel}</span>
                      <input value={code} maxLength={4} onChange={(event) => setCode(normalizeCode(event.target.value))} placeholder="4C7K" />
                    </label>
                    <button type="button" onClick={checkCode} disabled={checking || code.length < 4} className="activation-button activation-button-primary">
                      {checking ? t.checking : t.check}
                    </button>
                  </div>

                  <div className={cn("activation-status", statusMeta.tone)}>
                    {status === "activated" ? <div className="activation-confetti" aria-hidden>{Array.from({ length: 12 }).map((_, index) => <i key={index} />)}</div> : null}
                    <StatusIcon className="h-7 w-7" />
                    <h3>{status === "activated" ? t.success : statusMeta.data[0]}</h3>
                    <p>{statusMeta.data[1]}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCode("");
                        setStatus("waiting");
                        setSourceState("idle");
                        setSourceMessage("");
                      }}
                      className="activation-reset"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </section>

      <section className={cn("activation-source", status !== "activated" && "is-locked")}>
        <div>
          <span className="activation-kicker">
            <Tv className="h-4 w-4" />
            {t.sourceTitle}
          </span>
          <h2>{t.sourceTitle}</h2>
          <p>{t.sourceBody}</p>
        </div>

        <div className="activation-source-form">
          <div className="activation-segments">
            <button type="button" onClick={() => setSourceType("xtream")} className={cn(sourceType === "xtream" && "is-active")}>{t.xtream}</button>
            <button type="button" onClick={() => setSourceType("m3u")} className={cn(sourceType === "m3u" && "is-active")}>{t.m3u}</button>
          </div>

          <div className="activation-fields">
            <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder={t.sourceName} disabled={status !== "activated"} />
            {sourceType === "xtream" ? (
              <>
                <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} placeholder={t.serverUrl} disabled={status !== "activated"} />
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t.username} disabled={status !== "activated"} />
                <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.password} type="password" disabled={status !== "activated"} />
              </>
            ) : (
              <>
                <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} placeholder={t.playlistUrl} disabled={status !== "activated"} />
                <input value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} placeholder={t.epgUrl} disabled={status !== "activated"} />
              </>
            )}
          </div>

          <div className="activation-source-actions">
            <button type="button" onClick={testSource} disabled={status !== "activated" || sourceState === "testing"} className="activation-button">
              {sourceState === "testing" ? t.testing : t.test}
            </button>
            <button type="button" onClick={sendSource} disabled={status !== "activated" || sourceState === "sending"} className="activation-button activation-button-primary">
              {sourceState === "sending" ? t.sending : t.send}
            </button>
          </div>

          {sourceMessage ? (
            <div className={cn("activation-source-message", sourceState === "ok" || sourceState === "sent" ? "is-success" : "is-error")}>
              {sourceMessage}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
