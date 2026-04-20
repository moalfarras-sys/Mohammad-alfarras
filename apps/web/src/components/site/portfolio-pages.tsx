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

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SlideIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  Bilingual copy — marketing-grade, premium, authentic
 * ─────────────────────────────────────────────────────────────────────────── */

function localeCopy(locale: Locale) {
  if (locale === "ar") {
    return {
      home: {
        eyebrow: "مطوّر · مصمم · صانع محتوى",
        titleLead: "أصنع تجارب رقمية",
        titleAccent: "تترك أثراً",
        titleTail: " — مواقع، تطبيقات، ومحتوى تقني يتحدث عنك بوضوح.",
        body:
          "أنا محمد الفراس. من الحسكة إلى ألمانيا، أبني مواقع وتطبيقات ومحتوى تقني عربياً يقف في مواجهة أي محتوى عالمي. كل ما تراه هنا صُنع بنفس المعيار الذي أقدّمه لعملائي — لا أقل.",
        primary: "اكتشف الأعمال",
        secondary: "السيرة الذاتية",
        quickEyebrow: "من أنا في سطرين",
        quickTitle: "هوية شخصية أولاً. منتجات حقيقية. أعمال تُثبت الكلام.",
        strengthsEyebrow: "ما يميّزني فعلاً",
        strengths: [
          {
            title: "تطوير ويب بمفهوم المنتج",
            body: "Next.js، React، TypeScript، Supabase. كل واجهة أبنيها تفكّر قبل أن تُزيَّن — القرار التجاري أولاً، الجمال البصري خادم له.",
          },
          {
            title: "تفكير لوجستي في كل مشروع",
            body: "عشر سنوات في التشغيل اليومي تحت الضغط الحقيقي تنعكس على كل سطر كود — سرعة تسليم، اعتمادية تامة، وتنفيذ لا يتنازل عن الجودة.",
          },
          {
            title: "أكثر من 1.5 مليون مشاهدة عربية",
            body: "القناة ليست هواية — هي دليل على أن المحتوى التقني العربي يستحق مستوى أعلى. والجمهور يعرف الفرق.",
          },
        ],
        statsEyebrow: "بالأرقام",
        stats: [
          { value: "1.5M+", label: "مشاهدة على يوتيوب" },
          { value: "6+", label: "سنوات خبرة برمجة ولوجستيات" },
          { value: "AR · EN · DE", label: "ثلاث لغات عمل" },
          { value: "🇩🇪 🇸🇾", label: "ألمانيا · الحسكة بالقلب" },
        ],
        philosophyEyebrow: "الفلسفة التي تحكم العمل",
        philosophyQuote: "الوضوح ليس رفاهية — هو الاحترام الأول للزائر.",
        philosophyPoints: [
          "أي صفحة يفهمها الزائر في أقل من 10 ثوانٍ — تنجح. وما فوق ذلك — تُخسر.",
          "التصميم الجميل بدون أداء حقيقي هو مشروع فاشل مُجمَّل.",
          "العربية والإنجليزية تستحقان نفس مستوى الاهتمام والدقة.",
          "منتج واحد ناضج ومكتمل خير من خمسة مشاريع في 'قيد التطوير'.",
        ],
        workEyebrow: "أعمال مختارة بعناية",
        workTitle: "كل مشروع هنا وُجد لحل مشكلة حقيقية.",
        workBody: "ليس معرض صور جاهزة — دراسات حالة أمينة: التحدي، القرار، والنتيجة القابلة للقياس.",
        productEyebrow: "المنتج البطل",
        productTitle: "MoPlayer — منتج حقيقي، ليس مشروعاً جانبياً.",
        productBody:
          "تطبيق Android و Android TV لتجربة وسائط نظيفة وبدون إعلانات أو تتبع. هوية واضحة، إصدارات منتظمة، دعم فعلي. هذا ما يعنيه بناء منتج بجدية.",
        productPrimary: "صفحة المنتج",
        productSecondary: "دراسة الحالة",
        servicesEyebrow: "ماذا أبني لك",
        servicesTitle: "خدمات أقل، جودة أعلى. ما أقبله أُتقنه.",
        services: [
          { title: "موقع شخصي أو تجاري", body: "موقع متعدد اللغات، سريع الأداء، بهوية مرتبة وبنية قابلة للنمو. ما يخجلك أن عميلك يراه — لا يصدر من عندي." },
          { title: "صفحة إطلاق منتج", body: "صفحة واحدة تشرح القيمة في دقيقة، تبني الثقة في أول نظرة، وتحوّل الزائر قبل أن ينتقل لمكان آخر." },
          { title: "تطبيق Android كمنتج كامل", body: "تطبيق نيتيف بكود حقيقي وهوية موحّدة مع موقعك — MoPlayer هو المثال الحي على ما أعنيه." },
          { title: "محتوى تقني على يوتيوب", body: "محتوى يشرح منتجك بصدق ويبني جمهوراً يثق قبل أن يشتري — أفضل بألف مرة من إعلان مدفوع." },
        ],
        mediaEyebrow: "يوتيوب · المحتوى التقني العربي",
        mediaTitle: "القناة دليل على طريقة التفكير — قبل أي معرض أعمال.",
        mediaPrimary: "اذهب إلى القناة",
        contactEyebrow: "ابدأ الحوار الآن",
        contactTitle: "فكرتك تستحق أن تُبنى بشكل صحيح. أرسلها.",
        contactBody:
          "أعمل مع أصحاب المشاريع والشركات الصغيرة وصُنّاع المحتوى الذين يريدون قفزة حقيقية في حضورهم الرقمي — ليس مجرد تحسين سطحي.",
        contactPrimary: "تواصل معي مباشرة",
      },
      cv: {
        eyebrow: "السيرة الذاتية",
        title: "الخبرة التي بنيت المسار — موثّقة في صفحة واحدة.",
        body:
          "هنا تجد الخبرة العملية، مبادئ العمل، الأدوات، والشهادات. السيرة قابلة للتنزيل بنسختين: مصمّمة كهوية بصرية، ومختصرة لأنظمة ATS.",
        principlesTitle: "مبادئ العمل لا تُساوَم عليها",
        principles: [
          "الوضوح أولاً — دائماً، قبل الجمال وقبل أي شيء آخر.",
          "بنية برمجية تتحمّل التغيير ولا تنهار عند أول تعديل.",
          "كل واجهة يجب أن تدعم قراراً تجارياً — ليس فقط تبدو جيدة.",
          "أداء فعلي لا يُتفاوض عليه بأي ذريعة جمالية.",
          "العربية والإنجليزية والألمانية — بنفس مستوى الاهتمام.",
        ],
        approachTitle: "كيف أعمل عملياً — بدون ادعاء",
        approach: [
          { title: "01. استمع أولاً", body: "جلسة 30 دقيقة أفهم فيها النشاط الحقيقي، الجمهور، والمشكلة الجذرية — ليس فقط 'ما يُطلب'." },
          { title: "02. أقترح بوضوح", body: "ملخص كتابي: ماذا سأبني، ماذا سأحذف، لماذا، وكم يستغرق — لا غموض." },
          { title: "03. أنفّذ بانضباط", body: "مراحل واضحة، تسليم مرحلي، تواصل مستمر. لا اختفاء ولا 'يفضل قليل'." },
          { title: "04. أسلّم وأدعم", body: "تسليم نهائي موثّق، مع فترة دعم ما بعد الإطلاق. ما أنتهي من مشروع وأتركك لوحدك." },
        ],
        downloadsTitle: "تحميل السيرة",
        branded: "النسخة المصمّمة كاملة",
        ats: "النسخة المختصرة (ATS)",
        experience: "الخبرة العملية",
        certifications: "الشهادات والاعتمادات",
        stackTitle: "الأدوات التي أستخدمها يومياً",
      },
      work: {
        eyebrow: "الأعمال · دراسات الحالة",
        title: "مشاريع بنيت لتُحلّ مشكلة، ليس لتملأ معرضاً.",
        body: "كل مشروع هنا دراسة حالة حقيقية: التحدي الذي واجهناه، القرار الهيكلي الذي اتخذناه، والنتيجة القابلة للقياس.",
        caseStudy: "دراسة الحالة",
        productPage: "صفحة المنتج",
        repo: "الكود المصدري",
      },
      project: {
        challenge: "التحدي",
        solution: "القرار",
        result: "النتيجة",
        metrics: "أرقام المشروع",
        gallery: "معرض الصور",
        product: "صفحة المنتج",
        visit: "زيارة الموقع",
        contact: "ابدأ مشروعاً مشابهاً",
        nextEyebrow: "ترى نفسك هنا؟",
        nextTitle: "إذا كانت حالتك قريبة من هذا المشروع — أرسل الفكرة الآن.",
      },
      youtube: {
        eyebrow: "قناة يوتيوب · تقنية عربية بلا تنازل",
        title: "أكثر من مليون ونصف مشاهدة. محتوى تقني عربي يحترم ذكاء المشاهد.",
        body: "القناة ليست ترفيهاً — هي طبقة الثقة في البراند. تشرح أدوات البرمجة، تُعرّف بالمنتجات، وتُثبت أن العربية تستحق محتوى تقنياً بمستوى عالمي.",
        featured: "الفيديو المميّز",
        latest: "آخر ما نشرته",
        channel: "افتح القناة كاملة",
      },
      contact: {
        eyebrow: "تواصل مباشر",
        title: "أرسل فكرتك الآن. سأعود بردّ واضح خلال 24 ساعة.",
        body:
          "لا تحتاج ملفاً رسمياً أو عرضاً جاهزاً. اكتب ما تحتاجه بكلماتك كما تفهمه، وأنا أُعيد ترتيبه وأقترح أوضح خطوة تالية.",
        availabilityTitle: "أوقات التواصل",
        availability: [
          { label: "السبت — الخميس", value: "10:00 – 19:00 (توقيت ألمانيا CET)" },
          { label: "الجمعة", value: "بريد إلكتروني فقط" },
          { label: "متوسط وقت الرد", value: "أقل من 24 ساعة" },
        ],
        channelsTitle: "قنوات التواصل المباشرة",
        responseTitle: "ماذا يحدث بعد أن ترسل؟",
        responseSteps: [
          "رد في غضون 24 ساعة — سؤال توضيحي أو موعد مكالمة قصيرة.",
          "ملخص مكتوب لما فهمته من فكرتك وما أقترحه.",
          "عرض واضح بالنطاق والسعر والجدول الزمني.",
          "لا بداية التنفيذ إلا بعد موافقتك الصريحة.",
        ],
      },
      privacy: {
        eyebrow: "الخصوصية",
        title: "سياسة خصوصية مباشرة — بدون لغة قانونية مُعقّدة.",
        body: "هذه نسخة موجزة وواضحة. للنسخة الكاملة من الوثيقة القانونية، استخدم الصفحة المخصصة.",
        cta: "افتح سياسة الخصوصية الكاملة",
        bullets: [
          "لا تتبع انتهازي. لا بيع للبيانات. لا إعلانات مخفية.",
          "النماذج (التواصل، الدعم) تُخزَّن في قاعدة Supabase آمنة ومشفّرة.",
          "الكوكيز محصورة في تذكّر اللغة المفضّلة والوضع البصري.",
        ],
      },
      apps: {
        eyebrow: "المنتجات والتطبيقات",
        title: "منظومة منتجات صغيرة، مبنية بنفس المعيار الذي تراه في الموقع.",
        body:
          "كل تطبيق هنا يُعامَل كمنتج كامل الهوية: واجهة، إصدارات، توثيق، ودعم. MoPlayer هو المنتج الرائد الآن.",
        featuredLabel: "المنتج البطل",
        openProduct: "صفحة المنتج",
        viewCase: "دراسة الحالة",
        roadmapTitle: "ما يأتي في الطريق",
        roadmap: [
          "MoPlayer 2.x — تحسينات الهاتف و Android TV مع ميزات جديدة.",
          "أدوات مستقلة من الموقع: PDF، CV Builder، وحاسبات مخصصة.",
          "مشروع مفاجأة يُعدّ بصمت — لا إعلان قبل الجاهزية الكاملة.",
        ],
      },
    } as const;
  }

  return {
    home: {
      eyebrow: "Developer · Designer · Creator",
      titleLead: "I build digital experiences",
      titleAccent: "that leave a mark",
      titleTail: " — websites, apps, and tech content that speak clearly for you.",
      body:
        "I'm Mohammad Alfarras. From Al-Hasakah to Germany, I build websites, apps, and Arabic tech content that can stand next to the world's best. Everything here is made at the same level I deliver to clients — not a pixel less.",
      primary: "Explore my work",
      secondary: "View CV",
      quickEyebrow: "The short version",
      quickTitle: "Personal brand first. Real products. Work that proves the words.",
      strengthsEyebrow: "What actually sets me apart",
      strengths: [
        {
          title: "Web development with a product mindset",
          body: "Next.js, React, TypeScript, Supabase. Every interface I build thinks before it decorates — business decision first, visual quality serving it.",
        },
        {
          title: "Logistics discipline in every project",
          body: "A decade of real-pressure operations translates directly into faster turnaround, reliable delivery, and code that doesn't break under change.",
        },
        {
          title: "1.5M+ Arabic tech views",
          body: "The channel isn't a hobby — it's proof that Arabic tech content deserves a higher standard. The audience notices the difference.",
        },
      ],
      statsEyebrow: "By the numbers",
      stats: [
        { value: "1.5M+", label: "YouTube views" },
        { value: "6+", label: "Years: code & logistics" },
        { value: "AR · EN · DE", label: "Three working languages" },
        { value: "🇩🇪 🇸🇾", label: "Germany · Al-Hasakah at heart" },
      ],
      philosophyEyebrow: "The philosophy that drives the work",
      philosophyQuote: "Clarity isn't a luxury — it's the first act of respect toward a visitor.",
      philosophyPoints: [
        "Any page the visitor understands in under 10 seconds — wins. Above that — loses them.",
        "A beautiful interface without real performance is a failed project with good makeup.",
        "Arabic, English, and German each deserve equal attention and polish.",
        "One complete, mature product beats five half-finished 'in progress' experiments.",
      ],
      workEyebrow: "Selected work",
      workTitle: "Every project here existed to solve a real problem.",
      workBody: "Not a screenshot gallery — honest case studies: the challenge, the structural decision, and the measurable result.",
      productEyebrow: "Headline product",
      productTitle: "MoPlayer — a real product, not a side project.",
      productBody:
        "An Android + Android TV app for a clean, ad-free media experience. Clear identity, regular releases, real support. This is what building a product seriously looks like.",
      productPrimary: "Product page",
      productSecondary: "Case study",
      servicesEyebrow: "What I build for you",
      servicesTitle: "Fewer services. Higher quality. What I accept, I master.",
      services: [
        { title: "Personal or business website", body: "Multilingual, fast, well-structured identity ready to scale. Nothing that would embarrass you when a client visits." },
        { title: "Product launch landing page", body: "One powerful page that explains the value in under a minute, builds trust on first glance, and converts before the visitor leaves." },
        { title: "Android app as a real product", body: "A native Android app shipped with a unified identity — MoPlayer is the live proof of what I mean." },
        { title: "YouTube tech content", body: "Content that explains your product honestly and builds an audience that trusts before they buy — better than any paid ad." },
      ],
      mediaEyebrow: "YouTube · Arabic tech content",
      mediaTitle: "The channel proves the thinking — before any portfolio could.",
      mediaPrimary: "Open the channel",
      contactEyebrow: "Start the conversation",
      contactTitle: "Your idea deserves to be built right. Send it.",
      contactBody:
        "I work with business owners, small teams, and creators who want a real jump in their digital presence — not just a surface-level refresh.",
      contactPrimary: "Get in touch directly",
    },
    cv: {
      eyebrow: "Curriculum Vitæ",
      title: "The experience that built the path — documented in one clear page.",
      body:
        "Here you'll find real work experience, core principles, tools, and credentials. CV available in two downloads: a fully designed branded version, and an ATS-optimised concise version.",
      principlesTitle: "Non-negotiable working principles",
      principles: [
        "Clarity first — always, before beauty and before anything else.",
        "Code architecture that survives change without collapsing at the first edit.",
        "Every interface must support a business decision — not just look good.",
        "Real performance is non-negotiable for any aesthetic reason.",
        "Arabic, English, and German — each at the same level of care.",
      ],
      approachTitle: "How I actually work — no pretense",
      approach: [
        { title: "01. Listen first", body: "A 30-minute session where I understand the real business, audience, and root problem — not just 'what's being asked for'." },
        { title: "02. Propose clearly", body: "A written summary: what I'll build, what I'll remove, why, and how long it takes — zero ambiguity." },
        { title: "03. Execute with discipline", body: "Clear phases, milestone deliveries, continuous communication. No disappearing and no 'almost done'." },
        { title: "04. Ship and support", body: "Full documented delivery plus a post-launch support window. I don't finish a project and leave you alone." },
      ],
      downloadsTitle: "Download the CV",
      branded: "Full designed version",
      ats: "Concise version (ATS)",
      experience: "Professional experience",
      certifications: "Certifications & credentials",
      stackTitle: "Tools I use every day",
    },
    work: {
      eyebrow: "Work · Case Studies",
      title: "Projects built to solve problems, not to fill a gallery.",
      body: "Every project here is an honest case study: the challenge we faced, the structural decision we made, and the measurable result.",
      caseStudy: "Case study",
      productPage: "Product page",
      repo: "Source code",
    },
    project: {
      challenge: "Challenge",
      solution: "Decision",
      result: "Result",
      metrics: "Project metrics",
      gallery: "Gallery",
      product: "Product page",
      visit: "Visit link",
      contact: "Start a similar project",
      nextEyebrow: "See yourself here?",
      nextTitle: "If your situation is close to this case — send the idea now.",
    },
    youtube: {
      eyebrow: "YouTube · Arabic tech, no compromise",
      title: "Over 1.5 million views. Arabic tech content that respects your intelligence.",
      body: "The channel isn't entertainment — it's the brand's trust layer. It explains programming tools, introduces products, and proves that Arabic deserves world-class tech content.",
      featured: "Featured video",
      latest: "Latest published",
      channel: "Open the full channel",
    },
    contact: {
      eyebrow: "Direct contact",
      title: "Send the idea now. I'll reply with a clear step within 24 hours.",
      body:
        "No formal brief needed. Write what you need in your own words as you understand it — I'll reorganise it and propose the clearest next step.",
      availabilityTitle: "Availability",
      availability: [
        { label: "Sat – Thu", value: "10:00 – 19:00 (Germany CET)" },
        { label: "Friday", value: "Email only" },
        { label: "Average reply time", value: "Under 24 hours" },
      ],
      channelsTitle: "Direct contact channels",
      responseTitle: "What happens after you send?",
      responseSteps: [
        "Reply within 24h — a clarifying question or a short call slot.",
        "A written summary of what I understood from your idea and what I propose.",
        "A clear scope, price, and timeline offer.",
        "Work starts only after your explicit confirmation.",
      ],
    },
    privacy: {
      eyebrow: "Privacy",
      title: "A direct privacy summary — no complex legal language.",
      body: "This is the concise, readable version. For the full canonical legal document, use the dedicated page.",
      cta: "Open full privacy policy",
      bullets: [
        "No invasive tracking. No data selling. No hidden ads.",
        "Forms (contact, support) stored in a secure, encrypted Supabase database.",
        "Cookies limited to language preference and visual theme mode.",
      ],
    },
    apps: {
      eyebrow: "Products & Apps",
      title: "A small product ecosystem, built to the same standard as this site.",
      body:
        "Every app here is treated as a complete product — identity, UI, releases, documentation, and support. MoPlayer is the lead product today.",
      featuredLabel: "Lead product",
      openProduct: "Product page",
      viewCase: "Case study",
      roadmapTitle: "What's coming",
      roadmap: [
        "MoPlayer 2.x — phone and Android TV improvements with new capabilities.",
        "Standalone site tools: PDF generator, CV Builder, and custom calculators.",
        "A surprise project in quiet preparation — no announcement before it's fully ready.",
      ],
    },
  } as const;
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  HOME — Cinematic hero with protofeilnew.jpeg
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioHomePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).home;
  const featuredProjects = sortedProjects(model).slice(0, 3);
  const moPlayer = model.projects.find((p) => p.slug === "moplayer");

  const liveServices = model.services?.length
    ? model.services.map((svc) => ({ title: svc.title, body: svc.body }))
    : copy.services;

  return (
    <div className="space-y-20 pb-20 pt-0 md:space-y-28 md:pb-28">
      {/* ── CINEMATIC HERO — Full-width with protofeilnew.jpeg ── */}
      <section className="page-hero-home relative min-h-[85vh] overflow-hidden md:min-h-screen">
        {/* Hero Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/protofeilnew.jpeg"
            alt="محمد الفراس / Mohammad Alfarras"
            fill
            priority
            className="object-cover object-center hero-reveal"
            sizes="100vw"
          />
          {/* Gradient overlays for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 section-frame flex min-h-[85vh] flex-col justify-center py-24 md:min-h-screen md:py-32 stagger-children">
          <div className="max-w-[680px]">
            {/* Live status */}
            <div className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-foreground-muted">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>{model.locale === "ar" ? "متاح للمشاريع الجديدة" : "Open to new projects"}</span>
            </div>

            <Eyebrow>{copy.eyebrow}</Eyebrow>

            <h1 className="headline-display mt-6 text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.04] text-foreground">
              {copy.titleLead}{" "}
              <span className="gradient-text italic">{copy.titleAccent}</span>
              {copy.titleTail}
            </h1>

            <p className="mt-6 max-w-[55ch] text-base leading-8 text-foreground-soft md:text-lg">
              {copy.body}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href={`/${model.locale}/work`} className="button-accent-shell">
                {copy.primary}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link href={`/${model.locale}/cv`} className="button-secondary-shell">
                {copy.secondary}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-foreground-muted">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
                {model.profile.location}
              </span>
              <span>·</span>
              <span>AR · EN · DE</span>
              <span>·</span>
              <span>Next.js · Android · YouTube</span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1 text-foreground-muted"
          >
            <div className="h-10 w-px" style={{ background: "linear-gradient(to bottom, transparent, var(--foreground-muted))" }} />
          </motion.div>
        </div>
      </section>

      {/* ── STATS INLINE ── */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-x-8 gap-y-10 border-y py-10 md:grid-cols-4" style={{ borderColor: "var(--border)" }}>
            {copy.stats.map((s) => (
              <div key={s.label}>
                <div className="headline-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none" style={{ color: "var(--accent)" }}>{s.value}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── STRENGTHS ── */}
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
                <FadeIn key={item.title} delay={idx * 0.07}>
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

      {/* ── PHILOSOPHY ── */}
      <FadeIn>
        <section className="section-frame">
          <div className="mx-auto max-w-3xl">
            <Eyebrow>{copy.philosophyEyebrow}</Eyebrow>
            <Quote className="mx-auto mt-8 h-10 w-10 text-foreground-muted/40" />
            <blockquote className="headline-display mt-4 text-balance text-center text-[clamp(1.75rem,4vw,3rem)] leading-[1.2] text-foreground">
              "{copy.philosophyQuote}"
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

      {/* ── SELECTED WORK ── */}
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

      {/* ── MOPLAYER FEATURE ── */}
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
                  <Link href={`/${model.locale}/apps/moplayer`} className="button-accent-shell">
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
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)] md:aspect-[5/6]" style={{ border: "1px solid var(--border)" }}>
                <Image src={moPlayer.image} alt={moPlayer.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" />
              </div>
            </div>
          </section>
        </FadeIn>
      ) : null}

      {/* ── SERVICES ── */}
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

      {/* ── YOUTUBE PREVIEW ── */}
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
                      <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" sizes="(max-width: 768px) 100vw, 25vw" />
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

      {/* ── CONTACT CTA ── */}
      <FadeIn>
        <section className="section-frame">
          <div className="contact-cta-frame px-6 py-12 md:p-14">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>{copy.contactEyebrow}</Eyebrow>
              <h2 className="headline-display mt-4 text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] text-foreground">
                {copy.contactTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-foreground-soft md:text-base">{copy.contactBody}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={`/${model.locale}/contact`} className="button-accent-shell">
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
 *  CV — with portrait.jpg as hero identity image
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
    <div className="space-y-20 pb-20 pt-0 md:space-y-28 md:pb-28">
      {/* ── CINEMATIC HERO — portrait.jpg ── */}
      <section className="page-hero-cv relative overflow-hidden">
        <div className="section-frame relative">
          <div className="grid gap-12 py-16 md:grid-cols-[1fr_0.55fr] md:items-center md:py-24">
            <div className="stagger-children">
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
                {copy.title}
              </h1>
              <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href={model.downloads.branded} className="button-accent-shell">
                  <Download className="h-4 w-4" />
                  {copy.branded}
                </Link>
                <Link href={model.downloads.ats} className="button-secondary-shell">
                  <Download className="h-4 w-4" />
                  {copy.ats}
                </Link>
              </div>
            </div>

            {/* Portrait image — big and clear */}
            <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-[var(--radius-xl)] md:mx-0" style={{ border: "1px solid var(--border)" }}>
              <Image
                src="/images/portrait.jpg"
                alt={`${model.profile.name} — ${isAr ? "السيرة الذاتية" : "Curriculum Vitæ"}`}
                fill
                priority
                className="object-cover hero-reveal"
                sizes="(max-width: 768px) 100vw, 320px"
              />
              {/* Subtle overlay with name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                <p className="font-semibold text-white">{model.profile.name}</p>
                <p className="text-xs text-white/75">{model.profile.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRINCIPLES + IDENTITY ── */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-10 md:grid-cols-[0.4fr_0.6fr] md:items-start md:gap-16">
            <div>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl" style={{ border: "1px solid var(--border)" }}>
                  <Image src="/images/portrait.jpg" alt={model.profile.name} fill className="object-cover" sizes="64px" />
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

      {/* ── APPROACH ── */}
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

      {/* ── EXPERIENCE ── */}
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

      {/* ── STACK ── */}
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

      {/* ── CERTIFICATIONS ── */}
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
 *  WORK — with service_logistics.png + improved layout
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioWorkPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).work;
  const projects = sortedProjects(model);
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-16 pb-20 pt-0 md:space-y-24 md:pb-28">
      {/* ── CINEMATIC HERO with service_logistics image ── */}
      <section className="page-hero-work relative overflow-hidden">
        <div className="section-frame relative">
          <div className="grid gap-12 py-16 md:grid-cols-[1fr_0.6fr] md:items-center md:py-24">
            <div className="stagger-children">
              <Eyebrow>{copy.eyebrow}</Eyebrow>
              <h1 className="headline-display mt-6 max-w-[22ch] text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
                {copy.title}
              </h1>
              <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
            </div>
            {/* service_logistics.png as hero visual for Work page */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-xl)]" style={{ border: "1px solid var(--border)" }}>
              <Image
                src="/images/service_logistics.png"
                alt={isAr ? "مشاريع محمد الفراس" : "Mohammad Alfarras Work"}
                fill
                priority
                className="object-cover hero-reveal"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* ── PROJECTS LIST ── */}
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
                      <Image src={project.image} alt={project.title} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 220px" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-foreground-muted">
                        {project.slug === "moplayer" ? "Product · Android" : isAr ? "دراسة حالة" : "Case study"}
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

/* ─────────────────────────────────────────────────────────────────────────────
 *  PROJECT DETAIL
 * ─────────────────────────────────────────────────────────────────────────── */

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
              <Link href={`/${model.locale}/apps/moplayer`} className="button-accent-shell">
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
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-xl)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
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
                  <div className="headline-display text-[clamp(1.75rem,3vw,2.25rem)] leading-none" style={{ color: "var(--accent)" }}>{metric.value}</div>
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
                <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-lg)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                  <Image src={image} alt={`${project.title} ${index + 1}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn>
        <section className="section-frame">
          <div className="contact-cta-frame px-6 py-10 md:p-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <Eyebrow>{copy.nextEyebrow}</Eyebrow>
                <h3 className="headline-display mt-3 text-xl text-foreground md:text-2xl">{copy.nextTitle}</h3>
              </div>
              <Link href={`/${model.locale}/contact`} className="button-accent-shell self-start md:self-auto">
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
 *  YOUTUBE — with hero-profile-bg.png as cinematic hero
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioYoutubePage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).youtube;
  const featured = model.featuredVideo ?? model.latestVideos[0] ?? null;
  const yt = model.youtube;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-16 pb-20 pt-0 md:space-y-24 md:pb-28">
      {/* ── CINEMATIC HERO with hero-profile-bg.png ── */}
      <section className="page-hero-youtube relative min-h-[70vh] overflow-hidden md:min-h-[80vh]">
        {/* Hero image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-profile-bg.png"
            alt={isAr ? "قناة يوتيوب محمد الفراس" : "Mohammad Alfarras YouTube Channel"}
            fill
            priority
            className="object-cover object-center hero-reveal"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        {/* Content */}
        <div className="relative z-10 section-frame flex min-h-[70vh] flex-col justify-end py-16 md:min-h-[80vh] md:py-24">
          <div className="max-w-[600px] stagger-children">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h1 className="headline-display mt-6 text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
              {copy.title}
            </h1>
            <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
            <a
              href={`https://www.youtube.com/${yt.handle ?? "@Moalfarras"}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button-accent-shell mt-8 inline-flex"
            >
              <PlayCircle className="h-4 w-4" />
              {copy.channel}
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <FadeIn>
        <section className="section-frame">
          <div className="grid gap-x-8 gap-y-10 border-y py-10 sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
            {[
              { value: yt.views ? `${(Number(yt.views) / 1_000_000).toFixed(1)}M+` : "1.5M+", label: isAr ? "إجمالي المشاهدات" : "Total views" },
              { value: yt.subscribers ? `${(Number(yt.subscribers) / 1000).toFixed(1)}K` : "6K", label: isAr ? "مشتركون" : "Subscribers" },
              { value: yt.videos ?? 162, label: isAr ? "فيديوهات منشورة" : "Published videos" },
            ].map((s) => (
              <div key={s.label}>
                <div className="headline-display text-[clamp(1.75rem,3vw,2.5rem)] leading-none" style={{ color: "var(--accent)" }}>{String(s.value)}</div>
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
              <a href={`https://www.youtube.com/watch?v=${featured.youtube_id}`} target="_blank" rel="noopener noreferrer" className="group relative aspect-video overflow-hidden rounded-[var(--radius-xl)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
                <Image src={featured.thumbnail} alt={featured.title_en || featured.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(max-width: 768px) 100vw, 60vw" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black shadow-2xl transition-transform group-hover:scale-110">
                    <PlayCircle className="h-7 w-7" />
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
                    <Image src={video.thumbnail} alt={video.title_en || video.youtube_id} fill className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" sizes="(max-width: 768px) 100vw, 33vw" />
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
 *  CONTACT — hero_tech.png + logo overlay
 * ─────────────────────────────────────────────────────────────────────────── */

export function PortfolioContactPage({ model }: { model: SiteViewModel }) {
  const copy = localeCopy(model.locale).contact;
  const email = model.contact.emailAddress;
  const whatsapp = model.contact.whatsappUrl;
  const isAr = model.locale === "ar";

  return (
    <div className="space-y-16 pb-20 pt-0 md:space-y-20 md:pb-28">
      {/* ── CINEMATIC HERO — hero_tech.png + logo overlay ── */}
      <section className="page-hero-contact relative min-h-[65vh] overflow-hidden md:min-h-[72vh]">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero_tech.png"
            alt={isAr ? "تواصل مع محمد الفراس" : "Contact Mohammad Alfarras"}
            fill
            priority
            className="object-cover object-center hero-reveal"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-background via-background/70 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        {/* Logo badge overlay */}
        <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 md:block lg:right-16">
          <div className="float flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl" style={{ background: "var(--surface)", border: "2px solid var(--primary-border)", boxShadow: "var(--shadow-glow-cyan)" }}>
            <Image src="/images/logo.png" alt="Mohammad Alfarras Logo" width={100} height={100} className="h-full w-full object-contain p-2" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 section-frame flex min-h-[65vh] flex-col justify-end py-16 md:min-h-[72vh] md:py-24">
          <div className="max-w-[560px] stagger-children">
            <Eyebrow>{copy.eyebrow}</Eyebrow>
            <h1 className="headline-display mt-6 text-[clamp(2rem,5vw,4rem)] leading-[1.08] text-foreground">
              {copy.title}
            </h1>
            <p className="prose-frame mt-6 text-base leading-7 text-foreground-soft md:text-lg">{copy.body}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={`mailto:${email}`} className="button-accent-shell">
                <Mail className="h-4 w-4" />
                {email}
              </a>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-whatsapp">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FORM + SIDEBAR ── */}
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
                  <a href={`mailto:${email}`} className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3 transition-all duration-300 hover:bg-surface-soft hover:border-[var(--primary-border)]" style={{ border: "1px solid var(--border)" }}>
                    <span className="flex items-center gap-3">
                      <Mail className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold text-foreground">Email</span>
                    </span>
                    <span className="truncate text-xs text-foreground-muted">{email}</span>
                  </a>
                </li>
                <li>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] px-4 py-3 transition-all duration-300 hover:bg-surface-soft hover:border-[var(--primary-border)]" style={{ border: "1px solid var(--border)" }}>
                    <span className="flex items-center gap-3">
                      <MessageCircle className="h-4 w-4" style={{ color: "var(--accent)" }} />
                      <span className="text-sm font-semibold text-foreground">WhatsApp</span>
                    </span>
                    <span className="text-xs text-foreground-muted">{isAr ? "للرد الأسرع دائماً" : "Fastest reply always"}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <Eyebrow>{copy.responseTitle}</Eyebrow>
              <ol className="mt-6 grid gap-4">
                {copy.responseSteps.map((step, idx) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: "var(--accent)", color: "#000" }}>
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

        <Link href="/privacy" className="button-accent-shell mt-10 inline-flex">
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
                  <Link href={`/${model.locale}/apps/moplayer`} className="button-accent-shell">
                    <Smartphone className="h-4 w-4" />
                    {copy.openProduct}
                  </Link>
                  <Link href={caseStudyHref(model.locale, "moplayer")} className="button-secondary-shell">
                    {copy.viewCase}
                  </Link>
                </div>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)]" style={{ border: "1px solid var(--border)", background: "var(--surface-soft)" }}>
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
