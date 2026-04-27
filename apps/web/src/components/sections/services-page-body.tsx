"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Brain,
  CheckCircle2,
  Compass,
  Layers,
  Rocket,
  Target,
} from "lucide-react";

import { PageHero } from "@/components/sections/page-hero";
import { ServicesSection } from "@/components/sections/services-section";
import { ContactCtaSection } from "@/components/sections/contact-cta-section";
import type { SiteViewModel } from "@/components/site/site-view-model";

const copy = {
  en: {
    eyebrow: "Services",
    title: "Design, code, and content — handled by one focused operator.",
    body:
      "I package the three things modern digital projects actually need into one clean engagement: visual identity, production-grade frontend, and Arabic content that earns trust.",
    primary: "Start a project",
    secondary: "See selected work",
    processTitle: "How a project usually runs",
    processSteps: [
      {
        Icon: Compass,
        title: "Discovery",
        body:
          "We align on the real goal, the audience, and what success looks like. Short, clear, and written down.",
      },
      {
        Icon: Layers,
        title: "Design system",
        body:
          "I translate the goal into a compact design system: type scale, motion language, components, and bilingual rules.",
      },
      {
        Icon: Rocket,
        title: "Ship & iterate",
        body:
          "Clean code, previewed every day. We launch when the experience is calm, fast, and persuasive — not earlier.",
      },
    ],
    stackTitle: "What you get, without surprises",
    stackItems: [
      "Pixel-perfect bilingual UI (Arabic + English, full RTL).",
      "Next.js 16 + Tailwind v4 + Framer Motion, deployed on Vercel.",
      "Lighthouse Performance > 90, SEO > 95, Accessibility > 95.",
      "Design tokens, motion specs, and documentation you can reuse later.",
      "A single owner (me) — no handoffs, no lost context.",
    ],
    faqTitle: "Good to know",
    faq: [
      {
        q: "Do you work with teams or solo?",
        a: "Both. I can plug into an existing team or own the full frontend + design line as a solo operator.",
      },
      {
        q: "How fast is a typical engagement?",
        a: "Most marketing or portfolio sites ship in 2–4 weeks. Product surfaces (like MoPlayer) run on a longer iteration rhythm.",
      },
      {
        q: "Do you take on Arabic-only work?",
        a: "Yes. Arabic-only, English-only, or fully bilingual — all handled with the same care.",
      },
      {
        q: "Do you integrate with existing backends?",
        a: "Yes. I work with REST, GraphQL, Supabase, Firebase, and custom APIs. Integration and type safety are part of the job.",
      },
    ],
  },
  ar: {
    eyebrow: "الخدمات",
    title: "تصميم وبرمجة ومحتوى — كلها بيد شخص واحد يركّز على النتيجة.",
    body:
      "أجمع الحاجات الثلاث التي يحتاجها أي مشروع رقمي حديث في خدمة واحدة نظيفة: هوية بصرية، واجهات إنتاجية، ومحتوى عربي يبني الثقة.",
    primary: "ابدأ مشروعًا",
    secondary: "شاهد الأعمال",
    processTitle: "كيف يسير المشروع عادة",
    processSteps: [
      {
        Icon: Compass,
        title: "الاكتشاف",
        body: "نتفق على الهدف الحقيقي والجمهور وشكل النجاح. قصير، واضح، ومكتوب.",
      },
      {
        Icon: Layers,
        title: "منظومة التصميم",
        body:
          "أحوّل الهدف إلى منظومة تصميم مركّزة: سلّم طباعة، لغة حركة، مكوّنات، وقواعد ثنائية اللغة.",
      },
      {
        Icon: Rocket,
        title: "الإطلاق والتكرار",
        body:
          "كود نظيف ومعاينة يومية. ننطلق حين تصبح التجربة هادئة وسريعة ومقنعة — ليس قبل ذلك.",
      },
    ],
    stackTitle: "ماذا ستحصل بالضبط",
    stackItems: [
      "واجهات ثنائية اللغة بدقة بكسل (عربي + إنجليزي مع RTL كامل).",
      "Next.js 16 + Tailwind v4 + Framer Motion، ومنشور على Vercel.",
      "Lighthouse أداء > 90، SEO > 95، إمكانية الوصول > 95.",
      "Design tokens ومواصفات حركة ووثائق يمكنك إعادة استخدامها.",
      "مالك واحد (أنا) — بلا تسليمات ضائعة أو سياق مفقود.",
    ],
    faqTitle: "أسئلة متكرّرة",
    faq: [
      {
        q: "هل تعمل ضمن فرق أم منفردًا؟",
        a: "الاثنين. أستطيع الانضمام لفريق قائم أو امتلاك خط الواجهة والتصميم كاملًا كمشغّل مستقل.",
      },
      {
        q: "كم يستغرق المشروع عادة؟",
        a: "مواقع التسويق والبورتفوليو تُنجز خلال 2–4 أسابيع. أما سطوح المنتجات (مثل MoPlayer) فلها إيقاع تكرار أطول.",
      },
      {
        q: "هل تقبل عملًا عربيًا فقط؟",
        a: "نعم. عربي فقط، إنجليزي فقط، أو ثنائي كامل — بنفس العناية.",
      },
      {
        q: "هل تتكامل مع الباك إند؟",
        a: "نعم. REST وGraphQL وSupabase وFirebase و APIs مخصّصة. التكامل وأمان الأنواع جزء من العمل.",
      },
    ],
  },
} as const;

function ProcessStep({ i, Icon, title, body, reduced }: { i: number; Icon: typeof Compass; title: string; body: string; reduced: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduced ? 0.15 : 0.5, delay: reduced ? 0 : i * 0.07 }}
      className="glass relative overflow-hidden rounded-[var(--radius-lg)] p-6"
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 text-[var(--accent-glow)]">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-display text-3xl font-extrabold text-[var(--os-text-1)]/10">{String(i + 1).padStart(2, "0")}</span>
      </div>
      <h3 className="font-display mt-4 text-lg font-bold text-[var(--text-1)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{body}</p>
    </motion.article>
  );
}

export function ServicesPageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const reduced = useReducedMotion();

  return (
    <>
      <PageHero
        locale={model.locale}
        eyebrow={t.eyebrow}
        title={t.title}
        body={t.body}
        actions={
          <>
            <Link href={`/${model.locale}/contact`} className="button-liquid-primary">
              <Target className="h-4 w-4" />
              {t.primary}
            </Link>
            <Link href={`/${model.locale}/work`} className="button-liquid-secondary">
              {t.secondary}
            </Link>
          </>
        }
        side={
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduced ? 0.2 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative mx-auto aspect-[4/3] w-full max-w-[560px] overflow-hidden rounded-[28px]"
          >
            <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-[#6366f1]/30 via-transparent to-[#8b5cf6]/30 blur-2xl" aria-hidden />
            <div className="glass relative h-full w-full overflow-hidden rounded-[28px]">
              <Image
                src={model.brandMedia.gallery.tech || "/images/hero_tech.png"}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
              />
            </div>
          </motion.div>
        }
      />

      {/* Services grid */}
      <ServicesSection locale={model.locale} />

      {/* Process */}
      <section className="py-[var(--section-py)]">
        <div className="section-frame">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
            {t.processTitle}
          </p>
          <h2 className="font-display mt-3 max-w-[22ch] text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight text-[var(--text-1)]">
            {model.locale === "ar" ? "ثلاث خطوات قصيرة بين الفكرة والإطلاق." : "Three short steps between idea and launch."}
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {t.processSteps.map((step, idx) => (
              <ProcessStep key={step.title} i={idx} Icon={step.Icon} title={step.title} body={step.body} reduced={!!reduced} />
            ))}
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="py-12 md:py-16">
        <div className="section-frame">
          <div className="glass overflow-hidden rounded-[var(--radius-xl)]">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 md:p-9">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">
                  {t.stackTitle}
                </p>
                <h2 className="font-display mt-3 text-[clamp(1.5rem,3.4vw,2.25rem)] font-extrabold leading-tight text-[var(--text-1)]">
                  {model.locale === "ar" ? "تسليمات مكتوبة وواضحة." : "Deliverables, in writing."}
                </h2>
                <ul className="mt-5 grid gap-3">
                  {t.stackItems.map((item, idx) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: reduced ? 0.15 : 0.35, delay: reduced ? 0 : idx * 0.04 }}
                      className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--os-border)] bg-white/5 px-4 py-3"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-glow)]" />
                      <span className="text-sm leading-relaxed text-[var(--text-2)] md:text-base">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[240px] border-t border-[var(--os-border)] lg:border-t-0 lg:border-l">
                <Image
                  src={model.brandMedia.gallery.brand || "/images/logo.png"}
                  alt=""
                  fill
                  className="object-contain p-6 md:p-10"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/10 to-black/40" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="section-frame max-w-4xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-[var(--accent-glow)]">{t.faqTitle}</p>
          <h2 className="font-display mt-3 text-[clamp(1.5rem,3.4vw,2rem)] font-extrabold leading-tight text-[var(--text-1)]">
            {model.locale === "ar" ? "الأسئلة التي تسألها أكثر." : "Questions people ask most."}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {t.faq.map((item, idx) => (
              <motion.article
                key={item.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0.15 : 0.4, delay: reduced ? 0 : idx * 0.04 }}
                className="glass rounded-[var(--radius-lg)] p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1]/25 to-[#8b5cf6]/25 text-[var(--accent-glow)]">
                    <Brain className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-1)] md:text-base">{item.q}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-2)]">{item.a}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <ContactCtaSection locale={model.locale} />
    </>
  );
}
