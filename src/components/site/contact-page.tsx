import Image from "next/image";

import type { CmsSnapshot, Locale, PageView } from "@/types/cms";

import { getChannels, getPortrait, iconForChannel } from "./cms-views";

export function ContactPage({ locale, page, snapshot }: { locale: Locale; page: PageView; snapshot: CmsSnapshot }) {
  const channels = getChannels(snapshot, locale);
  const portrait = getPortrait(snapshot, locale);
  const primaryChannels = channels.filter((channel) => channel.isPrimary).slice(0, 2);

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
    <div className="premium-page">
      <section className="hero-stage">
        <div className="container hero-stage-grid">
          <div className="hero-stage-copy glass-card">
            <span className="section-kicker">{locale === "ar" ? "تواصل مباشر" : "Direct contact"}</span>
            <h1 className="display-title">{page.title}</h1>
            <p className="hero-lead">
              {locale === "ar"
                ? "سواء كان عندك مشروع، منتج تريد مراجعته، موقع تريد تطويره، أو استفسار مهني في اللوجستيات والتشغيل، فالقنوات الأساسية هنا جاهزة لتبدأ بسرعة ووضوح."
                : "Whether you have a project, a product that needs a review, a website to improve, or a professional question around logistics and operations, the main direct channels here are ready for a fast and clear start."}
            </p>
            <p>
              {locale === "ar"
                ? "كل خطوة تبدأ برسالة بسيطة. بعدها نحدد المسار الأنسب: واتساب إذا كنت تريد رداً سريعاً، أو البريد إذا كانت لديك تفاصيل وتعاون رسمي."
                : "Every collaboration starts with a simple message. Then we choose the right route: WhatsApp for speed, or email for formal details and collaboration."}
            </p>
            <div className="hero-action-row">
              {primaryChannels.map((channel) => (
                <a key={channel.id} href={channel.value} target="_blank" rel="noreferrer noopener" className="btn primary">
                  {channel.label}
                </a>
              ))}
            </div>
          </div>

          {portrait ? (
            <aside className="hero-stage-visual glass-card">
              <div className="portrait-shell">
                <div className="portrait-glow-ring" />
                <div className="portrait-frame portrait-frame-contact">
                  <Image
                    src={portrait.path}
                    alt={locale === "ar" ? portrait.alt_ar : portrait.alt_en}
                    width={portrait.width}
                    height={portrait.height}
                    priority
                    sizes="(max-width: 768px) 68vw, 26rem"
                    className="portrait-image"
                  />
                </div>
              </div>
            </aside>
          ) : null}
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
