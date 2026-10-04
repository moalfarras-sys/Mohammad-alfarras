"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Box,
  Check,
  Cloud,
  Copy,
  Cpu,
  Disc3,
  Download,
  GitBranch,
  Languages,
  Layers,
  Laptop,
  Monitor,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Usb,
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
  const desktopImage = desktop?.image ?? "ghcr.io/moalfarras-sys/moos:latest";
  const isoReady = Boolean(release?.iso.available && release.iso.url);
  const isoSha = release?.iso.sha256;
  const maintenance = Boolean(release?.maintenance);

  const t = isAr
    ? {
        badge: "نظام جديد · قيد التطوير النشط",
        h1: "كمبيوترك، بطريقتك. عربي من الداخل، وذكي من أول تشغيل.",
        sub: "MoOS نظام تشغيل جديد للكمبيوتر أبنيه فوق Fedora Atomic وKDE Plasma 6. يجمع سطح مكتب عربي أصيل، تطبيقات Linux، وتشغيل تطبيقات Android وWindows عبر طبقات توافق اختيارية، مع Mo AI وMo PC Remote داخل تجربة واحدة قابلة للتراجع.",
        specs: ["Fedora Atomic · bootc", "KDE Plasma 6 · Wayland", "تحديثات موقّعة بـ cosign", "عربية و RTL أصيلة", "مجاني ومفتوح"],
        ctaMain: "حمّل ISO المجرّب",
        ctaInstaller: "التثبيت من Linux",
        ctaGuide: "كيف تثبّته؟",
        ctaCloud: "حمّل نسخة الكلاود",
        ctaRepo: "المصدر على GitHub",
        heroCaption: "سطح مكتب MoOS الحقيقي — لوحة Horizon مع الوقت والطقس وحالة الجهاز بالعربية",
        heroSignals: ["Android عبر Waydroid", "Windows عبر Bottles", "تحكم من الجوال", "Mo AI محلي أو سحابي"],
        proof: [
          { v: "١٢", l: "ثيماً حقيقياً فاتحاً وداكناً" },
          { v: "٣", l: "نسخ: مكتب، NVIDIA، كلاود" },
          { v: "موقّع", l: "صور وتحديثات قابلة للتحقق" },
          { v: "ISO", l: "إقلاع وتثبيت وإعادة تشغيل مجرّبة" },
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
        worldEyebrow: "ثلاثة عوالم في مكان واحد",
        worldTitle: "Linux في الأساس. Android وWindows عندما تحتاجهما.",
        worldBody:
          "الطبقات الإضافية اختيارية حتى يبقى النظام خفيفاً. فعّل ما يلزمك فقط، واعرف حدود التوافق قبل أن تبدأ — بعض التطبيقات والألعاب قد تحتاج إعداداً خاصاً أو لا تعمل.",
        worlds: [
          { icon: Box, t: "تطبيقات Linux", b: "تطبيقات Flatpak من Flathub ومتجر MoOS، مع عزل وتحديثات واضحة." },
          { icon: Smartphone, t: "تطبيقات Android", b: "Waydroid يشغّل Android داخل حاوية. تنزيل أولي يقارب 1GB، بلا Google Play افتراضياً، وملفات APK تظهر في قائمة التطبيقات." },
          { icon: Laptop, t: "تطبيقات Windows", b: "Bottles يدير Wine لتشغيل ملفات EXE في بيئة منفصلة. التوافق يختلف من برنامج لآخر، لذلك لا ندّعي أن كل برنامج سيعمل." },
        ],
        worldNote: "انقر ملف APK أو EXE بعد تجهيز طبقته؛ MoOS يفتح المسار الصحيح ويشرح الخطوة بدل أن يتركك أمام خطأ صامت.",
        safeEyebrow: "تحديثات ذرّية",
        safeTitle: "يتحدّث كصورة واحدة — وتبقى نسخة الرجوع جاهزة",
        safeBody:
          "بدلاً من تبديل مئات الحزم داخل النظام العامل، يصل التحديث كصورة موقّعة وتُطبَّق بعد إعادة التشغيل. لا يوجد وعد بأن البرمجيات لا تخطئ، لكن هناك مسار تحقق ورجوع واضح إلى النسخة السابقة.",
        features: [
          { icon: ShieldCheck, t: "موقّع ومتحقَّق منه", b: "كل صورة موقّعة بـ cosign، والنظام المثبّت يرفض أي تحديث غير موقّع بمفتاح MoOS." },
          { icon: RotateCcw, t: "تراجع فوري", b: "النسخة السابقة تبقى محفوظة على القرص. أمر واحد أو خيار من قائمة الإقلاع وترجع كما كنت." },
          { icon: Sparkles, t: "واجهة Horizon الزجاجية", b: "لوحة معلومات، جزيرة وسائط، ودوك زجاجي — تصميم حديث يشتغل بسلاسة على أجهزة متواضعة." },
          { icon: Layers, t: "طبقات اختيارية", b: "تجهيز Android وWindows والألعاب يتم عند الطلب، حتى لا يحمل جهازك ما لا تحتاجه." },
        ],
        themesEyebrow: "شخصية النظام",
        themesTitle: "١٢ ثيماً حقيقياً — فاتح وداكن، بنفس اللغة البصرية",
        themesBody:
          "عائلة ثيمات كاملة مولّدة من نفس مصدر الألوان: الخلفية، النوافذ، الأيقونات، شاشة القفل، وحتى شاشة الإقلاع تتبدّل معاً بضغطة واحدة. اختر ما يريحك — النظام يبقى متناسقاً.",
        appsEyebrow: "تطبيقات MoOS",
        appsTitle: "مركز واحد للجهاز، التطبيقات، والاتصال",
        appsBody:
          "تطبيقات MoOS الأساسية تستخدم نفس لغة التصميم: Mo AI للمساعدة وإجراءات النظام الآمنة، متجر MoOS للتثبيت، Mo PC Remote للتحكم من الجوال، مع أدوات الاستعادة والتحديث والإعدادات.",
        intelligenceEyebrow: "الذكاء والتحكم",
        intelligenceTitle: "اسأل الجهاز من Mo AI. وتحكّم به من جوالك.",
        aiTitle: "Mo AI — مساعد محلي أولاً",
        aiBody: "واجهة واحدة لفهم حالة الجهاز، البحث عن تطبيقات، وتشغيل إجراءات نظام محددة وآمنة. العقل المحلي اختياري ويحتاج تنزيل نموذج أول مرة وقد يتأثر بقدرة الجهاز؛ ويمكن ربط مزوّد سحابي بمفتاحك من الإعدادات.",
        remoteTitle: "Mo PC Remote — شاشة وفأرة ولوحة مفاتيح من الجوال",
        remoteBody: "تشغّل الخدمة عندما تحتاجها ثم تفتح عنوان الاتصال من هاتفك على الشبكة. ترى سطح المكتب وتتحكم باللمس وتكتب بالعربية؛ الخدمة اختيارية وحالتها تُقرأ من الجهاز فعلياً.",
        honestNote: "MoOS ما زال مشروعاً جديداً قيد التطوير. الميزات المعروضة موجودة في الصورة الحالية، لكن توافق الأجهزة والبرامج يحتاج اختباراً على جهازك.",
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
          "للأجهزة التي ليس عليها Linux بعد. هذه النسخة أقلعت وثُبّتت دون اتصال، ثم نجحت في الإقلاع من القرص وإعادة التشغيل وفحص التطبيقات والإطفاء ضمن بوابة الإصدار.",
        isoSoon: "غير متاح حالياً",
        isoUnavailable:
          "صورة USB غير متاحة للتحميل حالياً. يمكنك التثبيت الآن من نظام Fedora Atomic أو Linux موجود عبر المثبّت الرسمي أعلاه، وسنفتح التحميل بعد التحقق من الخادم الجديد.",
        cloudLabel: "MoOS Cloud للخوادم",
        isoDownload: "حمّل ISO",
        installEyebrow: "التثبيت خطوة بخطوة",
        installTitle: "من ملف ISO إلى سطح مكتب MoOS",
        installBody: "انسخ ملفاتك المهمة أولاً. التثبيت يغيّر أقسام القرص، لذلك اقرأ شاشة اختيار القرص بعناية ولا تجرّبه على جهازك الوحيد دون نسخة احتياطية.",
        installSteps: [
          { n: "01", t: "نزّل وتحقّق", b: "حمّل ISO من هذا الموقع وقارن SHA-256 قبل الكتابة على USB." },
          { n: "02", t: "اكتب على USB", b: "استخدم Fedora Media Writer أو Rufus. لا تستخدم Ventoy مع هذه الصورة." },
          { n: "03", t: "أقلع وجرّب", b: "اختر USB من قائمة الإقلاع وجرّب الجلسة الحية للتأكد من الشبكة والصوت والشاشة." },
          { n: "04", t: "ثبّت ثم أعد التشغيل", b: "افتح مثبّت MoOS، راجع القرص والمنطقة الزمنية، أكمل التثبيت ثم انزع USB عند إعادة التشغيل." },
        ],
        checksumLabel: "SHA-256 الرسمي",
        finalTitle: "نظام تشغيل كامل، مجاناً",
        finalBody: "بلا رسوم، بلا حساب، بلا تتبّع. المصدر كامل ومفتوح، ومفتاح التوقيع علني — تقدر تتحقّق من كل شي بنفسك.",
        finalNote: "MoOS مشروع شخصي مفتوح المصدر من محمد الفراس.",
        maintenanceMsg: "MoOS قيد التحديث حالياً — التحميل سيعود قريباً.",
      }
    : {
        badge: "A new OS · actively developed",
        h1: "Your computer, your way — Arabic-native and intelligent from first boot.",
        sub: "MoOS is a new desktop operating system built on Fedora Atomic and KDE Plasma 6. It combines a native Arabic desktop, Linux apps, optional Android and Windows compatibility layers, Mo AI, and phone control in one rollback-ready experience.",
        specs: ["Fedora Atomic · bootc", "KDE Plasma 6 · Wayland", "cosign-signed updates", "Arabic & RTL native", "Free and open"],
        ctaMain: "Download the tested ISO",
        ctaInstaller: "Install from Linux",
        ctaGuide: "How do I install it?",
        ctaCloud: "Download the cloud edition",
        ctaRepo: "Source on GitHub",
        heroCaption: "The real MoOS desktop — the Horizon hub with time, weather and machine health",
        heroSignals: ["Android via Waydroid", "Windows via Bottles", "Phone remote control", "Local or cloud Mo AI"],
        proof: [
          { v: "12", l: "real light & dark themes" },
          { v: "3", l: "editions: desktop, NVIDIA, cloud" },
          { v: "Signed", l: "verifiable images and updates" },
          { v: "ISO", l: "boot, install and reboot tested" },
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
        worldEyebrow: "Three worlds, one desktop",
        worldTitle: "Linux at the core. Android and Windows when you need them.",
        worldBody: "Compatibility layers stay optional so the base system remains lean. Enable only what you need and know the boundary: some apps and games can require extra setup or may not work.",
        worlds: [
          { icon: Box, t: "Linux apps", b: "Sandboxed Flatpak apps from Flathub and the MoOS store, with clear updates." },
          { icon: Smartphone, t: "Android apps", b: "Waydroid runs Android in a container. The first setup downloads about 1GB, ships without Google Play by default, and places installed APKs in your launcher." },
          { icon: Laptop, t: "Windows apps", b: "Bottles manages Wine for isolated EXE environments. Compatibility varies by program, so MoOS does not promise that every app will run." },
        ],
        worldNote: "After its layer is prepared, open an APK or EXE normally; MoOS routes it to the right flow and explains what is missing instead of failing silently.",
        safeEyebrow: "Atomic updates",
        safeTitle: "Updates arrive as one image — with the previous deployment ready",
        safeBody:
          "Instead of replacing hundreds of packages inside a running system, updates arrive as a signed image and apply after reboot. Software can still fail; the difference is a clear verification and rollback path to the previous deployment.",
        features: [
          { icon: ShieldCheck, t: "Signed and verified", b: "Every image is cosign-signed, and the installed system refuses any update that isn't signed with the MoOS key." },
          { icon: RotateCcw, t: "Instant rollback", b: "The previous version stays on disk. One command — or one GRUB entry — and you're exactly where you were." },
          { icon: Sparkles, t: "The Horizon glass shell", b: "A live hub, a media island, and a glass dock — a modern desktop that still runs smoothly on modest hardware." },
          { icon: Layers, t: "Optional layers", b: "Android, Windows and gaming support are prepared on demand, so your machine carries only what you use." },
        ],
        themesEyebrow: "System personality",
        themesTitle: "12 real themes — light and dark, one visual language",
        themesBody:
          "A full theme family generated from one colour source: wallpaper, windows, icons, lock screen and even the boot splash change together in a single click. Pick what suits you — the system stays coherent.",
        appsEyebrow: "MoOS apps",
        appsTitle: "One control surface for the machine, apps and connection",
        appsBody:
          "Core MoOS apps share one visual language: Mo AI for assistance and allow-listed system actions, the MoOS store for installs, Mo PC Remote for phone control, plus recovery, updates and settings.",
        intelligenceEyebrow: "Intelligence and control",
        intelligenceTitle: "Ask the machine through Mo AI. Control it from your phone.",
        aiTitle: "Mo AI — local-first assistance",
        aiBody: "One surface for machine status, app discovery and specific allow-listed system actions. The local brain is optional, downloads a model on first use, and depends on your hardware; you can also configure a cloud provider with your own key.",
        remoteTitle: "Mo PC Remote — screen, mouse and keyboard from your phone",
        remoteBody: "Start the service when you need it, then open its connection address from a phone on your network. View the desktop, use touch input and type Arabic; the service is optional and its status is read from the machine.",
        honestNote: "MoOS is still a new, actively developed project. The capabilities shown here exist in the current image, but hardware and app compatibility still need testing on your machine.",
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
          "For machines that do not run Linux yet. This release passed live boot, offline installation, installed-disk boot, reboot, app smoke and clean poweroff in the release gate.",
        isoSoon: "Not available yet",
        isoUnavailable:
          "The USB image is not downloadable right now. You can install today from an existing Fedora Atomic or Linux system with the official installer above; the image returns once its new host passes verification.",
        cloudLabel: "MoOS Cloud for servers",
        isoDownload: "Download ISO",
        installEyebrow: "Step-by-step install",
        installTitle: "From ISO file to a MoOS desktop",
        installBody: "Back up important files first. Installation changes disk partitions, so read the disk-selection screen carefully and do not test on your only machine without a backup.",
        installSteps: [
          { n: "01", t: "Download and verify", b: "Get the ISO from this site and compare its SHA-256 before writing the USB." },
          { n: "02", t: "Write the USB", b: "Use Fedora Media Writer or Rufus. Do not use Ventoy with this image." },
          { n: "03", t: "Boot and test", b: "Choose the USB in your boot menu and use the live session to check networking, sound and display." },
          { n: "04", t: "Install and reboot", b: "Open the MoOS installer, confirm disk and timezone, finish, then remove the USB on reboot." },
        ],
        checksumLabel: "Official SHA-256",
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

  // Without a downloadable ISO the primary action is the signed installer for
  // an existing Linux system — never a button labelled as an ISO download.
  const primaryHref = isoReady ? isoHref : "#download";
  const primaryLabel = isoReady ? t.ctaMain : t.ctaInstaller;
  const proof = isoReady ? t.proof : t.proof.filter((item) => item.v !== "ISO");

  return (
    <div className="moos-page" dir={isAr ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="moos-shell moos-hero">
        <div className="moos-hero-top">
          <div>
            <span className="moos-badge">
              <Cpu className="h-3.5 w-3.5" /> {t.badge}
            </span>

            <div className="moos-logo-row">
              <Image src="/images/moos/moos-logo.png" alt="MoOS" width={140} height={140} preload />
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
                <a href={primaryHref} className="moos-btn moos-btn-primary">
                  <Download className="h-4 w-4" /> {primaryLabel}
                </a>
                {isoReady ? (
                  <a href="#install" className="moos-btn moos-btn-ghost">
                    <Usb className="h-4 w-4" /> {t.ctaGuide}
                  </a>
                ) : (
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="moos-btn moos-btn-ghost">
                    <GitBranch className="h-4 w-4" /> {t.ctaRepo}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="moos-hero-visual">
            <div className="moos-shot moos-shot-glow moos-hero-shot">
              <Image src="/images/moos/desktop-dark.webp" alt={t.heroCaption} width={2400} height={1350} preload sizes="(max-width: 1000px) 100vw, 560px" />
            </div>
            <div className="moos-signal-cloud" aria-label={isAr ? "قدرات MoOS" : "MoOS capabilities"}>
              {t.heroSignals.map((signal, index) => (
                <span key={signal} className={`moos-signal moos-signal-${index + 1}`}>
                  <span aria-hidden /> {signal}
                </span>
              ))}
            </div>
            <p className="moos-shot-caption">{t.heroCaption}</p>
          </div>
        </div>

        <div className="moos-proof">
          {proof.map((item) => (
            <div key={item.l} className="moos-proof-item">
              <strong>{item.v}</strong>
              <span>{item.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Arabic native */}
      <section className="moos-shell moos-section">
        <div className="moos-split">
          <div className="moos-split-media">
            <div className="moos-shot">
              <Image src="/images/moos/launcher-arabic.webp" alt={t.arabicCaption} width={2400} height={1350} sizes="(max-width: 1000px) 100vw, 620px" />
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

      {/* Linux + Android + Windows */}
      <section className="moos-shell moos-section">
        <span className="moos-eyebrow">{t.worldEyebrow}</span>
        <h2 className="moos-h2">{t.worldTitle}</h2>
        <p className="moos-lede">{t.worldBody}</p>
        <div className="moos-worlds">
          {t.worlds.map((world, index) => (
            <article key={world.t} className={`moos-world moos-world-${index + 1}`}>
              <span className="moos-world-number">0{index + 1}</span>
              <span className="moos-feature-icon">
                <world.icon className="h-5 w-5" />
              </span>
              <h3>{world.t}</h3>
              <p>{world.b}</p>
            </article>
          ))}
        </div>
        <p className="moos-compat-note">
          <Check className="h-4 w-4" /> {t.worldNote}
        </p>
      </section>

      {/* Atomic, signed, reversible — features plus the two commands */}
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
        <div className="moos-duo" style={{ marginTop: "1rem" }}>
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
      </section>

      {/* Themes */}
      <section className="moos-shell moos-section">
        <span className="moos-eyebrow">
          <Palette className="mb-0.5 inline h-3.5 w-3.5" /> {t.themesEyebrow}
        </span>
        <h2 className="moos-h2">{t.themesTitle}</h2>
        <p className="moos-lede">{t.themesBody}</p>
        <div className="moos-theme-grid moos-theme-grid--compact">
          {THEMES.map((theme) => (
            <figure key={theme.id} className="moos-theme">
              <Image
                src={`/images/moos/themes/${theme.id}.webp`}
                alt={isAr ? `ثيم ${theme.name} في MoOS` : `The ${theme.name} theme in MoOS`}
                width={640}
                height={400}
                sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 200px"
              />
              <figcaption>
                <span>{theme.name}</span>
                <em>{theme.tone === "light" ? (isAr ? "فاتح" : "Light") : isAr ? "داكن" : "Dark"}</em>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Mo AI + phone remote */}
      <section className="moos-shell moos-section">
        <span className="moos-eyebrow">{t.intelligenceEyebrow}</span>
        <h2 className="moos-h2">{t.intelligenceTitle}</h2>
        <div className="moos-intelligence">
          <article className="moos-intelligence-card moos-intelligence-ai">
            <div className="moos-intelligence-head">
              <span className="moos-orbit-icon">
                <Bot className="h-6 w-6" />
              </span>
              <span className="moos-live-dot">{isAr ? "اختياري" : "Optional"}</span>
            </div>
            <h3>{t.aiTitle}</h3>
            <p>{t.aiBody}</p>
          </article>
          <article className="moos-intelligence-card moos-intelligence-remote">
            <div className="moos-intelligence-head">
              <span className="moos-orbit-icon">
                <Smartphone className="h-6 w-6" />
              </span>
              <span className="moos-live-dot">{isAr ? "على شبكتك" : "On your network"}</span>
            </div>
            <h3>{t.remoteTitle}</h3>
            <p>{t.remoteBody}</p>
          </article>
        </div>
        <p className="moos-honest-note">{t.honestNote}</p>
      </section>

      {/* Download: editions, verification, cloud and the USB image */}
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
              <article key={edition.id} className={`moos-edition${edition.recommended ? " moos-edition-featured" : ""}`}>
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
                    <a href={installerHref(edition.id)} className={`moos-btn ${edition.recommended ? "moos-btn-primary" : "moos-btn-ghost"}`}>
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

        <div className="moos-duo" style={{ marginTop: "1rem" }}>
          <div className="moos-duo-card">
            <h3>
              <ShieldCheck className="h-4 w-4" /> {t.verifyTitle}
            </h3>
            <p>{t.verifyBody}</p>
            <CopyLine command={`cosign verify --key ${signingKeyUrl} ${desktopImage}`} copyLabel={t.copy} copiedLabel={t.copied} />
          </div>
          <div className="moos-duo-card">
            <h3>
              <Cloud className="h-4 w-4" /> {t.cloudLabel}
            </h3>
            <p>{t.cloudBody}</p>
            <ul className="moos-bullets" style={{ marginTop: "0.6rem" }}>
              {t.cloudBullets.slice(0, 3).map((b) => (
                <li key={b}>
                  <Check className="h-4 w-4" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <p className="moos-note" style={{ marginTop: "0.8rem" }}>
              {t.cloudNote}
            </p>
          </div>
        </div>

        {isoReady ? (
          <div id="install" className="moos-install-section" style={{ marginTop: "2.5rem", scrollMarginTop: "6rem" }}>
            <div className="moos-install-heading">
              <div>
                <span className="moos-eyebrow">
                  <Usb className="mb-0.5 inline h-3.5 w-3.5" /> {t.installEyebrow}
                </span>
                <h2 className="moos-h2">{t.installTitle}</h2>
                <p className="moos-lede">{t.installBody}</p>
              </div>
              <a href={isoHref} className="moos-btn moos-btn-primary">
                <Download className="h-4 w-4" /> {t.isoDownload}
              </a>
            </div>
            <ol className="moos-install-steps">
              {t.installSteps.map((step) => (
                <li key={step.n}>
                  <span>{step.n}</span>
                  <h3>{step.t}</h3>
                  <p>{step.b}</p>
                </li>
              ))}
            </ol>
            {isoSha ? (
              <div className="moos-checksum">
                <div>
                  <strong>{t.checksumLabel}</strong>
                  <code dir="ltr">{isoSha}</code>
                </div>
                <CopyLine command={isoSha} copyLabel={t.copy} copiedLabel={t.copied} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="moos-iso" style={{ marginTop: "1rem" }}>
            <span className="moos-iso-icon">
              <Disc3 className="h-6 w-6" />
            </span>
            <div>
              <h3>{t.isoTitle}</h3>
              <p>{t.isoUnavailable}</p>
            </div>
            <span className="moos-btn" aria-disabled="true">
              {t.isoSoon}
            </span>
          </div>
        )}
      </section>

      {/* Final */}
      <section className="moos-shell moos-section">
        <div className="moos-final">
          <h2 className="moos-h2">{t.finalTitle}</h2>
          <p className="moos-lede">{t.finalBody}</p>
          <div className="moos-cta-row">
            <a href={primaryHref} className="moos-btn moos-btn-primary">
              <Download className="h-4 w-4" /> {primaryLabel}
            </a>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="moos-btn moos-btn-ghost">
              <GitBranch className="h-4 w-4" /> {t.ctaRepo} <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <Link href={`/${locale}/apps`} prefetch={false} className="moos-btn moos-btn-ghost">
              {isAr ? "بقية التطبيقات" : "More apps"}
            </Link>
          </div>
          <p className="moos-note">{t.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
