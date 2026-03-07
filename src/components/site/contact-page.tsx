"use client";

import { useEffect } from "react";
import Image from "next/image";

const contacts = [
    { href: "https://wa.me/4917623419358", ar: "ÙˆØ§ØªØ³Ø§Ø¨", en: "WhatsApp", ar_desc: "ØªÙˆØ§ØµÙ„ Ù…Ø¨Ø§Ø´Ø± ÙˆØ³Ø±ÙŠØ¹", en_desc: "Direct and quick contact", icon: "wa" },
    { href: "mailto:Mohammad.alfarras@gmail.com", ar: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", en: "Email", ar_desc: "Ø±Ø§Ø³Ù„Ù†ÙŠ Ù„Ø£ÙŠ ØªÙØ§ØµÙŠÙ„ Ø£Ùˆ ØªØ¹Ø§ÙˆÙ†", en_desc: "Message me for details or collaboration", icon: "mail" },
    { href: "https://de.linkedin.com/in/mohammad-alfarras-525531262", ar: "LinkedIn", en: "LinkedIn", ar_desc: "Ù…Ù„ÙÙŠ Ø§Ù„Ù…Ù‡Ù†ÙŠ ÙˆØ®Ø¨Ø±Ø§ØªÙŠ ÙÙŠ Ù…Ø¬Ø§Ù„ Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ§Øª", en_desc: "My professional profile and logistics experience", icon: "li" },
    { href: "https://github.com/moalfarras-sys", ar: "GitHub", en: "GitHub", ar_desc: "Ù…Ø´Ø§Ø±ÙŠØ¹ÙŠ Ø§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ© ÙˆØ§Ù„Ù…ÙˆØ§Ù‚Ø¹ Ø§Ù„ØªÙŠ Ø£Ø¹Ù…Ù„ Ø¹Ù„ÙŠÙ‡Ø§", en_desc: "My coding projects and websites", icon: "gh" },
    { href: "https://www.facebook.com/share/14TQSSocNQG/", ar: "Facebook", en: "Facebook", ar_desc: "Ù…Ø¬ØªÙ…Ø¹ÙŠ Ø§Ù„Ø´Ø®ØµÙŠ ÙˆÙ…Ù†Ø´ÙˆØ±Ø§Øª Ù…ØªÙ†ÙˆØ¹Ø©", en_desc: "My personal community and varied posts", icon: "fb" },
    { href: "https://www.youtube.com/@Moalfarras", ar: "YouTube", en: "YouTube", ar_desc: "Ø£ÙƒØ«Ø± Ù…Ù† 159 ÙÙŠØ¯ÙŠÙˆ Ù…Ù† Ø§Ù„Ø´ØºÙ„ ÙˆØ§Ù„Ø­ÙŠØ§Ø© ÙÙŠ Ø£Ù„Ù…Ø§Ù†ÙŠØ§", en_desc: "159+ videos from work and life in Germany", icon: "yt" },
    { href: "https://www.instagram.com/moalfarras", ar: "Instagram", en: "Instagram", ar_desc: "ØªØ§Ø¨Ø¹ Ù…Ø­ØªÙˆØ§ÙŠ Ø§Ù„ÙŠÙˆÙ…ÙŠ ÙˆØ£ÙÙƒØ§Ø±ÙŠ Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©", en_desc: "Follow my daily content and new ideas", icon: "ig" },
    { href: "https://t.me/MoalFarras", ar: "Telegram", en: "Telegram", ar_desc: "ØªÙˆØ§ØµÙ„ Ø³Ø±ÙŠØ¹ Ø¹Ø¨Ø± ØªÙ„ÙŠØºØ±Ø§Ù…", en_desc: "Quick contact via Telegram", icon: "tg" },
];

const testimonials = {
    ar: [
        { meta: "ØªØ¹Ù„ÙŠÙ‚ Ù…Ù† Ø²Ø§Ø¦Ø±", text: "Ø£Ø¹Ø¬Ø¨Ù†ÙŠ Ø£Ù† Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø®ÙÙŠÙ ÙˆÙˆØ§Ø¶Ø­ØŒ ÙˆÙƒÙ„ Ø´ÙŠØ¡ Ù…Ø±ØªØ¨ Ø¨Ø¯ÙˆÙ† Ø¥Ø¹Ù„Ø§Ù†Ø§Øª Ù…Ø²Ø¹Ø¬Ø©." },
        { meta: "Ù…ØªØ§Ø¨Ø¹ Ù…Ù† ÙŠÙˆØªÙŠÙˆØ¨", text: "Ù…Ø±Ø§Ø¬Ø¹Ø§ØªÙƒ ØµØ±ÙŠØ­Ø© ÙˆØªØªÙƒÙ„Ù… Ø¹Ù† Ø§Ù„Ø¹ÙŠÙˆØ¨ Ù‚Ø¨Ù„ Ø§Ù„Ù…Ù…ÙŠØ²Ø§Øª â€“ Ø§Ø³ØªÙ…Ø± Ø¹Ù„Ù‰ Ù‡Ø°Ø§ Ø§Ù„Ø£Ø³Ù„ÙˆØ¨." },
        { meta: "ØµØ§Ø­Ø¨ Ù…Ø´Ø±ÙˆØ¹ ØµØºÙŠØ±", text: "Ø³Ø§Ø¹Ø¯ØªÙ†ÙŠ Ø£ÙÙ‡Ù… Ø£ÙŠ Ù†ÙˆØ¹ ÙÙŠØ¯ÙŠÙˆ Ù…Ù†Ø§Ø³Ø¨ Ù„Ù…Ù†ØªØ¬ÙŠ ÙˆÙƒÙŠÙ Ø£Ø¬Ù‡Ø² Ù„Ù‡ Ø¨Ø¯ÙˆÙ† ØªÙƒØ§Ù„ÙŠÙ Ø¶Ø®Ù…Ø©." },
    ],
    en: [
        { meta: "Visitor comment", text: "I liked that the site is light and clear, everything is organised without annoying ads." },
        { meta: "YouTube follower", text: "Your reviews are honest and talk about flaws before features â€” keep up this style." },
        { meta: "Small business owner", text: "You helped me understand what type of video suits my product and how to set it up without big costs." },
    ],
};

const labels = {
    ar: {
        eyebrow: "ØªØ¹Ø§ÙˆÙ† Â· Ø§Ø³ØªØ´Ø§Ø±Ø© Â· ØªÙˆØ§ØµÙ„ Ù…Ø¨Ø§Ø´Ø±",
        heroTitle: "Ø®Ù„ÙŠÙ†Ø§ Ù†Ø´ØªØºÙ„ Ø³ÙˆØ§",
        heroSpan: "Ø±Ø­ Ù†Ø®Ù„Ù‚ Ø´ÙŠØ¡ ÙˆØ§Ù‚Ø¹ÙŠ",
        heroLead: "Ø³ÙˆØ§Ø¡ ÙƒÙ†Øª ØµØ§Ø­Ø¨ Ù…Ø´Ø±ÙˆØ¹ØŒ Ø´Ø±ÙƒØ©ØŒ Ø£Ùˆ Ø­ØªÙ‰ Ø´Ø®Øµ Ø¹Ù†Ø¯Ù‡ ÙÙƒØ±Ø© ØµØºÙŠØ±Ø©â€¦ Ø¥Ø°Ø§ Ø¨Ø¯Ùƒ Ø­Ø¯Ø§ ÙŠÙÙ‡Ù… Ø§Ù„Ù„ÙˆØ¬Ø³ØªÙŠØ§ØªØŒ Ø§Ù„ØªØ®Ø·ÙŠØ·ØŒ ØªÙ†Ø¸ÙŠÙ… Ø§Ù„Ø¹Ù…Ù„ÙŠØ§ØªØŒ Ø£Ùˆ Ø­ØªÙ‰ ØªØ¨Ø³ÙŠØ· ÙÙƒØ±ØªÙƒ ÙˆØªØ­ÙˆÙŠÙ„Ù‡Ø§ Ù„Ø´ÙŠØ¡ Ø¹Ù…Ù„ÙŠ â€“ Ø±Ø§Ø³Ù„Ù†ÙŠ.",
        chips: ["Ø§Ø³ØªØ´Ø§Ø±Ø§Øª Ù„ÙˆØ¬Ø³ØªÙŠØ©", "ØªØµÙ…ÙŠÙ… Ù…ÙˆØ§Ù‚Ø¹", "ØªØ¹Ø§ÙˆÙ† Ù…Ø­ØªÙˆÙ‰"],
        contactTitle: "Ø·Ø±Ù‚ Ø§Ù„ØªÙˆØ§ØµÙ„",
        contactSub: "Ø§Ø®ØªØ± Ø§Ù„Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø£Ù†Ø³Ø¨ Ù„Ùƒ â€“ ÙƒÙ„Ù‡Ø§ ØªØµÙ„ Ù…Ø¨Ø§Ø´Ø±Ø©",
        formTitle: "Ù†Ù…ÙˆØ°Ø¬ ØªÙˆØ§ØµÙ„ Ø§Ø­ØªØ±Ø§ÙÙŠ",
        formBadge: "Ù†Ù…ÙˆØ°Ø¬ Ø²Ø¬Ø§Ø¬ÙŠ Â· Ø¬Ø§Ù‡Ø²",
        formSub: "Ø­Ø§Ø¨Ø¨ ØªØ±ØªÙ‘Ø¨ Ù…Ø´Ø±ÙˆØ¹ÙƒØŒ ØªØ·Ù„Ù‚ Ù…Ù†ØªØ¬ØŒ Ø£Ùˆ Ø¨Ø¯Ùƒ Ù…ÙˆÙ‚Ø¹ Ø¨Ø³ÙŠØ· ÙˆØ£Ù†ÙŠÙ‚ØŸ Ø£Ø±Ø³Ù„ Ø§Ù„ØªÙØ§ØµÙŠÙ„ ÙˆØ§Ø®ØªÙŽØ± Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª Ø§Ù„Ø¬Ø§Ù‡Ø²Ø©.",
        topics: ["ØªÙ†Ø¸ÙŠÙ… Ù„ÙˆØ¬Ø³ØªÙŠ", "Ù…ÙˆÙ‚Ø¹ Ø£Ùˆ ØµÙØ­Ø© Ù‡Ø¨ÙˆØ·", "ØªØ¹Ø§ÙˆÙ† Ù…Ø­ØªÙˆÙ‰", "Ø§Ø³ØªØ´Ø§Ø±Ø© Ø³Ø±ÙŠØ¹Ø©"],
        nameLabel: "Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„", namePH: "Ø§Ø³Ù…Ùƒ Ø§Ù„ÙƒØ§Ù…Ù„",
        emailLabel: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", emailPH: "name@example.com",
        methodLabel: "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ù…ÙØ¶Ù„Ø©",
        methods: ["ÙˆØ§ØªØ³Ø§Ø¨", "Ø¨Ø±ÙŠØ¯ Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ", "LinkedIn"],
        subjectLabel: "Ø§Ù„Ù…ÙˆØ¶ÙˆØ¹",
        subjectOptions: ["Ø§Ø®ØªØ± Ù…ÙˆØ¶ÙˆØ¹...", "ØªØ±ÙˆÙŠØ¬ Ù…Ù†ØªØ¬", "Ø§Ø³ØªÙØ³Ø§Ø± Ù„ÙˆØ¬Ø³ØªÙŠ", "ØªØµÙ…ÙŠÙ… Ù…ÙˆÙ‚Ø¹", "ØªØ¹Ø§ÙˆÙ† Ù…Ø­ØªÙˆÙ‰", "Ø§Ø³ØªØ´Ø§Ø±Ø©", "Ù…ÙˆØ¶ÙˆØ¹ Ø¢Ø®Ø±"],
        responseLabel: "Ù…Ø¯Ø© Ø§Ù„Ø±Ø¯ Ø§Ù„Ù…ÙØ¶Ù„Ø©",
        responseTimes: ["Ø³Ø±ÙŠØ¹ Ø§Ù„ÙŠÙˆÙ…", "Ø®Ù„Ø§Ù„ 24 Ø³Ø§Ø¹Ø©", "Ø®Ù„Ø§Ù„ Ø§Ù„Ø£Ø³Ø¨ÙˆØ¹"],
        messageLabel: "Ø§Ù„Ø±Ø³Ø§Ù„Ø©", messagePH: "Ø§ÙƒØªØ¨ Ø±Ø³Ø§Ù„ØªÙƒØŒ Ù…Ø§ Ø§Ù„Ù…Ø´ÙƒÙ„Ø© Ø£Ùˆ Ø§Ù„Ù‡Ø¯ÙØŒ ÙˆØ£ÙŠ ØªÙØ§ØµÙŠÙ„ Ù…Ø®ØªØµØ±Ø©.",
        sendBtn: "Ø£Ø±Ø³Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø©", privacy: "Ù„Ù† Ø£Ø³ØªØ®Ø¯Ù… Ø¨ÙŠØ§Ù†Ø§ØªÙƒ Ø¥Ù„Ø§ Ù„Ù„Ø±Ø¯. ÙŠÙ…ÙƒÙ†Ùƒ Ø·Ù„Ø¨ Ø§Ù„Ø­Ø°Ù Ø¨Ø£ÙŠ ÙˆÙ‚Øª.",
        reviewsTitle: "Ø¢Ø±Ø§Ø¡ ÙˆØªØ¹Ù„ÙŠÙ‚Ø§Øª",
        reviewsSub: "ØªØ¹Ù„ÙŠÙ‚Ø§Øª Ø£Ø­Ø¨ Ø£Ø³ØªÙ‚Ø¨Ù„ Ù…Ø«Ù„Ù‡Ø§.",
    },
    en: {
        eyebrow: "Collaboration Â· Consultation Â· Direct Contact",
        heroTitle: "Let's work together",
        heroSpan: "We'll create something real",
        heroLead: "Whether you're a business owner, a company, or just someone with a small ideaâ€¦ if you need someone who understands logistics, planning, operation organisation, or simplifying your idea into something practical â€“ message me.",
        chips: ["Logistics consultations", "Website design", "Content collaboration"],
        contactTitle: "Contact methods",
        contactSub: "Choose the method that suits you best â€” they all reach me directly",
        formTitle: "Professional Contact Form",
        formBadge: "Glass form Â· Ready",
        formSub: "Want to organise your project, launch a product, or need a simple elegant website? Send the details and choose the ready options.",
        topics: ["Logistics organisation", "Website or landing page", "Content collaboration", "Quick consultation"],
        nameLabel: "Full name", namePH: "Your full name",
        emailLabel: "Email", emailPH: "name@example.com",
        methodLabel: "Preferred contact method",
        methods: ["WhatsApp", "Email", "LinkedIn"],
        subjectLabel: "Subject",
        subjectOptions: ["Choose a subject...", "Product promotion", "Logistics query", "Website design", "Content collaboration", "Consultation", "Other"],
        responseLabel: "Preferred response time",
        responseTimes: ["Quick today", "Within 24 hours", "Within the week"],
        messageLabel: "Message", messagePH: "Write your message, what the problem or goal is, and any brief details.",
        sendBtn: "Send message", privacy: "I will only use your data to reply. You can request deletion at any time.",
        reviewsTitle: "Opinions & comments",
        reviewsSub: "Comments I love receiving.",
    },
};

  const quickReasons =
    locale === "ar"
      ? [
          {
            title: "استشارة لوجستية",
            body: "إذا كان عندك ضغط تشغيل أو فوضى يومية في التوزيع والتسليم، يمكننا ترتيب الصورة بشكل عملي.",
          },
          {
            title: "موقع أو صفحة تعريفية",
            body: "إذا تريد موقعاً واضحاً يعرف الناس بك أو بخدماتك، نبدأ من الرسالة ثم نبنيها بصرياً.",
          },
          {
            title: "تعاون محتوى أو مراجعة منتج",
            body: "إذا كنت شركة أو صاحب منتج وتريد عرضاً صادقاً ومحترماً، يمكننا تنسيق ذلك مباشرة.",
          },
        ]
      : [
          {
            title: "Logistics advice",
            body: "If your daily operations feel messy or overloaded, we can structure the workflow in a practical way.",
          },
          {
            title: "Website or landing page",
            body: "If you need a clear page that introduces you or your services, we start with the message and build it visually.",
          },
          {
            title: "Content collaboration or review",
            body: "If you represent a brand or product and need an honest presentation, we can coordinate that directly.",
          },
        ];

  const testimonials =
    locale === "ar"
      ? [
          "أعجبني أن التواصل واضح وسريع، بدون لف ودوران.",
          "الموقع مرتب، والرسالة مفهومة، وكل قناة لها وظيفة واضحة.",
          "فكرة الجمع بين اللوجستيات والمحتوى والتقنية صارت أوضح بكثير هنا.",
        ]
      : [
          "Communication feels direct and fast, without unnecessary friction.",
          "The site is structured, the message is clear, and every channel has a purpose.",
          "The mix of logistics, content, and technology feels much clearer here.",
        ];

    return (
        <div className="contact-page-full" dir={dir}>
            {/* â”€â”€â”€ HERO â”€â”€â”€ */}
            <section className="contact-hero-section">
                <div className="container contact-hero-grid">
                    <article className="contact-hero-content reveal-item">
                        <div className="glass contact-hero-glass">
                            <p className="contact-eyebrow">{t.eyebrow}</p>
                            <h1 className="contact-hero-title">
                                {t.heroTitle}<br />
                                <span className="gradient-text">{t.heroSpan}</span>
                            </h1>
                            <p className="contact-hero-lead">{t.heroLead}</p>
                            <div className="contact-chips">
                                {t.chips.map((chip, i) => <span key={i} className="contact-chip">{chip}</span>)}
                            </div>
                        </div>
                    </article>
                    <aside className="contact-hero-aside reveal-item">
                        <div className="contact-logo-frame glass">
                            <Image src="/images/logo-unboxing.png" alt="Mohammad Alfarras Logo" width={200} height={200} style={{ borderRadius: "50%", objectFit: "contain" }} />
                        </div>
                    </aside>
                </div>
            </section>

            {/* â”€â”€â”€ CONTACT METHODS â”€â”€â”€ */}
            <section className="contact-methods-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.contactTitle}</h2>
                        <p className="section-sub-full">{t.contactSub}</p>
                    </div>
                    <div className="contact-methods-grid">
                        {contacts.map((c, i) => (
                            <a key={i} href={c.href} target="_blank" rel="noreferrer noopener" className="contact-method-card glass reveal-item">
                                <h3>{locale === "ar" ? c.ar : c.en}</h3>
                                <p>{locale === "ar" ? c.ar_desc : c.en_desc}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ FORM â”€â”€â”€ */}
            <section className="contact-form-section">
                <div className="container">
                    <div className="contact-form-shell glass">
                        <div className="contact-form-header">
                            <span className="contact-badge">{t.formBadge}</span>
                            <h2 className="contact-form-title">{t.formTitle}</h2>
                            <p className="contact-form-sub">{t.formSub}</p>
                            <div className="contact-quick-choices">
                                {t.topics.map((topic, i) => (
                                    <label key={i} className="quick-choice">
                                        <input type="radio" name="topic_quick" value={topic} />
                                        <span>{topic}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <form className="contact-form-modern" method="POST" action="https://formsubmit.co/el/cijuki">
                            <input type="hidden" name="_captcha" value="false" />
                            <input type="hidden" name="_template" value="table" />
                            <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />
                            <div className="contact-form-grid">
                                <label>
                                    <span>{t.nameLabel}</span>
                                    <input type="text" name="name" required placeholder={t.namePH} />
                                </label>
                                <label>
                                    <span>{t.emailLabel}</span>
                                    <input type="email" name="email" required placeholder={t.emailPH} />
                                </label>
                                <label>
                                    <span>{t.methodLabel}</span>
                                    <div className="pill-group">
                                        {t.methods.map((m, i) => (
                                            <label key={i} className="pill">
                                                <input type="radio" name="contact_method" value={m} />
                                                <span>{m}</span>
                                            </label>
                                        ))}
                                    </div>
                                </label>
                                <label>
                                    <span>{t.subjectLabel}</span>
                                    <select name="topic" required>
                                        {t.subjectOptions.map((opt, i) => (
                                            <option key={i} value={i === 0 ? "" : opt}>{opt}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>
                                    <span>{t.responseLabel}</span>
                                    <div className="pill-group">
                                        {t.responseTimes.map((rt, i) => (
                                            <label key={i} className="pill">
                                                <input type="radio" name="response_time" value={rt} />
                                                <span>{rt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </label>
                            </div>
                            <label className="form-full">
                                <span>{t.messageLabel}</span>
                                <textarea name="message" rows={6} required placeholder={t.messagePH} />
                            </label>
                            <div className="contact-submit-row">
                                <button type="submit" className="home-hero-btn primary">{t.sendBtn}</button>
                                <p className="contact-privacy">{t.privacy}</p>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            {/* â”€â”€â”€ REVIEWS â”€â”€â”€ */}
            <section className="contact-reviews-section">
                <div className="container">
                    <div className="section-header-full">
                        <h2 className="section-title-full gradient-text">{t.reviewsTitle}</h2>
                        <p className="section-sub-full">{t.reviewsSub}</p>
                    </div>
                    <div className="contact-reviews-grid">
                        {reviews.map((r, i) => (
                            <article key={i} className="contact-review-card glass reveal-item">
                                <p className="review-meta">{r.meta}</p>
                                <p className="review-text">&quot;{r.text}&quot;</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "متى نتواصل؟" : "When to reach out"}</span>
            <h2>{locale === "ar" ? "ثلاث حالات مناسبة جداً للتواصل" : "Three strong reasons to reach out"}</h2>
          </div>
          <div className="feature-card-grid">
            {quickReasons.map((item) => (
              <article key={item.title} className="glass-card service-rich-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "القنوات الرئيسية" : "Primary channels"}</span>
            <h2>{locale === "ar" ? "اختر الطريق الأنسب" : "Choose the route that fits best"}</h2>
          </div>
          <div className="channel-card-grid">
            {channels.map((channel) => (
              <a
                key={channel.id}
                href={channel.value}
                target="_blank"
                rel="noreferrer noopener"
                className={`glass-card contact-rich-card${channel.isPrimary ? " is-primary" : ""}`}
              >
                <span className="contact-rich-icon">{iconForChannel(channel.type)}</span>
                <div>
                  <h3>{channel.label}</h3>
                  <p>{channel.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="glass-card contact-form-shell-modern">
            <div className="section-heading">
              <span className="section-kicker">{locale === "ar" ? "نموذج سريع" : "Quick form"}</span>
              <h2>{locale === "ar" ? "أرسل التفاصيل بشكل مرتب" : "Send the details in a structured way"}</h2>
              <p>
                {locale === "ar"
                  ? "النموذج يذهب مباشرة إلى البريد. إذا كنت تريد تواصلاً أسرع، استخدم واتساب أو تليغرام."
                  : "The form goes straight to email. If you want a faster conversation, use WhatsApp or Telegram."}
              </p>
            </div>

            <form className="contact-form-grid-modern" method="POST" action="https://formsubmit.co/el/cijuki">
              <input type="hidden" name="_captcha" value="false" />
              <input type="hidden" name="_template" value="table" />
              <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

              <label>
                <span>{locale === "ar" ? "الاسم" : "Name"}</span>
                <input name="name" required placeholder={locale === "ar" ? "الاسم الكامل" : "Full name"} />
              </label>
              <label>
                <span>{locale === "ar" ? "البريد الإلكتروني" : "Email"}</span>
                <input name="email" type="email" required placeholder="name@example.com" />
              </label>
              <label>
                <span>{locale === "ar" ? "الموضوع" : "Subject"}</span>
                <select name="topic" required defaultValue="">
                  <option value="" disabled>
                    {locale === "ar" ? "اختر موضوعاً" : "Choose a topic"}
                  </option>
                  <option value="website">{locale === "ar" ? "موقع أو صفحة هبوط" : "Website or landing page"}</option>
                  <option value="content">{locale === "ar" ? "تعاون محتوى أو مراجعة منتج" : "Content collaboration or product review"}</option>
                  <option value="logistics">{locale === "ar" ? "استشارة لوجستية" : "Logistics consultation"}</option>
                  <option value="other">{locale === "ar" ? "موضوع آخر" : "Other"}</option>
                </select>
              </label>
              <label>
                <span>{locale === "ar" ? "طريقة التواصل المفضلة" : "Preferred contact method"}</span>
                <select name="preferred_contact" defaultValue="email">
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </label>
              <label className="is-full">
                <span>{locale === "ar" ? "الرسالة" : "Message"}</span>
                <textarea
                  name="message"
                  rows={6}
                  required
                  placeholder={
                    locale === "ar"
                      ? "اشرح الهدف، نوع المشروع، أو ما الذي تحتاجه بالضبط، وسأعود لك بالطريق الأنسب."
                      : "Describe the goal, project type, or exactly what you need, and I will reply with the most practical next step."
                  }
                />
              </label>
              <button type="submit" className="btn primary">
                {locale === "ar" ? "إرسال الرسالة" : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container section-stack">
          <div className="section-heading">
            <span className="section-kicker">{locale === "ar" ? "انطباعات" : "Feedback"}</span>
            <h2>{locale === "ar" ? "كيف يجب أن يبدو التواصل الجيد" : "What good communication should feel like"}</h2>
          </div>
          <div className="feature-card-grid">
            {testimonials.map((quote) => (
              <article key={quote} className="glass-card service-rich-card">
                <h3>{locale === "ar" ? "انطباع مختصر" : "Short note"}</h3>
                <p>{quote}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

