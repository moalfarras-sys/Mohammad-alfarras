import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  AudioLines,
  Box,
  Check,
  CircleDashed,
  Cloud,
  Cpu,
  Disc3,
  Download,
  GitBranch,
  Laptop,
  Lock,
  MessageSquareText,
  Monitor,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Wrench,
} from "lucide-react";

import { LiteYouTube } from "@/components/v3/lite-youtube";
import { MoosCopyLine } from "@/components/v3/moos-copy-line";
import { Reveal, SplitHeadline, Stagger, TiltCard } from "@/components/v3/motion-kit";
import type { MoosEdition, MoosRelease } from "@/lib/moos-release";
import type { Locale } from "@/types/cms";

import "@/styles/v3-moos.css";

/**
 * The assistant built into MoOS. The owner calls her Mira; inside the system the app
 * is still labelled "Mo AI" (see the screenshot), so the page shows both until the
 * rename ships. Change the name here and every mention follows.
 */
const ASSISTANT = { en: "Mira", ar: "ميرا", app: "Mo AI" } as const;

/** The MoOS film on the owner's channel (verified embeddable via oEmbed). */
const FILM = {
  id: "KcbQy8xuK2M",
  title: "MoOS | نظام تشغيل عربي من الأساس — كمبيوترك، بطريقتك",
};

/** Shipped MoOS UI2 palettes that have a real wallpaper thumbnail on the site. */
const THEMES: Array<{ id: string; name: string; tone: "dark" | "light" }> = [
  { id: "graphite", name: "Graphite", tone: "dark" },
  { id: "tide", name: "Tide", tone: "dark" },
  { id: "midnight", name: "Midnight", tone: "dark" },
  { id: "nova", name: "Nova", tone: "dark" },
  { id: "aurora", name: "Aurora", tone: "dark" },
  { id: "amethyst", name: "Amethyst", tone: "dark" },
  { id: "arena", name: "Arena", tone: "dark" },
  { id: "forge", name: "Forge", tone: "dark" },
  { id: "scholar", name: "Scholar", tone: "dark" },
  { id: "daylight", name: "Daylight", tone: "light" },
  { id: "novalight", name: "Nova Light", tone: "light" },
  { id: "forgelight", name: "Forge Light", tone: "light" },
];

function formatDate(locale: Locale, iso?: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function MoosV3({ locale, release }: { locale: Locale; release: MoosRelease | null }) {
  const isAr = locale === "ar";
  const repoUrl = release?.repoUrl ?? "https://github.com/moalfarras-sys/moos-image";
  const signingKeyUrl = release?.signingKeyUrl ?? "https://raw.githubusercontent.com/moalfarras-sys/moos-image/main/cosign.pub";
  const editions: MoosEdition[] = release?.editions ?? [];
  const desktopImage = editions.find((e) => e.id === "desktop")?.image ?? "ghcr.io/moalfarras-sys/moos:latest";
  const isoReady = Boolean(release?.iso.available && release.iso.url);
  const isoSha = release?.iso.sha256;
  const maintenance = Boolean(release?.maintenance);
  const releaseDate = formatDate(locale, release?.releaseDate);
  const mira = isAr ? ASSISTANT.ar : ASSISTANT.en;

  const t = isAr
    ? {
        badge: isoReady ? "إصدار موقّع · تحميل ISO متاح" : "مرشّح للإصدار · قيد التطوير النشط",
        h1: "كمبيوترك، بطريقتك — نظام تشغيل *عربي* من الأساس.",
        sub: "MoOS نظام تشغيل للكمبيوتر بواجهة MoOS UI مع KDE Plasma 6: واجهة عربية أصيلة، تحديثات موقّعة يمكن التراجع عنها، تطبيقات Linux مع تطبيقات Android و Windows عند الحاجة، ومساعدة ذكية اسمها " +
          mira +
          " تعيش داخل النظام.",
        specs: ["MoOS Atomic · bootc", "KDE Plasma 6 · Wayland", "موقّع بـ cosign", "x86_64 · ARM64", "مجاني ومفتوح المصدر"],
        ctaIso: "حمّل ISO",
        ctaInstaller: "ثبّته من Linux",
        ctaFilm: "شاهد الفيلم",
        ctaRepo: "المصدر على GitHub",
        heroCaption: "سطح مكتب MoOS الحقيقي — الوقت والطقس وحالة الجهاز بالعربية",
        floatLauncher: "قائمة التطبيقات بالعربية",
        floatAi: `${mira} · المساعدة الذكية`,
        filmKicker: "الفيلم",
        filmTitle: "شاهد MoOS *يعمل*.",
        filmBody: "جولة حقيقية داخل النظام على قناتي: سطح المكتب، القائمة العربية، التطبيقات والمساعدة الذكية.",
        play: "تشغيل الفيديو",
        miraKicker: "المساعدة الذكية",
        miraTitle: `تعرّف إلى *${mira}*.`,
        miraLead: `${mira} مساعدة MoOS المدمجة. تفهم العربية والإنجليزية، تشرح حالة جهازك، وتنفّذ إجراءات محدّدة عبر المزوّد السحابي المهيّأ وإجراءات الموافقة داخل النظام.`,
        miraCaption: `لقطة واجهة ${ASSISTANT.app} بالعربية ضمن MoOS`,
        miraPoints: [
          { icon: MessageSquareText, t: "محادثة بالعربية", b: "ردود متدفقة، ويمكنك إرفاق صور وملفات PDF و Word لتسألها عنها." },
          { icon: AudioLines, t: "تكلّمها بصوتك", b: "محادثة صوتية بالعربية والإنجليزية حسب المزوّد وإعدادات الصوت المهيّأة." },
          { icon: Wrench, t: "تصلح وتنفّذ", b: "تحديث النظام، إصلاح الصوت، فحص التعريفات، تجهيز Android، الرجوع لنسخة سابقة — إجراءات محدّدة مسبقاً، والحسّاسة منها تطلب موافقتك." },
          { icon: Lock, t: "خصوصيتك أولاً", b: "الردود تستخدم المزوّد السحابي المهيّأ. راجع إعداداته وما يُرسل إليه، ووافق على تغييرات النظام داخل التطبيق." },
        ],
        miraActions: ["حدّث نظامي", "صلّح الصوت", "افحص جهازي", "جهّز Android", "ارجع للنسخة السابقة", "شخّص الشبكة"],
        miraNote: "المساعدة السحابية تحتاج اتصالاً بالإنترنت ومزوّداً مهيّأ؛ السرعة تعتمد على الاتصال والمزوّد.",
        arabicKicker: "عربي من الجذر",
        arabicTitle: "مكتوب *لك*، لا مترجم لك.",
        arabicBody: "القائمة، البحث، أسماء التطبيقات، التاريخ والطقس، واتجاه الواجهة نفسه — عربية داخل النظام، لا طبقة ترجمة فوقه. وتبدّل للإنجليزية بضغطة.",
        arabicBullets: [
          "واجهة RTL مصمّمة من الأساس",
          "خطوط عربية واضحة: IBM Plex Sans Arabic و Noto Sans Arabic",
          "لوحات مفاتيح عربي · ألماني · إنجليزي بـ Alt+Shift",
          "بحث عربي فوري يفتح التطبيقات والملفات والأوامر",
        ],
        arabicCaption: "قائمة تطبيقات MoOS بالعربية — لقطة من النظام",
        worldsKicker: "ثلاثة عوالم",
        worldsTitle: "Linux في الأساس. Android و Windows *عند* الحاجة.",
        worlds: [
          { icon: Box, t: "تطبيقات Linux", b: "تطبيقات Flatpak من Flathub ومن متجر MoOS، معزولة ومحدّثة بوضوح." },
          { icon: Smartphone, t: "تطبيقات Android", b: "عبر Waydroid داخل حاوية. التجهيز الأول يقارب 1GB وبلا Google Play افتراضياً." },
          { icon: Laptop, t: "تطبيقات Windows", b: "عبر Bottles و Wine في بيئة منفصلة. التوافق يختلف من برنامج لآخر." },
        ],
        statusKicker: "أين وصل المشروع",
        statusTitle: "مرشّح للإصدار — *وأستخدمه* كل يوم.",
        statusBody: "MoOS يعمل يومياً على جهازي، وكل صورة تُبنى وتُوقَّع آلياً. هذا ما أُنجز وما بقي قبل الإصدار العام — بصراحة.",
        statusImage: "آخر صورة منشورة",
        statusCaption: "مركز قيادة MoOS — رقم الإصدار ونقطة الرجوع وحالة الجهاز",
        done: "أُنجز",
        next: "التالي",
        doneItems: [
          "ثلاث صور موقّعة: مكتب، NVIDIA، وخوادم + نسخة ARM64",
          "مثبّت يعمل دون إنترنت ويحمي قرص الـ USB",
          "إقلاع وتثبيت وإعادة تشغيل مجرّبة في بوابة الإصدار",
          "يعمل يومياً على جهاز NVIDIA، ونسخة ARM على Oracle Cloud",
          `${mira} مع عقل محلي وكلام عربي محلي`,
        ],
        nextItems: [
          "استضافة دائمة لملف ISO وفتح التحميل",
          "اختبار التثبيت على أجهزة حقيقية متنوعة",
          "اختبار الرجوع بعد تحديث معطوب عمداً",
          `نموذج جاهز لـ ${mira} من أول تشغيل`,
          "الإصدار النهائي العام",
        ],
        safeKicker: "تحديثات ذرّية",
        safeTitle: "يتحدّث كصورة *واحدة* — والرجوع جاهز.",
        safeBody: "يصل التحديث كصورة موقّعة ويُطبَّق بعد إعادة التشغيل، والنسخة السابقة تبقى على القرص.",
        features: [
          { icon: ShieldCheck, t: "موقّع ومتحقَّق منه", b: "النظام المثبّت يرفض أي تحديث غير موقّع بمفتاح MoOS." },
          { icon: RotateCcw, t: "تراجع فوري", b: "أمر واحد أو خيار من قائمة الإقلاع وترجع كما كنت." },
        ],
        updateTitle: "التحديث",
        rollbackTitle: "التراجع",
        themesKicker: "شخصية النظام",
        themesTitle: "ثيمات *فاتحة* وداكنة بلغة واحدة.",
        themesBody: "الخلفية والنوافذ والأيقونات وشاشة القفل تتبدّل معاً بضغطة.",
        light: "فاتح",
        dark: "داكن",
        downloadKicker: "التحميل",
        downloadTitle: "اختر نسختك.",
        downloadBody: "المثبّت الرسمي يتحقّق من توقيع النسخة قبل التثبيت ويحفظ نسختك الحالية حتى يبقى التراجع ممكناً.",
        download: "حمّل المثبّت",
        orCommand: "أو أمر واحد",
        recommended: "موصى به",
        copy: "نسخ",
        copied: "تم",
        verifyTitle: "تحقّق بنفسك",
        verifyBody: "كل نسخة موقّعة — تأكد أن الصورة من MoOS فعلاً قبل التثبيت:",
        isoTitle: "قرص USB قابل للإقلاع",
        isoUnavailable: "ملف ISO جاهز ومجرّب، لكن تحميله متوقف حتى يُستضاف على خادم دائم ويُتحقّق من حجمه وبصمته. يمكنك التثبيت الآن من نظام Linux موجود عبر المثبّت أعلاه.",
        isoSoon: "قريباً",
        isoBody: "ISO لنسخة المكتب x86-64 على أجهزة Intel وAMD مع UEFI، اجتاز الإقلاع والتثبيت دون شبكة. تحقّق من SHA-256 والتوقيع قبل الكتابة على USB. يُنصح بـ16 GB RAM ومعالج 4 أنوية وSSD 256 GB؛ هذه توصيات وليست ضماناً لكل الأجهزة.",
        checksum: "SHA-256 الرسمي",
        signature: "حمّل التوقيع",
        checksumFile: "حمّل ملف SHA-256",
        guide: "دليل التثبيت",
        finalTitle: "نظام تشغيل *كامل* — مجاناً.",
        finalBody: "المصدر مفتوح ومفتاح التوقيع علني. اختر النسخة المناسبة وتحقّق من الملف قبل التثبيت.",
        more: "بقية التطبيقات",
        maintenanceMsg: "MoOS قيد التحديث حالياً — التحميل سيعود قريباً.",
        editionCopy: {
          desktop: { name: "MoOS للمكتب", summary: "للكمبيوتر بمعالجات Intel و AMD والكروت المفتوحة." },
          nvidia: { name: "MoOS · NVIDIA", summary: "نفس النسخة مع سوّاقة NVIDIA المفتوحة مدمجة." },
          cloud: { name: "MoOS Cloud", summary: "للخوادم x86-64: SSH أولاً، بلا طبقة ألعاب، وسطح المكتب من المتصفح." },
          arm: { name: "MoOS ARM", summary: "نسخة ARM64 أصلية لـOracle A1 والأجهزة الافتراضية المدعومة، بصور QCOW2/UTM منفصلة عن ISO x86." },
        } as Record<string, { name: string; summary: string }>,
      }
    : {
        badge: isoReady ? "Signed release · ISO download available" : "Release candidate · actively developed",
        h1: "Your computer, your way — an *Arabic-native* operating system.",
        sub: `MoOS is a desktop operating system with MoOS UI and KDE Plasma 6: a truly Arabic interface, signed updates you can roll back, Linux apps with Android and Windows when you need them, and an AI assistant called ${mira} living inside the system.`,
        specs: ["MoOS Atomic · bootc", "KDE Plasma 6 · Wayland", "cosign-signed", "x86_64 · ARM64", "Free & open source"],
        ctaIso: "Download ISO",
        ctaInstaller: "Install from Linux",
        ctaFilm: "Watch the film",
        ctaRepo: "Source on GitHub",
        heroCaption: "The real MoOS desktop — time, weather and machine health in Arabic",
        floatLauncher: "Arabic app launcher",
        floatAi: `${mira} · AI assistant`,
        filmKicker: "The film",
        filmTitle: "See MoOS *running*.",
        filmBody: "A real walkthrough on my channel: the desktop, the Arabic launcher, the apps and the assistant.",
        play: "Play video",
        miraKicker: "The assistant",
        miraTitle: `Meet *${mira}*.`,
        miraLead: `${mira} is the assistant built into MoOS. She understands Arabic and English, explains your machine and runs specific actions through the configured cloud provider and the system approval controls.`,
        miraCaption: `An Arabic ${ASSISTANT.app} interface capture from MoOS`,
        miraPoints: [
          { icon: MessageSquareText, t: "Chat in Arabic or English", b: "Streaming answers, and you can attach images, PDFs and Word files to ask about them." },
          { icon: AudioLines, t: "Talk to her", b: "Arabic and English voice conversations depend on the configured provider and audio setup." },
          { icon: Wrench, t: "She fixes things", b: "Update the system, fix audio, check drivers, prepare Android, roll back — predefined actions, and the sensitive ones ask for your approval." },
          { icon: Lock, t: "Private by default", b: "Replies use the configured cloud provider. Review its settings and shared data, and approve system changes inside the app." },
        ],
        miraActions: ["Update my system", "Fix audio", "Check my machine", "Set up Android", "Roll back", "Network doctor"],
        miraNote: "Cloud assistance needs internet access and a configured provider; speed depends on your connection and provider.",
        arabicKicker: "Arabic from the root",
        arabicTitle: "Written *for* Arabic — not translated into it.",
        arabicBody: "The launcher, search, app names, dates, weather and the direction of the interface itself are Arabic inside the system, not a translation layer on top. Switch to English in one click.",
        arabicBullets: [
          "An RTL interface designed as RTL",
          "Crisp Arabic type: IBM Plex Sans Arabic and Noto Sans Arabic",
          "Arabic · German · English keyboards on Alt+Shift",
          "Instant Arabic search across apps, files and commands",
        ],
        arabicCaption: "The MoOS launcher in Arabic — a screenshot from the system",
        worldsKicker: "Three worlds",
        worldsTitle: "Linux at the core. Android and Windows *on-demand*.",
        worlds: [
          { icon: Box, t: "Linux apps", b: "Sandboxed Flatpak apps from Flathub and the MoOS store, with clear updates." },
          { icon: Smartphone, t: "Android apps", b: "Through Waydroid in a container. First setup downloads about 1GB, without Google Play by default." },
          { icon: Laptop, t: "Windows apps", b: "Through Bottles and Wine in an isolated environment. Compatibility varies by program." },
        ],
        statusKicker: "Where it is now",
        statusTitle: "A release candidate — I use it *daily*.",
        statusBody: "MoOS runs daily on my own machine, and every image is built and signed automatically. Here is what is done and what is left before the public release — honestly.",
        statusImage: "Latest published image",
        statusCaption: "MoOS command centre — build version, rollback point and machine health",
        done: "Done",
        next: "Next",
        doneItems: [
          "Three signed images: desktop, NVIDIA and cloud — plus ARM64",
          "An offline installer that protects the USB stick",
          "Boot, install and reboot proven in the release gate",
          "Runs daily on an NVIDIA PC; the ARM build runs on Oracle Cloud",
          `${mira} with a local brain and local Arabic speech`,
        ],
        nextItems: [
          "Permanent ISO hosting and public download",
          "Install testing across a range of real hardware",
          "Rollback tested against a deliberately broken update",
          `A model ready for ${mira} on first boot`,
          "The final public release",
        ],
        safeKicker: "Atomic updates",
        safeTitle: "Updates arrive as *one* image — rollback stays ready.",
        safeBody: "An update arrives as a signed image and applies after reboot; the previous version stays on disk.",
        features: [
          { icon: ShieldCheck, t: "Signed and verified", b: "The installed system refuses any update not signed with the MoOS key." },
          { icon: RotateCcw, t: "Instant rollback", b: "One command — or one boot-menu entry — and you are back where you were." },
        ],
        updateTitle: "Update",
        rollbackTitle: "Roll back",
        themesKicker: "System personality",
        themesTitle: "*Light* and dark themes, one visual language.",
        themesBody: "Wallpaper, windows, icons and lock screen change together in one click.",
        light: "Light",
        dark: "Dark",
        downloadKicker: "Download",
        downloadTitle: "Pick your edition.",
        downloadBody: "The official installer verifies the release signature before installing and pins your current system so rollback always works.",
        download: "Download installer",
        orCommand: "or one command",
        recommended: "Recommended",
        copy: "Copy",
        copied: "Copied",
        verifyTitle: "Verify it yourself",
        verifyBody: "Every release is signed — confirm the image really came from MoOS before installing:",
        isoTitle: "Bootable USB image",
        isoUnavailable: "The boot-tested ISO is ready, but downloads stay off until it is rehosted on permanent storage and its size and checksum are verified. You can install today from an existing Linux system with the installer above.",
        isoSoon: "Coming soon",
        isoBody: "An x86-64 desktop ISO for Intel/AMD UEFI PCs, proven through boot and offline installation. Verify its SHA-256 and signature before writing the USB. Recommended: 16 GB RAM, 4 CPU cores and a 256 GB SSD; these are sizing recommendations, not universal hardware guarantees.",
        checksum: "Official SHA-256",
        signature: "Download signature",
        checksumFile: "Download SHA-256 file",
        guide: "Installation guide",
        finalTitle: "A *complete* operating system — free.",
        finalBody: "The source is open and the signing key is public. Choose the right edition and verify the file before installing.",
        more: "More apps",
        maintenanceMsg: "MoOS is being updated right now — downloads will return shortly.",
        editionCopy: {
          desktop: { name: "MoOS Desktop", summary: "For Intel, AMD and open-driver machines." },
          nvidia: { name: "MoOS · NVIDIA", summary: "The same desktop with the open NVIDIA driver built in." },
          cloud: { name: "MoOS Cloud", summary: "For x86-64 cloud machines: SSH-first, no games layer, the desktop in your browser." },
          arm: { name: "MoOS ARM", summary: "Native ARM64 for Oracle A1 and supported virtual machines, using QCOW2/UTM artifacts separate from the x86 ISO." },
        } as Record<string, { name: string; summary: string }>,
      };

  // Download links stay plain <a>: a next/link would prefetch the download API and
  // inflate the counter without a real click.
  const installerHref = (id: string) => `/api/os/download?type=${id}`;
  const isoHref = installerHref("iso");
  const editionCommand = (edition: MoosEdition) =>
    edition.id === "cloud"
      ? `sudo dnf install -y system-reinstall-bootc && sudo system-reinstall-bootc ${edition.image}`
      : `sudo bootc switch ${edition.image} && sudo systemctl reboot`;
  const editionIcon = (id: string) => (id === "cloud" ? Cloud : id === "nvidia" ? Cpu : Monitor);
  // Without a downloadable ISO the primary action is the signed installer — never a
  // button labelled as an ISO download.
  const primaryHref = isoReady ? isoHref : "#download";
  const primaryLabel = isoReady ? t.ctaIso : t.ctaInstaller;

  return (
    <div className="st-page mo3" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Hero ── */}
      <section className="mo3-hero">
        <div className="mo3-hero-bg" aria-hidden="true" />
        <div className="st-container mo3-hero-inner">
          <div className="mo3-hero-copy">
            <Reveal y={12}>
              <p className="mo3-badge">
                <span className="mo3-dot" aria-hidden="true" />
                {t.badge}
              </p>
            </Reveal>
            <div className="mo3-brand">
              <Image src="/images/moos/moos-logo.png" alt="" width={56} height={56} />
              <span>MoOS</span>
            </div>
            <SplitHeadline as="h1" immediate delay={0.1} text={t.h1} className="mo3-title" />
            <Reveal delay={0.3} y={16}>
              <p className="mo3-lede">{t.sub}</p>
            </Reveal>
            <Reveal delay={0.42} y={16}>
              {maintenance ? (
                <p className="mo3-warn">{t.maintenanceMsg}</p>
              ) : (
                <div className="mo3-actions">
                  <a href={primaryHref} className="st-btn st-btn--primary st-btn--lg">
                    <Download size={18} aria-hidden />
                    {primaryLabel}
                  </a>
                  <a href="#film" className="st-btn st-btn--ghost st-btn--lg">
                    <Play size={17} aria-hidden />
                    {t.ctaFilm}
                  </a>
                </div>
              )}
              <ul className="mo3-specs">
                {t.specs.map((spec) => (
                  <li key={spec}>{spec}</li>
                ))}
              </ul>
            </Reveal>
          </div>

          <div className="mo3-hero-visual">
            <TiltCard className="mo3-monitor" max={5}>
              <div className="mo3-monitor-screen">
                <Image
                  src="/images/moos/desktop-dark.webp"
                  alt={t.heroCaption}
                  fill
                  priority
                  sizes="(max-width: 900px) 92vw, 640px"
                  className="v3-cover"
                />
              </div>
              <span className="mo3-monitor-stand" aria-hidden="true" />
            </TiltCard>
            <div className="mo3-float mo3-float--launcher" aria-hidden="true">
              <span className="mo3-float-shot">
                <Image src="/images/moos/launcher-arabic.webp" alt="" fill sizes="240px" className="v3-cover" />
              </span>
              <span className="mo3-float-label">{t.floatLauncher}</span>
            </div>
            <div className="mo3-float mo3-float--ai" aria-hidden="true">
              <span className="mo3-orb" />
              <span className="mo3-float-label">{t.floatAi}</span>
            </div>
            <p className="mo3-caption">{t.heroCaption}</p>
          </div>
        </div>
      </section>

      {/* ── Film ── */}
      <section id="film" className="mo3-section mo3-film">
        <div className="st-container">
          <header className="mo3-head mo3-head--center">
            <p className="mo3-kicker">{t.filmKicker}</p>
            <SplitHeadline as="h2" text={t.filmTitle} className="mo3-h2" />
            <p className="mo3-body">{t.filmBody}</p>
          </header>
          <Reveal className="mo3-film-frame" y={36}>
            <LiteYouTube id={FILM.id} title={FILM.title} playLabel={t.play} />
          </Reveal>
        </div>
      </section>

      {/* ── Mira ── */}
      <section className="mo3-section mo3-mira" id="mira">
        <div className="st-container mo3-split">
          <div className="mo3-split-copy">
            <p className="mo3-kicker">{t.miraKicker}</p>
            <SplitHeadline as="h2" text={t.miraTitle} className="mo3-h2" />
            <p className="mo3-body">{t.miraLead}</p>
            <Stagger className="mo3-points" gap={0.08}>
              {t.miraPoints.map((point) => (
                <article className="mo3-point" key={point.t}>
                  <span className="mo3-icon">
                    <point.icon size={19} aria-hidden />
                  </span>
                  <div>
                    <h3>{point.t}</h3>
                    <p>{point.b}</p>
                  </div>
                </article>
              ))}
            </Stagger>
          </div>
          <div className="mo3-split-media">
            <TiltCard className="mo3-window" max={5}>
              <div className="mo3-window-bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{ASSISTANT.app}</span>
              </div>
              <div className="mo3-window-shot">
                <Image src="/images/moos/mo-ai-arabic.webp" alt={t.miraCaption} fill sizes="(max-width: 900px) 92vw, 600px" className="v3-cover v3-top" />
              </div>
            </TiltCard>
            <ul className="mo3-prompts" aria-label={isAr ? "أمثلة على الإجراءات" : "Example actions"}>
              {t.miraActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <p className="mo3-caption">{t.miraCaption}</p>
            <p className="mo3-note">{t.miraNote}</p>
          </div>
        </div>
      </section>

      {/* ── Arabic native ── */}
      <section className="mo3-section">
        <div className="st-container mo3-split mo3-split--flip">
          <div className="mo3-split-copy">
            <p className="mo3-kicker">{t.arabicKicker}</p>
            <SplitHeadline as="h2" text={t.arabicTitle} className="mo3-h2" />
            <p className="mo3-body">{t.arabicBody}</p>
            <ul className="mo3-checks">
              {t.arabicBullets.map((bullet) => (
                <li key={bullet}>
                  <Check size={16} aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <Reveal className="mo3-split-media">
            <div className="mo3-shot">
              <Image src="/images/moos/launcher-arabic.webp" alt={t.arabicCaption} fill sizes="(max-width: 900px) 92vw, 640px" className="v3-cover" />
            </div>
            <p className="mo3-caption">{t.arabicCaption}</p>
          </Reveal>
        </div>
      </section>

      {/* ── Three worlds ── */}
      <section className="mo3-section">
        <div className="st-container">
          <header className="mo3-head">
            <p className="mo3-kicker">{t.worldsKicker}</p>
            <SplitHeadline as="h2" text={t.worldsTitle} className="mo3-h2" />
          </header>
          <Stagger className="mo3-worlds" gap={0.1}>
            {t.worlds.map((world) => (
              <article className="mo3-world" key={world.t}>
                <span className="mo3-icon mo3-icon--lg">
                  <world.icon size={22} aria-hidden />
                </span>
                <h3>{world.t}</h3>
                <p>{world.b}</p>
              </article>
            ))}
          </Stagger>
          <Reveal className="mo3-icons-strip">
            <Image src="/images/moos/app-icons.webp" alt={isAr ? "أيقونات تطبيقات MoOS" : "MoOS app icons"} width={1320} height={528} sizes="(max-width: 900px) 92vw, 760px" />
          </Reveal>
        </div>
      </section>

      {/* ── Status ── */}
      <section className="mo3-section mo3-status" id="status">
        <div className="st-container">
          <header className="mo3-head">
            <p className="mo3-kicker">{t.statusKicker}</p>
            <SplitHeadline as="h2" text={t.statusTitle} className="mo3-h2" />
            <p className="mo3-body">{t.statusBody}</p>
          </header>
          <div className="mo3-status-grid">
            <Reveal className="mo3-status-media">
              <div className="mo3-shot mo3-shot--tall">
                <Image src="/images/moos/control-center-arabic.webp" alt={t.statusCaption} fill sizes="(max-width: 900px) 92vw, 620px" className="v3-cover v3-top" />
              </div>
              <p className="mo3-caption">{t.statusCaption}</p>
              {releaseDate ? (
                <p className="mo3-release">
                  <span>{t.statusImage}</span>
                  <strong>{releaseDate}</strong>
                </p>
              ) : null}
            </Reveal>
            <div className="mo3-lists">
              <Reveal className="mo3-list mo3-list--done">
                <h3>
                  <Check size={18} aria-hidden />
                  {t.done}
                </h3>
                <ul>
                  {t.doneItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="mo3-list mo3-list--next" delay={0.1}>
                <h3>
                  <CircleDashed size={18} aria-hidden />
                  {t.next}
                </h3>
                <ul>
                  {t.nextItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Atomic updates ── */}
      <section className="mo3-section">
        <div className="st-container">
          <header className="mo3-head">
            <p className="mo3-kicker">{t.safeKicker}</p>
            <SplitHeadline as="h2" text={t.safeTitle} className="mo3-h2" />
            <p className="mo3-body">{t.safeBody}</p>
          </header>
          <div className="mo3-duo">
            <Reveal className="mo3-card">
              <span className="mo3-icon">
                <ShieldCheck size={19} aria-hidden />
              </span>
              <h3>{t.features[0].t}</h3>
              <p>{t.features[0].b}</p>
              <h4>
                <RefreshCw size={15} aria-hidden />
                {t.updateTitle}
              </h4>
              <MoosCopyLine command="moai-do update" copyLabel={t.copy} copiedLabel={t.copied} />
            </Reveal>
            <Reveal className="mo3-card" delay={0.1}>
              <span className="mo3-icon">
                <RotateCcw size={19} aria-hidden />
              </span>
              <h3>{t.features[1].t}</h3>
              <p>{t.features[1].b}</p>
              <h4>
                <RotateCcw size={15} aria-hidden />
                {t.rollbackTitle}
              </h4>
              <MoosCopyLine command="sudo bootc rollback && sudo systemctl reboot" copyLabel={t.copy} copiedLabel={t.copied} />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Themes ── */}
      <section className="mo3-section">
        <div className="st-container">
          <header className="mo3-head">
            <p className="mo3-kicker">{t.themesKicker}</p>
            <SplitHeadline as="h2" text={t.themesTitle} className="mo3-h2" />
            <p className="mo3-body">{t.themesBody}</p>
          </header>
          <Stagger className="mo3-themes" gap={0.04} y={20}>
            {THEMES.map((theme) => (
              <figure className="mo3-theme" key={theme.id}>
                <span className="mo3-theme-shot">
                  <Image
                    src={`/images/moos/themes/${theme.id}.webp`}
                    alt={isAr ? `ثيم ${theme.name} في MoOS` : `The ${theme.name} theme in MoOS`}
                    fill
                    sizes="(max-width: 640px) 46vw, (max-width: 1000px) 30vw, 220px"
                    className="v3-cover"
                  />
                </span>
                <figcaption>
                  <span>{theme.name}</span>
                  <em>{theme.tone === "light" ? t.light : t.dark}</em>
                </figcaption>
              </figure>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Download ── */}
      <section id="download" className="mo3-section mo3-download">
        <div className="st-container">
          <header className="mo3-head">
            <p className="mo3-kicker">{t.downloadKicker}</p>
            <SplitHeadline as="h2" text={t.downloadTitle} className="mo3-h2" />
            <p className="mo3-body">{t.downloadBody}</p>
          </header>
          <div className="mo3-editions">
            {editions.map((edition) => {
              const Icon = editionIcon(edition.id);
              const copy = t.editionCopy[edition.id];
              return (
                <article key={edition.id} className={`mo3-edition${edition.recommended ? " is-featured" : ""}`}>
                  <div className="mo3-edition-head">
                    <span className="mo3-icon">
                      <Icon size={19} aria-hidden />
                    </span>
                    {edition.recommended ? <span className="mo3-pill">{t.recommended}</span> : null}
                  </div>
                  <h3>{copy?.name ?? edition.name}</h3>
                  <p>{copy?.summary ?? edition.summary}</p>
                  {maintenance ? (
                    <span className="st-btn st-btn--ghost" aria-disabled="true">
                      <Download size={16} aria-hidden />
                      {t.download}
                    </span>
                  ) : edition.installer ? (
                    <a href={installerHref(edition.id)} className={`st-btn ${edition.recommended ? "st-btn--primary" : "st-btn--ghost"}`}>
                      <Download size={16} aria-hidden />
                      {t.download}
                    </a>
                  ) : edition.guideUrl ? (
                    <a href={edition.guideUrl} className="st-btn st-btn--ghost">
                      <ArrowUpRight size={16} aria-hidden />
                      {t.guide}
                    </a>
                  ) : null}
                  <span className="mo3-or">{t.orCommand}</span>
                  <MoosCopyLine command={editionCommand(edition)} copyLabel={t.copy} copiedLabel={t.copied} />
                </article>
              );
            })}
          </div>

          <div className="mo3-duo mo3-duo--tight">
            <div className="mo3-card">
              <h3>
                <ShieldCheck size={17} aria-hidden />
                {t.verifyTitle}
              </h3>
              <p>{t.verifyBody}</p>
              <MoosCopyLine command={`cosign verify --key ${signingKeyUrl} ${desktopImage}`} copyLabel={t.copy} copiedLabel={t.copied} />
            </div>
            <div className="mo3-card mo3-iso">
              <h3>
                <Disc3 size={17} aria-hidden />
                {t.isoTitle}
              </h3>
              {isoReady ? (
                <>
                  <p>{t.isoBody}</p>
                  <a href={isoHref} className="st-btn st-btn--primary">
                    <Download size={16} aria-hidden />
                    {t.ctaIso}
                  </a>
                  <div className="mo3-actions">
                    <a href={`${isoHref}&asset=signature`} className="st-btn st-btn--ghost">{t.signature}</a>
                    <a href={`${isoHref}&asset=checksum`} className="st-btn st-btn--ghost">{t.checksumFile}</a>
                  </div>
                  {isoSha ? (
                    <>
                      <span className="mo3-or">{t.checksum}</span>
                      <MoosCopyLine command={isoSha} copyLabel={t.copy} copiedLabel={t.copied} />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <p>{t.isoUnavailable}</p>
                  <span className="mo3-pill mo3-pill--muted">{t.isoSoon}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final ── */}
      <section className="mo3-section mo3-section--last">
        <div className="st-container">
          <Reveal className="mo3-final">
            <div className="mo3-final-art" aria-hidden="true">
              <Image src="/images/moos/themes/aurora.webp" alt="" fill sizes="100vw" className="v3-cover" />
            </div>
            <Image src="/images/moos/moos-logo.png" alt="" width={72} height={72} className="mo3-final-logo" />
            <SplitHeadline as="h2" text={t.finalTitle} className="mo3-h2" />
            <p className="mo3-body">{t.finalBody}</p>
            <div className="mo3-actions mo3-actions--center">
              <a href={primaryHref} className="st-btn st-btn--primary st-btn--lg">
                <Download size={18} aria-hidden />
                {primaryLabel}
              </a>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="st-btn st-btn--ghost st-btn--lg">
                <GitBranch size={17} aria-hidden />
                {t.ctaRepo}
                <ArrowUpRight size={15} aria-hidden />
              </a>
              <Link href={`/${locale}/apps`} prefetch={false} className="st-btn st-btn--ghost st-btn--lg">
                {t.more}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
