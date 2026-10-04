import { ArrowUpRight, Compass, Languages, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { AboutChapters, AboutStage, type AboutChapter } from "@/components/v3/about-story";
import { Reveal, SplitHeadline, Stagger, TiltCard } from "@/components/v3/motion-kit";
import { languageLevels } from "@/content/site-data";
import { withLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

export type AboutPageV3Props = {
  locale: Locale;
  /** Live client sites counted from the project data. */
  liveSites: number;
  /** YouTube subscribers (live API value, CMS or fallback). Mentioned once. */
  subscribers: number;
  /** Current MoPlayer Classic version from the release data. */
  moplayerVersion: string;
};

const FLAGS: Record<string, string> = {
  ar: "/icons/flag-sy-new.svg",
  de: "/icons/flag-de.svg",
  en: "/icons/flag-gb.svg",
};

function copy(locale: Locale, p: AboutPageV3Props) {
  const subs = new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(p.subscribers);
  const href = (path: string) => withLocale(locale, path);

  if (locale === "ar") {
    return {
      pill: "نبذة عني · القصة الشخصية",
      title: "من الحسكة إلى ألمانيا — أبني أشياء *يفهمها* الناس.",
      lead: "أنا محمد الفراس. نشأت في الحسكة بسوريا، وأعيش في ألمانيا منذ 2015. هذه قصتي باختصار: كيف اجتمعت اللوجستيات، المواقع، تطبيقاتي الخاصة، وقناة تقنية عربية في طريق واحد.",
      heroChips: ["الحسكة، سوريا", "ألمانيا · منذ 2015", "عربي · Deutsch · English"],
      heroAlt: "محمد الفراس في الاستوديو بين الأجهزة",
      portraitAlt: "صورة محمد الفراس في الاستوديو",
      storyLabel: "القصة",
      storyTitle: "خمسة فصول، *طريق* واحد.",
      chapters: [
        {
          id: "origin",
          index: "01",
          kicker: "البداية · الحسكة، سوريا",
          title: "من هنا بدأت.",
          body: "نشأت في الحسكة شمال شرق سوريا ودرست في جامعة الفرات (2011–2014). قبل السفر أدرت العمل اليومي في مقهى الإنترنت «Malak Net»: الفريق، الزبائن والمبيعات — أول درس لي في إبقاء الأمور تعمل.",
          facts: ["جامعة الفرات · 2011–2014", "Malak Net · 2014–2015"],
          media: {
            kind: "browser",
            src: "/images/projects/alhasakah-home.webp",
            mobile: "/images/projects/alhasakah-mobile.webp",
            alt: "موقع دليل مدينة الحسكة alhasakah.net",
            domain: "alhasakah.net",
            caption: "بعد سنوات بنيت alhasakah.net — دليلاً لمدينتي.",
          },
        },
        {
          id: "germany",
          index: "02",
          kicker: "2015 · ألمانيا",
          title: "بلد جديد، ولغة جديدة.",
          body: "في 2015 انتقلت إلى ألمانيا: قواعد جديدة، معايير أدق، ولغة كان عليّ أن أكسبها. درست الألمانية حتى B2 مع تدريب محاسبة DATEV في Comhard (2023)، واليوم أعمل بالألمانية بمستوى C1.",
          facts: ["Sandbox Berlin · 2022", "Comhard · 2023"],
          media: { kind: "route", from: "الحسكة", to: "ألمانيا", year: "2015", chips: ["الألمانية: من B2 إلى C1", "DATEV · Comhard"] },
        },
        {
          id: "logistics",
          index: "03",
          kicker: "2019 – الآن · اللوجستيات",
          title: "تعلّم الأنظمة تحت الضغط.",
          body: "ثلاث سنوات في الإنتاج لدى Stocubo (2019–2022)، ثم الديسبوزيشن في Rhenus Home Delivery منذ نوفمبر 2023 — مسارات، سائقون، نظام TMS وعملاء كل يوم. تعلّمت أن البساطة للمستخدم تعني دائماً نظاماً صارماً خلفها.",
          facts: ["Stocubo GmbH · 2019–2022", "Rhenus Home Delivery · منذ 2023"],
          media: { kind: "parallax", src: "/images/service_logistics.png", alt: "رسم توضيحي لعمليات مستودع وتوزيع", caption: "اللوجستيات: الدقة والوتيرة والمسؤولية المباشرة." },
        },
        {
          id: "web",
          index: "04",
          kicker: "الآن · ويب ومنتجات",
          title: "مواقع، ومنتجات خاصة بي.",
          body: `نفس العقلية أطبّقها اليوم على مواقع لشركات حقيقية في ألمانيا وسوريا — ${p.liveSites} منها منشورة الآن — من الفكرة حتى الإطلاق. وعلى منتجاتي: MoPlayer لأجهزة Android و Android TV و Windows، و MoOS نظام سطح مكتب عربي أولاً.`,
          facts: [`${p.liveSites} مواقع عملاء منشورة`, "MoPlayer · MoOS"],
          link: { href: href("work"), label: "شاهد الأعمال" },
          media: {
            kind: "duo",
            site: { src: "/images/projects/qamishli-home.webp", alt: "منصّة عقارات القامشلي", domain: "qamishli.net" },
            tv: { src: "/images/moplayer/classic-2-5/classic-2-5-home-live-row.webp", alt: "الشاشة الرئيسية لتطبيق MoPlayer على التلفاز" },
            caption: "qamishli.net على المتصفح، و MoPlayer على التلفاز.",
          },
        },
        {
          id: "youtube",
          index: "05",
          kicker: "الآن · يوتيوب",
          title: "أشرح التقنية بالعربية.",
          body: `في قناتي أفتح الأجهزة وأراجعها وأشرح التقنية بعربية واضحة — بصراحة عن المفيد وغير المفيد. يتابعني حتى الآن ${subs} مشترك.`,
          facts: ["@Moalfarras"],
          link: { href: href("youtube"), label: "صفحة يوتيوب" },
          media: { kind: "parallax", wide: true, src: "/images/yt-channel-hero.png", alt: "غلاف قناة محمد الفراس على يوتيوب", caption: "Mohammad Alfarras — Unboxing Review" },
        },
      ] satisfies AboutChapter[],
      valuesLabel: "ما أؤمن به",
      valuesTitle: "ثلاث قيم *ثابتة*.",
      values: [
        ["الوضوح أولاً", "العمل المعقّد يجب أن يبدو بسيطاً. أرتّب الهيكل والكلمات والواجهة حتى يفهم الناس ويتصرفوا."],
        ["العربية ليست ترجمة", "العربية والإنجليزية والألمانية بنفس المستوى — واجهات RTL تُصمَّم من البداية، لا تُترجم في النهاية."],
        ["فقط ما هو حقيقي", "الادعاءات والأرقام ولقطات الشاشة تطابق ما تم إطلاقه فعلاً. لا أرقام منفوخة."],
      ] as Array<[string, string]>,
      languagesLabel: "اللغات",
      nowLabel: "ما أبنيه الآن",
      nowTitle: "مشروعان *مفتوحان* على مكتبي.",
      now: [
        {
          title: "MoPlayer",
          body: "مشغّلات لأجهزة Android و Android TV و Windows لمصادر يضيفها المستخدم، مع تفعيل QR.",
          chip: `Classic v${p.moplayerVersion}`,
          image: "/images/moplayer/classic-2-5/classic-2-5-home-live-row.webp",
          alt: "واجهة MoPlayer على التلفاز",
          href: href("apps/moplayer"),
          cta: "صفحة MoPlayer",
        },
        {
          title: "MoOS",
          body: "نظام تشغيل عربي أولاً للكمبيوتر، مبني على Fedora Atomic و KDE Plasma 6 — مجاني ومفتوح المصدر.",
          chip: "قيد التطوير",
          image: "/images/moos/desktop-dark.webp",
          alt: "سطح مكتب MoOS",
          href: href("moos"),
          cta: "صفحة MoOS",
        },
      ],
      ctaLabel: "لنتحدث",
      ctaTitle: "عندك فكرة؟ لنبنِها *بوضوح*.",
      ctaBody: "مواقع، صفحات منتجات، أو رأي ثانٍ — راسلني بالعربية أو الألمانية أو الإنجليزية. وإن كنت تبحث عن الخبرة والتواريخ، فالسيرة الذاتية جاهزة.",
      contact: "تواصل معي",
      cv: "السيرة الذاتية",
    };
  }

  return {
    pill: "About · the personal story",
    title: "From Al-Hasakah to Germany — *building* things people understand.",
    lead: "I'm Mohammad Alfarras. I grew up in Al-Hasakah, Syria, and have lived in Germany since 2015. This is the short version of how logistics work, websites, my own apps and an Arabic tech channel became one path.",
    heroChips: ["Al-Hasakah, Syria", "Germany · since 2015", "عربي · Deutsch · English"],
    heroAlt: "Mohammad Alfarras in his studio surrounded by devices",
    portraitAlt: "Studio portrait of Mohammad Alfarras",
    storyLabel: "The story",
    storyTitle: "Five chapters, one *route*.",
    chapters: [
      {
        id: "origin",
        index: "01",
        kicker: "Origin · Al-Hasakah, Syria",
        title: "Where it started.",
        body: "I grew up in Al-Hasakah in north-east Syria and studied at Al Furat University (2011–2014). Before leaving, I ran the day-to-day of Malak Net, an internet café — staff, customers and sales. My first lesson in keeping things running.",
        facts: ["Al Furat University · 2011–2014", "Malak Net · 2014–2015"],
        media: {
          kind: "browser",
          src: "/images/projects/alhasakah-home.webp",
          mobile: "/images/projects/alhasakah-mobile.webp",
          alt: "The alhasakah.net city guide website",
          domain: "alhasakah.net",
          caption: "Years later I built alhasakah.net — a city guide for my hometown.",
        },
      },
      {
        id: "germany",
        index: "02",
        kicker: "2015 · Germany",
        title: "A new country, a new language.",
        body: "In 2015 I moved to Germany: new rules, sharper standards and a language I had to earn. I trained to German B2 alongside DATEV accounting at Comhard (2023), and today I work in German at C1 level.",
        facts: ["Sandbox Berlin · 2022", "Comhard · 2023"],
        media: { kind: "route", from: "Al-Hasakah", to: "Germany", year: "2015", chips: ["German: B2 → C1", "DATEV · Comhard"] },
      },
      {
        id: "logistics",
        index: "03",
        kicker: "2019 – now · Logistics",
        title: "Learning systems under pressure.",
        body: "Three years in production at Stocubo (2019–2022), then disposition at Rhenus Home Delivery since November 2023 — routes, drivers, TMS and customers, every day. It taught me that simple for the user always means a rigorous system behind it.",
        facts: ["Stocubo GmbH · 2019–2022", "Rhenus Home Delivery · since 2023"],
        media: { kind: "parallax", src: "/images/service_logistics.png", alt: "Illustration of warehouse and delivery operations", caption: "Logistics: precision, pace and direct responsibility." },
      },
      {
        id: "web",
        index: "04",
        kicker: "Now · Web & products",
        title: "Websites, and products of my own.",
        body: `The same thinking now goes into websites for real businesses in Germany and Syria — ${p.liveSites} of them live — built end to end. And into my own products: MoPlayer for Android, Android TV and Windows, and MoOS, an Arabic-first desktop system.`,
        facts: [`${p.liveSites} live client sites`, "MoPlayer · MoOS"],
        link: { href: href("work"), label: "See the work" },
        media: {
          kind: "duo",
          site: { src: "/images/projects/qamishli-home.webp", alt: "Qamishli Real Estate platform", domain: "qamishli.net" },
          tv: { src: "/images/moplayer/classic-2-5/classic-2-5-home-live-row.webp", alt: "MoPlayer home screen on a TV" },
          caption: "qamishli.net in the browser, MoPlayer on the TV.",
        },
      },
      {
        id: "youtube",
        index: "05",
        kicker: "Now · YouTube",
        title: "Explaining tech in Arabic.",
        body: `On my channel I unbox, review and explain technology in clear Arabic — honest about what is useful and what isn't. ${subs} people subscribe so far.`,
        facts: ["@Moalfarras"],
        link: { href: href("youtube"), label: "The YouTube page" },
        media: { kind: "parallax", wide: true, src: "/images/yt-channel-hero.png", alt: "Mohammad Alfarras YouTube channel banner", caption: "Mohammad Alfarras — Unboxing Review" },
      },
    ] satisfies AboutChapter[],
    valuesLabel: "What I believe",
    valuesTitle: "Three values that *don't* move.",
    values: [
      ["Clarity first", "Complicated work should feel simple. I arrange structure, words and interface so people understand and act."],
      ["Arabic is first-class", "Arabic, English and German at the same level — right-to-left layouts are designed from the start, never translated at the end."],
      ["Only what's real", "Claims, numbers and screenshots match what actually shipped. No inflated stats."],
    ] as Array<[string, string]>,
    languagesLabel: "Languages",
    nowLabel: "What I'm building now",
    nowTitle: "Two projects *open* on my desk.",
    now: [
      {
        title: "MoPlayer",
        body: "Players for Android, Android TV and Windows for sources the user adds, with QR activation.",
        chip: `Classic v${p.moplayerVersion}`,
        image: "/images/moplayer/classic-2-5/classic-2-5-home-live-row.webp",
        alt: "MoPlayer interface on a TV",
        href: href("apps/moplayer"),
        cta: "MoPlayer page",
      },
      {
        title: "MoOS",
        body: "An Arabic-first desktop operating system on Fedora Atomic and KDE Plasma 6 — free and open source.",
        chip: "In active development",
        image: "/images/moos/desktop-dark.webp",
        alt: "The MoOS desktop",
        href: href("moos"),
        cta: "MoOS page",
      },
    ],
    ctaLabel: "Say hello",
    ctaTitle: "Got an idea? Let's build it *clearly*.",
    ctaBody: "Websites, product pages or a second opinion — write in Arabic, German or English. Looking for roles and dates instead? The CV is ready.",
    contact: "Get in touch",
    cv: "Read the CV",
  };
}

function Accent({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, index) =>
        part.startsWith("*") ? (
          <span key={index} className="v3-accent">
            {part.replace(/\*/g, "")}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

const VALUE_ICONS = [Compass, Languages, ShieldCheck];

export function AboutPageV3(props: AboutPageV3Props) {
  const { locale } = props;
  const t = copy(locale, props);
  const languages = languageLevels[locale];

  return (
    <div className="st-page v3ab">
      {/* ── Hero ── */}
      <section className="v3ab-hero">
        <div className="st-container">
          <div className="v3ab-hero-top">
            <div className="v3ab-hero-copy">
              <Reveal y={16}>
                <p className="st-pill">
                  <span className="st-pill-dot" aria-hidden />
                  {t.pill}
                </p>
              </Reveal>
              <SplitHeadline as="h1" immediate text={t.title} className="v3ab-title" delay={0.1} />
              <Reveal delay={0.3} y={16}>
                <p className="v3ab-lead">{t.lead}</p>
              </Reveal>
            </div>
            <Reveal className="v3ab-hero-portrait" delay={0.2} y={40}>
              <TiltCard className="v3ab-portrait-card" max={7}>
                <Image
                  src="/images/portrait.jpg"
                  alt={t.portraitAlt}
                  fill
                  priority
                  sizes="(max-width: 899px) 46vw, 300px"
                  quality={72}
                  className="v3-cover v3ab-portrait-img"
                />
                <span className="v3ab-portrait-shine" aria-hidden />
              </TiltCard>
            </Reveal>
          </div>
          <div className="v3ab-stage">
            <AboutStage src="/images/hero-profile-bg.png" alt={t.heroAlt}>
              <span className="v3ab-stage-fade" aria-hidden />
              <ul className="v3ab-stage-chips">
                {t.heroChips.map((chip, index) => (
                  <li key={chip}>
                    {index === 0 ? <MapPin size={14} aria-hidden /> : null}
                    {chip}
                  </li>
                ))}
              </ul>
            </AboutStage>
          </div>
        </div>
      </section>

      {/* ── Story chapters ── */}
      <section className="v3ab-section">
        <div className="st-container">
          <Reveal className="v3ab-head">
            <p className="v3ab-kicker">{t.storyLabel}</p>
            <h2 className="v3ab-h2">
              <Accent text={t.storyTitle} />
            </h2>
          </Reveal>
          <AboutChapters chapters={t.chapters} />
        </div>
      </section>

      {/* ── Values + languages ── */}
      <section className="v3ab-section">
        <div className="st-container">
          <Reveal className="v3ab-head">
            <p className="v3ab-kicker">{t.valuesLabel}</p>
            <h2 className="v3ab-h2">
              <Accent text={t.valuesTitle} />
            </h2>
          </Reveal>
          <Stagger className="v3ab-values" gap={0.1}>
            {t.values.map(([title, body], index) => {
              const Icon = VALUE_ICONS[index] ?? Compass;
              return (
                <article className="v3ab-value" key={title}>
                  <span className="v3ab-value-num" aria-hidden>
                    0{index + 1}
                  </span>
                  <span className="v3ab-value-icon" aria-hidden>
                    <Icon size={22} />
                  </span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              );
            })}
          </Stagger>
          <Reveal className="v3ab-langs">
            <p className="v3ab-kicker">{t.languagesLabel}</p>
            <ul>
              {languages.map((language) => (
                <li key={language.id}>
                  <span className="v3ab-flag">
                    <Image src={FLAGS[language.id] ?? FLAGS.en} alt="" width={52} height={52} />
                  </span>
                  <span>
                    <strong>{language.label}</strong>
                    <span>{language.level}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── Building now ── */}
      <section className="v3ab-section">
        <div className="st-container">
          <Reveal className="v3ab-head">
            <p className="v3ab-kicker">{t.nowLabel}</p>
            <h2 className="v3ab-h2">
              <Accent text={t.nowTitle} />
            </h2>
          </Reveal>
          <Stagger className="v3ab-now" gap={0.12}>
            {t.now.map((item) => (
              <Link key={item.title} href={item.href} prefetch={false} className="v3ab-now-card">
                <span className="v3ab-now-media">
                  <Image src={item.image} alt={item.alt} fill sizes="(max-width: 899px) 92vw, 600px" className="v3-cover" />
                  <span className="v3ab-now-chip">{item.chip}</span>
                </span>
                <span className="v3ab-now-copy">
                  <strong>{item.title}</strong>
                  <span>{item.body}</span>
                  <span className="v3ab-now-cta">
                    {item.cta}
                    <ArrowUpRight size={16} aria-hidden />
                  </span>
                </span>
              </Link>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── One CTA ── */}
      <section className="v3ab-section v3ab-section--last">
        <div className="st-container">
          <Reveal className="v3ab-cta">
            <div className="v3ab-cta-art" aria-hidden>
              <Image src="/images/service_web.png" alt="" fill sizes="(max-width: 899px) 100vw, 620px" className="v3-cover" />
            </div>
            <div className="v3ab-cta-copy">
              <p className="v3ab-kicker">{t.ctaLabel}</p>
              <h2 className="v3ab-h2">
                <Accent text={t.ctaTitle} />
              </h2>
              <p className="v3ab-cta-body">{t.ctaBody}</p>
              <div className="st-actions">
                <Link href={withLocale(locale, "contact")} prefetch={false} className="st-btn st-btn--primary st-btn--lg">
                  {t.contact}
                  <ArrowUpRight size={18} aria-hidden />
                </Link>
                <Link href={withLocale(locale, "cv")} prefetch={false} className="st-btn st-btn--ghost st-btn--lg">
                  {t.cv}
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
