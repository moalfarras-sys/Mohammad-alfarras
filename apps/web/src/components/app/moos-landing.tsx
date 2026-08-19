"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  Cloud,
  Copy,
  Cpu,
  Disc3,
  Download,
  GitBranch,
  Languages,
  Layers,
  Monitor,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/types/cms";
import type { MoosEdition, MoosRelease } from "@/lib/moos-release";

/** Shipped MoOS UI2 palettes, each with its own real wallpaper thumbnail. */
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

function CopyLine({ command, copyLabel, copiedLabel }: { command: string; copyLabel: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="moos-term">
      <div className="moos-term-code">
        <Terminal className="h-4 w-4 shrink-0 text-[#4ed7c8]/70" aria-hidden />
        <code dir="ltr">{command}</code>
      </div>
      <button
        type="button"
        className="moos-copy"
        aria-label={copyLabel}
        onClick={() => {
          navigator.clipboard?.writeText(command).then(
            () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            },
            () => undefined,
          );
        }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span>{copied ? copiedLabel : copyLabel}</span>
      </button>
    </div>
  );
}

export function MoosLanding({ locale, release }: { locale: Locale; release: MoosRelease | null }) {
  const isAr = locale === "ar";
  const repoUrl = release?.repoUrl ?? "https://github.com/moalfarras-sys/moos-image";
  const signingKeyUrl =
    release?.signingKeyUrl ?? "https://raw.githubusercontent.com/moalfarras-sys/moos-image/main/cosign.pub";
  const editions: MoosEdition[] = release?.editions ?? [];
  const desktop = editions.find((e) => e.id === "desktop");
  const cloud = editions.find((e) => e.id === "cloud");
  const desktopImage = desktop?.image ?? "ghcr.io/moalfarras-sys/moos:latest";
  const cloudImage = cloud?.image ?? "ghcr.io/moalfarras-sys/moos-cloud:latest";
  const isoReady = Boolean(release?.iso.available && release.iso.url);
  const maintenance = Boolean(release?.maintenance);

  const t = isAr
    ? {
        badge: "نظام تشغيل كامل",
        h1: "الكمبيوتر يشتغل بنظامك أنت — بالعربية، وبتحديثات لا تكسر شيئاً.",
        sub: "MoOS نظام تشغيل حقيقي للكمبيوتر، مبني على Fedora Atomic وواجهة KDE Plasma 6. كل نسخة تُبنى وتُوقَّع تلقائياً، وجهازك يسحب التحديث الموقّع ويطبّقه عند إعادة التشغيل — وإذا لم يعجبك، ترجع للنسخة السابقة بأمر واحد.",
        specs: ["Fedora Atomic · bootc", "KDE Plasma 6 · Wayland", "تحديثات موقّعة بـ cosign", "عربية و RTL أصيلة", "مجاني ومفتوح"],
        ctaMain: "حمّل النسخة العامة",
        ctaCloud: "حمّل نسخة الكلاود",
        ctaRepo: "المصدر على GitHub",
        heroCaption: "سطح مكتب MoOS الحقيقي — لوحة Horizon مع الوقت والطقس وحالة الجهاز بالعربية",
        proof: [
          { v: "١٦", l: "ثيماً رسمياً فاتحاً وداكناً" },
          { v: "٣", l: "نسخ: مكتب، NVIDIA، كلاود" },
          { v: "يومياً", l: "بناء وتوقيع تلقائي" },
          { v: "مجاناً", l: "بلا رسوم ولا حسابات" },
        ],
        arabicEyebrow: "عربية من الجذر",
        arabicTitle: "أول نظام تشغيل تحسّ إنه مكتوب لك، مش مترجم لك",
        arabicBody:
          "القائمة، البحث، أسماء التطبيقات، التاريخ، الطقس، وحتى اتجاه الواجهة — كلها عربية أصيلة داخل النظام نفسه، لا إضافة ولا ترجمة سطحية. وإذا بدك إنجليزي أو ألماني، تبدّل بضغطة.",
        arabicBullets: [
          "واجهة RTL كاملة مصمّمة من الأساس، لا معكوسة بالغلط",
          "تواريخ وأرقام وطقس بالعربية داخل سطح المكتب",
          "بحث عربي فوري يفتح التطبيقات والملفات والأوامر",
          "خطوط عربية واضحة على شاشات 4K و HiDPI",
        ],
        arabicCaption: "قائمة تطبيقات MoOS بالعربية الكاملة — لقطة حية من النظام",
        safeEyebrow: "لا ينكسر",
        safeTitle: "نظام يحدّث نفسه بأمان — وإذا صار خطأ، ترجع بأمر واحد",
        safeBody:
          "MoOS ليس توزيعة تقليدية تُحدَّث حزمة حزمة حتى تتعطّل. النظام صورة واحدة للقراءة فقط: تُبنى وتُوقَّع، وتُطبَّق كاملة عند إعادة التشغيل. لا تحديث نصف مكتمل، ولا جهاز يرفض الإقلاع بلا رجعة.",
        features: [
          { icon: ShieldCheck, t: "موقّع ومتحقَّق منه", b: "كل صورة موقّعة بـ cosign، والنظام المثبّت يرفض أي تحديث غير موقّع بمفتاح MoOS." },
          { icon: RotateCcw, t: "تراجع فوري", b: "النسخة السابقة تبقى محفوظة على القرص. أمر واحد أو خيار من قائمة الإقلاع وترجع كما كنت." },
          { icon: Sparkles, t: "واجهة Horizon الزجاجية", b: "لوحة معلومات، جزيرة وسائط، ودوك زجاجي — تصميم حديث يشتغل بسلاسة على أجهزة متواضعة." },
          { icon: Layers, t: "تطبيقاتك جاهزة", b: "Mo AI، متجر Mo Store، MoPlayer، والتحكم عن بُعد Mo PC Remote — مبنية داخل النظام من أول إقلاع." },
        ],
        themesEyebrow: "شخصية النظام",
        themesTitle: "١٦ ثيماً رسمياً — فاتح وداكن، بنفس الجودة",
        themesBody:
          "عائلة ثيمات كاملة مولّدة من نفس مصدر الألوان: الخلفية، النوافذ، الأيقونات، شاشة القفل، وحتى شاشة الإقلاع تتبدّل معاً بضغطة واحدة. اختر ما يريحك — النظام يبقى متناسقاً.",
        appsEyebrow: "تطبيقات MoOS",
        appsTitle: "تطبيقات مصمّمة لهذا النظام، لا مستوردة",
        appsBody:
          "أيقونات وتطبيقات مبنية بنفس لغة التصميم الزجاجية — Mo AI للمساعدة، Mo Store للتثبيت، MoPlayer للمشاهدة، Mo PC Remote للتحكم من جوالك، مع الاستعادة والتحديث والإعدادات.",
        editionsEyebrow: "التحميل",
        editionsTitle: "اختر نسختك وحمّل المثبّت الرسمي",
        editionsBody:
          "المثبّت سكربت رسمي يتحقّق من توقيع النسخة قبل التثبيت، ويثبّت نسختك الحالية حتى يبقى التراجع ممكناً. أو انسخ الأمر مباشرة إن كنت تفضّل الطرفية.",
        download: "حمّل المثبّت",
        orCommand: "أو أمر واحد",
        recommended: "موصى به",
        copy: "نسخ",
        copied: "تم",
        verifyTitle: "تحقّق بنفسك قبل التثبيت",
        verifyBody: "كل نسخة موقّعة. تقدر تتأكد بنفسك إن الملف من MoOS فعلاً قبل ما تثبّت:",
        cloudEyebrow: "MoOS Cloud",
        cloudTitle: "نفس النظام، على خادم يعمل ٧/٢٤",
        cloudBody:
          "بدل ما تترك جهازك شغّالاً، خذ خادماً رخيصاً وحوّله إلى MoOS بأمر واحد. للتطوير، لتشغيل Mo AI، ولمشاريعك الخاصة — بنفس التحديثات الموقّعة، وتوصله من أي مكان.",
        cloudPrice: "٣.٧٩€",
        cloudPriceNote: "شهرياً تقريباً على Hetzner — أو مجاناً على Oracle",
        cloudBullets: [
          "بلا طبقة ألعاب أو أندرويد — موارد الخادم كلها لشغلك",
          "SSH هو الباب، وسطح المكتب يوصلك من المتصفح",
          "نفس التحديثات الموقّعة ونفس التراجع الفوري",
          "مفاتيح SSH الحالية تُنقل تلقائياً أثناء التحويل",
        ],
        cloudNote: "يعمل على Hetzner و Contabo و OVH و Vultr و Oracle — أي مزوّد يقدّم Fedora. مفاتيح SSH تُنقل تلقائياً حتى لا تفقد الوصول.",
        updateTitle: "التحديث",
        updateBody: "أمر واحد يجهّز أحدث نسخة موقّعة، وتُطبَّق عند إعادة التشغيل.",
        rollbackTitle: "التراجع",
        rollbackBody: "لم يعجبك التحديث؟ ارجع للنسخة السابقة فوراً — أو اخترها من قائمة الإقلاع.",
        isoTitle: "قرص USB قابل للإقلاع",
        // Deliberately not release.iso.notes: the manifest note is English and
        // would leak into the Arabic page.
        isoBody:
          "للأجهزة التي ليس عليها لينكس بعد. يُبنى من نفس النسخة المنشورة تماماً، والاستضافة الدائمة قيد الإنهاء — حتى ذلك الحين، المثبّت أعلاه يعطيك نفس النظام.",
        isoSoon: "قريباً",
        isoDownload: "حمّل ISO",
        finalTitle: "نظام تشغيل كامل، مجاناً",
        finalBody: "بلا رسوم، بلا حساب، بلا تتبّع. المصدر كامل ومفتوح، ومفتاح التوقيع علني — تقدر تتحقّق من كل شي بنفسك.",
        finalNote: "MoOS مشروع شخصي مفتوح المصدر من محمد الفراس.",
        maintenanceMsg: "MoOS قيد التحديث حالياً — التحميل سيعود قريباً.",
      }
    : {
        badge: "A complete operating system",
        h1: "Your computer, running your system — with updates that never break it.",
        sub: "MoOS is a real desktop operating system built on Fedora Atomic with KDE Plasma 6. Every release is built and signed automatically; your machine pulls the signed image and applies it on reboot — and if you don't like it, one command puts you back.",
        specs: ["Fedora Atomic · bootc", "KDE Plasma 6 · Wayland", "cosign-signed updates", "Arabic & RTL native", "Free and open"],
        ctaMain: "Download the public edition",
        ctaCloud: "Download the cloud edition",
        ctaRepo: "Source on GitHub",
        heroCaption: "The real MoOS desktop — the Horizon hub with time, weather and machine health",
        proof: [
          { v: "16", l: "official light & dark themes" },
          { v: "3", l: "editions: desktop, NVIDIA, cloud" },
          { v: "Daily", l: "automated build and signing" },
          { v: "Free", l: "no fees, no account" },
        ],
        arabicEyebrow: "Arabic from the root",
        arabicTitle: "The first OS that feels written for Arabic — not translated into it",
        arabicBody:
          "The launcher, search, app names, dates, weather, and the direction of the interface itself are natively Arabic inside the system — not a bolt-on translation layer. Prefer English or German? Switch in one click.",
        arabicBullets: [
          "A full RTL interface designed as RTL, not mirrored by accident",
          "Arabic dates, numerals and weather live on the desktop",
          "Instant Arabic search across apps, files and commands",
          "Crisp Arabic typography on 4K and HiDPI displays",
        ],
        arabicCaption: "The MoOS launcher in full Arabic — a live screenshot from the system",
        safeEyebrow: "It doesn't break",
        safeTitle: "It updates itself safely — and one command undoes anything",
        safeBody:
          "MoOS isn't a traditional distro updated package by package until something snaps. The system is a single read-only image: built, signed, and applied whole on reboot. No half-finished update, no machine that refuses to boot with no way back.",
        features: [
          { icon: ShieldCheck, t: "Signed and verified", b: "Every image is cosign-signed, and the installed system refuses any update that isn't signed with the MoOS key." },
          { icon: RotateCcw, t: "Instant rollback", b: "The previous version stays on disk. One command — or one GRUB entry — and you're exactly where you were." },
          { icon: Sparkles, t: "The Horizon glass shell", b: "A live hub, a media island, and a glass dock — a modern desktop that still runs smoothly on modest hardware." },
          { icon: Layers, t: "Your apps, already there", b: "Mo AI, Mo Store, MoPlayer and Mo PC Remote are built into the image and ready from the first boot." },
        ],
        themesEyebrow: "System personality",
        themesTitle: "16 official themes — light and dark, same quality",
        themesBody:
          "A full theme family generated from one colour source: wallpaper, windows, icons, lock screen and even the boot splash change together in a single click. Pick what suits you — the system stays coherent.",
        appsEyebrow: "MoOS apps",
        appsTitle: "Apps designed for this system, not imported into it",
        appsBody:
          "Icons and apps built in the same glass language — Mo AI to help, Mo Store to install, MoPlayer to watch, Mo PC Remote to drive it from your phone, plus recovery, updates and settings.",
        editionsEyebrow: "Download",
        editionsTitle: "Pick your edition and download the official installer",
        editionsBody:
          "The installer is an official script that verifies the release signature before installing, and pins your current system so rollback always works. Or copy the one-line command if you prefer the terminal.",
        download: "Download installer",
        orCommand: "or one command",
        recommended: "Recommended",
        copy: "Copy",
        copied: "Copied",
        verifyTitle: "Verify it yourself before installing",
        verifyBody: "Every release is signed. You can confirm the image really came from MoOS before you install:",
        cloudEyebrow: "MoOS Cloud",
        cloudTitle: "The same system, on a server that never sleeps",
        cloudBody:
          "Instead of leaving your machine on, take a cheap VPS and turn it into MoOS with one command. For development, for running Mo AI, for your own projects — same signed updates, reachable from anywhere.",
        cloudPrice: "€3.79",
        cloudPriceNote: "a month on Hetzner — or free on Oracle",
        cloudBullets: [
          "No games or Android layer — the server's resources stay yours",
          "SSH is the front door, with the desktop reachable from a browser",
          "The same signed updates and the same instant rollback",
          "Your existing SSH keys are carried across the conversion",
        ],
        cloudNote: "Works on Hetzner, Contabo, OVH, Vultr and Oracle — any provider that offers Fedora. Your SSH keys are carried over so you never lose access.",
        updateTitle: "Update",
        updateBody: "One command stages the latest signed image; it applies on the next reboot.",
        rollbackTitle: "Roll back",
        rollbackBody: "Didn't like an update? Go straight back to the previous version — or pick it from the boot menu.",
        isoTitle: "Bootable USB image",
        isoBody:
          "For machines that don't run Linux yet. It is built from exactly the same published image; permanent hosting is being finalized — until then the installer above gives you the same system.",
        isoSoon: "Coming soon",
        isoDownload: "Download ISO",
        finalTitle: "A complete operating system, free",
        finalBody: "No fees, no account, no tracking. The full source is open and the signing key is public — you can verify every claim here yourself.",
        finalNote: "MoOS is an open-source personal project by Mohammad Alfarras.",
        maintenanceMsg: "MoOS is being updated right now — downloads will return shortly.",
      };

  // The manifest ships English summaries (it is also read by the API and the
  // admin), so the page keeps its own localized copy per edition and falls back
  // to the manifest only for an edition it does not know about yet.
  const editionCopy: Record<string, { name: string; summary: string }> = isAr
    ? {
        desktop: {
          name: "MoOS للمكتب",
          summary: "النسخة العامة للكمبيوتر — موقّعة، ذرّية، ومحدّثة دائماً. مناسبة لأجهزة Intel و AMD والكروت المفتوحة.",
        },
        nvidia: {
          name: "MoOS للمكتب · NVIDIA",
          summary: "نفس النسخة مع سوّاقة NVIDIA المفتوحة مدمجة — للأجهزة التي تحمل كرت NVIDIA حديثاً.",
        },
        cloud: {
          name: "MoOS Cloud",
          summary: "نسخة الخوادم التي تعمل ٧/٢٤ على أي VPS رخيص: SSH هو الباب، بلا طبقة ألعاب، وسطح المكتب يوصلك من المتصفح.",
        },
      }
    : {
        desktop: {
          name: "MoOS Desktop",
          summary: "The public desktop edition — signed, atomic, always current. For Intel, AMD and Nouveau machines.",
        },
        nvidia: {
          name: "MoOS Desktop · NVIDIA",
          summary: "The same desktop with the open NVIDIA driver layered in, for modern NVIDIA GPUs.",
        },
        cloud: {
          name: "MoOS Cloud",
          summary: "The 24/7 server edition for any cheap VPS: SSH-first, no games layer, reachable from the browser.",
        },
      };

  // Download links stay plain <a>: a next/link would prefetch the download API
  // and inflate the counter without a real click (same rule the MoPlayer
  // download buttons follow).
  const installerHref = (id: string) => `/api/os/download?type=${id}`;
  const isoHref = installerHref("iso");
  const editionCommand = (edition: MoosEdition) =>
    edition.id === "cloud"
      ? `sudo dnf install -y system-reinstall-bootc && sudo system-reinstall-bootc ${edition.image}`
      : `sudo bootc switch ${edition.image} && sudo systemctl reboot`;
  const editionIcon = (id: string) => (id === "cloud" ? Cloud : id === "nvidia" ? Cpu : Monitor);

  return (
    <main className="moos-page" dir={isAr ? "rtl" : "ltr"}>
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="moos-shell moos-hero">
        <div className="moos-hero-top">
          <div>
            <span className="moos-badge">
              <Cpu className="h-3.5 w-3.5" /> {t.badge}
            </span>

            <div className="moos-logo-row">
              <Image src="/images/moos/moos-logo.png" alt="MoOS" width={140} height={140} priority />
              <span className="moos-wordmark">MoOS</span>
            </div>

            <h1>{t.h1}</h1>
            <p className="moos-hero-sub">{t.sub}</p>

            <div className="moos-spec-row">
              {t.specs.map((spec) => (
                <span key={spec} className="moos-spec">
                  {spec}
                </span>
              ))}
            </div>

            {maintenance ? (
              <div className="moos-note" style={{ color: "#f4c56a" }}>
                {t.maintenanceMsg}
              </div>
            ) : (
              <div className="moos-cta-row">
                <a href={installerHref("desktop")} className="moos-btn moos-btn-primary">
                  <Download className="h-4 w-4" /> {t.ctaMain}
                </a>
                <a href={installerHref("cloud")} className="moos-btn moos-btn-ghost">
                  <Cloud className="h-4 w-4" /> {t.ctaCloud}
                </a>
              </div>
            )}
          </div>

          <div>
            <div className="moos-shot moos-shot-glow moos-hero-shot">
              <Image
                src="/images/moos/desktop-dark.webp"
                alt={t.heroCaption}
                width={2400}
                height={1350}
                priority
                sizes="(max-width: 1000px) 100vw, 560px"
              />
            </div>
            <p className="moos-shot-caption">{t.heroCaption}</p>
          </div>
        </div>

        <div className="moos-proof">
          {t.proof.map((item) => (
            <div key={item.l} className="moos-proof-item">
              <strong>{item.v}</strong>
              <span>{item.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Arabic native ────────────────────────────────── */}
      <section className="moos-shell moos-section">
        <div className="moos-split">
          <div className="moos-split-media">
            <div className="moos-shot">
              <Image
                src="/images/moos/launcher-arabic.webp"
                alt={t.arabicCaption}
                width={2400}
                height={1350}
                sizes="(max-width: 1000px) 100vw, 620px"
              />
            </div>
            <p className="moos-shot-caption">{t.arabicCaption}</p>
          </div>
          <div>
            <span className="moos-eyebrow">
              <Languages className="mb-0.5 inline h-3.5 w-3.5" /> {t.arabicEyebrow}
            </span>
            <h2 className="moos-h2">{t.arabicTitle}</h2>
            <p className="moos-lede">{t.arabicBody}</p>
            <ul className="moos-bullets">
              {t.arabicBullets.map((b) => (
                <li key={b}>
                  <Check className="h-4 w-4" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── Safety / features ────────────────────────────── */}
      <section className="moos-shell moos-section">
        <span className="moos-eyebrow">{t.safeEyebrow}</span>
        <h2 className="moos-h2">{t.safeTitle}</h2>
        <p className="moos-lede">{t.safeBody}</p>
        <div className="moos-features">
          {t.features.map((f) => (
            <article key={f.t} className="moos-feature">
              <span className="moos-feature-icon">
                <f.icon className="h-5 w-5" />
              </span>
              <h3>{f.t}</h3>
              <p>{f.b}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Themes ───────────────────────────────────────── */}
      <section className="moos-shell moos-section">
        <span className="moos-eyebrow">
          <Palette className="mb-0.5 inline h-3.5 w-3.5" /> {t.themesEyebrow}
        </span>
        <h2 className="moos-h2">{t.themesTitle}</h2>
        <p className="moos-lede">{t.themesBody}</p>
        <div className="moos-theme-grid">
          {THEMES.map((theme) => (
            <figure key={theme.id} className="moos-theme">
              <Image
                src={`/images/moos/themes/${theme.id}.webp`}
                alt={isAr ? `ثيم ${theme.name} في MoOS` : `The ${theme.name} theme in MoOS`}
                width={640}
                height={400}
                sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 24vw"
              />
              <figcaption>
                <span>{theme.name}</span>
                <em>{theme.tone === "light" ? (isAr ? "فاتح" : "Light") : isAr ? "داكن" : "Dark"}</em>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─── Light desktop + apps ─────────────────────────── */}
      <section className="moos-shell moos-section">
        <div className="moos-apps">
          <div>
            <span className="moos-eyebrow">{t.appsEyebrow}</span>
            <h2 className="moos-h2">{t.appsTitle}</h2>
            <p className="moos-lede">{t.appsBody}</p>
            <div className="moos-apps-media" style={{ marginTop: "1.6rem" }}>
              <Image
                src="/images/moos/app-icons.webp"
                alt={isAr ? "أيقونات تطبيقات MoOS" : "MoOS app icons"}
                width={1320}
                height={520}
                sizes="(max-width: 1000px) 100vw, 460px"
              />
            </div>
          </div>
          <div>
            <div className="moos-shot">
              <Image
                src="/images/moos/desktop-light.webp"
                alt={isAr ? "MoOS بالثيم الفاتح" : "MoOS in its light theme"}
                width={2400}
                height={1350}
                sizes="(max-width: 1000px) 100vw, 640px"
              />
            </div>
            <p className="moos-shot-caption">
              {isAr ? "نفس النظام بثيم فاتح — الوضوح نفسه نهاراً" : "The same system in a light theme — equally clear by day"}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Editions / download ──────────────────────────── */}
      <section id="download" className="moos-shell moos-section" style={{ scrollMarginTop: "6rem" }}>
        <span className="moos-eyebrow">
          <Download className="mb-0.5 inline h-3.5 w-3.5" /> {t.editionsEyebrow}
        </span>
        <h2 className="moos-h2">{t.editionsTitle}</h2>
        <p className="moos-lede">{t.editionsBody}</p>

        <div className="moos-editions">
          {editions.map((edition) => {
            const Icon = editionIcon(edition.id);
            return (
              <article
                key={edition.id}
                className={`moos-edition${edition.recommended ? " moos-edition-featured" : ""}`}
              >
                <div className="moos-edition-head">
                  <span className="moos-feature-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  {edition.recommended ? <span className="moos-pill">{t.recommended}</span> : null}
                </div>
                <h3>{editionCopy[edition.id]?.name ?? edition.name}</h3>
                <p>{editionCopy[edition.id]?.summary ?? edition.summary}</p>
                <div className="moos-edition-actions">
                  {maintenance ? (
                    <span className="moos-btn" aria-disabled="true">
                      <Download className="h-4 w-4" /> {t.download}
                    </span>
                  ) : (
                    <a
                      href={installerHref(edition.id)}
                      className={`moos-btn ${edition.recommended ? "moos-btn-primary" : "moos-btn-ghost"}`}
                    >
                      <Download className="h-4 w-4" /> {t.download}
                    </a>
                  )}
                  <span className="moos-shot-caption" style={{ margin: 0 }}>
                    {t.orCommand}
                  </span>
                  <CopyLine command={editionCommand(edition)} copyLabel={t.copy} copiedLabel={t.copied} />
                </div>
              </article>
            );
          })}
        </div>

        <div className="moos-card" style={{ marginTop: "1rem", padding: "1.5rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "#fff", fontSize: "1.02rem", fontWeight: 800 }}>
            <ShieldCheck className="h-4 w-4 text-[#4ed7c8]" /> {t.verifyTitle}
          </h3>
          <p style={{ margin: "0.4rem 0 1rem", color: "rgba(233,245,243,0.6)", fontSize: "0.9rem", lineHeight: 1.7 }}>
            {t.verifyBody}
          </p>
          <CopyLine
            command={`cosign verify --key ${signingKeyUrl} ${desktopImage}`}
            copyLabel={t.copy}
            copiedLabel={t.copied}
          />
        </div>
      </section>

      {/* ─── Cloud ────────────────────────────────────────── */}
      <section className="moos-shell moos-section">
        <div className="moos-cloud">
          <div className="moos-cloud-grid">
            <div>
              <span className="moos-cloud-icon">
                <Cloud className="h-6 w-6" />
              </span>
              <h2 className="moos-h2" style={{ marginTop: "1rem" }}>
                {t.cloudTitle}
              </h2>
              <p className="moos-lede">{t.cloudBody}</p>
              <div className="moos-price">
                <strong>{t.cloudPrice}</strong>
                <span>{t.cloudPriceNote}</span>
              </div>
              <div className="moos-cta-row">
                <a href={installerHref("cloud")} className="moos-btn moos-btn-primary">
                  <Download className="h-4 w-4" /> {t.ctaCloud}
                </a>
              </div>
            </div>
            <div>
              <CopyLine
                command={`sudo dnf install -y system-reinstall-bootc && sudo system-reinstall-bootc ${cloudImage}`}
                copyLabel={t.copy}
                copiedLabel={t.copied}
              />
              <ul className="moos-bullets" style={{ marginTop: "1.2rem" }}>
                {t.cloudBullets.map((b) => (
                  <li key={b}>
                    <Check className="h-4 w-4" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <p className="moos-note" style={{ marginTop: "1rem" }}>
                {t.cloudNote}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Update / rollback ────────────────────────────── */}
      <section className="moos-shell moos-section">
        <div className="moos-duo">
          <div className="moos-duo-card">
            <h3>
              <RefreshCw className="h-4 w-4" /> {t.updateTitle}
            </h3>
            <p>{t.updateBody}</p>
            <CopyLine command="moai-do update" copyLabel={t.copy} copiedLabel={t.copied} />
          </div>
          <div className="moos-duo-card">
            <h3>
              <RotateCcw className="h-4 w-4" /> {t.rollbackTitle}
            </h3>
            <p>{t.rollbackBody}</p>
            <CopyLine command="sudo bootc rollback && sudo systemctl reboot" copyLabel={t.copy} copiedLabel={t.copied} />
          </div>
        </div>

        <div className="moos-iso" style={{ marginTop: "1rem" }}>
          <span className="moos-iso-icon">
            <Disc3 className="h-6 w-6" />
          </span>
          <div>
            <h3>{t.isoTitle}</h3>
            <p>{t.isoBody}</p>
          </div>
          {isoReady ? (
            <a href={isoHref} className="moos-btn moos-btn-primary">
              <Download className="h-4 w-4" /> {t.isoDownload}
            </a>
          ) : (
            <span className="moos-btn" aria-disabled="true">
              {t.isoSoon}
            </span>
          )}
        </div>
      </section>

      {/* ─── Final ────────────────────────────────────────── */}
      <section className="moos-shell moos-section">
        <div className="moos-final">
          <h2 className="moos-h2">{t.finalTitle}</h2>
          <p className="moos-lede">{t.finalBody}</p>
          <div className="moos-cta-row">
            <a href={installerHref("desktop")} className="moos-btn moos-btn-primary">
              <Download className="h-4 w-4" /> {t.ctaMain}
            </a>
            <a href={repoUrl} target="_blank" rel="noreferrer" className="moos-btn moos-btn-ghost">
              <GitBranch className="h-4 w-4" /> {t.ctaRepo} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link href={`/${locale}/apps`} className="moos-btn moos-btn-ghost">
              {isAr ? "بقية التطبيقات" : "More apps"}
            </Link>
          </div>
          <p className="moos-note">{t.finalNote}</p>
        </div>
      </section>
    </main>
  );
}
