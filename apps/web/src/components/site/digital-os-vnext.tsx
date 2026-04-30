import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  BriefcaseBusiness,
  CalendarDays,
  Code2,
  Compass,
  Cpu,
  Eye,
  Film,
  Globe2,
  Headphones,
  ListVideo,
  Mail,
  MonitorPlay,
  PlayCircle,
  Radio,
  Truck,
  Users,
} from "lucide-react";

import { AppsShowcasePage } from "@/components/site/apps-showcase-page";
import { ContactHubPage } from "@/components/site/contact-hub-page";
import { InteractiveCvPage } from "@/components/site/interactive-cv-page";
import { WorkDigitalExhibition } from "@/components/site/work-digital-exhibition";
import { PageShell, SectionHeader } from "@/components/ui/os-primitives";
import { socialLinks } from "@/content/site";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

import type { SiteViewModel } from "./site-view-model";

const homepageCopy = {
  en: {
    eyebrow: "Mohammad Alfarras Digital OS",
    title: "I build websites, digital presence, tech content, and systems that connect real work with technology.",
    body:
      "A premium personal hub for web design, development, digital marketing, YouTube storytelling, logistics experience, and the technology work I keep building around.",
    primary: "Explore the work",
    secondary: "Start a conversation",
    proof: ["Web design & development", "Digital marketing mindset", "Arabic tech creator", "Logistics discipline"],
    exploreEyebrow: "What you can explore",
    exploreTitle: "Move through the main parts of the ecosystem.",
    exploreBody: "Each card opens a focused part of the site: work, products, content, profile, or collaboration.",
    positioningEyebrow: "Personal operating system",
    positioningTitle: "A practical digital identity shaped by web craft, content, logistics, and technology.",
    positioningBody:
      "I connect polished websites, marketing-aware digital experiences, Arabic tech content, and operations discipline into one clear ecosystem. The goal is simple: make ideas easier to understand, easier to trust, and easier to move forward.",
    highlightsEyebrow: "Quick signals",
    highlightsTitle: "One profile, several useful lanes.",
    ctaEyebrow: "Next step",
    ctaTitle: "Choose the path that matches what you need now.",
    ctaBody: "Browse the work, discover MoPlayer, watch the YouTube channel, or send a project inquiry.",
    ctaWork: "See work",
    ctaApps: "Discover MoPlayer",
    ctaYoutube: "Watch YouTube",
    ctaContact: "Contact",
    portraitLabel: "Mohammad Alfarras",
    portraitRole: "Web / Marketing / YouTube / Logistics / Technology",
    explore: [
      { title: "Work", body: "Selected websites, service flows, and digital experiences built for clarity and trust.", href: "work", cta: "View projects" },
      { title: "Apps / MoPlayer", body: "A product surface for MoPlayer with activation, support, releases, and app positioning.", href: "apps/moplayer", cta: "Open product" },
      { title: "YouTube", body: "Arabic tech videos, product reviews, tutorials, and content that explains technology simply.", href: "youtube", cta: "Visit channel" },
      { title: "CV", body: "A focused professional profile across logistics, web systems, content, and product work.", href: "cv", cta: "Read profile" },
      { title: "Contact", body: "A clean path for project inquiries, collaboration, support, or a practical next step.", href: "contact", cta: "Start inquiry" },
      { title: "Story", body: "The thread behind the work: operations pressure, technology curiosity, and building useful systems.", href: "about", cta: "Learn more" },
    ],
    highlights: [
      { value: "Web", label: "Design, frontend, bilingual structure" },
      { value: "MoPlayer", label: "Product thinking and Android TV surface" },
      { value: "YouTube", label: "Arabic technology storytelling" },
      { value: "Logistics", label: "Real-world systems and service clarity" },
    ],
  },
  ar: {
    eyebrow: "نظام محمد الفراس الرقمي",
    title: "أبني مواقع وحضوراً رقمياً ومحتوى تقنياً يربط العمل الحقيقي بالتكنولوجيا.",
    body:
      "واجهة شخصية فاخرة تجمع تصميم وتطوير المواقع، التسويق الرقمي، يوتيوب، الخبرة اللوجستية، وحب التكنولوجيا والبناء المستمر.",
    primary: "استكشف الأعمال",
    secondary: "ابدأ محادثة",
    proof: ["تصميم وتطوير مواقع", "تفكير تسويقي رقمي", "صانع محتوى تقني عربي", "انضباط لوجستي عملي"],
    exploreEyebrow: "ماذا تجد هنا",
    exploreTitle: "تنقّل بين المسارات الأساسية للمنظومة.",
    exploreBody: "كل بطاقة تفتح جزءاً واضحاً من الموقع: الأعمال، المنتجات، المحتوى، السيرة، أو التعاون.",
    positioningEyebrow: "نظام شخصي واضح",
    positioningTitle: "هوية رقمية عملية تجمع صنعة الويب، المحتوى، اللوجستيات، والتكنولوجيا.",
    positioningBody:
      "أربط المواقع المصقولة، التجارب الرقمية ذات الحس التسويقي، المحتوى التقني العربي، والانضباط التشغيلي داخل منظومة واحدة واضحة. الهدف أن تصبح الأفكار أسهل فهماً، أكثر ثقة، وأقرب للتنفيذ.",
    highlightsEyebrow: "إشارات سريعة",
    highlightsTitle: "شخصية واحدة ومسارات مفيدة متعددة.",
    ctaEyebrow: "الخطوة التالية",
    ctaTitle: "اختر المسار المناسب لما تحتاجه الآن.",
    ctaBody: "تصفح الأعمال، اكتشف MoPlayer، شاهد محتوى يوتيوب، أو أرسل طلب تعاون.",
    ctaWork: "شاهد الأعمال",
    ctaApps: "اكتشف MoPlayer",
    ctaYoutube: "شاهد يوتيوب",
    ctaContact: "تواصل",
    portraitLabel: "محمد الفراس",
    portraitRole: "ويب / تسويق / يوتيوب / لوجستيات / تكنولوجيا",
    explore: [
      { title: "الأعمال", body: "مواقع وتجارب رقمية مختارة مبنية للوضوح والثقة واتخاذ القرار.", href: "work", cta: "عرض المشاريع" },
      { title: "التطبيقات / MoPlayer", body: "واجهة منتج كاملة لـ MoPlayer تشمل التفعيل والدعم والإصدارات والتموضع.", href: "apps/moplayer", cta: "فتح المنتج" },
      { title: "يوتيوب", body: "محتوى تقني عربي، مراجعات، شروحات، وتجارب تجعل التكنولوجيا أسهل فهماً.", href: "youtube", cta: "زيارة القناة" },
      { title: "السيرة", body: "ملف مهني واضح يجمع اللوجستيات، أنظمة الويب، المحتوى، والعمل على المنتجات.", href: "cv", cta: "قراءة الملف" },
      { title: "تواصل", body: "مسار واضح لطلبات المشاريع، التعاون، الدعم، أو تحديد الخطوة العملية التالية.", href: "contact", cta: "ابدأ الطلب" },
      { title: "القصة", body: "الخيط الذي يجمع العمل: ضغط العمليات، فضول التكنولوجيا، وبناء أنظمة مفيدة.", href: "about", cta: "اعرف أكثر" },
    ],
    highlights: [
      { value: "Web", label: "تصميم، واجهات، وبنية ثنائية اللغة" },
      { value: "MoPlayer", label: "تفكير منتج وتجربة Android TV" },
      { value: "YouTube", label: "سرد تقني عربي واضح" },
      { value: "Logistics", label: "أنظمة واقعية ووضوح في الخدمات" },
    ],
  },
} as const;

const workPageCopy = {
  en: {
    hero: {
      eyebrow: "Selected Work",
      title: "Digital systems built for real businesses.",
      subtitle:
        "A curated look at websites, product surfaces, and digital experiences I designed around clarity, trust, and action — from moving and transport companies to MoPlayer, my Android TV app ecosystem.",
      positioning:
        "I do not build pages only to look good. I build digital systems that explain the offer, guide the customer, and make the next step obvious.",
      primary: "View case studies",
      secondary: "Start a project",
      tertiary: "Need a website like this?",
    },
    intro: {
      title: "Projects with structure, story, and conversion in mind.",
      text:
        "Every project starts with the same question: what does the customer need to understand quickly? From there, I shape the layout, content, visuals, and contact flow so the website feels clear, trustworthy, and easy to use on mobile and desktop.",
    },
    projects: [
      {
        label: "Moving company website",
        title: "Schnell Sicher Umzug",
        url: "https://schnellsicherumzug.de/",
        line: "A structured service website for moving, disposal, and furniture assembly requests.",
        description:
          "Schnell Sicher Umzug needed a website that presents practical moving services without confusing the customer. The experience is built around clear service categories, quick contact options, pricing orientation, and a request flow that works well on mobile.",
        focus:
          "I focused on making the service understandable fast: what the company offers, where it operates, how to request a quote, and how the customer can take the next step without friction.",
        highlights: [
          "Clear service structure for moving, disposal, and assembly",
          "Mobile-first request and contact flow",
          "Trust-building copy for Berlin and Germany-wide service",
          "Strong calls to action for quote requests and WhatsApp contact",
          "Visual hierarchy designed for quick decision-making",
        ],
        cta: "Build a service website like this",
        image: "/images/projects/schnell-home-case.png",
        secondaryImage: "/images/projects/schnell-service-case.png",
        tone: "cyan",
      },
      {
        label: "Moving / relocation website",
        title: "Intelligent Umzüge",
        url: "https://www.intelligent-umzuege.de/",
        line: "A conversion-focused moving website with pricing clarity and direct inquiry paths.",
        description:
          "Intelligent Umzüge is designed around the questions customers ask before a move: how much does it cost, how quickly can I get help, and how can I request a reliable offer? The page structure brings pricing, inspection, WhatsApp contact, and service trust into one clear flow.",
        focus:
          "The goal was to make the website feel direct and useful: customers can understand the offer, compare service options, and move quickly toward contact or inspection.",
        highlights: [
          "Clear pricing orientation and service packages",
          "Strong WhatsApp and inquiry CTAs",
          "Free inspection positioning for larger moves",
          "Berlin, Germany-wide, and Europe-wide service framing",
          "Trust-focused sections for planning and execution",
        ],
        cta: "Request a conversion-focused website",
        image: "/images/projects/intelligent-umzuege-home.png",
        secondaryImage: "/images/projects/intelligent-umzuege-mobile.png",
        tone: "violet",
      },
      {
        label: "Vehicle transport / towing website",
        title: "A&D Fahrzeugtransporte",
        url: "https://www.adtransporte.de/",
        line: "A direct-response website for towing, vehicle transport, and emergency service.",
        description:
          "A&D Fahrzeugtransporte needed a strong digital presence for urgent and planned vehicle transport requests. The website is structured to communicate trust fast: 24/7 availability, Berlin and Brandenburg coverage, direct phone and WhatsApp contact, and clear service categories for different transport needs.",
        focus:
          "For this kind of business, speed and trust matter. The layout helps visitors understand the service immediately and contact the company without searching.",
        highlights: [
          "Emergency-first hero for towing and vehicle transport",
          "Direct contact paths for phone, WhatsApp, and inquiry",
          "Clear service categories for towing, transport, transfer, and machinery",
          "Strong local positioning for Berlin and Brandenburg",
          "Visual structure designed for urgency and trust",
        ],
        cta: "Create a transport website like this",
        image: "/images/projects/adtransporte-home.png",
        secondaryImage: "/images/projects/adtransporte-mobile.png",
        tone: "gold",
      },
    ],
    product: {
      label: "Android TV product / IPTV app",
      title: "MoPlayer",
      line: "A custom Android TV media product built around activation, sources, and a TV-first interface.",
      description:
        "MoPlayer is my own Android TV app ecosystem — a product that connects Android development, product design, IPTV source management, activation flows, weather and match widgets, and a website-based release/download system.",
      focus:
        "MoPlayer is more than an app screen. It is a product system: Android app, website, release pipeline, activation, remote configuration, and user setup flow working together.",
      highlights: [
        "Android TV-first interface direction",
        "MO-XXXX device activation flow",
        "Xtream and M3U source support",
        "Weather and football widgets through website proxies",
        "APK release metadata and official download flow",
        "Admin and remote configuration foundation",
      ],
      cta: "Explore MoPlayer",
    },
    ecosystem: {
      label: "Personal brand / product ecosystem",
      title: "moalfarras.space",
      line: "A personal digital OS connecting portfolio, content, products, CV, and admin control.",
      description:
        "This website is designed as the central hub for my work: web projects, MoPlayer, YouTube content, CV, contact, and future digital products. The goal is to turn a personal portfolio into a structured ecosystem that can grow over time.",
      focus:
        "The goal is not just to present who I am, but to make the whole ecosystem understandable: what I build, what I create, and how people can work with me.",
      highlights: [
        "Personal brand system",
        "Multi-language Arabic/English experience",
        "MoPlayer product pages and activation routes",
        "CV and project presentation",
        "Admin control direction",
        "Designed to connect work, content, and products",
      ],
      cta: "Build a digital ecosystem",
    },
    offer: {
      title: "Want a project with the same level of clarity?",
      text:
        "I design and build websites for people and businesses that need more than a simple online page. Whether it is a transport company, moving service, product landing page, app ecosystem, or personal brand, the goal is the same: make the offer clear, make the design trustworthy, and make the next step easy.",
      cards: [
        ["Business websites", "For companies that need a serious, mobile-friendly presence with clear services and contact flow."],
        ["Service company websites", "For moving, transport, towing, cleaning, local services, and appointment-based businesses."],
        ["Product pages", "For apps, tools, digital products, and offers that need a strong presentation."],
        ["UI/UX redesign", "For existing websites that feel outdated, confusing, or weak on mobile."],
        ["Admin and control systems", "For projects that need content control, releases, media, messages, or business workflows."],
        ["Bilingual experiences", "For websites that need Arabic, English, or German-friendly communication."],
      ],
      ctaTitle: "Have an idea or a business that needs a stronger digital presence?",
      ctaText:
        "Send me what you want to build. I can help shape the structure, design, content, and user flow so the final result feels professional and easy to use.",
      buttons: ["Start a project", "Contact me", "View MoPlayer"],
    },
    labels: {
      live: "Live website",
      focus: "What I focused on",
      similar: "Need something similar?",
      jump: "Project index",
    },
  },
  ar: {
    hero: {
      eyebrow: "أعمال مختارة",
      title: "أنظمة رقمية مصممة لأعمال حقيقية.",
      subtitle:
        "مجموعة من المواقع، صفحات المنتجات، وتجارب الويب التي صممتها حول الوضوح، الثقة، وسهولة الوصول للخطوة التالية — من مواقع النقل والخدمات إلى MoPlayer كتجربة تطبيق Android TV.",
      positioning:
        "أنا لا أبني صفحات فقط لتبدو جميلة. أبني تجربة رقمية تساعد الزائر أن يفهم الخدمة بسرعة، يثق بالعرض، ويتخذ الخطوة التالية بسهولة.",
      primary: "استعرض المشاريع",
      secondary: "ابدأ مشروعك",
      tertiary: "تريد موقعًا مشابهًا؟",
    },
    intro: {
      title: "مشاريع مبنية على الوضوح، القصة، والتحويل.",
      text:
        "كل مشروع يبدأ بسؤال بسيط: ما الذي يحتاج العميل أن يفهمه بسرعة؟ بعدها أبني هيكل الصفحة، النصوص، الصور، وتجربة التواصل حتى يكون الموقع واضحًا، موثوقًا، وسهل الاستخدام على الجوال والكمبيوتر.",
    },
    projects: [
      {
        label: "موقع شركة نقل",
        title: "Schnell Sicher Umzug",
        url: "https://schnellsicherumzug.de/",
        line: "موقع خدمات منظم للنقل، التخلص من الأثاث، وتركيب الأثاث.",
        description:
          "Schnell Sicher Umzug يحتاج إلى موقع يشرح الخدمات العملية بطريقة واضحة وغير معقدة. التجربة مبنية حول تصنيفات خدمات واضحة، طرق تواصل سريعة، توجيه سعري، ونموذج طلب مناسب للجوال.",
        focus:
          "ركزت على جعل الخدمة مفهومة من أول لحظة: ماذا تقدم الشركة، أين تعمل، كيف يطلب العميل عرض سعر، وما هي الخطوة التالية بدون تعقيد.",
        highlights: [
          "تنظيم واضح لخدمات النقل، التخلص، والتركيب",
          "تجربة طلب وتواصل مناسبة للجوال",
          "نصوص تبني الثقة لخدمات برلين وألمانيا",
          "دعوات واضحة لطلب عرض سعر أو التواصل عبر واتساب",
          "ترتيب بصري يساعد العميل على اتخاذ القرار بسرعة",
        ],
        cta: "صمّم موقع خدمات مشابه",
        image: "/images/projects/schnell-home-case.png",
        secondaryImage: "/images/projects/schnell-service-case.png",
        tone: "cyan",
      },
      {
        label: "موقع نقل وانتقال",
        title: "Intelligent Umzüge",
        url: "https://www.intelligent-umzuege.de/",
        line: "موقع نقل يركز على وضوح الأسعار وسهولة إرسال الطلب.",
        description:
          "Intelligent Umzüge مبني حول الأسئلة التي يطرحها العميل قبل الانتقال: ما التكلفة؟ كيف أتواصل بسرعة؟ وهل يمكنني الحصول على عرض واضح؟ لذلك تم تنظيم الصفحة حول الأسعار، المعاينة المجانية، واتساب، وبناء الثقة بالخدمة.",
        focus:
          "الهدف كان أن يشعر الزائر أن الموقع مباشر ومفيد: يفهم العرض، يقارن الخيارات، وينتقل بسرعة إلى التواصل أو حجز معاينة.",
        highlights: [
          "عرض واضح للأسعار وباقات الخدمة",
          "دعوات قوية للتواصل عبر واتساب والطلب المباشر",
          "إبراز المعاينة المجانية للمشاريع الأكبر",
          "توضيح نطاق الخدمة في برلين، ألمانيا، وأوروبا",
          "أقسام تعزز الثقة في التخطيط والتنفيذ",
        ],
        cta: "اطلب موقعًا يركز على التحويل",
        image: "/images/projects/intelligent-umzuege-home.png",
        secondaryImage: "/images/projects/intelligent-umzuege-mobile.png",
        tone: "violet",
      },
      {
        label: "موقع نقل وسحب سيارات",
        title: "A&D Fahrzeugtransporte",
        url: "https://www.adtransporte.de/",
        line: "موقع مباشر لخدمات السحب، نقل السيارات، وحالات الطوارئ.",
        description:
          "A&D Fahrzeugtransporte يحتاج إلى حضور رقمي قوي لطلبات السحب والنقل العاجلة والمخططة. تم بناء الموقع ليعرض الثقة بسرعة: توفر 24/7، خدمة في برلين وبراندنبورغ، تواصل مباشر عبر الهاتف والواتساب، وتصنيفات خدمة واضحة.",
        focus:
          "في هذا النوع من الأعمال، السرعة والثقة هما الأهم. لذلك يساعد التصميم الزائر أن يفهم الخدمة فورًا ويتواصل بدون بحث طويل.",
        highlights: [
          "هيرو موجه للطوارئ وخدمات نقل السيارات",
          "طرق تواصل مباشرة: هاتف، واتساب، ونموذج طلب",
          "تصنيفات واضحة للسحب، النقل، التحويلات، والمعدات",
          "تموضع محلي قوي في برلين وبراندنبورغ",
          "تصميم يخدم السرعة والثقة في قرار التواصل",
        ],
        cta: "أنشئ موقع نقل مشابه",
        image: "/images/projects/adtransporte-home.png",
        secondaryImage: "/images/projects/adtransporte-mobile.png",
        tone: "gold",
      },
    ],
    product: {
      label: "تطبيق Android TV / IPTV",
      title: "MoPlayer",
      line: "تجربة Android TV مخصصة لإدارة المصادر، التفعيل، وتشغيل المحتوى بواجهة تلفزيونية.",
      description:
        "MoPlayer هو منظومة تطبيق Android TV خاصة بي، تجمع بين تطوير أندرويد، تصميم المنتج، إدارة مصادر IPTV، التفعيل عبر الموقع، وواجهات الطقس والمباريات، مع نظام إصدار وتحميل رسمي من الموقع.",
      focus:
        "MoPlayer ليس مجرد شاشة تطبيق. هو نظام منتج كامل: تطبيق أندرويد، موقع، إصدار، تفعيل، إعدادات عن بعد، وتجربة استخدام متصلة.",
      highlights: [
        "واجهة موجهة لتجربة Android TV",
        "نظام تفعيل الجهاز بكود MO-XXXX",
        "دعم مصادر Xtream و M3U",
        "ويدجت الطقس والمباريات عبر الموقع بدون أسرار داخل التطبيق",
        "نظام إصدار APK وبيانات تحميل رسمية",
        "أساس للتحكم من الأدمن والإعدادات عن بعد",
      ],
      cta: "استكشف MoPlayer",
    },
    ecosystem: {
      label: "هوية شخصية ومنظومة رقمية",
      title: "moalfarras.space",
      line: "منظومة شخصية تجمع الأعمال، المحتوى، المنتجات، السيرة الذاتية، والتحكم من الأدمن.",
      description:
        "هذا الموقع هو المركز الرئيسي لأعمالي: المشاريع، MoPlayer، محتوى يوتيوب، السيرة الذاتية، التواصل، والمنتجات الرقمية القادمة. الهدف هو تحويل الموقع الشخصي إلى منظومة واضحة قابلة للتوسع.",
      focus:
        "الهدف ليس فقط أن أعرض من أنا، بل أن أجعل كل المنظومة مفهومة: ماذا أبني، ماذا أقدم، وكيف يمكن للناس العمل معي.",
      highlights: [
        "نظام هوية شخصية",
        "تجربة متعددة اللغات بالعربي والإنجليزي",
        "صفحات MoPlayer وروابط التفعيل",
        "عرض السيرة الذاتية والمشاريع",
        "اتجاه واضح للوحة تحكم وإدارة المحتوى",
        "ربط العمل، المحتوى، والمنتجات في مكان واحد",
      ],
      cta: "ابنِ منظومة رقمية",
    },
    offer: {
      title: "تريد مشروعًا بنفس مستوى الوضوح؟",
      text:
        "أصمم وأبني مواقع للأشخاص والشركات التي تحتاج أكثر من صفحة عادية على الإنترنت. سواء كان المشروع لشركة نقل، خدمة محلية، صفحة منتج، تطبيق، أو هوية شخصية، الهدف واحد: عرض واضح، تصميم موثوق، وخطوة تواصل سهلة.",
      cards: [
        ["مواقع أعمال", "للشركات التي تحتاج حضورًا احترافيًا وسهل الاستخدام على الجوال."],
        ["مواقع شركات خدمات", "للنقل، السحب، التنظيف، الخدمات المحلية، والمواعيد."],
        ["صفحات منتجات", "للتطبيقات، الأدوات، والمنتجات الرقمية التي تحتاج عرضًا قويًا."],
        ["إعادة تصميم UI/UX", "للمواقع القديمة أو الضعيفة أو غير الواضحة على الجوال."],
        ["لوحات تحكم وأنظمة إدارة", "للمشاريع التي تحتاج إدارة محتوى، إصدارات، صور، رسائل، أو عمليات عمل."],
        ["تجارب متعددة اللغات", "لمواقع تحتاج تواصلًا عربيًا، إنجليزيًا، أو ألمانيًا بشكل واضح."],
      ],
      ctaTitle: "عندك فكرة أو مشروع يحتاج حضورًا رقميًا أقوى؟",
      ctaText:
        "أرسل لي ما تريد بناءه. أستطيع مساعدتك في ترتيب الفكرة، التصميم، النصوص، وتجربة المستخدم حتى تكون النتيجة احترافية وسهلة الاستخدام.",
      buttons: ["ابدأ مشروعك", "تواصل معي", "استكشف MoPlayer"],
    },
    labels: {
      live: "الموقع المباشر",
      focus: "محور التركيز",
      similar: "تحتاج شيئًا مشابهًا؟",
      jump: "فهرس المشاريع",
    },
  },
} as const;

const youtubePageCopy = {
  en: {
    hero: {
      eyebrow: "Premium Arabic tech channel",
      title: "Level up your knowledge with Mohammad Alfarras.",
      subtitle:
        "Product reviews, tutorials, Android TV experiments, apps, and practical technology stories presented in Arabic with a clear, useful, and modern creator voice.",
      subscribe: "Subscribe on YouTube",
      watch: "Watch spotlight",
      stats: ["Subscribers", "Total views", "Videos"],
    },
    spotlight: {
      eyebrow: "Featured video spotlight",
      title: "A cinematic starting point for the channel.",
      body:
        "Start with a highlighted video, then move through the latest uploads and curated series. The channel is built for people who want technology explained with practical context, not noise.",
      watch: "Watch now",
    },
    grid: {
      eyebrow: "Latest masterpieces",
      title: "Fresh videos, reviews, and practical tech stories.",
      body: "A fast, visual way to explore recent videos from the channel.",
      views: "views",
      play: "Play",
    },
    playlists: {
      eyebrow: "Playlists and series",
      title: "Choose the lane you want to explore.",
      items: [
        ["Product Reviews", "Honest Arabic reviews for useful tech, apps, and devices."],
        ["Android TV Lab", "MoPlayer, media systems, activation flows, and TV-first experiences."],
        ["Creator Tools", "Software, workflows, and production tools that make digital work sharper."],
        ["Practical Tutorials", "Clear explanations for people who want to learn and apply quickly."],
      ],
    },
    cta: {
      title: "Join our growing community today!",
      body: "Subscribe for Arabic technology content that respects your time and helps you understand what is actually useful.",
      primary: "Subscribe on YouTube",
      secondary: "Start a collaboration",
    },
  },
  ar: {
    hero: {
      eyebrow: "قناة تقنية عربية فاخرة",
      title: "ارتقِ بمعرفتك مع محمد الفراس.",
      subtitle:
        "مراجعات منتجات، شروحات، تجارب Android TV، تطبيقات، وقصص تقنية عملية باللغة العربية بصوت واضح وحديث ومفيد.",
      subscribe: "اشترك على يوتيوب",
      watch: "شاهد الفيديو المميز",
      stats: ["المشتركون", "إجمالي المشاهدات", "الفيديوهات"],
    },
    spotlight: {
      eyebrow: "الفيديو المميز",
      title: "نقطة بداية سينمائية للقناة.",
      body:
        "ابدأ من فيديو بارز، ثم تنقّل بين آخر الفيديوهات والسلاسل المختارة. القناة مبنية لمن يريد فهم التكنولوجيا بسياق عملي، لا بضجيج زائد.",
      watch: "شاهد الآن",
    },
    grid: {
      eyebrow: "أحدث الأعمال",
      title: "فيديوهات حديثة، مراجعات، وقصص تقنية عملية.",
      body: "طريقة بصرية وسريعة لاستكشاف آخر محتوى القناة.",
      views: "مشاهدة",
      play: "تشغيل",
    },
    playlists: {
      eyebrow: "السلاسل والقوائم",
      title: "اختر المسار الذي تريد استكشافه.",
      items: [
        ["مراجعات المنتجات", "مراجعات عربية واضحة للتقنية، التطبيقات، والأجهزة المفيدة."],
        ["مختبر Android TV", "MoPlayer، أنظمة الميديا، التفعيل، وتجارب التلفزيون."],
        ["أدوات صناع المحتوى", "برامج وسير عمل وأدوات تجعل العمل الرقمي أكثر احترافاً."],
        ["شروحات عملية", "شرح واضح لمن يريد أن يتعلم ويطبق بسرعة."],
      ],
    },
    cta: {
      title: "انضم إلى مجتمعنا المتنامي اليوم!",
      body: "اشترك لمتابعة محتوى تقني عربي يحترم وقتك ويساعدك على فهم ما هو مفيد فعلاً.",
      primary: "اشترك على يوتيوب",
      secondary: "ابدأ تعاوناً",
    },
  },
} as const;

const copy = {
  en: {
    home: {
      eyebrow: "Independent digital builder",
      title: "Websites, product pages, and media systems that feel clear from the first screen.",
      body:
        "A rebuilt digital home for Mohammad Alfarras: practical, bilingual, product-aware, and shaped around fast understanding instead of decorative noise.",
      primary: "View work",
      secondary: "Start a project",
      sections: "What this site connects",
    },
    work: {
      eyebrow: "Selected work",
      title: "Projects with structure, proof, and a clear next step.",
      body: "Each case is presented around the problem, the build, and the result.",
    },
    services: {
      eyebrow: "Services",
      title: "Digital systems for companies, products, and creators.",
      body: "The work combines positioning, UX, interface design, implementation, and launch support.",
    },
    apps: {
      eyebrow: "Products",
      title: "MoPlayer sits inside a complete product surface.",
      body: "Activation, support, releases, screenshots, and product messaging in one public experience.",
    },
    youtube: {
      eyebrow: "Media",
      title: "Arabic technical storytelling with product sense.",
      body: "Videos, reviews, and tutorials become part of the same trust system as the website.",
    },
    cv: {
      eyebrow: "Career",
      title: "Operations discipline, frontend execution, and product communication.",
      body: "A practical profile across logistics, web systems, Android TV product work, and Arabic technical content.",
    },
    contact: {
      eyebrow: "Contact",
      title: "Tell me what needs to become clearer.",
      body: "Send the current situation, the weak point, and the outcome you want. The next step becomes easier from there.",
    },
    about: {
      eyebrow: "About",
      title: "A builder shaped by real operations and digital execution.",
      body: "From logistics pressure to websites, apps, and Arabic technical media, the thread is disciplined clarity.",
    },
    labels: {
      location: "Base",
      views: "Views",
      subscribers: "Subscribers",
      videos: "Videos",
      openProject: "Open project",
      openProduct: "Open product",
      visitChannel: "Visit channel",
      downloadPdf: "PDF",
      downloadDocx: "DOCX",
      contact: "Contact",
    },
    pillars: [
      { title: "Web systems", body: "Business websites, landing pages, service flows, and bilingual content." },
      { title: "Product surfaces", body: "MoPlayer, activation, release pages, app support, and product clarity." },
      { title: "Media proof", body: "Arabic tech videos, reviews, tutorials, and audience trust." },
      { title: "Operations thinking", body: "Logistics-shaped structure for real services and customer decisions." },
    ],
  },
  ar: {
    home: {
      eyebrow: "بناء رقمي مستقل",
      title: "مواقع وصفحات منتجات وأنظمة محتوى تُفهم من أول شاشة.",
      body:
        "واجهة جديدة لمحمد الفراس: عملية، ثنائية اللغة، واضحة حول المنتج، ومبنية للفهم السريع بدل الزخرفة المربكة.",
      primary: "عرض الأعمال",
      secondary: "ابدأ مشروعاً",
      sections: "ماذا يربط الموقع",
    },
    work: {
      eyebrow: "أعمال مختارة",
      title: "مشاريع فيها بنية ودليل وخطوة تالية واضحة.",
      body: "كل حالة تُعرض حول المشكلة، ما تم بناؤه، والنتيجة.",
    },
    services: {
      eyebrow: "الخدمات",
      title: "أنظمة رقمية للشركات والمنتجات وصناع المحتوى.",
      body: "العمل يجمع التموضع، تجربة المستخدم، تصميم الواجهة، التنفيذ، ودعم الإطلاق.",
    },
    apps: {
      eyebrow: "المنتجات",
      title: "MoPlayer ضمن واجهة منتج كاملة.",
      body: "التفعيل، الدعم، الإصدارات، اللقطات، ورسائل المنتج داخل تجربة واحدة.",
    },
    youtube: {
      eyebrow: "المحتوى",
      title: "سرد تقني عربي يفهم المنتج.",
      body: "الفيديوهات والمراجعات والشروحات تصبح جزءاً من نفس نظام الثقة في الموقع.",
    },
    cv: {
      eyebrow: "المسار",
      title: "انضباط تشغيلي، تنفيذ واجهات، وتواصل حول المنتجات.",
      body: "ملف عملي يجمع اللوجستيات، أنظمة الويب، Android TV، والمحتوى التقني العربي.",
    },
    contact: {
      eyebrow: "تواصل",
      title: "اشرح لي ما الذي يحتاج أن يصبح أوضح.",
      body: "أرسل الوضع الحالي، نقطة الضعف، والنتيجة المطلوبة. بعدها تصبح الخطوة التالية أسهل.",
    },
    about: {
      eyebrow: "نبذة",
      title: "صانع تشكل بين العمل الواقعي والتنفيذ الرقمي.",
      body: "من ضغط اللوجستيات إلى المواقع والتطبيقات والمحتوى التقني العربي، الخيط هو الوضوح المنضبط.",
    },
    labels: {
      location: "الموقع",
      views: "المشاهدات",
      subscribers: "المشتركين",
      videos: "الفيديوهات",
      openProject: "فتح المشروع",
      openProduct: "فتح المنتج",
      visitChannel: "زيارة القناة",
      downloadPdf: "PDF",
      downloadDocx: "DOCX",
      contact: "تواصل",
    },
    pillars: [
      { title: "أنظمة ويب", body: "مواقع شركات، صفحات هبوط، مسارات خدمات، ومحتوى ثنائي اللغة." },
      { title: "واجهات منتجات", body: "MoPlayer، التفعيل، صفحات الإصدارات، الدعم، ووضوح المنتج." },
      { title: "دليل إعلامي", body: "فيديوهات تقنية عربية، مراجعات، شروحات، وثقة الجمهور." },
      { title: "تفكير تشغيلي", body: "بنية نابعة من اللوجستيات للخدمات الواقعية وقرارات العملاء." },
    ],
  },
} as const;

function t(locale: SiteViewModel["locale"]) {
  return repairMojibakeDeep(copy[locale]);
}

function compact(locale: SiteViewModel["locale"], value: string | number | undefined, fallback: string) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(locale === "ar" ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

function pathFor(locale: SiteViewModel["locale"], key: string) {
  return withLocale(locale, key);
}

function PillarGrid({ model }: { model: SiteViewModel }) {
  const icons = [Globe2, MonitorPlay, Film, BriefcaseBusiness];
  return (
    <div className="fresh-grid fresh-grid-4">
      {t(model.locale).pillars.map((item, index) => {
        const Icon = icons[index] ?? Compass;
        return (
          <article className="fresh-card fresh-card-quiet" key={item.title}>
            <Icon className="fresh-card-icon" />
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        );
      })}
    </div>
  );
}

function homeExploreIcons(index: number) {
  return [Globe2, MonitorPlay, PlayCircle, BriefcaseBusiness, Mail, Compass][index] ?? Compass;
}

function homeHighlightIcons(index: number) {
  return [Code2, Cpu, Film, Truck][index] ?? Compass;
}

// Kept temporarily as a fallback reference while the Digital OS v2 homepage is reviewed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function HomePage({ model }: { model: SiteViewModel }) {
  const h = homepageCopy[model.locale];
  const portrait = model.portraitImage || "/images/protofeilnew.jpeg";
  const views = compact(model.locale, model.live.youtube?.totalViews ?? model.youtube.views, "1.5M+");
  const subscribers = compact(model.locale, model.live.youtube?.subscribers ?? model.youtube.subscribers, "6.1K+");

  return (
    <PageShell className="os-home">
      <section className="os-home-hero">
        <div className="os-home-hero-copy">
          <Image src="/images/logo.png" alt="" width={120} height={120} className="os-home-logo-ghost" priority />
          <p className="fresh-eyebrow">{h.eyebrow}</p>
          <h1>{h.title}</h1>
          <p className="os-home-lede">{h.body}</p>
          <div className="os-home-proof-row" aria-label={model.locale === "ar" ? "نقاط تعريفية" : "Identity proof points"}>
            {h.proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="fresh-actions">
            <Link href={pathFor(model.locale, "work")} className="fresh-button fresh-button-primary">
              {h.primary}
              <ArrowUpRight size={17} />
            </Link>
            <Link href={pathFor(model.locale, "contact")} className="fresh-button">
              {h.secondary}
            </Link>
          </div>
        </div>

        <div className="os-home-visual">
          <div className="os-home-orbit" />
          <div className="os-home-logo-card">
            <Image src="/images/logo.png" alt="Mohammad Alfarras logo" width={96} height={96} />
            <span>Digital OS</span>
          </div>
          <div className="os-home-photo-frame">
            <Image src={portrait} alt={model.profile.name} fill priority sizes="(max-width: 900px) 100vw, 38vw" className="fresh-image" />
          </div>
          <div className="os-home-id-card">
            <strong>{h.portraitLabel}</strong>
            <span>{h.portraitRole}</span>
          </div>
        </div>
      </section>

      <section className="fresh-section">
        <SectionHeader eyebrow={h.exploreEyebrow} title={h.exploreTitle} body={h.exploreBody} />
        <div className="os-home-explore-grid">
          {h.explore.map((item, index) => {
            const Icon = homeExploreIcons(index);
            return (
              <Link href={pathFor(model.locale, item.href)} className="os-home-explore-card" key={item.title}>
                <span className="fresh-card-icon">
                  <Icon />
                </span>
                <span className="os-home-card-kicker">0{index + 1}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <span className="fresh-link">
                  {item.cta}
                  <ArrowUpRight size={16} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="fresh-section os-home-positioning">
        <div>
          <p className="fresh-eyebrow">{h.positioningEyebrow}</p>
          <h2>{h.positioningTitle}</h2>
          <p>{h.positioningBody}</p>
        </div>
        <div className="os-home-signal-panel">
          <div>
            <span>{model.locale === "ar" ? "مشاهدات يوتيوب" : "YouTube views"}</span>
            <strong>{views}</strong>
          </div>
          <div>
            <span>{model.locale === "ar" ? "مشتركون" : "Subscribers"}</span>
            <strong>{subscribers}</strong>
          </div>
          <div>
            <span>{model.locale === "ar" ? "القاعدة" : "Base"}</span>
            <strong>{model.profile.location || "Germany"}</strong>
          </div>
        </div>
      </section>

      <section className="fresh-section">
        <SectionHeader eyebrow={h.highlightsEyebrow} title={h.highlightsTitle} />
        <div className="os-home-highlight-grid">
          {h.highlights.map((item, index) => {
            const Icon = homeHighlightIcons(index);
            return (
              <article className="fresh-card fresh-card-quiet" key={item.value}>
                <Icon className="fresh-card-icon" />
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="fresh-section os-home-cta">
        <p className="fresh-eyebrow">{h.ctaEyebrow}</p>
        <h2>{h.ctaTitle}</h2>
        <p>{h.ctaBody}</p>
        <div className="fresh-actions">
          <Link href={pathFor(model.locale, "work")} className="fresh-button fresh-button-primary">{h.ctaWork}</Link>
          <Link href={pathFor(model.locale, "apps/moplayer")} className="fresh-button">{h.ctaApps}</Link>
          <Link href={pathFor(model.locale, "youtube")} className="fresh-button">{h.ctaYoutube}</Link>
          <Link href={pathFor(model.locale, "contact")} className="fresh-button">{h.ctaContact}</Link>
        </div>
      </section>
    </PageShell>
  );
}

function HomePageV2({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const portrait = model.portraitImage || "/images/protofeilnew.jpeg";
  const views = compact(model.locale, model.live.youtube?.totalViews ?? model.youtube.views, "1.5M+");
  const subscribers = compact(model.locale, model.live.youtube?.subscribers ?? model.youtube.subscribers, "6.1K+");
  const home = isAr
    ? {
        eyebrow: "Mohammad Alfarras Digital OS",
        title: "أصمم وأبني مواقع وتجارب رقمية تساعد مشروعك على الظهور باحتراف.",
        body:
          "مواقع ويب، واجهات استخدام، تطبيقات، ومحتوى تقني بتنفيذ واضح، تجربة سلسة، وهوية بصرية تترك أثرًا وتحول الزائر إلى خطوة مفهومة.",
        primary: "ابدأ مشروعك",
        secondary: "شاهد الأعمال",
        secondarySoft: "شاهد يوتيوب",
        quickFacts: ["تصميم وتطوير واجهات", "مواقع وصفحات هبوط", "تطبيقات وتجارب تفاعلية", "محتوى تقني ومنتجات رقمية"],
        modesEyebrow: "كيف أساعدك",
        modesTitle: "خدمات واضحة لمشروع يحتاج حضورًا رقميًا أقوى.",
        storyEyebrow: "القصة",
        storyTitle: "من الواقع العملي إلى الأنظمة الرقمية.",
        stackEyebrow: "Stack",
        stackTitle: "أدوات حديثة لواجهات سريعة وواضحة.",
        productEyebrow: "Featured product",
        productTitle: "MoPlayer منتج مستقل لتجربة تشغيل سلسة على Android و Android TV.",
        productBody:
          "تجربة Android TV تربط التطبيق، التفعيل، مصادر IPTV، صفحات التحميل، والإعدادات عن بعد ضمن نظام واحد واضح للمستخدم.",
        ctaTitle: "جاهز نحول فكرتك إلى تجربة رقمية واضحة؟",
        ctaBody: "اكتب لي فكرة المشروع، المرحلة الحالية، والنتيجة التي تريد الوصول لها. سأرد عليك بخطوة عملية تساعدك تبدأ بشكل صحيح.",
        ctaPrimary: "ابدأ المحادثة",
        ctaSecondary: "راسلني على واتساب",
      }
    : {
        eyebrow: "Mohammad Alfarras Digital OS",
        title: "I design and build premium websites and digital experiences that help projects look professional.",
        body:
          "Websites, interfaces, apps, and technical content shaped with clear execution, smooth UX, and a visual identity that turns attention into action.",
        primary: "Start a project",
        secondary: "See the work",
        secondarySoft: "Watch YouTube",
        quickFacts: ["Interface design & frontend", "Websites and landing pages", "Interactive product experiences", "Tech content and digital products"],
        modesEyebrow: "How I can help",
        modesTitle: "Clear services for projects that need a stronger digital presence.",
        storyEyebrow: "Story arc",
        storyTitle: "From real-world pressure to digital systems.",
        stackEyebrow: "Stack",
        stackTitle: "Modern tools for sharp, fast interfaces.",
        productEyebrow: "Featured product",
        productTitle: "MoPlayer as a cinematic product surface.",
        productBody:
          "An Android TV ecosystem connecting the app, activation, IPTV sources, release pages, and remote configuration into one clear product system.",
        ctaTitle: "Ready to turn the idea into a clear digital experience?",
        ctaBody: "Send the current situation, the goal, and what needs to happen next. I will help shape the structure, visual direction, and first practical move.",
        ctaPrimary: "Start the conversation",
        ctaSecondary: "Message me on WhatsApp",
      };

  const modes = [
    { icon: Code2, tone: "cyan", title: isAr ? "موقع تعريفي احترافي" : "Professional business website", detail: "Brand / Web / Trust", body: isAr ? "صفحة واضحة تشرح من أنت، ماذا تقدم، ولماذا يثق بك العميل من أول زيارة." : "A clear website that explains who you are, what you offer, and why visitors should trust you." },
    { icon: Compass, tone: "violet", title: isAr ? "صفحة هبوط لحملة أو منتج" : "Landing page for a product or campaign", detail: "Campaign / Product / CTA", body: isAr ? "مسار قصير ومقنع يوجه الزائر إلى طلب، تسجيل، تحميل، أو تواصل بدون تشتيت." : "A focused path that moves visitors toward inquiry, signup, download, or contact without clutter." },
    { icon: Cpu, tone: "gold", title: isAr ? "واجهة أو تطبيق ويب" : "Web app or interface", detail: "UI / UX / Product", body: isAr ? "واجهة منظمة لمنتج، لوحة تحكم، أو تجربة تفاعلية قابلة للتوسع." : "A structured interface for a product, dashboard, or interactive experience that can grow." },
    { icon: MonitorPlay, tone: "red", title: isAr ? "MoPlayer / دعم المنتج" : "MoPlayer / product support", detail: "Android TV / Setup / Support", body: isAr ? "صفحات منتج، تفعيل، تحميل، وشرح واضح يساعد المستخدم العادي يفهم الخطوة التالية." : "Product pages, activation, downloads, and clear support flows that normal users can follow." },
  ];

  const story = [
    [isAr ? "الحسكة، سوريا" : "Al-Hasakah, Syria", isAr ? "الجذور الأولى، الفضول، والرغبة ببناء شيء أوضح." : "Roots, curiosity, and the urge to build clearer systems."],
    [isAr ? "ألمانيا" : "Germany", isAr ? "بيئة جديدة، لغة جديدة، ومسؤولية أكبر." : "A new environment, new language, and sharper standards."],
    [isAr ? "اللوجستيات" : "Logistics", isAr ? "ضغط واقعي علّمني قيمة الوضوح، السرعة، والثقة." : "Real pressure that taught clarity, speed, and trust."],
    [isAr ? "الويب" : "Web", isAr ? "تحويل الأفكار إلى واجهات تخدم الناس والعمل." : "Turning ideas into interfaces that serve people and business."],
    [isAr ? "يوتيوب" : "YouTube", isAr ? "شرح التقنية بصوت عربي واضح ومفيد." : "Explaining technology through a clear Arabic creator voice."],
    ["MoPlayer", isAr ? "من فكرة تطبيق إلى منظومة منتج كاملة." : "From an app idea into a connected product ecosystem."],
  ];

  const stack = ["Next.js", "TypeScript", "React", "Framer Motion", "Tailwind CSS", "Supabase", "Android TV", "UI Systems", "RTL/LTR", "SEO"];
  const explore = [
    [isAr ? "الأعمال" : "Work", isAr ? "دراسات حالة لمواقع وخدمات بتركيز على المشكلة والدور والقرار." : "Case studies framed by problem, role, decision, and outcome.", "work", Globe2],
    ["MoPlayer", isAr ? "منتج مستقل لتجربة Android TV والتفعيل والتحميل والدعم." : "A standalone Android TV product for activation, downloads, and support.", "apps/moplayer", MonitorPlay],
    ["YouTube", isAr ? "محتوى تقني يشرح لماذا تهم الأدوات والمنتجات وكيف تستخدمها." : "Tech content that explains why tools matter and how to use them.", "youtube", Film],
    [isAr ? "تواصل" : "Contact", isAr ? "ابدأ محادثة عن موقع، صفحة هبوط، واجهة، أو دعم MoPlayer." : "Start a conversation about a website, landing page, interface, or MoPlayer support.", "contact", Mail],
  ] as const;
  const featuredWork = [
    { title: "Schnell Sicher Umzug", type: isAr ? "موقع شركة نقل" : "Moving company website", problem: isAr ? "الخدمة تحتاج وضوحًا سريعًا ومسار طلب بسيطًا." : "The service needed faster clarity and a simple request path.", role: isAr ? "هيكلة المحتوى، واجهة، ومسار تواصل." : "Content structure, interface, and contact flow.", result: isAr ? "موقع يشرح الخدمات ويقود الزائر للطلب بثقة." : "A site that explains services and guides visitors toward inquiry." },
    { title: "A&D Fahrzeugtransporte", type: isAr ? "نقل وسحب سيارات" : "Vehicle transport", problem: isAr ? "الزائر يحتاج قرارًا سريعًا في حالات طارئة." : "Visitors need fast decisions in urgent situations.", role: isAr ? "تصميم مباشر للثقة والاتصال." : "Direct-response design for trust and contact.", result: isAr ? "تصنيف خدمات واضح مع دعوات تواصل قوية." : "Clear service categories with strong contact cues." },
    { title: "MoPlayer", type: isAr ? "منتج Android TV" : "Android TV product", problem: isAr ? "التطبيق يحتاج عرضًا وتفعيلًا وتنزيلًا مفهومًا." : "The app needs clear presentation, activation, and download flow.", role: isAr ? "نظام منتج من الموقع إلى التطبيق." : "Product system from website to app.", result: isAr ? "مسار منتج مستقل يربط التحميل والتفعيل والدعم." : "A product path connecting download, activation, and support." },
  ];

  return (
    <PageShell className="os-home os-digital-os">
      <section className="os-home-hero os-wow-hero">
        <div className="os-wow-hero-copy">
          <div className="os-command-badge">
            <Compass size={16} />
            <span>{home.eyebrow}</span>
          </div>
          <h1>{home.title}</h1>
          <p className="os-home-lede">{home.body}</p>
          <div className="os-home-proof-row" aria-label={isAr ? "حقائق سريعة" : "Quick facts"}>
            {home.quickFacts.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className="fresh-actions">
            <Link href={pathFor(model.locale, "contact")} className="fresh-button fresh-button-primary magnetic-surface">{home.primary}<ArrowUpRight size={17} /></Link>
            <Link href={pathFor(model.locale, "work")} className="fresh-button magnetic-surface">{home.secondary}</Link>
            <Link href={pathFor(model.locale, "youtube")} className="fresh-button fresh-button-ghost magnetic-surface"><PlayCircle size={17} />{home.secondarySoft}</Link>
          </div>
        </div>

        <div className="os-home-visual os-wow-visual">
          <div className="os-hero-grid-plane" />
          <div className="os-home-orbit" />
          <div className="os-home-logo-card magnetic-surface">
            <Image src="/images/logo.png" alt="Mohammad Alfarras logo" width={96} height={96} />
            <span>Digital OS</span>
          </div>
          <div className="os-home-photo-frame">
            <Image src={portrait} alt={model.profile.name} fill priority sizes="(max-width: 900px) 100vw, 38vw" className="fresh-image" />
          </div>
          <div className="os-home-id-card">
            <strong>{isAr ? "محمد الفراس" : "Mohammad Alfarras"}</strong>
            <span>{isAr ? "Web / YouTube / Logistics / MoPlayer" : "Web / Creator / Logistics / MoPlayer"}</span>
          </div>
          <div className="os-floating-metric os-floating-metric-a"><Users size={16} /><strong>{subscribers}</strong><span>{isAr ? "مشترك" : "Subscribers"}</span></div>
          <div className="os-floating-metric os-floating-metric-b"><Eye size={16} /><strong>{views}</strong><span>{isAr ? "مشاهدة" : "Views"}</span></div>
        </div>
      </section>

      <section className="fresh-section os-mode-section">
        <SectionHeader eyebrow={home.modesEyebrow} title={home.modesTitle} />
        <div className="os-mode-bento">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <article className={`os-mode-card os-mode-${mode.tone} magnetic-surface`} key={mode.title}>
                <div className="os-mode-card-top"><span className="fresh-card-icon"><Icon /></span><span>{mode.detail}</span></div>
                <h3>{mode.title}</h3>
                <p>{mode.body}</p>
                <div className="os-mode-visual" aria-hidden="true"><span /><span /><span /></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="fresh-section os-home-explore-section">
        <div className="os-home-explore-grid os-entry-grid">
          {explore.map(([title, body, href, Icon], index) => (
            <Link href={pathFor(model.locale, href)} className="os-home-explore-card magnetic-surface" key={title}>
              <span className="fresh-card-icon"><Icon /></span>
              <span className="os-home-card-kicker">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <span className="fresh-link">{isAr ? "افتح المسار" : "Open path"}<ArrowUpRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="fresh-section os-home-work-snapshot">
        <SectionHeader
          eyebrow={isAr ? "أعمال مختارة" : "Featured work"}
          title={isAr ? "مشاريع توضّح المشكلة، الدور، والقرار بدل عرض صور فقط." : "Projects framed by problem, role, and decision, not just screenshots."}
          body={isAr ? "هذه نظرة سريعة على طريقة تفكيري: أفهم العرض، أرتب مسار الزائر، ثم أبني واجهة تجعل الخطوة التالية واضحة." : "A quick look at how I think: understand the offer, shape the visitor path, then build an interface where the next step is obvious."}
        />
        <div className="os-home-case-grid">
          {featuredWork.map((item, index) => (
            <article className="fresh-card os-home-case-card" key={item.title}>
              <span className="os-home-card-kicker">0{index + 1} / {item.type}</span>
              <h3>{item.title}</h3>
              <dl>
                <div><dt>{isAr ? "المشكلة" : "Problem"}</dt><dd>{item.problem}</dd></div>
                <div><dt>{isAr ? "دوري" : "My role"}</dt><dd>{item.role}</dd></div>
                <div><dt>{isAr ? "الأثر" : "Outcome"}</dt><dd>{item.result}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <div className="fresh-actions">
          <Link href={pathFor(model.locale, "work")} className="fresh-button fresh-button-primary magnetic-surface">
            {isAr ? "شاهد الأعمال" : "View the work"}
            <ArrowUpRight size={17} />
          </Link>
          <Link href={pathFor(model.locale, "contact")} className="fresh-button magnetic-surface">
            {isAr ? "أريد موقعًا مشابهًا" : "I need something similar"}
          </Link>
        </div>
      </section>

      <section className="fresh-section os-story-section">
        <SectionHeader eyebrow={home.storyEyebrow} title={home.storyTitle} />
        <div className="os-story-rail">
          {story.map(([title, body], index) => (
            <article className="os-story-step" key={title}>
              <span className="os-story-index">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{title}</h3><p>{body}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section os-stack-section" aria-label={home.stackTitle}>
        <div className="os-stack-head"><p className="fresh-eyebrow">{home.stackEyebrow}</p><h2>{home.stackTitle}</h2></div>
        <div className="os-stack-marquee"><div>{[...stack, ...stack].map((item, index) => <span key={`${item}-${index}`}>{item}</span>)}</div></div>
      </section>

      <section className="fresh-section os-moplayer-showcase">
        <div className="os-moplayer-copy">
          <p className="fresh-eyebrow">{home.productEyebrow}</p>
          <h2>{home.productTitle}</h2>
          <p>{home.productBody}</p>
          <div className="fresh-actions">
            <Link href={pathFor(model.locale, "apps/moplayer")} className="fresh-button fresh-button-primary magnetic-surface">{isAr ? "استكشف MoPlayer" : "Explore MoPlayer"}<ArrowUpRight size={17} /></Link>
            <Link href={pathFor(model.locale, "activate")} className="fresh-button magnetic-surface">{isAr ? "تجربة التفعيل" : "Activation flow"}</Link>
          </div>
        </div>
        <div className="os-moplayer-visual">
          <div className="os-moplayer-glow" />
          <div className="os-moplayer-device"><Image src="/images/moplayer-hero-3d-final.png" alt="MoPlayer Android TV product visual" fill sizes="(max-width: 900px) 92vw, 520px" className="fresh-image" /></div>
          <div className="os-moplayer-mini"><Image src="/images/moplayer-activation-flow.webp" alt="MoPlayer activation flow" fill sizes="220px" className="fresh-image" /></div>
        </div>
      </section>

      <section className="fresh-section os-home-cta os-premium-cta">
        <p className="fresh-eyebrow">{isAr ? "الخطوة التالية" : "Next move"}</p>
        <h2>{home.ctaTitle}</h2>
        <p>{home.ctaBody}</p>
        <div className="fresh-actions">
          <Link href={pathFor(model.locale, "contact")} className="fresh-button fresh-button-primary magnetic-surface">{home.ctaPrimary}</Link>
          <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="fresh-button magnetic-surface">{home.ctaSecondary}</a>
        </div>
      </section>
    </PageShell>
  );
}

// Kept temporarily as a fallback reference while the interactive exhibition is reviewed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function WorkPage({ model }: { model: SiteViewModel }) {
  const w = workPageCopy[model.locale];
  const contactHref = pathFor(model.locale, "contact");
  const workAnchors = [
    ...w.projects.map((project) => project.title),
    w.product.title,
    w.ecosystem.title,
  ];
  return (
    <PageShell className="os-work-page">
      <section className="os-work-hero">
        <div className="os-work-hero-copy">
          <p className="fresh-eyebrow">{w.hero.eyebrow}</p>
          <h1>{w.hero.title}</h1>
          <p className="os-work-subtitle">{w.hero.subtitle}</p>
          <div className="os-work-positioning">
            <Radio className="h-5 w-5" />
            <p>{w.hero.positioning}</p>
          </div>
          <div className="fresh-actions">
            <a href="#case-studies" className="fresh-button fresh-button-primary">
              {w.hero.primary}
              <ArrowUpRight size={17} />
            </a>
            <Link href={contactHref} className="fresh-button">{w.hero.secondary}</Link>
          </div>
        </div>
        <div className="os-work-hero-board">
          <div className="os-work-board-screen os-work-board-screen-main">
            <Image src="/images/projects/schnell-home-case.png" alt="Schnell Sicher Umzug preview" fill priority sizes="(max-width: 900px) 100vw, 42vw" className="fresh-image" />
          </div>
          <div className="os-work-board-screen os-work-board-screen-small">
            <Image src="/images/projects/adtransporte-mobile.png" alt="A&D Fahrzeugtransporte mobile preview" fill priority sizes="220px" className="fresh-image" />
          </div>
          <div className="os-work-board-caption">
            <span>{w.hero.tertiary}</span>
            <Link href={contactHref}>
              {w.hero.secondary}
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <nav className="os-work-jump" aria-label={w.labels.jump}>
        {workAnchors.map((item, index) => (
          <a href={`#work-${index + 1}`} key={item}>
            <span>0{index + 1}</span>
            {item}
          </a>
        ))}
      </nav>

      <section className="fresh-section os-work-intro" id="case-studies">
        <div>
          <p className="fresh-eyebrow">{w.hero.eyebrow}</p>
          <h2>{w.intro.title}</h2>
        </div>
        <p>{w.intro.text}</p>
      </section>

      <div className="os-work-showcase">
        {w.projects.map((project, index) => (
          <section className="os-work-case" id={`work-${index + 1}`} key={project.title} data-tone={project.tone} data-flip={index % 2 === 1 ? "true" : "false"}>
            <div className="os-work-case-media">
              <div className="os-work-browser">
                <div><span /><span /><span /></div>
                <Image src={project.image} alt={`${project.title} website preview`} fill sizes="(max-width: 900px) 100vw, 52vw" className="fresh-image" />
              </div>
              <div className="os-work-phone">
                <Image src={project.secondaryImage} alt={`${project.title} secondary preview`} fill sizes="180px" className="fresh-image" />
              </div>
            </div>
            <div className="os-work-case-copy">
              <span className="os-work-index">0{index + 1}</span>
              <p className="fresh-eyebrow">{project.label}</p>
              <h2>{project.title}</h2>
              <p className="os-work-line">{project.line}</p>
              <p>{project.description}</p>
              <div className="os-work-focus">
                <strong>{w.labels.focus}</strong>
                <span>{project.focus}</span>
              </div>
              <ul className="os-work-highlights">
                {project.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
              <div className="fresh-actions">
                <Link href={contactHref} className="fresh-button fresh-button-primary">
                  {project.cta}
                </Link>
                <a href={project.url} target="_blank" rel="noopener noreferrer" className="fresh-button">
                  {w.labels.live}
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </section>
        ))}
      </div>

      <section className="fresh-section os-work-product" id="work-4">
        <div className="os-work-product-copy">
          <span className="os-work-index">04</span>
          <p className="fresh-eyebrow">{w.product.label}</p>
          <h2>{w.product.title}</h2>
          <p className="os-work-line">{w.product.line}</p>
          <p>{w.product.description}</p>
          <div className="os-work-focus">
            <strong>{w.labels.focus}</strong>
            <span>{w.product.focus}</span>
          </div>
          <ul className="os-work-highlights">
            {w.product.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <div className="fresh-actions">
            <Link href={pathFor(model.locale, "apps/moplayer")} className="fresh-button fresh-button-primary">{w.product.cta}</Link>
            <Link href={contactHref} className="fresh-button">{w.labels.similar}</Link>
          </div>
        </div>
        <div className="os-work-product-media">
          <Image src="/images/moplayer-release-panel.webp" alt="MoPlayer release and download product visual" fill sizes="(max-width: 900px) 100vw, 45vw" className="fresh-image" loading="eager" />
          <div>
            <Image src="/images/moplayer_ui_now_playing-final.png" alt="MoPlayer Android TV cinematic screen" fill sizes="260px" className="fresh-image" loading="eager" />
          </div>
        </div>
      </section>

      <section className="fresh-section os-work-ecosystem" id="work-5">
        <div className="os-work-ecosystem-visual">
          <Image src="/images/logo.png" alt="moalfarras.space logo" width={150} height={150} loading="eager" />
          <span>moalfarras.space</span>
        </div>
        <div>
          <span className="os-work-index">05</span>
          <p className="fresh-eyebrow">{w.ecosystem.label}</p>
          <h2>{w.ecosystem.title}</h2>
          <p className="os-work-line">{w.ecosystem.line}</p>
          <p>{w.ecosystem.description}</p>
          <div className="os-work-focus">
            <strong>{w.labels.focus}</strong>
            <span>{w.ecosystem.focus}</span>
          </div>
          <ul className="os-work-highlights">
            {w.ecosystem.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <Link href={contactHref} className="fresh-button fresh-button-primary">{w.ecosystem.cta}</Link>
        </div>
      </section>

      <section className="fresh-section os-work-offer">
        <div className="os-work-offer-head">
          <h2>{w.offer.title}</h2>
          <p>{w.offer.text}</p>
        </div>
        <div className="os-work-offer-grid">
          {w.offer.cards.map(([title, body], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section os-work-final-cta">
        <p className="fresh-eyebrow">{w.labels.similar}</p>
        <h2>{w.offer.ctaTitle}</h2>
        <p>{w.offer.ctaText}</p>
        <div className="fresh-actions">
          <Link href={contactHref} className="fresh-button fresh-button-primary">{w.offer.buttons[0]}</Link>
          <Link href={contactHref} className="fresh-button">{w.offer.buttons[1]}</Link>
          <Link href={pathFor(model.locale, "apps/moplayer")} className="fresh-button">{w.offer.buttons[2]}</Link>
        </div>
      </section>
    </PageShell>
  );
}

function ServicesPage({ model }: { model: SiteViewModel }) {
  const c = t(model.locale);
  const isAr = model.locale === "ar";
  const steps = isAr
    ? [
        ["01", "نفهم الهدف", "نحدد الجمهور، العرض، والمشكلة التي يجب أن يحلها الموقع قبل رسم أي شاشة."],
        ["02", "نبني الهيكل", "نرتب الصفحات، الرسائل، CTA، ومسار التواصل حتى يفهم الزائر الخطوة التالية."],
        ["03", "نصمم وننفذ", "واجهة حديثة، حركة خفيفة، أداء جيد، وتجربة مناسبة للجوال والكمبيوتر."],
        ["04", "نطلق ونحسن", "تسليم واضح، ربط النماذج والقياس، وتطوير تدريجي حسب احتياج المشروع."],
      ]
    : [
        ["01", "Understand the goal", "We define the audience, offer, and core problem before drawing any screen."],
        ["02", "Shape the structure", "Pages, messages, CTAs, and contact paths are arranged around clarity."],
        ["03", "Design and build", "Modern interface, subtle motion, strong performance, and responsive behavior."],
        ["04", "Launch and refine", "Clean delivery, form/analytics wiring, and iteration where the project needs it."],
      ];
  const outcomes = isAr
    ? ["رسالة أوضح", "ثقة أسرع", "تجربة جوال أفضل", "مسار تواصل مباشر"]
    : ["Clearer message", "Faster trust", "Better mobile UX", "Direct contact path"];
  return (
    <PageShell className="services-command-page">
      <section className="fresh-section fresh-first services-hero-band">
        <SectionHeader eyebrow={c.services.eyebrow} title={c.services.title} body={c.services.body} />
        <div className="services-proof-row">
          {outcomes.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>

      <section className="fresh-section">
        <div className="fresh-grid fresh-grid-3">
          {model.services.map((service) => (
            <article className="fresh-card" key={service.id}>
              <div className="fresh-card-media">
                <Image src={service.image} alt={service.title} fill sizes="(max-width: 900px) 100vw, 33vw" className="fresh-image" />
              </div>
              <h3>{service.title}</h3>
              <p>{service.body}</p>
              <div className="fresh-tags">
                {service.bullets.slice(0, 3).map((bullet) => (
                  <span key={bullet}>{bullet}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section services-process-section">
        <div>
          <p className="fresh-eyebrow">{isAr ? "طريقة العمل" : "How we work"}</p>
          <h2>{isAr ? "عملية واضحة بدل الفوضى: من الفكرة إلى صفحة تعمل وتبيع." : "A clear process instead of chaos: from idea to a page that works."}</h2>
          <p>
            {isAr
              ? "الخدمة ليست مجرد تصميم جميل. كل قرار في النص، الصورة، الحركة، والزر يجب أن يساعد الزائر على الفهم والثقة والتواصل."
              : "The service is not only visual polish. Every decision in copy, imagery, motion, and buttons should help the visitor understand, trust, and act."}
          </p>
        </div>
        <div className="services-process-grid">
          {steps.map(([number, title, body]) => (
            <article key={number} className="fresh-card services-step-card">
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="fresh-section os-premium-cta">
        <p className="fresh-eyebrow">{isAr ? "جاهز للبدء؟" : "Ready to start?"}</p>
        <h2>{isAr ? "حوّل مشروعك إلى تجربة رقمية واضحة ومقنعة." : "Turn your project into a clear, persuasive digital experience."}</h2>
        <p>
          {isAr
            ? "أرسل فكرة المشروع، وسأساعدك في ترتيبها بصريًا وتسويقيًا وتقنيًا بدون تعقيد."
            : "Send the idea, and I will help shape it visually, commercially, and technically without unnecessary complexity."}
        </p>
        <div className="fresh-actions">
          <Link href={pathFor(model.locale, "contact")} className="fresh-button fresh-button-primary magnetic-surface">
            {isAr ? "ابدأ مشروعك" : "Start your project"}
          </Link>
          <Link href={pathFor(model.locale, "work")} className="fresh-button magnetic-surface">
            {isAr ? "شاهد الأعمال" : "See the work"}
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

function AppsPage({ model }: { model: SiteViewModel }) {
  return <AppsShowcasePage locale={model.locale} />;
}

function YoutubePage({ model }: { model: SiteViewModel }) {
  const y = youtubePageCopy[model.locale];
  const isAr = model.locale === "ar";
  const latest =
    model.live.youtube?.videos?.map((video) => ({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail || "/images/yt-channel-hero.png",
      views: video.views,
      publishedAt: video.publishedAt,
    })) ??
    model.latestVideos.map((video) => ({
      id: video.youtube_id,
      title: isAr ? video.title_ar : video.title_en,
      thumbnail: video.thumbnail || "/images/yt-channel-hero.png",
      views: video.views,
      publishedAt: video.published_at,
    }));
  const videos = latest.length ? latest.slice(0, 6) : [
    { id: "wfTnQK_tTSA", title: isAr ? "مراجعة تقنية مختارة من قناة محمد الفراس" : "Featured Arabic technology review by Mohammad Alfarras", thumbnail: "/images/yt-channel-hero.png", views: Number(model.youtube.views) || 1494029, publishedAt: new Date().toISOString() },
  ];
  const spotlight = model.live.youtube?.popularVideos?.[0]
    ? {
        id: model.live.youtube.popularVideos[0].id,
        title: model.live.youtube.popularVideos[0].title,
        thumbnail: model.live.youtube.popularVideos[0].thumbnail || "/images/yt-channel-hero.png",
        views: model.live.youtube.popularVideos[0].views,
        publishedAt: model.live.youtube.popularVideos[0].publishedAt,
      }
    : videos[0];
  const statsData = [
    { label: y.hero.stats[0], value: compact(model.locale, model.live.youtube?.subscribers ?? model.youtube.subscribers, "6.1K+") },
    { label: y.hero.stats[1], value: compact(model.locale, model.live.youtube?.totalViews ?? model.youtube.views, "1.5M+") },
    { label: y.hero.stats[2], value: compact(model.locale, model.live.youtube?.videoCount ?? model.youtube.videos, "162") },
  ];
  const fmt = new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" });
  const channelName = model.youtube.title || model.live.youtube?.channelTitle || "Mohammad Alfarras";
  const handle = model.youtube.handle || model.live.youtube?.channelHandle || "@Moalfarras";

  function videoDate(value: string | undefined) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return dateFmt.format(date);
  }

  return (
    <PageShell className="yt-showcase">
      <section className="yt-hero">
        <div className="yt-hero-copy">
          <div className="yt-channel-line">
            <span className="yt-avatar">
              <Image src="/images/logo.png" alt={channelName} width={64} height={64} />
            </span>
            <div>
              <strong>{channelName}</strong>
              <span>{handle}</span>
            </div>
          </div>
          <p className="fresh-eyebrow">{y.hero.eyebrow}</p>
          <h1>{y.hero.title}</h1>
          <p>{y.hero.subtitle}</p>
          <div className="fresh-actions">
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="yt-subscribe-button">
              <BellRing className="yt-bell" />
              {y.hero.subscribe}
              <ArrowUpRight size={17} />
            </a>
            <a href="#yt-spotlight" className="fresh-button">{y.hero.watch}</a>
          </div>
        </div>
        <div className="yt-dashboard">
          {statsData.map((item, index) => {
            const Icon = [Users, Eye, Film][index] ?? Compass;
            return (
              <div className="yt-stat-card" key={item.label}>
                <Icon />
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="fresh-section yt-spotlight" id="yt-spotlight">
        <div className="yt-player-frame">
          <Image src={spotlight.thumbnail} alt={spotlight.title} fill sizes="(max-width: 900px) 100vw, 58vw" className="fresh-image" />
          <a href={`https://www.youtube.com/watch?v=${spotlight.id}`} target="_blank" rel="noopener noreferrer" className="yt-play-orb" aria-label={y.spotlight.watch}>
            <PlayCircle />
          </a>
        </div>
        <div className="yt-spotlight-copy">
          <p className="fresh-eyebrow">{y.spotlight.eyebrow}</p>
          <h2>{y.spotlight.title}</h2>
          <h3>{spotlight.title}</h3>
          <p>{y.spotlight.body}</p>
          <div className="yt-meta-row">
            <span><Eye size={15} /> {fmt.format(Number(spotlight.views) || 0)} {y.grid.views}</span>
            <span><CalendarDays size={15} /> {videoDate(spotlight.publishedAt)}</span>
          </div>
          <a href={`https://www.youtube.com/watch?v=${spotlight.id}`} target="_blank" rel="noopener noreferrer" className="fresh-button fresh-button-primary">
            {y.spotlight.watch}
            <ArrowUpRight size={16} />
          </a>
        </div>
      </section>

      <section className="fresh-section yt-grid-section">
        <SectionHeader eyebrow={y.grid.eyebrow} title={y.grid.title} body={y.grid.body} />
        <div className="yt-video-grid">
          {videos.map((video, index) => (
            <a className="yt-video-card" key={`${video.id}-${index}`} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer">
              <div className="yt-thumb">
                <Image src={video.thumbnail} alt={video.title} fill sizes="(max-width: 700px) 100vw, 33vw" className="fresh-image" />
                <span className="yt-play-overlay"><PlayCircle /> {y.grid.play}</span>
              </div>
              <div className="yt-card-body">
                <h3>{video.title}</h3>
                <div className="yt-meta-row">
                  <span><Eye size={14} /> {fmt.format(Number(video.views) || 0)} {y.grid.views}</span>
                  <span><CalendarDays size={14} /> {videoDate(video.publishedAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="fresh-section yt-playlists">
        <SectionHeader eyebrow={y.playlists.eyebrow} title={y.playlists.title} />
        <div className="yt-playlist-rail">
          {y.playlists.items.map(([title, body], index) => {
            const Icon = [ListVideo, MonitorPlay, Headphones, Radio][index] ?? Film;
            return (
              <article className="yt-playlist-card" key={title}>
                <Icon />
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="fresh-section yt-final-cta">
        <p className="fresh-eyebrow">{handle}</p>
        <h2>{y.cta.title}</h2>
        <p>{y.cta.body}</p>
        <div className="fresh-actions">
          <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="yt-subscribe-button">
            <BellRing className="yt-bell" />
            {y.cta.primary}
          </a>
          <Link href={pathFor(model.locale, "contact")} className="fresh-button">{y.cta.secondary}</Link>
        </div>
      </section>
    </PageShell>
  );
}

function CvPage({ model }: { model: SiteViewModel }) {
  const views = Number(model.live.youtube?.totalViews ?? model.youtube.views ?? 1494029) || 1494029;
  const subscribers = Number(model.live.youtube?.subscribers ?? model.youtube.subscribers ?? 6130) || 6130;
  const videos = Number(model.live.youtube?.videoCount ?? model.youtube.videos ?? 162) || 162;
  return (
    <InteractiveCvPage
      locale={model.locale}
      profileName={model.profile.name}
      portrait="/images/portrait.jpg"
      downloads={{ branded: model.downloads.branded, docx: model.downloads.docx }}
      stats={{ views, subscribers, videos }}
      experience={model.cvExperience}
    />
  );
}

function ContactPage({ model }: { model: SiteViewModel }) {
  return <ContactHubPage locale={model.locale} />;
}

function AboutPage({ model }: { model: SiteViewModel }) {
  const c = t(model.locale);
  return (
    <PageShell>
      <section className="fresh-section fresh-first">
        <SectionHeader eyebrow={c.about.eyebrow} title={c.about.title} body={c.about.body} />
        <PillarGrid model={model} />
      </section>
    </PageShell>
  );
}

export function DigitalOsPage({ model }: { model: SiteViewModel }) {
  switch (model.pageSlug) {
    case "work":
    case "projects":
      return <WorkDigitalExhibition locale={model.locale} />;
    case "services":
      return <ServicesPage model={model} />;
    case "apps":
      return <AppsPage model={model} />;
    case "youtube":
      return <YoutubePage model={model} />;
    case "cv":
      return <CvPage model={model} />;
    case "contact":
      return <ContactPage model={model} />;
    case "about":
      return <AboutPage model={model} />;
    case "home":
    default:
      return <HomePageV2 model={model} />;
  }
}
