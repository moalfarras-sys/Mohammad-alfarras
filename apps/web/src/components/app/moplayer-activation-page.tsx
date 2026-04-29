"use client";

import { CheckCircle2, Clock3, QrCode, RefreshCcw, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { Locale } from "@/types/cms";

const allowed = /^[A-HJ-NP-RT-Z2-46789]{4}$/;

const copy = {
  en: {
    kicker: "MoPlayer activation",
    title: "Pair your TV first, then send the source in one clean flow.",
    body:
      "Enter the short code shown inside MoPlayer on Android TV. After pairing, you can send an Xtream or M3U source securely through the website without exposing provider details on the public page.",
    codeLabel: "Activation code",
    check: "Check code",
    checking: "Checking...",
    testing: "Testing...",
    sending: "Sending...",
    steps: [
      "Open MoPlayer on Android TV",
      "Choose website activation",
      "Enter the code here",
      "Send the source securely",
    ],
    waiting: ["Waiting for code", "Enter the four-character code shown on TV to continue."],
    invalid: ["Invalid code", "Use exactly four valid characters. Ambiguous characters are not accepted."],
    activated: ["TV paired", "The device is linked. You can now send the IPTV source to the app."],
    expired: ["Code expired", "Codes are short-lived. Generate a fresh one on the TV and try again."],
    backend: ["Connection issue", "The activation service did not respond correctly. Try again in a moment."],
    sourceTitle: "Source setup",
    sourceBody: "Choose the provider type, test the connection, then send the source directly to the app.",
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
    privacy: "Only the app receives the source. The public page never displays provider credentials.",
    successTest: "Connection test successful.",
    failureTest: "Connection test failed.",
    unavailableTest: "Could not test the source right now.",
    successSend: "Source sent to the app. Import will begin automatically.",
    failureSend: "Could not send the source.",
    unavailableSend: "Could not send the source right now.",
    codeHint: "The code always starts with MO- inside the app.",
  },
  ar: {
    kicker: "تفعيل MoPlayer",
    title: "اربط التلفزيون أولاً، ثم أرسل المصدر بخطوات واضحة وسريعة.",
    body:
      "أدخل الكود القصير الظاهر داخل MoPlayer على Android TV. بعد نجاح الربط يمكنك إرسال مصدر Xtream أو M3U من الموقع بشكل آمن، من دون إظهار بيانات المزود على الصفحة العامة.",
    codeLabel: "كود التفعيل",
    check: "فحص الكود",
    checking: "جارٍ الفحص...",
    testing: "جارٍ الاختبار...",
    sending: "جارٍ الإرسال...",
    steps: [
      "افتح MoPlayer على التلفزيون",
      "اختر التفعيل عبر الموقع",
      "أدخل الكود هنا",
      "أرسل المصدر بأمان",
    ],
    waiting: ["بانتظار الكود", "أدخل الكود المكوّن من أربع خانات كما يظهر على شاشة التلفزيون."],
    invalid: ["الكود غير صحيح", "استخدم أربع خانات صحيحة فقط. الأحرف والأرقام المربكة غير مقبولة."],
    activated: ["تم الربط", "تم ربط الجهاز. يمكنك الآن إرسال مصدر IPTV إلى التطبيق."],
    expired: ["انتهت صلاحية الكود", "الكود صالح لفترة قصيرة. أنشئ كوداً جديداً من التلفزيون ثم حاول مرة أخرى."],
    backend: ["مشكلة اتصال", "خدمة التفعيل لم تستجب بشكل صحيح. حاول مرة أخرى بعد قليل."],
    sourceTitle: "إعداد المصدر",
    sourceBody: "اختر نوع المزود، اختبر الاتصال، ثم أرسل المصدر مباشرة إلى التطبيق.",
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
    privacy: "المصدر يصل إلى التطبيق فقط. الصفحة العامة لا تعرض بيانات مزود الخدمة.",
    successTest: "تم اختبار الاتصال بنجاح.",
    failureTest: "فشل اختبار الاتصال.",
    unavailableTest: "تعذر اختبار المصدر حالياً.",
    successSend: "تم إرسال المصدر إلى التطبيق. سيبدأ الاستيراد تلقائياً.",
    failureSend: "تعذر إرسال المصدر.",
    unavailableSend: "تعذر إرسال المصدر حالياً.",
    codeHint: "الكود يظهر داخل التطبيق بصيغة تبدأ دائماً بـ MO-.",
  },
} as const;

type Status = "waiting" | "invalid" | "activated" | "expired" | "backend";
type SourceType = "xtream" | "m3u";
type SourceState = "idle" | "testing" | "ok" | "sending" | "sent" | "error";

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
  const t = repairMojibakeDeep(copy[locale]);
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
    if (status === "invalid") return { icon: XCircle, tone: "text-[var(--danger)]", data: t.invalid };
    if (status === "activated") return { icon: CheckCircle2, tone: "text-[var(--brand-blue)]", data: t.activated };
    if (status === "expired") return { icon: Clock3, tone: "text-[var(--gold)]", data: t.expired };
    if (status === "backend") return { icon: XCircle, tone: "text-[var(--danger)]", data: t.backend };
    return { icon: Clock3, tone: "text-[var(--brand-blue)]", data: t.waiting };
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
      if (response.ok && payload?.status === "activated") {
        setStatus("activated");
      } else if (payload?.status === "expired") {
        setStatus("expired");
      } else if (payload?.status === "invalid") {
        setStatus("invalid");
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

  return (
    <main className="fresh-page" dir={isAr ? "rtl" : "ltr"}>
      <section className="fresh-hero">
        <div className="fresh-hero-copy">
          <div>
            <div>
              <p className="fresh-eyebrow">{t.kicker}</p>
              <h1>{t.title}</h1>
              <p>{t.body}</p>

              <div className="fresh-list">
                {t.steps.map((step, index) => (
                  <div key={step}>
                    <span>0{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>

              <div className="fresh-note-stack">
                <div className="fresh-note">
                  <ShieldCheck className="h-4 w-4" />
                  {t.privacy}
                </div>
                <div className="fresh-note">
                  <QrCode className="h-4 w-4" />
                  {t.codeHint}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="fresh-form">
            <div className="grid gap-5">
              <div className="fresh-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="fresh-mini-icon">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="fresh-eyebrow">MO code</p>
                      <p>MO-{code || "----"}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCode("");
                      setStatus("waiting");
                      setSourceState("idle");
                      setSourceMessage("");
                    }}
                    className="fresh-icon-button"
                    aria-label="Reset code"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>

                <label className="mt-6 block">
                  <span className="fresh-field-label">{t.codeLabel}</span>
                  <input
                    value={code}
                    maxLength={4}
                    onChange={(event) => setCode(normalizeCode(event.target.value))}
                    placeholder="4C7K"
                    className="fresh-input fresh-code-input"
                  />
                </label>

                <button type="button" onClick={checkCode} disabled={checking || code.length < 4} className="fresh-button fresh-button-primary mt-5 w-full">
                  {checking ? t.checking : t.check}
                </button>

                <div className="fresh-note mt-5">
                  <div className={cn("flex items-center gap-3 text-sm font-black", statusMeta.tone)}>
                    <StatusIcon className="h-4 w-4" />
                    {statusMeta.data[0]}
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-2)]">{statusMeta.data[1]}</p>
                </div>
              </div>

              <div className={cn("fresh-card", status !== "activated" && "opacity-60")}>
                <p className="fresh-eyebrow">{t.sourceTitle}</p>
                <p>{t.sourceBody}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSourceType("xtream")}
                    className={cn(
                      "fresh-segment",
                      sourceType === "xtream" && "fresh-segment-active",
                    )}
                  >
                    {t.xtream}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType("m3u")}
                    className={cn(
                      "fresh-segment",
                      sourceType === "m3u" && "fresh-segment-active",
                    )}
                  >
                    {t.m3u}
                  </button>
                </div>

                <div className="mt-5 grid gap-4">
                  <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder={t.sourceName} className="fresh-input" disabled={status !== "activated"} />
                  {sourceType === "xtream" ? (
                    <>
                      <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} placeholder={t.serverUrl} className="fresh-input" disabled={status !== "activated"} />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={t.username} className="fresh-input" disabled={status !== "activated"} />
                        <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.password} type="password" className="fresh-input" disabled={status !== "activated"} />
                      </div>
                    </>
                  ) : (
                    <>
                      <input value={playlistUrl} onChange={(event) => setPlaylistUrl(event.target.value)} placeholder={t.playlistUrl} className="fresh-input" disabled={status !== "activated"} />
                      <input value={epgUrl} onChange={(event) => setEpgUrl(event.target.value)} placeholder={t.epgUrl} className="fresh-input" disabled={status !== "activated"} />
                    </>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button type="button" onClick={testSource} disabled={status !== "activated" || sourceState === "testing"} className="fresh-button">
                    {sourceState === "testing" ? t.testing : t.test}
                  </button>
                  <button type="button" onClick={sendSource} disabled={status !== "activated" || sourceState === "sending"} className="fresh-button fresh-button-primary">
                    {sourceState === "sending" ? t.sending : t.send}
                  </button>
                </div>

                {sourceMessage ? (
                  <div
                    className={cn(
                      "mt-5 rounded-[1.2rem] border p-4 text-sm leading-7",
                      sourceState === "ok" || sourceState === "sent"
                        ? "border-blue-400/25 bg-blue-500/10 text-blue-100"
                        : "border-red-500/20 bg-red-500/10 text-red-100",
                    )}
                  >
                    {sourceMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
      </section>
    </main>
  );
}
