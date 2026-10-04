import Link from "next/link";
import { BadgeCheck, KeyRound, LifeBuoy, ListVideo, MonitorSmartphone, Radio, Ruler, SkipForward } from "lucide-react";

import { CompareClassicPro } from "./compare";
import { ParallaxLayer } from "./hero-motion";
import {
  cx,
  DownloadButton,
  Faq,
  FeatureRow,
  GhostLink,
  InstallOnTv,
  LegalNote,
  Page,
  ReleaseFactsPanel,
  Section,
  SectionHead,
  styles,
  TvCodeChip,
  TvFrame,
} from "./parts";
import { proShots } from "./shots";
import { getMoPlayerProFaqs } from "@/content/apps";
import type { Lang, ReleaseFacts } from "@/lib/moplayer-release-facts";

const copy = {
  en: {
    eyebrow: "MoPlayer Pro",
    title: ["Rebuilt for", "the big screen."],
    lead:
      "The newer MoPlayer for Android TV, Google TV and Fire TV: a Jetpack Compose interface in warm amber glass, a fast indexed library and a player that keeps up when you zap — for your own Xtream or M3U source.",
    activate: "Activate with QR",
    chip: (v: string) => `New in ${v}`,
    chipBody: "Same size on every TV",
    strip: ["Android TV · Google TV · Fire TV", "Adaptive phone and tablet layouts", "Xtream · M3U · XMLTV", "English · العربية"],
    featuresEyebrow: "What makes it Pro",
    featuresTitle: "Faster to browse, calmer to watch.",
    live: {
      eyebrow: "Live menu",
      title: "Change channel without leaving the picture.",
      body: "Open the live menu over the video to switch channels or groups, change the video size, audio track or subtitles, and add favorites.",
      bullets: [
        "One player stays open across channels, so zapping is quicker",
        "Media3 playback with a LibVLC fallback for stubborn streams",
        "Clear, translated messages when a stream fails",
      ],
    },
    signin: {
      eyebrow: "Sign in",
      title: "Three ways in: M3U, Xtream or a QR code.",
      body: "Paste an M3U link or pick a file, enter your Xtream account, or show a temporary QR code and add the source from your phone.",
      bullets: [
        "M3U link or file, with an optional EPG link",
        "Xtream accounts show subscription and expiry info",
        "Your source is cached on the device; smart refresh keeps it current",
      ],
    },
    search: {
      eyebrow: "Library",
      title: "Search your whole library at once.",
      body: "Channels, movies, series and episodes are indexed on the device while your source syncs, so search answers as you type — even on large lines.",
    },
    look: {
      eyebrow: "Look & language",
      title: "Arabic or English, at the size your TV needs.",
      body: "Switch between the system language, English and Arabic. Since 2.7.2 the interface is drawn at the same size on every TV, with an Interface size option (Compact, Standard, Large) and full group names.",
    },
    more: [
      { title: "Continue watching", body: "Pick up movies and episodes where you stopped, and the next episode is offered when one ends." },
      { title: "Verified updates", body: "The in-app updater checks the file size and SHA-256 before it installs a new version." },
      { title: "Same size on every TV", body: "TVs that report an odd density or a large system font no longer get an oversized interface." },
    ],
    devices: "Android TV, Google TV, Fire TV, phones and tablets",
    sources: "Xtream, M3U, XMLTV guide",
    faqEyebrow: "Questions",
    faqTitle: "Before you install MoPlayer Pro",
    helpTitle: "Need a hand?",
    help: [
      "Android blocks the install: allow your browser or Downloader to install unknown apps, then open the APK again.",
      "A channel will not play: the app tells you why; on one-connection lines close other players first.",
      "Activation code expired: open QR Code again to get a fresh one.",
    ],
    support: "Contact support",
    final: "Bring your source. Pro does the rest.",
    shotsNote: "Screens from MoPlayer Pro QA builds with test streams.",
  },
  ar: {
    eyebrow: "MoPlayer Pro",
    title: ["أُعيد بناؤه", "للشاشة الكبيرة."],
    lead:
      "الجيل الأحدث من MoPlayer لأجهزة Android TV و Google TV و Fire TV: واجهة Jetpack Compose بزجاج كهرماني دافئ، ومكتبة مفهرسة سريعة، ومشغّل يواكبك حين تتنقل بين القنوات، لمصدر Xtream أو M3U الخاص بك.",
    activate: "فعّل عبر QR",
    chip: (v: string) => `جديد في ${v}`,
    chipBody: "الحجم نفسه على كل تلفزيون",
    strip: ["Android TV · Google TV · Fire TV", "تخطيطات متكيفة للهاتف والجهاز اللوحي", "Xtream · M3U · XMLTV", "العربية · English"],
    featuresEyebrow: "ما الذي يجعله Pro",
    featuresTitle: "تصفّح أسرع، ومشاهدة أهدأ.",
    live: {
      eyebrow: "قائمة البث",
      title: "غيّر القناة دون أن تغادر الصورة.",
      body: "افتح قائمة البث فوق الفيديو لتنتقل بين القنوات والمجموعات، وتغيّر حجم الصورة أو مسار الصوت أو الترجمة، وتضيف إلى المفضلة.",
      bullets: [
        "مشغّل واحد يبقى مفتوحاً بين القنوات، فيصبح التنقل أسرع",
        "تشغيل عبر Media3 مع LibVLC احتياطياً للبث الصعب",
        "رسائل واضحة ومترجمة عند تعذّر البث",
      ],
    },
    signin: {
      eyebrow: "الدخول",
      title: "ثلاث طرق للدخول: M3U أو Xtream أو رمز QR.",
      body: "الصق رابط M3U أو اختر ملفاً، أو أدخل حساب Xtream، أو اعرض رمز QR مؤقتاً وأضف المصدر من هاتفك.",
      bullets: [
        "رابط M3U أو ملف، مع رابط EPG اختياري",
        "حسابات Xtream تعرض معلومات الاشتراك وتاريخ الانتهاء",
        "يُحفظ مصدرك على الجهاز، والتحديث الذكي يبقيه محدّثاً",
      ],
    },
    search: {
      eyebrow: "المكتبة",
      title: "ابحث في مكتبتك كلها دفعة واحدة.",
      body: "تُفهرَس القنوات والأفلام والمسلسلات والحلقات على الجهاز أثناء مزامنة مصدرك، فيجيب البحث وأنت تكتب، حتى على الاشتراكات الكبيرة.",
    },
    look: {
      eyebrow: "المظهر واللغة",
      title: "بالعربية أو الإنجليزية، وبالحجم الذي يناسب تلفزيونك.",
      body: "بدّل بين لغة النظام والإنجليزية والعربية. ومنذ الإصدار 2.7.2 تُرسم الواجهة بالحجم نفسه على كل تلفزيون، مع خيار حجم الواجهة (مضغوط، قياسي، كبير) وأسماء مجموعات كاملة.",
    },
    more: [
      { title: "متابعة المشاهدة", body: "أكمل الأفلام والحلقات من حيث توقفت، ويُعرض عليك الجزء التالي عند انتهاء الحلقة." },
      { title: "تحديثات موثوقة", body: "يتحقق المحدّث داخل التطبيق من حجم الملف و SHA-256 قبل تثبيت أي إصدار جديد." },
      { title: "الحجم نفسه على كل تلفزيون", body: "الأجهزة التي تعلن كثافة شاشة غريبة أو خط نظام كبيراً لم تعد تحصل على واجهة متضخمة." },
    ],
    devices: "Android TV و Google TV و Fire TV والهواتف والأجهزة اللوحية",
    sources: "Xtream و M3U ودليل XMLTV",
    faqEyebrow: "أسئلة",
    faqTitle: "قبل أن تثبّت MoPlayer Pro",
    helpTitle: "تحتاج مساعدة؟",
    help: [
      "أندرويد يمنع التثبيت: اسمح للمتصفح أو لتطبيق Downloader بتثبيت التطبيقات غير المعروفة، ثم افتح ملف APK مجدداً.",
      "قناة لا تعمل: يخبرك التطبيق بالسبب؛ وعلى الاشتراكات ذات الاتصال الواحد أغلق المشغّلات الأخرى أولاً.",
      "انتهت صلاحية رمز التفعيل: افتح QR Code مجدداً للحصول على رمز جديد.",
    ],
    support: "تواصل مع الدعم",
    final: "أحضر مصدرك، و Pro يتكفّل بالباقي.",
    shotsNote: "لقطات من نسخ اختبار MoPlayer Pro مع بث تجريبي.",
  },
} as const;

export function MoPlayerProPage({
  locale,
  facts,
  classicFacts,
  downloads,
}: {
  locale: Lang;
  facts: ReleaseFacts;
  classicFacts: ReleaseFacts;
  downloads?: string | null;
}) {
  const t = copy[locale];
  const faqs = getMoPlayerProFaqs(locale);

  return (
    <Page tone="pro" locale={locale}>
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

          <div className="relative pb-[6%]">
            <ParallaxLayer>
              <TvFrame shot={proShots.liveOverVideo} locale={locale} priority sizes="(max-width: 1024px) 92vw, 720px" />
            </ParallaxLayer>
            <div className={cx(styles.floatChip, "end-[2%] top-[-4%] hidden sm:inline-flex")}>
              <span className={styles.statusDot} aria-hidden />
              <span>
                <span className="block text-[11px] uppercase tracking-[0.12em] text-white/50">{t.chip(facts.version)}</span>
                {t.chipBody}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className={cx(styles.container, "pb-6")}>
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {t.strip.map((item, index) => {
            const Icon = [Radio, MonitorSmartphone, ListVideo, BadgeCheck][index];
            return (
              <li key={item} className="flex items-center gap-3 bg-[#05080e] px-5 py-4 text-sm font-semibold text-white/80">
                <Icon className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden />
                <bdi>{item}</bdi>
              </li>
            );
          })}
        </ul>
      </div>

      <Section id="features" labelledBy="features-title">
        <SectionHead id="features-title" eyebrow={t.featuresEyebrow} title={t.featuresTitle} lead={t.shotsNote} />
        <div className="grid gap-24 md:gap-32">
          <FeatureRow
            titleId="f-live"
            eyebrow={t.live.eyebrow}
            title={t.live.title}
            body={t.live.body}
            bullets={[...t.live.bullets]}
            media={<TvFrame shot={proShots.liveMenu} locale={locale} sizes="(max-width: 1024px) 92vw, 600px" stand={false} />}
          />
          <FeatureRow
            flip
            titleId="f-signin"
            eyebrow={t.signin.eyebrow}
            title={t.signin.title}
            body={t.signin.body}
            bullets={[...t.signin.bullets]}
            media={<TvFrame shot={proShots.signIn} locale={locale} sizes="(max-width: 1024px) 92vw, 600px" stand={false} />}
          />
          <FeatureRow
            titleId="f-search"
            eyebrow={t.search.eyebrow}
            title={t.search.title}
            body={t.search.body}
            media={<TvFrame shot={proShots.search} locale={locale} sizes="(max-width: 1024px) 92vw, 600px" stand={false} />}
          />
          <FeatureRow
            flip
            titleId="f-look"
            eyebrow={t.look.eyebrow}
            title={t.look.title}
            body={t.look.body}
            media={<TvFrame shot={proShots.settings} locale={locale} sizes="(max-width: 1024px) 92vw, 600px" stand={false} />}
          />
        </div>
        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {t.more.map((item, index) => {
            const Icon = [SkipForward, BadgeCheck, Ruler][index];
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

      <InstallOnTv facts={facts} locale={locale} productName="MoPlayer Pro" />

      <ReleaseFactsPanel facts={facts} locale={locale} productName="MoPlayer Pro" devices={t.devices} sources={t.sources} downloads={downloads} />

      <CompareClassicPro classic={classicFacts} pro={facts} locale={locale} current="pro" />

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
