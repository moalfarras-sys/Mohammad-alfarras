"use client";

import { useEffect } from "react";
import Image from "next/image";

import type { CmsSnapshot, Locale, PageView } from "@/types/cms";

const contacts = [
  { href: "https://wa.me/4917623419358", ar: "واتساب", en: "WhatsApp", ar_desc: "تواصل مباشر وسريع", en_desc: "Direct chat", icon: "wa" },
  { href: "mailto:Mohammad.alfarras@gmail.com", ar: "البريد الإلكتروني", en: "Email", ar_desc: "للاستفسارات الرسمية", en_desc: "For formal inquiries", icon: "mail" },
  { href: "https://de.linkedin.com/in/mohammad-alfarras-525531262", ar: "LinkedIn", en: "LinkedIn", ar_desc: "الملف المهني", en_desc: "Professional networking", icon: "li" },
  { href: "https://github.com/moalfarras-sys", ar: "GitHub", en: "GitHub", ar_desc: "مشاريع برمجية", en_desc: "Code projects and repositories", icon: "gh" },
  { href: "https://www.facebook.com/share/14TQSSocNQG/", ar: "فيسبوك", en: "Facebook", ar_desc: "الصفحة الرسمية", en_desc: "Official page", icon: "fb" },
  { href: "https://www.youtube.com/@Moalfarras", ar: "يوتيوب", en: "YouTube", ar_desc: "قناة الفيديوهات الرسمية", en_desc: "Official video channel", icon: "yt" },
  { href: "https://www.instagram.com/moalfarras", ar: "إنستغرام", en: "Instagram", ar_desc: "محتوى يومي وأفكار جديدة", en_desc: "Daily content and ideas", icon: "ig" },
  { href: "https://t.me/MoalFarras", ar: "تليغرام", en: "Telegram", ar_desc: "تواصل سريع عبر تليغرام", en_desc: "Quick contact via Telegram", icon: "tg" },
];

const reviews = {
  ar: [
    { meta: "تعليق من زائر", text: "أعجبني أن الموقع خفيف وواضح، وكل شيء مرتب بدون إعلانات مزعجة." },
    { meta: "متابع من يوتيوب", text: "مراجعاتك صريحة وتتكلم عن العيوب قبل الممي\u200Cزات — استمر على هذا الأسلوب." },
    { meta: "صاحب مشروع صغير", text: "ساعدتني أفهم أي نوع فيديو مناسب لمنتجي وكيف أجهز له بدون تكاليف ضخمة." },
  ],
  en: [
    { meta: "Visitor comment", text: "I liked that the site is light and clear, everything is organised without annoying ads." },
    { meta: "YouTube follower", text: "Your reviews are honest and talk about flaws before features — keep up this style." },
    { meta: "Small business owner", text: "You helped me understand what type of video suits my product and how to set it up without big costs." },
  ],
};

const labels = {
  ar: {
    eyebrow: "تعاون · استشارة · تواصل مباشر",
    heroTitle: "خلينا نشتغل سوا",
    heroSpan: "رح نخلق شيء واقعي",
    heroLead: "سواء كنت صاحب مشروع، شركة، أو حتى شخص عنده فكرة صغيرة… إذا بدك حدا يفهم اللوجستيات، التخطيط، تنظيم العمليات، أو حتى تبسيط فكرتك وتحويلها لشيء عملي — راسلني.",
    chips: ["استشارات لوجستية", "تصميم مواقع", "تعاون محتوى"],
    contactTitle: "طرق التواصل",
    contactSub: "اختر الطريقة الأنسب لك — كلها تصل مباشرة",
    formTitle: "نموذج تواصل احترافي",
    formBadge: "نموذج زجاجي · جاهز",
    formSub: "حابب ترتّب مشروعك، تطلق منتج، أو بدك موقع بسيط وأنيق؟ أرسل التفاصيل واختَر الخيارات الجاهزة.",
    topics: ["تنظيم لوجستي", "موقع أو صفحة هبوط", "تعاون محتوى", "استشارة سريعة"],
    nameLabel: "الاسم الكامل", namePH: "اسمك الكامل",
    emailLabel: "البريد الإلكتروني", emailPH: "name@example.com",
    methodLabel: "طريقة التواصل المفضلة",
    methods: ["واتساب", "بريد إلكتروني", "LinkedIn"],
    subjectLabel: "الموضوع",
    subjectOptions: ["اختر موضوع...", "ترويج منتج", "استفسار لوجستي", "تصميم موقع", "تعاون محتوى", "استشارة", "موضوع آخر"],
    responseLabel: "مدة الرد المفضلة",
    responseTimes: ["سريع اليوم", "خلال 24 ساعة", "خلال الأسبوع"],
    messageLabel: "الرسالة", messagePH: "اكتب رسالتك، ما المشكلة أو الهدف، وأي تفاصيل مختصرة.",
    sendBtn: "أرسل الرسالة", privacy: "لن أستخدم بياناتك إلا للرد. يمكنك طلب الحذف بأي وقت.",
    reviewsTitle: "آراء وتعليقات",
    reviewsSub: "تعليقات أحب أستقبل مثلها.",
  },
  en: {
    eyebrow: "Collaboration · Consultation · Direct Contact",
    heroTitle: "Let's work together",
    heroSpan: "We'll create something real",
    heroLead: "Whether you're a business owner, a company, or just someone with a small idea… if you need someone who understands logistics, planning, operation organisation, or simplifying your idea into something practical — message me.",
    chips: ["Logistics consultations", "Website design", "Content collaboration"],
    contactTitle: "Contact methods",
    contactSub: "Choose the method that suits you best — they all reach me directly",
    formTitle: "Professional Contact Form",
    formBadge: "Glass form · Ready",
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

export function ContactPage({ locale, page, snapshot }: { locale: "ar" | "en"; page: PageView; snapshot: CmsSnapshot }) {
  const t = labels[locale];
  const dir = locale === "ar" ? "rtl" : "ltr";
  const rvs = reviews[locale];

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("revealed")),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal-item").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="contact-page-full" dir={dir}>
      {/* ─── HERO ─── */}
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

      {/* ─── CONTACT METHODS ─── */}
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

      {/* ─── FORM ─── */}
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

      {/* ─── REVIEWS ─── */}
      <section className="contact-reviews-section">
        <div className="container">
          <div className="section-header-full">
            <h2 className="section-title-full gradient-text">{t.reviewsTitle}</h2>
            <p className="section-sub-full">{t.reviewsSub}</p>
          </div>
          <div className="contact-reviews-grid">
            {rvs.map((r, i) => (
              <article key={i} className="contact-review-card glass reveal-item">
                <p className="review-meta">{r.meta}</p>
                <p className="review-text">&quot;{r.text}&quot;</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
