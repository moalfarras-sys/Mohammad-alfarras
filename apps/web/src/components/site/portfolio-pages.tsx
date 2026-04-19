"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Calendar,
  ChevronRight,
  Compass,
  Download,
  ExternalLink,
  Eye,
  Gauge,
  Globe2,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  PlayCircle,
  Quote,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { ContactForm } from "@/components/site/contact-form";
import type { SiteViewModel } from "@/components/site/site-view-model";
import type { Locale } from "@/types/cms";

/* ─────────────────────────────────────────────────────────────────────────────
 *  Helpers
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

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  Bilingual copy
 * ─────────────────────────────────────────────────────────────────────────── */

function localeCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      home: {
        eyebrow: "موقع شخصي · مهني · بصري",
        title: "محمد الفراس. أبني تجارب رقمية أوضح، منتجات أقوى، وحضوراً يشرح القيمة من أول شاشة.",
        body:
          "هذا الموقع عن عملي أنا: تطوير الويب الحديث، التفكير المنتجي، تصميم الواجهات، وصناعة المحتوى التقني العربي. كل ما تراه هنا تم بناؤه بنفس مستوى الجودة الذي أقدمه لعملائي.",
        primary: "استكشف الأعمال",
        secondary: "السيرة الذاتية",
        quickEyebrow: "البطاقة التعريفية",
        quickTitle: "هوية شخصية أولاً، ثم منتجات وأعمال داخل سياق واحد ومنسّق.",
        quickBody:
          "أعمل على مفترق ثلاث طبقات: تطوير الويب، التفكير في المنتج، وصناعة المحتوى. هذا الجمع يخلق نتائج أكثر واقعية وأكثر إقناعاً.",
        strengthsEyebrow: "نقاط قوة فعلية",
        strengths: [
          { title: "تطوير ويب حديث", body: "Next.js 16، Tailwind 4، Supabase، Vercel — أبني واجهات سريعة، قابلة للتوسع، ومرتبة." },
          { title: "تفكير منتجي", body: "كل صفحة يجب أن تدعم قراراً أو تحوّل زائراً. التصميم أداة، ليس زينة." },
          { title: "محتوى يبني الثقة", body: "خبرة فعلية في يوتيوب التقني العربي تعني عرض منتج لا يبدو إعلاناً." },
        ],
        statsEyebrow: "الأرقام التي تختصر القصة",
        stats: [
          { value: "1.5M+", label: "مشاهدة على يوتيوب" },
          { value: "+6 سنوات", label: "خبرة في التشغيل والتنفيذ" },
          { value: "3", label: "لغات: عربي، إنجليزي، ألماني" },
          { value: "DE/SY", label: "ألمانيا · من الحسكة" },
        ],
        philosophyEyebrow: "الفلسفة",
        philosophyTitle: "الوضوح أولاً. الجمال يخدم الوضوح. السرعة تحمي الاثنين.",
        philosophyBody:
          "أرفض المواقع المزخرفة التي لا تشرح شيئاً. أرفض المنتجات المنمقة التي تتعب المستخدم. كل قرار تصميمي عندي يجب أن يبرر سبب وجوده — وإلا يُحذف.",
        philosophyPoints: [
          "الزائر يستحق فهم القيمة في أقل من 10 ثوانٍ.",
          "الواجهة الجميلة بدون أداء = خسارة موزونة.",
          "اللغة العربية والإنجليزية تستحقان نفس الجودة، ليس ترجمة سريعة.",
          "المنتج الواحد الناضج أفضل من خمسة تجارب نصف جاهزة.",
        ],
        workEyebrow: "أعمال مختارة",
        workTitle: "كل مشروع هنا حلّ مشكلة فعلية.",
        workBody:
          "هذه ليست معرض صور — هذه دراسات حالة قصيرة تشرح: ماذا كان التحدي، كيف تغيّرت البنية، وما النتيجة.",
        productEyebrow: "المنتج البطل",
        productTitle: "MoPlayer ليس مشروعاً جانبياً. إنه منتج كامل بهوية، إصدارات، ودعم.",
        productBody:
          "تطبيق Android + Android TV لتجربة وسائط نظيفة وسريعة. متاح للتنزيل المباشر، مع مركز دعم وصفحة منتج كاملة.",
        productPrimary: "صفحة المنتج",
        productSecondary: "دراسة الحالة",
        servicesEyebrow: "ماذا أقدّم",
        servicesTitle: "خدمات قليلة، لكنها مكتملة الجودة.",
        services: [
          {
            icon: "globe",
            title: "موقع شخصي / تجاري كامل",
            body: "موقع متعدد اللغات، سريع، بهوية مرتبة وقابل للتطوير. مثل هذا الموقع تماماً.",
            tags: ["Next.js", "Supabase", "Vercel"],
          },
          {
            icon: "layout",
            title: "صفحة هبوط لإطلاق منتج",
            body: "صفحة واحدة قوية تشرح القيمة، تبني الثقة، وتحوّل الزائر خلال أول دقيقة.",
            tags: ["Conversion", "SEO", "Motion"],
          },
          {
            icon: "phone",
            title: "تطبيق Android كمنتج",
            body: "تطبيق ناتج بكود حقيقي وهوية موحدة مع الموقع، كما هو حال MoPlayer.",
            tags: ["Kotlin", "Android TV", "Material 3"],
          },
          {
            icon: "video",
            title: "تعاون محتوى تقني",
            body: "محتوى يوتيوب يعرض المنتج بشكل صادق ويبني ثقة الجمهور بدلاً من الدعاية.",
            tags: ["YouTube", "Voiceover", "Storytelling"],
          },
        ],
        mediaEyebrow: "المحتوى التقني العربي",
        mediaTitle: "اليوتيوب جزء من البراند، لأنه يثبت طريقة التفكير قبل أي معرض أعمال.",
        mediaBody:
          "قناتي التقنية العربية لها نفس مبادئ الموقع: شرح واضح، حضور صادق، ومحتوى يحترم وقت المشاهد.",
        mediaPrimary: "اذهب إلى يوتيوب",
        contactEyebrow: "ابدأ الحديث",
        contactTitle: "إذا كان لديك مشروع يحتاج ترتيباً أوضح وحضوراً أقوى، أرسل الفكرة.",
        contactBody:
          "أعمل مع أصحاب المشاريع، الفرق الصغيرة، وصُنّاع المحتوى الذين يحتاجون قفزة في مستوى التقديم الرقمي.",
        contactPrimary: "تواصل معي",
      },
      cv: {
        eyebrow: "السيرة الذاتية",
        title: "الخبرة، طريقة العمل، والمسار المهني — في صفحة واحدة منظمة.",
        body:
          "هذه الصفحة مخصصة للمراجعة المهنية: الخبرة، المبادئ، الشهادات، والملف القابل للتنزيل بنسختين (مصممة + مختصرة للـ ATS).",
        principlesTitle: "مبادئ العمل",
        principles: [
          "الوضوح قبل الزخرفة، دائماً.",
          "بنية تتحمل التعديل ولا تنهار بسرعة.",
          "ربط الواجهة بقرار تجاري واضح.",
          "أداء فعلي لا يقل عن الجمال البصري.",
          "اللغة العربية والإنجليزية بنفس مستوى الجودة.",
        ],
        downloadsTitle: "تحميل السيرة الذاتية",
        downloadsBody: "نسختان متاحتان: نسخة مصممة بصرياً، ونسخة مختصرة جاهزة لأنظمة ATS.",
        branded: "تحميل النسخة المصممة",
        ats: "تحميل النسخة المختصرة (ATS)",
        experience: "الخبرة العملية",
        certifications: "الشهادات والاعتمادات",
        approachTitle: "كيف أعمل عملياً",
        approach: [
          { title: "1 — استماع", body: "نتحدث 30 دقيقة. أفهم النشاط، الجمهور، والمشكلة الفعلية، ليس فقط ما يُطلب." },
          { title: "2 — اقتراح", body: "ملخص قصير: ما المخرج، ما الذي يُحذف، وما الذي يُضاف، وكم يستغرق." },
          { title: "3 — بناء", body: "تنفيذ منظم بمراحل واضحة وتسليم مرحلي. لا اختفاء ولا 'سأرسل قريباً'." },
          { title: "4 — تسليم وضمان", body: "تسليم نهائي مع توثيق، ووقت دعم لما بعد الإطلاق." },
        ],
        stackTitle: "التقنيات التي أستخدمها يومياً",
      },
      work: {
        eyebrow: "أعمال ودراسات حالة",
        title: "ست خطوات تربط بين العمل والقرار التجاري — لكل مشروع.",
        body:
          "كل مشروع هنا يُعرض كدراسة حالة: التحدي، الحل، النتيجة، والميزات الأهم. هذا ليس معرض صور.",
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
        nextTitle: "إذا كانت قصتك قريبة من هذه الحالة، أرسل الفكرة وسنبدأ بشكل صحيح.",
      },
      youtube: {
        eyebrow: "يوتيوب · المحتوى التقني العربي",
        title: "+1.5 مليون مشاهدة، +6 آلاف مشترك، و162 فيديو حقيقياً.",
        body:
          "القناة ليست ملفاً ترفيهياً — هي طبقة الثقة في البراند. تشرح المنتجات، تشرح الأدوات، وتربط الجمهور العربي بمحتوى تقني محترم.",
        statsTitle: "أرقام القناة",
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
          "عرض واضح بالنطاق والسعر الزمن.",
          "بدء التنفيذ فقط عند موافقتك.",
        ],
      },
      privacy: {
        eyebrow: "الخصوصية",
        title: "سياسة خصوصية مباشرة وبدون لغة قانونية معقدة.",
        body:
          "هذه نسخة موجزة. للنسخة الكاملة المعتمدة، استخدم صفحة /privacy العامة.",
        cta: "افتح سياسة الخصوصية الكاملة",
        bullets: [
          "لا نستخدم تتبعاً تطفلياً ولا نبيع بيانات.",
          "النماذج (التواصل، الدعم) تُحفظ بقاعدة بيانات Supabase آمنة.",
          "الكوكيز محصورة في تذكر اللغة والوضع البصري.",
        ],
      },
      apps: {
        eyebrow: "المنتجات والتطبيقات",
        title: "منظومة منتجات صغيرة، مبنية بنفس مستوى الموقع: أوضح، أسرع، وأكثر تماسكاً.",
        body:
          "كل تطبيق هنا يُعامل كمنتج كامل: هوية، واجهة، إصدارات، ودعم. MoPlayer هو المنتج البطل الآن. باقي الفكرة قيد البناء.",
        featuredLabel: "المنتج البطل",
        openProduct: "صفحة المنتج",
        viewCase: "دراسة الحالة",
        comingSoon: "قريباً",
        roadmapTitle: "ما يأتي لاحقاً",
        roadmap: [
          "تحسينات MoPlayer للهاتف وAndroid TV (الإصدار 2.x).",
          "أدوات صغيرة من الموقع كـ tools مستقلة (PDF، CV، حاسبات).",
          "منتج مفاجأة قيد التحضير الصامت — لا أُعلن قبل الجاهزية.",
        ],
      },
    } as const;
  }

  return {
    home: {
      eyebrow: "Personal · professional · visual",
      title: "Mohammad Alfarras. Building clearer digital experiences, stronger products, and brand presence that explains value on the first screen.",
      body:
        "This site is about my work: modern web development, product thinking, interface design, and Arabic tech content. Everything you see here was built with the same standard I deliver to clients.",
      primary: "Explore work",
      secondary: "View CV",
      quickEyebrow: "The short version",
      quickTitle: "Personal identity first, then products and work inside one curated context.",
      quickBody:
        "I sit at the intersection of three layers: web development, product thinking, and content. The combination produces results that feel grounded and persuasive.",
      strengthsEyebrow: "Real strengths",
      strengths: [
        { title: "Modern web development", body: "Next.js 16, Tailwind 4, Supabase, Vercel — fast, scalable, well-structured interfaces." },
        { title: "Product thinking", body: "Every page should support a decision or convert a visitor. Design is a tool, not decoration." },
        { title: "Content that builds trust", body: "Real Arabic tech YouTube experience means product presentation that doesn't feel like an ad." },
      ],
      statsEyebrow: "Numbers that compress the story",
      stats: [
        { value: "1.5M+", label: "YouTube views" },
        { value: "6+ years", label: "operations & execution" },
        { value: "3", label: "languages: AR · EN · DE" },
        { value: "DE/SY", label: "Germany · from Al-Hasakah" },
      ],
      philosophyEyebrow: "Philosophy",
      philosophyTitle: "Clarity first. Beauty serves clarity. Speed protects both.",
      philosophyBody:
        "I refuse decorated sites that explain nothing. I refuse polished products that exhaust their users. Every design decision must justify its existence — otherwise it's removed.",
      philosophyPoints: [
        "A visitor deserves to understand the value in under 10 seconds.",
        "A beautiful interface without performance is a measured loss.",
        "Arabic and English deserve the same level of polish, not a quick translation.",
        "One mature product beats five half-finished experiments.",
      ],
      workEyebrow: "Selected work",
      workTitle: "Each project here solved a real problem.",
      workBody:
        "This isn't a screenshot gallery — it's a set of short case studies that explain the challenge, the structural shift, and the outcome.",
      productEyebrow: "Headline product",
      productTitle: "MoPlayer is not a side project. It's a complete product with identity, releases, and support.",
      productBody:
        "An Android + Android TV app for a clean, fast media experience. Direct download, dedicated support, and a full product page.",
      productPrimary: "Product page",
      productSecondary: "Case study",
      servicesEyebrow: "What I offer",
      servicesTitle: "Few services, but each one fully owned.",
      services: [
        {
          icon: "globe",
          title: "Personal / business website",
          body: "A multilingual, fast website with a clear identity, ready to scale. Exactly like this one.",
          tags: ["Next.js", "Supabase", "Vercel"],
        },
        {
          icon: "layout",
          title: "Product launch landing page",
          body: "One strong page that explains the value, builds trust, and converts within the first minute.",
          tags: ["Conversion", "SEO", "Motion"],
        },
        {
          icon: "phone",
          title: "Android app as a real product",
          body: "A native Android app shipped with the same identity as the site, the way MoPlayer is built.",
          tags: ["Kotlin", "Android TV", "Material 3"],
        },
        {
          icon: "video",
          title: "Tech content collaboration",
          body: "YouTube content that presents the product honestly and earns trust instead of pushing ads.",
          tags: ["YouTube", "Voiceover", "Storytelling"],
        },
      ],
      mediaEyebrow: "Arabic tech content",
      mediaTitle: "YouTube is part of the brand because it proves the thinking before any portfolio could.",
      mediaBody:
        "The channel follows the same principles as the site: clear explanation, honest presence, and content that respects the viewer's time.",
      mediaPrimary: "Open YouTube",
      contactEyebrow: "Start the conversation",
      contactTitle: "If your project needs cleaner structure and stronger presence, send the idea.",
      contactBody:
        "I work with founders, small teams, and creators who need a real lift in their digital presentation.",
      contactPrimary: "Get in touch",
    },
    cv: {
      eyebrow: "Curriculum vitæ",
      title: "Experience, working principles, and career path — in one structured page.",
      body:
        "This page is built for professional review: experience, principles, certifications, and a downloadable CV in two variants (designed + ATS-friendly).",
      principlesTitle: "Working principles",
      principles: [
        "Clarity before decoration, always.",
        "Structure that survives change without breaking.",
        "Interfaces tied to real business decisions.",
        "Real performance is non-negotiable next to visual quality.",
        "Arabic and English at the same level of polish.",
      ],
      downloadsTitle: "Download the CV",
      downloadsBody: "Two versions: a fully designed PDF and a concise ATS-ready version.",
      branded: "Download designed CV",
      ats: "Download concise CV (ATS)",
      experience: "Professional experience",
      certifications: "Certifications & credentials",
      approachTitle: "How I actually work",
      approach: [
        { title: "1 — Listen", body: "30-minute call. I learn the business, the audience, and the real problem — not just what's being asked." },
        { title: "2 — Propose", body: "A short brief: what's delivered, what's removed, what's added, and how long it takes." },
        { title: "3 — Build", body: "Phased execution with milestone deliveries. No disappearing, no 'I'll send it soon'." },
        { title: "4 — Ship & support", body: "Final delivery with documentation, plus a post-launch support window." },
      ],
      stackTitle: "Stack I use daily",
    },
    work: {
      eyebrow: "Work & case studies",
      title: "Six steps that connect the work to a business decision — for every project.",
      body:
        "Each project here is presented as a case study: challenge, solution, outcome, and the most important features. This isn't a gallery.",
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
      nextTitle: "If your story is close to this case, send the idea and let's start it properly.",
    },
    youtube: {
      eyebrow: "YouTube · Arabic tech content",
      title: "+1.5M views, +6K subscribers, and 162 real videos.",
      body:
        "The channel isn't an entertainment file — it's the trust layer of the brand. It explains products, explains tools, and connects the Arabic audience to tech content that respects them.",
      statsTitle: "Channel numbers",
      featured: "Featured video",
      latest: "Latest videos",
      channel: "Open the YouTube channel",
    },
    contact: {
      eyebrow: "Direct contact",
      title: "Send the idea. I'll come back within 24 hours with a clear next step.",
      body:
        "No need to prepare a formal brief. Write what you need in your own words, and I'll come back with a clearer version and a concrete step.",
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
      title: "A direct privacy summary — without legal jargon.",
      body:
        "This is the short version. For the full canonical document, use the public /privacy page.",
      cta: "Open full privacy policy",
      bullets: [
        "No invasive tracking. No data selling.",
        "Forms (contact, support) live in a secured Supabase database.",
        "Cookies are limited to language preference and theme mode.",
      ],
    },
    apps: {
      eyebrow: "Products & apps",
      title: "A small ecosystem of focused products, built to the same standard as this site: clearer, faster, more cohesive.",
      body:
        "Each app here is treated as a real product — identity, UI, releases, support. MoPlayer is the headline today. The rest is in deliberate, quiet construction.",
      featuredLabel: "Headline product",
      openProduct: "Product page",
      viewCase: "Case study",
      comingSoon: "Coming soon",
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
 *  HOME
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioHomePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).home;
  const featuredProjects = sortedProjects(model).slice(0, 3);
  const moPlayer = model.projects.find((project) => project.slug === "moplayer");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroParallax = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  const serviceIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    globe: Globe2,
    layout: Layers,
    phone: Smartphone,
    video: PlayCircle,
  };

  return (
    <div className="relative space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-16 md:pb-24 md:pt-6">
      {/* HERO */}
      <section ref={heroRef} className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <motion.div style={{ y: heroParallax }} aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-70">
          <div className="absolute left-[8%] top-[-15%] h-[460px] w-[460px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 60%)" }} />
          <div className="absolute right-[5%] bottom-[-20%] h-[520px] w-[520px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--secondary-glow), transparent 65%)" }} />
        </motion.div>

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Eyebrow>{copy.eyebrow}</Eyebrow>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="headline-display max-w-[28ch] text-[2.4rem] leading-[1.08] text-foreground sm:text-5xl md:text-[3.6rem] lg:text-[4.2rem]"
            >
              {copy.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[58ch] text-base leading-8 text-foreground-soft md:text-lg"
            >
              {copy.body}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              <Link href={`/${model.locale}/work`} className="button-primary-shell">
                {copy.primary}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href={`/${model.locale}/cv`} className="button-secondary-shell">{copy.secondary}</Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-xs font-bold text-foreground-muted"
            >
              <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> {model.profile.location}</span>
              <span className="hidden h-1 w-1 rounded-full bg-foreground-muted/60 md:inline-block" />
              <span>AR · EN · DE</span>
              <span className="hidden h-1 w-1 rounded-full bg-foreground-muted/60 md:inline-block" />
              <span>Next.js · Product · Content</span>
            </motion.div>
          </div>

          {/* Portrait */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative isolate"
          >
            <div aria-hidden className="absolute -inset-8 -z-10 rounded-[2.5rem] opacity-50 blur-3xl" style={{ background: "linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))" }} />
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-[2rem] border border-border-glass" style={{ background: "var(--surface)", boxShadow: "var(--shadow-hero)" }}>
              <Image src={model.portraitImage} alt={model.profile.name} fill priority sizes="(max-width: 1024px) 80vw, 32vw" className="object-cover" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 flex flex-col gap-1.5 text-white">
                <span className="text-[10px] font-bold tracking-[0.3em] text-white/75">{model.profile.location}</span>
                <span className="text-xl font-black leading-tight">{model.profile.name}</span>
                <span className="text-xs font-medium leading-snug text-white/80 line-clamp-2">{model.profile.subtitle}</span>
              </div>

              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {model.locale === "ar" ? "متاح للمشاريع" : "Available for projects"}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS RIBBON */}
      <Reveal>
        <section className="section-frame">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {copy.stats.map((stat, idx) => (
              <motion.article
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                className="glass-card p-5"
              >
                <div className="text-3xl font-black text-foreground md:text-4xl" style={{ background: "linear-gradient(135deg, var(--foreground), var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{stat.value}</div>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.22em] text-foreground-muted">{stat.label}</p>
              </motion.article>
            ))}
          </div>
        </section>
      </Reveal>

      {/* QUICK POSITIONING */}
      <Reveal>
        <section className="section-frame">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-3">
              <Eyebrow>{copy.quickEyebrow}</Eyebrow>
              <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.quickTitle}</h2>
              <p className="text-sm leading-7 text-foreground-soft md:text-base">{copy.quickBody}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {copy.strengths.map((item, idx) => (
                <Reveal key={item.title} delay={idx * 0.08}>
                  <article className="glass-card flex h-full flex-col gap-2 p-5">
                    <span className="text-[10px] font-bold tracking-[0.32em] text-primary">0{idx + 1}</span>
                    <h3 className="text-base font-black text-foreground">{item.title}</h3>
                    <p className="text-sm leading-7 text-foreground-muted">{item.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* PHILOSOPHY */}
      <Reveal>
        <section className="section-frame">
          <div className="glass-card relative overflow-hidden p-6 md:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--primary-glow)" }} />
            <div className="relative grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div className="space-y-4">
                <Eyebrow>{copy.philosophyEyebrow}</Eyebrow>
                <Quote className="h-10 w-10 text-primary opacity-60" />
                <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.philosophyTitle}</h2>
                <p className="text-sm leading-7 text-foreground-soft md:text-base">{copy.philosophyBody}</p>
              </div>
              <ul className="grid gap-3">
                {copy.philosophyPoints.map((point, idx) => (
                  <Reveal key={point} delay={idx * 0.06}>
                    <li className="flex items-start gap-3 rounded-2xl border border-border-glass bg-surface-soft p-4">
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>{idx + 1}</span>
                      <span className="text-sm leading-7 text-foreground-soft">{point}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </Reveal>

      {/* SELECTED WORK */}
      <Reveal>
        <section className="section-frame space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <Eyebrow>{copy.workEyebrow}</Eyebrow>
              <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.workTitle}</h2>
              <p className="text-sm leading-7 text-foreground-soft md:text-base">{copy.workBody}</p>
            </div>
            <Link href={`/${model.locale}/work`} className="button-secondary-shell self-start md:self-auto">
              {copy.primary}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featuredProjects.map((project, idx) => (
              <Reveal key={project.id} delay={idx * 0.08}>
                <article className="glass-card group flex h-full flex-col overflow-hidden">
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                    {project.slug === "moplayer" ? (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black tracking-[0.22em] text-primary backdrop-blur-md" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)" }}>
                        <Smartphone className="h-3 w-3" />
                        PRODUCT
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <span className="text-[10px] font-bold tracking-[0.28em] text-primary">{project.eyebrow || (model.locale === "ar" ? "مشروع" : "Project")}</span>
                    <h3 className="text-xl font-black text-foreground">{project.title}</h3>
                    <p className="text-sm leading-7 text-foreground-muted line-clamp-3">{project.summary}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <Link href={caseStudyHref(model.locale, project.slug)} className="button-secondary-shell !px-4 !py-2 text-sm">
                        {project.slug === "moplayer" ? copy.productSecondary : project.ctaLabel}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      {project.slug === "moplayer" ? (
                        <Link href="/app" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold text-primary transition" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)" }}>
                          <Smartphone className="h-4 w-4" />
                          {copy.productPrimary}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* MOPLAYER FEATURED */}
      {moPlayer ? (
        <Reveal>
          <section className="section-frame">
            <div
              className="relative overflow-hidden rounded-[2.25rem] border p-6 md:rounded-[2.75rem] md:p-10"
              style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--surface))", borderColor: "var(--primary-border)", boxShadow: "var(--shadow-elevated)" }}
            >
              <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl" style={{ background: "var(--primary-glow)" }} />
              <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div className="space-y-4">
                  <Eyebrow>{copy.productEyebrow}</Eyebrow>
                  <h2 className="headline-display text-3xl text-foreground md:text-5xl">{copy.productTitle}</h2>
                  <p className="max-w-xl text-sm leading-7 text-foreground-soft md:text-base">{copy.productBody}</p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href={`/${model.locale}/apps/moplayer`} className="button-primary-shell">
                      <Smartphone className="h-4 w-4" />
                      {copy.productPrimary}
                    </Link>
                    <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">{copy.productSecondary}</Link>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-bold text-foreground-muted">
                    <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> {model.locale === "ar" ? "إصدار 2.0.0" : "Version 2.0.0"}</span>
                    <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> {model.locale === "ar" ? "Android 7+ · Android TV" : "Android 7+ · Android TV"}</span>
                    <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> {model.locale === "ar" ? "بدون تتبع" : "No tracking"}</span>
                  </div>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-border-glass" style={{ background: "var(--surface)", boxShadow: "var(--shadow-elevated)" }}>
                  <Image src={moPlayer.image} alt={moPlayer.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}

      {/* SERVICES */}
      <Reveal>
        <section className="section-frame space-y-6">
          <div className="max-w-3xl space-y-3">
            <Eyebrow>{copy.servicesEyebrow}</Eyebrow>
            <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.servicesTitle}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {copy.services.map((service, idx) => {
              const Icon = serviceIconMap[service.icon] ?? Sparkles;
              return (
                <Reveal key={service.title} delay={idx * 0.08}>
                  <article className="glass-card group flex h-full flex-col gap-4 p-6 md:p-7">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)", color: "var(--primary)" }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[10px] font-bold tracking-[0.3em] text-foreground-muted">0{idx + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-foreground">{service.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-foreground-muted">{service.body}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2">
                      {service.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-border-glass bg-surface-soft px-3 py-1 text-[11px] font-bold text-foreground-soft">{tag}</span>
                      ))}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>
      </Reveal>

      {/* MEDIA / YOUTUBE */}
      <Reveal>
        <section className="section-frame">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="space-y-4">
              <Eyebrow>{copy.mediaEyebrow}</Eyebrow>
              <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.mediaTitle}</h2>
              <p className="max-w-xl text-sm leading-7 text-foreground-soft md:text-base">{copy.mediaBody}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href={`/${model.locale}/youtube`} className="button-secondary-shell">
                  <PlayCircle className="h-4 w-4" />
                  {copy.mediaPrimary}
                </Link>
                <Link href={`/${model.locale}/contact`} className="button-secondary-shell">
                  <Mail className="h-4 w-4" />
                  {copy.contactPrimary}
                </Link>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {model.latestVideos.slice(0, 2).map((video, idx) => (
                <Reveal key={video.id} delay={idx * 0.1}>
                  <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noopener noreferrer" className="glass-card group block overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 25vw" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-2xl">
                          <PlayCircle className="h-6 w-6" />
                        </div>
                      </div>
                      <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">{video.duration}</span>
                    </div>
                    <div className="space-y-1.5 p-4">
                      <h3 className="line-clamp-2 text-sm font-black text-foreground">
                        {model.locale === "ar" ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                      </h3>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* CONTACT CTA */}
      <Reveal>
        <section className="section-frame">
          <div className="contact-cta-frame">
            <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "var(--primary-glow)" }} />
            <div aria-hidden className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full opacity-30 blur-3xl" style={{ background: "var(--accent-glow)" }} />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <Eyebrow>{copy.contactEyebrow}</Eyebrow>
                <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.contactTitle}</h2>
                <p className="text-sm leading-7 text-foreground-soft md:text-base">{copy.contactBody}</p>
              </div>
              <Link href={`/${model.locale}/contact`} className="button-primary-shell self-start lg:self-auto">
                {copy.contactPrimary}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  CV
 * ─────────────────────────────────────────────────────────────────────────── */

const STACK_GROUPS = [
  { title: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind 4", "Framer Motion"] },
  { title: "Backend / Data", items: ["Supabase", "Postgres", "Edge Functions", "Vercel KV", "Zod"] },
  { title: "Mobile", items: ["Kotlin", "Android TV", "Material 3", "Hilt", "Compose"] },
  { title: "Tooling", items: ["Vercel", "GitHub Actions", "Playwright", "Vitest", "PNPM/NPM workspaces"] },
];

export function PortfolioCvPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).cv;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-16 md:pb-24 md:pt-6">
      {/* HERO */}
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-60">
          <div className="absolute left-[12%] top-[-15%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 60%)" }} />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h1 className="headline-display max-w-4xl text-4xl text-foreground md:text-5xl lg:text-[3.5rem]">{copy.title}</h1>
            <p className="max-w-3xl text-base leading-8 text-foreground-soft">{copy.body}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={model.downloads.branded} className="button-primary-shell">
                <Download className="h-4 w-4" />
                {copy.branded}
              </Link>
              <Link href={model.downloads.ats} className="button-secondary-shell">
                <Download className="h-4 w-4" />
                {copy.ats}
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <article className="glass-card p-5">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border border-border-glass" style={{ background: "var(--surface-soft)" }}>
                  <Image src={model.portraitImage} alt={model.profile.name} fill className="object-cover" sizes="64px" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{model.profile.name}</h3>
                  <p className="text-sm text-foreground-soft">{model.profile.subtitle}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-primary"><MapPin className="h-3.5 w-3.5" /> {model.profile.location}</p>
                </div>
              </div>
            </article>
            <article className="glass-card p-5">
              <h2 className="text-base font-black text-foreground">{copy.principlesTitle}</h2>
              <ul className="mt-4 grid gap-2.5">
                {copy.principles.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-7 text-foreground-soft">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* APPROACH (HOW I WORK) */}
      <Reveal>
        <section className="section-frame space-y-6">
          <div className="max-w-3xl space-y-3">
            <Eyebrow>{isAr ? "كيف أعمل" : "How I work"}</Eyebrow>
            <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.approachTitle}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {copy.approach.map((step, idx) => (
              <Reveal key={step.title} delay={idx * 0.06}>
                <article className="glass-card flex h-full flex-col gap-3 p-5">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>{idx + 1}</span>
                  <h3 className="text-base font-black text-foreground">{step.title}</h3>
                  <p className="text-sm leading-7 text-foreground-muted">{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* EXPERIENCE TIMELINE */}
      <Reveal>
        <section className="section-frame space-y-6">
          <div className="max-w-3xl space-y-3">
            <Eyebrow>{isAr ? "الخبرة" : "Experience"}</Eyebrow>
            <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.experience}</h2>
          </div>

          <div className="relative">
            {/* timeline rail */}
            <div className="absolute bottom-0 left-4 top-0 hidden w-px md:block" style={{ background: "var(--border-glass)" }} />
            <div className="grid gap-4">
              {model.cvExperience.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 0.05}>
                  <div className="relative md:pl-12">
                    <span className="absolute left-2.5 top-6 hidden h-3 w-3 rounded-full md:block" style={{ background: "var(--primary)", boxShadow: "0 0 0 4px var(--primary-soft)" }} />
                    <article className="glass-card p-5 md:p-6">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-black text-foreground">{item.role}</h3>
                          <p className="text-sm font-bold text-primary">{item.company}</p>
                        </div>
                        <div className="flex flex-col gap-1 text-xs font-bold text-foreground-muted md:items-end">
                          <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {item.period}</span>
                          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {item.location}</span>
                        </div>
                      </div>
                      {item.description ? <p className="mt-4 text-sm leading-7 text-foreground-soft">{item.description}</p> : null}
                      {item.highlights.length ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.highlights.map((h) => (
                            <span key={h} className="rounded-full border border-border-glass bg-surface-soft px-3 py-1 text-[11px] font-bold text-foreground-soft">{h}</span>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* STACK */}
      <Reveal>
        <section className="section-frame space-y-6">
          <div className="max-w-3xl space-y-3">
            <Eyebrow>{isAr ? "التقنيات" : "Tech stack"}</Eyebrow>
            <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.stackTitle}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STACK_GROUPS.map((group, idx) => (
              <Reveal key={group.title} delay={idx * 0.06}>
                <article className="glass-card flex h-full flex-col gap-3 p-5">
                  <h3 className="text-sm font-black text-primary">{group.title}</h3>
                  <ul className="grid gap-2">
                    {group.items.map((item) => (
                      <li key={item} className="text-sm font-medium text-foreground-soft">{item}</li>
                    ))}
                  </ul>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* CERTIFICATIONS */}
      {model.certifications.length ? (
        <Reveal>
          <section className="section-frame space-y-6">
            <div className="max-w-3xl space-y-3">
              <Eyebrow>{isAr ? "الشهادات" : "Credentials"}</Eyebrow>
              <h2 className="headline-display text-3xl text-foreground md:text-4xl">{copy.certifications}</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {model.certifications.map((item, idx) => (
                <Reveal key={item.id} delay={idx * 0.06}>
                  <article className="glass-card flex h-full flex-col gap-2 p-5">
                    <BadgeCheck className="h-6 w-6 text-primary" />
                    <h3 className="text-base font-black text-foreground">{item.name}</h3>
                    <p className="text-sm font-bold text-primary">{item.issuer}</p>
                    {item.description ? <p className="text-sm leading-7 text-foreground-muted">{item.description}</p> : null}
                    {item.issueDate ? <p className="mt-auto text-xs font-bold text-foreground-soft">{item.issueDate}</p> : null}
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  WORK list + project detail
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioWorkPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).work;
  const projects = sortedProjects(model);

  return (
    <div className="space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-16 md:pb-24 md:pt-6">
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-60">
          <div className="absolute right-[5%] top-[-15%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--secondary-glow), transparent 60%)" }} />
        </div>
        <div className="relative max-w-3xl space-y-4">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="headline-display text-4xl text-foreground md:text-5xl lg:text-[3.5rem]">{copy.title}</h1>
          <p className="text-base leading-8 text-foreground-soft">{copy.body}</p>
        </div>
      </section>

      <Reveal>
        <section className="section-frame grid gap-5 lg:grid-cols-2">
          {projects.map((project, idx) => (
            <Reveal key={project.id} delay={idx * 0.06}>
              <article className="glass-card group flex h-full flex-col overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 50vw" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.2em] text-primary" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)" }}>
                      {project.slug === "moplayer" ? "PRODUCT" : "CASE STUDY"}
                    </span>
                    {(project.tags ?? []).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full border border-border-glass bg-surface-soft px-3 py-1 text-[10px] font-bold text-foreground-soft">{tag}</span>
                    ))}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-foreground">{project.title}</h2>
                    <p className="mt-3 text-sm leading-7 text-foreground-muted">{project.description || project.summary}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-3">
                    <Link href={caseStudyHref(model.locale, project.slug)} className="button-secondary-shell !px-4 !py-2 text-sm">
                      <BriefcaseBusiness className="h-4 w-4" />
                      {copy.caseStudy}
                    </Link>
                    {project.slug === "moplayer" ? (
                      <Link href="/app" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold text-primary" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)" }}>
                        <Smartphone className="h-4 w-4" />
                        {copy.productPage}
                      </Link>
                    ) : null}
                    {project.repoUrl ? (
                      <Link href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border-glass bg-surface-soft px-4 py-2 text-sm font-bold text-foreground transition hover:bg-bg-secondary">
                        <ExternalLink className="h-4 w-4" />
                        {copy.repo}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </section>
      </Reveal>
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
    <div className="space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-16 md:pb-24 md:pt-6">
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-60">
          <div className="absolute left-[10%] top-[-20%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 60%)" }} />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div className="space-y-4">
            <Eyebrow>{project.eyebrow || (isMoPlayer ? (model.locale === "ar" ? "منتج · Android" : "Product · Android") : (model.locale === "ar" ? "دراسة حالة" : "Case study"))}</Eyebrow>
            <h1 className="headline-display text-4xl text-foreground md:text-5xl lg:text-[3.5rem]">{project.title}</h1>
            <p className="max-w-2xl text-base leading-8 text-foreground-soft">{project.description || project.summary}</p>
            <div className="flex flex-wrap gap-3">
              {isMoPlayer ? (
                <Link href="/app" className="button-primary-shell"><Smartphone className="h-4 w-4" />{copy.product}</Link>
              ) : project.href ? (
                <Link href={project.href} className="button-primary-shell" target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />{copy.visit}</Link>
              ) : null}
              <Link href={`/${model.locale}/contact`} className="button-secondary-shell">{copy.contact}</Link>
            </div>
            {project.tags?.length ? (
              <div className="flex flex-wrap gap-2 pt-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-border-glass bg-surface-soft px-3 py-1 text-[10px] font-bold text-foreground-soft">{tag}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative aspect-[16/11] overflow-hidden rounded-[1.8rem] border border-border-glass" style={{ background: "var(--surface)", boxShadow: "var(--shadow-elevated)" }}>
            <Image src={project.image} alt={project.title} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
          </div>
        </div>
      </section>

      <Reveal>
        <section className="section-frame grid gap-4 lg:grid-cols-3">
          {[
            { icon: Compass, title: copy.challenge, body: project.challenge, accent: "var(--primary)" },
            { icon: Workflow, title: copy.solution, body: project.solution, accent: "var(--secondary)" },
            { icon: Star, title: copy.result, body: project.result, accent: "var(--accent)" },
          ].map((card) => (
            <article key={card.title} className="glass-card flex h-full flex-col gap-3 p-5 md:p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--border-glass)", background: "var(--surface-soft)", color: card.accent }}>
                <card.icon className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-foreground">{card.title}</h2>
              <p className="text-sm leading-7 text-foreground-soft">{card.body}</p>
            </article>
          ))}
        </section>
      </Reveal>

      {project.metrics?.length ? (
        <Reveal>
          <section className="section-frame">
            <div className="grid gap-4 sm:grid-cols-3">
              {project.metrics.map((metric, idx) => (
                <Reveal key={`${metric.label}-${metric.value}`} delay={idx * 0.06}>
                  <article className="glass-card p-5">
                    <div className="text-3xl font-black" style={{ background: "linear-gradient(135deg, var(--foreground), var(--primary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{metric.value}</div>
                    <p className="mt-2 text-xs font-bold text-foreground-muted">{metric.label}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal>
        <section className="section-frame">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <h2 className="text-2xl font-black text-foreground">{copy.gallery}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {gallery.slice(0, 4).map((image, index) => (
              <Reveal key={`${image}-${index}`} delay={index * 0.05}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.5rem] border border-border-glass" style={{ background: "var(--surface)" }}>
                  <Image src={image} alt={`${project.title} ${index + 1}`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Next CTA */}
      <Reveal>
        <section className="section-frame">
          <div className="contact-cta-frame">
            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <Eyebrow>{copy.nextEyebrow}</Eyebrow>
                <h2 className="headline-display text-2xl text-foreground md:text-3xl">{copy.nextTitle}</h2>
              </div>
              <Link href={`/${model.locale}/contact`} className="button-primary-shell self-start lg:self-auto">
                {copy.contact}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  YOUTUBE
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioYoutubePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).youtube;
  const featured = model.featuredVideo ?? model.latestVideos[0] ?? null;
  const yt = model.youtube;

  return (
    <div className="space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-16 md:pb-24 md:pt-6">
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-60">
          <div className="absolute left-[5%] top-[-15%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--accent-glow), transparent 60%)" }} />
        </div>
        <div className="relative max-w-3xl space-y-4">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="headline-display text-4xl text-foreground md:text-5xl lg:text-[3.5rem]">{copy.title}</h1>
          <p className="text-base leading-8 text-foreground-soft">{copy.body}</p>
          <div className="pt-2">
            <a href={`https://www.youtube.com/${yt.handle ?? "@Moalfarras"}`} target="_blank" rel="noopener noreferrer" className="button-primary-shell">
              <PlayCircle className="h-4 w-4" />
              {copy.channel}
            </a>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="section-frame grid gap-3 sm:grid-cols-3">
          {[
            { value: yt.views ? `${(Number(yt.views) / 1_000_000).toFixed(1)}M+` : "1.5M+", label: model.locale === "ar" ? "إجمالي المشاهدات" : "Total views", icon: Eye },
            { value: yt.subscribers ? `${(Number(yt.subscribers) / 1000).toFixed(1)}K` : "6K", label: model.locale === "ar" ? "مشتركون" : "Subscribers", icon: Users },
            { value: yt.videos ?? 162, label: model.locale === "ar" ? "فيديوهات منشورة" : "Published videos", icon: PlayCircle },
          ].map((stat, idx) => (
            <Reveal key={stat.label} delay={idx * 0.06}>
              <article className="glass-card flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)", color: "var(--primary)" }}>
                  <stat.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-2xl font-black text-foreground">{String(stat.value)}</div>
                  <p className="text-xs font-bold text-foreground-muted">{stat.label}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </section>
      </Reveal>

      {featured ? (
        <Reveal>
          <section className="section-frame">
            <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <a href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noopener noreferrer" className="group relative aspect-video overflow-hidden rounded-[1.75rem] border border-border-glass" style={{ background: "var(--surface)", boxShadow: "var(--shadow-elevated)" }}>
                <Image src={featured.thumbnail} alt={featured.title_en || featured.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 45vw" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform group-hover:scale-110">
                    <PlayCircle className="h-7 w-7" />
                  </div>
                </div>
              </a>
              <div className="space-y-4">
                <Eyebrow>{copy.featured}</Eyebrow>
                <h2 className="headline-display text-3xl text-foreground md:text-4xl">
                  {model.locale === "ar" ? featured.title_ar || featured.title_en : featured.title_en || featured.title_ar}
                </h2>
                <p className="text-sm leading-7 text-foreground-soft">
                  {model.locale === "ar" ? featured.description_ar || featured.description_en : featured.description_en || featured.description_ar}
                </p>
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}

      <Reveal>
        <section className="section-frame space-y-4">
          <h2 className="text-2xl font-black text-foreground">{copy.latest}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {model.latestVideos.slice(0, 6).map((video, idx) => (
              <Reveal key={video.id} delay={idx * 0.05}>
                <a href={`https://www.youtube.com/watch?v=${video.youtube_id}`} target="_blank" rel="noopener noreferrer" className="glass-card group block overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-2xl">
                        <PlayCircle className="h-5 w-5" />
                      </div>
                    </div>
                    {video.duration ? <span className="absolute right-2 bottom-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">{video.duration}</span> : null}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="line-clamp-2 text-base font-black text-foreground">
                      {model.locale === "ar" ? video.title_ar || video.title_en : video.title_en || video.title_ar}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-6 text-foreground-muted">
                      {model.locale === "ar" ? video.description_ar || video.description_en : video.description_en || video.description_ar}
                    </p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  CONTACT
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioContactPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).contact;
  const email = model.contact.emailAddress;
  const whatsapp = model.contact.whatsappUrl;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-12 md:pb-24 md:pt-6">
      {/* HERO */}
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-60">
          <div className="absolute left-[10%] top-[-20%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 60%)" }} />
          <div className="absolute right-[5%] bottom-[-25%] h-[480px] w-[480px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--accent-glow), transparent 65%)" }} />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-5">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h1 className="headline-display text-4xl text-foreground md:text-5xl lg:text-[3.5rem]">{copy.title}</h1>
            <p className="max-w-xl text-base leading-8 text-foreground-soft">{copy.body}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href={`mailto:${email}`} className="button-primary-shell">
                <Mail className="h-4 w-4" />
                {email}
              </a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-whatsapp">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Availability card */}
          <article className="glass-card relative overflow-hidden p-6 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-foreground">{copy.availabilityTitle}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold text-emerald-500" style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.10)" }}>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {isAr ? "متاح" : "Available"}
              </span>
            </div>
            <ul className="mt-5 grid gap-2.5">
              {copy.availability.map((row) => (
                <li key={row.label} className="flex items-start justify-between gap-3 rounded-xl border border-border-glass bg-surface-soft px-4 py-3 text-sm">
                  <span className="font-bold text-foreground">{row.label}</span>
                  <span className="font-medium text-foreground-soft">{row.value}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* MAIN GRID — form + side (channels + response steps) */}
      <section className="section-frame grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <Reveal>
          <article className="glass-card p-5 md:p-7">
            <ContactForm locale={model.locale} whatsappUrl={whatsapp} />
          </article>
        </Reveal>

        <div className="space-y-5">
          <Reveal delay={0.05}>
            <article className="glass-card p-5 md:p-7">
              <h2 className="text-base font-black text-foreground">{copy.channelsTitle}</h2>
              <div className="mt-5 grid gap-3">
                <a href={`mailto:${email}`} className="group flex items-center gap-4 rounded-2xl border border-border-glass bg-surface-soft p-4 transition hover:border-primary/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--primary-border)", background: "var(--primary-soft)", color: "var(--primary)" }}>
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-foreground">Email</div>
                    <div className="truncate text-xs text-foreground-soft">{email}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:translate-x-1" />
                </a>

                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-border-glass bg-surface-soft p-4 transition hover:border-primary/40">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: "#128C7E" }}>
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-black text-foreground">WhatsApp</div>
                    <div className="truncate text-xs text-foreground-soft">{isAr ? "للرد السريع" : "Fastest reply"}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:translate-x-1" />
                </a>

                {model.contact.channels.filter((c) => c.type !== "email" && c.type !== "whatsapp").slice(0, 3).map((channel) => (
                  <a key={channel.id} href={channel.value} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-4 rounded-2xl border border-border-glass bg-surface-soft p-4 transition hover:border-primary/40">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border" style={{ borderColor: "var(--border-glass)", background: "var(--surface)", color: "var(--foreground)" }}>
                      <Globe2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-black text-foreground">{channel.label}</div>
                      <div className="truncate text-xs text-foreground-soft">{channel.description || channel.value}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-foreground-muted transition-transform group-hover:translate-x-1" />
                  </a>
                ))}
              </div>
            </article>
          </Reveal>

          <Reveal delay={0.1}>
            <article className="glass-card p-5 md:p-7">
              <h2 className="text-base font-black text-foreground">{copy.responseTitle}</h2>
              <ol className="mt-5 grid gap-3">
                {copy.responseSteps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>{idx + 1}</span>
                    <span className="text-sm leading-7 text-foreground-soft">{step}</span>
                  </li>
                ))}
              </ol>
            </article>
          </Reveal>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  PRIVACY
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioPrivacyPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).privacy;

  return (
    <div className="space-y-8 px-3 pb-16 pt-3 md:px-6 md:pb-24 md:pt-6">
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div className="relative max-w-3xl space-y-4">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="headline-display text-3xl text-foreground md:text-5xl">{copy.title}</h1>
          <p className="text-base leading-8 text-foreground-soft">{copy.body}</p>

          <ul className="mt-6 grid gap-3">
            {copy.bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 rounded-2xl border border-border-glass bg-surface-soft p-4 text-sm leading-7 text-foreground-soft">
                <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <Link href="/privacy" className="button-primary-shell">{copy.cta}<ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  APPS LIST
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioAppsPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).apps;
  const projects = sortedProjects(model);
  const moPlayer = projects.find((p) => p.slug === "moplayer");
  const otherApps = projects.filter((p) => p.slug !== "moplayer" && p.highlightStyle === "app");

  return (
    <div className="space-y-10 px-3 pb-16 pt-3 md:px-6 md:space-y-16 md:pb-24 md:pt-6">
      <section className="section-frame relative overflow-hidden rounded-[2.25rem] border border-border-glass bg-surface p-6 md:rounded-[2.75rem] md:p-12" style={{ boxShadow: "var(--shadow-elevated)" }}>
        <div aria-hidden className="aurora-layer pointer-events-none absolute -inset-32 opacity-60">
          <div className="absolute right-[10%] top-[-20%] h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--primary-glow), transparent 60%)" }} />
        </div>
        <div className="relative max-w-3xl space-y-4">
          <Eyebrow>{copy.eyebrow}</Eyebrow>
          <h1 className="headline-display text-4xl text-foreground md:text-5xl lg:text-[3.5rem]">{copy.title}</h1>
          <p className="text-base leading-8 text-foreground-soft">{copy.body}</p>
        </div>
      </section>

      {moPlayer ? (
        <Reveal>
          <section className="section-frame">
            <div
              className="relative overflow-hidden rounded-[2.25rem] border p-6 md:rounded-[2.75rem] md:p-10"
              style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--surface))", borderColor: "var(--primary-border)", boxShadow: "var(--shadow-elevated)" }}
            >
              <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div className="space-y-4">
                  <Eyebrow>{copy.featuredLabel}</Eyebrow>
                  <h2 className="headline-display text-3xl text-foreground md:text-5xl">{moPlayer.title}</h2>
                  <p className="max-w-xl text-sm leading-7 text-foreground-soft md:text-base">{moPlayer.description || moPlayer.summary}</p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-bold text-foreground-muted">
                    <span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> v2.0.0</span>
                    <span className="inline-flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> Android 7+</span>
                    <span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Android TV</span>
                    <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> {model.locale === "ar" ? "بدون تتبع" : "No tracking"}</span>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href="/app" className="button-primary-shell"><Smartphone className="h-4 w-4" />{copy.openProduct}</Link>
                    <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">{copy.viewCase}</Link>
                  </div>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-border-glass" style={{ background: "var(--surface)", boxShadow: "var(--shadow-elevated)" }}>
                  <Image src={moPlayer.image} alt={moPlayer.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      ) : null}

      {otherApps.length ? (
        <Reveal>
          <section className="section-frame grid gap-5 md:grid-cols-2">
            {otherApps.map((project) => (
              <article key={project.id} className="glass-card overflow-hidden">
                <div className="relative aspect-[16/10]">
                  <Image src={project.image} alt={project.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
                <div className="space-y-3 p-5">
                  <h3 className="text-xl font-black text-foreground">{project.title}</h3>
                  <p className="text-sm leading-7 text-foreground-muted line-clamp-3">{project.summary}</p>
                  <Link href={caseStudyHref(model.locale, project.slug)} className="button-secondary-shell !px-4 !py-2 text-sm">{copy.viewCase}<ArrowRight className="h-4 w-4" /></Link>
                </div>
              </article>
            ))}
          </section>
        </Reveal>
      ) : null}

      {/* ROADMAP */}
      <Reveal>
        <section className="section-frame">
          <div className="glass-card p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-black text-foreground md:text-2xl">{copy.roadmapTitle}</h2>
            </div>
            <ul className="mt-5 grid gap-3">
              {copy.roadmap.map((line, idx) => (
                <li key={line} className="flex items-start gap-3 rounded-2xl border border-border-glass bg-surface-soft p-4 text-sm leading-7 text-foreground-soft">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>{idx + 1}</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
