"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/types/cms";

const content = {
    ar: {
        eyebrow: "من الحسكة – عبر أوروبا إلى الشاشات",
        heroTitle: "محمد الفراس – سيرة ذاتية حيّة",
        heroSub: "من اللوجستيات اليومية إلى صناعة المحتوى التقني، هذه الصفحة تحكي قصتي كما هي.",
        heroIntro: "أعمل اليوم كـ Disponent في شركة Rhenus Home Delivery، أخطط رحلات التوصيل اليومية، أتابع السائقين، وأحل مشاكل الطريق والزبائن. وبنفس الوقت أصنع محتوى تقني صادق على يوتيوب: فتح صناديق، مراجعات منتجات، شروحات برامج، وتجارب منزل ذكي. أحب التنظيم، التفاصيل الصغيرة، والشفافية مع الناس – سواء في الشغل أو في المحتوى.",
        floatIcons: ["🎥", "⚡", "🧭", "🛠️"],
        timelineTitle: "رحلتي في العمل والحياة",
        timelineSub: "خط زمني واضح يربط اللوجستيات بالمحتوى والخدمات الرقمية.",
        timeline: [
            { period: "2022 – الآن", tag: "اليوم", title: "Disponent · Rhenus Home Delivery", sub: "تخطيط مسارات IKEA، دعم السائقين، وتحليل الأداء اليومي", points: ["توزيع 30-40 رحلة يومياً مع توازن بين الزمن والتكلفة", "مراقبة السائقين لحظياً وحل مشكلات الطريق والزبائن", "تقارير قصيرة باستخدام TMS لتهدئة العمليات"] },
            { period: "2019 – 2022", tag: "فِرق ومخازن", title: "منسق لوجستي · IKEA Deutschland", sub: "تنسيق نقل وتخزين الأثاث مع فريق متعدد الثقافات", points: ["تحسين جداول الشحن وتقليل زمن التسليم", "تدريب موظفين جدد على الأنظمة اللوجستية", "ضبط المخزون وتوثيق الطلبات اليومية"] },
            { period: "2017 – الآن", tag: "محتوى", title: "صانع محتوى تقني صادق", sub: "159+ فيديو بثلاث لغات عن الأجهزة، البرمجيات، وتجارب الاستخدام", points: ["مصغرات وغرافيكس بنَفَس زجاجي يحافظ على الهوية", "اختبارات واقعية للأجهزة قبل أي مراجعة", "بناء مجتمع يهتم بالوضوح أكثر من الضجة"] },
            { period: "2018 – الآن", tag: "خدمات", title: "خدمات رقمية للشركات الصغيرة", sub: "مواقع بسيطة، تنظيم بريد ومهام، وتحسين تدفق العمل", points: ["تصميم مواقع ثابتة وصفحات هبوط بواجهات صافية", "إعداد قوالب بريد وتنظيم عمليات الطلبات", "نصائح سريعة لتحويل الفوضى إلى خطوات واضحة"] },
        ],
        skillsTitle: "مهاراتي وأدواتي",
        skills: [
            { title: "تخطيط رحلات وتوزيع الطلبات", level: 90, badge: "مستوى متقدّم", highlight: true },
            { title: "إدارة سائقين وتواصل مع العملاء", level: 88, badge: "مستوى متقدّم", highlight: true },
            { title: "تحليل بيانات بسيطة وتقارير", level: 75, badge: "مستوى جيّد", highlight: false },
            { title: "صناعة محتوى فيديو ومونتاج بسيط", level: 85, badge: "مستوى متقدّم", highlight: true },
            { title: "تصميم مواقع بسيطة على الويب", level: 70, badge: "مستوى جيّد", highlight: false },
            { title: "تنظيم عمل الشركات الصغيرة", level: 92, badge: "مستوى متقدّم", highlight: true },
        ],
        toolsTitle: "الأدوات والتقنيات",
        toolsHead: "شريط البرامج اليومية",
        toolsSub: "البرامج التي أستخدمها فعلياً في اللوجستيات، المحتوى، والمواقع.",
        toolsPrimary: ["TMS · تتبع وتسليم", "Microsoft Excel", "Microsoft Outlook", "Notion", "Task Tools"],
        toolsSecondary: ["YouTube Studio", "Canva", "WordPress", "Static Sites", "Telegram · تواصل سريع"],
        langsTitle: "تواصل واضح بثلاث لغات",
        langsSub: "من رسائل السائقين إلى فيديوهات يوتيوب – العربية، الألمانية، والإنجليزية.",
        langs: [
            { flag: "🇸🇾", name: "العربية", level: "اللغة الأم", pct: 1 },
            { flag: "🇩🇪", name: "الألمانية", level: "C1 · متقدّم", pct: 0.92 },
            { flag: "🇬🇧", name: "الإنجليزية", level: "A2 · أساسيات ومحادثة بسيطة", pct: 0.45 },
        ],
        softSkills: [
            { title: "حل المشاكل تحت الضغط", desc: "تنسيق فرق وسائقين مع رد فعل سريع للمفاجآت." },
            { title: "تواصل واضح", desc: "رسائل دقيقة للزبائن والسائقين والشركاء." },
            { title: "تنظيم وتفاصيل", desc: "هيكلة الطلبات، المواعيد، ومستندات العمل اليومية." },
            { title: "محتوى صادق", desc: "قصص منتجات بدون مبالغة، مع وضوح بصري وصوتي." },
        ],
        servicesTitle: "ماذا أقدّم اليوم؟",
        services: [
            { icon: "truck", title: "لوجستيات وتخطيط", desc: "مساعدة الشركات الصغيرة في تنظيم التوصيل، المستودع، وتخطيط الرحلات اليومية.", chips: ["خطط يومية", "تنظيم مخزون", "دعم سائقين"] },
            { icon: "video", title: "محتوى ومنتجات تقنية", desc: "تصوير ومراجعة منتجات، شروحات برامج، وتجهيز منزل ذكي بشكل عملي.", chips: ["فتح صناديق", "تجارب عملية", "مراجعات صادقة"] },
            { icon: "monitor", title: "مواقع وخدمات رقمية", desc: "تصميم مواقع بسيطة، صفحات تعريفية، ونماذج تواصل تساعد الناس يجدونك بسهولة.", chips: ["مواقع بسيطة", "نماذج تواصل", "تحسين حضور"] },
            { icon: "users", title: "تعاون مع العلامات التجارية", desc: "شراكات مع شركات وقنوات أخرى لعرض منتجاتهم وخدماتهم بشكل صادق وجذاب.", chips: ["شراكات محتوى", "إطلاق حملات", "تنسيق تواصل"] },
        ],
        ctaTitle: "هل تبحث عن تعاون؟",
        ctaDesc: "كل قنوات التواصل في مكان واحد: واتساب، بريد، لينكدإن، ويوتيوب.",
        contactBtn: "صفحة التواصل",
        ytBtn: "قناة يوتيوب",
        socials: [
            { href: "https://wa.me/4917623419358", label: "واتساب" },
            { href: "mailto:Mohammad.alfarras@gmail.com", label: "البريد الإلكتروني" },
            { href: "https://de.linkedin.com/in/mohammad-alfarras-525531262", label: "LinkedIn" },
            { href: "https://www.youtube.com/@Moalfarras", label: "يوتيوب" },
            { href: "https://www.instagram.com/moalfarras", label: "إنستغرام" },
            { href: "https://t.me/MoalFarras", label: "تليغرام" },
        ],
    },
    en: {
        eyebrow: "From Hasakah – through Europe to the screens",
        heroTitle: "Mohammad Alfarras – A Living CV",
        heroSub: "From daily logistics to tech content creation, this page tells my story as it is.",
        heroIntro: "Today I work as a Disponent at Rhenus Home Delivery, planning daily delivery routes, tracking drivers, and solving road and customer issues. At the same time I create honest tech content on YouTube: unboxings, product reviews, app walkthroughs, and smart home experiments. I love organisation, small details, and transparency — both in work and in content.",
        floatIcons: ["🎥", "⚡", "🧭", "🛠️"],
        timelineTitle: "My journey in work and life",
        timelineSub: "A clear timeline connecting logistics, content, and digital services.",
        timeline: [
            { period: "2022 – Present", tag: "Current", title: "Disponent · Rhenus Home Delivery", sub: "IKEA route planning, driver support, and daily performance analysis", points: ["Distributing 30-40 trips daily with time/cost balance", "Real-time driver monitoring and problem resolution", "Short TMS-based reports to streamline operations"] },
            { period: "2019 – 2022", tag: "Teams & Warehouses", title: "Logistics Coordinator · IKEA Deutschland", sub: "Coordinating furniture transport and storage with multicultural team", points: ["Improving shipment schedules and reducing delivery time", "Training new staff on logistics systems", "Stock control and daily order documentation"] },
            { period: "2017 – Present", tag: "Content", title: "Honest Tech Content Creator", sub: "159+ videos in three languages about devices, software, and usage experiences", points: ["Thumbnails and graphics with a glass aesthetic", "Real device testing before any review", "Building a community that values clarity over hype"] },
            { period: "2018 – Present", tag: "Services", title: "Digital Services for Small Businesses", sub: "Simple websites, email/task organisation, and workflow improvement", points: ["Static site and landing page design with clean UIs", "Email templates and order management setup", "Quick tips to turn digital chaos into clear steps"] },
        ],
        skillsTitle: "My skills & tools",
        skills: [
            { title: "Route planning and order distribution", level: 90, badge: "Advanced", highlight: true },
            { title: "Driver management and customer communication", level: 88, badge: "Advanced", highlight: true },
            { title: "Simple data analysis and reporting", level: 75, badge: "Good", highlight: false },
            { title: "Video content creation and basic editing", level: 85, badge: "Advanced", highlight: true },
            { title: "Simple web design", level: 70, badge: "Good", highlight: false },
            { title: "Organising small businesses", level: 92, badge: "Advanced", highlight: true },
        ],
        toolsTitle: "Tools & Technologies",
        toolsHead: "Daily software stack",
        toolsSub: "The tools I actually use in logistics, content, and websites.",
        toolsPrimary: ["TMS · Tracking & Delivery", "Microsoft Excel", "Microsoft Outlook", "Notion", "Task Tools"],
        toolsSecondary: ["YouTube Studio", "Canva", "WordPress", "Static Sites", "Telegram · Quick comms"],
        langsTitle: "Clear communication in three languages",
        langsSub: "From driver messages to YouTube videos – Arabic, German, and English.",
        langs: [
            { flag: "🇸🇾", name: "Arabic", level: "Native language", pct: 1 },
            { flag: "🇩🇪", name: "German", level: "C1 · Advanced", pct: 0.92 },
            { flag: "🇬🇧", name: "English", level: "A2 · Basic conversations", pct: 0.45 },
        ],
        softSkills: [
            { title: "Problem solving under pressure", desc: "Coordinating teams and drivers with quick reactions to surprises." },
            { title: "Clear communication", desc: "Precise messages to customers, drivers, and partners." },
            { title: "Organisation and detail", desc: "Structuring orders, appointments, and daily work documents." },
            { title: "Honest content", desc: "Product stories without exaggeration, with visual and audio clarity." },
        ],
        servicesTitle: "What do I offer today?",
        services: [
            { icon: "truck", title: "Logistics & Planning", desc: "Helping small businesses organise delivery, warehouse, and daily route planning.", chips: ["Daily plans", "Inventory setup", "Driver support"] },
            { icon: "video", title: "Tech Content & Products", desc: "Filming and reviewing products, software walkthroughs, and practical smart home setup.", chips: ["Unboxings", "Hands-on tests", "Honest reviews"] },
            { icon: "monitor", title: "Websites & Digital Services", desc: "Designing simple websites, landing pages, and contact forms that help people find you easily.", chips: ["Simple websites", "Contact forms", "Visibility boost"] },
            { icon: "users", title: "Brand Collaborations", desc: "Partnering with companies and channels to showcase their products honestly and attractively.", chips: ["Content partnerships", "Campaign launch", "Comms coordination"] },
        ],
        ctaTitle: "Looking to collaborate?",
        ctaDesc: "All contact channels in one place: WhatsApp, email, LinkedIn, and YouTube.",
        contactBtn: "Contact page",
        ytBtn: "YouTube channel",
        socials: [
            { href: "https://wa.me/4917623419358", label: "WhatsApp" },
            { href: "mailto:Mohammad.alfarras@gmail.com", label: "Email" },
            { href: "https://de.linkedin.com/in/mohammad-alfarras-525531262", label: "LinkedIn" },
            { href: "https://www.youtube.com/@Moalfarras", label: "YouTube" },
            { href: "https://www.instagram.com/moalfarras", label: "Instagram" },
            { href: "https://t.me/MoalFarras", label: "Telegram" },
        ],
    },
};

export function CVPage({ locale }: { locale: Locale }) {
    const t = content[locale];
    const dir = locale === "ar" ? "rtl" : "ltr";

    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("revealed")),
            { threshold: 0.1 }
        );
        document.querySelectorAll(".reveal-item").forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    return (
        <div className="cv-page-full" dir={dir}>
            {/* ─── HERO ─── */}
            <section className="cv-hero-section">
                <div className="container">
                    <div className="cv-hero-grid">
                        <div className="cv-hero-text-card glass reveal-item">
                            <p className="cv-eyebrow">{t.eyebrow}</p>
                            <h1 className="cv-main-heading">{t.heroTitle}</h1>
                            <h2 className="cv-sub-heading">{t.heroSub}</h2>
                            <p className="cv-intro-text">{t.heroIntro}</p>
                        </div>
                        <div className="cv-hero-portrait-card glass reveal-item">
                            <div className="cv-portrait-wrapper">
                                <div className="cv-portrait-glow" />
                                <div className="cv-portrait-floaters" aria-hidden="true">
                                    {t.floatIcons.map((icon, i) => (
                                        <span key={i} className={`cv-float-icon icon-${i + 1}`}>{icon}</span>
                                    ))}
                                </div>
                                <Image src="/images/portrait.jpg" alt="Mohammad Alfarras" width={300} height={370} className="cv-portrait-img" />
                            </div>
                            <div className="cv-signature-block">
                                <span className="cv-sig-name">Mohammad Alfarras</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── TIMELINE ─── */}
            <section className="cv-timeline-section">
                <div className="container">
                    <div className="cv-section-header">
                        <h2 className="cv-section-title gradient-text">{t.timelineTitle}</h2>
                        <p className="cv-section-sub">{t.timelineSub}</p>
                    </div>
                    <div className="cv-timeline-rail">
                        {t.timeline.map((item, i) => (
                            <article key={i} className="cv-timeline-card glass reveal-item">
                                <div className="cv-timeline-node" aria-hidden="true" />
                                <div className="cv-timeline-meta">
                                    <span className="cv-period">{item.period}</span>
                                    <span className="cv-tag">{item.tag}</span>
                                </div>
                                <h3 className="cv-card-title">{item.title}</h3>
                                <p className="cv-card-sub">{item.sub}</p>
                                <ul className="cv-card-points">
                                    {item.points.map((p, j) => <li key={j}>{p}</li>)}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SKILLS ─── */}
            <section className="cv-skills-section">
                <div className="container">
                    <h2 className="cv-section-title gradient-text reveal-item">{t.skillsTitle}</h2>
                    <div className="cv-skills-grid">
                        {t.skills.map((skill, i) => (
                            <div key={i} className="cv-skill-card glass reveal-item">
                                <h3 className="cv-skill-name">{skill.title}</h3>
                                <div className="cv-skill-bar-wrap">
                                    <div className="cv-skill-bar">
                                        <div className="cv-skill-fill" style={{ width: `${skill.level}%` }} />
                                    </div>
                                    <span className={`cv-skill-badge ${skill.highlight ? "highlight" : ""}`}>{skill.badge}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="cv-tools-block reveal-item">
                        <div className="cv-tools-head">
                            <span className="cv-tools-kicker">{t.toolsTitle}</span>
                            <h3 className="cv-tools-heading">{t.toolsHead}</h3>
                            <p className="cv-tools-sub">{t.toolsSub}</p>
                        </div>
                        <div className="cv-tools-rail">
                            {t.toolsPrimary.map((tool, i) => <span key={i} className="cv-tool-chip primary">{tool}</span>)}
                        </div>
                        <div className="cv-tools-rail mt-2">
                            {t.toolsSecondary.map((tool, i) => <span key={i} className="cv-tool-chip">{tool}</span>)}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── LANGUAGES ─── */}
            <section className="cv-langs-section">
                <div className="container">
                    <h2 className="cv-section-title gradient-text">{t.langsTitle}</h2>
                    <p className="cv-section-sub">{t.langsSub}</p>
                    <div className="cv-langs-grid">
                        {t.langs.map((lang, i) => (
                            <article key={i} className="cv-lang-card glass reveal-item">
                                <div className="cv-lang-flag" aria-hidden="true">{lang.flag}</div>
                                <div className="cv-lang-meta">
                                    <div className="cv-lang-name">{lang.name}</div>
                                    <div className="cv-lang-level">{lang.level}</div>
                                    <div className="cv-lang-bar"><span style={{ width: `${lang.pct * 100}%` }} /></div>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="cv-soft-grid">
                        {t.softSkills.map((s, i) => (
                            <div key={i} className="cv-soft-pill glass reveal-item">
                                <div className="cv-soft-title">{s.title}</div>
                                <div className="cv-soft-desc">{s.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SERVICES ─── */}
            <section className="cv-services-section">
                <div className="container">
                    <h2 className="cv-section-title gradient-text">{t.servicesTitle}</h2>
                    <div className="cv-services-grid">
                        {t.services.map((svc, i) => (
                            <div key={i} className="cv-service-card glass reveal-item">
                                <h3>{svc.title}</h3>
                                <p>{svc.desc}</p>
                                <div className="cv-service-chips">
                                    {svc.chips.map((chip, j) => <span key={j} className="cv-chip">{chip}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="cv-cta-section">
                <div className="container">
                    <div className="cv-cta-card glass reveal-item">
                        <h2 className="gradient-text">{t.ctaTitle}</h2>
                        <p>{t.ctaDesc}</p>
                        <div className="cv-cta-btns">
                            <Link href={`/${locale}/contact`} className="home-hero-btn primary">{t.contactBtn}</Link>
                            <a href="https://www.youtube.com/@Moalfarras" target="_blank" rel="noreferrer noopener" className="home-hero-btn secondary">{t.ytBtn}</a>
                        </div>
                        <div className="cv-socials">
                            {t.socials.map((s, i) => (
                                <a key={i} href={s.href} target="_blank" rel="noreferrer noopener" className="cv-social-btn">{s.label}</a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
