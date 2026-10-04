import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { SiteProject } from "@/components/site/site-view-model";
import { SplitHeadline } from "@/components/v3/motion-kit";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import { BrowserShot, CtaBand, Eyebrow, LoadSequence, PhoneShot } from "./v3-page-parts";
import { ScrollLayer, StatCount } from "./v3-page-motion";
import { categoryOf, hostOf, mobileShotOf, orderProjects } from "./work-data";
import { WorkGallery } from "./work-gallery";

const copy = {
  en: {
    pill: "Selected work",
    title: "Projects that are *live*, not mock-ups.",
    lead: "Client websites in Germany and Syria and my own products. Each case explains the problem, what I built and the outcome.",
    liveSites: "live client sites",
    products: "own products",
    browse: "Browse the work",
    ctaLabel: "Your project next",
    ctaTitle: "Ready to build a presence that *works*?",
    ctaBody: "If your project needs a convincing website, a product page or an interface that makes the next step obvious, send the idea.",
    ctaPrimary: "Start a project",
    ctaSecondary: "How I work",
  },
  ar: {
    pill: "أعمال مختارة",
    title: "مشاريع *تعمل فعلاً*، لا تصاميم وهمية.",
    lead: "مواقع لعملاء في ألمانيا وسوريا ومنتجاتي الخاصة. كل دراسة حالة تشرح المشكلة، وما بنيته، والنتيجة.",
    liveSites: "مواقع عملاء تعمل الآن",
    products: "منتجات خاصة",
    browse: "تصفّح الأعمال",
    ctaLabel: "مشروعك التالي",
    ctaTitle: "جاهز لبناء حضور رقمي *يعمل*؟",
    ctaBody: "إذا كان مشروعك يحتاج موقعاً مقنعاً، صفحة منتج، أو واجهة تجعل الخطوة التالية واضحة، أرسل لي الفكرة.",
    ctaPrimary: "ابدأ مشروعك",
    ctaSecondary: "طريقة العمل",
  },
} as const;

export function WorkV3({ locale, projects }: { locale: Locale; projects: SiteProject[] }) {
  const t = copy[locale];
  const ordered = orderProjects(projects);
  const clients = ordered.filter((project) => categoryOf(project) !== "products" && hostOf(project.href));
  const withShots = clients.filter((project) => mobileShotOf(project));
  const liveCount = clients.filter((project) => project.status !== "in-development").length;
  const productCount = ordered.filter((project) => categoryOf(project) === "products").length;

  // Hero collage: a German client site in front, an Arabic platform behind, another client on the phone.
  const main = withShots.find((project) => project.slug === "seel") ?? withShots[0];
  const back = withShots.find((project) => project !== main && categoryOf(project) === "platforms") ?? withShots[1];
  const phone =
    withShots.find((project) => project !== main && project !== back && categoryOf(project) === "websites") ??
    withShots.find((project) => project !== main && project !== back) ??
    main;
  const phoneSrc = phone ? mobileShotOf(phone) : undefined;

  return (
    <div className="st-page v3p v3p-work">
      <section className="v3p-hero v3w-hero">
        <div className="st-container v3w-hero-grid">
          <div className="v3w-hero-copy">
            <div className="v3p-load" style={{ "--v3p-seq-delay": "0.05s" } as CSSProperties}>
              <Eyebrow>{t.pill}</Eyebrow>
            </div>
            <SplitHeadline as="h1" immediate text={t.title} className="v3p-h1" />
            <div className="v3p-load" style={{ "--v3p-seq-delay": "0.3s" } as CSSProperties}>
              <p className="v3p-lead">{t.lead}</p>
              <dl className="v3w-stats">
                <div>
                  <dt>{t.liveSites}</dt>
                  <dd>
                    <StatCount value={liveCount} locale={locale} />
                  </dd>
                </div>
                <div>
                  <dt>{t.products}</dt>
                  <dd>
                    <StatCount value={productCount} locale={locale} />
                  </dd>
                </div>
              </dl>
              <div className="v3p-actions">
                <a href="#gallery" className="st-btn st-btn--primary st-btn--lg">
                  {t.browse}
                  <ArrowUpRight size={18} aria-hidden />
                </a>
              </div>
            </div>
          </div>

          {main ? (
            <LoadSequence className="v3w-collage" delay={0.15}>
              {back ? (
                <ScrollLayer speed={-30} rotate={-3} className="v3w-collage-back">
                  <BrowserShot src={back.image} alt={back.title} label={hostOf(back.href)} sizes="(max-width: 900px) 60vw, 380px" />
                </ScrollLayer>
              ) : null}
              <ScrollLayer speed={20} className="v3w-collage-main">
                <BrowserShot src={main.image} alt={main.title} label={hostOf(main.href)} sizes="(max-width: 900px) 84vw, 560px" priority />
              </ScrollLayer>
              {phoneSrc && phone ? (
                <ScrollLayer speed={-64} rotate={4} className="v3w-collage-phone">
                  <PhoneShot src={phoneSrc} alt={phone.title} sizes="(max-width: 900px) 30vw, 170px" priority />
                </ScrollLayer>
              ) : null}
            </LoadSequence>
          ) : null}
        </div>
      </section>

      <section className="v3p-section v3w-gallery-section" id="gallery">
        <div className="st-container">
          <WorkGallery locale={locale} projects={projects} />
        </div>
      </section>

      <CtaBand eyebrow={t.ctaLabel} title={t.ctaTitle} body={t.ctaBody} image="/images/service_web.png">
        <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
          {t.ctaPrimary}
          <ArrowUpRight size={18} aria-hidden />
        </Link>
        <Link href={withLocale(locale, "services")} prefetch={false} className="st-btn st-btn--ghost">
          {t.ctaSecondary}
        </Link>
      </CtaBand>
    </div>
  );
}
