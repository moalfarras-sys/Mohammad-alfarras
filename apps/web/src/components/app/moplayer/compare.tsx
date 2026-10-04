import Link from "next/link";

import { cx, formatSizeOrDash, Section, SectionHead, styles } from "./parts";
import type { Lang, ReleaseFacts } from "@/lib/moplayer-release-facts";

/**
 * Honest Classic vs Pro comparison. Version, size and minimum Android come
 * from release data; the rest reflects what each app actually ships
 * (apps/moplayer-android and apps/moplayer-pro-android READMEs and release notes).
 */
export function CompareClassicPro({
  classic,
  pro,
  locale,
  current,
}: {
  classic: ReleaseFacts;
  pro: ReleaseFacts;
  locale: Lang;
  current?: "classic" | "pro";
}) {
  const isAr = locale === "ar";
  const rows: Array<{ label: string; classic: string; pro: string }> = [
    {
      label: isAr ? "الأنسب لـ" : "Best for",
      classic: isAr ? "الصناديق القديمة والضعيفة، ومن يفضّل الواجهة الكلاسيكية" : "Older and low-power boxes, and a familiar classic layout",
      pro: isAr ? "أجهزة التلفزيون والصناديق الأحدث، ومشغّل أغنى" : "Newer TVs and boxes, and a richer player",
    },
    { label: isAr ? "أحدث إصدار" : "Latest version", classic: classic.version, pro: pro.version },
    {
      label: isAr ? "الحد الأدنى" : "Minimum",
      classic: isAr ? `أندرويد ${classic.minAndroid}` : `Android ${classic.minAndroid}`,
      pro: isAr ? `أندرويد ${pro.minAndroid}` : `Android ${pro.minAndroid}`,
    },
    { label: isAr ? "حجم الملف" : "APK size", classic: formatSizeOrDash(classic, locale), pro: formatSizeOrDash(pro, locale) },
    {
      label: isAr ? "الواجهة" : "Interface",
      classic: isAr ? "زجاج أزرق مع تركيز سماوي واضح" : "Blue glass with a clear cyan focus",
      pro: isAr ? "أُعيد بناؤها بـ Jetpack Compose بزجاج كهرماني دافئ" : "Rebuilt in Jetpack Compose, warm amber glass",
    },
    {
      label: isAr ? "المكتبة" : "Library",
      classic: isAr ? "بث مباشر مع EPG، أفلام، مسلسلات، مفضلة وبحث" : "Live TV with EPG, Movies, Series, Favorites, Search",
      pro: isAr ? "مكتبة مفهرسة ببحث سريع، متابعة المشاهدة وتشغيل الحلقة التالية" : "Indexed library with fast search, continue watching and next-episode playback",
    },
    {
      label: isAr ? "المشغّل" : "Player",
      classic: isAr ? "Media3 مع VLC احتياطياً" : "Media3 with VLC as fallback",
      pro: isAr ? "Media3 مع LibVLC احتياطياً، وتنقّل أسرع بين القنوات" : "Media3 with LibVLC fallback, faster channel zapping",
    },
    {
      label: isAr ? "المشترك بينهما" : "Both include",
      classic: isAr ? "تفعيل QR، حجم الواجهة، العربية والإنجليزية" : "QR activation, Interface size, Arabic and English",
      pro: isAr ? "تفعيل QR، حجم الواجهة، العربية والإنجليزية" : "QR activation, Interface size, Arabic and English",
    },
    {
      label: isAr ? "الهواتف" : "Phones",
      classic: isAr ? "هواتف وأجهزة لوحية بالوضع الأفقي" : "Phones and tablets in landscape",
      pro: isAr ? "تخطيطات متكيفة للهاتف والجهاز اللوحي" : "Adaptive phone and tablet layouts",
    },
  ];

  const head = (name: string, key: "classic" | "pro") => (
    <th scope="col" className={cx(current === key && "!text-white")}>
      {name}
      {current === key ? <span className="ms-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] tracking-normal text-white/80">{isAr ? "هذه الصفحة" : "This page"}</span> : null}
    </th>
  );

  return (
    <Section id="compare" labelledBy="compare-title">
      <SectionHead
        id="compare-title"
        eyebrow={isAr ? "Classic أم Pro" : "Classic or Pro"}
        title={isAr ? "تطبيقان منفصلان. اختر ما يناسب جهازك." : "Two separate apps. Pick the one that suits your TV."}
        lead={
          isAr
            ? "كلاهما مجاني ومشغّل فقط، ويُثبَّتان جنباً إلى جنب. لكل منهما ملف APK وتفعيل وتحديثات خاصة به."
            : "Both are free, both are players only, and they install side by side. Each has its own APK, activation and updates."
        }
      />
      {/* Phones: one card per app instead of a wide table. */}
      <div className="grid gap-4 md:hidden">
        {(["classic", "pro"] as const).map((key) => (
          <div key={key} className={cx(styles.panel, "p-5")}>
            <h3 className="flex items-center gap-2 text-lg font-extrabold">
              {key === "classic" ? "MoPlayer Classic" : "MoPlayer Pro"}
              {current === key ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white/80">{isAr ? "هذه الصفحة" : "This page"}</span> : null}
            </h3>
            <dl className="mt-3 grid gap-3">
              {rows.map((row) => (
                <div key={row.label} className="grid grid-cols-[38%_1fr] gap-3 border-t border-white/[0.07] pt-3 text-sm">
                  <dt className="font-bold text-white/55">{row.label}</dt>
                  <dd className="text-white/85">
                    <bdi>{row[key]}</bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <Link
              href={key === "classic" ? `/${locale}/apps/moplayer/classic` : `/${locale}/apps/moplayer2`}
              className={cx(styles.focusRing, "mt-4 inline-flex text-sm font-bold", key === "classic" ? "text-sky-300" : "text-orange-300")}
            >
              {key === "classic" ? (isAr ? "صفحة Classic" : "Classic page") : isAr ? "صفحة Pro" : "Pro page"}
            </Link>
          </div>
        ))}
      </div>
      <div className={cx(styles.panel, "hidden overflow-x-auto md:block", styles.reveal)}>
        <table className={cx(styles.compare, "min-w-[640px]")}>
          <caption className="sr-only">{isAr ? "مقارنة MoPlayer Classic و MoPlayer Pro" : "MoPlayer Classic compared with MoPlayer Pro"}</caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">{isAr ? "الميزة" : "Feature"}</span>
              </th>
              {head("MoPlayer Classic", "classic")}
              {head("MoPlayer Pro", "pro")}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td className="text-white/85">
                  <bdi>{row.classic}</bdi>
                </td>
                <td className="text-white/85">
                  <bdi>{row.pro}</bdi>
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">
                <span className="sr-only">{isAr ? "روابط" : "Links"}</span>
              </th>
              <td>
                <Link href={`/${locale}/apps/moplayer/classic`} className={cx(styles.focusRing, "font-bold text-sky-300 hover:underline")}>
                  {isAr ? "صفحة Classic" : "Classic page"}
                </Link>
              </td>
              <td>
                <Link href={`/${locale}/apps/moplayer2`} className={cx(styles.focusRing, "font-bold text-orange-300 hover:underline")}>
                  {isAr ? "صفحة Pro" : "Pro page"}
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Section>
  );
}
