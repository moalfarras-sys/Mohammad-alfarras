"use client";

import { motion } from "framer-motion";
import { Mail, MessageCircle, Clock, Send, ArrowUpRight } from "lucide-react";

import { LiquidContactForm } from "@/components/site/liquid-contact-form";
import type { SiteViewModel } from "@/components/site/site-view-model";

const inView = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const copy = {
  en: {
    eyebrow: "Start a conversation",
    title: "Tell me what you need to build.",
    body: "Send the project as it is — I'll map the goal, constraints, and the clearest path forward.",
    email: "Send email",
    whatsapp: "WhatsApp direct",
    availTitle: "Availability",
    avail: [
      { l: "Days", v: "Sat – Thu" },
      { l: "Timezone", v: "Germany · CET/CEST" },
      { l: "Response", v: "Within 24 h" },
      { l: "Location", v: "Germany 🇩🇪" },
    ],
    flowTitle: "How it works",
    flow: [
      "Send your message — project, idea, or question.",
      "I review and reply with honest strategic direction.",
      "We align on scope, timeline, and what actually matters.",
    ],
    channelsTitle: "Direct channels",
  },
  ar: {
    eyebrow: "ابدأ محادثة",
    title: "أخبرني بما تريد بناءه.",
    body: "أرسل المشروع كما هو — سأرتّب الهدف والقيود وأوضح مسار التنفيذ.",
    email: "إرسال بريد",
    whatsapp: "واتساب مباشر",
    availTitle: "التوفر",
    avail: [
      { l: "أيام العمل", v: "السبت – الخميس" },
      { l: "التوقيت", v: "ألمانيا · CET/CEST" },
      { l: "وقت الرد", v: "خلال 24 ساعة" },
      { l: "الموقع", v: "ألمانيا 🇩🇪" },
    ],
    flowTitle: "كيف يعمل",
    flow: [
      "أرسل رسالتك — المشروع أو الفكرة أو السؤال.",
      "أراجع وأردّ بتوجيه استراتيجي صادق.",
      "نتفق على النطاق والجدول الزمني وما يهم فعلاً.",
    ],
    channelsTitle: "قنوات مباشرة",
  },
} as const;

export function ContactPageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const isAr = model.locale === "ar";
  const email = model.contact.emailAddress;
  const whatsapp = model.contact.whatsappUrl;

  return (
    <div className="relative pb-32 pt-28" dir={isAr ? "rtl" : "ltr"} data-testid="contact-page">
      {/* Bg */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-[var(--os-teal)] opacity-[0.05] blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--os-violet)] opacity-[0.04] blur-[100px]" />
      </div>

      {/* Hero */}
      <section className="section-frame mb-16 relative z-10">
        <motion.span {...inView(0)} className="eyebrow mb-5 inline-flex">{t.eyebrow}</motion.span>
        <motion.h1 {...inView(0.06)} className="headline-display text-[clamp(2.2rem,5vw,4.5rem)] font-bold text-white max-w-2xl">
          {t.title}
        </motion.h1>
        <motion.p {...inView(0.12)} className="mt-5 max-w-xl text-[16px] leading-relaxed text-[var(--os-text-2)]">
          {t.body}
        </motion.p>
        <motion.div {...inView(0.18)} className="mt-8 flex flex-wrap gap-4">
          <a href={`mailto:${email}`} className="btn-primary">
            <Mail className="h-4 w-4" /> {t.email}
          </a>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer"
            className="btn-secondary gap-2"
          >
            <MessageCircle className="h-4 w-4 text-emerald-400" /> {t.whatsapp}
          </a>
        </motion.div>
      </section>

      {/* Main grid: Form + Sidebar */}
      <section className="section-frame relative z-10">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">

          {/* Form */}
          <motion.div {...inView(0)} className="glass-card p-8 md:p-12">
            <h2 className="text-[1.3rem] font-bold text-white mb-2">
              {isAr ? "تفاصيل الطلب" : "Inquiry details"}
            </h2>
            <p className="text-[13px] text-[var(--os-text-3)] mb-8">
              {isAr ? "كن واضحاً قدر الإمكان — هذا يساعد في التشخيص." : "The more clarity you provide, the better the response."}
            </p>
            <LiquidContactForm locale={model.locale} />
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Availability */}
            <motion.div {...inView(0.06)} className="glass-card p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--os-teal-border)] bg-[var(--os-teal-soft)] text-[var(--os-teal)]">
                  <Clock className="h-4 w-4" />
                </div>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-widest">{t.availTitle}</h3>
              </div>
              <div className="space-y-4">
                {t.avail.map((row) => (
                  <div key={row.l} className="flex items-center justify-between border-b border-[var(--os-border)] pb-3 last:border-0 last:pb-0">
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--os-text-3)]">{row.l}</span>
                    <span className="text-[13px] font-bold text-white">{row.v}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Flow */}
            <motion.div {...inView(0.1)} className="glass-card p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--os-violet)]/30 bg-[var(--os-violet)]/10 text-[var(--os-violet)]">
                  <Send className="h-4 w-4" />
                </div>
                <h3 className="text-[13px] font-bold text-white uppercase tracking-widest">{t.flowTitle}</h3>
              </div>
              <div className="relative space-y-6 pl-8">
                <div className="absolute left-3.5 top-1 bottom-1 w-px bg-[var(--os-border)]" />
                {t.flow.map((step, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-8 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--os-violet)] text-[9px] font-bold text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]">
                      {i + 1}
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--os-text-2)]">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Channels */}
            <motion.div {...inView(0.14)} className="glass-card p-7">
              <h3 className="text-[13px] font-bold uppercase tracking-widest text-[var(--os-text-3)] mb-5">{t.channelsTitle}</h3>
              <div className="space-y-3">
                {model.contact.channels.slice(0, 3).map((ch) => (
                  <a
                    key={ch.id}
                    href={ch.value}
                    target={ch.value.startsWith("http") ? "_blank" : undefined}
                    className="flex items-center justify-between rounded-xl border border-[var(--os-border)] bg-white/[0.02] p-4 transition hover:border-[var(--os-teal-border)] hover:bg-[var(--os-teal-soft)]"
                  >
                    <div>
                      <p className="text-[12px] font-bold text-white">{ch.label}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--os-text-3)] truncate max-w-[180px]">{ch.description}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[var(--os-text-3)]" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
