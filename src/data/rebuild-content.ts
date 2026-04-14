import type { Locale } from "@/types/cms";

export type RebuildPageKey = "home" | "cv" | "blog" | "projects" | "youtube" | "contact" | "privacy";

type SeoEntry = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  image?: string;
};

type StoryCard = { title: string; body: string };
type JourneyStep = { title: string; body: string; period?: string; location?: string; role?: string; highlights?: string[] };
type ContactReason = { title: string; body: string };
type CollectionLabel = { title: string; body: string };

export type RebuildLocaleContent = {
  brandName: string;
  navTagline: string;
  nav: Record<RebuildPageKey, string>;
  seo: Record<RebuildPageKey, SeoEntry>;
  hero: {
    eyebrow: string;
    title: string;
    body: string;
    primary: string;
    secondary: string;
    proofTitle: string;
    proofBody: string;
  };
  identity: { eyebrow: string; title: string; body: string; cards: StoryCard[] };
  services: { eyebrow: string; title: string; body: string };
  logistics: { eyebrow: string; title: string; body: string; values: string[] };
  featuredWork: { eyebrow: string; title: string; body: string };
  media: { eyebrow: string; title: string; body: string };
  insights: { eyebrow: string; title: string; body: string; cards: StoryCard[] };
  liveLayer: {
    eyebrow: string;
    title: string;
    body: string;
    weather: string;
    matches: string;
    creator: string;
    weatherEmpty: string;
    matchesEmpty: string;
    creatorBody: string;
  };
  journey: { eyebrow: string; title: string; body: string; steps: JourneyStep[] };
  cv: {
    eyebrow: string;
    title: string;
    body: string;
    chips: string[];
    pillarsTitle: string;
    pillarsBody: string;
    creatorTitle: string;
    creatorBody: string;
  };
  projects: {
    eyebrow: string;
    title: string;
    body: string;
    featureTitle: string;
    featureBody: string;
    collection: CollectionLabel;
    conceptTitle: string;
    conceptBody: string;
  };
  youtube: {
    eyebrow: string;
    title: string;
    body: string;
    featuredLabel: string;
    latestLabel: string;
    values: string[];
    collaborationTitle: string;
    collaborationBody: string;
    channelCta: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    body: string;
    chips: string[];
    reasons: ContactReason[];
    directTitle: string;
    directBody: string;
    primaryCta: string;
  };
  privacy: { eyebrow: string; title: string; body: string; items: string[] };
  footer: { title: string; body: string; location: string };
  common: {
    startProject: string;
    viewProjects: string;
    allProjects: string;
    visitProject: string;
    openChannel: string;
    collaborate: string;
    now: string;
    views: string;
    subscribers: string;
    videos: string;
    response: string;
    basedInGermany: string;
  };
};

export const rebuildContent: Record<Locale, RebuildLocaleContent> = {
  ar: {
    brandName: "محمد الفراس",
    navTagline: "ويب جريء · تصميم ذكي · محتوى يبيع الثقة",
    nav: {
      home: "الرئيسية",
      cv: "السيرة",
      blog: "الرؤية",
      projects: "الأعمال",
      youtube: "يوتيوب",
      contact: "تواصل",
      privacy: "الخصوصية",
    },
    seo: {
      home: {
        title: "محمد الفراس | تطوير ويب جريء وتصميم ومحتوى تقني من ألمانيا",
        description: "من الحسكة إلى ألمانيا: محمد الفراس يبني حضورًا رقميًا يربح الثقة من أول شاشة عبر تطوير الواجهات، التصميم الجريء، والمحتوى التقني العربي.",
        ogTitle: "محمد الفراس | حضور رقمي لا يُنسى",
        ogDescription: "تطوير ويب، تصميم جريء، ومحتوى تقني عربي بصوت واضح وانضباط تنفيذي حقيقي.",
        image: "/images/brand-spotlight-2026.jpeg",
      },
      cv: {
        title: "السيرة | محمد الفراس",
        description: "رحلة محمد الفراس من العمليات اليومية واللوجستيات إلى بناء تجارب رقمية ثابتة، جريئة، ومقنعة.",
        ogTitle: "السيرة | تنفيذ حقيقي وذوق بصري",
        ogDescription: "الانضباط التشغيلي حين يدخل عالم الويب يصنع فرقًا يراه العميل قبل أن يقرأ.",
        image: "/images/portrait.jpg",
      },
      blog: {
        title: "الرؤية | محمد الفراس",
        description: "مبادئ عملية حول الوضوح، الثقة، والانطباع الأول كما تُبنى في المشاريع الحقيقية.",
        ogTitle: "الرؤية | ما الذي يجعل العرض يعمل؟",
        ogDescription: "أفكار مختصرة من العمل الفعلي: كيف يُبنى الانطباع، وكيف تتحول الواجهة إلى قرار.",
        image: "/images/dev_abstract_bg_1775984833791.png",
      },
      projects: {
        title: "الأعمال | محمد الفراس",
        description: "دراسات حالة مختارة توضح كيف يتحول الويب من واجهة جميلة إلى أداة تقنع وتحوّل الزائر إلى خطوة فعلية.",
        ogTitle: "الأعمال | كل مشروع هنا حلّ مشكلة حقيقية",
        ogDescription: "صفحات وتجارب صُممت لتقود إلى الثقة، القرار، والحجز.",
        image: "/images/seel-home-case.png",
      },
      youtube: {
        title: "يوتيوب | محمد الفراس",
        description: "محتوى تقني عربي صادق من ألمانيا. شرح واضح، مراجعات حقيقية، وثقة لا تُشترى بالإعلان.",
        ogTitle: "يوتيوب | محتوى عربي حقيقي من ألمانيا",
        ogDescription: "أكثر من 1.5 مليون مشاهدة بنت سلطة مبنية على الصدق لا على الضجيج.",
        image: "/images/yt-channel-hero.png",
      },
      contact: {
        title: "تواصل | محمد الفراس",
        description: "إذا كانت لديك فكرة جادة وتحتاج تنفيذًا لا يخذلها، ابدأ برسالة واضحة وسأعود إليك بخطوة عملية.",
        ogTitle: "تواصل | ابدأ من فكرة واحدة واضحة",
        ogDescription: "تواصل مباشر للمشاريع الجادة في الويب، إعادة التصميم، والتعاونات التقنية.",
        image: "/images/logo-unboxing.png",
      },
      privacy: {
        title: "الخصوصية | محمد الفراس",
        description: "سياسة واضحة ومختصرة حول استخدام البيانات والرسائل وملفات تعريف الارتباط الأساسية.",
        ogTitle: "الخصوصية | وضوح قبل كل شيء",
        ogDescription: "بياناتك لا تُباع ولا تُستخدم خارج ما يلزم لتشغيل التواصل الأساسي.",
        image: "/images/logo.png",
      },
    },
    hero: {
      eyebrow: "متاح للمشاريع المختارة",
      title: "تصميم يسرق الانتباه. كود لا ينكسر. حضور يدفع العميل ليتحرك.",
      body: "أنا محمد الفراس. من الحسكة إلى ألمانيا، جمعت بين انضباط العمليات اليومية وجرأة التصميم وصراحة المحتوى التقني لأبني لك حضورًا رقميًا يصعب تجاهله.",
      primary: "لنبدأ مشروعك الاستثنائي",
      secondary: "شاهد الأعمال",
      proofTitle: "ويب 2026 · زجاج داكن · عمق وحركة محسوبة",
      proofBody: "الهدف ليس أن يبدو كل شيء جميلًا فقط. الهدف أن يشعر الزائر أن أمامه عملًا جادًا من أول ثانية.",
    },
    identity: {
      eyebrow: "من أنا",
      title: "رحلتي: من اللوجستيات إلى صناعة الدهشة",
      body: "لم أبدأ كمصمم منعزل عن الواقع. العمل اليومي تحت الضغط علّمني أن النظام ليس رفاهية، وأن الجمال الحقيقي هو ما يظل ثابتًا عندما تزداد الفوضى حوله.",
      cards: [
        {
          title: "من شوارع الحسكة إلى دقة ألمانيا",
          body: "الهجرة لم تغيّر العنوان فقط. غيّرت نظرتي للوقت، للالتزام، وللنتيجة التي يجب أن تصل في موعدها مهما كان الضغط.",
        },
        {
          title: "اللوجستيات علّمتني كيف لا ينهار الشيء الجميل",
          body: "في العمليات اليومية، كل تأخير له ثمن. لهذا أبني واجهات لا تعتمد على الاستعراض، بل على الترتيب، والتحمل، والوضوح.",
        },
        {
          title: "الكاميرا أضافت ما لا يضيفه الكود وحده",
          body: "أكثر من 1.5 مليون مشاهدة لم تأتِ من المبالغة. جاءت من شرح صادق يعرف متى يخاطب العقل ومتى يبني الثقة.",
        },
      ],
    },
    services: {
      eyebrow: "كيف أجعلك تتفوق؟",
      title: "ويب جريء. قصة واضحة. تنفيذ لا يتعب.",
      body: "أعمل على المشاريع التي تريد أكثر من واجهة لطيفة. تريد حضورًا يشرح القيمة، يرفع الثقة، ويدفع إلى قرار واضح.",
    },
    logistics: {
      eyebrow: "المنهج",
      title: "الانضباط ليس طبقة إضافية. هو ما يجعل كل شيء يعمل.",
      body: "حين يأتي التفكير التشغيلي إلى عالم الويب، يصبح التسلسل أوضح، والقرار أسرع، والتنفيذ أقل ضجيجًا وأكثر دقة.",
      values: ["قرار أسرع", "بنية أوضح", "ثقة أعلى", "تنفيذ يعتمد عليه"],
    },
    featuredWork: {
      eyebrow: "أعمال تتحدث عن نفسها",
      title: "كل مشروع هنا بدأ بمشكلة حقيقية وانتهى بصورة أقوى.",
      body: "لا أعرض لقطات جميلة فقط. أعرض كيف تحولت مواقع فعلية إلى أدوات تقنع، تقود، وتختصر التردد.",
    },
    media: {
      eyebrow: "يوتيوب",
      title: "المحتوى هنا ليس هامشًا. هو جزء من السلطة نفسها.",
      body: "حين تشرح منتجًا أمام جمهور عربي من ألمانيا، تتعلم بسرعة أن الثقة تبنى في التفاصيل الصغيرة قبل العناوين الكبيرة.",
    },
    insights: {
      eyebrow: "الرؤية",
      title: "ما الذي يجعل موقعًا واحدًا يربح الثقة وآخر يُنسى؟",
      body: "ثلاثة مبادئ أعود إليها في كل مشروع مهما تغير القطاع أو تغيرت الشاشة.",
      cards: [
        {
          title: "الوضوح قبل الزخرفة",
          body: "إذا احتاج الزائر إلى جهد طويل ليفهم ما الذي تقدمه، فالمشكلة في البناء لا في انتباهه.",
        },
        {
          title: "الانطباع الأول قرار تجاري",
          body: "الثانية الأولى ليست تجميلًا. هي اللحظة التي يقرر فيها العميل: هل أكمل أم أغادر؟",
        },
        {
          title: "الشرح يرفع قيمة المنتج",
          body: "أحيانًا لا يحتاج المشروع إلى خصائص أكثر. يحتاج فقط إلى عرض أذكى ورسالة أنظف.",
        },
      ],
    },
    liveLayer: {
      eyebrow: "طبقة داخلية",
      title: "غير معروضة للمستخدم النهائي",
      body: "تُترك هذه الطبقة للاستخدامات التقنية فقط.",
      weather: "الطقس",
      matches: "الرياضة",
      creator: "القناة",
      weatherEmpty: "غير مستخدم",
      matchesEmpty: "غير مستخدم",
      creatorBody: "غير مستخدم",
    },
    journey: {
      eyebrow: "السيرة",
      title: "تنفيذ حقيقي. ذوق بصري. عقل يعرف كيف يعمل تحت الضغط.",
      body: "هذا المسار ليس قائمة وظائف. إنه انتقال واضح من النظام اليومي إلى البناء الرقمي وصناعة الثقة.",
      steps: [
        {
          title: "Frontend Developer & Digital Creator",
          role: "Mohammad Alfarras Studio",
          period: "2021 – Present",
          location: "Bremen, Germany",
          body: "تطوير وبناء واجهات أمامية حديثة باستخدام تقنيات (<span dir=\"ltr\" className=\"inline-block px-1\">Next.js</span>, <span dir=\"ltr\" className=\"inline-block px-1\">React</span>, <span dir=\"ltr\" className=\"inline-block px-1\">Tailwind</span>). تصميم حضور رقمي مُقنع للشركات، بالإضافة إلى إدارة قناة يوتيوب تقنية تضم أكثر من 1.5 مليون مشاهدة تركز على المراجعات والشروحات التقنية.",
          highlights: ["Next.js & React", "UI/UX Design", "Content Creation", "1.5M+ Views"],
        },
        {
          title: "<span dir=\"ltr\" className=\"inline-block\">Rhenus Home Delivery GmbH</span>",
          role: "Dispositionsmitarbeiter",
          period: "2018 – 2021",
          location: "Germany",
          body: "العمل اليومي تحت الضغط وإدارة العمليات اللوجستية. استخدام نظام (<span dir=\"ltr\" className=\"inline-block px-1\">TMS</span>) لإدارة حركة النقل وتوجيه السائقين والتواصل مع خدمة العملاء لضمان التسليم السريع الخالي من الأخطاء.",
          highlights: ["Logistics", "TMS", "Kundendienst", "Fahrerbetreuung"],
        },
        {
          title: "IKEA",
          role: "Logistics Expert",
          period: "2015 – 2018",
          location: "Germany",
          body: "اكتساب خبرات واسعة في ترتيب وتسلسل بيئة العمل المعقدة، وتعلم كيف أن البساطة الظاهرة للمستخدمين تعتمد دائماً على تنظيم صارم ومدروس خلف الكواليس.",
          highlights: ["Operations", "Systematic Thinking", "Team Coordination"],
        },
      ],
    },
    cv: {
      eyebrow: "السيرة",
      title: "من الضغط اليومي إلى تجارب رقمية تتحمل الضغط أيضًا.",
      body: "أبني واجهات تبدو مبهرة، لكنها في الداخل مرتبة، واضحة، وسهلة التطوير. هذه ليست رفاهية بالنسبة لي، بل أسلوب عمل.",
      chips: ["واجهة أمامية", "تصميم", "صناعة محتوى", "ألمانيا"],
      pillarsTitle: "المهارات التي أستخدمها حين تكون النتيجة مهمة",
      pillarsBody: "ما تراه هنا ليس استعراض أدوات، بل طبقات عمل حقيقية تدخل في كل مشروع: من الرسالة إلى الحركة إلى الأداء.",
      creatorTitle: "خلف الكاميرا والكود",
      creatorBody: "صورة شخصية، مشهد تقني، وعناصر محتوى توضّح كيف تلتقي الهوية مع التنفيذ في عمل واحد.",
    },
    projects: {
      eyebrow: "أعمال مختارة",
      title: "كل مشروع هنا حلّ مشكلة حقيقية.",
      body: "لا أقبل مشاريع التجميل فقط. أقبل المشاريع التي تعرف ما تريد الوصول إليه وتحتاج تنفيذًا لا يخذلها.",
      featureTitle: "كيف أختار ما أعرضه",
      featureBody: "أعرض الأعمال التي تغيّر الانطباع الأول أو تختصر القرار أو ترفع الثقة بشكل ملموس.",
      collection: {
        title: "دراسات حالة",
        body: "كل حالة هنا تُقرأ بسرعة: ما التحدي، ما الحل، وما الذي تغيّر بعد إعادة البناء.",
      },
      conceptTitle: "من gallery إلى case study",
      conceptBody: "الزائر لا يحتاج صورًا أكثر. يحتاج سببًا مقنعًا ليصدق أن هذا العمل يمكنه أن يرفع مشروعه هو أيضًا.",
    },
    youtube: {
      eyebrow: "يوتيوب",
      title: "محتوى عربي حقيقي. من ألمانيا. بلا حشو.",
      body: "بدأت القناة من فيديو واحد لمنتج صغير. اليوم تقول الأرقام شيئًا واضحًا: الصدق في الشرح يبني ثقة لا تستطيع الإعلانات شراءها.",
      featuredLabel: "الفيديو المميز",
      latestLabel: "أحدث الفيديوهات",
      values: ["1.5M+ مشاهدة", "6.1K+ مشترك", "162 فيديو", "مراجعات صادقة"],
      collaborationTitle: "لماذا يتابعني جمهور عربي من ألمانيا؟",
      collaborationBody: "لأنني لا أبيع ضجيجًا. أشرح المنتج كما هو، وأحترم عقل المشاهد الذي يريد مراجعة حقيقية لا إعلانًا مموّهًا.",
      channelCta: "ادخل إلى القناة",
    },
    contact: {
      eyebrow: "تواصل مباشر",
      title: "إذا وصلت إلى هنا فأنت غالبًا جاد. وهذا ممتاز.",
      body: "أرسل الفكرة كما هي، حتى لو كانت ناقصة. دوري ليس أن أطلب منك صياغة كاملة، بل أن أعيدها إليك بشكل أوضح وخطوة أقرب للتنفيذ.",
      chips: ["موقع جديد", "صفحة هبوط", "تعاون محتوى", "إعادة تصميم", "استشارة"],
      reasons: [
        {
          title: "موقع يحتاج انطباعًا أقوى",
          body: "حين تشعر أن الخدمة جيدة لكن شكل العرض لا يعكسها، فهذه نقطة البداية المناسبة.",
        },
        {
          title: "إعادة ترتيب الرسالة",
          body: "أحيانًا المشكلة ليست في المنتج نفسه، بل في الطريقة التي يُعرض بها ويُفهم بها.",
        },
        {
          title: "تعاون محتوى تقني",
          body: "إذا كان لديك منتج يحتاج صوتًا عربيًا صادقًا ومقنعًا، فهذا جزء من عملي أيضًا.",
        },
      ],
      directTitle: "بدون وسيط",
      directBody: "ابدأ برسالة واضحة أو حتى نصف واضحة. سأعيدها إليك بخطوة مباشرة خلال 24 ساعة.",
      primaryCta: "ابدأ التواصل",
    },
    privacy: {
      eyebrow: "الخصوصية",
      title: "الوضوح هنا أيضًا جزء من التجربة.",
      body: "لا حاجة لنصوص معقدة حتى أقول شيئًا بسيطًا: أحترم الرسائل التي ترسلها، وأستخدم الحد الأدنى فقط لتشغيل التجربة الأساسية.",
      items: [
        "لا يتم بيع بياناتك أو مشاركتها تجاريًا.",
        "تُستخدم ملفات تعريف الارتباط الأساسية فقط لتذكر اللغة وبعض التفضيلات الضرورية.",
        "أي رسالة ترسلها عبر نموذج التواصل تُخزن فقط لغرض المتابعة والرد.",
        "يمكنك التواصل مباشرة إذا أردت اختصار الطريق وعدم استخدام النموذج.",
      ],
    },
    footer: {
      title: "هل لديك فكرة تستحق أن تُبنى بشكل مختلف؟",
      body: "إذا كنت تبحث عن حضور رقمي أقوى، أو إعادة ترتيب حقيقية للرسالة، أو تعاون تقني يحترم عقل الجمهور، فلنبدأ من هنا.",
      location: "ألمانيا",
    },
    common: {
      startProject: "ابدأ مشروعك",
      viewProjects: "شاهد الأعمال",
      allProjects: "كل الأعمال",
      visitProject: "زيارة المشروع",
      openChannel: "ادخل إلى القناة",
      collaborate: "لنتحدث",
      now: "الآن",
      views: "المشاهدات",
      subscribers: "المشتركون",
      videos: "الفيديوهات",
      response: "الرد",
      basedInGermany: "مقيم في ألمانيا",
    },
  },
  en: {
    brandName: "Mohammad Alfarras",
    navTagline: "Bold web · sharper design · trusted content",
    nav: {
      home: "Home",
      cv: "About",
      blog: "Insights",
      projects: "Work",
      youtube: "YouTube",
      contact: "Contact",
      privacy: "Privacy",
    },
    seo: {
      home: {
        title: "Mohammad Alfarras | Bold web, design, and Arabic tech content from Germany",
        description: "From Al-Hasakah to Germany, Mohammad Alfarras combines logistics discipline, visual sharpness, and honest tech content into a personal brand that earns trust fast.",
        ogTitle: "Mohammad Alfarras | A digital presence that gets remembered",
        ogDescription: "Bold web execution, confident design, and Arabic tech content shaped by real operational discipline.",
        image: "/images/brand-spotlight-2026.jpeg",
      },
      cv: {
        title: "About | Mohammad Alfarras",
        description: "A professional journey shaped by logistics operations, frontend execution, design taste, and creator trust.",
        ogTitle: "About | Real execution with visual discipline",
        ogDescription: "When operational pressure meets digital craft, the result is work that looks strong and holds under pressure.",
        image: "/images/portrait.jpg",
      },
      blog: {
        title: "Insights | Mohammad Alfarras",
        description: "Short principles on clarity, trust, first impressions, and why some digital experiences convert while others disappear.",
        ogTitle: "Insights | Why some experiences work",
        ogDescription: "Practical thinking from real projects, not decorative design commentary.",
        image: "/images/dev_abstract_bg_1775984833791.png",
      },
      projects: {
        title: "Work | Mohammad Alfarras",
        description: "Selected case studies showing how websites become clearer, more persuasive, and more conversion-focused.",
        ogTitle: "Work | Every project here solved a real problem",
        ogDescription: "Challenge, solution, result — presented as decision-making tools, not decorative galleries.",
        image: "/images/seel-home-case.png",
      },
      youtube: {
        title: "YouTube | Mohammad Alfarras",
        description: "Arabic tech content from Germany built on honesty, clarity, and product storytelling that earns trust.",
        ogTitle: "YouTube | Arabic tech content without the filler",
        ogDescription: "More than 1.5M views built on clear explanation, not paid hype.",
        image: "/images/yt-channel-hero.png",
      },
      contact: {
        title: "Contact | Mohammad Alfarras",
        description: "For serious web builds, redesigns, and tech content collaborations. Send the idea as it is and get a clear next step back.",
        ogTitle: "Contact | Direct conversation, no middle layer",
        ogDescription: "A serious project deserves a serious response. Start here.",
        image: "/images/logo-unboxing.png",
      },
      privacy: {
        title: "Privacy | Mohammad Alfarras",
        description: "A short and clear privacy policy covering essential cookies, messages, and basic data handling.",
        ogTitle: "Privacy | Clear and minimal",
        ogDescription: "Your information is not sold or repurposed beyond what is needed for direct communication.",
        image: "/images/logo.png",
      },
    },
    hero: {
      eyebrow: "Available for selected projects",
      title: "Design that stops the scroll. Code that holds. Presence that moves the client.",
      body: "I am Mohammad Alfarras — a web developer, designer, and Arabic tech creator in Germany. I bring together operational discipline, visual sharpness, and honest communication to build work that feels impossible to ignore.",
      primary: "Start your standout project",
      secondary: "See the work",
      proofTitle: "2026 web presence · glass depth · motion with intent",
      proofBody: "The goal is not to look expensive for a second. The goal is to feel credible before the visitor reads the second line.",
    },
    identity: {
      eyebrow: "About me",
      title: "From logistics pressure to digital experiences that hold under pressure.",
      body: "I did not start as a designer isolated from real-world stress. Daily operations taught me the value of sequence, timing, and reliability. Design gave that discipline a voice.",
      cards: [
        {
          title: "From Al-Hasakah to Germany",
          body: "The journey did more than change geography. It sharpened the way I think about delivery, consistency, and what professional trust actually feels like.",
        },
        {
          title: "Operations taught me how not to build fragile beauty",
          body: "In logistics, every delay has a cost. That is why I build interfaces that look strong but also stay structured when projects evolve.",
        },
        {
          title: "The camera added what code alone cannot",
          body: "More than 1.5M views came from saying the truth clearly. That changed how I write copy, frame products, and build trust online.",
        },
      ],
    },
    services: {
      eyebrow: "How I make you sharper",
      title: "Bold web. Clear story. Delivery that does not wobble.",
      body: "I work on projects that need more than a prettier interface. They need stronger trust, clearer value, and a direction people can act on quickly.",
    },
    logistics: {
      eyebrow: "Method",
      title: "Discipline is not an extra layer. It is what makes the whole thing work.",
      body: "When operational thinking enters the web process, the result is sharper sequence, better decisions, and quieter execution.",
      values: ["Faster decisions", "Cleaner hierarchy", "Higher trust", "Reliable delivery"],
    },
    featuredWork: {
      eyebrow: "Selected work",
      title: "Every project here started with a real problem and ended with a stronger first impression.",
      body: "This is not a decorative gallery. These are case studies where clarity, trust, and conversion had to improve at the same time.",
    },
    media: {
      eyebrow: "YouTube",
      title: "Content is not a side layer here. It is part of the authority itself.",
      body: "When you explain products to an Arabic audience from Germany, you learn quickly that trust is built in detail, not in volume.",
    },
    insights: {
      eyebrow: "Insights",
      title: "Why do some websites earn trust while others get ignored?",
      body: "Three principles I return to in every project, regardless of industry, audience, or budget.",
      cards: [
        {
          title: "Clarity before decoration",
          body: "If the visitor has to work too hard to understand the offer, the problem is structural before it is visual.",
        },
        {
          title: "First impression is a business decision",
          body: "The opening second is not cosmetic. It is where the visitor decides whether to stay, trust, or leave.",
        },
        {
          title: "Explanation lifts value",
          body: "Sometimes the product does not need more features. It needs a better message and a stronger frame.",
        },
      ],
    },
    liveLayer: {
      eyebrow: "Internal layer",
      title: "Not displayed publicly",
      body: "Kept for technical use only.",
      weather: "Weather",
      matches: "Sports",
      creator: "Channel",
      weatherEmpty: "Unused",
      matchesEmpty: "Unused",
      creatorBody: "Unused",
    },
    journey: {
      eyebrow: "Professional journey",
      title: "Real execution. Design taste. A mind trained by pressure.",
      body: "Not a résumé made of bullet points. A clear path from systems and operations into digital work and audience trust.",
      steps: [
        {
          title: "Frontend Developer & Digital Creator",
          role: "Mohammad Alfarras Studio",
          period: "2021 – Present",
          location: "Bremen, Germany",
          body: "Developing modern front-end interfaces using Next.js, React, and Tailwind. Building persuasive digital presence for corporate clients while running a tech YouTube channel with over 1.5 million views focusing on reviews and technical advice.",
          highlights: ["Next.js & React", "UI/UX Design", "Content Creation", "1.5M+ Views"],
        },
        {
          title: "Rhenus Home Delivery GmbH",
          role: "Dispositionsmitarbeiter",
          period: "2018 – 2021",
          location: "Germany",
          body: "Daily operations management under pressure. Using Transport Management Systems (TMS) to coordinate driver routes, troubleshoot delivery issues, and optimize customer service workflows.",
          highlights: ["Logistics", "TMS", "Kundendienst", "Fahrerbetreuung"],
        },
        {
          title: "IKEA",
          role: "Logistics Expert",
          period: "2015 – 2018",
          location: "Germany",
          body: "Gained foundational experience in structural organization. Learned firsthand that apparent simplicity for the end-user always requires rigorous, methodical systems behind the scenes.",
          highlights: ["Operations", "Systematic Thinking", "Team Coordination"],
        },
      ],
    },
    cv: {
      eyebrow: "About",
      title: "Built by pressure, sharpened by design, proven through communication.",
      body: "I build websites that look strong on the surface and stay structured under real change. That is not a style choice. It is how I work.",
      chips: ["Frontend", "Design", "Content", "Germany"],
      pillarsTitle: "The skill stack I rely on when the outcome matters",
      pillarsBody: "Not a tool list for decoration. A working stack used across launches, redesigns, and creator-led product communication.",
      creatorTitle: "Behind the camera and the code",
      creatorBody: "Portrait, tech setup, creator energy, and presentation layers that show how visual identity and execution live together.",
    },
    projects: {
      eyebrow: "Selected work",
      title: "Every project here solved a real business problem.",
      body: "I do not take on visual polishing alone. I work on projects that know where they want to go and need execution that can actually get them there.",
      featureTitle: "Why these case studies",
      featureBody: "They represent the kind of work that changes perception, reduces hesitation, and moves people toward action.",
      collection: {
        title: "Case studies",
        body: "Each one is structured for fast reading: challenge, solution, result.",
      },
      conceptTitle: "From gallery to proof",
      conceptBody: "The visitor does not need more images. They need evidence that the same thinking can improve their project too.",
    },
    youtube: {
      eyebrow: "YouTube",
      title: "Real Arabic tech content. From Germany. Without the padding.",
      body: "The channel started with one small product and one honest explanation. The response proved something simple: trust compounds when the explanation stays clean.",
      featuredLabel: "Featured video",
      latestLabel: "Latest videos",
      values: ["1.5M+ views", "6.1K+ subscribers", "162 videos", "Honest reviews"],
      collaborationTitle: "Why follow an Arab creator from Germany?",
      collaborationBody: "Because the goal is not noise. It is clarity. I explain products for an Arabic audience that wants real perspective, not disguised advertising.",
      channelCta: "Open the channel",
    },
    contact: {
      eyebrow: "Direct contact",
      title: "If you reached this page, you are probably serious. Good.",
      body: "Send the idea as it is — even if it is incomplete. My job is not to wait for a perfect brief. My job is to turn it into a clearer next step.",
      chips: ["New website", "Landing page", "Content collaboration", "Redesign", "Consultation"],
      reasons: [
        {
          title: "The site feels weaker than the actual business",
          body: "That is usually where the best redesign work begins.",
        },
        {
          title: "The message exists, but it is not landing",
          body: "Sometimes the offer is strong. The framing is what needs to be rebuilt.",
        },
        {
          title: "You need an honest Arabic tech voice",
          body: "If the product deserves a trusted explanation, this is part of the work too.",
        },
      ],
      directTitle: "No middle layer",
      directBody: "Start with a clear message or even half a message. I will return with a direct step within 24 hours.",
      primaryCta: "Start the conversation",
    },
    privacy: {
      eyebrow: "Privacy",
      title: "Clarity belongs here too.",
      body: "No unnecessarily heavy language. Just the essentials: I respect what you send, and I use only what is needed to keep direct communication working.",
      items: [
        "Your data is not sold or repurposed commercially.",
        "Only essential cookies are used to remember language and basic preferences.",
        "Messages sent through the contact form are stored only for follow-up and reply.",
        "You can always reach out directly if you prefer not to use the form.",
      ],
    },
    footer: {
      title: "Have an idea that deserves to be built differently?",
      body: "If you need stronger digital presence, a clearer message, or a serious technical collaboration, this is where it starts.",
      location: "Germany",
    },
    common: {
      startProject: "Start your project",
      viewProjects: "See the work",
      allProjects: "All projects",
      visitProject: "Visit project",
      openChannel: "Open the channel",
      collaborate: "Let’s talk",
      now: "Now",
      views: "Views",
      subscribers: "Subscribers",
      videos: "Videos",
      response: "Response",
      basedInGermany: "Based in Germany",
    },
  },
};
