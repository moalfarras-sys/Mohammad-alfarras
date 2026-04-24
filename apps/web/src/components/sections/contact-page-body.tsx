"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Send, Clock, Sparkles } from "lucide-react";

import { PageHero } from "@/components/sections/page-hero";
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
      <PageHero
        locale={model.locale}
        eyebrow={t.eyebrow}
        title={t.title}
        body={t.body}
        actions={
          <>
            <a href={`mailto:${email}`} className="button-liquid-primary">
              <Mail className="h-4 w-4" />
              {t.email}
            </a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary">
              <MessageCircle className="h-4 w-4" />
              {t.whatsapp}
            </a>
          </>
        }
        side={
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[28px]"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-[28px] bg-gradient-to-br from-[#6366f1]/30 via-transparent to-[#8b5cf6]/30 blur-3xl" aria-hidden />
            <div className="glass relative h-full w-full overflow-hidden rounded-[28px]">
              <Image
                src={heroImage}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712]/70 via-transparent to-transparent" aria-hidden />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
                  <Sparkles className="h-3 w-3" />
                  {isAr ? "من الرسالة إلى التنفيذ" : "From message to execution"}
                </div>
              </div>
            </div>
          </motion.div>
        }
      />

      <section className="py-[var(--section-py)]">
        <div className="section-frame grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-[var(--radius-xl)] p-6 md:p-8">
            <LiquidContactForm locale={model.locale} />
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-[var(--radius-xl)] p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
                <Clock className="h-3.5 w-3.5" />
                {t.availabilityTitle}
              </div>
              <dl className="mt-5 space-y-4">
                {t.availability.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4">
                    <dt className="text-sm font-medium text-[var(--text-1)]">{row.label}</dt>
                    <dd className="text-sm text-[var(--text-2)]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="glass rounded-[var(--radius-xl)] p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
                <MapPin className="h-3.5 w-3.5" />
                {isAr ? "قنوات التواصل" : "Direct channels"}
              </div>
              <ul className="mt-5 space-y-2">
                {model.contact.channels.slice(0, 5).map((channel) => {
                  const external = channel.value.startsWith("http");
                  return (
                    <li key={channel.id}>
                      <a
                        href={channel.value}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noopener noreferrer" : undefined}
                        className="flex min-h-[48px] items-center justify-between gap-4 rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-[var(--accent-glow)] hover:bg-white/10"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[var(--text-1)]">{channel.label}</div>
                          <div className="truncate text-xs text-[var(--text-3)]">{channel.description}</div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-3)]" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="glass rounded-[var(--radius-xl)] p-6">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
                <Send className="h-3.5 w-3.5" />
                {t.stepsTitle}
              </div>
              <ol className="mt-5 space-y-4">
                {t.steps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] text-[12px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-sm leading-relaxed text-[var(--text-2)]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
