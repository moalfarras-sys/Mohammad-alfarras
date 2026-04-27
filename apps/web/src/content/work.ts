import type { Locale } from "@/types/cms";

import type { Localized } from "./site";

export type CaseStudyContent = {
  slugAliases: string[];
  category: string;
  role: string;
  problem: string;
  constraints: string[];
  strategy: string;
  technicalDecisions: string[];
  uxDecisions: string[];
  changed: string[];
  stack: string[];
  outcome: string;
  lessons: string[];
  proofChips: string[];
  cta: string;
  liveLabel?: string;
};

export const workPageCopy = {
  en: {
    eyebrow: "Selected work",
    title: "Real service websites, product surfaces, and business systems shaped for clarity.",
    body:
      "Each project is shown through the actual job: the business problem, the interface decision, the copy, the conversion path, and what became clearer. No invented business metrics.",
    caseStudy: "Case study",
    role: "Role",
    problem: "Problem",
    stack: "Stack / discipline",
    proof: "Proof",
    open: "Read case study",
    live: "Open live site",
    allTitle: "Case-study entries",
  },
  ar: {
    eyebrow: "الأعمال المختارة",
    title: "مواقع خدمات ومنتجات وأنظمة أعمال حقيقية مصممة للوضوح.",
    body:
      "كل مشروع يُعرض من خلال وظيفته الحقيقية: مشكلة العمل، قرار الواجهة، النص، مسار التحويل، وما أصبح أوضح. بدون أرقام تجارية غير موثقة.",
    caseStudy: "دراسة حالة",
    role: "الدور",
    problem: "المشكلة",
    stack: "المجال / التقنية",
    proof: "الدليل",
    open: "اقرأ دراسة الحالة",
    live: "افتح الموقع",
    allTitle: "مدخلات دراسات الحالة",
  },
} satisfies Localized<Record<string, string>>;

export const caseStudyCopy = {
  en: {
    summary: "Project summary",
    role: "Role",
    problem: "Problem",
    challenge: "Challenge",
    solution: "Solution",
    result: "Result",
    constraints: "Constraints",
    strategy: "Strategy",
    technical: "Technical decisions",
    ux: "UX and content decisions",
    changed: "What changed",
    stack: "Stack",
    outcome: "Outcome",
    gallery: "Visual gallery",
    lessons: "Lessons",
    nextEyebrow: "Next step",
    nextTitle: "Need this level of clarity for your product or service?",
    nextBody: "Send the project as it is. The first useful step is to identify what the interface needs to prove.",
    nextCta: "Start a focused conversation",
    productCta: "Open product page",
    liveCta: "Open live site",
  },
  ar: {
    summary: "ملخص المشروع",
    role: "الدور",
    problem: "المشكلة",
    challenge: "التحدي",
    solution: "الحل",
    result: "النتيجة",
    constraints: "القيود",
    strategy: "الاستراتيجية",
    technical: "القرارات التقنية",
    ux: "قرارات UX والمحتوى",
    changed: "ما الذي تغيّر",
    stack: "التقنيات والمجالات",
    outcome: "النتيجة",
    gallery: "المعرض البصري",
    lessons: "الدروس",
    nextEyebrow: "الخطوة التالية",
    nextTitle: "تحتاج هذا المستوى من الوضوح لمنتجك أو خدمتك؟",
    nextBody: "أرسل المشروع كما هو. أول خطوة مفيدة هي تحديد ما الذي يجب أن تثبته الواجهة.",
    nextCta: "ابدأ محادثة مركّزة",
    productCta: "افتح صفحة المنتج",
    liveCta: "افتح الموقع",
  },
} satisfies Localized<Record<string, string>>;

export const caseStudies = {
  seel: {
    en: {
      slugAliases: ["seel", "seeltransport"],
      category: "Logistics service presence",
      role: "Interface structure, visual hierarchy, bilingual presentation, and service-story refinement.",
      problem:
        "The service needed to feel operationally credible quickly. The page had to explain what SEEL Transport does without making the visitor work through vague service language.",
      constraints: [
        "No unsupported performance or revenue claims.",
        "The service story had to stay practical and readable for a logistics audience.",
        "The first screen needed stronger trust without turning into a generic corporate template.",
      ],
      strategy:
        "Lead with operational clarity: what the company handles, why the structure feels reliable, and how the visitor can move toward contact without friction.",
      technicalDecisions: [
        "Use a case-study route instead of a shallow project card so the work can be evaluated by problem and decisions.",
        "Keep imagery sized with stable aspect ratios to avoid layout shift.",
        "Treat external links as optional supporting proof, not as the whole story.",
      ],
      uxDecisions: [
        "Prioritize service clarity over decoration.",
        "Use short proof chips for logistics, route coordination, and service trust.",
        "Make the CTA direct and visible without repeating aggressive sales language.",
      ],
      changed: [
        "The project now reads as a service system, not only a screenshot.",
        "The role and constraints are explicit.",
        "The presentation is easier to scan for a client or recruiter.",
      ],
      stack: ["Next.js", "React", "TypeScript", "Responsive UI", "Content structure"],
      outcome:
        "A calmer, more credible logistics case study with clear ownership and a stronger route from problem to execution.",
      lessons: [
        "Trust in a service page usually comes from order and specificity before visual polish.",
        "Operational companies benefit from direct language and predictable navigation.",
      ],
      proofChips: ["Logistics", "Service trust", "Conversion path"],
      cta: "Read SEEL case study",
      liveLabel: "Open SEEL Transport",
    },
    ar: {
      slugAliases: ["seel", "seeltransport"],
      category: "حضور رقمي لخدمة لوجستية",
      role: "تنظيم الواجهة، الهرمية البصرية، العرض ثنائي اللغة، وتحسين قصة الخدمة.",
      problem:
        "الخدمة كانت تحتاج أن تبدو موثوقة تشغيلياً بسرعة. الصفحة يجب أن تشرح ما يقدمه SEEL Transport من دون أن يضيع الزائر داخل لغة عامة.",
      constraints: [
        "لا توجد أرقام أداء أو مبيعات غير موثقة.",
        "قصة الخدمة يجب أن تبقى عملية ومفهومة لجمهور لوجستي.",
        "أول شاشة يجب أن تبني ثقة أقوى من دون أن تتحول إلى قالب شركات عام.",
      ],
      strategy:
        "البدء من الوضوح التشغيلي: ما الذي تتولاه الشركة، لماذا تبدو البنية قابلة للثقة، وكيف ينتقل الزائر إلى التواصل من دون احتكاك.",
      technicalDecisions: [
        "استخدام صفحة دراسة حالة بدل بطاقة مشروع مختصرة حتى يظهر العمل من خلال المشكلة والقرارات.",
        "تثبيت نسب الصور لتقليل تغيّر التخطيط أثناء التحميل.",
        "اعتبار الرابط الخارجي دليلاً مساعداً، لا القصة الكاملة.",
      ],
      uxDecisions: [
        "تقديم وضوح الخدمة قبل الزخرفة.",
        "استخدام شرائح دليل قصيرة عن اللوجستيات، تنسيق المسارات، وثقة الخدمة.",
        "جعل الدعوة إلى التواصل مباشرة وواضحة من دون مبالغة تسويقية.",
      ],
      changed: [
        "أصبح المشروع يُقرأ كنظام خدمة، وليس كسكرينشوت فقط.",
        "صار الدور والقيود أوضح.",
        "أصبحت دراسة الحالة أسهل للمراجعة من عميل أو مسؤول توظيف.",
      ],
      stack: ["Next.js", "React", "TypeScript", "واجهة متجاوبة", "بنية محتوى"],
      outcome: "دراسة حالة أهدأ وأكثر مصداقية لخدمة لوجستية، مع ملكية أوضح ومسار أقوى من المشكلة إلى التنفيذ.",
      lessons: [
        "الثقة في صفحات الخدمات تأتي غالباً من النظام والتحديد قبل اللمعة البصرية.",
        "الشركات التشغيلية تستفيد من لغة مباشرة وتنقل متوقع.",
      ],
      proofChips: ["لوجستيات", "ثقة الخدمة", "مسار تواصل"],
      cta: "اقرأ دراسة SEEL",
      liveLabel: "افتح SEEL Transport",
    },
  },
  schnell: {
    en: {
      slugAliases: ["schnell", "schnell-sicher", "schnellsicherumzug"],
      category: "Local service conversion site",
      role: "Landing-page structure, trust hierarchy, booking flow, and bilingual service copy direction.",
      problem:
        "A moving-service visitor needs fast reassurance: what is offered, why it feels reliable, and how to request help. Any ambiguity weakens the booking path.",
      constraints: [
        "No invented booking numbers, customer counts, or testimonial claims.",
        "The design needed to feel useful on mobile because local-service visitors often act quickly.",
        "The page had to balance urgency with a calm, professional tone.",
      ],
      strategy:
        "Build the page around the decision path: understand the service, see trust signals, choose the next step, and contact with minimal friction.",
      technicalDecisions: [
        "Use structured case-study content for problem, decisions, and outcome.",
        "Keep CTAs and external links accessible from keyboard and mobile.",
        "Use image crops that reveal real page surfaces instead of generic service imagery.",
      ],
      uxDecisions: [
        "Make booking intent visible early.",
        "Use compact service proof chips instead of unsupported metrics.",
        "Keep copy concrete and action-oriented.",
      ],
      changed: [
        "The project now communicates the business problem behind the interface.",
        "The card and case study explain Mohammad's ownership more clearly.",
        "The service feels more direct without inflated promises.",
      ],
      stack: ["Next.js", "Responsive design", "Service copy", "Trust hierarchy", "CTA architecture"],
      outcome: "A clearer local-service case study that shows how presentation, trust, and action paths work together.",
      lessons: [
        "For local services, the best interface often removes hesitation rather than adding visual noise.",
        "A booking page needs a visible route, not just a polished hero.",
      ],
      proofChips: ["Booking path", "Local service", "Mobile scanning"],
      cta: "Read Schnell Sicher case study",
      liveLabel: "Open Schnell Sicher Umzug",
    },
    ar: {
      slugAliases: ["schnell", "schnell-sicher", "schnellsicherumzug"],
      category: "موقع خدمة محلية موجّه للتحويل",
      role: "بنية صفحة الهبوط، هرمية الثقة، مسار الحجز، وتوجيه النص ثنائي اللغة للخدمة.",
      problem:
        "زائر خدمة النقل يحتاج طمأنة سريعة: ما العرض، لماذا يبدو موثوقاً، وكيف يطلب المساعدة. أي غموض يضعف مسار الحجز.",
      constraints: [
        "لا توجد أرقام حجوزات أو عملاء أو شهادات غير موثقة.",
        "التصميم يجب أن يكون عملياً على الهاتف لأن زائر الخدمات المحلية يتخذ قراره بسرعة.",
        "الصفحة تحتاج توازناً بين الإلحاح والنبرة المهنية الهادئة.",
      ],
      strategy:
        "بناء الصفحة حول مسار القرار: فهم الخدمة، رؤية إشارات الثقة، اختيار الخطوة التالية، والتواصل بأقل احتكاك ممكن.",
      technicalDecisions: [
        "استخدام محتوى دراسة حالة منظم للمشكلة والقرارات والنتيجة.",
        "إبقاء الدعوات إلى الفعل والروابط الخارجية قابلة للوصول بالكيبورد والهاتف.",
        "استخدام صور تكشف واجهات فعلية بدل صور خدمات عامة.",
      ],
      uxDecisions: [
        "إظهار نية الحجز مبكراً.",
        "استخدام شرائح دليل مختصرة بدل أرقام غير مدعومة.",
        "إبقاء النص عملياً وموجهاً للفعل.",
      ],
      changed: [
        "صار المشروع يشرح مشكلة العمل خلف الواجهة.",
        "أصبحت البطاقة ودراسة الحالة أوضح في عرض ملكية محمد للعمل.",
        "الخدمة تبدو مباشرة أكثر من دون وعود مبالغ فيها.",
      ],
      stack: ["Next.js", "تصميم متجاوب", "نص خدمات", "هرمية ثقة", "بنية CTA"],
      outcome: "دراسة حالة أوضح لخدمة محلية، تبيّن كيف يعمل العرض والثقة ومسار الفعل معاً.",
      lessons: [
        "في الخدمات المحلية، أفضل واجهة غالباً تزيل التردد بدل أن تضيف ضجيجاً بصرياً.",
        "صفحة الحجز تحتاج مساراً مرئياً، لا بطلاً بصرياً فقط.",
      ],
      proofChips: ["مسار حجز", "خدمة محلية", "قراءة على الهاتف"],
      cta: "اقرأ دراسة Schnell Sicher",
      liveLabel: "افتح Schnell Sicher Umzug",
    },
  },
  moplayer: {
    en: {
      slugAliases: ["moplayer"],
      category: "Android media product",
      role: "Product positioning, Android/Android TV product surface, release story, support/privacy architecture, and website integration.",
      problem:
        "MoPlayer needed to be presented as a serious flagship product inside Mohammad's ecosystem, not as a detached download page or inflated app microsite.",
      constraints: [
        "No unsupported comparisons, testimonials, speed claims, review ratings, or security promises.",
        "The app must clearly state that it does not provide channels, playlists, subscriptions, or copyrighted media.",
        "Product, case study, support, privacy, and downloads must remain part of the same site architecture.",
      ],
      strategy:
        "Position MoPlayer through product ownership: Android and Android TV context, release details, installation guidance, support flow, legal clarity, and a case-study narrative.",
      technicalDecisions: [
        "Use release metadata for version, file size, SDK, ABI, and download route.",
        "Generate SoftwareApplication JSON-LD without ratings, prices, reviews, or awards.",
        "Keep legacy /app redirects while making the localized product page canonical.",
      ],
      uxDecisions: [
        "Replace comparison claims with product principles.",
        "Translate installation and FAQ content fully in Arabic.",
        "Keep the legal disclaimer visible near download and FAQ areas.",
      ],
      changed: [
        "MoPlayer now reads as the flagship product of the same engineering identity.",
        "The product story is legally safer and more factual.",
        "Arabic users receive the full product explanation, not a partial translation.",
      ],
      stack: ["Android", "Android TV", "APK releases", "Next.js", "Product content", "Support flow"],
      outcome:
        "A unified product case study that shows product ownership without inventing adoption, performance, or legal claims.",
      lessons: [
        "A product page becomes more trustworthy when it says what the product does not do.",
        "Support and privacy are part of product quality, not footer afterthoughts.",
      ],
      proofChips: ["Android", "Android TV", "Release flow", "Support/privacy"],
      cta: "Read MoPlayer case study",
    },
    ar: {
      slugAliases: ["moplayer"],
      category: "منتج وسائط على Android",
      role: "تموضع المنتج، سطح Android وAndroid TV، قصة الإصدار، بنية الدعم والخصوصية، ودمج المنتج داخل الموقع.",
      problem:
        "MoPlayer كان يحتاج أن يظهر كمنتج رئيسي جاد داخل منظومة محمد، لا كصفحة تحميل منفصلة ولا كموقع تطبيق مبالغ في وعوده.",
      constraints: [
        "لا مقارنات أو شهادات أو وعود سرعة أو تقييمات أو ادعاءات أمان غير موثقة.",
        "يجب توضيح أن MoPlayer لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق.",
        "المنتج، دراسة الحالة، الدعم، الخصوصية، والتنزيل يجب أن تبقى ضمن بنية الموقع نفسها.",
      ],
      strategy:
        "عرض MoPlayer من زاوية ملكية المنتج: سياق Android وAndroid TV، تفاصيل الإصدار، إرشادات التثبيت، مسار الدعم، الوضوح القانوني، ودراسة حالة.",
      technicalDecisions: [
        "استخدام بيانات الإصدار لعرض النسخة، الحجم، SDK، المعمارية، ومسار التنزيل.",
        "إنتاج SoftwareApplication JSON-LD بدون تقييمات أو أسعار أو مراجعات أو جوائز.",
        "الإبقاء على تحويل /app القديم مع جعل صفحة المنتج المحلية هي الصفحة الأساسية.",
      ],
      uxDecisions: [
        "استبدال المقارنات بمبادئ منتج واضحة.",
        "ترجمة خطوات التثبيت والأسئلة الشائعة بالكامل إلى العربية.",
        "إظهار التنبيه القانوني قرب مناطق التحميل والأسئلة.",
      ],
      changed: [
        "صار MoPlayer يُقرأ كمنتج رئيسي داخل الهوية الهندسية نفسها.",
        "أصبحت قصة المنتج أكثر أماناً وواقعية.",
        "المستخدم العربي يحصل على شرح كامل، وليس ترجمة جزئية.",
      ],
      stack: ["Android", "Android TV", "إصدارات APK", "Next.js", "محتوى منتج", "مسار دعم"],
      outcome: "دراسة حالة موحدة لمنتج تُظهر الملكية من دون اختراع أرقام تبنٍ أو وعود أداء أو ادعاءات قانونية.",
      lessons: [
        "صفحة المنتج تصبح أوثق عندما توضّح ما الذي لا يفعله المنتج.",
        "الدعم والخصوصية جزء من جودة المنتج، وليسا روابط هامشية في الفوتر.",
      ],
      proofChips: ["Android", "Android TV", "مسار إصدار", "دعم وخصوصية"],
      cta: "اقرأ دراسة MoPlayer",
    },
  },
  adtransporte: {
    en: {
      slugAliases: ["ad-fahrzeugtransporte", "adtransporte", "a-d-fahrzeugtransporte"],
      category: "German transport service website",
      role: "Service structure, conversion hierarchy, bilingual business positioning, and mobile-first contact flow.",
      problem:
        "A towing and vehicle-transport visitor needs fast certainty: what services are covered, whether the area fits, and how to call or send a WhatsApp request without searching.",
      constraints: [
        "No unsupported conversion or revenue claims.",
        "German service terminology needed to remain practical and familiar.",
        "The site needed to support urgent mobile visitors without feeling chaotic.",
      ],
      strategy:
        "Structure the page around service clarity: Abschleppdienst, Fahrzeugtransport, Überführungen, Baumaschinen-Transport, Berlin/Brandenburg, and direct action.",
      technicalDecisions: [
        "Keep service blocks short and scannable.",
        "Use stable image ratios and contact-first CTAs for mobile.",
        "Treat WhatsApp and phone actions as primary conversion routes.",
      ],
      uxDecisions: [
        "Lead with emergency/service context instead of abstract branding.",
        "Make every service card answer one visitor question.",
        "Keep German wording direct and operational.",
      ],
      changed: [
        "The business is presented as a credible local service instead of a generic transport page.",
        "Visitors can identify the relevant service faster.",
        "The contact route is visible without aggressive sales language.",
      ],
      stack: ["Service website", "Mobile-first UX", "German copy", "WhatsApp CTA", "Transport positioning"],
      outcome:
        "A cleaner service presence for vehicle transport and towing in Berlin/Brandenburg, built for clarity and fast contact.",
      lessons: [
        "Urgent services need fewer words and stronger order.",
        "Trust starts with service specificity before visual decoration.",
      ],
      proofChips: ["Abschleppdienst", "Fahrzeugtransport", "Berlin & Brandenburg"],
      cta: "Read A&D case study",
      liveLabel: "Open A&D Fahrzeugtransporte",
    },
    ar: {
      slugAliases: ["ad-fahrzeugtransporte", "adtransporte", "a-d-fahrzeugtransporte"],
      category: "موقع خدمات نقل وجر سيارات في ألمانيا",
      role: "تنظيم الخدمات، هرمية التحويل، تموضع تجاري ألماني، ومسار تواصل مناسب للموبايل.",
      problem:
        "زائر خدمات الجر ونقل المركبات يحتاج تأكيداً سريعاً: ما الخدمات المتاحة، هل تغطي المنطقة، وكيف يتصل أو يرسل WhatsApp بدون بحث طويل.",
      constraints: [
        "لا توجد أرقام تحويل أو مبيعات غير موثقة.",
        "مصطلحات الخدمة الألمانية يجب أن تبقى عملية ومألوفة.",
        "الموقع يجب أن يخدم الزائر المستعجل على الموبايل بدون فوضى.",
      ],
      strategy:
        "ترتيب الصفحة حول وضوح الخدمة: Abschleppdienst، Fahrzeugtransport، Überführungen، Baumaschinen-Transport، Berlin/Brandenburg، ثم فعل مباشر.",
      technicalDecisions: [
        "إبقاء كتل الخدمات قصيرة وسهلة المسح.",
        "استخدام نسب صور ثابتة ودعوات اتصال واضحة على الموبايل.",
        "اعتبار الهاتف وWhatsApp مسارات تحويل أساسية.",
      ],
      uxDecisions: [
        "البدء بسياق الخدمة والحاجة بدلاً من شعارات عامة.",
        "كل بطاقة خدمة تجيب على سؤال واحد للزائر.",
        "الحفاظ على لغة ألمانية مباشرة وتشغيلية.",
      ],
      changed: [
        "أصبحت الشركة تُعرض كخدمة محلية موثوقة لا كموقع نقل عام.",
        "يمكن للزائر تحديد الخدمة المناسبة بسرعة أكبر.",
        "مسار التواصل واضح بدون لغة بيع مبالغ فيها.",
      ],
      stack: ["موقع خدمات", "UX موبايل أولاً", "نص ألماني", "WhatsApp CTA", "تموضع نقل"],
      outcome:
        "حضور خدمة أنظف لنقل وجر المركبات في Berlin/Brandenburg، مبني على الوضوح والتواصل السريع.",
      lessons: [
        "الخدمات العاجلة تحتاج كلمات أقل وترتيباً أقوى.",
        "الثقة تبدأ من تحديد الخدمة قبل الزخرفة البصرية.",
      ],
      proofChips: ["Abschleppdienst", "Fahrzeugtransport", "Berlin & Brandenburg"],
      cta: "اقرأ دراسة A&D",
      liveLabel: "افتح A&D Fahrzeugtransporte",
    },
  },
  intelligent: {
    en: {
      slugAliases: ["intelligent-umzuege", "intelligent-umzüge"],
      category: "Moving-company digital presence",
      role: "Service architecture, quote/request flow, German service copy, and trust-first visual hierarchy.",
      problem:
        "Moving-company visitors compare quickly. They need to understand services, location, and the next step before hesitation sends them to another provider.",
      constraints: [
        "No invented booking numbers or customer claims.",
        "The service range needed to stay clear: Umzüge, Transporte, Entsorgung, Berlin.",
        "The flow needed to work well on phones.",
      ],
      strategy:
        "Make the company easier to evaluate: clear services, local context, direct request path, and a calm trust layer.",
      technicalDecisions: [
        "Use service-first sections instead of decorative filler.",
        "Keep request CTAs repeated but not noisy.",
        "Size imagery and cards to prevent mobile overflow.",
      ],
      uxDecisions: [
        "Show the service range before asking for contact.",
        "Keep copy concrete for normal customers.",
        "Make the request path visible on every major section.",
      ],
      changed: [
        "The business reads as a structured local service.",
        "Visitors can scan the offer and contact path quickly.",
        "The page supports trust without fake metrics.",
      ],
      stack: ["Business website", "German service copy", "Mobile layout", "Quote flow", "Local SEO structure"],
      outcome:
        "A clearer moving-company presence for Berlin with service explanation, contact flow, and mobile-first structure.",
      lessons: [
        "Local-service pages win by reducing doubt.",
        "A request form is stronger when the service story has already done its job.",
      ],
      proofChips: ["Umzüge", "Transporte", "Entsorgung", "Berlin"],
      cta: "Read Intelligent Umzüge case study",
      liveLabel: "Open Intelligent Umzüge",
    },
    ar: {
      slugAliases: ["intelligent-umzuege", "intelligent-umzüge"],
      category: "حضور رقمي لشركة انتقال ونقل",
      role: "بنية خدمات، مسار طلب عرض، نص خدمات ألماني، وهرمية بصرية مبنية على الثقة.",
      problem:
        "زوار شركات الانتقال يقارنون بسرعة. يحتاجون فهم الخدمات والمنطقة والخطوة التالية قبل أن يدفعهم التردد إلى مزود آخر.",
      constraints: [
        "لا توجد أرقام حجز أو ادعاءات عملاء غير موثقة.",
        "نطاق الخدمة يجب أن يبقى واضحاً: Umzüge، Transporte، Entsorgung، Berlin.",
        "المسار يجب أن يعمل جيداً على الهاتف.",
      ],
      strategy:
        "جعل الشركة أسهل للتقييم: خدمات واضحة، سياق محلي، مسار طلب مباشر، وطبقة ثقة هادئة.",
      technicalDecisions: [
        "استخدام أقسام خدمات فعلية بدل حشو زخرفي.",
        "تكرار CTA عند الحاجة بدون ضجيج.",
        "ضبط الصور والبطاقات لمنع أي overflow على الموبايل.",
      ],
      uxDecisions: [
        "عرض نطاق الخدمة قبل طلب التواصل.",
        "إبقاء النص عملياً لعميل عادي.",
        "إظهار مسار الطلب في كل قسم مهم.",
      ],
      changed: [
        "أصبح العمل يُقرأ كخدمة محلية منظمة.",
        "يمكن للزائر مسح العرض ومسار التواصل بسرعة.",
        "الصفحة تبني الثقة بدون أرقام وهمية.",
      ],
      stack: ["موقع أعمال", "نص خدمات ألماني", "موبايل", "مسار طلب عرض", "بنية Local SEO"],
      outcome:
        "حضور أوضح لشركة انتقال في Berlin مع شرح خدمات ومسار تواصل وبنية موبايل أولاً.",
      lessons: [
        "صفحات الخدمات المحلية تربح عندما تقلل التردد.",
        "نموذج الطلب أقوى عندما تكون قصة الخدمة قامت بعملها مسبقاً.",
      ],
      proofChips: ["Umzüge", "Transporte", "Entsorgung", "Berlin"],
      cta: "اقرأ دراسة Intelligent Umzüge",
      liveLabel: "افتح Intelligent Umzüge",
    },
  },
} satisfies Record<string, Localized<CaseStudyContent>>;

export function getCaseStudyBySlug(slug: string, locale: Locale): CaseStudyContent | null {
  for (const study of Object.values(caseStudies)) {
    if (study.en.slugAliases.includes(slug) || study.ar.slugAliases.includes(slug)) {
      return study[locale];
    }
  }
  return null;
}
