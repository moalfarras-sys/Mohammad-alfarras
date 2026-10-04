import { Gauge, Laptop, Sparkles } from "lucide-react";

import { CompareClassicPro } from "./compare";
import { DualTvInstall, FamilyGrid, familyCards, type PcFacts } from "./family";
import { ParallaxLayer } from "./hero-motion";
import { cx, LegalNote, Page, Section, SectionHead, styles, TvFrame } from "./parts";
import { classicShots, proShots } from "./shots";
import type { Lang, ReleaseFacts } from "@/lib/moplayer-release-facts";

const copy = {
  en: {
    eyebrow: "MoPlayer",
    title: ["A free player", "for every screen you watch on."],
    lead:
      "MoPlayer plays your own Xtream or M3U source on Android TV, Fire TV, phones and Windows. Pick the edition that fits your device — each download comes straight from its official release.",
    browse: "See the apps",
    tv: "Install on a TV",
    familyEyebrow: "The family",
    familyTitle: "Four editions, one way of working.",
    familyLead: "Every edition is a player only, activates with a QR code from your phone, and speaks Arabic and English.",
    chooseTitle: "Which one is right for you?",
    choose: [
      { title: "An older or low-power box", body: "Choose MoPlayer Classic. It is the lightest and runs on Android 7 at 720p." },
      { title: "A newer Android TV or Fire TV", body: "Choose MoPlayer Pro for the richer player, fast library search and continue watching." },
      { title: "A Windows PC", body: "Choose MoPlayer PC, with an installer or a portable version." },
    ],
  },
  ar: {
    eyebrow: "MoPlayer",
    title: ["مشغّل مجاني", "لكل شاشة تشاهد عليها."],
    lead:
      "يشغّل MoPlayer مصدر Xtream أو M3U الخاص بك على Android TV و Fire TV والهواتف وويندوز. اختر النسخة التي تناسب جهازك، فكل تنزيل يأتي مباشرة من إصداره الرسمي.",
    browse: "استعرض التطبيقات",
    tv: "التثبيت على التلفزيون",
    familyEyebrow: "العائلة",
    familyTitle: "أربع نسخ، وطريقة عمل واحدة.",
    familyLead: "كل نسخة مشغّل فقط، وتُفعَّل برمز QR من هاتفك، وتتحدث العربية والإنجليزية.",
    chooseTitle: "أيها يناسبك؟",
    choose: [
      { title: "صندوق قديم أو ضعيف", body: "اختر MoPlayer Classic، فهو الأخف ويعمل على أندرويد 7 بدقة 720p." },
      { title: "تلفزيون Android TV أو Fire TV حديث", body: "اختر MoPlayer Pro للمشغّل الأغنى والبحث السريع في المكتبة ومتابعة المشاهدة." },
      { title: "كمبيوتر بنظام ويندوز", body: "اختر MoPlayer PC، بمثبّت أو بنسخة محمولة." },
    ],
  },
} as const;

export function MoPlayerHubPage({
  locale,
  classic,
  pro,
  pc,
}: {
  locale: Lang;
  classic: ReleaseFacts;
  pro: ReleaseFacts;
  pc: PcFacts;
}) {
  const t = copy[locale];
  const cards = familyCards(locale, classic, pro, pc);

  return (
    <Page tone="hub" locale={locale}>
      <section aria-labelledby="hero-title" className="relative pb-8 pt-28 md:pb-12 md:pt-36">
        <div className={cx(styles.container, "grid items-center gap-14 lg:grid-cols-[1fr_1.15fr]")}>
          <div className="moh-hero-rise">
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1 id="hero-title" className={cx(styles.display, "mt-5")}>
              {t.title[0]}
              <br />
              <span className="bg-gradient-to-r from-sky-300 via-sky-200 to-orange-300 bg-clip-text text-transparent rtl:bg-gradient-to-l">{t.title[1]}</span>
            </h1>
            <p className={cx(styles.lead, "mt-6 max-w-xl")}>{t.lead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#family" className={cx(styles.btn, styles.btnPrimary)}>
                {t.browse}
              </a>
              <a href="#install-tv" className={cx(styles.btn, styles.btnGhost)}>
                {t.tv}
              </a>
            </div>
          </div>
          <div className="relative pb-[16%] pe-[8%]">
            <ParallaxLayer depth={0.7}>
              <div data-tone="classic">
                <TvFrame shot={classicShots.liveBrowser} locale={locale} priority sizes="(max-width: 1024px) 80vw, 560px" stand={false} />
              </div>
            </ParallaxLayer>
            <ParallaxLayer depth={1.6} className="absolute bottom-0 end-0 w-[66%]">
              <div data-tone="pro">
                <TvFrame shot={proShots.signIn} locale={locale} sizes="(max-width: 1024px) 60vw, 420px" />
              </div>
            </ParallaxLayer>
          </div>
        </div>
      </section>

      <Section id="family" labelledBy="family-title">
        <SectionHead id="family-title" eyebrow={t.familyEyebrow} title={t.familyTitle} lead={t.familyLead} />
        <FamilyGrid cards={cards} locale={locale} />
      </Section>

      <Section labelledBy="choose-title" className="!pt-0">
        <h2 id="choose-title" className={cx(styles.h2, "mb-8 !text-[clamp(1.5rem,2.6vw,2.2rem)]", styles.reveal)}>
          {t.chooseTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.choose.map((item, index) => {
            const Icon = [Gauge, Sparkles, Laptop][index];
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

      <DualTvInstall classic={classic} pro={pro} locale={locale} />

      <CompareClassicPro classic={classic} pro={pro} locale={locale} />

      <LegalNote locale={locale} />
    </Page>
  );
}
