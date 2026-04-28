"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, QrCode, ShieldCheck, XCircle, RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/cn";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

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
  const t = repairMojibakeDeep(activationVisualCopy[locale]);
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
    if (status === "invalid") return { title: t.invalid, body: t.invalidBody, icon: XCircle, color: "text-red-400" };
    if (status === "activated") return { title: t.activated, body: t.activatedBody, icon: CheckCircle2, color: "text-emerald-400" };
    if (status === "expired") return { title: t.expired, body: t.expiredBody, icon: Clock3, color: "text-amber-400" };
    if (status === "backendError") return { title: t.backendError, body: t.backendErrorBody, icon: XCircle, color: "text-red-400" };
    return { title: t.waiting, body: t.waitingBody, icon: Clock3, color: "text-cyan-400" };
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
        setTimeout(() => setActiveStep("setup"), 1200);
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
      return { type: "xtream", name: sourceName, serverUrl, username, password };
    }
    return { type: "m3u", name: sourceName, playlistUrl, epgUrl };
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
      setSourceMessage(payload?.message || (response.ok ? (isAr ? "الاتصال يعمل بشكل صحيح." : "Connection works.") : (isAr ? "فشل اختبار الاتصال." : "Connection test failed.")));
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
        setSourceMessage(isAr ? "تم إرسال المصدر. سيبدأ MoPlayer الاستيراد تلقائيًا." : "Source sent. MoPlayer will start importing automatically.");
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
    <main className="min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-1)]">
      {/* Background Gradients */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        <div className="absolute inset-0 opacity-40" style={{ background: "var(--hero-home-gradient)" }} />
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <section className="relative z-10 px-6 py-20 md:py-32">
        <div className="section-frame max-w-6xl">
          <div className="grid items-start gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* ── LEFT SIDE: CONTENT & STEPS ── */}
            <div className={isAr ? "text-right" : "text-left"}>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[var(--accent)]">
                {t.eyebrow}
              </p>
              <h1 className="mt-6 text-[clamp(2.5rem,5vw,4.2rem)] font-black leading-[1.1] tracking-tight">
                {t.title}
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[var(--text-2)]">
                {t.body}
              </p>

              <div className="mt-12 grid gap-4 sm:grid-cols-2">
                {t.steps.map((step, idx) => (
                  <div key={step} className="glass group flex items-start gap-4 rounded-2xl p-5 border border-[var(--glass-border)] transition-all hover:border-[var(--accent-glow)]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[11px] font-black text-[var(--accent)]">
                      0{idx + 1}
                    </span>
                    <p className="text-sm font-bold leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 flex items-center gap-4 text-[11px] font-black uppercase tracking-widest text-[var(--text-2)] opacity-40">
                <ShieldCheck className="h-4 w-4" />
                {t.privacy}
              </div>
            </div>

            {/* ── RIGHT SIDE: CARD ── */}
            <div className="relative">
              {/* Outer Glow */}
              <div className="absolute -inset-4 bg-[var(--accent)] opacity-5 blur-[60px]" />
              
              <div className="glass relative overflow-hidden rounded-[2.5rem] border border-[var(--glass-border)] p-8 md:p-10" style={{ boxShadow: "var(--shadow-elevated)" }}>
                
                {/* Header within card */}
                <div className="mb-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent)]">Gateway</p>
                      <p className="text-sm font-bold text-[var(--text-1)]">{activationLink}</p>
                    </div>
                  </div>
                  {activeStep === "setup" && (
                     <button onClick={() => setActiveStep("activate")} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-[var(--text-2)] hover:bg-white/10 transition-colors">
                        <RefreshCcw className="h-4 w-4" />
                     </button>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  {activeStep === "activate" ? (
                    <motion.div
                      key="activate"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]" htmlFor="device-code">
                            {t.codeLabel}
                          </label>
                          <div className="flex h-16 overflow-hidden rounded-2xl border-2 border-[var(--glass-border)] bg-black/40 focus-within:border-[var(--accent)] transition-colors">
                            <div className="flex items-center border-r border-[var(--glass-border)] bg-white/5 px-5 font-mono text-xl font-black text-[var(--accent)]">
                              {t.prefix}
                            </div>
                            <input
                              id="device-code"
                              value={code}
                              maxLength={4}
                              onChange={(e) => setCode(normalizeActivationInput(e.target.value))}
                              placeholder={t.placeholder}
                              className="w-full bg-transparent px-5 font-mono text-xl font-bold uppercase tracking-[0.2em] outline-none placeholder:opacity-20"
                            />
                          </div>
                        </div>

                        <button
                          onClick={checkCode}
                          disabled={isChecking || code.length < 4}
                          className="button-liquid-primary w-full py-5 text-lg"
                        >
                          {isChecking ? "Checking..." : t.check}
                        </button>

                        <div className={cn("rounded-2xl border p-5 transition-colors", 
                          status === 'activated' ? 'border-emerald-500/20 bg-emerald-500/5' : 
                          status === 'invalid' || status === 'backendError' ? 'border-red-500/20 bg-red-500/5' : 
                          'border-[var(--glass-border)] bg-white/5'
                        )}>
                          <div className="flex items-center gap-3 font-bold">
                            <StatusIcon className={cn("h-5 w-5", statusCopy.color)} />
                            <span className={statusCopy.color}>{statusCopy.title}</span>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-[var(--text-2)]">
                            {statusCopy.body}
                          </p>
                          {status === "activated" && activeStep === "activate" && (
                            <button
                              type="button"
                              onClick={() => setActiveStep("setup")}
                              className="button-liquid-primary mt-6 w-full py-4 text-sm"
                            >
                              {isAr ? "المتابعة: إضافة مصدر Xtream أو M3U" : "Next: add Xtream or M3U source"}
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="setup"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xl font-black">{isAr ? "تجهيز المصدر" : "Source Setup"}</h2>
                          <div className="flex gap-2 rounded-xl bg-white/5 p-1">
                            {(["xtream", "m3u"] as const).map((type) => (
                              <button
                                key={type}
                                onClick={() => setSourceType(type)}
                                className={cn("rounded-lg px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all", 
                                  sourceType === type ? "bg-[var(--accent)] text-black" : "text-[var(--text-2)] hover:bg-white/10"
                                )}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">{isAr ? "اسم المصدر" : "Source Name"}</label>
                            <input
                              value={sourceName}
                              onChange={(e) => setSourceName(e.target.value)}
                              placeholder={isAr ? "اشتراكي الخاص" : "My Subscription"}
                              className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/40 px-4 text-sm outline-none focus:border-[var(--accent)] transition-colors"
                            />
                          </div>

                          {sourceType === "xtream" ? (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">Server URL</label>
                                <input value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="http://host:port" className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/40 px-4 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">User</label>
                                  <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="user" className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/40 px-4 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">Pass</label>
                                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••" className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/40 px-4 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">M3U URL</label>
                                <input value={playlistUrl} onChange={(e) => setPlaylistUrl(e.target.value)} placeholder="http://server.com/list.m3u" className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/40 px-4 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">EPG URL (Optional)</label>
                                <input value={epgUrl} onChange={(e) => setEpgUrl(e.target.value)} placeholder="http://server.com/epg.xml" className="h-12 w-full rounded-xl border border-[var(--glass-border)] bg-black/40 px-4 text-sm outline-none focus:border-[var(--accent)] transition-colors" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={testSource} disabled={sourceStatus === 'testing' || sourceStatus === 'saving'} className="button-liquid-secondary py-4 text-sm">
                            {sourceStatus === 'testing' ? "..." : (isAr ? "فحص" : "Test")}
                          </button>
                          <button onClick={saveSource} disabled={sourceStatus === 'testing' || sourceStatus === 'saving'} className="button-liquid-primary py-4 text-sm">
                            {sourceStatus === 'saving' ? "..." : (isAr ? "حفظ وإرسال" : "Save & Sync")}
                          </button>
                        </div>

                        {sourceMessage && (
                          <div className={cn("rounded-xl border px-4 py-3 text-xs font-bold leading-relaxed", 
                            sourceStatus === 'error' ? 'border-red-500/20 bg-red-500/5 text-red-300' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                          )}>
                            {sourceMessage}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
