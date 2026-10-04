import type { Shot } from "./parts";

/**
 * Real in-app screenshots only. Classic shots were captured from MoPlayer
 * Classic 2.5.0 on an Android TV emulator and a phone in landscape with a
 * public, legal iptv-org news playlist. No provider posters or artwork.
 */
export const classicShots = {
  liveBrowser: {
    src: "/images/moplayer/classic-2-5/classic-2-5-live-channel-browser.webp",
    width: 1920,
    height: 1080,
    alt: {
      en: "MoPlayer Classic 2.5.0 Live TV: categories, a numbered news channel list and the preview panel on an Android TV",
      ar: "البث المباشر في MoPlayer Classic 2.5.0: الفئات وقائمة قنوات إخبارية مرقّمة ولوحة المعاينة على Android TV",
    },
  },
  homeLiveRow: {
    src: "/images/moplayer/classic-2-5/classic-2-5-home-live-row.webp",
    width: 1920,
    height: 1080,
    alt: {
      en: "MoPlayer Classic 2.5.0 Home screen with the Live TV row focused and the bottom navigation bar",
      ar: "الشاشة الرئيسية في MoPlayer Classic 2.5.0 مع صف البث المباشر وشريط التنقل السفلي",
    },
  },
  activationPhone: {
    src: "/images/moplayer/classic-2-5/classic-2-5-activation-qr-phone.webp",
    width: 1920,
    height: 864,
    alt: {
      en: "MoPlayer Classic 2.5.0 activation screen with a QR code, a short device code and the moalfarras.space/activate address",
      ar: "شاشة التفعيل في MoPlayer Classic 2.5.0 مع رمز QR ورمز جهاز قصير وعنوان moalfarras.space/activate",
    },
  },
  setupPhone: {
    src: "/images/moplayer/classic-2-5/classic-2-5-phone-landscape-setup.webp",
    width: 1920,
    height: 864,
    alt: {
      en: "MoPlayer Classic 2.5.0 on a phone in landscape: choose website activation, an Xtream source or an M3U playlist",
      ar: "MoPlayer Classic 2.5.0 على هاتف بالوضع الأفقي: اختر التفعيل عبر الموقع أو مصدر Xtream أو قائمة M3U",
    },
  },
} satisfies Record<string, Shot>;

/** Real MoPlayer Pro screens captured during QA with test streams (no provider content). */
export const proShots = {
  signIn: {
    src: "/images/apps/pro/01-login-clean.webp",
    width: 1100,
    height: 619,
    alt: {
      en: "MoPlayer Pro sign-in screen offering M3U, Xtream and QR code activation",
      ar: "شاشة الدخول في MoPlayer Pro مع خيارات M3U و Xtream والتفعيل برمز QR",
    },
  },
  liveMenu: {
    src: "/images/apps/pro/13-player-ok-overlay.webp",
    width: 1100,
    height: 619,
    alt: {
      en: "MoPlayer Pro live menu over the player with channels, groups, video size, audio, subtitles and favorites",
      ar: "قائمة البث المباشر في MoPlayer Pro فوق المشغّل مع القنوات والمجموعات وحجم الصورة والصوت والترجمة والمفضلة",
    },
  },
  liveOverVideo: {
    src: "/images/apps/pro/18-player-ok-30s.webp",
    width: 1100,
    height: 619,
    alt: {
      en: "MoPlayer Pro playing a QA test video with the live menu open",
      ar: "MoPlayer Pro يشغّل فيديو اختبار مع قائمة البث المباشر مفتوحة",
    },
  },
  search: {
    src: "/images/apps/pro/22-search.webp",
    width: 1100,
    height: 619,
    alt: {
      en: "MoPlayer Pro search screen for channels, movies, series and episodes with the on-screen keyboard",
      ar: "شاشة البحث في MoPlayer Pro عن القنوات والأفلام والمسلسلات والحلقات مع لوحة المفاتيح",
    },
  },
  settings: {
    src: "/images/apps/pro/28-settings.webp",
    width: 1100,
    height: 619,
    alt: {
      en: "MoPlayer Pro Look & Home settings with the language choice System, English or Arabic",
      ar: "إعدادات المظهر والرئيسية في MoPlayer Pro مع اختيار اللغة: النظام أو الإنجليزية أو العربية",
    },
  },
} satisfies Record<string, Shot>;

/** Real MoPlayer PC (Windows) screens without provider artwork. */
export const pcShots = {
  settings: {
    src: "/images/apps/pc/settings.webp",
    width: 1280,
    height: 673,
    alt: {
      en: "MoPlayer PC settings on Windows: sources, appearance, playback and library options",
      ar: "إعدادات MoPlayer PC على ويندوز: المصادر والمظهر والتشغيل والمكتبة",
    },
  },
  multi: {
    src: "/images/apps/pc/multi.webp",
    width: 1280,
    height: 673,
    alt: {
      en: "MoPlayer PC multi-view with four empty tiles ready for channels",
      ar: "عرض متعدد في MoPlayer PC بأربع خانات جاهزة لإضافة القنوات",
    },
  },
} satisfies Record<string, Shot>;
