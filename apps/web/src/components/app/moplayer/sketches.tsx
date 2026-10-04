import { CircleAlert } from "lucide-react";

import { cx, styles } from "./parts";
import type { Lang } from "@/lib/moplayer-release-facts";

/*
 * Simple drawn illustrations for features that a single screenshot cannot
 * show (the same layout on three screens, the mirrored Arabic layout, the
 * error messages). They are labelled as illustrations for screen readers and
 * use the app's real labels; they never pretend to be screenshots.
 */

function MiniTv({ label, width }: { label: string; width: string }) {
  return (
    <div style={{ width }} className="flex flex-col items-center gap-2">
      <div className={cx(styles.miniTv, "w-full")}>
        <div className={styles.miniScreen}>
          <div className={styles.miniSide}>
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className={styles.miniGrid}>
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} />
            ))}
          </div>
        </div>
      </div>
      <span className={cx(styles.code, "text-xs font-bold text-white/60")}>{label}</span>
    </div>
  );
}

export function InterfaceSizeSketch({ locale }: { locale: Lang }) {
  const isAr = locale === "ar";
  return (
    <figure
      className={cx(styles.sketch, "p-6 md:p-10")}
      role="img"
      aria-label={
        isAr
          ? "رسم توضيحي: التخطيط نفسه على صندوق 720p وتلفزيون 1080p وتلفزيون 4K، مع خيار حجم الواجهة"
          : "Illustration: the same layout on a 720p box, a 1080p TV and a 4K TV, with the Interface size option"
      }
    >
      <div className="flex items-end justify-center gap-[4%]" dir="ltr">
        <MiniTv label="720p" width="26%" />
        <MiniTv label="1080p" width="32%" />
        <MiniTv label="4K" width="38%" />
      </div>
      <div className="mt-8 flex flex-col items-center gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">
          {isAr ? "الإعدادات › الواجهة › حجم الواجهة" : "Settings › Interface › Interface size"}
        </span>
        <div className={styles.segmented} aria-hidden>
          <span>{isAr ? "مضغوط" : "Compact"}</span>
          <span className={styles.segOn}>{isAr ? "قياسي" : "Standard"}</span>
          <span>{isAr ? "كبير" : "Large"}</span>
        </div>
      </div>
    </figure>
  );
}

export function LanguageSketch({ locale }: { locale: Lang }) {
  const isAr = locale === "ar";
  return (
    <figure
      className={cx(styles.sketch, "grid gap-4 p-6 sm:grid-cols-2 md:p-8")}
      role="img"
      aria-label={
        isAr
          ? "رسم توضيحي: قائمة الإعدادات بالإنجليزية من اليسار إلى اليمين وبالعربية من اليمين إلى اليسار"
          : "Illustration: the Settings menu in English left to right and in Arabic right to left"
      }
    >
      <div className={styles.langPanel} dir="ltr" lang="en">
        <ul aria-hidden>
          <li>Server</li>
          <li>Player</li>
          <li className={styles.langOn}>Interface</li>
          <li>App update</li>
        </ul>
        <div className="grid content-start gap-2" aria-hidden>
          <strong className="text-sm text-white">Language</strong>
          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">Device</span>
          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">English</span>
          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">العربية</span>
        </div>
      </div>
      <div className={styles.langPanel} dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic), sans-serif" }}>
        <ul aria-hidden>
          <li>إدارة السيرفر</li>
          <li>إعدادات المشغّل</li>
          <li className={styles.langOn}>إعدادات الواجهة</li>
          <li>تحديث التطبيق</li>
        </ul>
        <div className="grid content-start gap-2" aria-hidden>
          <strong className="text-sm text-white">اللغة</strong>
          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">لغة الجهاز</span>
          <span className="rounded-lg bg-white/5 px-3 py-2 text-white/70">English</span>
          <span className="rounded-lg bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] px-3 py-2 text-white">العربية</span>
        </div>
      </div>
    </figure>
  );
}

export function ErrorMessagesSketch({ locale }: { locale: Lang }) {
  const isAr = locale === "ar";
  const lines = isAr
    ? ["تغيّرت كلمة المرور", "انتهى الاشتراك", "الخط مستخدم على جهاز آخر"]
    : ["The password was changed", "The subscription has expired", "The line is in use on another device"];
  return (
    <div className={cx(styles.alertCard, "mt-4")} role="img" aria-label={isAr ? "رسم توضيحي لرسائل الخطأ" : "Illustration of the error messages"}>
      <div className="flex items-center gap-2 text-sm font-extrabold text-amber-200" aria-hidden>
        <CircleAlert className="h-4 w-4" />
        {isAr ? "لا يمكن فتح القناة" : "This channel won’t open"}
      </div>
      <ul className="mt-2 grid gap-1 text-[13px] text-amber-50/80" aria-hidden>
        {lines.map((line) => (
          <li key={line}>• {line}</li>
        ))}
      </ul>
    </div>
  );
}
