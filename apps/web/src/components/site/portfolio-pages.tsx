import {
  ArrowRight,
  BriefcaseBusiness,
  Download,
  ExternalLink,
  PlayCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { SiteViewModel } from "@/components/site/site-view-client";
import type { Locale } from "@/types/cms";

function caseStudyHref(locale: Locale, slug: string) {
  return `/${locale}/work/${slug}`;
}

function sectionEyebrow(text: string) {
  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.28em] text-primary">
      {text}
    </span>
  );
}

function sortProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => {
    const rankA = typeof a.featuredRank === "number" ? a.featuredRank : 999;
    const rankB = typeof b.featuredRank === "number" ? b.featuredRank : 999;
    return rankA - rankB;
  });
}

function homeCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      heroEyebrow: "الموقع الشخصي والمهني",
      title: "محمد الفراس. أطور منتجات رقمية، أصمم واجهات أقوى، وأبني حضوراً يشرح القيمة بوضوح.",
      body:
        "هذا الموقع عني وعن طريقتي في العمل: تطوير الويب، التفكير المنتجّي، التصميم، والمحتوى التقني. MoPlayer جزء مهم من أعمالي، لكنه ليس هوية الموقع كلها.",
      primary: "استكشف الأعمال",
      secondary: "عنّي",
      trustTitle: "أبني واجهات أسرع فهماً وأكثر ثقة.",
      trustBody:
        "خلفيتي تجمع بين ضغط التشغيل اليومي، الانضباط العملي، والاهتمام البصري. لذلك يهمني أن يبدو العمل قوياً وأن يبقى واضحاً عندما يبدأ الناس باستخدامه فعلاً.",
      strengths: [
        { title: "تطوير ويب حديث", body: "Next.js، React، وواجهات واضحة التركيب وسريعة التحميل." },
        { title: "تفكير منتج", body: "أتعامل مع كل صفحة كأداة قرار، لا كقطعة عرض جميلة فقط." },
        { title: "محتوى وصوت تقني", body: "خبرة حقيقية في شرح المنتجات وبناء الثقة مع جمهور عربي." },
      ],
      workEyebrow: "أعمال مختارة",
      workTitle: "الموقع يعود لعرضي أنا أولاً، ثم يعرض المنتجات والمشاريع ضمن السياق الصحيح.",
      workBody: "هذه مشاريع ومنتجات مختارة توضح كيف أفكر، وكيف يتحول التصميم والتنفيذ إلى حضور رقمي أوضح وأقوى.",
      productEyebrow: "منتج مميز",
      productTitle: "MoPlayer منتج داخل منظومتي، وليس هوية الموقع.",
      productBody:
        "قدّمت MoPlayer هنا كمشروع ومنتج واضحين: صفحة حالة داخل الأعمال تشرح القرار والبنية، وصفحة منتج مستقلة على /app للتنزيل والدعم.",
      productPrimary: "صفحة المنتج",
      productSecondary: "دراسة الحالة",
      channelEyebrow: "يوتيوب والمحتوى",
      channelTitle: "المحتوى جزء من البراند، لأنه يثبت الثقة لا لأنه يملأ الصفحة.",
      channelBody:
        "قناتي التقنية تعكس أسلوبي في التبسيط، الشرح، وبناء الثقة. لذلك تظهر هنا كطبقة داعمة لهويتي المهنية، لا كمسار منفصل بلا علاقة.",
      channelCta: "اذهب إلى YouTube",
      contactEyebrow: "ابدأ من هنا",
      contactTitle: "إذا كانت لديك فكرة تحتاج وضوحاً أفضل أو حضوراً أقوى، فلنرتبها بشكل صحيح.",
      contactBody: "أعمل على المواقع، الواجهات، صفحات الإطلاق، ودراسات الحالة التي تحتاج ترتيباً أفضل ورسالة أوضح.",
      contactCta: "تواصل",
    };
  }

  return {
    heroEyebrow: "Personal and professional website",
    title: "Mohammad Alfarras. I build digital products, sharper interfaces, and brand presence that explains value fast.",
    body:
      "This website is about me and the way I work: web development, product thinking, interface design, and Arabic tech content. MoPlayer is one important product in that body of work, not the identity of the site itself.",
    primary: "Explore work",
    secondary: "About me",
    trustTitle: "I build interfaces that feel clearer, faster, and more credible.",
    trustBody:
      "My background combines operational pressure, product discipline, and visual control. The result is work that looks strong on the surface and stays structured when people actually use it.",
    strengths: [
      { title: "Modern web development", body: "Next.js, React, and fast interfaces with stronger information hierarchy." },
      { title: "Product framing", body: "Every page should support a decision, not just decorate a screen." },
      { title: "Creator-led communication", body: "Real experience explaining products and building trust with an Arabic audience." },
    ],
    workEyebrow: "Selected work",
    workTitle: "The site is about my work again, with products and projects shown in the right hierarchy.",
    workBody: "These selected projects show how strategy, design, and implementation come together to improve clarity, trust, and action.",
    productEyebrow: "Featured product",
    productTitle: "MoPlayer is part of the portfolio, not a replacement for it.",
    productBody:
      "MoPlayer now lives in two clean layers: a case study inside Work that explains the product thinking, and a dedicated /app product page for downloads, features, and support.",
    productPrimary: "Open product page",
    productSecondary: "Read case study",
    channelEyebrow: "Content and YouTube",
    channelTitle: "The content layer strengthens the brand because it proves trust, not because it fills space.",
    channelBody:
      "My Arabic tech content reflects the same principles as the product work: clarity, direct explanation, and a cleaner narrative around products and digital experiences.",
    channelCta: "Open YouTube",
    contactEyebrow: "Direct contact",
    contactTitle: "If you need a stronger digital presence or a sharper product story, let’s structure it properly.",
    contactBody: "I work on websites, launch pages, interface systems, and case-study-led product presentation.",
    contactCta: "Get in touch",
  };
}

function aboutCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      eyebrow: "عنّي",
      title: "موقعي الشخصي يجب أن يشرح من أنا، كيف أعمل، وما الذي يميز طريقتي في البناء.",
      body:
        "أتعامل مع الويب كمساحة تجمع بين الرسالة، المنتج، والإيقاع البصري. خلفيتي في التشغيل واللوجستيات جعلتني أقدّر الترتيب والاعتمادية، وخبرتي في التصميم والمحتوى أضافت طبقة أوضح من الثقة.",
      principlesTitle: "أركان طريقتي",
      principles: [
        "وضوح الرسالة قبل الزخرفة",
        "بنية قابلة للتوسع لا صفحة تنهار عند أول تعديل",
        "تفكير منتج يربط الواجهة بالقرار التجاري",
        "حسّ بصري مع أداء فعلي سريع",
      ],
      experienceTitle: "الخبرة العملية",
      certsTitle: "شهادات وطبقات دعم",
      downloadTitle: "السيرة الذاتية",
      downloadBody: "إذا كنت تحتاج النسخة المختصرة أو النسخة المصممة، كلاهما متاح هنا داخل صفحة About وليس كهوية منفصلة للموقع.",
      branded: "تحميل CV المصمم",
      ats: "تحميل CV المختصر",
    };
  }

  return {
    eyebrow: "About",
    title: "My personal site should explain who I am, how I work, and what makes the execution different.",
    body:
      "I approach the web as a place where message, product thinking, and visual rhythm have to support each other. Operations taught me sequence and reliability. Design and creator work gave that discipline a sharper voice.",
    principlesTitle: "Working principles",
    principles: [
      "Clarity before decoration",
      "Structure that survives real project change",
      "Product thinking tied to business outcomes",
      "Visual control with fast performance",
    ],
    experienceTitle: "Professional experience",
    certsTitle: "Supporting credentials",
    downloadTitle: "CV",
    downloadBody: "The downloadable versions live here inside About, where they belong, instead of acting as the identity of the whole website.",
    branded: "Download designed CV",
    ats: "Download concise CV",
  };
}

function workCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      eyebrow: "الأعمال والمشاريع",
      title: "كل مشروع هنا له دور واضح: إما تجربة عميل، أو منتج، أو دراسة حالة تشرح كيف تم اتخاذ القرار.",
      body:
        "أعرض الأعمال هنا بطريقة تسهل القراءة: ما المشكلة، ما الذي تغير، وما النتيجة. MoPlayer يظهر كمشروع ومنتج داخل السياق الصحيح، لا كهوية الموقع العامة.",
      caseStudy: "دراسة الحالة",
      liveProduct: "صفحة المنتج",
      repo: "المصدر",
    };
  }

  return {
    eyebrow: "Work and projects",
    title: "Every project here has one clear role: client work, product work, or a case study that explains the decision behind it.",
    body:
      "The structure is intentionally simple: what the problem was, what changed, and what the result became. MoPlayer sits here as one major project, not as the entire site identity.",
    caseStudy: "Case study",
    liveProduct: "Product page",
    repo: "Source",
  };
}

function projectCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      challenge: "التحدي",
      solution: "الحل",
      result: "النتيجة",
      gallery: "المعرض",
      metrics: "مؤشرات سريعة",
      product: "اذهب إلى صفحة المنتج",
      visit: "زيارة الرابط",
      contact: "اطلب مشروعاً مشابهاً",
    };
  }

  return {
    challenge: "Challenge",
    solution: "Solution",
    result: "Result",
    gallery: "Gallery",
    metrics: "Quick metrics",
    product: "Open product page",
    visit: "Visit link",
    contact: "Start a similar project",
  };
}

export function PortfolioHomePage({ model }: { model: SiteViewModel }) {
  const copy = homeCopy(model.locale);
  const featuredProjects = sortProjects(model).slice(0, 3);
  const moPlayer = model.projects.find((project) => project.slug === "moplayer");
  const stats = [
    {
      label: model.locale === "ar" ? "مشتركو يوتيوب" : "YouTube subscribers",
      value: typeof model.live.youtube?.subscribers === "number" ? `${Math.round(model.live.youtube.subscribers / 100) / 10}K+` : "6K+",
    },
    {
      label: model.locale === "ar" ? "مشاهدات القناة" : "Channel views",
      value:
        typeof model.live.youtube?.totalViews === "number"
          ? `${Math.round(model.live.youtube.totalViews / 100000) / 10}M+`
          : "1.5M+",
    },
    {
      label: model.locale === "ar" ? "مشاريع مختارة" : "Selected projects",
      value: `${featuredProjects.length}+`,
    },
  ];

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-5">
          {sectionEyebrow(copy.heroEyebrow)}
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] text-foreground md:text-6xl">
              {copy.title}
            </h1>
            <p className="max-w-3xl text-base leading-8 text-foreground-muted md:text-lg">
              {copy.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${model.locale}/work`} className="button-primary-shell">
              {copy.primary}
            </Link>
            <Link href={`/${model.locale}/about`} className="button-secondary-shell">
              {copy.secondary}
            </Link>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.75rem] border border-white/10 bg-black/15 p-4">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <UserRound className="h-5 w-5 text-primary" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-foreground">{copy.trustTitle}</h2>
              </div>
            </div>
            <p className="text-sm leading-7 text-foreground-muted">{copy.trustBody}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-2xl font-black text-foreground">{stat.value}</div>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-foreground-soft">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-frame space-y-4 rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
        {sectionEyebrow(copy.workEyebrow)}
        <div className="grid gap-3 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="text-3xl font-black text-foreground md:text-4xl">{copy.workTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted md:text-base">{copy.workBody}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {copy.strengths.map((item) => (
              <article key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-black text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-foreground-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <article key={project.id} className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
              <div className="relative aspect-[16/11]">
                <Image src={project.image} alt={project.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{project.eyebrow ?? "Project"}</span>
                  {project.slug === "moplayer" ? (
                    <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                      Product
                    </span>
                  ) : null}
                </div>
                <h3 className="text-xl font-black text-foreground">{project.title}</h3>
                <p className="text-sm leading-7 text-foreground-muted">{project.summary}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={caseStudyHref(model.locale, project.slug)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
                    {project.slug === "moplayer" ? copy.productSecondary : project.ctaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  {project.slug === "moplayer" ? (
                    <Link href="/app" className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/15">
                      {copy.productPrimary}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {moPlayer ? (
        <section className="section-frame grid gap-5 rounded-[2rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(0,229,255,0.08),rgba(114,84,255,0.06))] p-6 md:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/20">
            <Image src={moPlayer.image} alt={moPlayer.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" />
          </div>
          <div className="space-y-4">
            {sectionEyebrow(copy.productEyebrow)}
            <h2 className="text-3xl font-black text-foreground md:text-4xl">{copy.productTitle}</h2>
            <p className="max-w-2xl text-sm leading-7 text-foreground-muted md:text-base">{copy.productBody}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/app" className="button-primary-shell">
                {copy.productPrimary}
              </Link>
              <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">
                {copy.productSecondary}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-frame grid gap-6 rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          {sectionEyebrow(copy.channelEyebrow)}
          <h2 className="text-3xl font-black text-foreground md:text-4xl">{copy.channelTitle}</h2>
          <p className="max-w-3xl text-sm leading-7 text-foreground-muted md:text-base">{copy.channelBody}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${model.locale}/youtube`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
              <PlayCircle className="h-4 w-4" />
              {copy.channelCta}
            </Link>
            <Link href={`/${model.locale}/contact`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
              <ArrowRight className="h-4 w-4" />
              {copy.contactCta}
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(model.latestVideos.slice(0, 2)).map((video) => (
            <article key={video.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
              <div className="relative aspect-video">
                <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 22vw" />
              </div>
              <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-sm font-black text-foreground">
                  {model.locale === "ar" ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                </h3>
                <p className="text-xs uppercase tracking-[0.22em] text-foreground-soft">{video.duration}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-8">
        {sectionEyebrow(copy.contactEyebrow)}
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-3xl text-3xl font-black text-foreground md:text-4xl">{copy.contactTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted md:text-base">{copy.contactBody}</p>
          </div>
          <Link href={`/${model.locale}/contact`} className="button-primary-shell">
            {copy.contactCta}
          </Link>
        </div>
      </section>
    </div>
  );
}

export function PortfolioAboutPage({ model }: { model: SiteViewModel }) {
  const copy = aboutCopy(model.locale);

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div className="space-y-4">
            {sectionEyebrow(copy.eyebrow)}
            <h1 className="max-w-4xl text-4xl font-black leading-[1.08] text-foreground md:text-5xl">{copy.title}</h1>
            <p className="max-w-3xl text-sm leading-8 text-foreground-muted md:text-base">{copy.body}</p>
          </div>
          <div className="relative aspect-[4/4.5] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20">
            <Image src={model.portraitImage} alt={model.profile.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 35vw" />
          </div>
        </div>
      </section>

      <section className="section-frame grid gap-4 rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xl font-black text-foreground">{copy.principlesTitle}</h2>
          <ul className="mt-4 grid gap-3">
            {copy.principles.map((item) => (
              <li key={item} className="flex items-start gap-3 rounded-[1.15rem] border border-white/10 bg-black/15 px-4 py-3 text-sm leading-7 text-foreground-muted">
                <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xl font-black text-foreground">{copy.downloadTitle}</h2>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{copy.downloadBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={model.downloads.branded} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
              <Download className="h-4 w-4" />
              {copy.branded}
            </Link>
            <Link href={model.downloads.ats} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
              <Download className="h-4 w-4" />
              {copy.ats}
            </Link>
          </div>
        </article>
      </section>

      <section className="section-frame rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-foreground">{copy.experienceTitle}</h2>
        <div className="mt-5 grid gap-4">
          {model.cvExperience.map((item) => (
            <article key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-black text-foreground">{item.role}</h3>
                  <p className="mt-1 text-sm font-semibold text-primary">{item.company}</p>
                </div>
                <div className="text-sm text-foreground-soft">
                  <div>{item.period}</div>
                  <div>{item.location}</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground-muted">{item.description}</p>
              {item.highlights.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.highlights.map((highlight) => (
                    <span key={highlight} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-foreground-soft">
                      {highlight}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      {model.certifications.length ? (
        <section className="section-frame rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
          <h2 className="text-2xl font-black text-foreground">{copy.certsTitle}</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {model.certifications.map((item) => (
              <article key={item.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-lg font-black text-foreground">{item.name}</h3>
                <p className="mt-1 text-sm font-semibold text-primary">{item.issuer}</p>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{item.description}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-foreground-soft">{item.issueDate}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function PortfolioWorkPage({ model }: { model: SiteViewModel }) {
  const copy = workCopy(model.locale);
  const projects = sortProjects(model);

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8">
        {sectionEyebrow(copy.eyebrow)}
        <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[1.08] text-foreground md:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-foreground-muted md:text-base">{copy.body}</p>
      </section>

      <section className="section-frame grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <article key={project.id} className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
            <div className="relative aspect-[16/10]">
              <Image src={project.image} alt={project.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
            <div className="space-y-4 p-5 md:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
                  {project.slug === "moplayer" ? "Product" : "Case study"}
                </span>
                {(project.tags ?? []).slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground-soft">
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">{project.title}</h2>
                <p className="mt-3 text-sm leading-7 text-foreground-muted">{project.description || project.summary}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={caseStudyHref(model.locale, project.slug)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
                  <BriefcaseBusiness className="h-4 w-4" />
                  {copy.caseStudy}
                </Link>
                {project.slug === "moplayer" ? (
                  <Link href="/app" className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/15">
                    <Download className="h-4 w-4" />
                    {copy.liveProduct}
                  </Link>
                ) : null}
                {project.repoUrl ? (
                  <Link href={project.repoUrl} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
                    <ExternalLink className="h-4 w-4" />
                    {copy.repo}
                  </Link>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export function PortfolioProjectPage({ model, slug }: { model: SiteViewModel; slug: string }) {
  const project = model.projects.find((entry) => entry.slug === slug);
  if (!project) return null;

  const copy = projectCopy(model.locale);
  const isMoPlayer = project.slug === "moplayer";
  const gallery = project.gallery?.length ? project.gallery : [project.image];

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="space-y-4">
          {sectionEyebrow(project.eyebrow ?? (isMoPlayer ? "Product case study" : "Project case study"))}
          <h1 className="text-4xl font-black leading-[1.06] text-foreground md:text-5xl">{project.title}</h1>
          <p className="max-w-3xl text-sm leading-8 text-foreground-muted md:text-base">{project.description || project.summary}</p>
          <div className="flex flex-wrap gap-3">
            {isMoPlayer ? (
              <Link href="/app" className="button-primary-shell">
                {copy.product}
              </Link>
            ) : project.href ? (
              <Link href={project.href} className="button-primary-shell">
                {copy.visit}
              </Link>
            ) : null}
            <Link href={`/${model.locale}/contact`} className="button-secondary-shell">
              {copy.contact}
            </Link>
          </div>
        </div>
        <div className="relative aspect-[16/11] overflow-hidden rounded-[1.8rem] border border-white/10 bg-black/20">
          <Image src={project.image} alt={project.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
        </div>
      </section>

      <section className="section-frame grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-black text-foreground">{copy.challenge}</h2>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{project.challenge}</p>
        </article>
        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-black text-foreground">{copy.solution}</h2>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{project.solution}</p>
        </article>
        <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-black text-foreground">{copy.result}</h2>
          <p className="mt-3 text-sm leading-7 text-foreground-muted">{project.result}</p>
        </article>
      </section>

      {project.metrics?.length ? (
        <section className="section-frame rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
          <h2 className="text-2xl font-black text-foreground">{copy.metrics}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {project.metrics.map((metric) => (
              <article key={`${metric.label}-${metric.value}`} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-3xl font-black text-foreground">{metric.value}</div>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-foreground-soft">{metric.label}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-frame rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-foreground">{copy.gallery}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {gallery.slice(0, 4).map((image, index) => (
            <div key={`${image}-${index}`} className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
              <Image src={image} alt={`${project.title} ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
