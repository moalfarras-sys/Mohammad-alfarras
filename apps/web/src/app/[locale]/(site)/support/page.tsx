import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SITE_URL } from "@/content/site";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo-jsonld";
import { resolveSiteImages, siteImage } from "@/lib/site-images";
import type { Locale } from "@/types/cms";

const supportPageCopy = {
  en: {
    title: "App and Website Support",
    eyebrow: "Support center",
    intro:
      "Send one complete request for MoPlayer Pro, MoPlayer Classic, MoPlayer PC, downloads, activation, playback, or website questions. The request is routed to email and the admin control center.",
    sent: "Your request was received. A reply will be sent to the email address you entered.",
    directTitle: "Direct channels",
    formTitle: "Support request",
    name: "Name",
    email: "Email",
    whatsapp: "WhatsApp or phone (optional)",
    product: "Product or area",
    issue: "Issue type",
    device: "Device",
    version: "App version (optional)",
    screenshot: "Screenshot (optional image, max 8 MB)",
    message: "What happened?",
    messageHelp: "Include the exact error text, device code if relevant, and what you already tried.",
    submit: "Send support request",
    privacy: "Privacy",
    appPage: "MoPlayer Pro page",
    cards: [
      ["Activation", "Include the device code and the product name shown in the app."],
      ["Playback", "Include device type, app version, and whether the issue affects one channel or all channels."],
      ["Downloads", "Use the official download page and mention Android TV, Fire TV, phone, or Windows."],
    ],
  },
  ar: {
    title: "دعم التطبيقات والموقع",
    eyebrow: "مركز الدعم",
    intro:
      "أرسل طلبًا كاملًا لـ MoPlayer Pro أو MoPlayer Classic أو MoPlayer PC أو التحميل أو التفعيل أو التشغيل أو أسئلة الموقع. يصل الطلب إلى البريد ولوحة التحكم.",
    sent: "تم استلام طلبك. سيتم الرد على البريد الإلكتروني الذي أدخلته.",
    directTitle: "قنوات مباشرة",
    formTitle: "طلب دعم",
    name: "الاسم",
    email: "البريد الإلكتروني",
    whatsapp: "واتساب أو هاتف (اختياري)",
    product: "المنتج أو القسم",
    issue: "نوع المشكلة",
    device: "الجهاز",
    version: "إصدار التطبيق (اختياري)",
    screenshot: "صورة شاشة (اختياري، حتى 8 MB)",
    message: "ماذا حدث؟",
    messageHelp: "اكتب نص الخطأ، كود الجهاز إن وجد، وما الذي جربته سابقًا.",
    submit: "إرسال طلب الدعم",
    privacy: "الخصوصية",
    appPage: "صفحة MoPlayer Pro",
    cards: [
      ["التفعيل", "أرسل كود الجهاز واسم المنتج الظاهر داخل التطبيق."],
      ["التشغيل", "اكتب نوع الجهاز ورقم الإصدار وهل المشكلة في قناة واحدة أم كل القنوات."],
      ["التحميل", "استخدم صفحة التحميل الرسمية واذكر Android TV أو Fire TV أو الهاتف أو Windows."],
    ],
  },
} satisfies Record<Locale, Record<string, string | Array<[string, string]>>>;

const productOptions = {
  en: [
    ["moplayer2", "MoPlayer Pro"],
    ["moplayer", "MoPlayer Classic"],
    ["moplayer-pc", "MoPlayer PC / Windows"],
    ["website", "Website service"],
    ["other", "Other"],
  ],
  ar: [
    ["moplayer2", "MoPlayer Pro"],
    ["moplayer", "MoPlayer Classic"],
    ["moplayer-pc", "MoPlayer PC / Windows"],
    ["website", "خدمة موقع"],
    ["other", "أخرى"],
  ],
} satisfies Record<Locale, Array<[string, string]>>;

const issueOptions = {
  en: [
    ["activation", "Activation"],
    ["download", "Download or install"],
    ["playback", "Playback"],
    ["source", "Playlist / IPTV source handoff"],
    ["account", "Account or license"],
    ["website", "Website project"],
    ["other", "Other"],
  ],
  ar: [
    ["activation", "التفعيل"],
    ["download", "التحميل أو التثبيت"],
    ["playback", "التشغيل"],
    ["source", "تسليم مصدر IPTV / Playlist"],
    ["account", "الحساب أو الترخيص"],
    ["website", "مشروع موقع"],
    ["other", "أخرى"],
  ],
} satisfies Record<Locale, Array<[string, string]>>;

const deviceOptions = {
  en: [
    ["android-tv", "Android TV"],
    ["fire-tv", "Fire TV"],
    ["android-phone", "Android phone/tablet"],
    ["windows", "Windows PC"],
    ["browser", "Browser"],
    ["other", "Other"],
  ],
  ar: [
    ["android-tv", "Android TV"],
    ["fire-tv", "Fire TV"],
    ["android-phone", "هاتف/تابلت Android"],
    ["windows", "Windows PC"],
    ["browser", "متصفح"],
    ["other", "أخرى"],
  ],
} satisfies Record<Locale, Array<[string, string]>>;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const copy = supportPageCopy[loc];
  const title = copy.title as string;
  const description = copy.intro as string;
  const canonical = `${SITE_URL}/${loc}/support`;
  const snapshot = await readSnapshot();
  const siteImages = resolveSiteImages(snapshot);
  const supportImage = siteImage(siteImages, "support_hero", "/images/moplayer-activation-flow.webp");
  const socialImage = supportImage.startsWith("http") ? supportImage : `${SITE_URL}${supportImage}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/support`,
        en: `${SITE_URL}/en/support`,
        "x-default": `${SITE_URL}/en/support`,
      },
    },
    openGraph: {
      title: `${title} | Mohammad Alfarras`,
      description,
      url: canonical,
      type: "website",
      locale: loc === "ar" ? "ar_SA" : "en_US",
      siteName: "Mohammad Alfarras",
      images: [{ url: socialImage, width: 1600, height: 900, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@Moalfarras",
      creator: "@Moalfarras",
      title: `${title} | Mohammad Alfarras`,
      description,
      images: [socialImage],
    },
  };
}

export default async function LocalizedSupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ support?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const loc = locale as Locale;
  const copy = supportPageCopy[loc];
  const [classic, pro, snapshot] = await Promise.all([readAppEcosystem("moplayer"), readAppEcosystem("moplayer2"), readSnapshot()]);
  const siteImages = resolveSiteImages(snapshot);
  const heroImage = siteImage(siteImages, "support_hero", "/images/moplayer-activation-flow.webp");
  const query = (await searchParams) ?? {};
  const isSent = query.support === "sent";
  const supportEmail = pro.product.support_email || classic.product.support_email;
  const supportWhatsapp = pro.product.support_whatsapp || classic.product.support_whatsapp;
  const breadcrumb = breadcrumbJsonLd(loc, [
    { name: loc === "ar" ? "الرئيسية" : "Home", path: `/${loc}` },
    { name: copy.eyebrow as string, path: `/${loc}/support` },
  ]);
  const page = webPageJsonLd({ locale: loc, path: `/${loc}/support`, name: copy.title as string, description: copy.intro as string });

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(page) }} />
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumb) }} />
      <main className="fresh-page" dir={loc === "ar" ? "rtl" : "ltr"}>
        <section className="fresh-hero">
          <div className="fresh-hero-copy">
            <p className="fresh-eyebrow">{copy.eyebrow}</p>
            <h1>{copy.title}</h1>
            <p>{copy.intro}</p>
            {isSent ? <div className="fresh-note mt-6 text-blue-100">{copy.sent}</div> : null}
          </div>
          <aside className="fresh-card">
            <div className="relative mb-5 aspect-video overflow-hidden rounded-2xl border border-white/10">
              <Image
                src={heroImage}
                alt={copy.title as string}
                fill
                sizes="(max-width: 900px) 92vw, 420px"
                className="fresh-image"
                priority
                unoptimized={heroImage.startsWith("http")}
              />
            </div>
            <p className="fresh-eyebrow">{copy.directTitle}</p>
            <div className="fresh-channel-list">
              <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
              {supportWhatsapp ? (
                <a href={supportWhatsapp} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              ) : null}
              <Link href={`/${loc}/privacy`}>{copy.privacy as string}</Link>
              <Link href={`/${loc}/apps/moplayer2`}>{copy.appPage as string}</Link>
            </div>
          </aside>
        </section>

        <section className="fresh-section">
          <div className="fresh-contact">
            <aside className="fresh-grid">
              {(copy.cards as Array<[string, string]>).map(([title, body]) => (
                <article key={title} className="fresh-card">
                  <p className="fresh-eyebrow">{title}</p>
                  <p>{body}</p>
                </article>
              ))}
            </aside>

            <form action="/api/app/support" method="post" encType="multipart/form-data" className="fresh-form">
              <input type="hidden" name="locale" value={loc} />
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              <p className="fresh-eyebrow">{copy.formTitle}</p>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.product}</span>
                <select name="support_product" required className="fresh-input" defaultValue="moplayer2">
                  {productOptions[loc].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.issue}</span>
                <select name="issue_type" required className="fresh-input" defaultValue="activation">
                  {issueOptions[loc].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.device}</span>
                <select name="device_type" required className="fresh-input" defaultValue="android-tv">
                  {deviceOptions[loc].map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.version}</span>
                <input name="app_version" className="fresh-input" inputMode="text" maxLength={80} />
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.name}</span>
                <input name="name" required className="fresh-input" maxLength={120} />
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.email}</span>
                <input name="email" type="email" required className="fresh-input" maxLength={160} />
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.whatsapp}</span>
                <input name="whatsapp" className="fresh-input" maxLength={80} />
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.screenshot}</span>
                <input name="screenshot" type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="fresh-input" />
              </label>

              <label className="fresh-field">
                <span className="fresh-field-label">{copy.message}</span>
                <textarea name="message" required rows={8} className="fresh-input fresh-textarea" placeholder={copy.messageHelp as string} />
              </label>

              <button type="submit" className="fresh-button fresh-button-primary">
                {copy.submit}
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
