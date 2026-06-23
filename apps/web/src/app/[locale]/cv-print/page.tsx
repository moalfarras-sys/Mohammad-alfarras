import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { buildSiteModel } from "@/components/site/site-model";
import { youtubeChannel } from "@/content/site-data";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

import "./cv-print.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Mohammad Alfarras — CV",
};

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default async function CvPrintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const ar = loc === "ar";
  const model = await buildSiteModel({ locale: loc, slug: "cv" });

  const views = Number(model.live.youtube?.totalViews ?? model.youtube.views ?? youtubeChannel.fallback.views) || youtubeChannel.fallback.views;
  const subs = Number(model.live.youtube?.subscribers ?? model.youtube.subscribers ?? youtubeChannel.fallback.subscribers) || youtubeChannel.fallback.subscribers;
  const videos = Number(model.live.youtube?.videoCount ?? model.youtube.videos ?? youtubeChannel.fallback.videos) || youtubeChannel.fallback.videos;

  const projects = model.projects.filter((p) => !/moplayer/i.test(String(p.id))).slice(0, 4);
  const experience = model.cvExperience.slice(0, 4);

  const name = ar ? "محمد الفراس" : "Mohammad Alfarras";
  const title = ar ? "مطوّر ومصمّم مواقع وتطبيقات · صانع محتوى تقني" : "Web & App Engineer · Digital Designer · Tech Creator";

  const summary = ar
    ? "مهندس واجهات ومصمّم رقمي مقيم في ألمانيا، أحوّل الأفكار والخبرات إلى مواقع وأنظمة وتطبيقات واضحة، سريعة، وقابلة للنمو. خلفية تشغيلية ولوجستية قوية، مع خبرة في بناء منتجات Android TV (MoPlayer) وصناعة محتوى تقني عربي وصل لأكثر من 1.6 مليون مشاهدة."
    : "Germany-based interface engineer and digital designer who turns ideas and expertise into clear, fast, scalable websites, systems, and apps. Strong operational and logistics background, with experience shipping Android TV products (MoPlayer) and building Arabic technical content that has reached over 1.6M views.";

  const strengths = ar
    ? ["تطوير الويب (Next.js · React · TypeScript)", "تصميم واجهات وتجربة المستخدم (UI/UX)", "تطبيقات Android / Android TV", "أنظمة إدارة محتوى ولوحات تحكم", "صناعة محتوى تقني وتسويق رقمي", "إدارة عمليات ولوجستيات"]
    : ["Web development (Next.js · React · TypeScript)", "UI/UX interface design", "Android / Android TV apps", "CMS & dashboard systems", "Technical content & digital marketing", "Operations & logistics management"];

  const languages = ar
    ? [["العربية", "اللغة الأم"], ["الألمانية", "C1 — مهني"], ["الإنجليزية", "كتابة مهنية عملية"]]
    : [["Arabic", "Native"], ["German", "C1 — Professional"], ["English", "Professional working"]];

  const email = model.contact.emailAddress || "Mohammad.Alfarras@gmail.com";
  const phone = "+49 176 23419358";
  const site = "moalfarras.space";

  const L = {
    summary: ar ? "نبذة مهنية" : "Profile",
    strengths: ar ? "المهارات الأساسية" : "Core strengths",
    languages: ar ? "اللغات" : "Languages",
    experience: ar ? "الخبرة العملية" : "Experience",
    projects: ar ? "مشاريع مختارة" : "Selected projects",
    contact: ar ? "التواصل" : "Contact",
    highlights: ar ? "أرقام تتحدث" : "By the numbers",
    videosL: ar ? "فيديو" : "Videos",
    viewsL: ar ? "مشاهدة" : "Views",
    subsL: ar ? "مشترك" : "Subscribers",
    projectsL: ar ? "مشاريع" : "Projects",
    appsL: ar ? "تطبيقات" : "Apps",
  };

  return (
    <div className="cvp-root" dir={ar ? "rtl" : "ltr"} lang={loc}>
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
            <li><span>◷</span>{ar ? "ألمانيا" : "Germany"}</li>
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
                    <span className="cvp-period">2024 — {ar ? "الآن" : "now"}</span>
                  </div>
                  <p className="cvp-org">{ar ? "منتج Android TV مخصّص" : "Custom Android TV product"}</p>
                  <p className="cvp-desc">{ar ? "تجربة منتج تجمع التشغيل، التفعيل، مصادر IPTV، والإصدارات الرسمية عبر أربع منصّات." : "A product experience connecting playback, activation, IPTV sources, and official releases across four platforms."}</p>
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
          <span>{ar ? "نسخة رقمية محدّثة" : "Live digital version"} · {site}/{loc}/cv</span>
        </footer>
      </div>
    </div>
  );
}
