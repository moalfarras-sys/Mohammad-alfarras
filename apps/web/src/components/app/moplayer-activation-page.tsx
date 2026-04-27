"use client";

import { CheckCircle2, Clock3, KeyRound, QrCode, ShieldCheck, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { activationVisualCopy } from "@/content/visual-redesign";
import type { Locale } from "@/types/cms";

const ALLOWED_CODE_PATTERN = /^[A-HJ-NP-RT-Z2-46789]{4}$/;

const copy = {
  en: {
    eyebrow: "MoPlayer device pairing",
    title: "Activate your TV from the web.",
    body: "Enter the 4-character code shown in MoPlayer. The app creates a private public device ID and never uses the real MAC address.",
    codeLabel: "Device code",
    placeholder: "4C7K",
    prefix: "MO-",
    check: "Check code",
    waiting: "Waiting",
    invalid: "Invalid code",
    activated: "Activated",
    backendError: "Backend error",
    expired: "Expired",
    waitingBody: "Open MoPlayer on Android TV, choose Activate via website, then type the 4 characters here.",
    invalidBody: "Use exactly 4 allowed characters. Confusing characters O, 0, I, 1, S, and 5 are not accepted.",
    activatedBody: "This MoPlayer screen is now activated. Return to the TV and it will continue automatically.",
    backendErrorBody: "The activation service did not respond correctly. Try again in a moment.",
    expiredBody: "Codes are short-lived. Generate a fresh code from MoPlayer after 15 minutes.",
    privacy: "Provider credentials are not handled on this page.",
    steps: [
      "Open MoPlayer on TV",
      "Choose Activate via website",
      "Scan the QR or enter 4 characters",
      "Backend approval connects license/profile",
    ],
  },
  ar: {
    eyebrow: "ربط جهاز MoPlayer",
    title: "فعّل شاشة التلفزيون من الموقع.",
    body: "أدخل الكود المكوّن من 4 خانات الظاهر داخل MoPlayer. التطبيق ينشئ معرف جهاز خاص ولا يستخدم عنوان MAC الحقيقي.",
    codeLabel: "كود الجهاز",
    placeholder: "4C7K",
    prefix: "MO-",
    check: "فحص الكود",
    waiting: "بانتظار الكود",
    invalid: "الكود غير صحيح",
    activated: "تم التفعيل",
    backendError: "خطأ في الخلفية",
    expired: "انتهت الصلاحية",
    waitingBody: "افتح MoPlayer على Android TV، اختر التفعيل عبر الموقع، ثم اكتب 4 خانات هنا.",
    invalidBody: "استخدم 4 خانات فقط. الأحرف المربكة O و0 وI و1 وS و5 غير مقبولة.",
    activatedBody: "تم تفعيل شاشة MoPlayer. ارجع إلى التلفزيون وسيكمل التطبيق تلقائيًا.",
    backendErrorBody: "خدمة التفعيل لم ترد بشكل صحيح. حاول مرة أخرى بعد لحظات.",
    expiredBody: "الكود قصير المدة. أنشئ كودًا جديدًا من MoPlayer بعد 15 دقيقة.",
    privacy: "لا يتم إدخال أو تخزين بيانات مزود IPTV في هذه الصفحة.",
    steps: [
      "افتح MoPlayer على التلفزيون",
      "اختر التفعيل عبر الموقع",
      "امسح QR أو أدخل 4 خانات",
      "الخلفية تربط الترخيص والملف",
    ],
  },
} as const;

void copy;

type Status = "waiting" | "invalid" | "activated" | "expired" | "backendError";
type SourceType = "xtream" | "m3u";
type SourceStatus = "idle" | "testing" | "testOk" | "saving" | "sent" | "error";

function normalizeActivationInput(value: string) {
  return value
    .toUpperCase()
    .replace(/^MO-?/, "")
    .replace(/[^A-Z2-9]/g, "")
    .replace(/[O0I1S5]/g, "")
    .slice(0, 4);
}

export function MoPlayerActivationPage({
  locale,
  initialCode = "",
}: {
  locale: Locale;
  initialCode?: string;
}) {
  const isAr = locale === "ar";
  const t = activationVisualCopy[locale];
  const [code, setCode] = useState(() => normalizeActivationInput(initialCode));
  const [status, setStatus] = useState<Status>("waiting");
  const [activeStep, setActiveStep] = useState<"activate" | "setup">("activate");
  const [isChecking, setIsChecking] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("xtream");
  const [sourceStatus, setSourceStatus] = useState<SourceStatus>("idle");
  const [sourceMessage, setSourceMessage] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [epgUrl, setEpgUrl] = useState("");

  const fullCode = `MO-${code}`;
  const activationLink = code.length === 4 ? `moalfarras.space/activate?code=${fullCode}` : "moalfarras.space/activate";
  const statusCopy = useMemo(() => {
    if (status === "invalid") return { title: t.invalid, body: t.invalidBody, icon: XCircle };
    if (status === "activated") return { title: t.activated, body: t.activatedBody, icon: CheckCircle2 };
    if (status === "expired") return { title: t.expired, body: t.expiredBody, icon: Clock3 };
    if (status === "backendError") return { title: t.backendError, body: t.backendErrorBody, icon: XCircle };
    return { title: t.waiting, body: t.waitingBody, icon: Clock3 };
  }, [status, t]);

  async function checkCode() {
    if (!ALLOWED_CODE_PATTERN.test(code)) {
      setStatus("invalid");
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch("/api/app/activation/confirm", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: fullCode, deviceName: "MoPlayer TV" }),
      });
      const payload = (await response.json().catch(() => null)) as { status?: Status } | null;
      if (response.ok && payload?.status === "activated") {
        setStatus("activated");
        setTimeout(() => setActiveStep("setup"), 1500);
      } else if (payload?.status === "expired") {
        setStatus("expired");
      } else if (payload?.status === "invalid") {
        setStatus("invalid");
      } else {
        setStatus("backendError");
      }
    } catch {
      setStatus("backendError");
    } finally {
      setIsChecking(false);
    }
  }

  function sourcePayload() {
    if (sourceType === "xtream") {
      return {
        type: "xtream",
        name: sourceName,
        serverUrl,
        username,
        password,
      };
    }
    return {
      type: "m3u",
      name: sourceName,
      playlistUrl,
      epgUrl,
    };
  }

  async function testSource() {
    if (status !== "activated") return;
    setSourceStatus("testing");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: fullCode, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setSourceMessage(payload?.message || (response.ok ? "Connection works." : "Connection test failed."));
      setSourceStatus(response.ok && payload?.ok ? "testOk" : "error");
    } catch {
      setSourceMessage(isAr ? "تعذر فحص الاتصال." : "Could not test connection.");
      setSourceStatus("error");
    }
  }

  async function saveSource() {
    if (status !== "activated") return;
    setSourceStatus("saving");
    setSourceMessage("");
    try {
      const response = await fetch("/api/app/activation/source", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: fullCode, source: sourcePayload() }),
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (response.ok && payload?.ok) {
        setSourceStatus("sent");
        setSourceMessage(
          isAr
            ? "تم إرسال المصدر إلى التلفزيون. سيبدأ MoPlayer الاستيراد تلقائيًا."
            : "Source sent to the TV. MoPlayer will start importing automatically.",
        );
        setPassword("");
      } else {
        setSourceStatus("error");
        setSourceMessage(payload?.message || (isAr ? "تعذر حفظ المصدر." : "Could not save source."));
      }
    } catch {
      setSourceStatus("error");
      setSourceMessage(isAr ? "تعذر حفظ المصدر الآن." : "Could not save source right now.");
    }
  }

  const StatusIcon = statusCopy.icon;

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <section className="relative px-5 py-20 sm:px-8 lg:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,229,255,.22),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(99,102,241,.28),transparent_34%),linear-gradient(180deg,#020617,#050816_48%,#020617)]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.08fr_.92fr] lg:items-center">
          <div className={isAr ? "text-right" : "text-left"}>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">{t.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-[-0.02em] sm:text-6xl">
              {t.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">{t.body}</p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {t.steps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/[.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,.35)] backdrop-blur-xl"
                >
                  <span className="text-xs font-bold text-cyan-200">0{index + 1}</span>
                  <p className="mt-2 text-sm font-semibold text-white">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/15 bg-white/[.08] p-5 shadow-[0_34px_120px_rgba(0,0,0,.45)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t.codeLabel}</p>
                <p className="text-xs text-slate-400">{activationLink}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center rounded-3xl border border-cyan-200/30 bg-slate-950 p-8">
              <QrCode className="h-28 w-28 text-cyan-200" />
            </div>

            {activeStep === "activate" ? (
              <>
                <label className="mt-6 block text-sm font-semibold text-slate-300" htmlFor="device-code">
                  {t.codeLabel}
                </label>
                <div className="mt-2 flex h-14 overflow-hidden rounded-2xl border border-white/15 bg-slate-950 focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-300/15">
                  <span className="inline-flex items-center border-e border-white/10 px-4 font-mono text-lg font-black tracking-[0.12em] text-cyan-200">
                    {t.prefix}
                  </span>
                  <input
                    id="device-code"
                    value={code}
                    maxLength={4}
                    onChange={(event) => setCode(normalizeActivationInput(event.target.value))}
                    placeholder={t.placeholder}
                    dir="ltr"
                    inputMode="text"
                    autoComplete="one-time-code"
                    className="h-full min-w-0 flex-1 bg-transparent px-4 font-mono text-lg font-bold uppercase tracking-[0.18em] text-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={checkCode}
                  disabled={isChecking}
                  className="mt-4 inline-flex h-14 w-full items-center justify-center rounded-2xl bg-cyan-300 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-4 focus:ring-cyan-300/30"
                >
                  {isChecking ? "..." : t.check}
                </button>

                <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="h-5 w-5 text-cyan-200" />
                    <strong>{statusCopy.title}</strong>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{statusCopy.body}</p>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 space-y-6"
              >
                <div className="rounded-3xl border border-cyan-200/20 bg-slate-950/65 p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black text-white">
                        {isAr ? "الخطوة 2: أضف المصدر" : "Step 2: Add IPTV Source"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-400">
                        {isAr
                          ? "أدخل بيانات Xtream أو M3U لإرسالها مباشرة إلى جهازك."
                          : "Enter Xtream or M3U details to send directly to your TV."}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/5 p-1">
                      {(["xtream", "m3u"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setSourceType(type);
                            setSourceStatus("idle");
                            setSourceMessage("");
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
                            sourceType === type ? "bg-cyan-300 text-slate-950" : "text-slate-300 hover:bg-white/10"
                          }`}
                        >
                          {type === "xtream" ? "Xtream" : "M3U"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                        {isAr ? "اسم المصدر" : "Source Name"}
                      </label>
                      <input
                        value={sourceName}
                        onChange={(event) => setSourceName(event.target.value)}
                        placeholder={isAr ? "مثال: اشتراكي الخاص" : "e.g. My Private Source"}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm text-white outline-none focus:border-cyan-300 transition-colors"
                      />
                    </div>

                    {sourceType === "xtream" ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Server URL</label>
                          <input
                            value={serverUrl}
                            onChange={(event) => setServerUrl(event.target.value)}
                            placeholder="http://server.com:8080"
                            inputMode="url"
                            dir="ltr"
                            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm text-white outline-none focus:border-cyan-300 transition-colors"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Username</label>
                            <input
                              value={username}
                              onChange={(event) => setUsername(event.target.value)}
                              placeholder="user123"
                              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm text-white outline-none focus:border-cyan-300 transition-colors"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
                            <input
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder="••••••••"
                              type="password"
                              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm text-white outline-none focus:border-cyan-300 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">M3U URL</label>
                          <input
                            value={playlistUrl}
                            onChange={(event) => setPlaylistUrl(event.target.value)}
                            placeholder="http://server.com/list.m3u"
                            inputMode="url"
                            dir="ltr"
                            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm text-white outline-none focus:border-cyan-300 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-widest text-slate-500">EPG URL (Optional)</label>
                          <input
                            value={epgUrl}
                            onChange={(event) => setEpgUrl(event.target.value)}
                            placeholder="http://server.com/epg.xml"
                            inputMode="url"
                            dir="ltr"
                            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm text-white outline-none focus:border-cyan-300 transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={testSource}
                      disabled={sourceStatus === "testing" || sourceStatus === "saving"}
                      className="h-14 rounded-2xl border border-white/15 bg-white/[.07] px-6 text-sm font-black text-white transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                    >
                      {sourceStatus === "testing" ? "..." : isAr ? "فحص الاتصال" : "Test Connection"}
                    </button>
                    <button
                      type="button"
                      onClick={saveSource}
                      disabled={sourceStatus === "testing" || sourceStatus === "saving"}
                      className="h-14 rounded-2xl bg-cyan-300 px-6 text-sm font-black text-slate-950 transition hover:bg-cyan-200 shadow-[0_10px_30px_rgba(0,229,255,0.2)] focus:outline-none focus:ring-4 focus:ring-cyan-300/20"
                    >
                      {sourceStatus === "saving" ? "..." : isAr ? "إرسال للتلفزيون" : "Sync to Device"}
                    </button>
                  </div>

                  {sourceMessage ? (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 rounded-2xl border px-5 py-4 text-sm leading-7 ${
                        sourceStatus === "error"
                          ? "border-red-500/30 bg-red-500/10 text-red-200"
                          : "border-cyan-300/20 bg-cyan-300/10 text-cyan-50"
                      }`}
                    >
                      {sourceMessage}
                    </motion.p>
                  ) : null}
                </div>
                
                <button 
                  onClick={() => setActiveStep("activate")}
                  className="w-full text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-cyan-200 transition-colors"
                >
                  {isAr ? "← العودة لرمز التفعيل" : "← Back to Activation"}
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
