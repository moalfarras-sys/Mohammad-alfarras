import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppWindow, Mail, MessageCircle, Shield } from "lucide-react";

import { SITE_URL } from "@/content/site";
import { readAppEcosystem } from "@/lib/app-ecosystem";
import { unoptimizedImage } from "@/lib/asset-url";
import { readSnapshot } from "@/lib/content/store";
import { isLocale } from "@/lib/i18n";
import { breadcrumbJsonLd, jsonLdString, webPageJsonLd } from "@/lib/seo-jsonld";
import { resolveSiteImages, siteImage } from "@/lib/site-images";
import type { Locale } from "@/types/cms";
import { SupportRequestForm } from "@/components/site/support-request-form";

const supportPageCopy = {
  en: {
    title: "App and Project Support",
    eyebrow: "Support center",
    intro:
      "Send one complete request for MoPlayer Pro, MoPlayer Classic, MoPlayer PC, downloads, activation, playback, or project questions. The request is routed to email and the admin control center.",
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
    ["website", "Project support"],
    ["other", "Other"],
  ],
  ar: [
    ["moplayer2", "MoPlayer Pro"],
    ["moplayer", "MoPlayer Classic"],
    ["moplayer-pc", "MoPlayer PC / Windows"],
    ["website", "\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0645\u0634\u0631\u0648\u0639"],
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
    ["website", "Project request"],
    ["other", "Other"],
  ],
  ar: [
    ["activation", "التفعيل"],
    ["download", "التحميل أو التثبيت"],
    ["playback", "التشغيل"],
    ["source", "تسليم مصدر IPTV / Playlist"],
    ["account", "الحساب أو الترخيص"],
    ["website", "\u0637\u0644\u0628 \u0645\u0634\u0631\u0648\u0639"],
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
    keywords:
      loc === "ar"
        ? ["دعم MoPlayer", "مساعدة تقنية", "دعم التفعيل", "مشاكل IPTV", "الدعم الفني", "محمد الفراس"]
        : ["MoPlayer support", "IPTV player help", "activation support", "technical support", "Mohammad Alfarras"],
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/support`,
        en: `${SITE_URL}/en/support`,
        "x-default": `${SITE_URL}/ar/support`,
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
                unoptimized={unoptimizedImage(heroImage)}
              />
            </div>
            <p className="fresh-eyebrow">{copy.directTitle}</p>
            <div className="fresh-channel-list">
              <a
                href={`mailto:${supportEmail}`}
                className="fresh-channel"
                aria-label={loc === "ar" ? `راسلنا عبر البريد الإلكتروني ${supportEmail}` : `Email us at ${supportEmail}`}
              >
                <span className="fresh-channel-label">
                  <Mail size={15} aria-hidden="true" /> {loc === "ar" ? "البريد الإلكتروني" : "Email"}
                </span>
                <span className="fresh-channel-value" dir="ltr">{supportEmail}</span>
              </a>
              {supportWhatsapp ? (
                <a
                  href={supportWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fresh-channel"
                  aria-label={loc === "ar" ? "تواصل عبر واتساب (يفتح في نافذة جديدة)" : "Contact on WhatsApp (opens in a new tab)"}
                >
                  <span className="fresh-channel-label">
                    <MessageCircle size={15} aria-hidden="true" /> WhatsApp
                  </span>
                  <span className="fresh-channel-value">{loc === "ar" ? "محادثة مباشرة" : "Direct chat"}</span>
                </a>
              ) : null}
              <Link href={`/${loc}/privacy`} className="fresh-channel">
                <span className="fresh-channel-label">
                  <Shield size={15} aria-hidden="true" /> {copy.privacy as string}
                </span>
              </Link>
              <Link href={`/${loc}/apps/moplayer2`} className="fresh-channel">
                <span className="fresh-channel-label">
                  <AppWindow size={15} aria-hidden="true" /> {copy.appPage as string}
                </span>
              </Link>
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

            <SupportRequestForm
              locale={loc}
              copy={{
                formTitle: copy.formTitle as string,
                product: copy.product as string,
                issue: copy.issue as string,
                device: copy.device as string,
                version: copy.version as string,
                name: copy.name as string,
                email: copy.email as string,
                whatsapp: copy.whatsapp as string,
                screenshot: copy.screenshot as string,
                message: copy.message as string,
                messageHelp: copy.messageHelp as string,
                submit: copy.submit as string,
                sent: copy.sent as string,
              }}
              productOptions={productOptions[loc]}
              issueOptions={issueOptions[loc]}
              deviceOptions={deviceOptions[loc]}
            />
          </div>
        </section>
      </main>
    </>
  );
}
