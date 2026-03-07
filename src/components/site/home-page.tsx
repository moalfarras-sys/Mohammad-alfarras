"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import type { CmsSnapshot, Locale, PageView, YoutubeVideo } from "@/types/cms";

const socialLinks = {
    youtube: "https://www.youtube.com/@Moalfarras",
    whatsapp: "https://wa.me/4917623419358",
    instagram: "https://www.instagram.com/moalfarras",
    telegram: "https://t.me/MoalFarras",
    linkedin: "https://de.linkedin.com/in/mohammad-alfarras-525531262",
    github: "https://github.com/moalfarras-sys",
};

const content = {
    ar: {
        kicker: "مرحباً، أنا محمد الفراس",
        name: "Mohammad Alfarras",
        heroTitle: "تشغيل · محتوى · حلول رقمية",
        heroBody: "أدير عمليات التسليم يومياً في Rhenus Home Delivery، وأبني قناة يوتيوب ومشاريع رقمية بنفس الأسلوب: وضوح، تفاصيل، وتنفيذ محترم.",
        taglines: ["📦 لوجستيات ذكية", "🎬 محتوى صادق", "💻 حلول رقمية", "🚀 تنفيذ محترف"],
        ctaPrimary: "تواصل معي",
        ctaSecondary: "يوتيوب",
        ctaCV: "السيرة الذاتية",
        pillsTitle: "ما أقدمه",
        pills: ["إدارة عمليات", "مراجعات تقنية", "تصميم مواقع", "استشارات لوجستية", "محتوى رقمي", "حلول ذكية"],
        galleryTitle: "لقطات من الحياة",
        gallerySub: "لحظات من العمل والمحتوى والحياة اليومية",
        skillsTitle: "المهارات",
        skillsSub: "خبرات عملية حقيقية",
        skills: [
            { icon: "📦", title: "لوجستيات", body: "إدارة عمليات التسليم والتوزيع بكفاءة عالية.", tags: ["TMS", "التخطيط", "التنسيق"] },
            { icon: "🎬", title: "محتوى تقني", body: "مراجعات صادقة وفيديوهات احترافية على يوتيوب.", tags: ["YouTube", "مراجعات", "تصوير"] },
            { icon: "💻", title: "حلول رقمية", body: "تصميم مواقع وأدوات رقمية تخدم الأعمال.", tags: ["Next.js", "React", "تصميم"] },
            { icon: "🤝", title: "استشارات", body: "مساعدة الشركات في تنظيم عملياتها وتحسين أدائها.", tags: ["تخطيط", "تحليل", "تطوير"] },
        ],
        servicesTitle: "الخدمات",
        servicesSub: "ثلاث محاور أساسية أعمل عليها",
        services: [
            { title: "محتوى تقني", body: "مراجعات صادقة ومفصلة للمنتجات التقنية مع تصوير احترافي.", chips: ["يوتيوب", "مراجعات", "Unboxing"] },
            { title: "خدمات لوجستية", body: "استشارات وحلول لتنظيم عمليات التسليم والتشغيل.", chips: ["إدارة", "تخطيط", "تنسيق"] },
            { title: "حلول رقمية", body: "تصميم مواقع وصفحات هبوط بتصميم عصري وأنيق.", chips: ["تصميم", "برمجة", "تطوير"] },
        ],
        faqTitle: "أسئلة شائعة",
        faqItems: [
            { q: "كيف أتواصل معك؟", a: "يمكنك التواصل عبر واتساب، تليغرام، أو نموذج التواصل في صفحة Contact." },
            { q: "هل تقبل تعاون محتوى؟", a: "نعم، إذا كان المنتج مناسب وحقيقي، أرحب بالتعاون." },
            { q: "هل تقدم خدمات تصميم مواقع؟", a: "نعم، أصمم مواقع بسيطة وأنيقة باستخدام أحدث التقنيات." },
        ],
        ctaTitle: "جاهز نشتغل سوا؟",
        ctaBody: "سواء كنت تبحث عن استشارة، تعاون محتوى، أو حل رقمي — راسلني الآن.",
    },
    en: {
        kicker: "Hi, I'm Mohammad Alfarras",
        name: "Mohammad Alfarras",
        heroTitle: "Operations · Content · Digital Solutions",
        heroBody: "I manage last-mile delivery at Rhenus Home Delivery, build a YouTube channel, and create digital projects all with the same mindset: clarity, detail, and polished execution.",
        taglines: ["📦 Smart Logistics", "🎬 Honest Content", "💻 Digital Solutions", "🚀 Pro Execution"],
        ctaPrimary: "Contact me",
        ctaSecondary: "YouTube",
        ctaCV: "My CV",
        pillsTitle: "What I do",
        pills: ["Operations", "Tech Reviews", "Web Design", "Logistics Consulting", "Digital Content", "Smart Solutions"],
        galleryTitle: "Snapshots",
        gallerySub: "Moments from work, content, and everyday life",
        skillsTitle: "Skills",
        skillsSub: "Real-world experience",
        skills: [
            { icon: "📦", title: "Logistics", body: "Managing delivery and distribution operations efficiently.", tags: ["TMS", "Planning", "Coordination"] },
            { icon: "🎬", title: "Tech Content", body: "Honest reviews and professional videos on YouTube.", tags: ["YouTube", "Reviews", "Production"] },
            { icon: "💻", title: "Digital Solutions", body: "Building websites and digital tools for businesses.", tags: ["Next.js", "React", "Design"] },
            { icon: "🤝", title: "Consulting", body: "Helping companies organise operations and improve performance.", tags: ["Planning", "Analysis", "Growth"] },
        ],
        servicesTitle: "Services",
        servicesSub: "Three core pillars I work on",
        services: [
            { title: "Tech Content", body: "Honest, detailed product reviews with professional production.", chips: ["YouTube", "Reviews", "Unboxing"] },
            { title: "Logistics Services", body: "Consulting and solutions for delivery and operations management.", chips: ["Management", "Planning", "Coordination"] },
            { title: "Digital Solutions", body: "Modern, elegant websites and landing pages.", chips: ["Design", "Development", "Web"] },
        ],
        faqTitle: "FAQ",
        faqItems: [
            { q: "How can I reach you?", a: "You can reach me via WhatsApp, Telegram, or the contact form on the Contact page." },
            { q: "Do you accept content collaborations?", a: "Yes, if the product is genuine and relevant, I'm happy to collaborate." },
            { q: "Do you offer web design services?", a: "Yes, I design clean, modern websites using the latest technologies." },
        ],
        ctaTitle: "Ready to work together?",
        ctaBody: "Whether you need consulting, content collaboration, or a digital solution — reach out now.",
    },
};

const galleryImages = [
    "/images/00.jpeg", "/images/000.jpeg", "/images/11.jpeg", "/images/22.jpeg",
    "/images/33.jpeg", "/images/44.jpeg", "/images/77.jpeg", "/images/88.jpeg",
];

const particles = Array.from({ length: 12 }, () => ({
    size: 4 + Math.random() * 8,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 4,
}));

export function HomePage({ locale, page, snapshot, videos }: { locale: "ar" | "en"; page: PageView; snapshot: CmsSnapshot; videos: YoutubeVideo[] }) {
    const tx = content[locale];
    const dir = locale === "ar" ? "rtl" : "ltr";
    const [taglineIdx, setTaglineIdx] = useState(0);

    useEffect(() => {
        const obs = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("revealed")),
            { threshold: 0.1 }
        );
        document.querySelectorAll(".reveal-item").forEach((el) => obs.observe(el));
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setTaglineIdx((i) => (i + 1) % tx.taglines.length), 2500);
        return () => clearInterval(timer);
    }, [tx.taglines.length]);

    return (
        <div className="home-page-full" dir={dir}>
            {/* Particles */}
            <div className="home-particles" aria-hidden>
                {particles.map((p, i) => (
                    <span
                        key={i}
                        className="particle"
                        style={{
                            width: p.size, height: p.size,
                            left: `${p.x}%`, top: `${p.y}%`,
                            ["--duration" as string]: `${p.duration}s`,
                            ["--delay" as string]: `${p.delay}s`,
                        }}
                    />
                ))}
            </div>

            {/* â”€â”€â”€ HERO â”€â”€â”€ */}
            <section className="home-hero">
                <div className="home-hero-inner">
                    {/* Left */}
                    <div className="hero-stack reveal-item">
                        <div className="home-hero-eyebrow">
                            <span className="home-hero-dot" />
                            {tx.kicker}
                        </div>
                        <h1 className="home-hero-title">
                            <span className="gradient-text">{tx.name}</span>
                            <br />
                            <span style={{ whiteSpace: "pre-line", fontSize: "0.6em", fontWeight: 700, color: "var(--text)" }}>
                                {tx.heroTitle}
                            </span>
                        </h1>
                        <p className="home-hero-para">{tx.heroBody}</p>
                        <div className="home-tagline-wrap">
                            <span className="home-tagline-text">{tx.taglines[taglineIdx]}</span>
                        </div>
                        <div className="home-hero-actions">
                            <Link href={`/${locale}/contact`} className="btn primary">{tx.ctaPrimary}</Link>
                            <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="btn secondary">â–¶ {tx.ctaSecondary}</a>
                            <Link href={`/${locale}/cv`} className="btn ghost">{tx.ctaCV}</Link>
                        </div>
                        {/* Social quick row */}
                        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
                            {[
                                { emoji: "ðŸ’¬", href: socialLinks.whatsapp, label: "WhatsApp" },
                                { emoji: "ðŸ“·", href: socialLinks.instagram, label: "Instagram" },
                                { emoji: "âœˆï¸", href: socialLinks.telegram, label: "Telegram" },
                                { emoji: "ðŸ’¼", href: socialLinks.linkedin, label: "LinkedIn" },
                            ].map((s) => (
                                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                                    title={s.label}
                                    style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface-glass)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", backdropFilter: "blur(10px)", transition: "all 0.2s", textDecoration: "none" }}>
                                    {s.emoji}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Right â€” Portrait */}
                    <div className="home-hero-media reveal-item" data-delay="2">
                        <div className="portrait-container">
                            <div className="portrait-ring" />
                            <div className="portrait-ring-2" />
                            <div className="portrait-glow" />
                            <div className="portrait-img-wrap">
                                <Image src="/images/portrait.jpg" alt="Mohammad Alfarras" fill style={{ objectFit: "cover" }} priority />
                            </div>
                            {/* Floating Badges */}
                            <div className="portrait-floaters">
                                <span className="portrait-badge badge-subs">ðŸ“º 6,060 Subs</span>
                                <span className="portrait-badge badge-vids">ðŸŽ¬ 162 Videos</span>
                                <span className="portrait-badge badge-views">ðŸ‘ +100K Views</span>
                            </div>
                        </div>
                        <p className="portrait-sig">Mohammad Alfarras â€” Ù…Ø­Ù…Ø¯ Ø§Ù„ÙØ±Ø§Ø³</p>
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ PILLS â”€â”€â”€ */}
            <section className="home-pills-section">
                <div className="container">
                    <div className="home-pills-wrap">
                        {tx.pills.map((p) => (
                            <span key={p} className="home-pill reveal-item">{p}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ GALLERY â”€â”€â”€ */}
            <section className="home-gallery-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-kicker">ðŸ“¸ {tx.galleryTitle}</span>
                        <h2 className="section-title">{tx.gallerySub}</h2>
                    </div>
                    <div className="home-gallery-grid">
                        {galleryImages.map((src, i) => (
                            <div key={src} className="home-gallery-item reveal-item" data-delay={String(i % 4)}>
                                <Image src={src} alt={`Gallery ${i + 1}`} fill style={{ objectFit: "cover" }} loading="lazy" />
                                <div className="home-gallery-overlay">ðŸ”</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ SKILLS â”€â”€â”€ */}
            <section className="home-skills-section">
                <div className="container">
                    <div className="section-header reveal-item">
                        <span className="section-kicker">ðŸ’¡ {tx.skillsTitle}</span>
                        <h2 className="section-title">{tx.skillsSub}</h2>
                    </div>
                    <div className="home-skills-grid">
                        {tx.skills.map((sk, i) => (
                            <div key={sk.title} className="home-skill-card glass reveal-item" data-delay={String(i % 4)}>
                                <div className="home-skill-icon">{sk.icon}</div>
                                <h3 className="home-skill-title">{sk.title}</h3>
                                <p className="home-skill-text">{sk.body}</p>
                                <div className="home-skill-tags">
                                    {sk.tags.map((t) => <span key={t} className="home-skill-tag">{t}</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ SERVICES â”€â”€â”€ */}
            <section className="home-services-section">
                <div className="container">
                    <div className="section-header reveal-item">
                        <span className="section-kicker">ðŸ› ï¸ {tx.servicesTitle}</span>
                        <h2 className="section-title">{tx.servicesSub}</h2>
                    </div>
                    <div className="home-services-grid">
                        {tx.services.map((svc, i) => (
                            <div key={svc.title} className="home-service-card glass reveal-item" data-delay={String(i)}>
                                <div className="home-service-img">
                                    <Image src={i === 0 ? "/images/service_tech.png" : i === 1 ? "/images/service_logistics.png" : "/images/service_web.png"}
                                        alt={svc.title} fill style={{ objectFit: "cover" }} loading="lazy" />
                                </div>
                                <div className="home-service-body">
                                    <h3>{svc.title}</h3>
                                    <p>{svc.body}</p>
                                    <div className="home-service-chips">
                                        {svc.chips.map((c) => <span key={c} className="home-service-chip">{c}</span>)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ FAQ â”€â”€â”€ */}
            <section className="home-faq-section">
                <div className="container">
                    <div className="section-header reveal-item">
                        <span className="section-kicker">â“ {tx.faqTitle}</span>
                    </div>
                    <div className="home-faq-list">
                        {tx.faqItems.map((item) => (
                            <details key={item.q} className="home-faq-item reveal-item">
                                <summary>{item.q}</summary>
                                <p>{item.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ CTA â”€â”€â”€ */}
            <section className="home-cta-section">
                <div className="container">
                    <div className="home-cta-card glass reveal-item">
                        <h2 className="gradient-text">{tx.ctaTitle}</h2>
                        <p>{tx.ctaBody}</p>
                        <div className="home-cta-btns">
                            <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="btn primary">ðŸ’¬ WhatsApp</a>
                            <Link href={`/${locale}/contact`} className="btn secondary">âœ‰ï¸ {locale === "ar" ? "ØªÙˆØ§ØµÙ„" : "Contact"}</Link>
                            <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="btn ghost">â–¶ YouTube</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}


