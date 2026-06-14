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
  Users,
} from "lucide-react";

import { SiteOffersSection } from "@/components/site/site-offers-section";
import { PageShell, SectionHeader } from "@/components/ui/os-primitives";
import { socialLinks } from "@/content/site";
import { compactMetric, youtubeChannel } from "@/content/site-data";
import { withLocale } from "@/lib/i18n";
import { repairMojibakeDeep } from "@/lib/text-cleanup";

import type { SiteViewModel } from "./site-view-model";

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
      eyebrow: "Latest uploads",
      title: "Recent reviews and practical technology videos.",
      body: "Explore the newest available uploads from the channel with their real publication dates.",
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
      eyebrow: "أحدث الفيديوهات",
      title: "آخر المراجعات والفيديوهات التقنية العملية.",
      body: "استكشف أحدث الفيديوهات المتاحة من القناة مع تواريخ نشرها الحقيقية.",
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
      eyebrow: "مطوّر ومصمّم مواقع مستقل",
      title: "مواقع وصفحات وتطبيقات واضحة من أول نظرة.",
      body:
        "موقع محمد الفراس: بسيط وسريع، بالعربي والإنجليزي، يوصل فكرتك للزائر بسرعة ويخلّيه يثق ويتواصل معك.",
      primary: "شاهد الأعمال",
      secondary: "ابدأ مشروعك",
      sections: "ماذا يقدّم هذا الموقع",
    },
    work: {
      eyebrow: "أعمال مختارة",
      title: "مشاريع حقيقية: المشكلة، الحل، والنتيجة.",
      body: "كل مشروع أعرضه بوضوح: شو كانت المشكلة، شو نفّذت، وشو كانت النتيجة — مش مجرد صور.",
    },
    services: {
      eyebrow: "الخدمات",
      title: "تصميم وبرمجة مواقع للشركات والمنتجات وصنّاع المحتوى.",
      body: "من الفكرة حتى الإطلاق: تصميم الواجهة، كتابة المحتوى، البرمجة، والنشر — كل شي في مكان واحد.",
    },
    apps: {
      eyebrow: "المنتجات",
      title: "MoPlayer وتطبيقاتي ضمن صفحة منتج متكاملة.",
      body: "التحميل، التفعيل، الإصدارات، الصور، والدعم — كلها في مكان واحد واضح وسهل.",
    },
    youtube: {
      eyebrow: "المحتوى",
      title: "محتوى تقني عربي بأسلوب واضح ومفيد.",
      body: "فيديوهات ومراجعات وشروحات تشرح التقنية ببساطة وتزيد ثقة الناس بالمنتجات.",
    },
    cv: {
      eyebrow: "المسار المهني",
      title: "خبرة تشغيلية، تطوير واجهات، وتواصل واضح حول المنتجات.",
      body: "سيرة عملية تجمع بين اللوجستيات، تطوير المواقع، تطبيقات الأندرويد، والمحتوى التقني العربي.",
    },
    contact: {
      eyebrow: "تواصل",
      title: "احكِ لي عن مشروعك.",
      body: "اكتب لي وين وصلت وشو بدك تحقّق، وبساعدك نرتّب الخطوة التالية بوضوح وبدون تعقيد.",
    },
    about: {
      eyebrow: "نبذة عني",
      title: "مطوّر صقلته سنوات العمل على أرض الواقع.",
      body: "من ضغط العمل في اللوجستيات إلى بناء المواقع والتطبيقات والمحتوى التقني العربي — والرابط بينها كلها: الوضوح والإتقان.",
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
      { title: "مواقع ويب", body: "مواقع شركات، صفحات هبوط، ومحتوى احترافي بالعربي والإنجليزي." },
      { title: "صفحات المنتجات", body: "MoPlayer، التفعيل، صفحات التحميل والإصدارات، والدعم." },
      { title: "محتوى وثقة", body: "فيديوهات ومراجعات وشروحات تقنية عربية تبني ثقة الجمهور." },
      { title: "عقلية تشغيلية", body: "خبرة من اللوجستيات تنعكس تنظيماً أوضح وقرارات أسرع وتجربة أثبت." },
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

function HomePageV2({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const portrait = model.portraitImage || "/images/protofeilnew.jpeg";
  const views = compact(
    model.locale,
    model.live.youtube?.totalViews ?? model.youtube.views,
    compactMetric(youtubeChannel.fallback.views),
  );
  const subscribers = compact(
    model.locale,
    model.live.youtube?.subscribers ?? model.youtube.subscribers,
    compactMetric(youtubeChannel.fallback.subscribers),
  );
  const home = isAr
    ? {
        eyebrow: "محمد الفراس · تصميم وبرمجة المواقع",
        title: "أصمّم لك موقعاً احترافياً يجعل مشروعك يظهر بثقة ويكسب عملاء.",
        body:
          "مواقع تعريفية، صفحات هبوط، ومتاجر وتطبيقات ويب — بتصميم أنيق، سرعة عالية على الجوال، وكلام واضح يقنع الزائر ويحوّله إلى عميل يتواصل معك.",
        primary: "ابدأ مشروعك الآن",
        secondary: "شاهد أعمالي",
        secondarySoft: "قناتي على يوتيوب",
        quickFacts: ["مواقع تعريفية للشركات", "صفحات هبوط تبيع وتجمع طلبات", "متاجر وتطبيقات ويب", "تصميم سريع وأنيق على الجوال"],
        modesEyebrow: "كيف أقدر أساعدك",
        modesTitle: "خدمات واضحة تعطي مشروعك حضوراً رقمياً أقوى.",
        storyEyebrow: "قصتي باختصار",
        storyTitle: "من العمل على أرض الواقع إلى بناء المواقع والتطبيقات.",
        stackEyebrow: "الأدوات",
        stackTitle: "أحدث الأدوات لمواقع سريعة وأنيقة وآمنة.",
        productEyebrow: "منتج مميّز",
        productTitle: "MoPlayer — تطبيقي الخاص لمشاهدة سلسة على الأندرويد والتلفزيون.",
        productBody:
          "تطبيق مشاهدة متكامل للأندرويد والتلفزيون: تثبيت سهل، تفعيل سريع، وتشغيل مستقر — مع صفحات تحميل ودعم واضحة لأي مستخدم.",
        ctaTitle: "جاهز نحوّل فكرتك إلى موقع يفتخر بيه مشروعك؟",
        ctaBody: "احكِ لي عن مشروعك: وين وصلت، وشو النتيجة اللي بدك توصلها. وبرجع عليك بخطوة عملية واضحة تبدأ فيها صح.",
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
    { icon: Code2, tone: "cyan", title: isAr ? "موقع تعريفي احترافي" : "Professional business website", detail: isAr ? "هوية · موقع · ثقة" : "Brand / Web / Trust", body: isAr ? "موقع يشرح بوضوح مين أنت، شو بتقدّم، وليش يثق فيك العميل من أول زيارة." : "A clear website that explains who you are, what you offer, and why visitors should trust you." },
    { icon: Compass, tone: "violet", title: isAr ? "صفحة هبوط لمنتج أو حملة" : "Landing page for a product or campaign", detail: isAr ? "حملة · منتج · طلب" : "Campaign / Product / CTA", body: isAr ? "صفحة واحدة مركّزة تقود الزائر لخطوة محددة: طلب، تسجيل، تحميل، أو تواصل — بدون تشتيت." : "A focused path that moves visitors toward inquiry, signup, download, or contact without clutter." },
    { icon: Cpu, tone: "gold", title: isAr ? "متجر أو تطبيق ويب" : "Web app or interface", detail: isAr ? "واجهة · تجربة · منتج" : "UI / UX / Product", body: isAr ? "واجهة منظّمة لمتجر، لوحة تحكم، أو تطبيق ويب — سهلة الاستخدام وقابلة للتطوير." : "A structured interface for a product, dashboard, or interactive experience that can grow." },
    { icon: MonitorPlay, tone: "red", title: isAr ? "MoPlayer ودعم التطبيقات" : "MoPlayer / product support", detail: isAr ? "أندرويد · إعداد · دعم" : "Android TV / Setup / Support", body: isAr ? "صفحات تطبيق، تفعيل، تحميل، وشرح بسيط يخلّي أي مستخدم يفهم الخطوة التالية." : "Product pages, activation, downloads, and clear support flows that normal users can follow." },
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
            <Link href={pathFor(model.locale, "contact")} prefetch={false} className="fresh-button fresh-button-primary magnetic-surface">{home.primary}<ArrowUpRight size={17} /></Link>
            <Link href={pathFor(model.locale, "work")} prefetch={false} className="fresh-button magnetic-surface">{home.secondary}</Link>
            <Link href={pathFor(model.locale, "youtube")} prefetch={false} className="fresh-button fresh-button-ghost magnetic-surface"><PlayCircle size={17} />{home.secondarySoft}</Link>
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
            <Image src={portrait} alt={model.profile.name} fill priority sizes="(max-width: 900px) 100vw, 38vw" className="fresh-image" unoptimized={portrait.startsWith("http")} />
          </div>
          <div className="os-home-id-card">
            <strong>{isAr ? "محمد الفراس" : "Mohammad Alfarras"}</strong>
            <span>{isAr ? "ويب · يوتيوب · لوجستيات · MoPlayer" : "Web / Creator / Logistics / MoPlayer"}</span>
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

      <SiteOffersSection model={model} placement="home" />

      <section className="fresh-section os-home-explore-section">
        <div className="os-home-explore-grid os-entry-grid">
          {explore.map(([title, body, href, Icon], index) => (
            <Link href={pathFor(model.locale, href)} prefetch={false} className="os-home-explore-card magnetic-surface" key={title}>
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
          <Link href={pathFor(model.locale, "work")} prefetch={false} className="fresh-button fresh-button-primary magnetic-surface">
            {isAr ? "شاهد الأعمال" : "View the work"}
            <ArrowUpRight size={17} />
          </Link>
          <Link href={pathFor(model.locale, "contact")} prefetch={false} className="fresh-button magnetic-surface">
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
            <Link href={pathFor(model.locale, "apps/moplayer")} prefetch={false} className="fresh-button fresh-button-primary magnetic-surface">{isAr ? "استكشف MoPlayer" : "Explore MoPlayer"}<ArrowUpRight size={17} /></Link>
            <Link href={pathFor(model.locale, "activate")} prefetch={false} className="fresh-button magnetic-surface">{isAr ? "تجربة التفعيل" : "Activation flow"}</Link>
          </div>
        </div>
        <div className="os-moplayer-visual">
          <div className="os-moplayer-glow" />
          <div className="os-moplayer-device"><Image src={model.siteImages?.home_product_hero || "/images/moplayer-hero-3d-final.png"} alt="MoPlayer Android TV product visual" fill sizes="(max-width: 900px) 92vw, 520px" className="fresh-image" unoptimized={(model.siteImages?.home_product_hero || "").startsWith("http")} /></div>
          <div className="os-moplayer-mini"><Image src={model.siteImages?.home_product_secondary || "/images/moplayer-activation-flow.webp"} alt="MoPlayer activation flow" fill sizes="220px" className="fresh-image" unoptimized={(model.siteImages?.home_product_secondary || "").startsWith("http")} /></div>
        </div>
      </section>

      <section className="fresh-section os-home-cta os-premium-cta">
        <p className="fresh-eyebrow">{isAr ? "الخطوة التالية" : "Next move"}</p>
        <h2>{home.ctaTitle}</h2>
        <p>{home.ctaBody}</p>
        <div className="fresh-actions">
          <Link href={pathFor(model.locale, "contact")} prefetch={false} className="fresh-button fresh-button-primary magnetic-surface">{home.ctaPrimary}</Link>
          <a href={socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="fresh-button magnetic-surface">{home.ctaSecondary}</a>
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
        ["02", "نبني الهيكل", "نرتب الصفحات، الرسائل، وأزرار التواصل ومساره حتى يفهم الزائر الخطوة التالية بسهولة."],
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
        <SectionHeader eyebrow={c.services.eyebrow} title={c.services.title} body={c.services.body} level="h1" />
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

      <SiteOffersSection model={model} placement="services" />

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
          <Link href={pathFor(model.locale, "contact")} prefetch={false} className="fresh-button fresh-button-primary magnetic-surface">
            {isAr ? "ابدأ مشروعك" : "Start your project"}
          </Link>
          <Link href={pathFor(model.locale, "work")} prefetch={false} className="fresh-button magnetic-surface">
            {isAr ? "شاهد الأعمال" : "See the work"}
          </Link>
        </div>
      </section>
    </PageShell>
  );
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
    { id: "", title: isAr ? "شاهد أحدث الفيديوهات على القناة" : "Watch the latest videos on the channel", thumbnail: "/images/yt-channel-hero.png", views: Number(model.youtube.views) || youtubeChannel.fallback.views, publishedAt: new Date().toISOString() },
  ];
  const watchUrl = (id?: string) => (id ? `https://www.youtube.com/watch?v=${id}` : socialLinks.youtube);
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
    { label: y.hero.stats[0], value: compact(model.locale, model.live.youtube?.subscribers ?? model.youtube.subscribers, compactMetric(youtubeChannel.fallback.subscribers)) },
    { label: y.hero.stats[1], value: compact(model.locale, model.live.youtube?.totalViews ?? model.youtube.views, compactMetric(youtubeChannel.fallback.views)) },
    { label: y.hero.stats[2], value: compact(model.locale, model.live.youtube?.videoCount ?? model.youtube.videos, String(youtubeChannel.fallback.videos)) },
  ];
  const fmt = new Intl.NumberFormat(isAr ? "ar" : "en", { notation: "compact", maximumFractionDigits: 1 });
  const dateFmt = new Intl.DateTimeFormat(isAr ? "ar" : "en", { month: "short", day: "numeric", year: "numeric" });
  const channelName = model.youtube.title || model.live.youtube?.channelTitle || "Mohammad Alfarras";
  // Clean, single-script display name for the channel header (the raw API/CMS
  // title can mix Arabic + Latin + a pipe, which renders as a bidi mess).
  const channelDisplayName = isAr ? "محمد الفراس" : "Mohammad Alfarras";
  const handle = model.youtube.handle || model.live.youtube?.channelHandle || "@Moalfarras";

  function videoDate(value: string | undefined) {
    const date = value ? new Date(value) : null;
    if (!date || Number.isNaN(date.getTime())) return "";
    return dateFmt.format(date);
  }

  return (
    <PageShell className="yt2">
      {/* Cinematic full-bleed hero — featured video as the backdrop */}
      <section className="yt2-hero">
        <div className="yt2-hero-media" style={{ backgroundImage: `url("${spotlight.thumbnail}")` }} aria-hidden="true" />
        <div className="yt2-hero-veil" aria-hidden="true" />
        <div className="yt2-hero-inner">
          <div className="yt2-channel yt2-rise" style={{ "--d": "0ms" } as React.CSSProperties}>
            <span className="yt2-avatar">
              <Image src="/images/logo.png" alt={channelName} width={72} height={72} />
            </span>
            <div>
              <strong><bdi>{channelDisplayName}</bdi></strong>
              <span className="yt2-handle"><i aria-hidden="true" /><bdi>{handle}</bdi></span>
            </div>
          </div>
          <p className="yt2-eyebrow yt2-rise" style={{ "--d": "80ms" } as React.CSSProperties}>{y.hero.eyebrow}</p>
          <h1 className="yt2-title yt2-rise" style={{ "--d": "160ms" } as React.CSSProperties}>{y.hero.title}</h1>
          <p className="yt2-sub yt2-rise" style={{ "--d": "240ms" } as React.CSSProperties}>{y.hero.subtitle}</p>
          <div className="yt2-actions yt2-rise" style={{ "--d": "320ms" } as React.CSSProperties}>
            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="yt2-subscribe">
              <BellRing className="yt-bell" />
              {y.hero.subscribe}
            </a>
            <a href={watchUrl(spotlight.id)} target="_blank" rel="noopener noreferrer" className="yt2-watch">
              <PlayCircle size={18} />
              {y.hero.watch}
            </a>
          </div>
          <div className="yt2-stats yt2-rise" style={{ "--d": "400ms" } as React.CSSProperties}>
            {statsData.map((item, index) => {
              const Icon = [Users, Eye, Film][index] ?? Compass;
              return (
                <div className="yt2-stat" key={item.label}>
                  <Icon size={18} />
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured film */}
      <section className="fresh-section yt2-feature" id="yt-spotlight">
        <a href={watchUrl(spotlight.id)} target="_blank" rel="noopener noreferrer" className="yt2-player" aria-label={y.spotlight.watch}>
          <Image src={spotlight.thumbnail} alt={spotlight.title} fill sizes="(max-width: 900px) 100vw, 60vw" className="fresh-image" />
          <span className="yt2-orb"><PlayCircle /></span>
          <span className="yt2-badge">{y.spotlight.eyebrow}</span>
        </a>
        <div className="yt2-feature-copy">
          <h2>{y.spotlight.title}</h2>
          <h3>{spotlight.title}</h3>
          <p>{y.spotlight.body}</p>
          <div className="yt2-meta">
            <span><Eye size={15} /> {fmt.format(Number(spotlight.views) || 0)} {y.grid.views}</span>
            <span><CalendarDays size={15} /> {videoDate(spotlight.publishedAt)}</span>
          </div>
          <a href={watchUrl(spotlight.id)} target="_blank" rel="noopener noreferrer" className="yt2-watch yt2-watch-solid">
            <PlayCircle size={16} />
            {y.spotlight.watch}
          </a>
        </div>
      </section>

      {/* Latest videos — magazine grid */}
      <section className="fresh-section yt2-latest">
        <SectionHeader eyebrow={y.grid.eyebrow} title={y.grid.title} body={y.grid.body} />
        <div className="yt2-grid">
          {videos.map((video, index) => (
            <a className="yt2-card" key={`${video.id}-${index}`} href={watchUrl(video.id)} target="_blank" rel="noopener noreferrer">
              <div className="yt2-card-thumb">
                <Image src={video.thumbnail} alt={video.title} fill sizes="(max-width: 700px) 100vw, 33vw" className="fresh-image" />
                <span className="yt2-card-play"><PlayCircle /></span>
                <span className="yt2-card-views"><Eye size={13} /> {fmt.format(Number(video.views) || 0)}</span>
              </div>
              <div className="yt2-card-body">
                <h3>{video.title}</h3>
                <span className="yt2-card-date"><CalendarDays size={13} /> {videoDate(video.publishedAt)}</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Series / playlists */}
      <section className="fresh-section yt2-series">
        <SectionHeader eyebrow={y.playlists.eyebrow} title={y.playlists.title} />
        <div className="yt2-series-rail">
          {y.playlists.items.map(([title, body], index) => {
            const Icon = [ListVideo, MonitorPlay, Headphones, Radio][index] ?? Film;
            return (
              <article className="yt2-series-card" key={title}>
                <span className="yt2-series-icon"><Icon /></span>
                <span className="yt2-series-num">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Final subscribe CTA */}
      <section className="fresh-section yt2-cta">
        <div className="yt2-cta-glow" aria-hidden="true" />
        <p className="yt2-eyebrow"><bdi>{handle}</bdi></p>
        <h2>{y.cta.title}</h2>
        <p>{y.cta.body}</p>
        <div className="yt2-actions yt2-actions-center">
          <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="yt2-subscribe">
            <BellRing className="yt-bell" />
            {y.cta.primary}
          </a>
          <Link href={pathFor(model.locale, "contact")} prefetch={false} className="yt2-watch">{y.cta.secondary}</Link>
        </div>
      </section>
    </PageShell>
  );
}

function AboutPage({ model }: { model: SiteViewModel }) {
  const c = t(model.locale);
  return (
    <PageShell>
      <section className="fresh-section fresh-first">
        <SectionHeader eyebrow={c.about.eyebrow} title={c.about.title} body={c.about.body} level="h1" />
        <PillarGrid model={model} />
      </section>
    </PageShell>
  );
}

export function DigitalOsPage({ model }: { model: SiteViewModel }) {
  switch (model.pageSlug) {
    case "services":
      return <ServicesPage model={model} />;
    case "youtube":
      return <YoutubePage model={model} />;
    case "about":
      return <AboutPage model={model} />;
    case "home":
    default:
      return <HomePageV2 model={model} />;
  }
}
