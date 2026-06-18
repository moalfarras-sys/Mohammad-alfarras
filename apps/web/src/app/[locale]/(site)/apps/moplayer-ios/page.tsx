import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Film,
  Heart,
  KeyRound,
  ListVideo,
  LockKeyhole,
  PlayCircle,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { SITE_URL } from "@/content/site";
import { isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/cms";

const copy = {
  en: {
    eyebrow: "MoPlayer Pro for iPhone",
    title: "MoPlayer iOS",
    subtitle: "A premium iPhone media player for your own legal M3U and Xtream sources.",
    status: "App Store preparation build",
    body:
      "The iOS app is prepared for TestFlight and App Store review. It does not provide channels, playlists, movies, sports, or copyrighted content. Users add their own legally obtained source.",
    primary: "Get support",
    secondary: "Privacy policy",
    activate: "QR activation",
    sections: [
      ["Source setup", "Xtream login, M3U URL import, QR activation, and source switching from Settings.", KeyRound],
      ["Premium browsing", "Home, Live, Movies, Series, Episodes, Search, Favorites, History, and Continue Watching.", ListVideo],
      ["Player quality", "Landscape playback controls, buffering state, retry, resume progress, wake lock, and cleanup on exit.", PlayCircle],
      ["App Store-safe", "Legal demo mode, clear disclaimer, privacy controls, and no bundled copyrighted media.", ShieldCheck],
    ],
    features: ["Legal Demo mode", "Secure local source storage", "Slim Live preview", "Latest server additions", "Source deletion", "Privacy and data controls"],
    legalTitle: "Player-only legal notice",
    legalBody:
      "MoPlayer iOS is a media player only. It does not sell, distribute, promote, or bundle channels, playlists, movies, TV streams, premium sports, or copyrighted content.",
    reviewTitle: "Prepared for Mac publishing",
    reviewBody:
      "The source tree includes App Store metadata templates, privacy checklist, TestFlight test plan, screenshot guide, Mac publishing guide, and tvOS feasibility notes.",
  },
  ar: {
    eyebrow: "MoPlayer Pro للآيفون",
    title: "MoPlayer iOS",
    subtitle: "مشغل وسائط فاخر للآيفون لمصادر M3U و Xtream القانونية التي يضيفها المستخدم بنفسه.",
    status: "نسخة تجهيز App Store",
    body:
      "تطبيق iOS جاهز للتحضير عبر TestFlight و App Store. التطبيق لا يوفر قنوات أو قوائم تشغيل أو أفلام أو بث رياضي أو أي محتوى محمي. المستخدم يضيف مصدره القانوني بنفسه.",
    primary: "الدعم",
    secondary: "سياسة الخصوصية",
    activate: "تفعيل QR",
    sections: [
      ["إضافة المصدر", "تسجيل Xtream، رابط M3U، تفعيل QR، وتبديل المصادر من الإعدادات.", KeyRound],
      ["تصفح فاخر", "الرئيسية، البث المباشر، الأفلام، المسلسلات، الحلقات، البحث، المفضلة، السجل، والمتابعة.", ListVideo],
      ["مشغل قوي", "تحكم أفقي، حالة تحميل، إعادة محاولة، استكمال مشاهدة، إبقاء الشاشة، وتنظيف الموارد عند الخروج.", PlayCircle],
      ["آمن للمراجعة", "وضع demo قانوني، تنبيه واضح، إعدادات خصوصية، وبدون أي محتوى محمي مدمج.", ShieldCheck],
    ],
    features: ["وضع demo قانوني", "تخزين محلي آمن", "معاينة Live نحيفة", "أحدث إضافات السيرفر", "حذف المصادر", "إعدادات خصوصية وحذف بيانات"],
    legalTitle: "تنبيه قانوني",
    legalBody:
      "MoPlayer iOS هو مشغل وسائط فقط. لا يبيع ولا يوزع ولا يروج ولا يضمن قنوات أو قوائم تشغيل أو أفلام أو بث تلفزيوني أو رياضي أو محتوى محمي.",
    reviewTitle: "جاهز للتحضير من Mac",
    reviewBody:
      "المشروع يحتوي على قوالب App Store، قائمة الخصوصية، خطة TestFlight، دليل الصور، دليل النشر من Mac، وتقرير جدوى tvOS.",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const loc = locale as Locale;
  const c = copy[loc];
  const canonical = `${SITE_URL}/${loc}/apps/moplayer-ios`;
  return {
    title: `${c.title} | Moalfarras`,
    description: c.subtitle,
    alternates: {
      canonical,
      languages: {
        ar: `${SITE_URL}/ar/apps/moplayer-ios`,
        en: `${SITE_URL}/en/apps/moplayer-ios`,
        "x-default": `${SITE_URL}/en/apps/moplayer-ios`,
      },
    },
    openGraph: {
      title: c.title,
      description: c.subtitle,
      url: canonical,
      type: "website",
    },
  };
}

export default async function MoPlayerIosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const loc = locale as Locale;
  const c = copy[loc];
  const isAr = loc === "ar";

  return (
    <main dir={isAr ? "rtl" : "ltr"} className="min-h-screen overflow-hidden bg-[#050506] text-white">
      <section className="relative px-5 pb-12 pt-28 md:pb-16 md:pt-36">
        <Image
          src="/images/moplayer-pro-bg.png"
          alt=""
          fill
          priority
          className="absolute inset-0 -z-20 object-cover object-top opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,5,6,0.42),#050506_72%),linear-gradient(90deg,#050506_0%,rgba(5,5,6,0.76)_48%,rgba(5,5,6,0.42)_100%)]" />
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-orange-300/20 bg-orange-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-orange-200">
              <BadgeCheck size={15} /> {c.eyebrow}
            </span>
            <h1 className="mt-6 text-5xl font-black text-white md:text-7xl">{c.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/76">{c.subtitle}</p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">{c.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${loc}/support`} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-black text-white shadow-[0_18px_60px_rgba(249,115,22,0.25)] transition hover:bg-orange-400">
                <Smartphone size={18} /> {c.primary}
              </Link>
              <Link href={`/${loc}/privacy`} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/84 transition hover:bg-white/[0.08]">
                <LockKeyhole size={18} /> {c.secondary}
              </Link>
              <Link href={`/${loc}/activate?product=moplayer2&platform=ios`} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/84 transition hover:bg-white/[0.08]">
                <KeyRound size={18} /> {c.activate}
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px]">
            <div className="relative border border-white/12 bg-white/[0.055] p-3 shadow-2xl backdrop-blur-xl" style={{ borderRadius: 28 }}>
              <div className="relative overflow-hidden border border-white/10 bg-[#0b0b0f]" style={{ borderRadius: 22 }}>
                <Image src="/images/moplayer-pro-home.webp" alt="MoPlayer iOS interface preview" width={960} height={720} className="h-auto w-full object-cover" priority />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/72 to-transparent p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200">{c.status}</p>
                      <h2 className="mt-2 text-2xl font-black">MoPlayer Pro</h2>
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-lg bg-orange-500 text-white">
                      <PlayCircle size={25} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[Film, ListVideo, Search].map((Icon, index) => (
                  <div key={index} className="border border-white/8 bg-white/[0.04] p-3" style={{ borderRadius: 12 }}>
                    <Icon className="text-orange-200" size={20} />
                    <div className="mt-8 h-1.5 rounded-full bg-white/20" />
                    <div className="mt-2 h-1.5 w-2/3 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
              <div className="mt-3 border border-orange-300/15 bg-orange-300/[0.08] p-4" style={{ borderRadius: 14 }}>
                <div className="flex items-center gap-3">
                  <Sparkles className="text-orange-200" size={22} />
                  <div className="min-w-0 flex-1">
                    <div className="h-2.5 w-3/4 rounded-full bg-white/55" />
                    <div className="mt-2 h-2 w-1/2 rounded-full bg-white/20" />
                  </div>
                  <Heart className="text-orange-300" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {c.sections.map(([title, body, Icon]) => (
            <article key={title} className="border border-white/8 bg-white/[0.035] p-5" style={{ borderRadius: 8 }}>
              <Icon className="text-orange-200" size={24} />
              <h2 className="mt-4 text-xl font-black">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/65">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-16">
        <div className="mx-auto max-w-6xl border border-orange-300/15 bg-orange-300/[0.055] p-6 md:p-8" style={{ borderRadius: 8 }}>
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <ShieldCheck className="text-orange-200" size={26} />
              <h2 className="mt-4 text-2xl font-black">{c.legalTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-white/70">{c.legalBody}</p>
              <h3 className="mt-6 text-lg font-black">{c.reviewTitle}</h3>
              <p className="mt-2 text-sm leading-7 text-white/64">{c.reviewBody}</p>
            </div>
            <div className="grid min-w-[240px] gap-2">
              {c.features.map((feature) => (
                <div key={feature} className="border border-white/8 bg-black/20 px-4 py-3 text-sm font-bold text-white/80" style={{ borderRadius: 8 }}>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
