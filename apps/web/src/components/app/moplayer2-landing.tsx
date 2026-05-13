"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownToLine,
  CheckCircle2,
  Cpu,
  Download,
  Heart,
  KeyRound,
  Layers,
  List,
  MonitorPlay,
  Play,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tv2,
  Workflow,
  Zap,
} from "lucide-react";

import { normalizePublicImagePath } from "@/lib/asset-url";
import { repairMojibakeDeep } from "@/lib/text-cleanup";
import type { AppEcosystemData } from "@/types/app-ecosystem";
import type { Locale } from "@/types/cms";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const t = {
  en: {
    badge: "Premium Android TV Media Player",
    heroTitle: "MoPlayer Pro",
    heroSub: "A warmer, faster, and more focused IPTV experience for Android TV and mobile.",
    heroBody:
      "Built with a premium warm-glass UI, remote-first navigation, and a powerful playback engine. MoPlayer Pro brings live TV, movies, and series into one elegant surface — without clutter.",
    download: "Download APK",
    activate: "Activate / Control",
    releasePending: "Coming Soon",
    featuresTitle: "Built for the big screen",
    featuresSub: "Every detail is designed for Android TV navigation, long-session browsing, and a calm premium feel.",
    features: [
      { icon: "tv", title: "Android TV Optimized", body: "Full D-Pad navigation, large focus states, and a lean-back interface designed for remote control." },
      { icon: "list", title: "M3U Playlist Support", body: "Load any M3U/M3U8 playlist URL or import a file directly. Browse organized categories instantly." },
      { icon: "key", title: "Xtream Codes Login", body: "Connect with Xtream Codes API credentials for a rich, structured media experience." },
      { icon: "qr", title: "QR Code Activation", body: "Display a QR code on your TV and activate the app from your phone or computer." },
      { icon: "zap", title: "Media3 Player Engine", body: "Smooth playback powered by ExoPlayer with hardware acceleration, track selection, and external fallback." },
      { icon: "heart", title: "Favorites & Continue", body: "Save your favorite channels and pick up where you left off with continue watching." },
      { icon: "search", title: "Smart Search", body: "Find channels, movies, and series quickly with a TV-optimized search experience." },
      { icon: "layers", title: "Multi-Playlist", body: "Manage multiple playlists and switch between providers seamlessly." },
    ],
    loginTitle: "Multiple ways to connect",
    loginSub: "Choose the login method that works best for your setup.",
    loginMethods: [
      { title: "M3U / M3U8 URL", body: "Paste your playlist URL directly. Supports standard M3U format with categories and EPG." },
      { title: "Xtream Codes API", body: "Enter server, username, and password. Get organized Live TV, Movies, and Series sections." },
      { title: "QR Code / Web Activation", body: "Display a code on your TV screen and activate from any phone or browser." },
    ],
    devicesTitle: "Works across your devices",
    devicesSub: "One app, optimized for every screen.",
    devices: [
      { icon: "tv", title: "Android TV", body: "Primary experience. Full remote control navigation with lean-back mode." },
      { icon: "phone", title: "Android Phone", body: "Touch-optimized interface with the same powerful features." },
      { icon: "monitor", title: "Fire TV / Stick", body: "Compatible with Amazon Fire TV devices." },
    ],
    galleryTitle: "App preview",
    gallerySub: "See MoPlayer Pro in action across different screens.",
    compareTitle: "MoPlayer vs MoPlayer Pro",
    compareSub: "MoPlayer Pro is the next-generation product line. It keeps the same trusted domain, but everything else is rebuilt for a calmer, richer experience.",
    compareOld: "MoPlayer Classic",
    compareNew: "MoPlayer Pro",
    compareOldPoints: ["Classic TV-first interface", "VLC-based playback", "Single product channel", "Standard dark theme"],
    compareNewPoints: ["Warm premium glass UI (Champagne Gold)", "Media3 + ExoPlayer with track controls", "Separate releases + admin panel", "Weather & football widgets on Home"],
    faqTitle: "Frequently asked questions",
    ctaTitle: "Ready to try MoPlayer Pro?",
    ctaBody: "Download the latest APK or activate your device to get started.",
    disclaimer: "Legal notice",
    disclaimerBody:
      "MoPlayer Pro is a media player shell. It does not provide channels, playlists, subscriptions, or copyrighted media. Users connect only sources they are authorized to use.",
    support: "Get support",
    privacy: "Privacy policy",
    plannedBadge: "Coming Soon",
  },
  ar: {
    badge: "مشغل وسائط Android TV فاخر",
    heroTitle: "MoPlayer Pro",
    heroSub: "تجربة IPTV أدفأ وأسرع وأكثر تركيزاً لأجهزة Android TV والهواتف.",
    heroBody:
      "مبني بواجهة warm-glass فاخرة، تنقل أولاً بالريموت، ومحرك تشغيل قوي. يجمع MoPlayer Pro التلفزيون المباشر والأفلام والمسلسلات في واجهة أنيقة — بدون فوضى.",
    download: "تنزيل APK",
    activate: "التفعيل / التحكم",
    releasePending: "قريباً",
    featuresTitle: "مصمم للشاشة الكبيرة",
    featuresSub: "كل تفصيلة مصممة للتنقل على Android TV، جلسات المشاهدة الطويلة، وإحساس فاخر هادئ.",
    features: [
      { icon: "tv", title: "محسّن لـ Android TV", body: "تنقل كامل بالريموت، حالات تركيز واضحة، وواجهة مريحة للمشاهدة." },
      { icon: "list", title: "دعم قوائم M3U", body: "حمّل أي رابط M3U/M3U8 أو استورد ملفاً مباشرة. تصفح الفئات المنظمة فوراً." },
      { icon: "key", title: "تسجيل Xtream Codes", body: "اتصل ببيانات Xtream Codes API لتجربة وسائط غنية ومنظمة." },
      { icon: "qr", title: "تفعيل برمز QR", body: "اعرض رمز QR على تلفزيونك وفعّل التطبيق من هاتفك أو حاسوبك." },
      { icon: "zap", title: "محرك Media3", body: "تشغيل سلس مدعوم بـ ExoPlayer مع تسريع الأجهزة، اختيار المسار، ومشغل خارجي احتياطي." },
      { icon: "heart", title: "المفضلة والمتابعة", body: "احفظ قنواتك المفضلة وأكمل من حيث توقفت مع ميزة المتابعة." },
      { icon: "search", title: "بحث ذكي", body: "ابحث عن القنوات والأفلام والمسلسلات بسرعة بتجربة بحث محسّنة للتلفزيون." },
      { icon: "layers", title: "قوائم متعددة", body: "أدر قوائم تشغيل متعددة وانتقل بين المزودين بسلاسة." },
    ],
    loginTitle: "طرق متعددة للاتصال",
    loginSub: "اختر طريقة تسجيل الدخول الأنسب لإعدادك.",
    loginMethods: [
      { title: "رابط M3U / M3U8", body: "الصق رابط قائمة التشغيل مباشرة. يدعم تنسيق M3U القياسي مع الفئات و EPG." },
      { title: "Xtream Codes API", body: "أدخل الخادم واسم المستخدم وكلمة المرور. احصل على أقسام منظمة للتلفزيون والأفلام والمسلسلات." },
      { title: "رمز QR / تفعيل عبر الويب", body: "اعرض رمزاً على شاشة تلفزيونك وفعّل من أي هاتف أو متصفح." },
    ],
    devicesTitle: "يعمل على جميع أجهزتك",
    devicesSub: "تطبيق واحد، محسّن لكل شاشة.",
    devices: [
      { icon: "tv", title: "Android TV", body: "التجربة الأساسية. تنقل كامل بالريموت مع وضع الاسترخاء." },
      { icon: "phone", title: "هاتف Android", body: "واجهة محسّنة للمس بنفس الميزات القوية." },
      { icon: "monitor", title: "Fire TV / Stick", body: "متوافق مع أجهزة Amazon Fire TV." },
    ],
    galleryTitle: "معاينة التطبيق",
    gallerySub: "شاهد MoPlayer Pro على الشاشات المختلفة.",
    compareTitle: "MoPlayer مقابل MoPlayer Pro",
    compareSub: "MoPlayer Pro هو خط الإنتاج من الجيل الجديد. يبقى على نفس الدومين الموثوق، لكن كل شيء آخر أُعيد بناؤه لتجربة أغنى وأهدأ.",
    compareOld: "MoPlayer القديم",
    compareNew: "MoPlayer Pro",
    compareOldPoints: ["واجهة تلفزيونية كلاسيكية", "تشغيل مبني على VLC", "قناة إصدار واحدة", "ثيم داكن قياسي"],
    compareNewPoints: ["واجهة warm-glass فاخرة (Champagne Gold)", "Media3 + ExoPlayer مع تحكم المسارات", "إصدارات منفصلة + لوحة إدارة", "ويدجت الطقس والكرة على الشاشة الرئيسية"],
    faqTitle: "الأسئلة الشائعة",
    ctaTitle: "جاهز لتجربة MoPlayer Pro؟",
    ctaBody: "نزّل أحدث ملف APK أو فعّل جهازك للبدء.",
    disclaimer: "تنبيه قانوني",
    disclaimerBody:
      "MoPlayer Pro واجهة تشغيل فقط. لا يوفّر قنوات أو قوائم تشغيل أو اشتراكات أو محتوى محمي الحقوق. المستخدم يربط فقط المصادر التي يملك حق استخدامها.",
    support: "الحصول على الدعم",
    privacy: "سياسة الخصوصية",
    plannedBadge: "قريباً",
  },
};

const featureIcons: Record<string, React.ElementType> = {
  tv: Tv2, list: List, key: KeyRound, qr: QrCode, zap: Zap,
  heart: Heart, search: Search, layers: Layers,
};

const mp2Screenshots = [
  { id: "mp2-home", src: "/images/moplayer-pro-home.webp", alt: "MoPlayer Pro warm gold Android TV home screen", label: "Home" },
  { id: "mp2-activation", src: "/images/moplayer-pro-activation.webp", alt: "MoPlayer Pro QR activation and website pairing flow", label: "Activation" },
  { id: "mp2-player", src: "/images/moplayer-pro-player.webp", alt: "MoPlayer Pro warm glass media player controls", label: "Player" },
];

export function MoPlayer2Landing({ ecosystem, locale = "en" }: { ecosystem: AppEcosystemData; locale?: Locale }) {
  const isAr = locale === "ar";
  const c = repairMojibakeDeep(t[locale]);
  const latest = ecosystem.releases[0] ?? null;
  const primaryAsset = latest?.assets.find((a) => a.is_primary) ?? latest?.assets[0] ?? null;
  const hasDownload = latest && latest.assets.some((a) => a.external_url || a.storage_path);
  const downloadHref = hasDownload ? `/api/app/releases/${latest.slug}/download` : null;
  const activateHref = `/${locale}/activate?product=moplayer2`;
  const size = formatBytes(primaryAsset?.file_size_bytes);

  return (
    <main className="mp2-page" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Hero ── */}
      <section className="mp2-hero">
        <div className="mp2-hero-content">
          <span className="mp2-badge">
            <Sparkles className="h-4 w-4" />
            {ecosystem.product.hero_badge || c.badge}
          </span>
          <h1>{c.heroTitle}</h1>
          <p className="mp2-hero-sub">{c.heroSub}</p>
          <p className="mp2-hero-body">{c.heroBody}</p>
          <div className="mp2-actions">
            {downloadHref ? (
              <a href={downloadHref} className="mp2-btn mp2-btn-primary">
                <ArrowDownToLine className="h-4 w-4" /> {c.download}
              </a>
            ) : (
              <span className="mp2-btn mp2-btn-pending">{c.releasePending}</span>
            )}
            <Link href={activateHref} className="mp2-btn">
              <KeyRound className="h-4 w-4" /> {c.activate}
            </Link>
          </div>
        </div>
        <div className="mp2-hero-visual">
          <div className="mp2-hero-glow" />
          <div className="mp2-hero-frame">
            <Image
              src={normalizePublicImagePath("/images/moplayer-pro-hero.webp")}
              alt={isAr ? "تجربة MoPlayer Pro Android TV" : "MoPlayer Pro Android TV experience"}
              fill
              sizes="(max-width: 900px) 92vw, 620px"
              className="mp2-hero-img"
              loading="eager"
              preload
            />
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="mp2-stats">
        {[
          { label: isAr ? "الإصدار" : "Version", value: latest?.version_name ? `v${latest.version_name}` : "2.x" },
          { label: isAr ? "الحجم" : "Size", value: size ?? "APK" },
          { label: isAr ? "الحد الأدنى" : "Min SDK", value: `API ${ecosystem.product.android_min_sdk}` },
          { label: isAr ? "جاهز للتلفزيون" : "TV Ready", value: ecosystem.product.android_tv_ready ? "Yes" : "-" },
        ].map((s) => (
          <div key={s.label}>
            <span>{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </section>

      {latest && primaryAsset ? (
        <section className="mp2-section">
          <div className="mp2-section-head">
            <span className="mp2-badge"><Download className="h-4 w-4" /> {isAr ? "تحميل موحد" : "Universal Download"}</span>
            <h2>{isAr ? "ملف APK واحد للتلفزيونات الحقيقية" : "One APK for real Android TVs"}</h2>
            <p>
              {isAr
                ? "هذه النسخة تحتوي ARM 32-bit وARM 64-bit داخل ملف واحد، وهي الموصى بها لتلفزيونات Android 8 والأجهزة الحديثة."
                : "This build includes 32-bit ARM and 64-bit ARM in one file, recommended for Android 8 TVs and modern devices."}
            </p>
          </div>
          <div className="mp2-feature-grid">
            <a href={`/api/app/releases/${latest.slug}/download`} className="mp2-feature-card">
              <Download className="h-5 w-5" />
              <h3>{primaryAsset.label || (isAr ? "ملف APK موحد" : "Universal TV APK")}</h3>
              <p>{primaryAsset.abi ?? "universal"} · {formatBytes(primaryAsset.file_size_bytes) ?? "APK"}</p>
            </a>
          </div>
        </section>
      ) : null}

      {/* ── Features ── */}
      <section className="mp2-section">
        <div className="mp2-section-head">
          <span className="mp2-badge"><MonitorPlay className="h-4 w-4" /> {isAr ? "الميزات" : "Features"}</span>
          <h2>{c.featuresTitle}</h2>
          <p>{c.featuresSub}</p>
        </div>
        <div className="mp2-feature-grid">
          {c.features.map((f) => {
            const Icon = featureIcons[f.icon] ?? CheckCircle2;
            return (
              <article key={f.title} className="mp2-feature-card">
                <Icon className="h-5 w-5" />
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Screenshots gallery ── */}
      <section className="mp2-section">
        <div className="mp2-section-head">
          <span className="mp2-badge"><Play className="h-4 w-4" /> {isAr ? "معاينة" : "Preview"}</span>
          <h2>{c.galleryTitle}</h2>
          <p>{c.gallerySub}</p>
        </div>
        <div className="mp2-gallery">
          {mp2Screenshots.map((shot, i) => (
            <figure key={shot.id} className={i === 0 ? "mp2-gallery-wide" : ""}>
              <Image
                src={normalizePublicImagePath(shot.src)}
                alt={shot.alt}
                fill
                sizes={i === 0 ? "(max-width: 900px) 92vw, 58vw" : "(max-width: 900px) 92vw, 28vw"}
                className="mp2-hero-img"
              />
              <figcaption>{shot.label}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── Login methods ── */}
      <section className="mp2-section">
        <div className="mp2-section-head">
          <span className="mp2-badge"><KeyRound className="h-4 w-4" /> {isAr ? "طرق الاتصال" : "Login Methods"}</span>
          <h2>{c.loginTitle}</h2>
          <p>{c.loginSub}</p>
        </div>
        <div className="mp2-login-grid">
          {c.loginMethods.map((m, i) => {
            const icons = [List, Cpu, QrCode];
            const Icon = icons[i] ?? KeyRound;
            return (
              <article key={m.title} className="mp2-login-card">
                <Icon className="h-6 w-6" />
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Comparison: MoPlayer Classic vs MoPlayer Pro */}
      <section className="mp2-section">
        <div className="mp2-section-head">
          <span className="mp2-badge"><Star className="h-4 w-4" /> {isAr ? "الفرق" : "Compare"}</span>
          <h2>{c.compareTitle}</h2>
          <p>{c.compareSub}</p>
        </div>
        <div className="mp2-compare-grid">
          <div className="mp2-compare-old">
            <div className="mp2-compare-card">
              <h3>{c.compareOld}</h3>
              <ul>
                {c.compareOldPoints.map((p) => (
                  <li key={p}><CheckCircle2 className="h-4 w-4" /> {p}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mp2-compare-new">
            <div className="mp2-compare-card">
              <h3>{c.compareNew}</h3>
              <ul>
                {c.compareNewPoints.map((p) => (
                  <li key={p}><Sparkles className="h-4 w-4" /> {p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Device support ── */}
      <section className="mp2-section">
        <div className="mp2-section-head">
          <span className="mp2-badge"><Smartphone className="h-4 w-4" /> {isAr ? "الأجهزة" : "Devices"}</span>
          <h2>{c.devicesTitle}</h2>
          <p>{c.devicesSub}</p>
        </div>
        <div className="mp2-device-grid">
          {c.devices.map((d) => {
            const icons: Record<string, React.ElementType> = { tv: Tv2, phone: Smartphone, monitor: MonitorPlay };
            const Icon = icons[d.icon] ?? Tv2;
            return (
              <article key={d.title} className="mp2-device-card">
                <Icon className="h-7 w-7" />
                <h3>{d.title}</h3>
                <p>{d.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mp2-section">
        <div className="mp2-section-head">
          <span className="mp2-badge"><Workflow className="h-4 w-4" /> {c.faqTitle}</span>
        </div>
        <div className="mp2-faq-list">
          {ecosystem.faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mp2-final">
        <span className="mp2-badge"><ShieldCheck className="h-4 w-4" /> {c.disclaimer}</span>
        <h2>{c.ctaTitle}</h2>
        <p>{c.disclaimerBody}</p>
        <div className="mp2-actions">
          {downloadHref ? (
            <a href={downloadHref} className="mp2-btn mp2-btn-primary">
              <Download className="h-4 w-4" /> {c.download}
            </a>
          ) : null}
          <Link href={activateHref} className="mp2-btn">
            <KeyRound className="h-4 w-4" /> {c.activate}
          </Link>
          <Link href={`/${locale}/support`} className="mp2-btn">
            {c.support}
          </Link>
        </div>
      </section>
    </main>
  );
}
