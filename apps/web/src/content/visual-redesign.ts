import type { Locale } from "@/types/cms";

export const heroCopy = {
  en: {
    eyebrow: "Syrian-German creator in Germany",
    title: "Real operations. Clear interfaces. Honest tech storytelling.",
    body:
      "I am Mohammad Alfarras: a web developer, UI/UX designer, MoPlayer builder, Arabic tech creator, and logistics/disposition professional. I turn real-world business pressure into digital experiences people understand faster.",
    primary: "View work",
    secondary: "Explore MoPlayer",
    youtube: "Watch YouTube",
    contact: "Contact me",
    signature: "From logistics to digital products",
    proof: [
      { value: "Germany", label: "Based and working" },
      { value: "1.5M+", label: "YouTube views" },
      { value: "Android TV", label: "MoPlayer focus" },
      { value: "Web + UX", label: "Business systems" },
    ],
    pillarsTitle: "What I build",
    pillars: [
      {
        title: "Business websites",
        body: "Conversion-focused websites for transport, moving, local services, creators, and small companies.",
      },
      {
        title: "Android products",
        body: "MoPlayer and Android TV interfaces built around remote control, clarity, playback, and release discipline.",
      },
      {
        title: "Arabic tech content",
        body: "Product reviews, SaaS, AI tools, apps, electronics, tutorials, and honest product storytelling.",
      },
      {
        title: "Operational systems",
        body: "Digital flows shaped by logistics, TMS, dispatch work, driver coordination, and customer service reality.",
      },
    ],
    differenceTitle: "Why the work feels different",
    differenceBody:
      "I do not design screens in a vacuum. Logistics taught me sequence, pressure, and reliability. YouTube taught me how people understand value. Web and app work bring both together.",
    workEyebrow: "Featured projects",
    workTitle: "Real projects with real business context.",
    allWork: "All work",
    youtubeTitle: "A creator layer that builds trust.",
    youtubeBody:
      "The channel proves the same skill every interface needs: explain clearly, remove confusion, and respect the visitor before asking for action.",
    finalTitle: "Have a business, product, or idea that needs sharper digital presence?",
    finalBody: "Send the context. I will help turn it into a clearer path, a stronger interface, and a next step people can act on.",
    finalCta: "Start a project",
  },
  ar: {
    eyebrow: "صانع محتوى ومطوّر سوري/ألماني في ألمانيا",
    title: "خبرة تشغيل حقيقية. واجهات واضحة. محتوى تقني صادق.",
    body:
      "أنا محمد الفراس: مطوّر ويب، مصمم واجهات، صانع MoPlayer، صانع محتوى تقني عربي، وأعمل في اللوجستيات والتنسيق التشغيلي. أحوّل ضغط العمل الحقيقي إلى تجارب رقمية يفهمها الناس بسرعة.",
    primary: "شاهد الأعمال",
    secondary: "استكشف MoPlayer",
    youtube: "شاهد يوتيوب",
    contact: "تواصل معي",
    signature: "من اللوجستيات إلى المنتجات الرقمية",
    proof: [
      { value: "ألمانيا", label: "مقيم وأعمل" },
      { value: "+1.5M", label: "مشاهدات يوتيوب" },
      { value: "Android TV", label: "تركيز MoPlayer" },
      { value: "Web + UX", label: "أنظمة أعمال" },
    ],
    pillarsTitle: "ماذا أبني؟",
    pillars: [
      {
        title: "مواقع أعمال",
        body: "مواقع موجّهة للتحويل لشركات النقل، الانتقال، الخدمات المحلية، صنّاع المحتوى، والشركات الصغيرة.",
      },
      {
        title: "منتجات Android",
        body: "MoPlayer وتجارب Android TV مبنية حول الريموت، الوضوح، التشغيل، وانضباط الإصدارات.",
      },
      {
        title: "محتوى تقني عربي",
        body: "مراجعات منتجات، أدوات SaaS وAI، تطبيقات، إلكترونيات، شروحات، وسرد صادق للمنتجات.",
      },
      {
        title: "تفكير تشغيلي",
        body: "تدفقات رقمية متأثرة باللوجستيات، أنظمة TMS، التنسيق، متابعة السائقين، وخدمة العملاء.",
      },
    ],
    differenceTitle: "لماذا يختلف عملي؟",
    differenceBody:
      "لا أصمم الشاشات بمعزل عن الواقع. اللوجستيات علّمتني التسلسل والضغط والاعتمادية. يوتيوب علّمني كيف يفهم الناس القيمة. الويب والتطبيقات تجمع كل ذلك في تجربة واحدة.",
    workEyebrow: "مشاريع مختارة",
    workTitle: "مشاريع حقيقية بسياق أعمال واضح.",
    allWork: "كل الأعمال",
    youtubeTitle: "طبقة محتوى تبني الثقة.",
    youtubeBody:
      "القناة تثبت نفس المهارة التي تحتاجها أي واجهة: شرح واضح، إزالة الالتباس، واحترام عقل الزائر قبل طلب أي خطوة منه.",
    finalTitle: "لديك عمل أو منتج أو فكرة تحتاج حضورًا رقميًا أوضح؟",
    finalBody: "أرسل السياق. سأساعدك على تحويله إلى مسار أوضح، واجهة أقوى، وخطوة تالية يمكن للناس اتخاذها.",
    finalCta: "ابدأ مشروعك",
  },
} as const;

export const projectShowcaseCopy = {
  en: {
    moplayer: {
      title: "MoPlayer",
      industry: "Android TV media product",
      built: "Android TV-first IPTV/media player, activation flow, release API, APK download, and admin-controlled app settings.",
      goal: "A cleaner product experience for adding sources, watching content, and keeping releases trustworthy.",
      role: "Product, Android, web, release system",
      stack: ["Android", "Kotlin", "Media", "Supabase", "Next.js"],
      cta: "Open product",
    },
    "ad-fahrzeugtransporte": {
      title: "A&D Fahrzeugtransporte",
      industry: "Vehicle transport, towing, Berlin & Brandenburg",
      built: "A German service website for towing, vehicle transport, transfers, machinery transport, and 24/7 contact.",
      goal: "Make emergency and transport services easier to trust, understand, and contact quickly.",
      role: "Website strategy and service presentation",
      stack: ["Service UX", "German copy", "WhatsApp CTA", "Mobile-first"],
      cta: "View case",
    },
    "intelligent-umzuege": {
      title: "Intelligent Umzüge",
      industry: "Moving and transport company",
      built: "A service website for moves, transport, disposal, and request flows in Berlin.",
      goal: "Turn a practical local service into a cleaner, more confident digital presence.",
      role: "Website, content structure, conversion flow",
      stack: ["Next.js", "Service pages", "Lead flow", "Responsive UI"],
      cta: "View case",
    },
    "schnell-sicher": {
      title: "Schnell Sicher Umzug",
      industry: "Moving and local services",
      built: "A modern moving-company website with clearer services, trust sections, and contact paths.",
      goal: "Reduce hesitation and make the next step obvious on mobile.",
      role: "Design, copy structure, website build",
      stack: ["Next.js", "Tailwind", "Service UX", "Forms"],
      cta: "View case",
    },
    seel: {
      title: "SEEL Transport",
      industry: "Transport and service presence",
      built: "A transport/service website with stronger hierarchy, service blocks, and contact-oriented structure.",
      goal: "Present operational services with more confidence and less confusion.",
      role: "Visual direction and website build",
      stack: ["Web design", "Responsive UI", "Content hierarchy"],
      cta: "View case",
    },
  },
  ar: {
    moplayer: {
      title: "MoPlayer",
      industry: "منتج وسائط لـ Android TV",
      built: "تطبيق IPTV/Media Player موجّه للتلفزيون، مع تفعيل، Release API، تحميل APK، وإعدادات تطبيق يتحكم بها الأدمن.",
      goal: "تجربة أوضح لإضافة المصادر، مشاهدة المحتوى، والحفاظ على ثقة الإصدارات والتحميل.",
      role: "منتج، Android، ويب، نظام إصدارات",
      stack: ["Android", "Kotlin", "Media", "Supabase", "Next.js"],
      cta: "افتح المنتج",
    },
    "ad-fahrzeugtransporte": {
      title: "A&D Fahrzeugtransporte",
      industry: "نقل سيارات وجر سيارات في برلين وبراندنبورغ",
      built: "موقع خدمات ألماني للجر، نقل السيارات، النقل بين المدن، نقل المعدات، والتواصل السريع 24/7.",
      goal: "جعل خدمات الطوارئ والنقل أسهل للفهم والثقة والتواصل السريع.",
      role: "استراتيجية موقع وعرض خدمات",
      stack: ["خدمات", "نص ألماني", "WhatsApp CTA", "Mobile-first"],
      cta: "عرض الحالة",
    },
    "intelligent-umzuege": {
      title: "Intelligent Umzüge",
      industry: "شركة انتقال ونقل",
      built: "موقع خدمات للانتقال، النقل، التخلص من الأغراض، ومسار طلب واضح في برلين.",
      goal: "تحويل خدمة محلية عملية إلى حضور رقمي أوضح وأكثر ثقة.",
      role: "موقع، بنية محتوى، مسار تحويل",
      stack: ["Next.js", "صفحات خدمات", "Lead flow", "Responsive UI"],
      cta: "عرض الحالة",
    },
    "schnell-sicher": {
      title: "Schnell Sicher Umzug",
      industry: "انتقال وخدمات محلية",
      built: "موقع حديث لشركة انتقال مع خدمات أوضح، عناصر ثقة، ومسارات تواصل مباشرة.",
      goal: "تقليل التردد وجعل الخطوة التالية واضحة على الهاتف.",
      role: "تصميم، بنية نصوص، بناء موقع",
      stack: ["Next.js", "Tailwind", "Service UX", "Forms"],
      cta: "عرض الحالة",
    },
    seel: {
      title: "SEEL Transport",
      industry: "حضور رقمي لخدمات النقل",
      built: "موقع نقل وخدمات بتسلسل أوضح، أقسام خدمات مرتبة، وبنية تقود للتواصل.",
      goal: "عرض الخدمات التشغيلية بثقة أعلى وارتباك أقل.",
      role: "اتجاه بصري وبناء موقع",
      stack: ["تصميم ويب", "Responsive UI", "هرمية محتوى"],
      cta: "عرض الحالة",
    },
  },
} as const;

export const workVisualCopy = {
  en: {
    eyebrow: "Work gallery",
    title: "A cinematic gallery of service websites, product surfaces, and business systems.",
    body:
      "Each project is shown as a business decision: what had to become clearer, what I built, and how the interface supports trust without fake metrics.",
    allTitle: "Selected case studies",
    role: "My role",
    stack: "Stack",
    proof: "Business value",
    open: "Open case",
  },
  ar: {
    eyebrow: "معرض الأعمال",
    title: "معرض سينمائي لمواقع خدمات ومنتجات وأنظمة أعمال حقيقية.",
    body:
      "كل مشروع هنا يظهر كقرار تجاري: ما الذي كان يجب أن يصبح أوضح، ماذا بنيت، وكيف تساعد الواجهة على بناء الثقة بدون أرقام وهمية.",
    allTitle: "دراسات حالة مختارة",
    role: "دوري",
    stack: "التقنيات",
    proof: "القيمة العملية",
    open: "فتح الحالة",
  },
} as const;

export const youtubeVisualCopy = {
  en: {
    eyebrow: "Arabic tech media",
    title: "Product reviews and tutorials with clarity before hype.",
    body:
      "The channel is a media layer for honest Arabic technology content: SaaS, AI tools, electronics, apps, design tools, marketing tools, and practical tutorials.",
    openChannel: "Open channel",
    subscribe: "Subscribe",
    playerTitle: "Channel highlight",
    selected: "Selected videos",
    latest: "Latest videos",
    categories: "Content categories",
    fallback: "No live video feed is available right now, so this page focuses on the channel story and categories.",
    categoryCards: [
      ["SaaS & AI tools", "Clear reviews for tools people might actually use."],
      ["Electronics", "Practical impressions before a buying decision."],
      ["Apps & digital tools", "What is useful, what is noise, and who it is for."],
      ["Design & marketing", "Tools and workflows explained without inflated promises."],
      ["Tutorials", "Step-by-step explanations for normal users and creators."],
    ],
  },
  ar: {
    eyebrow: "ميديا تقنية عربية",
    title: "مراجعات وشروحات تبدأ بالوضوح قبل الضجيج.",
    body:
      "القناة طبقة إعلامية لمحتوى تقني عربي صادق: SaaS، أدوات AI، إلكترونيات، تطبيقات، أدوات تصميم وتسويق، وشروحات عملية.",
    openChannel: "افتح القناة",
    subscribe: "اشترك",
    playerTitle: "فيديو مختار",
    selected: "فيديوهات مختارة",
    latest: "أحدث الفيديوهات",
    categories: "تصنيفات المحتوى",
    fallback: "لا توجد تغذية فيديو مباشرة الآن، لذلك تعرض الصفحة قصة القناة والتصنيفات بوضوح.",
    categoryCards: [
      ["SaaS وأدوات AI", "مراجعات واضحة لأدوات قد يستخدمها الناس فعلًا."],
      ["إلكترونيات", "انطباعات عملية قبل قرار الشراء."],
      ["تطبيقات وأدوات رقمية", "ما المفيد، ما الضجيج، ولمن يناسب."],
      ["تصميم وتسويق", "أدوات ومسارات عمل بدون وعود مبالغ فيها."],
      ["شروحات", "شرح خطوة بخطوة للمستخدم العادي وصانع المحتوى."],
    ],
  },
} as const;

export const contactVisualCopy = {
  en: {
    eyebrow: "Start clearly",
    title: "A simple project inquiry, not a crowded form.",
    body:
      "Choose the kind of help you need, add the timing and budget if you know them, then describe the outcome. I will answer with a practical next step.",
    email: "Email",
    whatsapp: "WhatsApp",
    availabilityTitle: "Fast context",
    stepsTitle: "How the conversation works",
    direct: "Direct channels",
    privacy: "Private by default. Only send what is needed to evaluate the request.",
    availability: [
      { label: "Good fit", value: "Web, app, redesign, content" },
      { label: "Location", value: "Germany" },
      { label: "Response", value: "Clear next step" },
      { label: "Languages", value: "Arabic, English, German" },
    ],
    steps: [
      "Pick the project type and rough timing.",
      "Describe what exists today and what should change.",
      "I reply with the core problem, scope direction, and next move.",
    ],
  },
  ar: {
    eyebrow: "ابدأ بوضوح",
    title: "طلب مشروع بسيط، وليس نموذجًا مزدحمًا.",
    body:
      "اختر نوع المساعدة التي تحتاجها، أضف الوقت والميزانية إن كانت واضحة، ثم اشرح النتيجة المطلوبة. سأرد عليك بخطوة عملية مباشرة.",
    email: "البريد",
    whatsapp: "واتساب",
    availabilityTitle: "سياق سريع",
    stepsTitle: "كيف تسير المحادثة",
    direct: "قنوات مباشرة",
    privacy: "خصوصيتك أولًا. أرسل فقط ما يلزم لتقييم الطلب.",
    availability: [
      { label: "المناسب", value: "ويب، تطبيق، إعادة تصميم، محتوى" },
      { label: "الموقع", value: "ألمانيا" },
      { label: "الرد", value: "خطوة تالية واضحة" },
      { label: "اللغات", value: "العربية، الإنجليزية، الألمانية" },
    ],
    steps: [
      "اختر نوع المشروع والوقت التقريبي.",
      "اشرح ما الموجود اليوم وما الذي يجب تغييره.",
      "أرد عليك بالمشكلة الأساسية، اتجاه النطاق، والخطوة التالية.",
    ],
  },
} as const;

export const activationVisualCopy = {
  en: {
    eyebrow: "MoPlayer device pairing",
    title: "Activate your TV with a short code.",
    body:
      "MoPlayer shows a 4-character code. Enter only the four characters here; the MO- prefix stays fixed. After activation you can securely send an Xtream or M3U source to the paired device.",
    codeLabel: "Device code",
    placeholder: "4C7K",
    prefix: "MO-",
    check: "Activate",
    waiting: "Waiting for a valid code",
    invalid: "Invalid code",
    activated: "Activated",
    backendError: "Activation service error",
    expired: "Code expired",
    waitingBody: "Open MoPlayer on Android TV, choose Activate via website, then enter the four characters shown on the screen.",
    invalidBody: "Use exactly four allowed characters. O, 0, I, 1, S, and 5 are intentionally blocked.",
    activatedBody: "The TV is activated. MoPlayer will continue to Add Source automatically.",
    backendErrorBody: "The server did not confirm the code. Try again in a moment.",
    expiredBody: "Codes are short-lived. Generate a fresh code from MoPlayer.",
    privacy: "Provider credentials are encrypted server-side and pulled only by the paired MoPlayer device.",
    steps: ["Open MoPlayer", "Choose Activate via Website", "Scan QR or enter 4 chars", "Continue to Add Source"],
  },
  ar: {
    eyebrow: "??? ???? MoPlayer",
    title: "???? ????????? ???? ????.",
    body:
      "???? MoPlayer ????? ?? 4 ?????. ???? ??????? ?????? ??? ???? ????? MO- ????? ?? ???????. ??? ??????? ????? ????? ???? Xtream ?? M3U ????? ??? ?????? ???????.",
    codeLabel: "??? ??????",
    placeholder: "4C7K",
    prefix: "MO-",
    check: "?????",
    waiting: "??????? ??? ????",
    invalid: "????? ??? ????",
    activated: "?? ???????",
    backendError: "??? ?? ???? ???????",
    expired: "????? ?????? ?????",
    waitingBody: "???? MoPlayer ??? Android TV? ???? ??????? ??? ??????? ?? ???? ??????? ?????? ??????? ??? ??????.",
    invalidBody: "?????? ???? ????? ?????? ???. ?????? O ?0 ?I ?1 ?S ?5 ?????? ????? ????????.",
    activatedBody: "?? ????? ?????????. ????? MoPlayer ???????? ??? ????? ??????.",
    backendErrorBody: "?????? ?? ???? ?????. ???? ??? ???? ??? ?????.",
    expiredBody: "????? ???? ?????. ???? ????? ?????? ?? MoPlayer.",
    privacy: "??? ????? ?????? ?????? ??? ?????? ??? ?????? ??? ???? MoPlayer ???????.",
    steps: ["???? MoPlayer", "???? ??????? ??? ??????", "???? QR ?? ???? 4 ?????", "???? ??? ????? ??????"],
  },
} as const;

export function projectCopyFor(locale: Locale, slug: string) {
  const key = normalizeProjectKey(slug);
  return projectShowcaseCopy[locale][key] ?? null;
}

export function normalizeProjectKey(slug: string): keyof typeof projectShowcaseCopy.en {
  if (slug.includes("moplayer")) return "moplayer";
  if (slug.includes("ad") || slug.includes("fahrzeug")) return "ad-fahrzeugtransporte";
  if (slug.includes("intelligent")) return "intelligent-umzuege";
  if (slug.includes("schnell")) return "schnell-sicher";
  return "seel";
}
