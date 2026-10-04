import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Gauge, Languages, LifeBuoy, MessageCircle, Search, ShieldCheck, Smartphone } from "lucide-react";

import { SiteOffersSection } from "@/components/site/site-offers-section";
import type { SiteViewModel } from "@/components/site/site-view-model";
import { Reveal, SplitHeadline, Stagger, TiltCard } from "@/components/v3/motion-kit";
import { socialLinks } from "@/content/site";
import { withLocale } from "@/lib/i18n";

import { BrowserShot, CtaBand, Eyebrow, LoadSequence, PhoneShot, SectionHead } from "./v3-page-parts";
import { ProcessTrack, ScrollLayer } from "./v3-page-motion";

const copy = {
  en: {
    pill: "Services",
    title: "Websites and product pages that *earn* trust.",
    lead: "Positioning, UX, interface design, development and launch support — one person accountable from the first call to the live site.",
    outcomes: ["Clearer message", "Faster trust", "Better mobile experience", "A direct path to contact"],
    heroPrimary: "Start your project",
    heroSecondary: "How it works",
    offerLabel: "What I offer",
    offerTitle: "Pick the *starting point* that fits.",
    offerBody: "Every engagement can be scoped small or grow into a full system — the structure stays the same.",
    deliverables: "Deliverables",
    processLabel: "How we work",
    processTitle: "A clear process *instead* of chaos.",
    processBody: "Every decision in copy, imagery, motion and buttons should help the visitor understand, trust and act.",
    processResult: "Where it ends: a live site",
    processResultLink: "See the SEEL case",
    steps: [
      ["01", "Understand the goal", "We define the audience, the offer and the core problem before drawing a single screen."],
      ["02", "Shape the structure", "Pages, messages, calls to action and contact paths are arranged around clarity."],
      ["03", "Design and build", "A modern interface, restrained motion, strong performance and responsive behaviour."],
      ["04", "Launch and refine", "Clean delivery, forms and statistics wired up, and iteration where the project needs it."],
    ],
    includedLabel: "In every project",
    includedTitle: "The *basics*, never optional.",
    includedBody: "Real client sites on real phones — Arabic and German, right-to-left and left-to-right.",
    included: [
      ["Arabic & English", "Right-to-left layouts treated as first-class, not as a translation afterthought."],
      ["Mobile first", "Designed for the phone your customer actually holds, then scaled up."],
      ["Fast by default", "Optimised images, lean code and measured page speed before launch."],
      ["Findable", "Clean metadata, structured data and a sitemap search engines understand."],
      ["Privacy-friendly", "No advertising trackers; only what the site needs to work."],
      ["Support after launch", "Changes, fixes and next steps when the business moves."],
    ],
    ctaLabel: "Ready to start?",
    ctaTitle: "Turn your project into a *clear* digital experience.",
    ctaBody: "Send the idea and I will help shape it visually, commercially and technically — without unnecessary complexity.",
    ctaPrimary: "Start your project",
    collageAlt: ["Developer desk with a website design and code on two screens", "Studio with camera and tech products", "Product unboxing set with a tablet showing the channel brand"],
  },
  ar: {
    pill: "الخدمات",
    title: "مواقع وصفحات منتجات *تكسب* ثقة الزائر.",
    lead: "التموضع، تجربة الاستخدام، تصميم الواجهة، البرمجة ودعم الإطلاق — شخص واحد مسؤول من أول مكالمة حتى نشر الموقع.",
    outcomes: ["رسالة أوضح", "ثقة أسرع", "تجربة جوال أفضل", "طريق مباشر للتواصل"],
    heroPrimary: "ابدأ مشروعك",
    heroSecondary: "كيف نعمل",
    offerLabel: "ماذا أقدّم",
    offerTitle: "اختر *نقطة البداية* المناسبة لك.",
    offerBody: "كل مشروع يمكن أن يبدأ صغيراً أو يكبر إلى نظام كامل — والهيكل يبقى نفسه.",
    deliverables: "ما تحصل عليه",
    processLabel: "طريقة العمل",
    processTitle: "عملية واضحة *بدل* الفوضى.",
    processBody: "كل قرار في النص والصورة والحركة والأزرار يجب أن يساعد الزائر على الفهم والثقة والتواصل.",
    processResult: "وأين تنتهي: موقع يعمل فعلاً",
    processResultLink: "شاهد دراسة حالة SEEL",
    steps: [
      ["01", "نفهم الهدف", "نحدد الجمهور والعرض والمشكلة الأساسية قبل رسم أي شاشة."],
      ["02", "نبني الهيكل", "نرتّب الصفحات والرسائل وأزرار التواصل حول الوضوح."],
      ["03", "نصمّم وننفّذ", "واجهة حديثة، حركة هادئة، أداء قوي، وتجربة مناسبة لكل الشاشات."],
      ["04", "نطلق ونحسّن", "تسليم نظيف، ربط النماذج والإحصاءات، وتطوير تدريجي حسب حاجة المشروع."],
    ],
    includedLabel: "في كل مشروع",
    includedTitle: "*الأساسيات* ليست اختيارية.",
    includedBody: "مواقع عملاء حقيقية على هواتف حقيقية — بالعربية والألمانية، من اليمين ومن اليسار.",
    included: [
      ["عربي وإنجليزي", "تصميم من اليمين لليسار بعناية كاملة، لا كترجمة لاحقة."],
      ["الجوال أولاً", "مصمّم للهاتف الذي يحمله عميلك فعلاً، ثم للشاشات الأكبر."],
      ["سريع افتراضياً", "صور محسّنة، كود خفيف، وقياس سرعة الصفحة قبل الإطلاق."],
      ["قابل للظهور في البحث", "بيانات وصفية نظيفة، بيانات منظمة، وخريطة موقع تفهمها محركات البحث."],
      ["يحترم الخصوصية", "بدون أدوات تتبّع إعلانية؛ فقط ما يحتاجه الموقع ليعمل."],
      ["دعم بعد الإطلاق", "تعديلات وإصلاحات وخطوات تالية عندما يتطور عملك."],
    ],
    ctaLabel: "جاهز للبدء؟",
    ctaTitle: "حوّل مشروعك إلى تجربة رقمية *واضحة*.",
    ctaBody: "أرسل الفكرة، وسأساعدك في ترتيبها بصرياً وتسويقياً وتقنياً — بدون تعقيد غير ضروري.",
    ctaPrimary: "ابدأ مشروعك",
    collageAlt: ["مكتب مطوّر عليه تصميم موقع وكود على شاشتين", "استوديو تصوير مع كاميرا ومنتجات تقنية", "صندوق مراجعة منتجات مع جهاز لوحي يعرض هوية القناة"],
  },
} as const;

const includedIcons = [Languages, Smartphone, Gauge, Search, ShieldCheck, LifeBuoy];

function isScreenshot(src: string) {
  return src.includes("/projects/");
}

export function ServicesV3({ model }: { model: SiteViewModel }) {
  const locale = model.locale;
  const c = copy[locale];
  const href = (path: string) => withLocale(locale, path);
  const steps = c.steps.map(([number, title, body]) => ({ number, title, body }));

  // The process "result" uses a real client project from the work data (SEEL), with a fallback
  // to the first client project that ships both screenshots.
  const resultProject =
    model.projects.find((project) => project.slug === "seel") ??
    model.projects.find((project) => project.gallery.some((src) => src.includes("-mobile.")));
  const resultMobile = resultProject?.gallery.find((src) => src.includes("-mobile."));

  // Three real mobile screenshots for the basics block (Arabic RTL + German LTR client sites).
  const phoneShots = ["alhasakah", "mbkservice", "schnell"]
    .map((slug) => model.projects.find((project) => project.slug === slug))
    .map((project) => (project ? { title: project.title, src: project.gallery.find((src) => src.includes("-mobile.")) } : null))
    .filter((entry): entry is { title: string; src: string } => Boolean(entry?.src));

  return (
    <div className="st-page v3p v3p-services">
      {/* ── Hero: copy + layered parallax collage of the branded images ── */}
      <section className="v3p-hero v3s-hero">
        <div className="st-container v3s-hero-grid">
          <div className="v3s-hero-copy">
            <div className="v3p-load" style={{ "--v3p-seq-delay": "0.05s" } as CSSProperties}>
              <Eyebrow>{c.pill}</Eyebrow>
            </div>
            <SplitHeadline as="h1" immediate text={c.title} className="v3p-h1" />
            <div className="v3p-load" style={{ "--v3p-seq-delay": "0.3s" } as CSSProperties}>
              <p className="v3p-lead">{c.lead}</p>
              <ul className="v3p-chips" aria-label={c.pill}>
                {c.outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="v3p-actions">
                <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
                  {c.heroPrimary}
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
                <a href="#process" className="st-btn st-btn--ghost">
                  {c.heroSecondary}
                </a>
              </div>
            </div>
          </div>

          <LoadSequence className="v3s-collage" delay={0.1}>
            <ScrollLayer speed={-34} rotate={-4} className="v3s-collage-back">
              <div className="v3s-collage-card">
                <Image src="/images/service_tech.png" alt={c.collageAlt[1]} fill sizes="(max-width: 900px) 46vw, 300px" className="v3-cover" />
              </div>
            </ScrollLayer>
            <ScrollLayer speed={26} className="v3s-collage-main">
              <TiltCard className="v3s-collage-card" max={6}>
                <Image src="/images/service_web.png" alt={c.collageAlt[0]} fill priority sizes="(max-width: 900px) 78vw, 460px" className="v3-cover" />
              </TiltCard>
            </ScrollLayer>
            <ScrollLayer speed={-60} rotate={5} className="v3s-collage-front">
              <div className="v3s-collage-card">
                <Image src="/images/hero_tech.png" alt={c.collageAlt[2]} fill sizes="(max-width: 900px) 40vw, 240px" className="v3-cover" />
              </div>
            </ScrollLayer>
          </LoadSequence>
        </div>
      </section>

      {/* ── Each service as a full-width image row ── */}
      {model.services.length ? (
        <section className="v3p-section" aria-labelledby="v3s-offer">
          <div className="st-container">
            <SectionHead eyebrow={c.offerLabel} title={c.offerTitle} body={c.offerBody} />
            <span id="v3s-offer" className="sr-only">
              {c.offerLabel}
            </span>
            <ol className="v3s-rows">
              {model.services.map((service, index) => (
                <li key={service.id} className={index % 2 ? "v3s-row is-flipped" : "v3s-row"}>
                  <Reveal className="v3s-row-media" y={40} amount={0.2}>
                    <TiltCard className="v3s-row-card" max={5}>
                      {service.image ? (
                        <Image
                          src={service.image}
                          alt={service.title}
                          fill
                          sizes="(max-width: 900px) 92vw, 680px"
                          quality={70}
                          className={isScreenshot(service.image) ? "v3-cover v3-top v3s-row-img" : "v3-cover v3s-row-img"}
                        />
                      ) : null}
                      <span className="v3s-row-index" aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </TiltCard>
                  </Reveal>
                  <Reveal className="v3s-row-copy" y={28} delay={0.08} amount={0.3}>
                    <p className="v3s-row-num">
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <span aria-hidden="true">/ {String(model.services.length).padStart(2, "0")}</span>
                    </p>
                    <h3 className="v3s-row-title">{service.title}</h3>
                    <p className="v3s-row-body">{service.body}</p>
                    {service.bullets.length ? (
                      <>
                        <p className="v3s-row-label">{c.deliverables}</p>
                        <ul className="v3p-chips v3p-chips--solid">
                          {service.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                  </Reveal>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      <SiteOffersSection model={model} placement="services" />

      {/* ── Process with a line that draws as you scroll ── */}
      <section className="v3p-section" id="process">
        <div className="st-container v3s-process">
          <div className="v3s-process-aside">
            <SectionHead eyebrow={c.processLabel} title={c.processTitle} body={c.processBody} />
            {resultProject ? (
              <Reveal className="v3s-result" y={30} delay={0.1}>
                <div className="v3s-result-stage">
                  <BrowserShot
                    src={resultProject.image}
                    alt={resultProject.title}
                    label={resultProject.href?.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                    sizes="(max-width: 900px) 80vw, 460px"
                    className="v3s-result-browser"
                  />
                  {resultMobile ? <PhoneShot src={resultMobile} alt="" sizes="140px" className="v3s-result-phone" /> : null}
                </div>
                <p className="v3s-result-caption">
                  <span>{c.processResult}</span>
                  <Link href={href(`work/${resultProject.slug}`)} prefetch={false} className="v3-link">
                    {c.processResultLink}
                  </Link>
                </p>
              </Reveal>
            ) : null}
          </div>
          <ProcessTrack steps={steps} />
        </div>
      </section>

      {/* ── The basics, FAQ-style, beside real mobile screens ── */}
      <section className="v3p-section">
        <div className="st-container v3s-basics">
          <div className="v3s-basics-copy">
            <SectionHead eyebrow={c.includedLabel} title={c.includedTitle} body={c.includedBody} />
            <Stagger className="v3s-faq" gap={0.06} y={18}>
              {c.included.map(([title, body], index) => {
                const Icon = includedIcons[index] ?? ShieldCheck;
                return (
                  <details key={title} className="v3s-faq-item" open={index === 0}>
                    <summary>
                      <span className="v3s-faq-icon" aria-hidden="true">
                        <Icon size={18} strokeWidth={1.7} />
                      </span>
                      <span className="v3s-faq-title">{title}</span>
                      <span className="v3s-faq-plus" aria-hidden="true" />
                    </summary>
                    <p>{body}</p>
                  </details>
                );
              })}
            </Stagger>
          </div>
          {phoneShots.length ? (
            <div className="v3s-phones" aria-label={c.includedBody}>
              {phoneShots.map((shot, index) => (
                <ScrollLayer key={shot.src} speed={[30, -40, 50][index] ?? 0} rotate={[-7, 0, 7][index] ?? 0} className={`v3s-phone v3s-phone-${index + 1}`}>
                  <PhoneShot src={shot.src} alt={shot.title} sizes="(max-width: 900px) 34vw, 220px" />
                </ScrollLayer>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <CtaBand eyebrow={c.ctaLabel} title={c.ctaTitle} body={c.ctaBody} image="/images/hero_tech.png">
        <Link href={href("contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {c.ctaPrimary}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--ghost">
          <MessageCircle size={17} aria-hidden />
          WhatsApp
        </a>
      </CtaBand>
    </div>
  );
}
