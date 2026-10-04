import Link from "next/link";
import { Gauge, KeyRound, LifeBuoy, ListVideo, MessageCircle, MonitorSmartphone, Radio, ScanLine } from "lucide-react";

import { CompareClassicPro } from "./compare";
import { ParallaxLayer } from "./hero-motion";
import {
  cx,
  DetailShot,
  DownloadButton,
  Faq,
  FeatureRow,
  GhostLink,
  InstallOnTv,
  LegalNote,
  Page,
  PhoneFrame,
  ReleaseFactsPanel,
  Section,
  SectionHead,
  styles,
  TvCodeChip,
  TvFrame,
} from "./parts";
import { classicShots } from "./shots";
import { ErrorMessagesSketch, InterfaceSizeSketch, LanguageSketch } from "./sketches";
import { getMoPlayerFaqs } from "@/content/apps";
import type { Lang, ReleaseFacts } from "@/lib/moplayer-release-facts";

const copy = {
  en: {
    eyebrow: "MoPlayer Classic",
    title: ["Your channels.", "Clear on every TV."],
    lead:
      "A light, remote-first player for your own Xtream or M3U source. Live TV with a guide, Movies and Series — at the same comfortable size on a 720p box, a 4K TV or a phone in landscape.",
    activate: "Activate with QR",
    heroChip: "New in 2.5.0",
    heroChipBody: "Same size on every TV",
    stripTitle: "What's in the box",
    strip: ["Android TV · Google TV · Fire TV", "Phones and tablets in landscape", "Xtream Codes · M3U · XMLTV", "English · العربية"],
    featuresEyebrow: "Inside 2.5.0",
    featuresTitle: "Built around the remote, tested on real lines.",
    live: {
      eyebrow: "Live TV",
      title: "A channel browser that stays open while you choose.",
      body: "Categories, numbered channels and a 16:9 preview sit side by side. Move with the D-pad, mark favorites, press OK to watch.",
      bullets: [
        "Every category shows how many channels it holds",
        "The preview never opens a second stream on one-connection lines",
        "Favorites with one press, correct Arabic channel names",
      ],
    },
    home: {
      eyebrow: "Home",
      title: "Home starts on the first title, with a Live TV row.",
      body: "Jump straight into live channels from Home. Real source names, ratings out of 10 and clean descriptions — and no more flicker when the account is re-checked.",
    },
    size: {
      eyebrow: "Interface size",
      title: "The same interface size on every TV.",
      body: "TVs and boxes report different screen densities, which used to make the interface huge on one and tiny on another. 2.5.0 draws one consistent layout everywhere, and you can still choose Compact, Standard or Large.",
    },
    lang: {
      eyebrow: "Arabic & English",
      title: "Fully translated, with a real right-to-left layout.",
      body: "Pick the device language, English or Arabic in Settings. In Arabic the whole interface mirrors, and the app now ships its real DM Sans and Outfit fonts.",
    },
    qr: {
      eyebrow: "QR activation",
      title: "Add your source from your phone, not the remote.",
      body: "The TV shows a QR code and a short device code. Scan it, enter your Xtream or M3U details at moalfarras.space/activate, and the TV continues on its own.",
      bullets: [
        "The code expires after 15 minutes; no MAC address is used",
        "Your source reaches the TV once and is not kept on the website",
        "Prefer typing? Add Xtream or M3U directly on the TV",
      ],
    },
    realTitle: "Made for the lines people actually have",
    real: [
      {
        title: "A guide for M3U too",
        body: "The XMLTV link from activation, or the playlist’s own url-tvg link, now fills the programme guide for M3U sources.",
      },
      {
        title: "Android 7 boxes at 720p",
        body: "Checked on Android TV 7.0 at 720p as well as 1080p TVs. One universal APK covers 64-bit and 32-bit ARM boxes.",
      },
      {
        title: "Clear answers on one-connection lines",
        body: "When a channel won’t open, MoPlayer says why within seconds instead of retrying forever.",
      },
    ],
    phoneTitle: "Also on phones and tablets",
    phoneBody: "Hold your phone sideways and MoPlayer Classic shrinks the TV layout to fit, full screen.",
    devices: "TV, box, phone and tablet (landscape)",
    sources: "Xtream Codes, M3U, XMLTV guide",
    faqEyebrow: "Questions",
    faqTitle: "Good to know before you install",
    helpTitle: "Something not working?",
    help: [
      "The app says the line is in use: close MoPlayer or any other player on your other devices — one-connection lines allow one stream at a time.",
      "Android blocks the install: allow your browser or Downloader to install unknown apps, then open the APK again.",
      "Activation code expired: go back and open activation again; the TV fetches a fresh code.",
    ],
    support: "Contact support",
    final: "Ready when your TV is.",
  },
  ar: {
    eyebrow: "MoPlayer Classic",
    title: ["قنواتك،", "بوضوح على كل تلفزيون."],
    lead:
      "مشغّل خفيف مصمم للريموت، يشغّل مصدر Xtream أو M3U الخاص بك. بث مباشر مع دليل البرامج، أفلام ومسلسلات، بالحجم المريح نفسه على صندوق 720p أو تلفزيون 4K أو هاتف بالوضع الأفقي.",
    activate: "فعّل عبر QR",
    heroChip: "جديد في 2.5.0",
    heroChipBody: "الحجم نفسه على كل تلفزيون",
    stripTitle: "ماذا ستجد",
    strip: ["Android TV · Google TV · Fire TV", "الهواتف والأجهزة اللوحية بالوضع الأفقي", "Xtream Codes · M3U · XMLTV", "العربية · English"],
    featuresEyebrow: "داخل الإصدار 2.5.0",
    featuresTitle: "مصمم حول الريموت، ومجرَّب على اشتراكات حقيقية.",
    live: {
      eyebrow: "البث المباشر",
      title: "متصفح قنوات يبقى مفتوحاً وأنت تختار.",
      body: "الفئات والقنوات المرقّمة ومعاينة 16:9 جنباً إلى جنب. تنقّل بأزرار الاتجاه، وأضف إلى المفضلة، واضغط OK للمشاهدة.",
      bullets: [
        "كل فئة تعرض عدد القنوات التي تضمها",
        "المعاينة لا تفتح بثاً ثانياً على الاشتراكات ذات الاتصال الواحد",
        "مفضلة بضغطة واحدة، وأسماء القنوات العربية تظهر صحيحة",
      ],
    },
    home: {
      eyebrow: "الرئيسية",
      title: "الرئيسية تبدأ من أول عنوان، مع صف للبث المباشر.",
      body: "انتقل إلى القنوات المباشرة من الرئيسية فوراً. أسماء المصادر الحقيقية، وتقييمات من 10، وأوصاف نظيفة، ولا وميض بعد اليوم عند إعادة فحص الحساب.",
    },
    size: {
      eyebrow: "حجم الواجهة",
      title: "حجم الواجهة نفسه على كل تلفزيون.",
      body: "تعلن أجهزة التلفزيون والصناديق كثافات شاشة مختلفة، فكانت الواجهة تظهر ضخمة على جهاز وصغيرة على آخر. الإصدار 2.5.0 يرسم تخطيطاً واحداً ثابتاً على كل الأجهزة، ويبقى لك اختيار: مضغوط أو قياسي أو كبير.",
    },
    lang: {
      eyebrow: "العربية والإنجليزية",
      title: "ترجمة كاملة، وواجهة من اليمين إلى اليسار فعلاً.",
      body: "اختر لغة الجهاز أو الإنجليزية أو العربية من الإعدادات. مع العربية تنعكس الواجهة بالكامل، ويأتي التطبيق الآن بخطَّيه الحقيقيين DM Sans و Outfit.",
    },
    qr: {
      eyebrow: "التفعيل عبر QR",
      title: "أضف مصدرك من هاتفك، لا بالريموت.",
      body: "يعرض التلفزيون رمز QR ورمز جهاز قصيراً. امسحه، وأدخل بيانات Xtream أو M3U عبر moalfarras.space/activate، ويكمل التلفزيون وحده.",
      bullets: [
        "تنتهي صلاحية الرمز بعد 15 دقيقة، ولا يُستخدم عنوان MAC",
        "يصل مصدرك إلى التلفزيون مرة واحدة ولا يُحفظ على الموقع",
        "تفضّل الكتابة؟ أضف Xtream أو M3U مباشرة على التلفزيون",
      ],
    },
    realTitle: "مصمم للاشتراكات التي يملكها الناس فعلاً",
    real: [
      {
        title: "دليل برامج لقوائم M3U أيضاً",
        body: "رابط XMLTV من التفعيل، أو رابط url-tvg داخل القائمة نفسها، يملأ الآن دليل البرامج لمصادر M3U.",
      },
      {
        title: "صناديق أندرويد 7 بدقة 720p",
        body: "جُرِّب على Android TV 7.0 بدقة 720p وعلى تلفزيونات 1080p. ملف APK واحد يدعم صناديق ARM بنظامي 64 و32 بت.",
      },
      {
        title: "إجابات واضحة على الاشتراكات ذات الاتصال الواحد",
        body: "إذا لم تفتح القناة، يخبرك MoPlayer بالسبب خلال ثوانٍ بدل إعادة المحاولة بلا نهاية.",
      },
    ],
    phoneTitle: "وعلى الهواتف والأجهزة اللوحية أيضاً",
    phoneBody: "أمسك هاتفك بالعرض، فيصغّر MoPlayer Classic تخطيط التلفزيون ليناسب الشاشة كاملة.",
    devices: "تلفزيون، صندوق، هاتف وجهاز لوحي (أفقي)",
    sources: "Xtream Codes و M3U ودليل XMLTV",
    faqEyebrow: "أسئلة",
    faqTitle: "معلومات تهمك قبل التثبيت",
    helpTitle: "هل هناك ما لا يعمل؟",
    help: [
      "يظهر أن الخط مستخدم: أغلق MoPlayer أو أي مشغّل آخر على أجهزتك الأخرى، فالاشتراكات ذات الاتصال الواحد تسمح ببث واحد في الوقت نفسه.",
      "أندرويد يمنع التثبيت: اسمح للمتصفح أو لتطبيق Downloader بتثبيت التطبيقات غير المعروفة، ثم افتح ملف APK مجدداً.",
      "انتهت صلاحية رمز التفعيل: ارجع وافتح التفعيل من جديد، فيجلب التلفزيون رمزاً جديداً.",
    ],
    support: "تواصل مع الدعم",
    final: "جاهز متى كان تلفزيونك جاهزاً.",
  },
} as const;

export function MoPlayerClassicPage({
  locale,
  facts,
  proFacts,
  downloads,
}: {
  locale: Lang;
  facts: ReleaseFacts;
  proFacts: ReleaseFacts;
  downloads?: string | null;
}) {
  const t = copy[locale];
  const faqs = getMoPlayerFaqs(locale);

  return (
    <Page tone="classic" locale={locale}>
      {/* ── Hero ── */}
      <section aria-labelledby="hero-title" className="relative pb-10 pt-28 md:pb-16 md:pt-36">
        <div className={cx(styles.container, "grid items-center gap-12 lg:grid-cols-[0.95fr_1.25fr] lg:gap-10")}>
          <div className="moh-hero-rise">
            <p className={styles.eyebrow}>
              {t.eyebrow} <span className="opacity-60">·</span> <bdi className="normal-case">v{facts.version}</bdi>
            </p>
            <h1 id="hero-title" className={cx(styles.display, "mt-5")}>
              {t.title[0]}
              <br />
              <span className={styles.accentText}>{t.title[1]}</span>
            </h1>
            <p className={cx(styles.lead, "mt-6 max-w-xl")}>{t.lead}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <DownloadButton facts={facts} locale={locale} />
              <GhostLink href={facts.activateHref(locale)} prefetch={false}>
                <KeyRound className="h-5 w-5 text-[var(--accent)]" aria-hidden />
                {t.activate}
              </GhostLink>
            </div>
            <TvCodeChip facts={facts} locale={locale} />
          </div>

          <div className={styles.heroStage}>
            <ParallaxLayer>
              <TvFrame shot={classicShots.liveBrowser} locale={locale} priority sizes="(max-width: 1024px) 92vw, 720px" />
            </ParallaxLayer>
            <ParallaxLayer depth={1.9} className={styles.heroPhone}>
              <PhoneFrame shot={classicShots.activationPhone} locale={locale} sizes="(max-width: 1024px) 44vw, 330px" />
            </ParallaxLayer>
            <div className={cx(styles.floatChip, "end-[2%] top-[-4%] hidden sm:inline-flex")}>
              <span className={styles.statusDot} aria-hidden />
              <span>
                <span className="block text-[11px] uppercase tracking-[0.12em] text-white/50">{t.heroChip}</span>
                {t.heroChipBody}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Capability strip ── */}
      <div className={cx(styles.container, "pb-6")}>
        <h2 className="sr-only">{t.stripTitle}</h2>
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {t.strip.map((item, index) => {
            const Icon = [Radio, MonitorSmartphone, ListVideo, MessageCircle][index];
            return (
              <li key={item} className="flex items-center gap-3 bg-[#05080e] px-5 py-4 text-sm font-semibold text-white/80">
                <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
                <bdi>{item}</bdi>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ── Feature showcase ── */}
      <Section id="features" labelledBy="features-title">
        <SectionHead id="features-title" eyebrow={t.featuresEyebrow} title={t.featuresTitle} />
        <div className="grid gap-24 md:gap-32">
          <FeatureRow
            titleId="f-live"
            eyebrow={t.live.eyebrow}
            title={t.live.title}
            body={t.live.body}
            bullets={[...t.live.bullets]}
            media={<DetailShot shot={classicShots.liveBrowser} locale={locale} sizes="(max-width: 1024px) 92vw, 600px" position="78% 30%" />}
          />
          <FeatureRow
            flip
            titleId="f-home"
            eyebrow={t.home.eyebrow}
            title={t.home.title}
            body={t.home.body}
            media={<TvFrame shot={classicShots.homeLiveRow} locale={locale} sizes="(max-width: 1024px) 92vw, 580px" stand={false} />}
          />
          <FeatureRow titleId="f-size" eyebrow={t.size.eyebrow} title={t.size.title} body={t.size.body} media={<InterfaceSizeSketch locale={locale} />} />
          <FeatureRow flip titleId="f-lang" eyebrow={t.lang.eyebrow} title={t.lang.title} body={t.lang.body} media={<LanguageSketch locale={locale} />} />
          <FeatureRow
            titleId="f-qr"
            eyebrow={t.qr.eyebrow}
            title={t.qr.title}
            body={t.qr.body}
            bullets={[...t.qr.bullets]}
            media={<PhoneFrame shot={classicShots.activationPhone} locale={locale} sizes="(max-width: 1024px) 92vw, 580px" />}
          />
        </div>
      </Section>

      {/* ── Real-line details ── */}
      <Section labelledBy="real-title" className="!pt-0">
        <h2 id="real-title" className={cx(styles.h2, "mb-10 max-w-2xl !text-[clamp(1.5rem,2.6vw,2.2rem)]", styles.reveal)}>
          {t.realTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.real.map((item, index) => {
            const Icon = [ListVideo, Gauge, ScanLine][index];
            return (
              <article key={item.title} className={cx(styles.panel, "p-6", styles.reveal)}>
                <span className={styles.iconTile}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-extrabold">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-white/70">{item.body}</p>
                {index === 2 ? <ErrorMessagesSketch locale={locale} /> : null}
              </article>
            );
          })}
        </div>

        <div className={cx(styles.panel, "mt-4 grid items-center gap-8 p-6 md:grid-cols-[1fr_1.1fr] md:p-10", styles.reveal)}>
          <div>
            <h3 className="text-2xl font-extrabold">{t.phoneTitle}</h3>
            <p className="mt-3 text-[15px] leading-7 text-white/70">{t.phoneBody}</p>
          </div>
          <PhoneFrame shot={classicShots.setupPhone} locale={locale} sizes="(max-width: 768px) 90vw, 560px" />
        </div>
      </Section>

      <InstallOnTv facts={facts} locale={locale} productName="MoPlayer Classic" />

      <ReleaseFactsPanel facts={facts} locale={locale} productName="MoPlayer Classic" devices={t.devices} sources={t.sources} downloads={downloads} />

      <CompareClassicPro classic={facts} pro={proFacts} locale={locale} current="classic" />

      <Faq
        eyebrow={t.faqEyebrow}
        title={t.faqTitle}
        items={faqs.map((item) => ({ q: item.question, a: item.answer }))}
        aside={
          <div className={cx(styles.panel, "p-6")}>
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              <LifeBuoy className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              {t.helpTitle}
            </h3>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-white/70">
              {t.help.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link href={`/${locale}/support`} className={cx(styles.btn, styles.btnGhost, "mt-5")}>
              {t.support}
            </Link>
          </div>
        }
      />

      {/* ── Closing CTA ── */}
      <Section className="!pt-0">
        <div className={cx(styles.panelAccent, "flex flex-col items-start gap-6 p-8 md:flex-row md:items-center md:justify-between md:p-12", styles.reveal)}>
          <h2 className={cx(styles.h2, "max-w-xl")}>{t.final}</h2>
          <div className="flex flex-wrap gap-3">
            <DownloadButton facts={facts} locale={locale} />
            <GhostLink href={facts.activateHref(locale)} prefetch={false}>
              <KeyRound className="h-5 w-5 text-[var(--accent)]" aria-hidden />
              {t.activate}
            </GhostLink>
          </div>
        </div>
      </Section>

      <LegalNote locale={locale} />
    </Page>
  );
}
