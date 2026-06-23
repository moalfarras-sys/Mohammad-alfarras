import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildSiteModel } from "@/components/site/site-model";
import { youtubeChannel } from "@/content/site-data";
import type { Locale } from "@/types/cms";

import "./cv-print.css";

export const dynamic = "force-dynamic";

const PRINT_LOCALES = ["ar", "en", "de"] as const;
type PrintLocale = (typeof PRINT_LOCALES)[number];

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Mohammad Alfarras — CV",
};

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

type Exp = { id: string; role: string; company: string; period: string; location: string; description: string; highlights: string[] };

// Authored German CV content (the site model only carries ar/en).
const GERMAN_EXPERIENCE: Exp[] = [
  {
    id: "rhenus",
    role: "Disposition & Tourenplanung",
    company: "Rhenus Home Delivery GmbH",
    period: "Nov. 2023 – heute",
    location: "Deutschland",
    description:
      "Steuerung des täglichen Zustellbetriebs unter hohem Druck: Touren- und Fahrerplanung, Arbeit mit TMS-Systemen und direkter Kundenkontakt für einen strukturierten, schnellen Ablauf.",
    highlights: ["Disposition", "TMS", "Tourenplanung", "Kundenservice"],
  },
  {
    id: "stocubo",
    role: "Produktionsmitarbeiter",
    company: "Stocubo GmbH",
    period: "Okt. 2019 – Nov. 2022",
    location: "Deutschland",
    description:
      "Tägliche Produktionsaufgaben in einem strukturierten Umfeld mit hohem Anspruch an Qualität, Genauigkeit und Disziplin.",
    highlights: ["Produktionsqualität", "Genauigkeit", "Strukturierter Ablauf"],
  },
  {
    id: "malak",
    role: "Geschäftsführer (Internetcafé)",
    company: "Internet Café Malak Net",
    period: "Aug. 2014 – Juli 2015",
    location: "Syrien",
    description:
      "Leitung des Tagesgeschäfts, Teamführung, Kundenservice und Vertrieb sowie direkte Organisation des Betriebs in einem schnelllebigen Umfeld.",
    highlights: ["Betriebsleitung", "Teamführung", "Kundenservice", "Vertrieb"],
  },
];

const GERMAN_PROJECTS = [
  { id: "alhasakah", title: "Alhasakah City Guide", summary: "Vollständiger Stadtführer mit Restaurants, Geschäften, Ärzten und Diensten – inkl. smarter Suche und Karte." },
  { id: "qamishli", title: "Qamishli Real Estate", summary: "Immobilien-Plattform für Wohnungen, Häuser und Grundstücke mit Suche, Filtern und Karte." },
  { id: "mbk", title: "MBK Service", summary: "Edle digitale Präsenz für Transport-, Limousinen- und Kurierdienste in Berlin – auf Vertrauen und Eleganz ausgelegt." },
  { id: "ad", title: "A&D Fahrzeugtransporte", summary: "Deutsche Präsenz für Fahrzeugtransport und Abschleppdienste – klar, schnell und auf direkten Kontakt ausgelegt." },
];

export default async function CvPrintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!PRINT_LOCALES.includes(locale as PrintLocale)) notFound();
  const loc = locale as PrintLocale;
  const isAr = loc === "ar";
  const isDe = loc === "de";
  const tr = <T,>(a: T, e: T, d: T): T => (isAr ? a : isDe ? d : e);

  // German reuses the English data model for stats/contact; experience + projects are authored above.
  const model = await buildSiteModel({ locale: (isDe ? "en" : loc) as Locale, slug: "cv" });

  const views = Number(model.live.youtube?.totalViews ?? model.youtube.views ?? youtubeChannel.fallback.views) || youtubeChannel.fallback.views;
  const subs = Number(model.live.youtube?.subscribers ?? model.youtube.subscribers ?? youtubeChannel.fallback.subscribers) || youtubeChannel.fallback.subscribers;
  const videos = Number(model.live.youtube?.videoCount ?? model.youtube.videos ?? youtubeChannel.fallback.videos) || youtubeChannel.fallback.videos;

  const projects = isDe ? GERMAN_PROJECTS : model.projects.filter((p) => !/moplayer/i.test(String(p.id))).slice(0, 4);
  const experience: Exp[] = isDe ? GERMAN_EXPERIENCE : (model.cvExperience.slice(0, 4) as Exp[]);

  const name = isAr ? "محمد الفراس" : "Mohammad Alfarras";
  const title = tr(
    "مطوّر ومصمّم مواقع وتطبيقات · صانع محتوى تقني",
    "Web & App Engineer · Digital Designer · Tech Creator",
    "Web- & App-Entwickler · UI/UX-Designer · Tech-Creator",
  );

  const summary = tr(
    "مهندس واجهات ومصمّم رقمي مقيم في ألمانيا، أحوّل الأفكار والخبرات إلى مواقع وأنظمة وتطبيقات واضحة، سريعة، وقابلة للنمو. خلفية تشغيلية ولوجستية قوية، مع خبرة في بناء منتجات Android TV (MoPlayer) وصناعة محتوى تقني عربي وصل لأكثر من 1.6 مليون مشاهدة.",
    "Germany-based interface engineer and digital designer who turns ideas and expertise into clear, fast, scalable websites, systems, and apps. Strong operational and logistics background, with experience shipping Android TV products (MoPlayer) and building Arabic technical content that has reached over 1.6M views.",
    "In Deutschland ansässiger Interface-Entwickler und Digital-Designer. Ich verwandle Ideen und Erfahrung in klare, schnelle und skalierbare Websites, Systeme und Apps. Starker operativer und logistischer Hintergrund, Erfahrung mit Android-TV-Produkten (MoPlayer) und arabischem Tech-Content mit über 1,6 Mio. Aufrufen.",
  );

  const strengths = tr(
    ["تطوير الويب (Next.js · React · TypeScript)", "تصميم واجهات وتجربة المستخدم (UI/UX)", "تطبيقات Android / Android TV", "أنظمة إدارة محتوى ولوحات تحكم", "صناعة محتوى تقني وتسويق رقمي", "إدارة عمليات ولوجستيات"],
    ["Web development (Next.js · React · TypeScript)", "UI/UX interface design", "Android / Android TV apps", "CMS & dashboard systems", "Technical content & digital marketing", "Operations & logistics management"],
    ["Web-Entwicklung (Next.js · React · TypeScript)", "UI/UX-Interface-Design", "Android- / Android-TV-Apps", "CMS- & Dashboard-Systeme", "Technischer Content & digitales Marketing", "Betriebs- & Logistikmanagement"],
  );

  const languages = tr(
    [["العربية", "اللغة الأم"], ["الألمانية", "C1 — مهني"], ["الإنجليزية", "كتابة مهنية عملية"]],
    [["Arabic", "Native"], ["German", "C1 — Professional"], ["English", "Professional working"]],
    [["Arabisch", "Muttersprache"], ["Deutsch", "C1 — Berufstätig"], ["Englisch", "Verhandlungssicher"]],
  );

  const email = model.contact.emailAddress || "Mohammad.Alfarras@gmail.com";
  const phone = "+49 176 23419358";
  const site = "moalfarras.space";

  const L = {
    summary: tr("نبذة مهنية", "Profile", "Profil"),
    strengths: tr("المهارات الأساسية", "Core strengths", "Kernkompetenzen"),
    languages: tr("اللغات", "Languages", "Sprachen"),
    experience: tr("الخبرة العملية", "Experience", "Berufserfahrung"),
    projects: tr("مشاريع مختارة", "Selected projects", "Ausgewählte Projekte"),
    highlights: tr("أرقام تتحدث", "By the numbers", "In Zahlen"),
    videosL: tr("فيديو", "Videos", "Videos"),
    viewsL: tr("مشاهدة", "Views", "Aufrufe"),
    subsL: tr("مشترك", "Subscribers", "Abonnenten"),
    projectsL: tr("مشاريع", "Projects", "Projekte"),
    appsL: tr("تطبيقات", "Apps", "Apps"),
    country: tr("ألمانيا", "Germany", "Deutschland"),
    live: tr("نسخة رقمية محدّثة", "Live digital version", "Aktuelle digitale Version"),
    now: tr("الآن", "now", "heute"),
    moRole: tr("منتج Android TV مخصّص", "Custom Android TV product", "Individuelles Android-TV-Produkt"),
    moDesc: tr(
      "تجربة منتج تجمع التشغيل، التفعيل، مصادر IPTV، والإصدارات الرسمية عبر أربع منصّات.",
      "A product experience connecting playback, activation, IPTV sources, and official releases across four platforms.",
      "Produkterlebnis aus Wiedergabe, Aktivierung, IPTV-Quellen und offiziellen Releases über vier Plattformen.",
    ),
  };

  return (
    <div className="cvp-root" dir={isAr ? "rtl" : "ltr"} lang={loc}>
      <div className="cvp-page">
        <header className="cvp-header">
          <div className="cvp-header-glow" aria-hidden />
          <div className="cvp-header-top">
            <div className="cvp-id">
              <h1>{name}</h1>
              <p className="cvp-title">{title}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cvp-photo" src="/images/portrait.jpg" alt={name} />
          </div>
          <ul className="cvp-contact">
            <li><span>✉</span>{email}</li>
            <li><span>☏</span>{phone}</li>
            <li><span>◷</span>{L.country}</li>
            <li><span>⊕</span>{site}</li>
            <li><span>▶</span>youtube.com/@Moalfarras</li>
            <li><span>⌥</span>github.com/moalfarras-sys</li>
          </ul>
        </header>

        <div className="cvp-body">
          <aside className="cvp-aside">
            <section className="cvp-block">
              <h2>{L.highlights}</h2>
              <div className="cvp-metrics">
                <div><strong>{videos}+</strong><span>{L.videosL}</span></div>
                <div><strong>{compact(views)}+</strong><span>{L.viewsL}</span></div>
                <div><strong>{compact(subs)}+</strong><span>{L.subsL}</span></div>
                <div><strong>{projects.length || 5}+</strong><span>{L.projectsL}</span></div>
                <div><strong>4</strong><span>{L.appsL}</span></div>
              </div>
            </section>

            <section className="cvp-block">
              <h2>{L.strengths}</h2>
              <ul className="cvp-list">
                {strengths.map((s) => (<li key={s}>{s}</li>))}
              </ul>
            </section>

            <section className="cvp-block">
              <h2>{L.languages}</h2>
              <ul className="cvp-langs">
                {languages.map(([lang, level]) => (
                  <li key={lang}><strong>{lang}</strong><span>{level}</span></li>
                ))}
              </ul>
            </section>
          </aside>

          <main className="cvp-main">
            <section className="cvp-block">
              <h2>{L.summary}</h2>
              <p className="cvp-summary">{summary}</p>
            </section>

            <section className="cvp-block">
              <h2>{L.experience}</h2>
              <div className="cvp-timeline">
                {experience.map((item) => (
                  <article className="cvp-exp" key={item.id}>
                    <div className="cvp-exp-head">
                      <h3>{item.role}</h3>
                      <span className="cvp-period">{item.period}</span>
                    </div>
                    <p className="cvp-org">{item.company}{item.location ? ` · ${item.location}` : ""}</p>
                    {item.description ? <p className="cvp-desc">{item.description}</p> : null}
                    {item.highlights?.length ? (
                      <ul className="cvp-tags">
                        {item.highlights.slice(0, 4).map((h) => (<li key={h}>{h}</li>))}
                      </ul>
                    ) : null}
                  </article>
                ))}
                <article className="cvp-exp">
                  <div className="cvp-exp-head">
                    <h3>MoPlayer</h3>
                    <span className="cvp-period">2024 — {L.now}</span>
                  </div>
                  <p className="cvp-org">{L.moRole}</p>
                  <p className="cvp-desc">{L.moDesc}</p>
                  <ul className="cvp-tags"><li>Android TV</li><li>Activation</li><li>Windows</li><li>iOS</li></ul>
                </article>
              </div>
            </section>

            {projects.length ? (
              <section className="cvp-block">
                <h2>{L.projects}</h2>
                <div className="cvp-projects">
                  {projects.map((p) => (
                    <div className="cvp-project" key={p.id}>
                      <strong>{p.title}</strong>
                      <span>{p.summary}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </main>
        </div>

        <footer className="cvp-footer">
          <span>{name} — {site}</span>
          <span>{L.live} · {site}</span>
        </footer>
      </div>
    </div>
  );
}
