import type { Locale } from "@/types/cms";

export type LegalPageSlug = "impressum" | "terms" | "app-disclaimer" | "download-disclaimer";

export type LegalPagesSetting = {
  published?: boolean;
  responsibleName?: string;
  businessName?: string;
  address?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  register?: string;
  privacyExtra?: string;
  termsExtra?: string;
  appDisclaimerExtra?: string;
  downloadDisclaimerExtra?: string;
  updatedAt?: string;
};

export type LegalPageContent = {
  slug: LegalPageSlug;
  title: string;
  description: string;
  updated: string;
  sections: Array<{ title: string; body: string[] }>;
};

const labels = {
  en: {
    responsible: "Responsible operator",
    business: "Business name",
    address: "Address",
    email: "Email",
    phone: "Phone",
    tax: "Tax ID / VAT",
    register: "Register entry",
    notProvided: "Not provided",
  },
  ar: {
    responsible: "المسؤول عن الموقع",
    business: "الاسم التجاري",
    address: "العنوان",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    tax: "الرقم الضريبي / VAT",
    register: "بيانات السجل",
    notProvided: "غير متوفر",
  },
} satisfies Record<Locale, Record<string, string>>;

export function legalPagesPublished(setting: LegalPagesSetting | undefined): boolean {
  return Boolean(setting?.published && setting.responsibleName?.trim() && setting.address?.trim() && setting.email?.trim());
}

export function legalFooterLinks(locale: Locale) {
  const isAr = locale === "ar";
  return [
    { id: "impressum", label: isAr ? "البيانات القانونية" : "Impressum", href: `/${locale}/impressum` },
    { id: "terms", label: isAr ? "الشروط" : "Terms", href: `/${locale}/terms` },
    {
      id: "app-disclaimer",
      label: isAr ? "تنبيه التطبيق" : "App Disclaimer",
      href: `/${locale}/app-disclaimer`,
    },
    {
      id: "download-disclaimer",
      label: isAr ? "تنبيه التحميل" : "Download Disclaimer",
      href: `/${locale}/download-disclaimer`,
    },
  ];
}

function value(setting: LegalPagesSetting, key: keyof LegalPagesSetting, fallback = labels.en.notProvided) {
  const raw = setting[key];
  return typeof raw === "string" && raw.trim() ? raw.trim() : fallback;
}

function contactRows(locale: Locale, setting: LegalPagesSetting) {
  const l = labels[locale];
  return [
    `${l.responsible}: ${value(setting, "responsibleName", l.notProvided)}`,
    `${l.business}: ${value(setting, "businessName", l.notProvided)}`,
    `${l.address}: ${value(setting, "address", l.notProvided)}`,
    `${l.email}: ${value(setting, "email", l.notProvided)}`,
    `${l.phone}: ${value(setting, "phone", l.notProvided)}`,
    `${l.tax}: ${value(setting, "taxId", l.notProvided)}`,
    `${l.register}: ${value(setting, "register", l.notProvided)}`,
  ];
}

function extraText(value: string | undefined) {
  return value?.trim() ? [value.trim()] : [];
}

export function legalPageContent(slug: LegalPageSlug, locale: Locale, setting: LegalPagesSetting): LegalPageContent {
  const updated = setting.updatedAt ? new Date(setting.updatedAt).toISOString().slice(0, 10) : "2026-06-15";
  const isAr = locale === "ar";

  if (slug === "impressum") {
    return {
      slug,
      title: isAr ? "البيانات القانونية" : "Impressum",
      description: isAr
        ? "معلومات المسؤول عن تشغيل moalfarras.space وقنوات التواصل الرسمية."
        : "Legal operator information and official contact channels for moalfarras.space.",
      updated,
      sections: [
        {
          title: isAr ? "المشغل المسؤول" : "Operator",
          body: contactRows(locale, setting),
        },
        {
          title: isAr ? "المسؤولية عن المحتوى" : "Content responsibility",
          body: [
            isAr
              ? "يتم إعداد محتوى الموقع بعناية، ومع ذلك قد تتغير المعلومات التقنية أو روابط التطبيقات والإصدارات. عند وجود خطأ واضح يمكن التواصل عبر البريد الرسمي."
              : "Site content is prepared carefully, but technical details, app links, and release information can change. Clear corrections can be sent through the official email channel.",
          ],
        },
      ],
    };
  }

  if (slug === "terms") {
    return {
      slug,
      title: isAr ? "شروط الاستخدام" : "Terms of Use",
      description: isAr
        ? "الشروط العامة لاستخدام الموقع وصفحات التطبيقات وخدمات التواصل."
        : "General terms for using the website, app pages, and contact services.",
      updated,
      sections: [
        {
          title: isAr ? "نطاق الاستخدام" : "Scope",
          body: [
            isAr
              ? "يوفر الموقع معلومات عن خدمات الويب، منتجات MoPlayer، روابط التحميل الرسمية، التفعيل، والدعم. استخدامك للموقع يعني الالتزام باستخدامه بشكل قانوني وغير مسيء."
              : "The website provides information about web services, MoPlayer products, official downloads, activation, and support. Use of the site must remain lawful and non-abusive.",
          ],
        },
        {
          title: isAr ? "الطلبات والتواصل" : "Requests and communication",
          body: [
            isAr
              ? "إرسال نموذج تواصل أو دعم لا ينشئ عقدًا تلقائيًا. يتم الرد على الطلبات حسب التفاصيل المتاحة وقابلية تنفيذها."
              : "Submitting a contact or support form does not automatically create a contract. Requests are reviewed according to available details and feasibility.",
          ],
        },
        {
          title: isAr ? "ملاحظات إضافية" : "Additional notes",
          body: extraText(setting.termsExtra),
        },
      ],
    };
  }

  if (slug === "app-disclaimer") {
    return {
      slug,
      title: isAr ? "تنبيه استخدام التطبيقات" : "App Disclaimer",
      description: isAr
        ? "تنبيه واضح حول استخدام MoPlayer ومصادر المستخدمين والتفعيل."
        : "Clear disclaimer for MoPlayer usage, user-provided sources, and activation.",
      updated,
      sections: [
        {
          title: isAr ? "مصادر المستخدم" : "User-provided sources",
          body: [
            isAr
              ? "MoPlayer هو مشغل وواجهة استخدام. لا يبيع الموقع اشتراكات IPTV ولا يضمن ملكية أو قانونية أي مصدر خارجي يضيفه المستخدم."
              : "MoPlayer is a player and user interface. The site does not sell IPTV subscriptions and does not guarantee ownership or legality of any external source added by a user.",
          ],
        },
        {
          title: isAr ? "التفعيل والدعم" : "Activation and support",
          body: [
            isAr
              ? "التفعيل والدعم يساعدان على ربط الجهاز وتشخيص المشاكل التقنية. لا يتم تخزين روابط أو كلمات مرور مصادر IPTV في قاعدة بيانات الموقع بعد تسليمها للتطبيق."
              : "Activation and support help connect devices and diagnose technical issues. IPTV source URLs or passwords are not permanently stored in the website database after handoff to the app.",
          ],
        },
        {
          title: isAr ? "ملاحظات إضافية" : "Additional notes",
          body: extraText(setting.appDisclaimerExtra),
        },
      ],
    };
  }

  return {
    slug,
    title: isAr ? "تنبيه تحميل البرامج" : "Software Download Disclaimer",
    description: isAr
      ? "معلومات أمان ومسؤولية حول تحميل ملفات APK ونسخ Windows من الموقع الرسمي."
      : "Security and responsibility notes for APK and Windows downloads from the official site.",
    updated,
    sections: [
      {
        title: isAr ? "التحميل الرسمي" : "Official downloads",
        body: [
          isAr
            ? "استخدم روابط moalfarras.space الرسمية فقط. عند توفر checksum أو بيانات إصدار، راجعها قبل تثبيت الملف خاصة عند التحميل الجانبي على Android TV."
            : "Use only the official moalfarras.space download routes. When checksums or release details are available, review them before installing, especially for Android TV sideloading.",
        ],
      },
      {
        title: isAr ? "مسؤولية التثبيت" : "Installation responsibility",
        body: [
          isAr
            ? "قد تتطلب ملفات APK أو Windows صلاحيات إضافية أو تحذيرات من النظام. ثبّت الملفات فقط على أجهزة تملكها أو لديك صلاحية إدارتها."
            : "APK or Windows installers can require extra permissions or trigger operating-system warnings. Install files only on devices you own or are authorized to manage.",
        ],
      },
      {
        title: isAr ? "ملاحظات إضافية" : "Additional notes",
        body: extraText(setting.downloadDisclaimerExtra),
      },
    ],
  };
}
