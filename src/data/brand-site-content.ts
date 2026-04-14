import type { Locale } from "@/types/cms";

type SeoEntry = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

type ProjectNarrative = {
  name: string;
  summary: string;
  challenge: string;
  approach: string;
  outcome: string;
  cta: string;
  note?: string;
};

type BrandPageContent = {
  navTagline: string;
  footerSummary: string;
  footerLocation: string;
  seo: Record<"home" | "cv" | "blog" | "youtube" | "contact", SeoEntry>;
  home: {
    heroLabel: string;
    heroHeadline: string;
    heroBody: string;
    heroPrimary: string;
    heroSecondary: string;
    proof: { value: string; label: string; number?: number; suffix?: string }[];
    introLabel: string;
    introTitle: string;
    introBody: string[];
    introHighlights: string[];
    pillarsLabel: string;
    pillarsTitle: string;
    pillarsBody: string;
    pillars: { title: string; text: string }[];
    workLabel: string;
    workTitle: string;
    workBody: string;
    youtubeLabel: string;
    youtubeTitle: string;
    youtubeBody: string;
    whyLabel: string;
    whyTitle: string;
    whyBody: string;
    whyPoints: string[];
    ctaLabel: string;
    ctaTitle: string;
    ctaBody: string;
  };
  cv: {
    heroLabel: string;
    title: string;
    body: string;
    markers: { label: string; value: string }[];
    storyLabel: string;
    storyTitle: string;
    storyBody: string[];
    timelineLabel: string;
    timelineTitle: string;
    timelineBody: string;
    stackLabel: string;
    stackTitle: string;
    stackBody: string;
    stackGroups: { title: string; items: string[] }[];
    creatorLabel: string;
    creatorTitle: string;
    creatorBody: string;
    creatorPoints: string[];
    ctaTitle: string;
    ctaBody: string;
  };
  work: {
    heroLabel: string;
    title: string;
    body: string;
    intro: string;
    principlesLabel: string;
    principlesTitle: string;
    principles: { title: string; text: string }[];
    ctaTitle: string;
    ctaBody: string;
  };
  youtube: {
    heroLabel: string;
    title: string;
    body: string;
    intro: string;
    credibilityLabel: string;
    credibilityTitle: string;
    credibilityBody: string;
    credibilityPoints: string[];
    collections: { latest: string; featured: string; top: string };
    collabTitle: string;
    collabBody: string;
    collabCta: string;
  };
  contact: {
    heroLabel: string;
    title: string;
    body: string;
    reasonsLabel: string;
    reasonsTitle: string;
    reasons: { title: string; text: string }[];
    directLabel: string;
    directTitle: string;
    directBody: string;
    directTypes: string[];
  };
  projects: Record<"wp-seel" | "wp-schnell" | "wp-moplayer", ProjectNarrative>;
};

export const brandSiteContent: Record<Locale, BrandPageContent> = {
  en: {
    navTagline: "Personal website, digital presence, and product storytelling",
    footerSummary: "MOALFARRAS · Digital Studio from Germany · Presence with weight",
    footerLocation: "Based in Germany",
    seo: {
      home: {
        title: "Mohammad Alfarras | Web Designer, Developer & Tech Content Creator from Germany",
        description:
          "A digital studio combining web design, digital experience building, and Arabic tech content creation. Operating from Germany with real operational background.",
        ogTitle: "Mohammad Alfarras | Web Designer, Developer & Tech Content Creator from Germany",
        ogDescription:
          "A digital studio combining web design, digital experience building, and Arabic tech content creation. Operating from Germany with real operational background.",
      },
      cv: {
        title: "CV | Mohammad Alfarras — Designer, Developer & Content Creator",
        description:
          "Professional story of Mohammad Alfarras across logistics operations in Germany, web experiences, product presentation, and Arabic tech content.",
        ogTitle: "CV | Mohammad Alfarras — Designer, Developer & Content Creator",
        ogDescription:
          "Operational discipline, web craftsmanship, and creator credibility presented as one professional story.",
      },
      blog: {
        title: "Portfolio | Mohammad Alfarras — Web Projects & Digital Experiences",
        description:
          "Curated case studies by Mohammad Alfarras showing how clearer structure, better presentation, and stronger messaging build faster trust.",
        ogTitle: "Portfolio | Mohammad Alfarras — Web Projects & Digital Experiences",
        ogDescription:
          "SEEL Transport, Schnell Sicher Umzug, and MoPlayer presented as serious digital case studies.",
      },
      youtube: {
        title: "YouTube | Mohammad Alfarras — Arabic Tech Reviews Channel",
        description:
          "YouTube and creator work by Mohammad Alfarras — 1.5M+ views, product communication, and content that builds trust before the decision.",
        ogTitle: "YouTube | Mohammad Alfarras — Arabic Tech Reviews Channel",
        ogDescription:
          "Arabic tech content, product storytelling, and creator credibility integrated into one personal brand.",
      },
      contact: {
        title: "Contact | Mohammad Alfarras — Start Your Project",
        description:
          "Start a website, landing page, redesign, or creator collaboration with Mohammad Alfarras through direct, clear contact channels.",
        ogTitle: "Contact | Mohammad Alfarras — Start Your Project",
        ogDescription:
          "Reach out for website projects, premium repositioning, product storytelling, and serious digital collaborations.",
      },
    },
    home: {
      heroLabel: "MOALFARRAS",
      heroHeadline: "Design that seduces. Message that converts. Results that last.",
      heroBody:
        "Building digital experiences from Germany to the Arab world — where visual taste meets execution discipline.",
      heroPrimary: "Start your project — 24h response",
      heroSecondary: "See how I work",
      proof: [
        { value: "1,500,000+", label: "YouTube views", number: 1500000, suffix: "+" },
        { value: "6,100+", label: "Subscribers", number: 6100, suffix: "+" },
        { value: "162", label: "Published videos", number: 162 },
        { value: "3+", label: "Projects", number: 3, suffix: "+" },
        { value: "24h", label: "Response time", number: 24, suffix: "h" },
      ],
      introLabel: "Who I Am",
      introTitle: "A digital builder shaped by design, content, and operational pressure.",
      introBody: [
        "I’m Mohammad Alfarras. I work across digital design, web experiences, and tech content — but what shapes my work most is how I think about clarity, structure, and real execution.",
        "My background in logistics and operations in Germany taught me to value reliability, speed, and calm decision-making under pressure. That mindset shows up in every page I build.",
      ],
      introHighlights: [
        "Visual quality without empty styling",
        "Message structure that explains value fast",
        "Execution discipline shaped outside the design bubble",
      ],
      pillarsLabel: "What I Do",
      pillarsTitle: "Three pillars behind every serious digital presence.",
      pillarsBody:
        "The work is not split into random services. It is one system: how the site looks, how the message lands, and how reliably it gets built.",
      pillars: [
        {
          title: "Websites that explain value fast",
          text: "Pages built to reduce hesitation, sharpen the first impression, and make the offer easy to understand in seconds.",
        },
        {
          title: "Content that builds trust before the decision",
          text: "Product-facing communication shaped by real audience feedback, not abstract copywriting theory.",
        },
        {
          title: "Execution that holds under pressure",
          text: "A practical way of working shaped by logistics, deadlines, and the need to stay clear when things get busy.",
        },
      ],
      workLabel: "Selected Work",
      workTitle: "Projects presented as proof, not decoration.",
      workBody:
        "These projects are not just visual showcase pieces. They are examples of how better presentation, clearer structure, and stronger messaging can lead to faster trust. MoPlayer is moving to a dedicated Projects page as a coming-soon release.",
      youtubeLabel: "Content / YouTube",
      youtubeTitle: "The creator side is part of the same craft.",
      youtubeBody:
        "I do not only build digital experiences. I also explain products to real audiences. That work sharpened how I think about trust, clarity, presentation, and decision-making.",
      whyLabel: "Why Work With Me",
      whyTitle: "Modern is easy. Clear, credible, and ready for real use is harder.",
      whyBody:
        "Anyone can make something look modern. Far fewer can make it feel clear, trustworthy, structured, and ready for real use. That is the standard I build for.",
      whyPoints: [
        "I think about message before decoration.",
        "I care about the commercial trust of the page, not only the style.",
        "I bring real-world discipline into digital execution.",
      ],
      ctaLabel: "Contact",
      ctaTitle: "Your idea deserves a stronger digital presence.",
      ctaBody: "Let’s start with clarity, then build it properly.",
    },
    cv: {
      heroLabel: "About / CV",
      title: "A professional story built across logistics, design, code, and creator work.",
      body:
        "This is not a plain resume. It is the path that shaped how I work today: clear structure, reliable execution, and digital output that feels thought through from the first screen.",
      markers: [
        { label: "Current base", value: "Germany" },
        { label: "Role mix", value: "Design, build, content" },
        { label: "Core mindset", value: "Clarity under pressure" },
      ],
      storyLabel: "Professional Story",
      storyTitle: "The difference comes from the mix, not from one title.",
      storyBody: [
        "My work lives between digital design, web development, and Arabic tech communication. What makes that combination useful is that it is supported by a real operational background.",
        "Working in logistics environments such as Rhenus and IKEA taught me that structure matters, deadlines matter, and reliability matters. That is why I do not treat websites as decoration. I treat them as systems that need to perform.",
      ],
      timelineLabel: "Timeline",
      timelineTitle: "From operations to digital presence.",
      timelineBody:
        "Each stage added something practical: process discipline, customer-awareness, and then the ability to turn those lessons into stronger websites and content.",
      stackLabel: "Capabilities",
      stackTitle: "Design taste backed by modern tooling.",
      stackBody:
        "The stack matters, but only when it supports clarity. I use modern tools to build fast, maintainable experiences with strong visual control.",
      stackGroups: [
        { title: "Build", items: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
        { title: "Design", items: ["Figma", "Interface systems", "Landing page structure", "Content hierarchy"] },
        { title: "Creator", items: ["Arabic tech reviews", "Product presentation", "Video storytelling", "Audience trust"] },
      ],
      creatorLabel: "Creator Credibility",
      creatorTitle: "The channel is evidence, not a side note.",
      creatorBody:
        "Publishing consistently to a real audience improved how I judge clarity, titles, structure, and what actually earns attention and trust.",
      creatorPoints: [
        "1.5M+ total views from Arabic-speaking audiences",
        "162 published videos with consistent presentation",
        "Product communication shaped by real feedback, not guesswork",
      ],
      ctaTitle: "If you need the blend of structure and taste, let’s talk.",
      ctaBody: "Available for websites, landing pages, redesigns, and product-facing collaborations.",
    },
    work: {
      heroLabel: "Selected Work",
      title: "Serious projects presented with control, clarity, and context.",
      body:
        "This page focuses on a small set of stronger projects. Less filler, more proof. Each case shows what existed, what changed, and why the result feels more credible.",
      intro:
        "These projects are not just visual showcases. They are examples of how clearer digital presentation can shorten hesitation and build stronger first impressions.",
      principlesLabel: "How I Present Work",
      principlesTitle: "The point is not to show screens. The point is to show judgment.",
      principles: [
        {
          title: "Problem first",
          text: "Every case starts with what the project needed: trust, clarity, better flow, or a stronger offer presentation.",
        },
        {
          title: "Design with purpose",
          text: "The visuals are there to support message, hierarchy, and next-step confidence.",
        },
        {
          title: "Honest outcomes",
          text: "When hard numbers are not available, the impact is described qualitatively and truthfully.",
        },
      ],
      ctaTitle: "Need a site that feels more serious from the first second?",
      ctaBody: "I can help shape the message, structure, and visual presence into one clearer system.",
    },
    youtube: {
      heroLabel: "YouTube / Content",
      title: "Arabic tech content that explains the product, sharpens the presentation, and earns trust.",
      body:
        "This channel is not a side activity. It is where product explanation, visual timing, and audience trust get tested in public through real videos and real reactions.",
      intro:
        "I do not only build digital experiences. I also explain products to real audiences in Arabic, from Germany, with a clearer sense of what deserves attention and what helps people decide.",
      credibilityLabel: "Why It Matters",
      credibilityTitle: "The channel sharpened the website work too.",
      credibilityBody:
        "A strong video forces the same questions as a strong website: what should appear first, what builds trust fast, and what keeps the viewer from leaving too early.",
      credibilityPoints: [
        "Real Arabic audience reach with measurable traction",
        "Repeated product explanation under short attention windows",
        "Better instinct for sequencing, framing, and credibility under pressure",
      ],
      collections: {
        latest: "Recent videos",
        featured: "Spotlight video",
        top: "Strongest performers",
      },
      collabTitle: "Relevant for brand collaborations too.",
      collabBody:
        "If your product needs a clearer Arabic presentation or a more trusted creator angle, this side of my work becomes directly useful.",
      collabCta: "Discuss collaboration",
    },
    contact: {
      heroLabel: "Contact",
      title: "Direct, clear, and built for serious conversations.",
      body:
        "If you need a website, landing page, redesign, product-facing collaboration, or a stronger personal presence, send the idea clearly and I will reply with a practical next step.",
      reasonsLabel: "What You Can Reach Out For",
      reasonsTitle: "Best fit for work that needs both clarity and execution.",
      reasons: [
        { title: "Website project", text: "A new website that needs stronger presence, structure, and trust from the first screen." },
        { title: "Landing page or redesign", text: "A focused page or repositioning effort that needs sharper hierarchy and more premium presentation." },
        { title: "Tech product collaboration", text: "Product launches, reviews, or communication work aimed at clearer audience understanding." },
      ],
      directLabel: "Direct Channels",
      directTitle: "Choose the contact path that fits the situation.",
      directBody:
        "WhatsApp is best for speed. Email is best for formal project context. The rest is there if you want to see more of the work before reaching out.",
      directTypes: ["Website project", "Landing page", "Redesign / premium repositioning", "Tech product collaboration", "Personal brand presence"],
    },
    projects: {
      "wp-seel": {
        name: "SEEL Transport",
        summary: "A logistics and services website rebuilt to feel clearer, stronger, and faster to trust.",
        challenge:
          "The business needed a more serious first impression and a clearer service story so visitors would understand the offer without friction.",
        approach:
          "I tightened the hierarchy, clarified the messaging, and shaped the visual presentation around structure instead of noise.",
        outcome:
          "The result feels more dependable and more commercially ready — less like a generic service site, more like a real company with control.",
        cta: "Visit live site",
      },
      "wp-schnell": {
        name: "Schnell Sicher Umzug",
        summary: "A relocation website focused on speed of understanding, cleaner booking intent, and stronger visual control.",
        challenge:
          "The service had to communicate quickly. Visitors needed to understand what was offered and what to do next almost immediately.",
        approach:
          "I reworked section order, tightened the offer framing, and made the conversion path easier to scan on both desktop and mobile.",
        outcome:
          "The page now feels more organized, more modern, and more capable of turning interest into contact.",
        cta: "Visit live site",
      },
      "wp-moplayer": {
        name: "MoPlayer",
        summary: "A digital product direction where identity, interface, and narrative had to feel like one coherent system.",
        challenge:
          "This was less about selling a service and more about proving a product can feel intentional from branding to interface.",
        approach:
          "I aligned the visual language, product framing, and case-study presentation so the idea reads like a serious digital product, not an improvised concept.",
        outcome:
          "It became a reference piece for how I think about product surfaces, coherence, and presentation quality.",
        cta: "Case available on request",
        note: "Private / directional product case",
      },
    },
  },
  ar: {
    navTagline: "موقع شخصي، حضور رقمي، وسرد تقني أكثر وضوحًا",
    footerSummary: "MOALFARRAS · استوديو رقمي من ألمانيا · حضور له ثقل",
    footerLocation: "أعمل من ألمانيا",
    seo: {
      home: {
        title: "محمد الفراس | مصمم مواقع ومطور وصانع محتوى تقني من ألمانيا",
        description:
          "استوديو رقمي يجمع تصميم المواقع، بناء التجارب الرقمية، وصناعة المحتوى التقني العربي. أعمل من ألمانيا مع خلفية تشغيلية حقيقية.",
        ogTitle: "محمد الفراس | مصمم مواقع ومطور وصانع محتوى تقني من ألمانيا",
        ogDescription:
          "استوديو رقمي يجمع تصميم المواقع، بناء التجارب الرقمية، وصناعة المحتوى التقني العربي. أعمل من ألمانيا مع خلفية تشغيلية حقيقية.",
      },
      cv: {
        title: "السيرة الذاتية | محمد الفراس — مصمم ومطور وصانع محتوى",
        description:
          "القصة المهنية لمحمد الفراس بين التشغيل واللوجستيك في ألمانيا، بناء المواقع، تقديم المنتجات، وصناعة المحتوى التقني العربي.",
        ogTitle: "نبذة / السيرة المهنية | محمد الفراس",
        ogDescription:
          "انضباط تشغيلي، بناء رقمي، ومصداقية محتوى في قصة مهنية واحدة.",
      },
      blog: {
        title: "الأعمال | محمد الفراس — مشاريع مواقع وتجارب رقمية",
        description:
          "دراسات حالة مختارة لمحمد الفراس توضّح كيف يصنع العرض الأوضح والرسالة الأقوى ثقة أسرع وانطباعًا أكثر جدية.",
        ogTitle: "الأعمال المختارة | محمد الفراس",
        ogDescription:
          "SEEL Transport وSchnell Sicher Umzug وMoPlayer كأمثلة حقيقية على بناء حضور رقمي أقوى.",
      },
      youtube: {
        title: "يوتيوب | محمد الفراس — قناة مراجعات تقنية عربية",
        description:
          "صفحة المحتوى وصناعة الفيديو لدى محمد الفراس — أكثر من 1.5 مليون مشاهدة، فهم أوضح للمنتجات، ومحتوى يبني الثقة قبل القرار.",
        ogTitle: "يوتيوب / المحتوى | محمد الفراس",
        ogDescription:
          "محتوى تقني عربي، تقديم منتجات، ومصداقية صانع محتوى ضمن نفس الهوية الشخصية.",
      },
      contact: {
        title: "تواصل | محمد الفراس — ابدأ مشروعك",
        description:
          "ابدأ مشروع موقع، صفحة هبوط، إعادة تموضع، أو تعاون تقني مع محمد الفراس عبر قنوات تواصل واضحة ومباشرة.",
        ogTitle: "تواصل | محمد الفراس",
        ogDescription:
          "جاهز لمشاريع المواقع، إعادة التمركز البصري، التعاونات التقنية، وبناء حضور رقمي شخصي أقوى.",
      },
    },
    home: {
      heroLabel: "MOALFARRAS",
      heroHeadline: "شكل يسحر. رسالة تُقنع. نتيجة تُقاس.",
      heroBody:
        "أبني تجارب رقمية من ألمانيا للعالم العربي، حيث يلتقي الذوق البصري بانضباط التنفيذ.",
      heroPrimary: "ابدأ مشروعك الآن",
      heroSecondary: "شاهد كيف أعمل",
      proof: [
        { value: "1,500,000+", label: "مشاهدة يوتيوب", number: 1500000, suffix: "+" },
        { value: "6,100+", label: "مشترك", number: 6100, suffix: "+" },
        { value: "162", label: "فيديو منشور", number: 162 },
        { value: "3+", label: "مشاريع", number: 3, suffix: "+" },
        { value: "24h", label: "رد سريع", number: 24, suffix: "h" },
      ],
      introLabel: "من أنا",
      introTitle: "أبني حضورًا رقميًا بعين المصمم، وعقل المنفذ، وخبرة الضغط الحقيقي.",
      introBody: [
        "أنا محمد الفراس. أعمل بين التصميم، بناء التجارب الرقمية، والمحتوى التقني — لكن ما يصنع الفرق الحقيقي في عملي هو أنني أفكر في الوضوح، البنية، والتنفيذ الفعلي قبل أي شيء آخر.",
        "خلفيتي في التشغيل واللوجستيك في ألمانيا علّمتني أن الاعتمادية والسرعة والهدوء تحت الضغط ليست تفاصيل جانبية. لهذا لا أنظر للموقع كواجهة فقط، بل كنظام يجب أن يكون واضحًا وجاهزًا للاستخدام الحقيقي.",
      ],
      introHighlights: [
        "جودة بصرية بدون استعراض فارغ",
        "رسالة تشرح القيمة بسرعة",
        "انضباط في التنفيذ جاء من الواقع، لا من التنظير",
      ],
      pillarsLabel: "ما الذي أقدمه",
      pillarsTitle: "ثلاثة أعمدة وراء أي حضور رقمي جاد.",
      pillarsBody:
        "العمل هنا ليس خدمات متفرقة. هو نظام واحد: كيف يبدو الموقع، كيف تُفهم الرسالة، وكيف يُنفذ كل ذلك بثبات.",
      pillars: [
        {
          title: "مواقع تشرح القيمة بسرعة",
          text: "صفحات تقلل التردد، ترفع جودة الانطباع الأول، وتجعل الزائر يفهم العرض دون جهد.",
        },
        {
          title: "محتوى يبني الثقة قبل القرار",
          text: "تقديم للمنتجات والخدمات مبني على جمهور حقيقي وردود فعل حقيقية، لا على لغة تسويقية جوفاء.",
        },
        {
          title: "تنفيذ منضبط لا ينهار تحت الضغط",
          text: "طريقة عمل عملية تشكلت من اللوجستيك والمواعيد والتعامل مع الواقع عندما يصبح الوقت ضيقًا.",
        },
      ],
      workLabel: "أعمال مختارة",
      workTitle: "أعمال تُعرض كدليل واضح، لا كواجهة مزخرفة.",
      workBody:
        "هذه الأعمال ليست مجرد لقطات جميلة. هي أمثلة على كيف يمكن للعرض الأوضح، والبنية الأقوى، والرسالة الأدق أن تصنع ثقة أسرع. مشروع <span dir=\"ltr\" className=\"inline-block\">MoPlayer</span> سيتم نقله إلى صفحة مشاريع كتجربة قادمة.",
      youtubeLabel: "المحتوى / يوتيوب",
      youtubeTitle: "المحتوى هنا ليس جانبًا منفصلًا، بل جزء من نفس الحرفة.",
      youtubeBody:
        "أنا لا أبني التجارب الرقمية فقط. أنا أشرح المنتجات أيضًا لجمهور حقيقي. وهذا صقل طريقتي في فهم الثقة، العرض، والانتباه لما يجعل الناس تصدق وتكمل.",
      whyLabel: "لماذا العمل معي",
      whyTitle: "أن يبدو الشيء حديثًا أمر سهل. أن يكون واضحًا، مقنعًا، وجاهزًا للاستخدام الحقيقي أصعب بكثير.",
      whyBody:
        "أي شخص يستطيع أن يصنع شيئًا يبدو حديثًا. لكن القليل فقط يستطيع أن يجعله واضحًا، موثوقًا، منظمًا، وجاهزًا للاستخدام الحقيقي. هذا هو المعيار الذي أبني عليه.",
      whyPoints: [
        "أفكر في الرسالة قبل الزخرفة.",
        "أهتم بالثقة التجارية التي يصنعها الشكل، لا بالشكل وحده.",
        "أدخل الانضباط العملي إلى التنفيذ الرقمي.",
      ],
      ctaLabel: "تواصل",
      ctaTitle: "فكرتك تستحق حضورًا رقميًا أقوى.",
      ctaBody: "لنبدأ بخطة واضحة، ثم نبنيها بجودة تليق بها.",
    },
    cv: {
      heroLabel: "نبذة / السيرة المهنية",
      title: "قصة مهنية تشكلت بين اللوجستيك، التصميم، الكود، وصناعة المحتوى.",
      body:
        "هذه ليست سيرة ذاتية جامدة، بل قصة مهنية تشرح لماذا أعمل بهذه الطريقة اليوم: وضوح، ترتيب، وتنفيذ رقمي يفكر من أول شاشة حتى آخر تفصيل.",
      markers: [
        { label: "العمل الحالي", value: "ألمانيا" },
        { label: "طبيعة الدور", value: "تصميم، بناء، محتوى" },
        { label: "العقلية الأساسية", value: "وضوح تحت الضغط" },
      ],
      storyLabel: "القصة المهنية",
      storyTitle: "الفرق لا يأتي من مسمى واحد، بل من المزج بين أكثر من خبرة حقيقية.",
      storyBody: [
        "عملي يقف بين التصميم الرقمي، بناء المواقع، والتواصل التقني العربي. وما يجعل هذه التركيبة مفيدة فعلًا هو أنها مدعومة بخلفية تشغيلية حقيقية.",
        "العمل في بيئات مثل <span dir=\"ltr\" className=\"inline-block\">Rhenus</span> و<span dir=\"ltr\" className=\"inline-block\">IKEA</span> علّمني أن التنظيم مهم، والمواعيد مهمة، والاعتمادية مهمة. ولهذا لا أتعامل مع الموقع كعنصر جمالي فقط، بل كنظام يجب أن يؤدي وظيفته بوضوح.",
      ],
      timelineLabel: "الخط الزمني",
      timelineTitle: "من التشغيل إلى بناء الحضور الرقمي.",
      timelineBody:
        "كل مرحلة أضافت شيئًا عمليًا: انضباط العملية، فهم تجربة العميل، ثم القدرة على تحويل ذلك إلى مواقع ومحتوى أكثر إقناعًا.",
      stackLabel: "القدرات",
      stackTitle: "ذوق بصري مدعوم بأدوات حديثة وانضباط واضح.",
      stackBody:
        "الأدوات مهمة فقط عندما تخدم الوضوح. أستخدم تقنيات حديثة لبناء تجارب سريعة، قابلة للتطوير، وممسوكة بصريًا.",
      stackGroups: [
        { title: "البناء", items: ["<span dir=\"ltr\">Next.js</span>", "<span dir=\"ltr\">React</span>", "<span dir=\"ltr\">TypeScript</span>", "<span dir=\"ltr\">Tailwind CSS</span>"] },
        { title: "التصميم", items: ["<span dir=\"ltr\">Figma</span>", "أنظمة واجهات", "هيكلة صفحات الهبوط", "هرمية المحتوى"] },
        { title: "المحتوى", items: ["مراجعات تقنية عربية", "تقديم المنتجات", "سرد الفيديو", "بناء ثقة الجمهور"] },
      ],
      creatorLabel: "مصداقية صانع المحتوى",
      creatorTitle: "القناة ليست هامشًا، بل دليلًا حيًا على طريقة العمل.",
      creatorBody:
        "الاستمرار في النشر أمام جمهور حقيقي حسّن طريقتي في تقييم الوضوح، والعناوين، والبنية، وما الذي يجعل الناس تتوقف وتثق فعلًا.",
      creatorPoints: [
        "+1.5 مليون مشاهدة من جمهور عربي",
        "162 فيديو منشور بنبرة وإخراج متماسكين",
        "فهم للمنتج والرسالة مبني على تفاعل حقيقي لا تخمين",
      ],
      ctaTitle: "إذا كنت تبحث عن مزيج الوضوح والذوق والتنفيذ، فلنبدأ.",
      ctaBody: "متاح للمواقع، صفحات الهبوط، إعادة البناء، والتعاونات المتعلقة بالمنتجات.",
    },
    work: {
      heroLabel: "الأعمال المختارة",
      title: "مشاريع جادة تُعرض بثقة، وسياق واضح، وتحكم بصري محسوب.",
      body:
        "هذه الصفحة تركّز على عدد قليل من المشاريع الأقوى. صور أقل لكن قيمة أعلى. كل حالة توضّح ما الذي كان ناقصًا، ما الذي تغير، ولماذا أصبحت النتيجة أكثر مصداقية.",
      intro:
        "هذه المشاريع ليست مجرد عرض للشاشات، بل أمثلة على كيف يصنع العرض الأوضح رسالة أقوى وثقة أسرع وانطباعًا أكثر احترافًا.",
      principlesLabel: "كيف أعرض العمل",
      principlesTitle: "الهدف ليس عرض الصور، بل إظهار جودة الحكم والقرار.",
      principles: [
        {
          title: "المشكلة أولًا",
          text: "كل حالة تبدأ بما كان يحتاجه المشروع فعلًا: ثقة، وضوح، ترتيب أفضل، أو عرض أقوى للخدمة.",
        },
        {
          title: "تصميم له وظيفة",
          text: "الطبقة البصرية موجودة لتخدم الرسالة، والهرمية، وثقة الخطوة التالية.",
        },
        {
          title: "نتائج صادقة",
          text: "عندما لا تتوفر أرقام دقيقة، أوصف الأثر بشكل نوعي وصادق بدون مبالغة.",
        },
      ],
      ctaTitle: "تحتاج موقعًا يبدو أكثر جدية من أول ثانية؟",
      ctaBody: "أستطيع مساعدتك في جمع الرسالة، البنية، والحضور البصري في نظام أوضح.",
    },
    youtube: {
      heroLabel: "يوتيوب / المحتوى",
      title: "محتوى تقني عربي يشرح المنتج بوضوح ويبني الثقة.",
      body:
        "هذه القناة ليست نشاطًا جانبيًا. هي مساحة أختبر فيها شرح المنتج، ترتيب الصورة، وبناء الثقة أمام جمهور حقيقي يحكم بسرعة.",
      intro:
        "أنا لا أبني التجارب الرقمية فقط. أنا أشرح المنتجات أيضًا لجمهور عربي من ألمانيا، وهذا صقل فهمي للوضوح والثقة وطريقة اتخاذ القرار.",
      credibilityLabel: "لماذا يهم هذا",
      credibilityTitle: "القناة صقلت العمل الرقمي وجعلته أدق أيضًا.",
      credibilityBody:
        "الفيديو القوي يفرض نفس أسئلة الصفحة القوية: ما الذي يجب أن يظهر أولًا؟ ما الذي يخلق الثقة بسرعة؟ وما الذي يجعل المشاهد يكمل بدل أن يغادر؟",
      credibilityPoints: [
        "وصول عربي حقيقي بأرقام واضحة",
        "تكرار شرح المنتجات تحت وقت انتباه قصير",
        "حدس أقوى في التسلسل، والتقديم، وبناء المصداقية",
      ],
      collections: {
        latest: "أحدث الفيديوهات",
        featured: "فيديو بارز",
        top: "الأقوى أداءً",
      },
      collabTitle: "ولهذا يصبح هذا الجانب مفيدًا أيضًا في التعاونات مع العلامات.",
      collabBody:
        "إذا كان منتجك يحتاج عرضًا عربيًا أوضح أو زاوية صانع محتوى أكثر ثقة، فهذا الجانب من عملي يصبح ذا قيمة مباشرة.",
      collabCta: "ناقش تعاونًا",
    },
    contact: {
      heroLabel: "تواصل",
      title: "تواصل مباشر وواضح للمشاريع الجادة.",
      body:
        "إذا كنت تحتاج موقعًا، صفحة هبوط، إعادة بناء، تعاونًا متعلقًا بمنتج، أو حضورًا شخصيًا أقوى، أرسل الفكرة بوضوح وسأعود إليك بخطوة عملية مناسبة.",
      reasonsLabel: "متى يكون التواصل مناسبًا",
      reasonsTitle: "أفضل المشاريع هنا هي التي تحتاج وضوحًا قويًا وتنفيذًا منضبطًا معًا.",
      reasons: [
        { title: "مشروع موقع", text: "موقع جديد يحتاج حضورًا أقوى، ترتيبًا أفضل، وثقة أعلى من أول شاشة." },
        { title: "صفحة هبوط أو إعادة تصميم", text: "صفحة مركزة أو إعادة تموضع تحتاج هرمية أوضح وعرضًا أكثر رقيًا." },
        { title: "تعاون منتج تقني", text: "إطلاقات، مراجعات، أو أعمال تقديم للمنتجات تحتاج شرحًا أوضح للجمهور." },
      ],
      directLabel: "قنوات التواصل",
      directTitle: "اختر القناة الأنسب بحسب نوع المشروع أو مستوى التفاصيل.",
      directBody:
        "واتساب مناسب للسرعة. البريد مناسب للتفاصيل الرسمية. وبقية الروابط موجودة لمن يريد أن يرى مزيدًا من العمل قبل أن يتواصل.",
      directTypes: ["مشروع موقع", "صفحة هبوط", "إعادة تموضع بصري راقٍ", "تعاون منتج تقني", "بناء حضور شخصي أقوى"],
    },
    projects: {
      "wp-seel": {
        name: "<span dir=\"ltr\" className=\"inline-block\">SEEL Transport</span>",
        summary: "موقع خدمات لوجستية ونقل أُعيد بناؤه ليبدو أوضح، أقوى، وأسهل في كسب الثقة.",
        challenge:
          "كان المشروع يحتاج انطباعًا أول أكثر جدية وقصة خدمة أوضح حتى يفهم الزائر العرض بسرعة وبدون تردد.",
        approach:
          "قمت بتشديد الهرمية، وتوضيح الرسالة، وبناء العرض البصري حول التنظيم بدل الضجيج.",
        outcome:
          "النتيجة أصبحت أكثر اعتمادية وجاهزية تجارية — أقل شبهًا بموقع خدمات عام، وأكثر قربًا من شركة حقيقية تبدو ممسوكة ومنظمة.",
        cta: "زيارة الموقع",
      },
      "wp-schnell": {
        name: "<span dir=\"ltr\" className=\"inline-block\">Schnell Sicher Umzug</span>",
        summary: "موقع نقل يركز على سرعة الفهم، وضوح الحجز، وتحكم بصري أقوى.",
        challenge:
          "كان يجب أن تُفهم الخدمة بسرعة. الزائر يحتاج أن يعرف ما الذي يُعرض عليه وما الخطوة التالية تقريبًا من أول لحظة.",
        approach:
          "أعدت ترتيب الأقسام، وضيّقت صياغة العرض، وجعلت مسار التحويل أسهل في المسح على الكمبيوتر والموبايل.",
        outcome:
          "أصبح الموقع أكثر تنظيمًا وحداثة، وأكثر قدرة على تحويل الاهتمام إلى تواصل فعلي.",
        cta: "زيارة الموقع",
      },
      "wp-moplayer": {
        name: "<span dir=\"ltr\" className=\"inline-block\">MoPlayer</span>",
        summary: "اتجاه منتج رقمي كان يحتاج أن تبدو هويته وواجهته وسرده كنظام واحد متماسك.",
        challenge:
          "المطلوب هنا لم يكن بيع خدمة فقط، بل إثبات أن المنتج يمكن أن يبدو مقصودًا من الهوية حتى الواجهة.",
        approach:
          "وحّدت اللغة البصرية، وصياغة المنتج، وطريقة عرض الحالة حتى تُقرأ الفكرة كمنتج جاد لا كمجرد تصور مبعثر.",
        outcome:
          "أصبحت الحالة مرجعًا لطريقتي في التفكير في سطوح المنتجات، التماسك، وجودة العرض.",
        cta: "الحالة متاحة عند الطلب",
        note: "حالة خاصة / اتجاه منتج",
      },
    },
  },
};

export function getBrandSeo(locale: Locale, slug: string): SeoEntry | null {
  if (!["home", "cv", "blog", "youtube", "contact"].includes(slug)) return null;
  return brandSiteContent[locale].seo[slug as keyof BrandPageContent["seo"]];
}
