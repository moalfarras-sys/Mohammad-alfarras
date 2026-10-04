import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Tv } from "lucide-react";

import { FamilyGrid, familyCards, type PcFacts } from "./family";
import { cx, Page, Section, SectionHead, styles } from "./parts";
import type { Lang, ReleaseFacts } from "@/lib/moplayer-release-facts";
import { tvInstallPagePath } from "@moalfarras/shared/app-releases";

const copy = {
  en: {
    eyebrow: "Apps",
    title: ["Apps for your TV,", "phone and desktop."],
    lead: "MoPlayer for TVs, phones and Windows, and MoOS for the desktop. Every download on these pages is the official build, with its real version and size.",
    moplayerEyebrow: "MoPlayer",
    moplayerTitle: "A free player for your own Xtream or M3U source.",
    moplayerLead: "Player only — no channels included. Activate any edition with a QR code from your phone.",
    hub: "MoPlayer overview",
    tvTitle: "Installing on a TV?",
    tvBody: "Open moalfarras.space/tv in the Downloader app to get either Android app in one click.",
    moosEyebrow: "MoOS",
    moosTitle: "A personal desktop OS, Arabic-native.",
    moosBody: "Built on Fedora Atomic and KDE Plasma 6 with signed atomic updates. Install it with one command.",
    moosCta: "Explore MoOS",
    moosAlt: "MoOS desktop in the dark Graphite Glass theme with system, weather and clock widgets",
  },
  ar: {
    eyebrow: "التطبيقات",
    title: ["تطبيقات لتلفزيونك،", "وهاتفك وحاسوبك."],
    lead: "MoPlayer للتلفزيون والهاتف وويندوز، و MoOS لسطح المكتب. كل تنزيل في هذه الصفحات هو النسخة الرسمية، برقم إصدارها وحجمها الحقيقيين.",
    moplayerEyebrow: "MoPlayer",
    moplayerTitle: "مشغّل مجاني لمصدر Xtream أو M3U الخاص بك.",
    moplayerLead: "مشغّل فقط، بلا قنوات مضمّنة. فعّل أي نسخة برمز QR من هاتفك.",
    hub: "نظرة عامة على MoPlayer",
    tvTitle: "تثبّت على تلفزيون؟",
    tvBody: "افتح moalfarras.space/tv في تطبيق Downloader لتحصل على أيٍّ من تطبيقي أندرويد بضغطة واحدة.",
    moosEyebrow: "MoOS",
    moosTitle: "نظام تشغيل شخصي لسطح المكتب، عربي أصيل.",
    moosBody: "مبني على Fedora Atomic و KDE Plasma 6 مع تحديثات ذرّية موقّعة. ثبّته بأمر واحد.",
    moosCta: "اكتشف MoOS",
    moosAlt: "سطح مكتب MoOS بسمة Graphite Glass الداكنة مع أدوات النظام والطقس والساعة",
  },
} as const;

export function AppsIndexPage({ locale, classic, pro, pc }: { locale: Lang; classic: ReleaseFacts; pro: ReleaseFacts; pc: PcFacts }) {
  const t = copy[locale];
  const cards = familyCards(locale, classic, pro, pc);

  return (
    <Page tone="hub" locale={locale}>
      <section aria-labelledby="hero-title" className="relative pb-4 pt-28 md:pt-36">
        <div className={styles.container}>
          <p className={styles.eyebrow}>{t.eyebrow}</p>
          <h1 id="hero-title" className={cx(styles.display, "mt-5 max-w-4xl")}>
            {t.title[0]}
            <br />
            <span className="bg-gradient-to-r from-sky-300 to-orange-300 bg-clip-text text-transparent rtl:bg-gradient-to-l">{t.title[1]}</span>
          </h1>
          <p className={cx(styles.lead, "mt-6 max-w-2xl")}>{t.lead}</p>
        </div>
      </section>

      <Section id="moplayer" labelledBy="moplayer-title">
        <div className="mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
          <SectionHead id="moplayer-title" eyebrow={t.moplayerEyebrow} title={t.moplayerTitle} lead={t.moplayerLead} />
          <Link href={`/${locale}/apps/moplayer`} className={cx(styles.btn, styles.btnGhost, "mb-10 shrink-0 md:mb-14")}>
            {t.hub}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
        <FamilyGrid cards={cards} locale={locale} />
        <a href={tvInstallPagePath} className={cx(styles.panel, styles.focusRing, "mt-5 flex items-center gap-4 p-5 transition hover:border-white/25")}>
          <span className={styles.iconTile}>
            <Tv className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-extrabold">{t.tvTitle}</span>
            <span className="block text-sm text-white/65">{t.tvBody}</span>
          </span>
        </a>
      </Section>

      <Section id="moos" labelledBy="moos-title" className="!pt-0">
        <article className={cx(styles.familyCard, "grid md:grid-cols-[1.1fr_1fr]", styles.reveal)}>
          <div className="relative min-h-[220px] overflow-hidden bg-black md:min-h-[360px]">
            <Image src="/images/moos/desktop-dark.webp" alt={t.moosAlt} fill sizes="(max-width: 768px) 92vw, 640px" quality={75} className="object-cover" />
          </div>
          <div className="flex flex-col justify-center p-7 md:p-10">
            <p className={styles.eyebrow}>{t.moosEyebrow}</p>
            <h2 id="moos-title" className="mt-4 text-3xl font-extrabold tracking-tight">
              {t.moosTitle}
            </h2>
            <p className="mt-3 text-[15px] leading-7 text-white/70">{t.moosBody}</p>
            <Link href={`/${locale}/moos`} className={cx(styles.btn, styles.btnGhost, "mt-6 self-start")}>
              {t.moosCta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </article>
      </Section>
    </Page>
  );
}
