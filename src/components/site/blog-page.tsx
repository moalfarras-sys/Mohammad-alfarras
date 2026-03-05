"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/types/cms";

const galleryImages = [
    { src: "/images/00.jpeg" }, { src: "/images/11.jpeg" },
    { src: "/images/22.jpeg" }, { src: "/images/33.jpeg" },
    { src: "/images/44.jpeg" }, { src: "/images/55.jpeg" },
    { src: "/images/66.jpeg" }, { src: "/images/77.jpeg" },
];

const content = {
    ar: {
        eyebrow: "أعمال · مشاريع · خبرة",
        heroTitle: "مرحباً، أنا محمد",
        heroSpan: "من الشغل اليومي إلى صناعة المحتوى",
        heroLead: "هذه الصفحة تجمع أعمالي وخبرتي في اللوجستيات، إدارة رحلات التوصيل، صناعة المحتوى على يوتيوب، التعاونات مع الشركات، وتقديم الخدمات الرقمية. كل مشروع هنا من الواقع والخبرة اليومية.",
        projectsTitle: "المشاريع والخبرة",
        projectsSub: "أعمال حقيقية من الواقع والخبرة اليومية",
        projects: [
            {
                title: "Disponent – إدارة رحلات | Rhenus Home Delivery",
                meta: "اللوجستيات (العمل الأساسي)",
                desc: "شغلي الأساسي هو إدارة وتخطيط رحلات التوصيل اليومية لفريق من 20–40 مركبة. أخطط الرحلات، أوزّع الطلبات، أتابع السائقين، أنظم المستودع، وأحلّ المشكلات اليومية. أعمل مع نظام TMS لتحسين الوقت والتكاليف وضمان سير العمل بسلاسة.",
                tags: ["تخطيط رحلات", "TMS", "إدارة سائقين", "تنظيم مستودعات", "تحليل عمليات"],
            },
            {
                title: "مراجعات تقنية – فتح صناديق – منزل ذكي – برامج وأدوات",
                meta: "اليوتيوب (المحتوى التقني)",
                desc: "على يوتيوب أقدّم محتوى تقني بسيط وصادق: فتح صناديق لأجهزة جديدة، مراجعات تقنية، شروحات برامج وأدوات، أفكار للمنزل الذكي، وتجارب استخدام حقيقية بدون مبالغة أو فلتر.",
                tags: ["Unboxing", "Tech Reviews", "Smart Home", "Apps", "تجربة استخدام"],
            },
            {
                title: "تعاون مع الشركات والقنوات",
                meta: "التعاونات والشراكات",
                desc: "أقدّم تعاونات مع الشركات والأفراد: تصوير وعرض منتجات جديدة، تقييم خدمات، محتوى مشترك مع قنوات أخرى، دعم السوشيال ميديا، وتحسين ظهور المحتوى.",
                tags: ["Brand Deals", "تصوير منتجات", "تسويق إلكتروني", "محتوى مشترك", "Social Media"],
            },
            {
                title: "خدمات تقنية وإلكترونية للشركات الصغيرة والأفراد",
                meta: "الخدمات الرقمية",
                desc: "أساعد المشاريع الصغيرة والأفراد على تنظيم شغلهم وتحسين حضورهم الرقمي: تصميم مواقع إلكترونية بسيطة وأنيقة، تجهيز صفحات هبوط، تنظيم البريد الإلكتروني والملفات، إعداد الفواتير، وترتيب سير العمل اليومي.",
                tags: ["تصميم مواقع", "صفحات هبوط", "تنظيم إيميلات", "خدمات رقمية"],
            },
            {
                title: "تنظيم، تخطيط، وحلول عملية",
                meta: "التخطيط والتنظيم",
                desc: "أستمتع بصناعة حلول بسيطة لمشاكل معقدة: ترتيب المهام، بناء خطوات عمل واضحة، تنظيم المستودع أو الفريق، وتبسيط الأدوات اللي تستخدمها كل يوم.",
                tags: ["تنظيم عمل", "Workflow", "تحسين إجراءات", "استشارات بسيطة"],
            },
        ],
        orbCenter: "من الشغل والحياة",
        orbDesc: "لقطات حقيقية من المكتب، التخطيط، صناعة المحتوى، والتجارب اليومية.",
        articlesTitle: "مقالات وأفكار",
        articlesSub: "خبرة ونصائح من التجربة الفعلية",
        articles: [
            { title: "كيف تعمل Disposition في ألمانيا؟", meta: "لوجستيات · تخطيط رحلات", body: "شرح تفصيلي عن نظام تخطيط الرحلات (Disposition) في الشركات الألمانية – كيف توزع الطلبات، كيف تبني خطة يومية لـ 30+ سيارة، كيف تتعامل مع TMS، وكيف تحل المشاكل الطارئة." },
            { title: "10 أشياء تعلمتها من إدارة السائقين", meta: "إدارة · تجربة شخصية", body: "التواصل، حل النزاعات، التنظيم، الصبر – دروس عملية من سنوات العمل المباشر مع أكثر من 50 سائق." },
            { title: "التواصل بين العميل والسائق – كيف يكون احترافي؟", meta: "خدمة عملاء · اتصالات", body: "بناء تواصل احترافي وسريع بين العميل والسائق يقلل المشاكل ويحسن رضا العملاء." },
            { title: "الحياة والعمل في ألمانيا – واقع وتجربة", meta: "تجربة شخصية · ألمانيا", body: "رحلتي من سوريا إلى ألمانيا، التحديات، الفرص، والدروس المهمة. كيف بنيت مسيرة في اللوجستيات." },
            { title: "كيف تبني موقع بسيط بدون تعقيد؟", meta: "تقنية · تصميم", body: "خطوات عملية لبناء موقع احترافي بسيط – من الفكرة إلى النشر. بدون حاجة لميزانية ضخمة." },
            { title: "صناعة المحتوى كجزء من روتينك اليومي", meta: "محتوى · يوتيوب", body: "ما تحتاج كاميرا احترافية أو استوديو. التصوير والكتابة يمكن يكونوا جزء طبيعي من يومك." },
        ],
        collabTitle: "شو ممكن نشتغل سوا؟",
        collabItems: [
            { title: "تنظيم لوجستيات وتخطيط رحلات", body: "بناء نظام Disposition احترافي، توزيع الطلبات على السائقين، تخطيط الرحلات اليومية، تحسين الكفاءة والوقت." },
            { title: "بناء Workflow لشركات ناشئة أو قائمة", body: "تصميم نظام عمل منظم من الصفر – من استقبال الطلب إلى التسليم، مع تحديد المسؤوليات والأدوار بوضوح." },
            { title: "إدارة محتوى وقناة YouTube", body: "استراتيجية محتوى، تخطيط فيديوهات، كتابة نصوص، نصائح للتصوير والمونتاج، وكيف تبني جمهور حقيقي." },
            { title: "تصميم موقع إلكتروني بسيط واحترافي", body: "صفحات تعريفية، نماذج تواصل، معارض صور، هوية بصرية بسيطة – كل شي نظيف وسريع." },
            { title: "استشارات للعمل والحياة في ألمانيا", body: "كيف تبدأ، كيف تبحث عن شغل، كيف تتعامل مع البيروقراطية، نصائح عملية من التجربة الشخصية." },
            { title: "تحسين خدمة العملاء والتواصل", body: "بناء نظام تواصل احترافي بين الشركة والعملاء، تدريب الفريق على التعامل مع الشكاوى، تحسين تجربة العميل." },
            { title: "بناء CV أو Portfolio احترافي", body: "مساعدة في كتابة السيرة الذاتية، ترتيب الخبرات، عرض المهارات بطريقة واضحة ومؤثرة." },
            { title: "Landing Pages لتسويق منتج أو خدمة", body: "تصميم صفحة هبوط احترافية تركز على رسالة واحدة واضحة، مع دعوة فعالة للعمل (CTA)." },
        ],
        collabClose: "الفكرة تبدأ من رسالة بسيطة… وأنا جاهز نبدأ.",
        contactLabel: "تواصل معي الآن",
        followOn: "تابعني على",
        socials: [
            { href: "https://de.linkedin.com/in/mohammad-alfarras-525531262", label: "LinkedIn" },
            { href: "https://www.facebook.com/share/14TQSSocNQG/", label: "Facebook" },
            { href: "https://www.instagram.com/moalfarras", label: "Instagram" },
            { href: "https://t.me/MoalFarras", label: "Telegram" },
            { href: "https://github.com/moalfarras-sys", label: "GitHub" },
            { href: "https://www.youtube.com/@Moalfarras", label: "YouTube" },
        ],
    },
    en: {
        eyebrow: "Work · Projects · Experience",
        heroTitle: "Hi, I'm Mohammad",
        heroSpan: "From daily work to content creation",
        heroLead: "This page brings together my work and experience in logistics, delivery route management, YouTube content creation, brand collaborations, and digital services. Every project here comes from real-world daily experience.",
        projectsTitle: "Projects & Experience",
        projectsSub: "Real work from reality and everyday experience",
        projects: [
            {
                title: "Disponent – Route Management | Rhenus Home Delivery",
                meta: "Logistics (main job)",
                desc: "My main job is managing and planning daily delivery routes for a fleet of 20–40 vehicles. I plan routes, distribute orders, track drivers, manage the warehouse, and solve daily issues. I use a TMS system to optimise time and costs.",
                tags: ["Route planning", "TMS", "Driver management", "Warehouse", "Operations analysis"],
            },
            {
                title: "Tech Reviews – Unboxings – Smart Home – Apps & Tools",
                meta: "YouTube (tech content)",
                desc: "On YouTube I create simple, honest tech content: unboxings of new devices, tech reviews, app walkthroughs, smart home ideas, and real usage experiences — no exaggeration, no filter.",
                tags: ["Unboxing", "Tech Reviews", "Smart Home", "Apps", "Usage experience"],
            },
            {
                title: "Brand & Channel Collaborations",
                meta: "Collaborations & Partnerships",
                desc: "I offer collaborations with businesses and individuals: filming and showcasing new products, service reviews, co-created content with other channels, social media support, and content visibility improvement.",
                tags: ["Brand Deals", "Product filming", "Digital marketing", "Co-content", "Social Media"],
            },
            {
                title: "Digital Tech Services for Small Businesses",
                meta: "Digital Services",
                desc: "I help small businesses and individuals organise their work and improve their digital presence: simple elegant websites, landing pages, email and file organisation, invoice setup, and daily workflow improvement.",
                tags: ["Web design", "Landing pages", "Email setup", "Digital services"],
            },
            {
                title: "Organisation, Planning & Practical Solutions",
                meta: "Planning & Organisation",
                desc: "I enjoy creating simple solutions to complex problems: task organisation, clear workflow steps, warehouse or team setup, and simplifying the tools you use every day.",
                tags: ["Work organisation", "Workflow", "Process improvement", "Consultations"],
            },
        ],
        orbCenter: "From work and life",
        orbDesc: "Real shots from the office, planning, content creation, and daily experiences.",
        articlesTitle: "Articles & Ideas",
        articlesSub: "Experience and advice from real practice",
        articles: [
            { title: "How does Disposition work in Germany?", meta: "Logistics · Route planning", body: "A detailed explanation of the route planning system (Disposition) in German companies — how to distribute orders, build a daily plan for 30+ vehicles, work with TMS, and solve emergencies." },
            { title: "10 things I learned from managing drivers", meta: "Management · Personal experience", body: "Communication, conflict resolution, organisation, patience — practical lessons from years of direct work with over 50 drivers." },
            { title: "Customer-driver communication — how to be professional?", meta: "Customer service · Communications", body: "Building fast, professional communication between customer and driver reduces problems and improves customer satisfaction." },
            { title: "Life and work in Germany — reality and experience", meta: "Personal experience · Germany", body: "My journey from Syria to Germany, challenges, opportunities, and important lessons. How I built a career in logistics." },
            { title: "How to build a simple website without complexity?", meta: "Tech · Design", body: "Practical steps to build a professional simple website — from idea to launch. No need for a big budget or deep coding knowledge." },
            { title: "Content creation as part of your daily routine", meta: "Content · YouTube", body: "You don't need a professional camera or studio. Filming and writing can be a natural part of your day — from your phone, office, or car." },
        ],
        collabTitle: "What can we work on together?",
        collabItems: [
            { title: "Logistics organisation and route planning", body: "Building a professional Disposition system, distributing orders to drivers, daily route planning, efficiency and time improvement." },
            { title: "Building a Workflow for new or existing businesses", body: "Designing an organised work system from scratch — from receiving an order to delivery, with clear roles and responsibilities." },
            { title: "Content and YouTube channel management", body: "Content strategy, video planning, script writing, filming and editing tips, and how to build a real audience." },
            { title: "Simple, professional website design", body: "Landing pages, contact forms, image galleries, simple visual identity — everything clean and fast." },
            { title: "Consultations for work and life in Germany", body: "How to start, how to find a job, how to deal with bureaucracy — practical advice from personal experience." },
            { title: "Customer service and communication improvement", body: "Building professional communication between company and customers, training teams to handle complaints, improving customer experience." },
            { title: "Building a CV or professional Portfolio", body: "Help writing your CV, organising experiences, presenting skills clearly and effectively." },
            { title: "Landing Pages for product or service marketing", body: "Designing a professional landing page focused on one clear message, with an effective call to action." },
        ],
        collabClose: "The idea starts with a simple message… and I'm ready to begin.",
        contactLabel: "Contact me now",
        followOn: "Follow me on",
        socials: [
            { href: "https://de.linkedin.com/in/mohammad-alfarras-525531262", label: "LinkedIn" },
            { href: "https://www.facebook.com/share/14TQSSocNQG/", label: "Facebook" },
            { href: "https://www.instagram.com/moalfarras", label: "Instagram" },
            { href: "https://t.me/MoalFarras", label: "Telegram" },
            { href: "https://github.com/moalfarras-sys", label: "GitHub" },
            { href: "https://www.youtube.com/@Moalfarras", label: "YouTube" },
        ],
    },
};

export function BlogPage({ locale }: { locale: Locale }) {
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
        <div className="blog-page-full" dir={dir}>
            {/* ─── HERO ─── */}
            <section className="blog-hero-section">
                <div className="container blog-hero-grid">
                    <article className="blog-hero-content reveal-item">
                        <div className="glass blog-hero-glass">
                            <p className="blog-eyebrow">{t.eyebrow}</p>
                            <h1 className="blog-hero-title">
                                {t.heroTitle}<br />
                                <span className="gradient-text">{t.heroSpan}</span>
                            </h1>
                            <p className="blog-hero-lead">{t.heroLead}</p>
                        </div>
                    </article>
                    <aside className="blog-hero-aside reveal-item">
                        <div className="glass blog-hero-img-card">
                            <Image src="/images/000.jpeg" alt="Mohammad Alfarras" width={400} height={400} style={{ objectFit: "cover", width: "100%", borderRadius: "12px" }} />
                        </div>
                    </aside>
                </div>
            </section>

            {/* ─── PROJECTS ─── */}
            <section className="blog-projects-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.projectsTitle}</h2>
                        <p className="section-sub-full">{t.projectsSub}</p>
                    </div>
                    <div className="blog-projects-list glass">
                        {t.projects.map((proj, i) => (
                            <article key={i} className="blog-project-item reveal-item">
                                <h3 className="blog-proj-title">{proj.title}</h3>
                                <p className="blog-proj-meta">{proj.meta}</p>
                                <p className="blog-proj-body">{proj.desc}</p>
                                <div className="blog-tags">
                                    {proj.tags.map((tag, j) => <span key={j} className="blog-tag">{tag}</span>)}
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Orbit gallery */}
                    <div className="blog-orbit-wrap">
                        <div className="blog-orbit-center glass">
                            <Image src="/images/portrait.jpg" alt="Mohammad Alfarras" width={100} height={100} style={{ borderRadius: "50%", objectFit: "cover" }} />
                            <h3>{t.orbCenter}</h3>
                            <p>{t.orbDesc}</p>
                        </div>
                        <div className="blog-orbit-gallery">
                            {galleryImages.map((img, i) => (
                                <div key={i} className="blog-orbit-img">
                                    <Image src={img.src} alt="" width={100} height={100} style={{ objectFit: "cover", width: "100%", height: "100%", borderRadius: "50%" }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── ARTICLES ─── */}
            <section className="blog-articles-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.articlesTitle}</h2>
                        <p className="section-sub-full">{t.articlesSub}</p>
                    </div>
                    <div className="blog-articles-list glass">
                        {t.articles.map((art, i) => (
                            <article key={i} className="blog-article-item reveal-item">
                                <h3>{art.title}</h3>
                                <p className="blog-article-meta">{art.meta}</p>
                                <p>{art.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── COLLAB ─── */}
            <section className="blog-collab-section">
                <div className="container">
                    <div className="blog-collab-panel glass">
                        <h2 className="gradient-text">{t.collabTitle}</h2>
                        <div className="blog-collab-grid">
                            {t.collabItems.map((item, i) => (
                                <div key={i} className="blog-collab-item reveal-item">
                                    <h4>{item.title}</h4>
                                    <p>{item.body}</p>
                                </div>
                            ))}
                        </div>
                        <p className="blog-collab-close">
                            {t.collabClose}{" "}
                            <Link href={`/${locale}/contact`} className="blog-contact-cta">{t.contactLabel}</Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── SOCIAL ─── */}
            <section className="blog-social-section">
                <div className="container">
                    <h3 className="blog-follow-label">{t.followOn}</h3>
                    <div className="blog-socials">
                        {t.socials.map((s, i) => (
                            <a key={i} href={s.href} target="_blank" rel="noreferrer noopener" className="blog-social-link">{s.label}</a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
