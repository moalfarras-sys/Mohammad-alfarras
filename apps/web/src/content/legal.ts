import type { Localized } from "./site";

export const privacyCopy = {
  en: {
    eyebrow: "Privacy",
    title: "Privacy and data handling for the unified Moalfarras site.",
    updated: "Last reviewed: April 24, 2026",
    intro:
      "This page covers the personal site, contact flow, MoPlayer product surfaces, downloads, support, and related bilingual content under moalfarras.space.",
    sections: [
      {
        title: "What this site collects",
        body:
          "The site may process information you intentionally submit through contact or support forms, such as name, email, optional WhatsApp number, project type, budget range, timeline, and message.",
      },
      {
        title: "Why it is used",
        body:
          "Submitted information is used to understand the request, respond to you, handle support questions, and keep a basic operational record of the conversation.",
      },
      {
        title: "MoPlayer",
        body:
          "MoPlayer is a playback interface. It does not provide channels, playlists, subscriptions, or copyrighted media. Users are responsible for the legality of the sources they connect.",
      },
      {
        title: "Storage and third parties",
        body:
          "Contact/support messages may be stored in the configured database and may be delivered by the configured email provider. Secrets and service-role keys must remain server-side only.",
      },
      {
        title: "Your choices",
        body:
          "You can request clarification or deletion of a submitted message by contacting the published support email. Legal retention duties may limit deletion in some cases.",
      },
    ],
    todoTitle: "Owner confirmation needed",
    todo:
      "If the site is used commercially from Germany, confirm the required Impressum/legal notice details: legal name, address, responsible person, tax/business identifiers if applicable, and any mandatory professional disclosures.",
    contact: "Privacy contact",
  },
  ar: {
    eyebrow: "الخصوصية",
    title: "الخصوصية ومعالجة البيانات داخل موقع Moalfarras الموحّد.",
    updated: "آخر مراجعة: 24 أبريل 2026",
    intro:
      "تغطي هذه الصفحة الموقع الشخصي، نموذج التواصل، صفحات منتج MoPlayer، التنزيلات، الدعم، والمحتوى العربي/الإنجليزي المرتبط ضمن moalfarras.space.",
    sections: [
      {
        title: "ما الذي يجمعه الموقع",
        body:
          "قد يعالج الموقع المعلومات التي ترسلها عمداً عبر نماذج التواصل أو الدعم، مثل الاسم، البريد، رقم واتساب الاختياري، نوع المشروع، نطاق الميزانية، الجدول الزمني، والرسالة.",
      },
      {
        title: "لماذا تُستخدم البيانات",
        body:
          "تُستخدم المعلومات المرسلة لفهم الطلب، الرد عليك، معالجة أسئلة الدعم، والاحتفاظ بسجل تشغيلي بسيط للمحادثة.",
      },
      {
        title: "MoPlayer",
        body:
          "MoPlayer واجهة تشغيل فقط. لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق. المستخدم مسؤول عن قانونية المصادر التي يربطها.",
      },
      {
        title: "التخزين والأطراف الخارجية",
        body:
          "قد تُخزّن رسائل التواصل أو الدعم في قاعدة البيانات المضبوطة، وقد تُرسل عبر مزود البريد المضبوط. يجب أن تبقى الأسرار ومفاتيح service-role على الخادم فقط.",
      },
      {
        title: "خياراتك",
        body:
          "يمكنك طلب توضيح أو حذف رسالة مرسلة عبر بريد الدعم المنشور. قد تمنع الالتزامات القانونية الحذف في بعض الحالات.",
      },
    ],
    todoTitle: "معلومات تحتاج تأكيد المالك",
    todo:
      "إذا كان الموقع يُستخدم تجارياً من ألمانيا، يجب تأكيد بيانات Impressum / الإشعار القانوني: الاسم القانوني، العنوان، الشخص المسؤول، أرقام الضريبة أو التسجيل إن وجدت، وأي إفصاحات مهنية مطلوبة.",
    contact: "تواصل بخصوص الخصوصية",
  },
} satisfies Localized<{
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
  todoTitle: string;
  todo: string;
  contact: string;
}>;

export const supportCopy = {
  en: {
    eyebrow: "Support",
    title: "MoPlayer support inside the same product ecosystem.",
    intro:
      "Use this page for installation, compatibility, release, or download questions. MoPlayer support is connected to the product, privacy, and case-study story rather than separated into a detached help site.",
    sent: "Your support request was sent successfully.",
    directTitle: "Direct routes",
    formTitle: "Send support request",
    name: "Name",
    email: "Email",
    message: "Describe the issue or question",
    submit: "Send support request",
    privacy: "Privacy policy",
    product: "Product page",
    legalTitle: "Important product note",
    legal:
      "MoPlayer does not provide channels, playlists, subscriptions, or copyrighted media. Support can help with the app surface, installation, release compatibility, and download questions.",
    todoTitle: "Owner confirmation needed",
    todo:
      "For commercial operation in Germany, confirm whether an Impressum/legal notice must be linked from support and product pages.",
  },
  ar: {
    eyebrow: "الدعم",
    title: "دعم MoPlayer داخل منظومة المنتج نفسها.",
    intro:
      "استخدم هذه الصفحة لأسئلة التثبيت، التوافق، الإصدارات، أو التنزيل. دعم MoPlayer مرتبط بالمنتج والخصوصية ودراسة الحالة، وليس موقع مساعدة منفصلاً.",
    sent: "تم إرسال طلب الدعم بنجاح.",
    directTitle: "قنوات مباشرة",
    formTitle: "أرسل طلب دعم",
    name: "الاسم",
    email: "البريد الإلكتروني",
    message: "اشرح المشكلة أو السؤال",
    submit: "إرسال طلب الدعم",
    privacy: "سياسة الخصوصية",
    product: "صفحة المنتج",
    legalTitle: "ملاحظة مهمة عن المنتج",
    legal:
      "MoPlayer لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق. الدعم يساعد في واجهة التطبيق، التثبيت، توافق الإصدارات، وأسئلة التنزيل.",
    todoTitle: "معلومات تحتاج تأكيد المالك",
    todo:
      "للاستخدام التجاري من ألمانيا، يجب تأكيد ما إذا كان يلزم ربط Impressum / إشعار قانوني من صفحات الدعم والمنتج.",
  },
} satisfies Localized<Record<string, string>>;
