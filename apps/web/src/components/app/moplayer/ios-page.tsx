import Link from "next/link";
import { ArrowRight, Heart, History, KeyRound, ListVideo, LockKeyhole, QrCode } from "lucide-react";

import { cx, LegalNote, Page, Section, styles } from "./parts";
import type { Lang } from "@/lib/moplayer-release-facts";

export type IosStatus = {
  status: "coming_soon" | "testflight" | "app_store";
  /** Only set when it is a real Apple URL (App Store or TestFlight). */
  appleUrl: string | null;
  note: string;
};

const copy = {
  en: {
    eyebrow: "MoPlayer for iPhone",
    title: ["MoPlayer iOS.", "Coming to the App Store."],
    lead:
      "A touch-first MoPlayer for iPhone is being prepared for Apple review. It is not available to download yet — there is no App Store listing and no beta link on this page until Apple approves it.",
    status: {
      coming_soon: "In preparation",
      testflight: "TestFlight beta",
      app_store: "On the App Store",
    },
    apple: { testflight: "Join the TestFlight beta", app_store: "Open in the App Store" },
    notify: "Ask to be told when it is out",
    planTitle: "What the iPhone app will include",
    plan: [
      { title: "Your own source", body: "Sign in with Xtream or an M3U link — or scan a QR code and send it from another device." },
      { title: "Stored on the phone", body: "Your source is kept in secure storage on the device." },
      { title: "Live, Movies, Series", body: "Browse the library your source provides, with search." },
      { title: "Favorites and history", body: "Keep favorites, see what you watched and continue where you stopped." },
    ],
    meanwhileTitle: "Watching on a TV today?",
    meanwhile: "MoPlayer Classic and MoPlayer Pro are available now for Android TV, Google TV and Fire TV, and MoPlayer PC for Windows.",
    meanwhileCta: "See the apps you can install now",
    sketch: "Illustration of the iPhone app layout, not a screenshot",
  },
  ar: {
    eyebrow: "MoPlayer للآيفون",
    title: ["MoPlayer iOS", "قريباً على App Store."],
    lead:
      "نسخة MoPlayer للآيفون مصممة للمس وقيد التحضير لمراجعة Apple. ليست متاحة للتنزيل بعد، ولن تجد في هذه الصفحة رابط App Store أو رابط تجربة قبل موافقة Apple.",
    status: {
      coming_soon: "قيد التحضير",
      testflight: "نسخة تجريبية عبر TestFlight",
      app_store: "متاح على App Store",
    },
    apple: { testflight: "انضم إلى تجربة TestFlight", app_store: "افتح في App Store" },
    notify: "اطلب إشعارك عند الإطلاق",
    planTitle: "ما الذي سيتضمنه تطبيق الآيفون",
    plan: [
      { title: "مصدرك الخاص", body: "سجّل الدخول بـ Xtream أو رابط M3U، أو امسح رمز QR وأرسل المصدر من جهاز آخر." },
      { title: "محفوظ على الهاتف", body: "يُحفظ مصدرك في تخزين آمن على الجهاز." },
      { title: "بث مباشر وأفلام ومسلسلات", body: "تصفّح المكتبة التي يوفرها مصدرك، مع البحث." },
      { title: "المفضلة والسجل", body: "احتفظ بالمفضلة، وراجع ما شاهدته، وأكمل من حيث توقفت." },
    ],
    meanwhileTitle: "تشاهد على التلفزيون اليوم؟",
    meanwhile: "MoPlayer Classic و MoPlayer Pro متاحان الآن لـ Android TV و Google TV و Fire TV، و MoPlayer PC لويندوز.",
    meanwhileCta: "التطبيقات المتاحة للتثبيت الآن",
    sketch: "رسم توضيحي لتخطيط تطبيق الآيفون، وليس لقطة شاشة",
  },
} as const;

function PhoneSketch({ label }: { label: string }) {
  return (
    <figure role="img" aria-label={label} className="mx-auto w-[min(300px,72vw)]">
      <div className="rounded-[46px] border border-white/15 bg-gradient-to-b from-[#20242c] to-[#0a0b0e] p-3 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.9)]">
        <div className="relative overflow-hidden rounded-[36px] bg-[radial-gradient(90%_60%_at_50%_0%,rgba(255,154,90,0.22),transparent_70%),linear-gradient(180deg,#121722,#07090e)] p-5" style={{ aspectRatio: "9 / 19.5" }}>
          <div className="mx-auto mb-6 h-6 w-24 rounded-full bg-black" />
          <div className="h-3 w-24 rounded bg-white/70" />
          <div className="mt-2 h-2 w-36 rounded bg-white/25" />
          <div className="mt-6 aspect-video w-full rounded-2xl bg-gradient-to-br from-orange-300/40 to-amber-200/10" />
          <div className="mt-5 h-2.5 w-20 rounded bg-white/50" />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="aspect-[2/3] rounded-lg bg-white/10" />
            ))}
          </div>
          <div className="absolute inset-x-5 bottom-5 flex justify-between rounded-2xl bg-white/[0.06] px-4 py-3">
            {Array.from({ length: 4 }, (_, index) => (
              <span key={index} className={cx("h-2.5 w-2.5 rounded-full", index === 0 ? "bg-orange-300" : "bg-white/30")} />
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

export function MoPlayerIosPageView({ locale, ios }: { locale: Lang; ios: IosStatus }) {
  const t = copy[locale];
  const live = ios.status !== "coming_soon" && ios.appleUrl;
  const icons = [KeyRound, LockKeyhole, ListVideo, Heart];

  return (
    <Page tone="ios" locale={locale}>
      <section aria-labelledby="hero-title" className="relative pb-12 pt-28 md:pb-20 md:pt-36">
        <div className={cx(styles.container, "grid items-center gap-14 lg:grid-cols-[1.2fr_0.8fr]")}>
          <div className="moh-hero-rise">
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1 id="hero-title" className={cx(styles.display, "mt-5")}>
              {t.title[0]}
              <br />
              <span className="bg-gradient-to-r from-slate-100 to-orange-200 bg-clip-text text-transparent rtl:bg-gradient-to-l">{t.title[1]}</span>
            </h1>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-bold">
              <span className={cx(styles.statusDot, ios.status === "coming_soon" && styles.statusDotSoon)} aria-hidden />
              {t.status[ios.status]}
            </p>
            <p className={cx(styles.lead, "mt-6 max-w-xl")}>{t.lead}</p>
            {ios.note ? <p className="mt-3 max-w-xl text-sm text-white/60">{ios.note}</p> : null}
            <div className="mt-8 flex flex-wrap gap-3">
              {live && ios.appleUrl ? (
                <a href={ios.appleUrl} className={cx(styles.btn, styles.btnPrimary)} rel="noopener">
                  {ios.status === "testflight" ? t.apple.testflight : t.apple.app_store}
                </a>
              ) : (
                <Link href={`/${locale}/contact`} className={cx(styles.btn, styles.btnGhost)}>
                  {t.notify}
                </Link>
              )}
              <Link href={`/${locale}/apps/moplayer`} className={cx(styles.btn, styles.btnGhost)}>
                {t.meanwhileCta}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </div>
          </div>
          <PhoneSketch label={t.sketch} />
        </div>
      </section>

      <Section labelledBy="plan-title">
        <h2 id="plan-title" className={cx(styles.h2, "mb-10 !text-[clamp(1.6rem,2.8vw,2.4rem)]", styles.reveal)}>
          {t.planTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.plan.map((item, index) => {
            const Icon = icons[index] ?? History;
            return (
              <article key={item.title} className={cx(styles.panel, "p-6", styles.reveal)}>
                <span className={styles.iconTile}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-white/70">{item.body}</p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section className="!pt-0">
        <div className={cx(styles.panelAccent, "flex flex-col gap-5 p-8 md:flex-row md:items-center md:justify-between md:p-10", styles.reveal)}>
          <div className="flex items-start gap-4">
            <span className={styles.iconTile}>
              <QrCode className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold">{t.meanwhileTitle}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-white/70">{t.meanwhile}</p>
            </div>
          </div>
          <Link href={`/${locale}/apps/moplayer`} className={cx(styles.btn, styles.btnPrimary, "shrink-0")}>
            {t.meanwhileCta}
          </Link>
        </div>
      </Section>

      <LegalNote locale={locale} />
    </Page>
  );
}
