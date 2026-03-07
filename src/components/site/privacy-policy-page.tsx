import Link from "next/link";

import type { Locale } from "@/types/cms";

const policy = {
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 6 مارس 2026",
    intro: "نحترم خصوصيتك. توضح هذه الصفحة كيف نتعامل مع البيانات عند استخدام موقع MOALFARRAS.",
    sections: [
      {
        h: "1) البيانات التي قد نجمعها",
        items: [
          "بيانات تقدمها مباشرة عبر نموذج التواصل: الاسم، البريد، الرسالة.",
          "بيانات تقنية أساسية (نوع المتصفح، الجهاز، الصفحات) لتحسين الأداء والأمان.",
          "ملفات تعريف ارتباط أساسية لتشغيل الموقع وتذكر التفضيلات (مثل الثيم واللغة).",
        ],
      },
      {
        h: "2) كيف نستخدم البيانات",
        items: [
          "للرد على رسائلك والاستفسارات المهنية.",
          "لتحسين تجربة الاستخدام وسرعة الموقع.",
          "لأغراض أمنية ومنع إساءة الاستخدام والرسائل المزعجة.",
        ],
      },
      {
        h: "3) المحتوى المضمن والروابط الخارجية",
        items: [
          "قد يحتوي الموقع على محتوى مضمّن من YouTube وروابط لخدمات خارجية.",
          "هذه الجهات قد تجمع بيانات وفق سياساتها الخاصة عند الزيارة.",
          "ننصح بمراجعة سياسات الخصوصية للخدمات الخارجية قبل الاستخدام.",
        ],
      },
      {
        h: "4) الاحتفاظ بالبيانات",
        items: [
          "رسائل التواصل تُحفظ للمتابعة المهنية لمدة لازمة ثم تُحذف دوريًا.",
          "سجلات الأداء والأمان تُحتفظ بها فترة محدودة لتحسين الخدمة.",
        ],
      },
      {
        h: "5) حقوقك",
        items: [
          "يمكنك طلب الوصول لبياناتك أو تعديلها أو حذفها.",
          "يمكنك طلب إيقاف استخدام بياناتك لأي تواصل لاحق.",
        ],
      },
    ],
    cta: "لأي استفسار حول الخصوصية، تواصل معنا من صفحة التواصل.",
    btn: "صفحة التواصل",
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated: March 6, 2026",
    intro: "We respect your privacy. This page explains how data is handled when using the MOALFARRAS website.",
    sections: [
      {
        h: "1) Data we may collect",
        items: [
          "Information you submit through the contact form: name, email, message.",
          "Basic technical data (browser, device, pages visited) for performance and security.",
          "Essential cookies to run the site and remember preferences (theme/language).",
        ],
      },
      {
        h: "2) How we use data",
        items: [
          "To respond to your inquiries and collaboration requests.",
          "To improve user experience and website performance.",
          "For security, abuse prevention, and spam control.",
        ],
      },
      {
        h: "3) Embedded content and external links",
        items: [
          "The site may include embedded YouTube content and links to third-party services.",
          "Those services may collect data under their own privacy policies.",
          "Please review third-party privacy policies before using those services.",
        ],
      },
      {
        h: "4) Data retention",
        items: [
          "Contact messages are retained for business follow-up and periodically cleaned.",
          "Security/performance logs are kept for a limited period to improve service quality.",
        ],
      },
      {
        h: "5) Your rights",
        items: [
          "You can request access, correction, or deletion of your data.",
          "You can request to stop any future communication at any time.",
        ],
      },
    ],
    cta: "For any privacy-related request, contact us through the contact page.",
    btn: "Contact page",
  },
} as const;

export function PrivacyPolicyPage({ locale }: { locale: Locale }) {
  const t = policy[locale];

  return (
    <section className="page-section">
      <div className="container section-stack">
        <div className="section-heading">
          <h1>{t.title}</h1>
          <p>{t.updated}</p>
          <p>{t.intro}</p>
        </div>

        <div className="cards-grid two-col">
          {t.sections.map((section) => (
            <article key={section.h} className="card">
              <h3>{section.h}</h3>
              <ul className="bullet-list">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          ))}
        </div>

        <div className="card">
          <p>{t.cta}</p>
          <div className="actions-row" style={{ marginTop: "0.75rem" }}>
            <Link href={`/${locale}/contact`} className="btn primary">{t.btn}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
