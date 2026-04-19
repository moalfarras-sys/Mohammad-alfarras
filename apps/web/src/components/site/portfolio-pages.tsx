"use client";

import { ArrowRight, BriefcaseBusiness, Download, ExternalLink, Mail, PlayCircle, Sparkles } from "lucide-react";
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

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => {
    const rankA = typeof a.featuredRank === "number" ? a.featuredRank : 999;
    const rankB = typeof b.featuredRank === "number" ? b.featuredRank : 999;
    return rankA - rankB;
  });
}

function localeCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      home: {
        eyebrow: "الموقع الشخصي والمهني",
        title: "محمد الفراس. أبني واجهات واضحة، منتجات رقمية أقوى، وحضوراً يشرح القيمة من أول شاشة.",
        body:
          "هذا الموقع عن عملي أنا: تطوير الويب، التفكير المنتجّي، التصميم، وصناعة المحتوى التقني. MoPlayer مشروع مهم داخل هذه المنظومة، لكنه ليس هوية الموقع كلها.",
        primary: "استكشف الأعمال",
        secondary: "السيرة الذاتية",
        quickTitle: "هوية شخصية أولاً، ثم أعمال ومنتجات داخل سياق واضح.",
        quickBody:
          "الهدف هنا أن يفهم الزائر من أنا، ماذا أبني، وكيف تتحول المشاريع عندي إلى تجربة أوضح وأكثر ثقة وأقل فوضى.",
        strengths: [
          { title: "تطوير ويب حديث", body: "Next.js وواجهات سريعة وواضحة وقابلة للتوسع." },
          { title: "تفكير منتج", body: "كل صفحة يجب أن تدعم قراراً، لا أن تكون مجرد شكل جميل." },
          { title: "محتوى تقني عربي", body: "خبرة حقيقية في بناء الثقة وشرح المنتجات لجمهور عربي." },
        ],
        workEyebrow: "أعمال مختارة",
        workTitle: "الأعمال تظهر هنا كدراسات حالة ومشاريع فعلية، لا كقطع متفرقة بدون سياق.",
        workBody:
          "هذه المشاريع تشرح كيف يتحول الترتيب الصحيح والرسالة الواضحة إلى انطباع أقوى وخطوة أسهل للزائر.",
        productEyebrow: "مشروع مميز",
        productTitle: "MoPlayer موجود كمشروع ومنتج داخل موقعي، لا كبديل عن هويتي الشخصية.",
        productBody:
          "له صفحة حالة داخل الأعمال تشرح القرارات والبنية، وله صفحة منتج مستقلة على /app للتنزيل والميزات والدعم.",
        productPrimary: "صفحة المنتج",
        productSecondary: "دراسة الحالة",
        mediaEyebrow: "المحتوى واليوتيوب",
        mediaTitle: "المحتوى هنا يثبت الثقة ويدعم الهوية، ولا يملأ المساحة فقط.",
        mediaBody:
          "قناتي التقنية جزء من البراند الشخصي لأنها تعكس نفس أسلوب العمل: شرح واضح، ترتيب أفضل، وحضور صادق.",
        mediaPrimary: "اذهب إلى YouTube",
        contactTitle: "إذا كان لديك مشروع يحتاج ترتيباً أوضح وصورة أقوى، فلنبدأ بشكل صحيح.",
        contactBody:
          "أعمل على المواقع، دراسات الحالة، صفحات الإطلاق، والمنتجات التي تحتاج رسالة أقوى وتنفيذاً أنظف.",
        contactPrimary: "تواصل",
      },
      cv: {
        eyebrow: "السيرة الذاتية",
        title: "خلاصة المسار والخبرة وطريقة العمل، بدون تكرار شكل الصفحة الرئيسية.",
        body:
          "هذه الصفحة مخصصة للسيرة الذاتية: الخبرة، المبادئ، الشهادات، وروابط التحميل. هي طبقة مرجعية مهنية، وليست نسخة ثانية من الصفحة الرئيسية.",
        principlesTitle: "طريقة العمل",
        principles: [
          "الوضوح قبل الزخرفة",
          "بنية تتحمل التعديل ولا تنهار بسرعة",
          "ربط الواجهة بالقرار التجاري",
          "جمال بصري مع أداء فعلي سريع",
        ],
        downloadsTitle: "تحميل السيرة الذاتية",
        downloadsBody: "النسخة المصممة والنسخة المختصرة متاحتان هنا بشكل واضح ومنفصل.",
        branded: "تحميل النسخة المصممة",
        ats: "تحميل النسخة المختصرة",
        experience: "الخبرة العملية",
        certifications: "الشهادات",
      },
      work: {
        eyebrow: "الأعمال والمشاريع",
        title: "كل صفحة مشروع هنا لها غرض واضح: تحدٍ، حل، ونتيجة.",
        body:
          "أعرض المشاريع كدراسات حالة ومشاريع منتجية ضمن نفس المنظومة. MoPlayer هنا مشروع مهم، لكن ليس محور الهوية العامة للموقع.",
        caseStudy: "دراسة الحالة",
        productPage: "صفحة المنتج",
        repo: "المصدر",
      },
      project: {
        challenge: "التحدي",
        solution: "الحل",
        result: "النتيجة",
        metrics: "مؤشرات سريعة",
        gallery: "المعرض",
        product: "اذهب إلى صفحة المنتج",
        visit: "زيارة الرابط",
        contact: "ابدأ مشروعاً مشابهاً",
      },
      youtube: {
        eyebrow: "يوتيوب والمحتوى",
        title: "طبقة المحتوى هنا تدعم البراند الشخصي وتثبت الخبرة بصوت واضح.",
        body:
          "المحتوى التقني العربي جزء من هذا الموقع لأنه يكشف طريقة التفكير والشرح، وليس لأنه صفحة منفصلة بلا معنى.",
        featured: "الفيديو المميز",
        latest: "أحدث الفيديوهات",
        channel: "افتح القناة",
      },
      contact: {
        eyebrow: "تواصل مباشر",
        title: "إذا وصلت إلى هنا فالغالب أنك تحتاج عملاً مرتباً وواضحاً، وهذا ممتاز.",
        body:
          "أرسل الفكرة كما هي. دوري أن أعيدها لك بشكل أوضح، مع خطوة عملية أقرب للتنفيذ.",
        primary: "ابدأ التواصل",
      },
      privacy: {
        eyebrow: "الخصوصية",
        title: "سياسة خصوصية واضحة ومباشرة.",
        body:
          "هذه النسخة المحلية من صفحة الخصوصية داخل الموقع العام. للوصول العام المعتمد استخدم صفحة /privacy.",
        cta: "افتح صفحة الخصوصية العامة",
      },
    };
  }

  return {
    home: {
      eyebrow: "Personal and professional website",
      title: "Mohammad Alfarras. I build clearer interfaces, stronger digital products, and brand presence that explains value quickly.",
      body:
        "This website is about my work: web development, product thinking, interface design, and Arabic tech content. MoPlayer is one important project in that ecosystem, not the identity of the whole site.",
      primary: "Explore work",
      secondary: "CV",
      quickTitle: "Personal identity first, then projects and products in the right hierarchy.",
      quickBody:
        "The goal here is immediate clarity: who I am, what I build, and how the work turns into stronger digital presence with less friction.",
      strengths: [
        { title: "Modern web development", body: "Next.js, clean structure, and interfaces that stay fast under change." },
        { title: "Product thinking", body: "Every page should support a decision, not just decorate the screen." },
        { title: "Arabic tech content", body: "Real experience explaining products and building trust with an Arabic audience." },
      ],
      workEyebrow: "Selected work",
      workTitle: "Projects here are structured as actual work, not disconnected visual fragments.",
      workBody:
        "Each case study explains the shift in clarity, trust, and action instead of just showing polished screenshots.",
      productEyebrow: "Featured product",
      productTitle: "MoPlayer lives here as a product and case study, not as a replacement for the site identity.",
      productBody:
        "It has a case-study page inside Work and a dedicated /app product page for downloads, features, and support.",
      productPrimary: "Product page",
      productSecondary: "Case study",
      mediaEyebrow: "Content and YouTube",
      mediaTitle: "The content layer strengthens the brand because it proves credibility.",
      mediaBody:
        "My Arabic tech content belongs here because it reflects the same principles as the product work: clarity, explanation, and trust.",
      mediaPrimary: "Open YouTube",
      contactTitle: "If your project needs a stronger story, cleaner structure, or sharper presentation, let’s fix it properly.",
      contactBody:
        "I work on websites, launch pages, case-study-driven presentation, and product surfaces that need stronger clarity.",
      contactPrimary: "Get in touch",
    },
    cv: {
      eyebrow: "CV",
      title: "A focused professional view of the experience, methods, and downloads without repeating the homepage.",
      body:
        "This page is reserved for the CV layer: experience, principles, certifications, and downloadable versions. It should support professional review, not duplicate the home hero.",
      principlesTitle: "Working principles",
      principles: [
        "Clarity before decoration",
        "Structure that survives change",
        "Product thinking tied to business outcomes",
        "Visual quality with real performance",
      ],
      downloadsTitle: "Download CV",
      downloadsBody: "Both the designed and concise versions live here in one clear place.",
      branded: "Download designed CV",
      ats: "Download concise CV",
      experience: "Professional experience",
      certifications: "Certifications",
    },
    work: {
      eyebrow: "Work and projects",
      title: "Each project page here has one role: challenge, solution, and result.",
      body:
        "The structure is intentionally simple. MoPlayer appears as one major product project within the portfolio, not as the public identity of the site.",
      caseStudy: "Case study",
      productPage: "Product page",
      repo: "Source",
    },
    project: {
      challenge: "Challenge",
      solution: "Solution",
      result: "Result",
      metrics: "Quick metrics",
      gallery: "Gallery",
      product: "Open product page",
      visit: "Visit link",
      contact: "Start a similar project",
    },
    youtube: {
      eyebrow: "YouTube and content",
      title: "The content layer supports the brand and shows how the thinking translates into public communication.",
      body:
        "This is where product explanation, audience trust, and Arabic creator work come together inside the same ecosystem.",
      featured: "Featured video",
      latest: "Latest videos",
      channel: "Open channel",
    },
    contact: {
      eyebrow: "Direct contact",
      title: "If you reached this page, you probably need the work to become clearer and more persuasive.",
      body:
        "Send the idea as it is. My role is to return it as a cleaner, more actionable next step.",
      primary: "Start the conversation",
    },
    privacy: {
      eyebrow: "Privacy",
      title: "A short, clear privacy layer.",
      body: "The canonical public privacy policy is available on the global /privacy route.",
      cta: "Open public privacy page",
    },
  };
}

export function PortfolioHomePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).home;
  const featuredProjects = sortedProjects(model).slice(0, 3);
  const moPlayer = model.projects.find((project) => project.slug === "moplayer");

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] md:p-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          {sectionEyebrow(copy.eyebrow)}
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black leading-[1.05] text-foreground md:text-6xl">{copy.title}</h1>
            <p className="max-w-3xl text-base leading-8 text-foreground-muted md:text-lg">{copy.body}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${model.locale}/work`} className="button-primary-shell">{copy.primary}</Link>
            <Link href={`/${model.locale}/cv`} className="button-secondary-shell">{copy.secondary}</Link>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[18rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/20">
            <Image src={model.portraitImage} alt={model.profile.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 28vw" />
          </div>
          <div className="grid gap-4">
            <article className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-xl font-black text-foreground">{copy.quickTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-foreground-muted">{copy.quickBody}</p>
            </article>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {copy.strengths.map((item) => (
                <article key={item.title} className="rounded-[1.4rem] border border-white/10 bg-black/15 p-4">
                  <h3 className="text-sm font-black text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-frame space-y-4 rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
        {sectionEyebrow(copy.workEyebrow)}
        <div>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">{copy.workTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted md:text-base">{copy.workBody}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <article key={project.id} className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
              <div className="relative aspect-[16/11]">
                <Image src={project.image} alt={project.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">{project.eyebrow || project.title}</span>
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
              <Link href="/app" className="button-primary-shell">{copy.productPrimary}</Link>
              <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">{copy.productSecondary}</Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section-frame grid gap-6 rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          {sectionEyebrow(copy.mediaEyebrow)}
          <h2 className="text-3xl font-black text-foreground md:text-4xl">{copy.mediaTitle}</h2>
          <p className="max-w-3xl text-sm leading-7 text-foreground-muted md:text-base">{copy.mediaBody}</p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/${model.locale}/youtube`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
              <PlayCircle className="h-4 w-4" />
              {copy.mediaPrimary}
            </Link>
            <Link href={`/${model.locale}/contact`} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
              <Mail className="h-4 w-4" />
              {copy.contactPrimary}
            </Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {model.latestVideos.slice(0, 2).map((video) => (
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
        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="max-w-3xl text-3xl font-black text-foreground md:text-4xl">{copy.contactTitle}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground-muted md:text-base">{copy.contactBody}</p>
          </div>
          <Link href={`/${model.locale}/contact`} className="button-primary-shell">{copy.contactPrimary}</Link>
        </div>
      </section>
    </div>
  );
}

export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).cv;

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8">
        {sectionEyebrow(copy.eyebrow)}
        <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-4">
            <h1 className="max-w-4xl text-4xl font-black leading-[1.08] text-foreground md:text-5xl">{copy.title}</h1>
            <p className="max-w-3xl text-sm leading-8 text-foreground-muted md:text-base">{copy.body}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={model.downloads.branded} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
                <Download className="h-4 w-4" />
                {copy.branded}
              </Link>
              <Link href={model.downloads.ats} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-foreground transition hover:bg-white/10">
                <Download className="h-4 w-4" />
                {copy.ats}
              </Link>
            </div>
          </div>
          <div className="grid gap-3">
            <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <h2 className="text-lg font-black text-foreground">{copy.principlesTitle}</h2>
              <ul className="mt-4 grid gap-3">
                {copy.principles.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-[1.15rem] border border-white/10 bg-black/15 px-4 py-3 text-sm leading-7 text-foreground-muted">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-[1.5rem] border border-white/10 bg-black/15 p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                  <Image src={model.portraitImage} alt={model.profile.name} fill className="object-cover" sizes="64px" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{model.profile.name}</h3>
                  <p className="text-sm text-foreground-muted">{model.profile.subtitle}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section-frame rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-foreground">{copy.experience}</h2>
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
          <h2 className="text-2xl font-black text-foreground">{copy.certifications}</h2>
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
  const copy = localeCopy(model.locale).work;
  const projects = sortedProjects(model);

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
                    {copy.productPage}
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

  const copy = localeCopy(model.locale).project;
  const isMoPlayer = project.slug === "moplayer";
  const gallery = project.gallery?.length ? [...new Set(project.gallery)] : [project.image];

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
        <div className="space-y-4">
          {sectionEyebrow(project.eyebrow || (isMoPlayer ? "Product case study" : "Project case study"))}
          <h1 className="text-4xl font-black leading-[1.06] text-foreground md:text-5xl">{project.title}</h1>
          <p className="max-w-3xl text-sm leading-8 text-foreground-muted md:text-base">{project.description || project.summary}</p>
          <div className="flex flex-wrap gap-3">
            {isMoPlayer ? (
              <Link href="/app" className="button-primary-shell">{copy.product}</Link>
            ) : project.href ? (
              <Link href={project.href} className="button-primary-shell">{copy.visit}</Link>
            ) : null}
            <Link href={`/${model.locale}/contact`} className="button-secondary-shell">{copy.contact}</Link>
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

export function PortfolioYoutubePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).youtube;
  const featured = model.featuredVideo ?? model.latestVideos[0] ?? null;

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8">
        {sectionEyebrow(copy.eyebrow)}
        <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[1.08] text-foreground md:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-foreground-muted md:text-base">{copy.body}</p>
      </section>

      {featured ? (
        <section className="section-frame grid gap-5 rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative aspect-video overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/20">
            <Image src={featured.thumbnail} alt={featured.title_en || featured.youtube_id} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
          </div>
          <div className="space-y-4">
            {sectionEyebrow(copy.featured)}
            <h2 className="text-3xl font-black text-foreground md:text-4xl">
              {model.locale === "ar" ? featured.title_ar || featured.title_en : featured.title_en || featured.title_ar}
            </h2>
            <p className="text-sm leading-7 text-foreground-muted">
              {model.locale === "ar" ? featured.description_ar || featured.description_en : featured.description_en || featured.description_ar}
            </p>
            <Link href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noopener noreferrer" className="button-primary-shell">
              {copy.channel}
            </Link>
          </div>
        </section>
      ) : null}

      <section className="section-frame rounded-[2rem] border border-white/10 bg-black/10 p-6 md:p-8">
        <h2 className="text-2xl font-black text-foreground">{copy.latest}</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {model.latestVideos.slice(0, 6).map((video) => (
            <article key={video.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
              <div className="relative aspect-video">
                <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <div className="space-y-2 p-4">
                <h3 className="line-clamp-2 text-base font-black text-foreground">
                  {model.locale === "ar" ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                </h3>
                <p className="line-clamp-3 text-sm leading-7 text-foreground-muted">
                  {model.locale === "ar" ? video.description_ar || video.description_en : video.description_en || video.description_ar}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function PortfolioContactPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).contact;

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8">
        {sectionEyebrow(copy.eyebrow)}
        <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[1.08] text-foreground md:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-foreground-muted md:text-base">{copy.body}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`mailto:${model.contact.emailAddress}`} className="button-primary-shell">{copy.primary}</a>
          <a href={model.contact.whatsappUrl} target="_blank" rel="noopener noreferrer" className="button-secondary-shell">WhatsApp</a>
        </div>
      </section>

      <section className="section-frame grid gap-4 lg:grid-cols-2">
        {model.contact.channels.map((channel) => (
          <article key={channel.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-black text-foreground">{channel.label}</h2>
            <p className="mt-2 text-sm leading-7 text-foreground-muted">{channel.description}</p>
            <div className="mt-4">
              <a href={channel.value} className="text-sm font-bold text-primary hover:underline">
                {channel.type === "email" ? model.contact.emailAddress : channel.value}
              </a>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export function PortfolioPrivacyPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).privacy;

  return (
    <div className="space-y-6 px-3 pb-12 pt-4 md:px-6 md:pb-16">
      <section className="section-frame rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-6 md:p-8">
        {sectionEyebrow(copy.eyebrow)}
        <h1 className="mt-4 max-w-5xl text-4xl font-black leading-[1.08] text-foreground md:text-5xl">{copy.title}</h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-foreground-muted md:text-base">{copy.body}</p>
        <div className="mt-6">
          <Link href="/privacy" className="button-primary-shell">{copy.cta}</Link>
        </div>
      </section>
    </div>
  );
}
