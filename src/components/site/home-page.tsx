"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const socialLinks = {
    whatsapp: "https://wa.me/4917645678923",
    telegram: "https://t.me/moalfarras",
    instagram: "https://www.instagram.com/moalfarras",
    youtube: "https://www.youtube.com/@Moalfarras",
    linkedin: "https://linkedin.com/in/mohammad-alfarras",
    github: "https://github.com/moalfarras-sys",
    facebook: "https://www.facebook.com/moalfarras",
};

const content = {
    ar: {
        kicker: "مرحباً، أنا",
        name: "محمد الفراس",
        heroTitle: "خبير منتجات تقنية\nومنسق لوجستي",
        heroBody: "من الحسكة — عبر أوروبا إلى شاشتك. أشتغل في اللوجستيك بألمانيا وأتخصص بمراجعة المنتجات التقنية على يوتيوب بأمانة بدون مبالغة.",
        taglines: ["162 فيديو تقني 🎬", "6,060 مشترك 📺", "مراجعات صادقة 💯", "لوجستي محترف 🚛", "محتوى من ألمانيا 🇩🇪"],
        ctaPrimary: "تواصل معي",
        ctaSecondary: "شاهد القناة",
        ctaCV: "السيرة الذاتية",
        pillsTitle: "مجالات العمل",
        pills: ["📦 مراجعات تقنية", "🚛 لوجستيك وشحن", "🧠 محتوى تعليمي", "📱 أجهزة ذكية", "🔧 مشاريع DIY", "🌍 خبرة أوروبية"],
        galleryTitle: "من يومياتي",
        gallerySub: "صور حقيقية من عملي وحياتي",
        skillsTitle: "ما أقدمه",
        skillsSub: "مهارات حقيقية مبنية على تجربة فعلية",
        skills: [
            { icon: "📦", title: "مراجعات تقنية", body: "162 مراجعة حقيقية لمنتجات تقنية بدون مبالغة. أختبر وأجرب وأشارك تجربتي الحقيقية.", tags: ["يوتيوب", "تقنية", "مراجعات"] },
            { icon: "🚛", title: "لوجستيك وتخطيط", body: "خبرة في شركات Rhenus و IKEA بألمانيا. تنسيق الشحنات وإدارة السائقين والخدمات اللوجستية.", tags: ["Rhenus", "IKEA", "لوجستيك"] },
            { icon: "💻", title: "ويب وخدمات رقمية", body: "تصميم وتطوير مواقع احترافية. حلول رقمية لأصحاب الأعمال.", tags: ["ويب", "رقمي", "تطوير"] },
            { icon: "🤝", title: "تعاون وشراكات", body: "منفتح للتعاون مع الشركات والعلامات التجارية. تواصل API معي لشراكات مثمرة.", tags: ["شراكة", "علامات", "تعاون"] },
        ],
        servicesTitle: "الخدمات",
        servicesSub: "ما أقدمه لك أو لشركتك",
        services: [
            { title: "مراجعة منتجات تقنية", body: "مراجعة منتجك على قناتي بأمانة ومهنية", chips: ["يوتيوب", "6K+ متابع"] },
            { title: "استشارة لوجستية", body: "استشارات في التخطيط اللوجستي وإدارة الشحنات", chips: ["شحن", "تخطيط"] },
            { title: "تطوير موقع إلكتروني", body: "تصميم وبرمجة موقعك الاحترافي", chips: ["Next.js", "React"] },
        ],
        faqTitle: "أسئلة شائعة",
        faqItems: [
            { q: "ما هي مجالات تخصصك؟", a: "أتخصص في مراجعة المنتجات التقنية على يوتيوب، واللوجستيك بألمانيا، وتطوير الويب. خبرة عملية في Rhenus وIKEA ألمانيا." },
            { q: "كيف يمكن التعاون معك؟", a: "يمكنك التواصل عبر WhatsApp أو البريد الإلكتروني. منفتح لمراجعات المنتجات، شراكات المحتوى، والاستشارات اللوجستية." },
            { q: "ما هو محتوى قناتك على يوتيوب؟", a: "162 فيديو مراجعة لمنتجات تقنية متنوعة — سماعات، مكانس، شاشات، أجهزة صوت، ومزيد. 6,060 مشترك ومستمرون." },
            { q: "في أي دولة أنت مقيم؟", a: "أقيم في ألمانيا وأعمل في شركات لوجستية ألمانية مع استمراري بنشر محتوى تقني باللغة العربية." },
            { q: "هل تقدم استشارات مدفوعة؟", a: "نعم، أقدم استشارات في اللوجستيك وتطوير الويب. تواصل معي للتفاصيل." },
        ],
        ctaTitle: "هل لديك فكرة أو مشروع؟",
        ctaBody: "سواء كنت تريد مراجعة منتجك، شراكة في محتوى، أو تطوير موقع — أنا هنا.",
    },
    en: {
        kicker: "Hi, I'm",
        name: "Mohammad Alfarras",
        heroTitle: "Tech Product Expert\n& Logistics Coordinator",
        heroBody: "From Hasakah — through Europe to your screen. I work in logistics in Germany and specialize in honest tech product reviews on YouTube.",
        taglines: ["162 Tech Videos 🎬", "6,060 Subscribers 📺", "Honest Reviews 💯", "Professional Logistics 🚛", "Content from Germany 🇩🇪"],
        ctaPrimary: "Contact Me",
        ctaSecondary: "Watch Channel",
        ctaCV: "My CV",
        pillsTitle: "Fields of work",
        pills: ["📦 Tech Reviews", "🚛 Logistics", "🧠 Educational Content", "📱 Smart Devices", "🔧 DIY Projects", "🌍 European Experience"],
        galleryTitle: "My Daily Life",
        gallerySub: "Real photos from my work and life",
        skillsTitle: "What I Offer",
        skillsSub: "Real skills built on real experience",
        skills: [
            { icon: "📦", title: "Tech Reviews", body: "162 honest tech product reviews. I test, try, and share my genuine experience — no exaggeration.", tags: ["YouTube", "Tech", "Reviews"] },
            { icon: "🚛", title: "Logistics & Planning", body: "Experience at Rhenus and IKEA Germany. Coordinating shipments, driver management, and logistics services.", tags: ["Rhenus", "IKEA", "Logistics"] },
            { icon: "💻", title: "Web & Digital Services", body: "Professional website design and development. Digital solutions for business owners.", tags: ["Web", "Digital", "Dev"] },
            { icon: "🤝", title: "Collaboration", body: "Open for collaboration with companies and brands. Contact me for fruitful partnerships.", tags: ["Partnership", "Brands", "Collab"] },
        ],
        servicesTitle: "Services",
        servicesSub: "What I offer you or your company",
        services: [
            { title: "Tech Product Review", body: "Honest and professional review of your product on my channel", chips: ["YouTube", "6K+ Subs"] },
            { title: "Logistics Consulting", body: "Planning logistics and shipment management consulting", chips: ["Shipping", "Planning"] },
            { title: "Website Development", body: "Design and develop your professional website", chips: ["Next.js", "React"] },
        ],
        faqTitle: "Frequently Asked Questions",
        faqItems: [
            { q: "What are your areas of expertise?", a: "I specialize in YouTube tech product reviews, logistics in Germany, and web development. Real experience at Rhenus and IKEA Germany." },
            { q: "How can we collaborate?", a: "Contact me via WhatsApp or email. Open for product reviews, content partnerships, and logistics consulting." },
            { q: "What's on your YouTube channel?", a: "162 videos reviewing diverse tech products — headphones, vacuums, screens, audio devices, and more. 6,060 subscribers and growing." },
            { q: "Where are you based?", a: "I'm based in Germany, working for German logistics companies while continuing to publish Arabic tech content." },
            { q: "Do you offer paid consultations?", a: "Yes, I offer logistics and web development consultations. Contact me for details." },
        ],
        ctaTitle: "Have an idea or project?",
        ctaBody: "Whether you want a product review, content partnership, or website development — I'm here.",
    },
};

const galleryImages = [
    "/images/gallery-1.jpg", "/images/gallery-2.jpg", "/images/gallery-3.jpg", "/images/gallery-4.jpg",
    "/images/gallery-5.jpg", "/images/gallery-6.jpg", "/images/gallery-7.jpg", "/images/gallery-8.jpg",
];

const particles = Array.from({ length: 12 }, (_, i) => ({
    size: 4 + Math.random() * 8,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: 6 + Math.random() * 8,
    delay: Math.random() * 4,
}));

export function HomePage({ locale }: { locale: "ar" | "en" }) {
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

            {/* ─── HERO ─── */}
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
                            <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="btn secondary">▶ {tx.ctaSecondary}</a>
                            <Link href={`/${locale}/cv`} className="btn ghost">{tx.ctaCV}</Link>
                        </div>
                        {/* Social quick row */}
                        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
                            {[
                                { emoji: "💬", href: socialLinks.whatsapp, label: "WhatsApp" },
                                { emoji: "📷", href: socialLinks.instagram, label: "Instagram" },
                                { emoji: "✈️", href: socialLinks.telegram, label: "Telegram" },
                                { emoji: "💼", href: socialLinks.linkedin, label: "LinkedIn" },
                            ].map((s) => (
                                <a key={s.label} href={s.href} target="_blank" rel="noreferrer"
                                    title={s.label}
                                    style={{ width: 38, height: 38, borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface-glass)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", backdropFilter: "blur(10px)", transition: "all 0.2s", textDecoration: "none" }}>
                                    {s.emoji}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Right — Portrait */}
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
                                <span className="portrait-badge badge-subs">📺 6,060 Subs</span>
                                <span className="portrait-badge badge-vids">🎬 162 Videos</span>
                                <span className="portrait-badge badge-views">👁 +100K Views</span>
                            </div>
                        </div>
                        <p className="portrait-sig">Mohammad Alfarras — محمد الفراس</p>
                    </div>
                </div>
            </section>

            {/* ─── PILLS ─── */}
            <section className="home-pills-section">
                <div className="container">
                    <div className="home-pills-wrap">
                        {tx.pills.map((p) => (
                            <span key={p} className="home-pill reveal-item">{p}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── GALLERY ─── */}
            <section className="home-gallery-section">
                <div className="container">
                    <div className="section-header">
                        <span className="section-kicker">📸 {tx.galleryTitle}</span>
                        <h2 className="section-title">{tx.gallerySub}</h2>
                    </div>
                    <div className="home-gallery-grid">
                        {galleryImages.map((src, i) => (
                            <div key={src} className="home-gallery-item reveal-item" data-delay={String(i % 4)}>
                                <Image src={src} alt={`Gallery ${i + 1}`} fill style={{ objectFit: "cover" }} loading="lazy" />
                                <div className="home-gallery-overlay">🔍</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SKILLS ─── */}
            <section className="home-skills-section">
                <div className="container">
                    <div className="section-header reveal-item">
                        <span className="section-kicker">💡 {tx.skillsTitle}</span>
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

            {/* ─── SERVICES ─── */}
            <section className="home-services-section">
                <div className="container">
                    <div className="section-header reveal-item">
                        <span className="section-kicker">🛠️ {tx.servicesTitle}</span>
                        <h2 className="section-title">{tx.servicesSub}</h2>
                    </div>
                    <div className="home-services-grid">
                        {tx.services.map((svc, i) => (
                            <div key={svc.title} className="home-service-card glass reveal-item" data-delay={String(i)}>
                                <div className="home-service-img">
                                    <Image src={i === 0 ? "/images/service-tech.png" : i === 1 ? "/images/service-logistics.png" : "/images/service-web.png"}
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

            {/* ─── FAQ ─── */}
            <section className="home-faq-section">
                <div className="container">
                    <div className="section-header reveal-item">
                        <span className="section-kicker">❓ {tx.faqTitle}</span>
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

            {/* ─── CTA ─── */}
            <section className="home-cta-section">
                <div className="container">
                    <div className="home-cta-card glass reveal-item">
                        <h2 className="gradient-text">{tx.ctaTitle}</h2>
                        <p>{tx.ctaBody}</p>
                        <div className="home-cta-btns">
                            <a href={socialLinks.whatsapp} target="_blank" rel="noreferrer" className="btn primary">💬 WhatsApp</a>
                            <Link href={`/${locale}/contact`} className="btn secondary">✉️ {locale === "ar" ? "تواصل" : "Contact"}</Link>
                            <a href={socialLinks.youtube} target="_blank" rel="noreferrer" className="btn ghost">▶ YouTube</a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
