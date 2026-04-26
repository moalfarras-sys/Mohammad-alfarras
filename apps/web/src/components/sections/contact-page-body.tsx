"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Send, Clock, Sparkles } from "lucide-react";

import { LiquidContactForm } from "@/components/site/liquid-contact-form";
import type { SiteViewModel } from "@/components/site/site-view-model";

const copy = {
  en: {
    eyebrow: "Contact",
    title: "Start with the real scope, constraints, and proof.",
    body:
      "Use this form for web presence, product surfaces, MoPlayer support, case studies, and bilingual Arabic/English execution. Based in Germany, working with a practical discovery-first rhythm.",
    email: "Email",
    whatsapp: "WhatsApp",
    availabilityTitle: "Current availability",
    availability: [
      { label: "Working days", value: "Saturday to Thursday" },
      { label: "Timezone", value: "Germany · CET/CEST" },
      { label: "Typical response", value: "Practical next step" },
      { label: "Location", value: "Germany" },
    ],
    stepsTitle: "What happens next",
    steps: [
      "I review your message and map the real goal behind the request.",
      "You get a short reply with what I understood and what I recommend first.",
      "If we're aligned, we move to a defined scope and a clear execution path.",
    ],
  },
  ar: {
    eyebrow: "تواصل",
    title: "ابدأ من النطاق الحقيقي، القيود، وما يجب إثباته.",
    body:
      "استخدم هذا النموذج لمواقع الويب، أسطح المنتجات، دعم MoPlayer، دراسات الحالة، والتنفيذ العربي/الإنجليزي. مقيم في ألمانيا وأتعامل مع الطلب بإيقاع عملي يبدأ من التشخيص.",
    email: "البريد",
    whatsapp: "واتساب",
    availabilityTitle: "التوفر الحالي",
    availability: [
      { label: "أيام العمل", value: "السبت إلى الخميس" },
      { label: "التوقيت", value: "ألمانيا · CET/CEST" },
      { label: "شكل الرد", value: "خطوة عملية واضحة" },
      { label: "الموقع", value: "ألمانيا" },
    ],
    stepsTitle: "بعد أن ترسل",
    steps: [
      "أراجع رسالتك وأحدد الهدف الحقيقي وراءها.",
      "أرسل لك رداً قصيراً يلخّص ما فهمته وما أقترحه أولاً.",
      "إذا كان هناك توافق، ننتقل إلى نطاق واضح ومسار تنفيذ محدد.",
    ],
  },
} as const;

export function ContactPageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const email = model.contact.emailAddress;
  const whatsapp = model.contact.whatsappUrl;
  const isAr = model.locale === "ar";
  const reduced = useReducedMotion();
  const heroImage = model.brandMedia.contactHero || model.brandMedia.gallery.tech || "/images/hero_tech.png";

  return (
    <div data-testid="contact-page">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 md:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[var(--bg-base)]" />
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 10%, rgba(99,102,241,0.08) 0%, transparent 60%)" }} />
        
        <div className="section-frame relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{t.eyebrow}</p>
              <h1 className="mt-4 overflow-visible pb-2 font-black leading-[1.1] text-[var(--text-1)]" style={{ fontSize: "clamp(2rem,4.5vw,3.8rem)" }}>
                {t.title}
              </h1>
              <p className="mt-5 text-[15px] leading-relaxed text-[var(--text-2)] md:text-lg">{t.body}</p>
              
              <div className="mt-8 flex flex-wrap gap-4">
                <a href={`mailto:${email}`} className="button-liquid-primary inline-flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {t.email}
                </a>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary inline-flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  {t.whatsapp}
                </a>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduced ? 0.2 : 0.8 }}
              className="relative aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[var(--radius-xl)]"
            >
              <div className="glass relative h-full w-full overflow-hidden" style={{ boxShadow: "var(--shadow-hero)" }}>
                <Image
                  src={heroImage}
                  alt="Contact"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 560px"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    {isAr ? "من الرسالة إلى التنفيذ" : "From message to execution"}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM & DETAILS ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Form */}
            <div className="glass rounded-[var(--radius-xl)] p-8 md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
              <LiquidContactForm locale={model.locale} />
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              
              <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
                    <Clock className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-1)" }}>{t.availabilityTitle}</h3>
                </div>
                <dl className="mt-6 space-y-4">
                  {t.availability.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 border-b border-[var(--glass-border)] pb-4 last:border-0 last:pb-0">
                      <dt className="text-sm font-medium" style={{ color: "var(--text-2)" }}>{row.label}</dt>
                      <dd className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
                    <MapPin className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-1)" }}>{isAr ? "قنوات التواصل" : "Direct channels"}</h3>
                </div>
                <ul className="mt-6 space-y-3">
                  {model.contact.channels.slice(0, 5).map((channel) => {
                    const external = channel.value.startsWith("http");
                    return (
                      <li key={channel.id}>
                        <a
                          href={channel.value}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--accent)]"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold" style={{ color: "var(--text-1)" }}>{channel.label}</div>
                            <div className="truncate text-xs mt-1" style={{ color: "var(--text-3)" }}>{channel.description}</div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" style={{ color: "var(--text-3)" }} />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-elevated)] border border-[var(--glass-border)]">
                    <Send className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "var(--text-1)" }}>{t.stepsTitle}</h3>
                </div>
                <ol className="mt-6 space-y-5">
                  {t.steps.map((step, idx) => (
                    <li key={step} className="flex items-start gap-4">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[11px] font-bold" style={{ color: "var(--accent)" }}>
                        {idx + 1}
                      </div>
                      <span className="text-[14px] leading-relaxed pt-0.5" style={{ color: "var(--text-2)" }}>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
