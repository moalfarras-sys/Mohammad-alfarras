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
        kicker: "Ù…Ø±Ø­Ø¨Ø§Ù‹ØŒ Ø£Ù†Ø§",
        name: "Ù…Ø­Ù…Ø¯ Ø§Ù„ÙØ±Ø§Ø³",
        heroTitle: "Ø®Ø¨ÙŠØ± Ù…Ù†ØªØ¬Ø§Øª ØªÙ‚Ù†ÙŠØ©\nÙˆÙ…Ù†Ø³Ù‚ Ù„ÙˆØ¬Ø³ØªÙŠ",
        heroBody: "Ù…Ù† Ø§Ù„Ø­Ø³ÙƒØ© â€” Ø¹Ø¨Ø± Ø£ÙˆØ±ÙˆØ¨Ø§ Ø¥Ù„Ù‰ Ø´Ø§Ø´ØªÙƒ. Ø£Ø´ØªØºÙ„ ÙÙŠ Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠÙƒ Ø¨Ø£Ù„Ù…Ø§Ù†ÙŠØ§ ÙˆØ£ØªØ®ØµØµ Ø¨Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø¹Ù„Ù‰ ÙŠÙˆØªÙŠÙˆØ¨ Ø¨Ø£Ù…Ø§Ù†Ø© Ø¨Ø¯ÙˆÙ† Ù…Ø¨Ø§Ù„ØºØ©.",
        taglines: ["162 ÙÙŠØ¯ÙŠÙˆ ØªÙ‚Ù†ÙŠ ðŸŽ¬", "6,060 Ù…Ø´ØªØ±Ùƒ ðŸ“º", "Ù…Ø±Ø§Ø¬Ø¹Ø§Øª ØµØ§Ø¯Ù‚Ø© ðŸ’¯", "Ù„ÙˆØ¬Ø³ØªÙŠ Ù…Ø­ØªØ±Ù ðŸš›", "Ù…Ø­ØªÙˆÙ‰ Ù…Ù† Ø£Ù„Ù…Ø§Ù†ÙŠØ§ ðŸ‡©ðŸ‡ª"],
        ctaPrimary: "ØªÙˆØ§ØµÙ„ Ù…Ø¹ÙŠ",
        ctaSecondary: "Ø´Ø§Ù‡Ø¯ Ø§Ù„Ù‚Ù†Ø§Ø©",
        ctaCV: "Ø§Ù„Ø³ÙŠØ±Ø© Ø§Ù„Ø°Ø§ØªÙŠØ©",
        pillsTitle: "Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„Ø¹Ù…Ù„",
        pills: ["ðŸ“¦ Ù…Ø±Ø§Ø¬Ø¹Ø§Øª ØªÙ‚Ù†ÙŠØ©", "ðŸš› Ù„ÙˆØ¬Ø³ØªÙŠÙƒ ÙˆØ´Ø­Ù†", "ðŸ§  Ù…Ø­ØªÙˆÙ‰ ØªØ¹Ù„ÙŠÙ…ÙŠ", "ðŸ“± Ø£Ø¬Ù‡Ø²Ø© Ø°ÙƒÙŠØ©", "ðŸ”§ Ù…Ø´Ø§Ø±ÙŠØ¹ DIY", "ðŸŒ Ø®Ø¨Ø±Ø© Ø£ÙˆØ±ÙˆØ¨ÙŠØ©"],
        galleryTitle: "Ù…Ù† ÙŠÙˆÙ…ÙŠØ§ØªÙŠ",
        gallerySub: "ØµÙˆØ± Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ù† Ø¹Ù…Ù„ÙŠ ÙˆØ­ÙŠØ§ØªÙŠ",
        skillsTitle: "Ù…Ø§ Ø£Ù‚Ø¯Ù…Ù‡",
        skillsSub: "Ù…Ù‡Ø§Ø±Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ ØªØ¬Ø±Ø¨Ø© ÙØ¹Ù„ÙŠØ©",
        skills: [
            { icon: "ðŸ“¦", title: "Ù…Ø±Ø§Ø¬Ø¹Ø§Øª ØªÙ‚Ù†ÙŠØ©", body: "162 Ù…Ø±Ø§Ø¬Ø¹Ø© Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù„Ù…Ù†ØªØ¬Ø§Øª ØªÙ‚Ù†ÙŠØ© Ø¨Ø¯ÙˆÙ† Ù…Ø¨Ø§Ù„ØºØ©. Ø£Ø®ØªØ¨Ø± ÙˆØ£Ø¬Ø±Ø¨ ÙˆØ£Ø´Ø§Ø±Ùƒ ØªØ¬Ø±Ø¨ØªÙŠ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØ©.", tags: ["ÙŠÙˆØªÙŠÙˆØ¨", "ØªÙ‚Ù†ÙŠØ©", "Ù…Ø±Ø§Ø¬Ø¹Ø§Øª"] },
            { icon: "ðŸš›", title: "Ù„ÙˆØ¬Ø³ØªÙŠÙƒ ÙˆØªØ®Ø·ÙŠØ·", body: "Ø®Ø¨Ø±Ø© ÙÙŠ Ø´Ø±ÙƒØ§Øª Rhenus Ùˆ IKEA Ø¨Ø£Ù„Ù…Ø§Ù†ÙŠØ§. ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø´Ø­Ù†Ø§Øª ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø³Ø§Ø¦Ù‚ÙŠÙ† ÙˆØ§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ©.", tags: ["Rhenus", "IKEA", "Ù„ÙˆØ¬Ø³ØªÙŠÙƒ"] },
            { icon: "ðŸ’»", title: "ÙˆÙŠØ¨ ÙˆØ®Ø¯Ù…Ø§Øª Ø±Ù‚Ù…ÙŠØ©", body: "ØªØµÙ…ÙŠÙ… ÙˆØªØ·ÙˆÙŠØ± Ù…ÙˆØ§Ù‚Ø¹ Ø§Ø­ØªØ±Ø§ÙÙŠØ©. Ø­Ù„ÙˆÙ„ Ø±Ù‚Ù…ÙŠØ© Ù„Ø£ØµØ­Ø§Ø¨ Ø§Ù„Ø£Ø¹Ù…Ø§Ù„.", tags: ["ÙˆÙŠØ¨", "Ø±Ù‚Ù…ÙŠ", "ØªØ·ÙˆÙŠØ±"] },
            { icon: "ðŸ¤", title: "ØªØ¹Ø§ÙˆÙ† ÙˆØ´Ø±Ø§ÙƒØ§Øª", body: "Ù…Ù†ÙØªØ­ Ù„Ù„ØªØ¹Ø§ÙˆÙ† Ù…Ø¹ Ø§Ù„Ø´Ø±ÙƒØ§Øª ÙˆØ§Ù„Ø¹Ù„Ø§Ù…Ø§Øª Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ©. ØªÙˆØ§ØµÙ„ API Ù…Ø¹ÙŠ Ù„Ø´Ø±Ø§ÙƒØ§Øª Ù…Ø«Ù…Ø±Ø©.", tags: ["Ø´Ø±Ø§ÙƒØ©", "Ø¹Ù„Ø§Ù…Ø§Øª", "ØªØ¹Ø§ÙˆÙ†"] },
        ],
        servicesTitle: "Ø§Ù„Ø®Ø¯Ù…Ø§Øª",
        servicesSub: "Ù…Ø§ Ø£Ù‚Ø¯Ù…Ù‡ Ù„Ùƒ Ø£Ùˆ Ù„Ø´Ø±ÙƒØªÙƒ",
        services: [
            { title: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ù…Ù†ØªØ¬Ø§Øª ØªÙ‚Ù†ÙŠØ©", body: "Ù…Ø±Ø§Ø¬Ø¹Ø© Ù…Ù†ØªØ¬Ùƒ Ø¹Ù„Ù‰ Ù‚Ù†Ø§ØªÙŠ Ø¨Ø£Ù…Ø§Ù†Ø© ÙˆÙ…Ù‡Ù†ÙŠØ©", chips: ["ÙŠÙˆØªÙŠÙˆØ¨", "6K+ Ù…ØªØ§Ø¨Ø¹"] },
            { title: "Ø§Ø³ØªØ´Ø§Ø±Ø© Ù„ÙˆØ¬Ø³ØªÙŠØ©", body: "Ø§Ø³ØªØ´Ø§Ø±Ø§Øª ÙÙŠ Ø§Ù„ØªØ®Ø·ÙŠØ· Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø´Ø­Ù†Ø§Øª", chips: ["Ø´Ø­Ù†", "ØªØ®Ø·ÙŠØ·"] },
            { title: "ØªØ·ÙˆÙŠØ± Ù…ÙˆÙ‚Ø¹ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", body: "ØªØµÙ…ÙŠÙ… ÙˆØ¨Ø±Ù…Ø¬Ø© Ù…ÙˆÙ‚Ø¹Ùƒ Ø§Ù„Ø§Ø­ØªØ±Ø§ÙÙŠ", chips: ["Next.js", "React"] },
        ],
        faqTitle: "Ø£Ø³Ø¦Ù„Ø© Ø´Ø§Ø¦Ø¹Ø©",
        faqItems: [
            { q: "Ù…Ø§ Ù‡ÙŠ Ù…Ø¬Ø§Ù„Ø§Øª ØªØ®ØµØµÙƒØŸ", a: "Ø£ØªØ®ØµØµ ÙÙŠ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ© Ø¹Ù„Ù‰ ÙŠÙˆØªÙŠÙˆØ¨ØŒ ÙˆØ§Ù„Ù„ÙˆØ¬Ø³ØªÙŠÙƒ Ø¨Ø£Ù„Ù…Ø§Ù†ÙŠØ§ØŒ ÙˆØªØ·ÙˆÙŠØ± Ø§Ù„ÙˆÙŠØ¨. Ø®Ø¨Ø±Ø© Ø¹Ù…Ù„ÙŠØ© ÙÙŠ Rhenus ÙˆIKEA Ø£Ù„Ù…Ø§Ù†ÙŠØ§." },
            { q: "ÙƒÙŠÙ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ¹Ø§ÙˆÙ† Ù…Ø¹ÙƒØŸ", a: "ÙŠÙ…ÙƒÙ†Ùƒ Ø§Ù„ØªÙˆØ§ØµÙ„ Ø¹Ø¨Ø± WhatsApp Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ. Ù…Ù†ÙØªØ­ Ù„Ù…Ø±Ø§Ø¬Ø¹Ø§Øª Ø§Ù„Ù…Ù†ØªØ¬Ø§ØªØŒ Ø´Ø±Ø§ÙƒØ§Øª Ø§Ù„Ù…Ø­ØªÙˆÙ‰ØŒ ÙˆØ§Ù„Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ©." },
            { q: "Ù…Ø§ Ù‡Ùˆ Ù…Ø­ØªÙˆÙ‰ Ù‚Ù†Ø§ØªÙƒ Ø¹Ù„Ù‰ ÙŠÙˆØªÙŠÙˆØ¨ØŸ", a: "162 ÙÙŠØ¯ÙŠÙˆ Ù…Ø±Ø§Ø¬Ø¹Ø© Ù„Ù…Ù†ØªØ¬Ø§Øª ØªÙ‚Ù†ÙŠØ© Ù…ØªÙ†ÙˆØ¹Ø© â€” Ø³Ù…Ø§Ø¹Ø§ØªØŒ Ù…ÙƒØ§Ù†Ø³ØŒ Ø´Ø§Ø´Ø§ØªØŒ Ø£Ø¬Ù‡Ø²Ø© ØµÙˆØªØŒ ÙˆÙ…Ø²ÙŠØ¯. 6,060 Ù…Ø´ØªØ±Ùƒ ÙˆÙ…Ø³ØªÙ…Ø±ÙˆÙ†." },
            { q: "ÙÙŠ Ø£ÙŠ Ø¯ÙˆÙ„Ø© Ø£Ù†Øª Ù…Ù‚ÙŠÙ…ØŸ", a: "Ø£Ù‚ÙŠÙ… ÙÙŠ Ø£Ù„Ù…Ø§Ù†ÙŠØ§ ÙˆØ£Ø¹Ù…Ù„ ÙÙŠ Ø´Ø±ÙƒØ§Øª Ù„ÙˆØ¬Ø³ØªÙŠØ© Ø£Ù„Ù…Ø§Ù†ÙŠØ© Ù…Ø¹ Ø§Ø³ØªÙ…Ø±Ø§Ø±ÙŠ Ø¨Ù†Ø´Ø± Ù…Ø­ØªÙˆÙ‰ ØªÙ‚Ù†ÙŠ Ø¨Ø§Ù„Ù„ØºØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©." },
            { q: "Ù‡Ù„ ØªÙ‚Ø¯Ù… Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ù…Ø¯ÙÙˆØ¹Ø©ØŸ", a: "Ù†Ø¹Ù…ØŒ Ø£Ù‚Ø¯Ù… Ø§Ø³ØªØ´Ø§Ø±Ø§Øª ÙÙŠ Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠÙƒ ÙˆØªØ·ÙˆÙŠØ± Ø§Ù„ÙˆÙŠØ¨. ØªÙˆØ§ØµÙ„ Ù…Ø¹ÙŠ Ù„Ù„ØªÙØ§ØµÙŠÙ„." },
        ],
        ctaTitle: "Ù‡Ù„ Ù„Ø¯ÙŠÙƒ ÙÙƒØ±Ø© Ø£Ùˆ Ù…Ø´Ø±ÙˆØ¹ØŸ",
        ctaBody: "Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª ØªØ±ÙŠØ¯ Ù…Ø±Ø§Ø¬Ø¹Ø© Ù…Ù†ØªØ¬ÙƒØŒ Ø´Ø±Ø§ÙƒØ© ÙÙŠ Ù…Ø­ØªÙˆÙ‰ØŒ Ø£Ùˆ ØªØ·ÙˆÙŠØ± Ù…ÙˆÙ‚Ø¹ â€” Ø£Ù†Ø§ Ù‡Ù†Ø§.",
    },
    en: {
        kicker: "Hi, I'm",
        name: "Mohammad Alfarras",
        heroTitle: "Tech Product Expert\n& Logistics Coordinator",
        heroBody: "From Hasakah â€” through Europe to your screen. I work in logistics in Germany and specialize in honest tech product reviews on YouTube.",
        taglines: ["162 Tech Videos ðŸŽ¬", "6,060 Subscribers ðŸ“º", "Honest Reviews ðŸ’¯", "Professional Logistics ðŸš›", "Content from Germany ðŸ‡©ðŸ‡ª"],
        ctaPrimary: "Contact Me",
        ctaSecondary: "Watch Channel",
        ctaCV: "My CV",
        pillsTitle: "Fields of work",
        pills: ["ðŸ“¦ Tech Reviews", "ðŸš› Logistics", "ðŸ§  Educational Content", "ðŸ“± Smart Devices", "ðŸ”§ DIY Projects", "ðŸŒ European Experience"],
        galleryTitle: "My Daily Life",
        gallerySub: "Real photos from my work and life",
        skillsTitle: "What I Offer",
        skillsSub: "Real skills built on real experience",
        skills: [
            { icon: "ðŸ“¦", title: "Tech Reviews", body: "162 honest tech product reviews. I test, try, and share my genuine experience â€” no exaggeration.", tags: ["YouTube", "Tech", "Reviews"] },
            { icon: "ðŸš›", title: "Logistics & Planning", body: "Experience at Rhenus and IKEA Germany. Coordinating shipments, driver management, and logistics services.", tags: ["Rhenus", "IKEA", "Logistics"] },
            { icon: "ðŸ’»", title: "Web & Digital Services", body: "Professional website design and development. Digital solutions for business owners.", tags: ["Web", "Digital", "Dev"] },
            { icon: "ðŸ¤", title: "Collaboration", body: "Open for collaboration with companies and brands. Contact me for fruitful partnerships.", tags: ["Partnership", "Brands", "Collab"] },
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
            { q: "What's on your YouTube channel?", a: "162 videos reviewing diverse tech products â€” headphones, vacuums, screens, audio devices, and more. 6,060 subscribers and growing." },
            { q: "Where are you based?", a: "I'm based in Germany, working for German logistics companies while continuing to publish Arabic tech content." },
            { q: "Do you offer paid consultations?", a: "Yes, I offer logistics and web development consultations. Contact me for details." },
        ],
        ctaTitle: "Have an idea or project?",
        ctaBody: "Whether you want a product review, content partnership, or website development â€” I'm here.",
    },
};

const galleryImages = [
    "/images/00.jpeg", "/images/000.jpeg", "/images/11.jpeg", "/images/22.jpeg",
    "/images/33.jpeg", "/images/44.jpeg", "/images/77.jpeg", "/images/88.jpeg",
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

