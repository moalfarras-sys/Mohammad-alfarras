"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/types/cms";

const content = {
    ar: {
        kicker: "من الحسكة — عبر أوروبا إلى الشاشات",
        heroTitle: "محتوى تقني صادق",
        heroSpan: "يبدأ من فتح الصندوق",
        heroPara: "أهلاً بك في عالمي… العالم الذي يبدأ من لحظة فتح الصندوق. هنا تتحوّل المنتجات إلى قصص، والأجهزة إلى تجارب، والتفاصيل الصغيرة إلى لحظات مثيرة تستحق الاكتشاف. أجرب، أختبر، ألمس، أسمع… وأعرض لك حقيقتها كما هي، بدون فلتر، بدون تلوين، وبدون مبالغة.",
        heroPara2: "سواء جئت لتستمتع… أو لتقرر ماذا تشتري… أو كنت شركة تبحث عن عرض احترافي لمنتجها— فأنت الآن في المكان الصحيح.",
        taglines: ["التقنية… كما يجب أن تُروى", "تجارب حقيقية… بدون فلتر", "فتح صناديق تستحق المشاهدة", "منتجات… تحت المجهر", "محتوى صادق… من تجربة فعلية", "جاهز للتعاون مع الشركات والمنتجات"],
        watchYt: "شاهد قناتي على يوتيوب",
        collaborate: "تعاون معي",
        pills: ["صناعة محتوى", "منتجات تقنية", "مراجعات وتجارب", "خدمات رقمية", "لوجستيات ونقل"],
        galleryTitle: "لمحات من يومي مع التقنية",
        gallerySub: "لقطات من مراجعات المنتجات، تجهيز الأجهزة، وزوايا العمل الذكية.",
        skillsTitle: "أين يمكن أن تساعدك مهاراتي؟",
        skillsSub: "من التخطيط اليومي للرحلات، إلى مراجعة أحدث الأجهزة، إلى ترتيب عملك الرقمي… كل هذا في مكان واحد.",
        skills: [
            {
                icon: "truck",
                title: "اللوجستيات والتخطيط اليومي",
                text: "أعمل كـ Disponent في شركة Rhenus، أرتّب رحلات التوصيل، أوزّع المهام على السائقين، وأحل المشاكل تحت الضغط. أستطيع مساعدتك في تنظيم المستودع، جدول السائقين، وتبسيط عملياتك اليومية.",
                tags: ["تخطيط رحلات", "تنظيم مستودع", "حل مشاكل ميدانية"],
            },
            {
                icon: "youtube",
                title: "يوتيوب: مراجعات وتجهيز منتجات",
                text: "أحب فتح الصناديق، تجربة الأجهزة، وترتيب زوايا منزل ذكي بسيطة وقابلة للتطبيق. أصوّر مراجعات صادقة بدون مبالغة، وأشرح إعدادات وبرامج تجعل التقنية أقرب للحياة اليومية.",
                tags: ["مراجعات تقنية", "منزل ذكي", "تجهيز منتجات"],
            },
            {
                icon: "monitor",
                title: "خدمات رقمية للشركات والأفراد",
                text: "أصمّم مواقع بسيطة وواضحة، أرتّب الإيميلات والملفات، وأبني نظام عمل يساعدك تتابع طلباتك وعمّالك بسهولة. مثالي للشركات الصغيرة وروّاد الأعمال.",
                tags: ["تصميم مواقع", "تنظيم عمل", "خدمات عن بُعد"],
            },
            {
                icon: "users",
                title: "شراكات وتعاونات محتوى",
                text: "جاهز للتعاون مع شركات وقنوات أخرى لعرض منتجات، تقييم خدمات، أو تصوير مشترك. أساعد في التسويق الإلكتروني، ترتيب المحتوى، وجدولة النشر حتى يظهر شغلك بأفضل صورة.",
                tags: ["تعاونات", "تسويق إلكتروني", "دعم سوشيال ميديا"],
            },
        ],
        faqTitle: "أسئلة سريعة · FAQ",
        faqSub: "شوية أسئلة أسمعها كثير، وإجابات قصيرة توضح فكرة الموقع.",
        faqs: [
            { q: "هل يمكننا البدء بمشروع صغير كتجربة؟", a: "طبعاً، أفضل شيء نبدأ بخطوة صغيرة واضحة: صفحة هبوط، فيديو واحد، أو ترتيب نظام عمل بسيط. إذا أعجبك الأسلوب، نكبر المشروع خطوة خطوة." },
            { q: "هل تعمل عن بُعد فقط؟", a: "أغلب الشغل يتم أونلاين، لكن لو كنا في نفس المدينة يمكننا التنسيق لتصوير أو جلسة عمل ميدانية حسب المشروع." },
            { q: "كم يستغرق تحضير فيديو مراجعة لمنتج؟", a: "عادةً من ٣ إلى ٧ أيام: تجربة حقيقية للمنتج، كتابة الأفكار، التصوير، ثم المونتاج الخفيف بدون مبالغة." },
            { q: "أنا صاحب مشروع صغير، هل أستفيد منك؟", a: "أكيد. أقدر أساعدك في تنظيم طلباتك، ترتيب موقعك أو متجرك، وضبط طريقة التواصل مع عملائك بشكل بسيط وواضح." },
            { q: "هل تقدم أفكار أم تنفّذ فقط؟", a: "أعمل الاثنين معاً: أساعدك تكتشف ما تحتاجه فعلاً، ثم ننفّذ خطوة عملية تناسب ميزانيتك ووقتك." },
        ],
        servicesTitle: "ماذا أقدّم اليوم؟",
        servicesSub: "خدمات حقيقية من خبرة فعلية – اختر ما يناسبك",
        services: [
            {
                img: "/images/service_logistics.png",
                alt: "لوجستيات وتخطيط",
                title: "لوجستيات وتخطيط",
                desc: "مساعدة الشركات الصغيرة في تنظيم التوصيل، المستودع، وتخطيط الرحلات اليومية.",
                chips: ["خطط يومية", "تنظيم مخزون", "دعم سائقين"],
            },
            {
                img: "/images/service_tech.png",
                alt: "محتوى ومنتجات تقنية",
                title: "محتوى ومنتجات تقنية",
                desc: "تصوير ومراجعة منتجات، شروحات برامج، وتجهيز منزل ذكي بشكل عملي.",
                chips: ["فتح صناديق", "تجارب عملية", "مراجعات صادقة"],
            },
            {
                img: "/images/service_web.png",
                alt: "مواقع وخدمات رقمية",
                title: "مواقع وخدمات رقمية",
                desc: "تصميم مواقع بسيطة، صفحات تعريفية، ونماذج تواصل تساعد الناس يجدونك بسهولة.",
                chips: ["مواقع بسيطة", "نماذج تواصل", "تحسين حضور"],
            },
        ],
        ctaTitle: "هل تبحث عن تعاون؟",
        ctaBody: "كل قنوات التواصل في مكان واحد. اضغط لتتواصل مباشرة أو اذهب لصفحة التواصل الكاملة.",
        ctaBtn: "صفحة التواصل",
        ytBtn: "قناة يوتيوب",
    },
    en: {
        kicker: "From Hasakah — through Europe to the screens",
        heroTitle: "Honest Tech Content",
        heroSpan: "Starting from unboxing",
        heroPara: "Welcome to my world… where products become stories, devices become experiences, and small details become exciting moments worth discovering. I test, try, touch, listen… and show you the truth as it is — no filter, no exaggeration.",
        heroPara2: "Whether you came to enjoy, decide what to buy, or you are a brand looking for an authentic showcase — you are in the right place.",
        taglines: ["Tech… the way it should be told", "Real experiences… no filter", "Unboxings worth watching", "Products… under the spotlight", "Honest content… from real use", "Ready to collaborate with brands"],
        watchYt: "Watch my YouTube Channel",
        collaborate: "Collaborate with me",
        pills: ["Content Creation", "Tech Products", "Reviews & Tests", "Digital Services", "Logistics & Transport"],
        galleryTitle: "Glimpses from my tech day",
        gallerySub: "Shots from product reviews, device setups, and smart workspace corners.",
        skillsTitle: "Where can my skills help you?",
        skillsSub: "From daily route planning, to reviewing the latest gadgets, to organising your digital work — all in one place.",
        skills: [
            {
                icon: "truck",
                title: "Logistics & Daily Planning",
                text: "I work as a Disponent at Rhenus, coordinating delivery routes, distributing tasks to drivers, and solving problems under pressure. I can help you organise your warehouse, driver schedules, and simplify daily operations.",
                tags: ["Route planning", "Warehouse setup", "Field problem solving"],
            },
            {
                icon: "youtube",
                title: "YouTube: Reviews & Product Setup",
                text: "I love unboxing, testing devices, and creating simple, practical smart home corners. I film honest reviews without exaggeration, and explain settings and apps that bring tech closer to everyday life.",
                tags: ["Tech reviews", "Smart home", "Product setup"],
            },
            {
                icon: "monitor",
                title: "Digital Services for Businesses",
                text: "I design simple and clear websites, organise emails and files, and build work systems to help you track orders and staff easily. Perfect for small businesses and entrepreneurs who need organisation without complexity.",
                tags: ["Web design", "Work organisation", "Remote services"],
            },
            {
                icon: "users",
                title: "Brand Partnerships & Collaborations",
                text: "Ready to collaborate with companies and channels to showcase products, review services, or co-create content. I help with digital marketing, content organisation, and publication scheduling.",
                tags: ["Collaborations", "Digital marketing", "Social media support"],
            },
        ],
        faqTitle: "Quick Questions · FAQ",
        faqSub: "Some questions I hear often, with short answers that clarify the purpose of this site.",
        faqs: [
            { q: "Can we start with a small pilot project?", a: "Absolutely. It's best to start with a clear small step: a landing page, one video, or setting up a simple work system. If you like the approach, we grow it step by step." },
            { q: "Do you only work remotely?", a: "Most work is done online, but if we're in the same city we can coordinate for filming or an on-site work session, depending on the project." },
            { q: "How long does it take to prepare a product review video?", a: "Usually 3 to 7 days: real product testing, writing ideas, filming, then light editing — no exaggerations." },
            { q: "I have a small business — can you help me?", a: "Absolutely. I can help you organise your orders, set up your website or store, and streamline how you communicate with customers in a simple, clear way." },
            { q: "Do you provide ideas or only execute?", a: "Both: I help you discover what you actually need, then we execute a practical step that fits your budget and timeline." },
        ],
        servicesTitle: "What do I offer today?",
        servicesSub: "Real services from real experience — choose what suits you",
        services: [
            {
                img: "/images/service_logistics.png",
                alt: "Logistics and planning",
                title: "Logistics & Planning",
                desc: "Helping small businesses organise delivery, warehouse, and daily route planning.",
                chips: ["Daily plans", "Inventory setup", "Driver support"],
            },
            {
                img: "/images/service_tech.png",
                alt: "Tech content and products",
                title: "Tech Content & Products",
                desc: "Filming and reviewing products, software walkthroughs, and practical smart home setup.",
                chips: ["Unboxings", "Hands-on tests", "Honest reviews"],
            },
            {
                img: "/images/service_web.png",
                alt: "Web & digital services",
                title: "Web & Digital Services",
                desc: "Designing simple websites, landing pages, and contact forms that help people find you easily.",
                chips: ["Simple websites", "Contact forms", "Visibility boost"],
            },
        ],
        ctaTitle: "Looking to collaborate?",
        ctaBody: "All contact channels in one place. Press to get in touch directly or visit the full contact page.",
        ctaBtn: "Contact page",
        ytBtn: "YouTube channel",
    },
};

const galleryImages = [
    { src: "/images/00.jpeg", alt: "Tech content moment" },
    { src: "/images/11.jpeg", alt: "Tech content moment" },
    { src: "/images/22.jpeg", alt: "Tech content moment" },
    { src: "/images/33.jpeg", alt: "Tech content moment" },
    { src: "/images/44.jpeg", alt: "Tech content moment" },
    { src: "/images/55.jpeg", alt: "Tech content moment" },
    { src: "/images/66.jpeg", alt: "Tech content moment" },
    { src: "/images/77.jpeg", alt: "Tech content moment" },
];

function SkillIcon({ type }: { type: string }) {
    if (type === "truck") return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
        </svg>
    );
    if (type === "youtube") return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
        </svg>
    );
    if (type === "monitor") return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" />
        </svg>
    );
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

export function HomePage({ locale }: { locale: Locale }) {
    const t = content[locale];
    const dir = locale === "ar" ? "rtl" : "ltr";
    const taglineRef = useRef<HTMLDivElement>(null);
    const taglineIdxRef = useRef(0);

    useEffect(() => {
        const el = taglineRef.current;
        if (!el) return;
        const tags = el.querySelectorAll<HTMLElement>(".tagline-text");
        if (!tags.length) return;
        tags.forEach((tag, i) => {
            tag.style.opacity = i === 0 ? "1" : "0";
            tag.style.transform = i === 0 ? "translateY(0)" : "translateY(20px)";
        });
        const interval = setInterval(() => {
            const curr = taglineIdxRef.current;
            const next = (curr + 1) % tags.length;
            tags[curr].style.opacity = "0";
            tags[curr].style.transform = "translateY(-20px)";
            tags[next].style.opacity = "1";
            tags[next].style.transform = "translateY(0)";
            taglineIdxRef.current = next;
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("revealed")),
            { threshold: 0.15 }
        );
        document.querySelectorAll(".reveal-item").forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    return (
        <div className="home-page-full" dir={dir}>
            {/* ─── HERO ─── */}
            <section className="home-hero" aria-label={locale === "ar" ? "قسم البطل" : "Hero section"}>
                <div className="home-hero-inner">
                    <div className="home-hero-text">
                        <p className="home-hero-kicker">{t.kicker}</p>
                        <h1 className="home-hero-title">
                            {t.heroTitle}<br />
                            <span className="gradient-text">{t.heroSpan}</span>
                        </h1>
                        <p className="home-hero-para">{t.heroPara}</p>
                        <p className="home-hero-para2">{t.heroPara2}</p>
                        <div className="home-tagline" ref={taglineRef}>
                            {t.taglines.map((tag, i) => (
                                <div key={i} className="tagline-text" style={{ transition: "opacity 0.5s, transform 0.5s", position: "absolute", width: "100%" }}>{tag}</div>
                            ))}
                        </div>
                        <div className="home-hero-actions">
                            <a href="https://www.youtube.com/@Moalfarras" target="_blank" rel="noreferrer noopener" className="home-hero-btn primary">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                                {t.watchYt}
                            </a>
                            <Link href={`/${locale}/contact`} className="home-hero-btn secondary">{t.collaborate}</Link>
                        </div>
                    </div>
                    <div className="home-hero-media">
                        <div className="home-portrait-card">
                            <Image src="/images/portrait.jpg" alt="Mohammad Alfarras" width={400} height={500} className="home-portrait" priority />
                            <p className="home-hero-sig">Mohammad Alfarras</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── PILLS ─── */}
            <section className="home-pills-section">
                <div className="container">
                    <div className="home-pills-grid">
                        {t.pills.map((pill, i) => (
                            <button key={i} className="home-pill-btn" type="button">{pill}</button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── GALLERY ─── */}
            <section className="home-gallery-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.galleryTitle}</h2>
                        <p className="section-sub-full">{t.gallerySub}</p>
                    </div>
                    <div className="home-gallery-grid">
                        {galleryImages.map((img, i) => (
                            <div key={i} className="home-gallery-item reveal-item">
                                <Image src={img.src} alt={img.alt} width={400} height={300} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                <div className="home-gallery-overlay">
                                    <svg className="gallery-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><circle cx="12" cy="12" r="3.2" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SKILLS ─── */}
            <section className="home-skills-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.skillsTitle}</h2>
                        <p className="section-sub-full">{t.skillsSub}</p>
                    </div>
                    <div className="home-skills-grid">
                        {t.skills.map((skill, i) => (
                            <article key={i} className="home-skill-card glass reveal-item">
                                <div className="home-skill-icon"><SkillIcon type={skill.icon} /></div>
                                <h3 className="home-skill-title">{skill.title}</h3>
                                <p className="home-skill-text">{skill.text}</p>
                                <div className="home-skill-tags">
                                    {skill.tags.map((tag, j) => <span key={j} className="home-skill-tag">{tag}</span>)}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SERVICES ─── */}
            <section className="home-services-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.servicesTitle}</h2>
                        <p className="section-sub-full">{t.servicesSub}</p>
                    </div>
                    <div className="home-services-grid">
                        {t.services.map((svc, i) => (
                            <article key={i} className="home-service-card glass reveal-item">
                                <div className="home-service-img-wrap">
                                    <Image src={svc.img} alt={svc.alt} width={400} height={220} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                                </div>
                                <div className="home-service-body">
                                    <h3>{svc.title}</h3>
                                    <p>{svc.desc}</p>
                                    <div className="home-service-chips">
                                        {svc.chips.map((chip, j) => <span key={j} className="home-service-chip">{chip}</span>)}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FAQ ─── */}
            <section className="home-faq-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.faqTitle}</h2>
                        <p className="section-sub-full">{t.faqSub}</p>
                    </div>
                    <div className="home-faq-list">
                        {t.faqs.map((faq, i) => (
                            <details key={i} className="home-faq-item reveal-item">
                                <summary>{faq.q}</summary>
                                <p>{faq.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── CTA ─── */}
            <section className="home-cta-section">
                <div className="container">
                    <div className="home-cta-card glass">
                        <h2 className="gradient-text">{t.ctaTitle}</h2>
                        <p>{t.ctaBody}</p>
                        <div className="home-cta-btns">
                            <Link href={`/${locale}/contact`} className="home-hero-btn primary">{t.ctaBtn}</Link>
                            <a href="https://www.youtube.com/@Moalfarras" target="_blank" rel="noreferrer noopener" className="home-hero-btn secondary">{t.ytBtn}</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
