"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  PlayCircle,
  Quote,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ContactForm } from "@/components/site/contact-form";
import type { SiteViewModel } from "@/components/site/site-view-model";
import type { Locale } from "@/types/cms";

/* ─────────────────────────────────────────────────────────────────────────────
 *  Helpers (creator-minimal direction)
 *  Typography-first. Thin borders. No glass, no aurora orbs, no big shadows.
 * ─────────────────────────────────────────────────────────────────────────── */

function caseStudyHref(locale: Locale, slug: string) {
  return `/${locale}/work/${slug}`;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow">{children}</span>;
}

function sortedProjects(model: SiteViewModel) {
  return [...model.projects].sort((a, b) => {
    const rankA = typeof a.featuredRank === "number" ? a.featuredRank : 999;
    const rankB = typeof b.featuredRank === "number" ? b.featuredRank : 999;
    return rankA - rankB;
  });
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  Bilingual copy (unchanged in spirit; editorial tone preserved)
 * ─────────────────────────────────────────────────────────────────────────── */

function localeCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      home: {
        eyebrow: "شخصي · مهني · بصري",
        titleLead: "أبني تجارب رقمية",
        titleAccent: "أوضح",
        titleTail: "، ومنتجات تشرح نفسها من أول شاشة.",
        body:
          "هذا موقعي أنا. تطوير الويب الحديث، التفكير المنتجي، تصميم الواجهات، وصناعة المحتوى التقني العربي. كل ما تراه هنا بُنِي بنفس المستوى الذي أقدّمه لعملائي.",
        primary: "استكشف الأعمال",
        secondary: "السيرة الذاتية",
        quickEyebrow: "باختصار",
        quickTitle: "هوية شخصية أولاً، ثم منتجات وأعمال داخل سياق واحد.",
        strengthsEyebrow: "نقاط قوة حقيقية",
        strengths: [
          { title: "تطوير ويب حديث", body: "Next.js 16، React 19، Tailwind 4، Supabase. واجهات سريعة، مرتبة، وقابلة للتطوير." },
          { title: "تفكير منتجي", body: "كل صفحة يجب أن تدعم قراراً أو تحوّل زائراً. التصميم أداة، ليس زينة." },
          { title: "محتوى يبني الثقة", body: "+1.5 مليون مشاهدة على يوتيوب التقني العربي. المحتوى يسبق المنتج دائماً." },
        ],
        statsEyebrow: "أرقام تلخّص المسار",
        stats: [
          { value: "1.5M+", label: "مشاهدة على يوتيوب" },
          { value: "6+", label: "سنوات خبرة" },
          { value: "3", label: "لغات (AR · EN · DE)" },
          { value: "DE / SY", label: "ألمانيا · من الحسكة" },
        ],
        philosophyEyebrow: "الفلسفة",
        philosophyQuote:
          "الوضوح أولاً. الجمال يخدم الوضوح. السرعة تحمي الاثنين.",
        philosophyPoints: [
          "الزائر يستحق فهم القيمة في أقل من عشر ثوانٍ.",
          "الواجهة الجميلة بدون أداء = خسارة موزونة.",
          "العربية والإنجليزية تستحقان نفس المستوى من الصقل.",
          "منتج واحد ناضج أفضل من خمس تجارب نصف جاهزة.",
        ],
        workEyebrow: "أعمال مختارة",
        workTitle: "كل مشروع هنا حلَّ مشكلة فعلية.",
        workBody: "ليس معرض صور — دراسات حالة قصيرة تشرح التحدي، التغيير البنيوي، والنتيجة.",
        productEyebrow: "المنتج البطل",
        productTitle: "MoPlayer ليس مشروعاً جانبياً.",
        productBody:
          "منتج كامل بهوية وإصدارات ودعم. تطبيق Android و Android TV لتجربة وسائط نظيفة وسريعة. تنزيل مباشر من الموقع.",
        productPrimary: "صفحة المنتج",
        productSecondary: "دراسة الحالة",
        servicesEyebrow: "ماذا أقدّم",
        servicesTitle: "خدمات قليلة، لكن كاملة الجودة.",
        services: [
          { title: "موقع شخصي أو تجاري كامل", body: "متعدد اللغات، سريع، بهوية مرتبة، قابل للتطوير. مثل هذا الموقع تماماً." },
          { title: "صفحة هبوط لإطلاق منتج", body: "صفحة واحدة قوية تشرح القيمة، تبني الثقة، وتحوّل الزائر خلال دقيقة." },
          { title: "تطبيق Android كمنتج", body: "تطبيق ناتج بكود حقيقي وهوية موحّدة مع الموقع، كما هو حال MoPlayer." },
          { title: "تعاون محتوى تقني", body: "محتوى يوتيوب يعرض المنتج بصدق ويبني ثقة الجمهور بدل الدعاية." },
        ],
        mediaEyebrow: "المحتوى التقني العربي",
        mediaTitle: "اليوتيوب جزء من البراند، لأنه يثبت طريقة التفكير قبل أي معرض أعمال.",
        mediaPrimary: "اذهب إلى يوتيوب",
        contactEyebrow: "ابدأ الحديث",
        contactTitle: "عندك مشروع يحتاج ترتيباً أوضح؟ أرسل الفكرة.",
        contactBody:
          "أعمل مع أصحاب المشاريع، الفرق الصغيرة، وصُنّاع المحتوى الذين يحتاجون قفزة في مستوى التقديم الرقمي.",
        contactPrimary: "تواصل معي",
      },
      cv: {
        eyebrow: "السيرة الذاتية",
        title: "الخبرة، طريقة العمل، والمسار — في صفحة واحدة منظمة.",
        body:
          "هذه الصفحة مخصصة للمراجعة المهنية: الخبرة، المبادئ، الشهادات، وملف قابل للتنزيل بنسختين (مصممة + مختصرة للـ ATS).",
        principlesTitle: "مبادئ العمل",
        principles: [
          "الوضوح قبل الزخرفة، دائماً.",
          "بنية تتحمّل التعديل ولا تنهار بسرعة.",
          "ربط الواجهة بقرار تجاري واضح.",
          "أداء فعلي لا يقل عن الجمال البصري.",
          "العربية والإنجليزية بنفس مستوى الصقل.",
        ],
        approachTitle: "كيف أعمل عملياً",
        approach: [
          { title: "01. استماع", body: "مكالمة 30 دقيقة. أفهم النشاط، الجمهور، والمشكلة الفعلية، ليس فقط ما يُطلب." },
          { title: "02. اقتراح", body: "ملخص قصير: ما المُخرَج، ما الذي يُحذف، وما الذي يُضاف، وكم يستغرق." },
          { title: "03. بناء", body: "تنفيذ منظَّم بمراحل واضحة وتسليم مرحلي. لا اختفاء ولا «سأرسل قريباً»." },
          { title: "04. تسليم وضمان", body: "تسليم نهائي مع توثيق، ووقت دعم لما بعد الإطلاق." },
        ],
        downloadsTitle: "تحميل السيرة الذاتية",
        branded: "تحميل النسخة المصممة",
        ats: "تحميل النسخة المختصرة (ATS)",
        experience: "الخبرة العملية",
        certifications: "الشهادات والاعتمادات",
        stackTitle: "التقنيات التي أستخدمها يومياً",
      },
      work: {
        eyebrow: "الأعمال ودراسات الحالة",
        title: "ستّ خطوات تربط بين العمل والقرار التجاري — لكل مشروع.",
        body: "كل مشروع يُعرض كدراسة حالة: التحدي، الحل، النتيجة، والميزات الأهم.",
        caseStudy: "دراسة الحالة",
        productPage: "صفحة المنتج",
        repo: "المصدر",
      },
      project: {
        challenge: "التحدي",
        solution: "الحل",
        result: "النتيجة",
        metrics: "مؤشرات",
        gallery: "المعرض",
        product: "صفحة المنتج",
        visit: "زيارة الرابط",
        contact: "ابدأ مشروعاً مشابهاً",
        nextEyebrow: "هل ترى نفسك هنا؟",
        nextTitle: "إذا كانت قصتك قريبة من هذه الحالة، أرسل الفكرة.",
      },
      youtube: {
        eyebrow: "يوتيوب · محتوى تقني عربي",
        title: "+1.5 مليون مشاهدة، +6 آلاف مشترك، و162 فيديو حقيقياً.",
        body: "القناة طبقة الثقة في البراند. تشرح المنتجات، الأدوات، وتربط الجمهور العربي بمحتوى تقني محترم.",
        featured: "الفيديو المميز",
        latest: "أحدث الفيديوهات",
        channel: "افتح القناة على يوتيوب",
      },
      contact: {
        eyebrow: "تواصل مباشر",
        title: "أرسل فكرتك. سأعود إليك خلال 24 ساعة بخطوة واضحة.",
        body:
          "لا حاجة لتجهيز ملف رسمي. اكتب ما تحتاجه بكلماتك، ودعني أعيده لك بشكل أوضح وخطوة قابلة للتنفيذ.",
        availabilityTitle: "ساعات التواصل",
        availability: [
          { label: "السبت — الخميس", value: "10:00 – 19:00 (CET)" },
          { label: "الجمعة", value: "بريد فقط" },
          { label: "زمن الرد المعتاد", value: "أقل من 24 ساعة" },
        ],
        channelsTitle: "قنوات التواصل",
        responseTitle: "ماذا تتوقع بعد الإرسال",
        responseSteps: [
          "أرد خلال 24 ساعة بسؤال أو موعد لمكالمة قصيرة.",
          "ملخص مكتوب لما فهمته من فكرتك.",
          "عرض واضح بالنطاق والسعر والزمن.",
          "بدء التنفيذ فقط عند موافقتك.",
        ],
      },
      privacy: {
        eyebrow: "الخصوصية",
        title: "سياسة خصوصية مباشرة وبدون لغة قانونية معقّدة.",
        body: "هذه نسخة موجزة. للنسخة الكاملة المعتمدة، استخدم صفحة /privacy العامة.",
        cta: "افتح سياسة الخصوصية الكاملة",
        bullets: [
          "لا نستخدم تتبعاً تطفّلياً ولا نبيع بيانات.",
          "النماذج (التواصل، الدعم) تُحفظ بقاعدة Supabase آمنة.",
          "الكوكيز محصورة في تذكّر اللغة والوضع البصري.",
        ],
      },
      apps: {
        eyebrow: "المنتجات والتطبيقات",
        title: "منظومة منتجات صغيرة، مبنية بنفس مستوى الموقع.",
        body:
          "كل تطبيق هنا يُعامل كمنتج كامل: هوية، واجهة، إصدارات، دعم. MoPlayer هو المنتج البطل الآن.",
        featuredLabel: "المنتج البطل",
        openProduct: "صفحة المنتج",
        viewCase: "دراسة الحالة",
        roadmapTitle: "ما يأتي لاحقاً",
        roadmap: [
          "تحسينات MoPlayer للهاتف وAndroid TV (الإصدار 2.x).",
          "أدوات صغيرة من الموقع كـ utilities مستقلة (PDF، CV، حاسبات).",
          "منتج مفاجأة قيد التحضير الصامت — لا إعلان قبل الجاهزية.",
        ],
      },
    } as const;
  }

  return {
    home: {
      eyebrow: "Personal · professional · visual",
      titleLead: "Building clearer",
      titleAccent: "digital experiences",
      titleTail: ", and products that explain themselves on the first screen.",
      body:
        "This site is about my work: modern web development, product thinking, interface design, and Arabic tech content. Everything you see here was built with the same standard I deliver to clients.",
      primary: "Explore work",
      secondary: "View CV",
      quickEyebrow: "The short version",
      quickTitle: "Personal identity first, then products and work inside one curated context.",
      strengthsEyebrow: "Real strengths",
      strengths: [
        { title: "Modern web development", body: "Next.js 16, React 19, Tailwind 4, Supabase. Fast, structured, scalable interfaces." },
        { title: "Product thinking", body: "Every page should support a decision or convert a visitor. Design is a tool, not decoration." },
        { title: "Content that builds trust", body: "1.5M+ Arabic tech YouTube views. The content leads the product, always." },
      ],
      statsEyebrow: "Numbers that compress the story",
      stats: [
        { value: "1.5M+", label: "YouTube views" },
        { value: "6+", label: "years of experience" },
        { value: "3", label: "languages (AR · EN · DE)" },
        { value: "DE / SY", label: "Germany · from Al-Hasakah" },
      ],
      philosophyEyebrow: "Philosophy",
      philosophyQuote: "Clarity first. Beauty serves clarity. Speed protects both.",
      philosophyPoints: [
        "A visitor deserves to understand the value in under ten seconds.",
        "A beautiful interface without performance is a measured loss.",
        "Arabic and English deserve the same level of polish.",
        "One mature product beats five half-finished experiments.",
      ],
      workEyebrow: "Selected work",
      workTitle: "Each project here solved a real problem.",
      workBody: "Not a screenshot gallery — short case studies that explain the challenge, the structural shift, and the outcome.",
      productEyebrow: "Headline product",
      productTitle: "MoPlayer is not a side project.",
      productBody:
        "A complete product with identity, releases, and support. An Android + Android TV app for a clean, fast media experience. Direct download from the site.",
      productPrimary: "Product page",
      productSecondary: "Case study",
      servicesEyebrow: "What I offer",
      servicesTitle: "Few services, but each one fully owned.",
      services: [
        { title: "Personal / business website", body: "Multilingual, fast, well-structured identity, ready to scale. Exactly like this one." },
        { title: "Product launch landing page", body: "One strong page that explains the value, builds trust, and converts within the first minute." },
        { title: "Android app as a real product", body: "A native Android app shipped with the same identity as the site, the way MoPlayer is built." },
        { title: "Tech content collaboration", body: "YouTube content that presents the product honestly and earns trust instead of pushing ads." },
      ],
      mediaEyebrow: "Arabic tech content",
      mediaTitle: "YouTube is part of the brand because it proves the thinking before any portfolio could.",
      mediaPrimary: "Open YouTube",
      contactEyebrow: "Start the conversation",
      contactTitle: "Have a project that needs cleaner structure? Send the idea.",
      contactBody:
        "I work with founders, small teams, and creators who need a real lift in their digital presentation.",
      contactPrimary: "Get in touch",
    },
    cv: {
      eyebrow: "Curriculum vitæ",
      title: "Experience, working principles, and career path — in one structured page.",
      body:
        "This page is built for professional review: experience, principles, certifications, and a downloadable CV in two variants (designed + ATS).",
      principlesTitle: "Working principles",
      principles: [
        "Clarity before decoration, always.",
        "Structure that survives change without breaking.",
        "Interfaces tied to real business decisions.",
        "Real performance is non-negotiable next to visual quality.",
        "Arabic and English at the same level of polish.",
      ],
      approachTitle: "How I actually work",
      approach: [
        { title: "01. Listen", body: "30-minute call. I learn the business, audience, and the real problem — not just what's being asked." },
        { title: "02. Propose", body: "A short brief: what's delivered, what's removed, what's added, and how long it takes." },
        { title: "03. Build", body: "Phased execution with milestone deliveries. No disappearing, no 'I'll send it soon'." },
        { title: "04. Ship & support", body: "Final delivery with documentation, plus a post-launch support window." },
      ],
      downloadsTitle: "Download the CV",
      branded: "Download designed CV",
      ats: "Download concise CV (ATS)",
      experience: "Professional experience",
      certifications: "Certifications & credentials",
      stackTitle: "Stack I use daily",
    },
    work: {
      eyebrow: "Work & case studies",
      title: "Six steps that connect the work to a business decision — for every project.",
      body: "Each project is presented as a case study: challenge, solution, outcome, and the most important features.",
      caseStudy: "Case study",
      productPage: "Product page",
      repo: "Source",
    },
    project: {
      challenge: "Challenge",
      solution: "Solution",
      result: "Result",
      metrics: "Metrics",
      gallery: "Gallery",
      product: "Product page",
      visit: "Open link",
      contact: "Start a similar project",
      nextEyebrow: "See yourself in this?",
      nextTitle: "If your story is close to this case, send the idea.",
    },
    youtube: {
      eyebrow: "YouTube · Arabic tech",
      title: "1.5M+ views, 6K+ subscribers, 162 real videos.",
      body: "The channel isn't entertainment — it's the brand's trust layer. It explains products, tools, and connects the Arabic audience to tech content that respects them.",
      featured: "Featured video",
      latest: "Latest videos",
      channel: "Open the YouTube channel",
    },
    contact: {
      eyebrow: "Direct contact",
      title: "Send the idea. I'll come back within 24 hours with a clear next step.",
      body: "No need to prepare a formal brief. Write what you need in your own words, and I'll come back with a clearer version and a concrete step.",
      availabilityTitle: "Availability",
      availability: [
        { label: "Sat – Thu", value: "10:00 – 19:00 (CET)" },
        { label: "Friday", value: "Email only" },
        { label: "Typical reply time", value: "Under 24h" },
      ],
      channelsTitle: "Direct channels",
      responseTitle: "What happens after you send",
      responseSteps: [
        "Reply within 24h with a question or a short call slot.",
        "A written summary of what I understood from your idea.",
        "A clear scope, price, and timeline proposal.",
        "Work starts only after you confirm.",
      ],
    },
    privacy: {
      eyebrow: "Privacy",
      title: "A direct privacy summary — no legal jargon.",
      body: "This is the short version. For the full canonical document, use the public /privacy page.",
      cta: "Open full privacy policy",
      bullets: [
        "No invasive tracking. No data selling.",
        "Forms (contact, support) live in a secured Supabase database.",
        "Cookies are limited to language preference and theme mode.",
      ],
    },
    apps: {
      eyebrow: "Products & apps",
      title: "A small ecosystem of focused products, built to the same standard as the site.",
      body:
        "Each app here is treated as a real product — identity, UI, releases, support. MoPlayer is the headline today.",
      featuredLabel: "Headline product",
      openProduct: "Product page",
      viewCase: "Case study",
      roadmapTitle: "What's next",
      roadmap: [
        "MoPlayer phone + Android TV improvements (2.x line).",
        "Small site tools as standalone utilities (PDF, CV, calculators).",
        "A surprise product in quiet preparation — no announcements before it's ready.",
      ],
    },
  } as const;
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  HOME — creator-minimal, text-first
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioHomePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).home;
  const featuredProjects = sortedProjects(model).slice(0, 3);
  const moPlayer = model.projects.find((p) => p.slug === "moplayer");

  // Prefer DB-driven services from Supabase (service_offerings).
  // Fallback to hardcoded editorial copy only if DB is empty.
  const liveServices = model.services?.length
    ? model.services.map((svc) => ({ title: svc.title, body: svc.body }))
    : copy.services;

  return (
    <div className="space-y-20 pb-20 pt-6 sm:pt-10 md:space-y-28 md:pb-28 md:pt-16 lg:space-y-36">
      {/* HERO */}
      <section className="section-frame">
        <FadeIn>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-foreground-muted">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>{model.locale === "ar" ? "متاح للمشاريع" : "Available for new work"}</span>
          </div>
        </FadeIn>

        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2.25rem,6vw,5rem)] leading-[1.05] text-foreground">
            {copy.titleLead}{" "}
            <span className="italic" style={{ color: "var(--accent)" }}>
              {copy.titleAccent}
            </span>
            {copy.titleTail}
          </h1>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-8 text-foreground-soft md:text-lg">
            {copy.body}
          </p>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={`/${model.locale}/work`} className="button-primary-shell">
              {copy.primary}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href={`/${model.locale}/cv`} className="button-secondary-shell">
              {copy.secondary}
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-foreground-muted">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              {model.profile.location}
            </span>
            <span>·</span>
            <span>AR · EN · DE</span>
            <span>·</span>
            <span>Next.js · Product · Content</span>
          </div>
        </FadeIn>
      </section>

      {/* STATS INLINE */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-x-8 gap-y-10 border-y py-10 md:grid-cols-4" style={{ borderColor: "var(--border)" }}>
            {copy.stats.map((s) => (
              <div key={s.label}>
                <div className="headline-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-foreground">{s.value}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* STRENGTHS */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-10 md:grid-cols-[0.45fr_0.55fr] md:items-start">
            <div>
              <Eyebrow>{copy.strengthsEyebrow}</Eyebrow>
              <h2 className="headline-display mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] text-foreground">
                {copy.quickTitle}
              </h2>
            </div>
            <div className="grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
              {copy.strengths.map((item, idx) => (
                <FadeIn key={item.title} delay={idx * 0.06}>
                  <article className="flex flex-col gap-2 py-6 md:flex-row md:items-baseline md:gap-8" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted md:w-24">
                      0{idx + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="headline-display text-xl text-foreground md:text-[1.6rem]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-foreground-soft md:text-base">{item.body}</p>
                    </div>
                  </article>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* PHILOSOPHY */}
      <FadeIn>
        <section className="section-frame">
          <div className="mx-auto max-w-3xl">
            <Eyebrow>{copy.philosophyEyebrow}</Eyebrow>
            <Quote className="mx-auto mt-8 h-10 w-10 text-foreground-muted/50" />
            <blockquote className="headline-display mt-4 text-balance text-center text-[clamp(1.75rem,4vw,3rem)] leading-[1.2] text-foreground">
              “{copy.philosophyQuote}”
            </blockquote>
            <ul className="mt-12 grid gap-3 sm:grid-cols-2">
              {copy.philosophyPoints.map((point, idx) => (
                <li key={point} className="flex items-start gap-3 text-sm leading-7 text-foreground-soft">
                  <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                  <span>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-foreground-muted">
                      0{idx + 1}
                    </span>{" "}
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </FadeIn>

      {/* SELECTED WORK */}
      <FadeIn>
        <section className="section-frame">
          <div className="flex items-baseline justify-between gap-4">
            <div className="max-w-2xl">
              <Eyebrow>{copy.workEyebrow}</Eyebrow>
              <h2 className="headline-display mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] text-foreground">
                {copy.workTitle}
              </h2>
              <p className="prose-frame mt-4 text-sm leading-7 text-foreground-soft md:text-base">
                {copy.workBody}
              </p>
            </div>
            <Link href={`/${model.locale}/work`} className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-foreground-muted transition hover:text-foreground md:inline-flex">
              {copy.primary}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* List-first layout */}
          <ul className="mt-10 grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
            {featuredProjects.map((project, idx) => (
              <FadeIn key={project.id} delay={idx * 0.05}>
                <li style={{ borderBottom: "1px solid var(--border)" }}>
                  <Link
                    href={caseStudyHref(model.locale, project.slug)}
                    className="group grid grid-cols-[1fr_auto] items-center gap-4 py-6 md:grid-cols-[6rem_1fr_12rem_auto] md:gap-8"
                  >
                    <span className="hidden text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted md:inline-block">
                      {project.slug === "moplayer" ? "Product" : "Case study"}
                    </span>
                    <div>
                      <h3 className="headline-display text-xl text-foreground transition-colors group-hover:text-accent md:text-[1.7rem]">
                        {project.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-soft md:line-clamp-1">
                        {project.summary}
                      </p>
                    </div>
                    <div className="hidden flex-wrap items-center gap-1.5 md:flex">
                      {(project.tags ?? []).slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-muted" style={{ borderColor: "var(--border)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-foreground-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                </li>
              </FadeIn>
            ))}
          </ul>
        </section>
      </FadeIn>

      {/* MOPLAYER FEATURE */}
      {moPlayer ? (
        <FadeIn>
          <section className="section-frame">
            <div className="grid gap-10 md:grid-cols-[1fr_0.9fr] md:items-center md:gap-16">
              <div>
                <Eyebrow>{copy.productEyebrow}</Eyebrow>
                <h2 className="headline-display mt-4 text-[clamp(1.75rem,4vw,3.2rem)] leading-[1.1] text-foreground">
                  {copy.productTitle}
                </h2>
                <p className="prose-frame mt-4 text-base leading-7 text-foreground-soft md:text-lg">{copy.productBody}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={`/${model.locale}/apps/moplayer`} className="button-primary-shell">
                    <Smartphone className="h-4 w-4" />
                    {copy.productPrimary}
                  </Link>
                  <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">
                    {copy.productSecondary}
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-foreground-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    v2.0.0
                  </span>
                  <span>·</span>
                  <span>Android 7+ · Android TV</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    {model.locale === "ar" ? "بدون تتبع" : "No tracking"}
                  </span>
                </div>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)] md:aspect-[5/6]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                <Image src={moPlayer.image} alt={moPlayer.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" />
              </div>
            </div>
          </section>
        </FadeIn>
      ) : null}

      {/* SERVICES */}
      <FadeIn>
        <section className="section-frame">
          <div className="max-w-2xl">
            <Eyebrow>{copy.servicesEyebrow}</Eyebrow>
            <h2 className="headline-display mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.15] text-foreground">
              {copy.servicesTitle}
            </h2>
          </div>
          <ul className="mt-10 grid gap-0 md:grid-cols-2 md:gap-8" style={{ borderTop: "1px solid var(--border)" }}>
            {liveServices.map((s, idx) => (
              <FadeIn key={s.title} delay={idx * 0.05}>
                <li className="flex items-start gap-5 py-6" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="headline-display text-xl text-foreground md:text-2xl">{s.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-foreground-soft">{s.body}</p>
                  </div>
                </li>
              </FadeIn>
            ))}
          </ul>
        </section>
      </FadeIn>

      {/* YOUTUBE PREVIEW */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-10 md:grid-cols-[0.5fr_0.5fr] md:items-start md:gap-16">
            <div>
              <Eyebrow>{copy.mediaEyebrow}</Eyebrow>
              <h2 className="headline-display mt-4 text-[clamp(1.5rem,3vw,2.3rem)] leading-[1.2] text-foreground">
                {copy.mediaTitle}
              </h2>
              <div className="mt-6">
                <Link href={`/${model.locale}/youtube`} className="button-secondary-shell">
                  <PlayCircle className="h-4 w-4" />
                  {copy.mediaPrimary}
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {model.latestVideos.slice(0, 2).map((video, idx) => (
                <FadeIn key={video.id} delay={idx * 0.08}>
                  <a
                    href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block overflow-hidden rounded-[var(--radius-md)]"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 25vw" />
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{video.duration}</span>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                        {model.locale === "ar" ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                      </h3>
                    </div>
                  </a>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      </FadeIn>

      {/* CONTACT CTA */}
      <FadeIn>
        <section className="section-frame">
          <div className="rounded-[var(--radius-lg)] px-6 py-12 md:p-14" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>{copy.contactEyebrow}</Eyebrow>
              <h2 className="headline-display mt-4 text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] text-foreground">
                {copy.contactTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-foreground-soft md:text-base">{copy.contactBody}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={`/${model.locale}/contact`} className="button-primary-shell">
                  {copy.contactPrimary}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  CV — typography-driven, vertical timeline
 * ─────────────────────────────────────────────────────────────────────────── */

const STACK_GROUPS = [
  { title: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind 4", "Framer Motion"] },
  { title: "Backend / Data", items: ["Supabase", "Postgres", "Edge Functions", "Vercel KV", "Zod"] },
  { title: "Mobile", items: ["Kotlin", "Android TV", "Material 3", "Hilt", "Jetpack Compose"] },
  { title: "Tooling", items: ["Vercel", "GitHub Actions", "Playwright", "Vitest", "NPM workspaces"] },
];

export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).cv;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-20 pb-20 pt-6 sm:pt-10 md:space-y-28 md:pb-28 md:pt-16">
      {/* HERO */}
      <section className="section-frame">
        <FadeIn>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
            {copy.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={model.downloads.branded} className="button-primary-shell">
              <Download className="h-4 w-4" />
              {copy.branded}
            </Link>
            <Link href={model.downloads.ats} className="button-secondary-shell">
              <Download className="h-4 w-4" />
              {copy.ats}
            </Link>
          </div>
        </FadeIn>
      </section>

      {/* PRINCIPLES + IDENTITY */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-10 md:grid-cols-[0.4fr_0.6fr] md:items-start md:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                  <Image src={model.portraitImage} alt={model.profile.name} fill className="object-cover" sizes="64px" />
                </div>
                <div>
                  <h2 className="headline-display text-xl text-foreground">{model.profile.name}</h2>
                  <p className="text-sm text-foreground-soft">{model.profile.subtitle}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                    <MapPin className="h-3.5 w-3.5" />
                    {model.profile.location}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Eyebrow>{isAr ? "المبادئ" : "Principles"}</Eyebrow>
              <ul className="mt-6 grid gap-3">
                {copy.principles.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-foreground-soft md:text-base">
                    <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--accent)" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* APPROACH */}
      <FadeIn>
        <section className="section-frame">
          <div className="max-w-2xl">
            <Eyebrow>{isAr ? "كيف أعمل" : "How I work"}</Eyebrow>
            <h2 className="headline-display mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] text-foreground">
              {copy.approachTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-0 md:grid-cols-2 md:gap-x-10" style={{ borderTop: "1px solid var(--border)" }}>
            {copy.approach.map((step, idx) => (
              <FadeIn key={step.title} delay={idx * 0.05}>
                <article className="py-6" style={{ borderBottom: "1px solid var(--border)" }}>
                  <h3 className="headline-display text-xl text-foreground md:text-2xl">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground-soft md:text-base">{step.body}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* EXPERIENCE */}
      <FadeIn>
        <section className="section-frame">
          <div className="max-w-2xl">
            <Eyebrow>{isAr ? "الخبرة" : "Experience"}</Eyebrow>
            <h2 className="headline-display mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] text-foreground">
              {copy.experience}
            </h2>
          </div>
          <ul className="mt-10 grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
            {model.cvExperience.map((item, idx) => (
              <FadeIn key={item.id} delay={idx * 0.04}>
                <li className="grid gap-4 py-7 md:grid-cols-[10rem_1fr] md:gap-10" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="space-y-1 text-xs font-semibold text-foreground-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {item.period}
                    </span>
                    <span className="block">{item.location}</span>
                  </div>
                  <div>
                    <h3 className="headline-display text-xl text-foreground md:text-2xl">{item.role}</h3>
                    <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{item.company}</p>
                    {item.description ? <p className="mt-3 text-sm leading-7 text-foreground-soft md:text-base">{item.description}</p> : null}
                    {item.highlights.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.highlights.map((h) => (
                          <span key={h} className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-foreground-muted" style={{ borderColor: "var(--border)" }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </li>
              </FadeIn>
            ))}
          </ul>
        </section>
      </FadeIn>

      {/* STACK */}
      <FadeIn>
        <section className="section-frame">
          <div className="max-w-2xl">
            <Eyebrow>{isAr ? "الأدوات" : "Stack"}</Eyebrow>
            <h2 className="headline-display mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] text-foreground">
              {copy.stackTitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-0 sm:grid-cols-2 lg:grid-cols-4" style={{ borderTop: "1px solid var(--border)" }}>
            {STACK_GROUPS.map((group) => (
              <article key={group.title} className="py-6 pr-6" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-xs font-bold uppercase tracking-[0.22em]" style={{ color: "var(--accent)" }}>{group.title}</h3>
                <ul className="mt-4 grid gap-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="text-sm text-foreground-soft">{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* CERTIFICATIONS */}
      {model.certifications.length ? (
        <FadeIn>
          <section className="section-frame">
            <div className="max-w-2xl">
              <Eyebrow>{isAr ? "الشهادات" : "Credentials"}</Eyebrow>
              <h2 className="headline-display mt-4 text-[clamp(1.5rem,3vw,2.5rem)] leading-[1.15] text-foreground">
                {copy.certifications}
              </h2>
            </div>
            <ul className="mt-10 grid gap-0 md:grid-cols-2 md:gap-x-10" style={{ borderTop: "1px solid var(--border)" }}>
              {model.certifications.map((item, idx) => (
                <FadeIn key={item.id} delay={idx * 0.05}>
                  <li className="py-6" style={{ borderBottom: "1px solid var(--border)" }}>
                    <BadgeCheck className="h-5 w-5" style={{ color: "var(--accent)" }} />
                    <h3 className="headline-display mt-3 text-lg text-foreground md:text-xl">{item.name}</h3>
                    <p className="text-sm font-semibold text-foreground-muted">{item.issuer}</p>
                    {item.description ? <p className="mt-2 text-sm leading-7 text-foreground-soft">{item.description}</p> : null}
                    {item.issueDate ? <p className="mt-2 text-xs font-semibold text-foreground-muted">{item.issueDate}</p> : null}
                  </li>
                </FadeIn>
              ))}
            </ul>
          </section>
        </FadeIn>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  WORK + Project detail (list-first)
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioWorkPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).work;
  const projects = sortedProjects(model);

  return (
    <div className="space-y-16 pb-20 pt-6 sm:pt-10 md:space-y-24 md:pb-28 md:pt-16">
      <section className="section-frame">
        <FadeIn>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
            {copy.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
        </FadeIn>
      </section>

      <FadeIn>
        <section className="section-frame">
          <ul className="grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
            {projects.map((project, idx) => (
              <FadeIn key={project.id} delay={idx * 0.04}>
                <li style={{ borderBottom: "1px solid var(--border)" }}>
                  <Link
                    href={caseStudyHref(model.locale, project.slug)}
                    className="group grid gap-6 py-8 md:grid-cols-[14rem_1fr_auto] md:items-center md:gap-10"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-md)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                      <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 220px" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted">
                        {project.slug === "moplayer" ? "Product · Android" : "Case study"}
                      </span>
                      <h2 className="headline-display mt-1 text-2xl text-foreground transition-colors group-hover:text-accent md:text-[1.75rem]">
                        {project.title}
                      </h2>
                      <p className="mt-2 text-sm leading-7 text-foreground-soft md:text-base">{project.description || project.summary}</p>
                      {project.tags?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {project.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground-muted" style={{ borderColor: "var(--border)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-foreground-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground md:inline-block" />
                  </Link>
                </li>
              </FadeIn>
            ))}
          </ul>
        </section>
      </FadeIn>
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
    <div className="space-y-16 pb-20 pt-6 sm:pt-10 md:space-y-24 md:pb-28 md:pt-16">
      <section className="section-frame">
        <FadeIn>
          <Eyebrow>{project.eyebrow || (isMoPlayer ? (model.locale === "ar" ? "منتج · Android" : "Product · Android") : model.locale === "ar" ? "دراسة حالة" : "Case study")}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.06] text-foreground">
            {project.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{project.description || project.summary}</p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {isMoPlayer ? (
              <Link href={`/${model.locale}/apps/moplayer`} className="button-primary-shell">
                <Smartphone className="h-4 w-4" />
                {copy.product}
              </Link>
            ) : project.href ? (
              <Link href={project.href} className="button-primary-shell" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {copy.visit}
              </Link>
            ) : null}
            <Link href={`/${model.locale}/contact`} className="button-secondary-shell">
              {copy.contact}
            </Link>
          </div>
        </FadeIn>
      </section>

      <FadeIn>
        <section className="section-frame">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
            <Image src={project.image} alt={project.title} fill priority className="object-cover" sizes="100vw" />
          </div>
        </section>
      </FadeIn>

      {/* Challenge / Solution / Result */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-0 md:grid-cols-3 md:gap-10" style={{ borderTop: "1px solid var(--border)" }}>
            {[
              { title: copy.challenge, body: project.challenge },
              { title: copy.solution, body: project.solution },
              { title: copy.result, body: project.result },
            ].map((card, idx) => (
              <article key={card.title} className="py-6" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted">0{idx + 1}</span>
                <h2 className="headline-display mt-2 text-xl text-foreground md:text-2xl">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-foreground-soft">{card.body}</p>
              </article>
            ))}
          </div>
        </section>
      </FadeIn>

      {project.metrics?.length ? (
        <FadeIn>
          <section className="section-frame">
            <div className="grid gap-x-8 gap-y-10 border-y py-10 sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
              {project.metrics.map((metric) => (
                <div key={`${metric.label}-${metric.value}`}>
                  <div className="headline-display text-[clamp(1.75rem,3vw,2.25rem)] leading-none text-foreground">{metric.value}</div>
                  <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{metric.label}</div>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn>
        <section className="section-frame">
          <h2 className="headline-display text-xl text-foreground md:text-2xl">{copy.gallery}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {gallery.slice(0, 4).map((image, index) => (
              <FadeIn key={`${image}-${index}`} delay={index * 0.04}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-md)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                  <Image src={image} alt={`${project.title} ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="section-frame">
          <div className="rounded-[var(--radius-lg)] px-6 py-10 md:p-12" style={{ border: "1px solid var(--border)", background: "var(--surface)" }}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <Eyebrow>{copy.nextEyebrow}</Eyebrow>
                <h3 className="headline-display mt-3 text-xl text-foreground md:text-2xl">{copy.nextTitle}</h3>
              </div>
              <Link href={`/${model.locale}/contact`} className="button-primary-shell self-start md:self-auto">
                {copy.contact}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  YOUTUBE — editorial grid
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioYoutubePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).youtube;
  const featured = model.featuredVideo ?? model.latestVideos[0] ?? null;
  const yt = model.youtube;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-16 pb-20 pt-6 sm:pt-10 md:space-y-24 md:pb-28 md:pt-16">
      <section className="section-frame">
        <FadeIn>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
            {copy.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <a href={`https://www.youtube.com/${yt.handle ?? "@Moalfarras"}`} target="_blank" rel="noopener noreferrer" className="button-primary-shell mt-8">
            <PlayCircle className="h-4 w-4" />
            {copy.channel}
          </a>
        </FadeIn>
      </section>

      {/* Inline stats */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-x-8 gap-y-10 border-y py-10 sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
            {[
              { value: yt.views ? `${(Number(yt.views) / 1_000_000).toFixed(1)}M+` : "1.5M+", label: isAr ? "إجمالي المشاهدات" : "Total views" },
              { value: yt.subscribers ? `${(Number(yt.subscribers) / 1000).toFixed(1)}K` : "6K", label: isAr ? "مشتركون" : "Subscribers" },
              { value: yt.videos ?? 162, label: isAr ? "فيديوهات منشورة" : "Published videos" },
            ].map((s) => (
              <div key={s.label}>
                <div className="headline-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none text-foreground">{String(s.value)}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {featured ? (
        <FadeIn>
          <section className="section-frame">
            <div className="grid gap-8 md:grid-cols-[0.6fr_0.4fr] md:items-center md:gap-12">
              <a href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noopener noreferrer" className="group relative aspect-video overflow-hidden rounded-[var(--radius-lg)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                <Image src={featured.thumbnail} alt={featured.title_en || featured.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, 60vw" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform group-hover:scale-110">
                    <PlayCircle className="h-6 w-6" />
                  </div>
                </div>
              </a>
              <div>
                <Eyebrow>{copy.featured}</Eyebrow>
                <h2 className="headline-display mt-4 text-[clamp(1.5rem,3vw,2.25rem)] leading-[1.2] text-foreground">
                  {isAr ? featured.title_ar || featured.title_en : featured.title_en || featured.title_ar}
                </h2>
                <p className="mt-3 text-sm leading-7 text-foreground-soft md:text-base">
                  {isAr ? featured.description_ar || featured.description_en : featured.description_en || featured.description_ar}
                </p>
              </div>
            </div>
          </section>
        </FadeIn>
      ) : null}

      <FadeIn>
        <section className="section-frame">
          <h2 className="headline-display text-xl text-foreground md:text-2xl">{copy.latest}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {model.latestVideos.slice(0, 6).map((video, idx) => (
              <FadeIn key={video.id} delay={idx * 0.04}>
                <a
                  href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block overflow-hidden rounded-[var(--radius-md)]"
                  style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 33vw" />
                    {video.duration ? (
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-bold text-white">{video.duration}</span>
                    ) : null}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-foreground">
                      {isAr ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                    </h3>
                  </div>
                </a>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  CONTACT — typography-first, form + side rails
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioContactPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).contact;
  const email = model.contact.emailAddress;
  const whatsapp = model.contact.whatsappUrl;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-16 pb-20 pt-6 sm:pt-10 md:space-y-20 md:pb-28 md:pt-16">
      <section className="section-frame">
        <FadeIn>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
            {copy.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
        </FadeIn>
        <FadeIn delay={0.15}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={`mailto:${email}`} className="button-primary-shell">
              <Mail className="h-4 w-4" />
              {email}
            </a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-whatsapp">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </div>
        </FadeIn>
      </section>

      <FadeIn>
        <section className="section-frame grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16">
          <div>
            <ContactForm locale={model.locale} whatsappUrl={whatsapp} />
          </div>
          <aside className="space-y-10">
            <div>
              <Eyebrow>{copy.availabilityTitle}</Eyebrow>
              <dl className="mt-6 grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
                {copy.availability.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <dt className="text-sm font-semibold text-foreground">{row.label}</dt>
                    <dd className="text-sm text-foreground-soft">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <Eyebrow>{copy.channelsTitle}</Eyebrow>
              <ul className="mt-6 grid gap-3">
                <li>
                  <a href={`mailto:${email}`} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3 transition-colors hover:bg-surface-soft" style={{ border: "1px solid var(--border)" }}>
                    <span className="flex items-center gap-3">
                      <Mail className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold text-foreground">Email</span>
                    </span>
                    <span className="truncate text-xs text-foreground-muted">{email}</span>
                  </a>
                </li>
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3 transition-colors hover:bg-surface-soft" style={{ border: "1px solid var(--border)" }}>
                    <span className="flex items-center gap-3">
                      <MessageCircle className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold text-foreground">WhatsApp</span>
                    </span>
                    <span className="text-xs text-foreground-muted">{isAr ? "للرد السريع" : "Fastest reply"}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <Eyebrow>{copy.responseTitle}</Eyebrow>
              <ol className="mt-6 grid gap-4">
                {copy.responseSteps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "var(--foreground)", color: "var(--background)" }}>
                      {idx + 1}
                    </span>
                    <span className="text-sm leading-7 text-foreground-soft">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </section>
      </FadeIn>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  PRIVACY
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioPrivacyPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).privacy;

  return (
    <div className="space-y-10 pb-20 pt-6 sm:pt-10 md:pb-28 md:pt-16">
      <section className="section-frame max-w-3xl">
        <FadeIn>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] text-foreground">
            {copy.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
        </FadeIn>

        <ul className="mt-10 grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
          {copy.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 py-4 text-sm leading-7 text-foreground-soft md:text-base" style={{ borderBottom: "1px solid var(--border)" }}>
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" style={{ color: "var(--accent)" }} />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <Link href="/privacy" className="button-primary-shell mt-10">
          {copy.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  APPS (listing)
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioAppsPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).apps;
  const projects = sortedProjects(model);
  const moPlayer = projects.find((p) => p.slug === "moplayer");
  const otherApps = projects.filter((p) => p.slug !== "moplayer" && p.highlightStyle === "app");

  return (
    <div className="space-y-16 pb-20 pt-6 sm:pt-10 md:space-y-24 md:pb-28 md:pt-16">
      <section className="section-frame">
        <FadeIn>
          <Eyebrow>{copy.eyebrow}</Eyebrow>
        </FadeIn>
        <FadeIn delay={0.05}>
          <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
            {copy.title}
          </h1>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
        </FadeIn>
      </section>

      {moPlayer ? (
        <FadeIn>
          <section className="section-frame">
            <div className="grid gap-10 md:grid-cols-[0.55fr_0.45fr] md:items-center md:gap-16">
              <div>
                <Eyebrow>{copy.featuredLabel}</Eyebrow>
                <h2 className="headline-display mt-4 text-[clamp(1.75rem,4vw,3rem)] leading-[1.1] text-foreground">
                  {moPlayer.title}
                </h2>
                <p className="prose-frame mt-4 text-base leading-7 text-foreground-soft md:text-lg">
                  {moPlayer.description || moPlayer.summary}
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-foreground-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    v2.0.0
                  </span>
                  <span>·</span>
                  <span>Android 7+ · Android TV</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                    {model.locale === "ar" ? "بدون تتبع" : "No tracking"}
                  </span>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href={`/${model.locale}/apps/moplayer`} className="button-primary-shell">
                    <Smartphone className="h-4 w-4" />
                    {copy.openProduct}
                  </Link>
                  <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">
                    {copy.viewCase}
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-lg)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                <Image src={moPlayer.image} alt={moPlayer.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" />
              </div>
            </div>
          </section>
        </FadeIn>
      ) : null}

      {otherApps.length ? (
        <FadeIn>
          <section className="section-frame">
            <ul className="grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
              {otherApps.map((project, idx) => (
                <FadeIn key={project.id} delay={idx * 0.04}>
                  <li style={{ borderBottom: "1px solid var(--border)" }}>
                    <Link href={caseStudyHref(model.locale, project.slug)} className="group flex items-center justify-between gap-4 py-6">
                      <div>
                        <h3 className="headline-display text-xl text-foreground transition-colors group-hover:text-accent md:text-2xl">{project.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-foreground-soft">{project.summary}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </Link>
                  </li>
                </FadeIn>
              ))}
            </ul>
          </section>
        </FadeIn>
      ) : null}

      {/* Roadmap */}
      <FadeIn>
        <section className="section-frame max-w-3xl">
          <Eyebrow>{copy.roadmapTitle}</Eyebrow>
          <ul className="mt-6 grid gap-0" style={{ borderTop: "1px solid var(--border)" }}>
            {copy.roadmap.map((line, idx) => (
              <li key={line} className="flex items-start gap-4 py-4 text-sm leading-7 text-foreground-soft md:text-base" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted">
                  0{idx + 1}
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      </FadeIn>
    </div>
  );
}
