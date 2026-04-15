"use client";

import { motion, type Variants } from "framer-motion";
import { Clock, Mail, MessageCircleMore, Send, Sparkles, Zap } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useThemeMode } from "@/components/layout/use-theme-mode";

import { ContactForm } from "./contact-form";
import type { SiteViewModel } from "./site-view-client";

export function ContactProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale, t } = model;
  const { theme } = useThemeMode();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isLight = mounted && theme === "light";

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(12px)", scale: 0.95 },
    show: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { type: "spring", stiffness: 80, damping: 15 } },
  };

  const reasons = t.contact.reasons || [
    { title: "Project Inquiry", body: "Looking for high-end web dev." },
    { title: "Consulting", body: "Need logistics optimization." },
    { title: "Sponsorship", body: "YouTube channel partnership." },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden py-32 transition-opacity duration-500" style={{ opacity: mounted ? 1 : 0 }} dir={locale === "ar" ? "rtl" : "ltr"} data-testid="contact-page">
      {/* Background is handled by Global Atmospheric Engine */}

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ rotateX: -1.5, rotateY: 1.5 }}
          className="relative mb-16 overflow-hidden rounded-[3rem] border border-border/60 bg-surface/50 p-6 text-center md:p-14 shadow-2xl backdrop-blur-2xl perspective-[1200px]"
        >
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] bg-[radial-gradient(circle_at_center,rgba(0,255,135,0.16),transparent_58%)] opacity-70" />
          <div className="pointer-events-none absolute -left-12 top-3 h-48 w-48 rounded-full bg-[rgba(6,182,212,0.12)] blur-[120px]" />

          <div
            className="mb-8 inline-flex items-center gap-3 rounded-full border px-6 py-2 backdrop-blur-xl"
            style={{
              borderColor: "rgba(0,255,135,0.3)",
              boxShadow: "0 0 30px rgba(0,255,135,0.1)",
              background: isLight ? "rgba(255,255,255,0.82)" : "rgba(0,0,0,0.4)",
            }}
          >
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff87] opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-[#00ff87] drop-shadow-[0_0_8px_#00ff87]" />
            </span>
            <span className="font-mono text-sm font-bold uppercase tracking-widest" style={{ color: isLight ? "#0f172a" : "rgba(255,255,255,0.9)" }}>
              {locale === "ar" ? "متاح للمشاريع الجديدة" : "Available for New Projects"}
            </span>
          </div>

          <h1 className="headline-arabic text-5xl font-black leading-[1.05] tracking-tight md:text-7xl lg:text-8xl" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
            {locale === "ar" ? "ابدأ بفكرة." : "Start with an Idea."}
            <br />
            <span className="bg-gradient-to-r from-[#00ff87] to-[#06b6d4] bg-clip-text text-transparent">
              {locale === "ar" ? "سنبني الباقي." : "We'll Build the Rest."}
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg font-semibold leading-9 text-foreground-muted md:text-xl">
            {t.contact.body ||
              (locale === "ar"
                ? "إذا كنت تحتاج إلى واجهة أقوى، تحويل رقمي أو ربط تقني واضح وقابل للتنفيذ، فالمحادثة هنا تبدأ بسرعة وتنتهي بخطة عملية."
                : "If you need a sharper interface, a digital rebuild, or real product execution, this is where the conversation turns into an action plan.")}
          </p>
        </motion.section>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-6 lg:col-span-5">
            <motion.div variants={item} className="mb-10 flex w-full flex-col gap-4 sm:flex-row">
              <a
                href={model.contact.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-3 rounded-[2rem] py-5 font-black uppercase tracking-wider text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #00ff87, #00cc6e)", boxShadow: "0 0 40px rgba(0,255,135,0.2)" }}
              >
                <MessageCircleMore className="h-6 w-6" /> WhatsApp
              </a>
              <a
                href={`mailto:${model.contact.emailAddress}`}
                className="flex flex-1 items-center justify-center gap-3 rounded-[2rem] border py-5 font-bold tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  color: isLight ? "#0f172a" : "#ffffff",
                  background: isLight ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.05)",
                  borderColor: isLight ? "rgba(226,232,240,0.95)" : "rgba(255,255,255,0.1)",
                }}
              >
                <Mail className="h-5 w-5 opacity-70" /> Email
              </a>
            </motion.div>

            <motion.div variants={item} className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#ff6b00]" fill="currentColor" />
              <h3 className="text-2xl font-black" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                {locale === "ar" ? "متى تتواصل معي؟" : "What This Channel Is For"}
              </h3>
            </motion.div>

            <div className="space-y-4">
              {reasons.map((reason, i) => {
                const colors = ["#00ff87", "#ff6b00", "#a855f7", "#06b6d4"];
                const color = colors[i % 4];
                return (
                  <motion.div
                    key={`${reason.title}-${i}`}
                    variants={item}
                    whileHover={{ x: locale === "ar" ? -8 : 8, backgroundColor: "rgba(255,255,255,0.08)" }}
                    className="group relative overflow-hidden rounded-[2.2rem] border border-border/40 bg-surface/60 p-6 backdrop-blur-md shadow-sm transition-all"
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ boxShadow: `inset 0 0 0 1px ${color}55` }} />
                    <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-10 mix-blend-screen" style={{ background: color }} />

                    <div className="relative flex items-start gap-5">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black transition-transform group-hover:rotate-12"
                        style={{ background: `${color}15`, color, border: `1px solid ${color}33` }}
                      >
                        {`0${i + 1}`}
                      </div>
                      <div>
                        <p className="mb-2 text-xl font-bold" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                          {reason.title}
                        </p>
                        <p className="text-sm font-semibold leading-relaxed tracking-wide text-foreground-muted transition-colors group-hover:text-foreground-soft">
                          {reason.body}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              variants={item}
              className="relative mt-8 flex items-center gap-5 overflow-hidden rounded-[2rem] border p-6"
              style={{
                background: isLight ? "rgba(255,255,255,0.82)" : "rgba(168,85,247,0.05)",
                borderColor: isLight ? "rgba(226,232,240,0.95)" : "rgba(168,85,247,0.2)",
              }}
            >
              <Clock className="h-8 w-8 shrink-0 text-[#a855f7]" />
              <div>
                <p className="mb-1 text-base font-bold" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                  {t.contact.directTitle || (locale === "ar" ? "رد خلال 24 ساعة" : "24H Response SLA")}
                </p>
                <p className="text-sm text-foreground-muted">
                  {t.contact.directBody ||
                    (locale === "ar"
                      ? "كل رسالة أراجعها مباشرة ثم أعود بخطوة تنفيذية واضحة، لا برد عام."
                      : "Every message gets a direct review and a concrete next-step reply, not a generic response.")}
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div variants={item} className="lg:col-span-7">
            <div
              className="relative flex h-full flex-col justify-center overflow-hidden rounded-[3rem] border border-border/60 bg-surface/50 p-8 shadow-2xl md:p-12 backdrop-blur-2xl"
            >
              <div className="pointer-events-none absolute right-0 top-0 h-40 w-1/2 rounded-full bg-[#00ff87] opacity-[0.03] blur-[150px]" />

              <div className="mb-8">
                <h3 className="mb-2 flex items-center gap-3 text-3xl font-black" style={{ color: isLight ? "#0f172a" : "#ffffff" }}>
                  <Send className="h-6 w-6 text-[#00ff87]" />
                  {locale === "ar" ? "إرسال مباشر" : "Direct Transmission"}
                </h3>
                <p className="font-semibold text-foreground-muted">
                  {locale === "ar" ? "أرسل الفكرة، المتطلبات، أو الهدف التجاري وسأرتبها إلى اتجاه واضح." : "Send the idea, the requirements, or the business goal and I will turn it into a clear direction."}
                </p>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-3">
                {[
                  locale === "ar" ? "مواقع وتجارب" : "Web Experiences",
                  locale === "ar" ? "تطوير واجهات" : "Frontend Systems",
                  locale === "ar" ? "شراكات ومحتوى" : "Partnerships",
                ].map((pill) => (
                  <div
                    key={pill}
                    className="rounded-[1.4rem] border px-4 py-3 text-sm font-semibold"
                    style={{
                      background: isLight ? "rgba(248,250,252,0.85)" : "rgba(255,255,255,0.03)",
                      borderColor: isLight ? "rgba(226,232,240,0.92)" : "rgba(255,255,255,0.08)",
                      color: isLight ? "#334155" : "rgba(255,255,255,0.8)",
                    }}
                  >
                    <Sparkles className="mb-2 h-4 w-4 text-[var(--primary)]" />
                    {pill}
                  </div>
                ))}
              </div>

              <div className="contact-form-wrapper">
                <ContactForm locale={locale} whatsappUrl={model.contact.whatsappUrl} />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
