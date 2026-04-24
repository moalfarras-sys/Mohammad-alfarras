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
    title: "Case studies inside one product-minded portfolio system.",
    body:
      "The work is presented as practical ownership: problem, role, constraints, technical decisions, UX/content decisions, and what changed. No invented business metrics.",
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
    title: "دراسات حالة داخل منظومة واحدة بعقلية منتج.",
    body:
      "الأعمال هنا تُعرض كملكية عملية: المشكلة، الدور، القيود، القرارات التقنية، قرارات UX والمحتوى، وما تغيّر. بدون أرقام تجارية غير موثقة.",
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
} satisfies Record<string, Localized<CaseStudyContent>>;

export function getCaseStudyBySlug(slug: string, locale: Locale): CaseStudyContent | null {
  for (const study of Object.values(caseStudies)) {
    if (study.en.slugAliases.includes(slug) || study.ar.slugAliases.includes(slug)) {
      return study[locale];
    }
  }
  return null;
}
