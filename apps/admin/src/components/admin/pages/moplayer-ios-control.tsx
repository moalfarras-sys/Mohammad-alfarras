"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  Save,
  Search,
  Smartphone,
  UploadCloud,
  X,
} from "lucide-react";

import { saveIosRuntimeConfigAction } from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { Field, PageHeader, SelectField, StatCard, TextAreaField, Toggle } from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import type { WebsiteMediaAsset } from "@/lib/website-cms";
import type { AdminAppData } from "@/types/app-ecosystem";

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");
const fallbackImage = "/images/moplayer-pro-home.webp";
const fallbackStore = "/en/apps/moplayer-ios#app-store-coming-soon";
const fallbackActivation = "/en/activate?product=moplayer2&platform=ios";

export function MoPlayerIosControl({
  pro,
  mediaAssets,
  updated,
}: {
  pro: AdminAppData;
  mediaAssets: WebsiteMediaAsset[];
  updated?: string;
}) {
  const { t } = useLocale();
  const ios = pro.runtimeConfig.ios ?? {};
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const selectedAsset = useMemo(() => mediaAssets.find((asset) => asset.id === selectedMediaId), [mediaAssets, selectedMediaId]);
  const previewImage = selectedAsset?.path || ios.heroImageUrl || fallbackImage;

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow="moplayer2 · ios"
        title="MoPlayer iOS"
        subtitle={t({
          en: "Dedicated iPhone public page controls. This does not edit MoPlayer Pro Android screens; it only changes the iOS page/card and its store/activation links.",
          ar: "تحكم مخصص بصفحة iPhone العامة. هذا لا يعدل شاشات MoPlayer Pro أندرويد؛ فقط صفحة/بطاقة iOS وروابط المتجر والتفعيل.",
        })}
        icon={<Smartphone className="h-7 w-7" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/moplayer" className="btn btn-sm">
              {t({ en: "Suite", ar: "كل النسخ" })}
            </Link>
            <Link href={`${webBaseUrl}/en/apps/moplayer-ios`} target="_blank" className="btn btn-sm">
              <ExternalLink className="h-4 w-4" />
              {t({ en: "Public iOS page", ar: "صفحة iOS العامة" })}
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t({ en: "Visibility", ar: "الظهور" })} value={ios.enabled === false ? t({ en: "Hidden", ar: "مخفي" }) : t({ en: "Visible", ar: "ظاهر" })} icon={<BadgeCheck className="h-5 w-5" />} tone={ios.enabled === false ? "warning" : "success"} />
        <StatCard label={t({ en: "Status", ar: "الحالة" })} value={String(ios.status ?? "coming_soon")} icon={<Smartphone className="h-5 w-5" />} tone="warning" />
        <StatCard label={t({ en: "Store button", ar: "زر المتجر" })} value={ios.buttonLabel || "App Store soon"} icon={<ExternalLink className="h-5 w-5" />} />
        <StatCard label={t({ en: "Media library", ar: "مكتبة الصور" })} value={mediaAssets.length.toLocaleString()} icon={<ImageIcon className="h-5 w-5" />} tone="violet" />
      </section>

      <form id="ios-runtime" action={saveIosRuntimeConfigAction} className="grid gap-5 lg:grid-cols-[1fr_0.92fr]">
        <section className="rounded-[24px] border border-[var(--line-strong)] bg-white/[0.025] p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] text-[var(--accent)]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[var(--text-1)]">{t({ en: "Publishing and activation", ar: "النشر والتفعيل" })}</h2>
              <p className="text-xs leading-5 text-[var(--text-3)]">{t({ en: "Real values saved to moplayer2_public_config.ios.", ar: "قيم حقيقية تحفظ داخل moplayer2_public_config.ios." })}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Toggle
              name="iosEnabled"
              label={t({ en: "Show iOS on public site", ar: "إظهار iOS في الموقع" })}
              description={t({ en: "Controls the iOS card on the MoPlayer hub and the standalone iOS page.", ar: "يتحكم ببطاقة iOS في بوابة MoPlayer وبالصفحة المستقلة." })}
              checked={ios.enabled !== false}
            />
            <SelectField
              label={t({ en: "Publishing status", ar: "حالة النشر" })}
              name="iosStatus"
              defaultValue={ios.status ?? "coming_soon"}
              options={[
                { value: "coming_soon", label: t({ en: "Coming soon / temporary link", ar: "قريباً / رابط مؤقت" }) },
                { value: "testflight", label: t({ en: "TestFlight testing", ar: "اختبار TestFlight" }) },
                { value: "app_store", label: t({ en: "Live on App Store", ar: "منشور على App Store" }) },
              ]}
            />
            <Field
              label={t({ en: "App Store or temporary URL", ar: "رابط App Store أو الرابط المؤقت" })}
              name="iosStoreUrl"
              defaultValue={ios.storeUrl ?? fallbackStore}
              placeholder="https://apps.apple.com/app/..."
            />
            <Field
              label={t({ en: "QR activation URL", ar: "رابط تفعيل QR" })}
              name="iosActivationUrl"
              defaultValue={ios.activationUrl ?? fallbackActivation}
            />
            <Field
              label={t({ en: "Store button label", ar: "نص زر المتجر" })}
              name="iosButtonLabel"
              defaultValue={ios.buttonLabel ?? t({ en: "App Store soon", ar: "App Store قريباً" })}
            />
            <Field
              label={t({ en: "Fallback image URL", ar: "رابط الصورة الاحتياطي" })}
              name="iosHeroImageUrl"
              defaultValue={ios.heroImageUrl ?? fallbackImage}
            />
            <div className="md:col-span-2">
              <TextAreaField
                label={t({ en: "Public note", ar: "ملاحظة عامة" })}
                name="iosNote"
                defaultValue={ios.note ?? "Temporary public page link until the App Store listing is live."}
                rows={4}
              />
            </div>
          </div>
        </section>

        <section id="ios-images" className="rounded-[24px] border border-orange-300/20 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_44%),rgba(255,255,255,0.025)] p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-300/10 text-orange-200">
              <ImageIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-[var(--text-1)]">{t({ en: "iOS preview image", ar: "صورة معاينة iOS" })}</h2>
              <p className="text-xs leading-5 text-[var(--text-3)]">{t({ en: "Choose from the media library or upload directly from your device.", ar: "اختر من مكتبة الصور أو ارفع مباشرة من جهازك." })}</p>
            </div>
          </div>

          <input type="hidden" name="iosHeroImageMediaId" value={selectedMediaId} />
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-black/25">
            <div className="aspect-[4/3]">
              <SafeImage src={previewImage} alt="MoPlayer iOS preview" className="h-full w-full object-cover" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <MediaChooser assets={mediaAssets} selectedId={selectedMediaId} setSelectedId={setSelectedMediaId} />
            {selectedMediaId ? (
              <button type="button" onClick={() => setSelectedMediaId("")} className="btn btn-sm">
                <X className="h-4 w-4" />
                {t({ en: "Clear library choice", ar: "إلغاء اختيار المكتبة" })}
              </button>
            ) : null}
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed border-orange-300/25 bg-orange-300/[0.055] px-4 py-3">
            <span>
              <span className="block text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">{t({ en: "Upload from device", ar: "رفع من الجهاز" })}</span>
              <span className="mt-1 block text-xs leading-5 text-[var(--text-3)]">{t({ en: "A new image is uploaded to site-media and used on the iOS page.", ar: "ترفع صورة جديدة إلى site-media وتستخدم في صفحة iOS." })}</span>
            </span>
            <UploadCloud className="h-5 w-5 text-orange-200" />
            <input type="file" name="iosHeroImageFile" accept="image/*" className="sr-only" />
          </label>
        </section>

        <div className="lg:col-span-2 flex flex-wrap gap-2">
          <button type="submit" className="btn btn-primary">
            <Save className="h-4 w-4" />
            {t({ en: "Save iOS controls", ar: "حفظ تحكم iOS" })}
          </button>
          <Link href={`${webBaseUrl}/en/apps/moplayer-ios`} target="_blank" className="btn">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open live page", ar: "فتح الصفحة الحية" })}
          </Link>
        </div>
      </form>
    </>
  );
}

function MediaChooser({
  assets,
  selectedId,
  setSelectedId,
}: {
  assets: WebsiteMediaAsset[];
  selectedId: string;
  setSelectedId: (value: string) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = assets.filter((asset) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [asset.id, asset.path, asset.alt_ar, asset.alt_en, asset.type].some((value) => String(value ?? "").toLowerCase().includes(q));
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-sm btn-primary">
        <ImageIcon className="h-4 w-4" />
        {t({ en: "Choose from library", ar: "اختيار من المكتبة" })}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={() => setOpen(false)}>
          <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[var(--line-strong)] bg-[var(--panel-2)] shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] p-4">
              <div>
                <p className="text-sm font-black text-[var(--text-1)]">{t({ en: "Media library", ar: "مكتبة الصور" })}</p>
                <p className="text-xs text-[var(--text-3)]">{filtered.length} {t({ en: "images", ar: "صورة" })}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="btn btn-sm" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 border-b border-[var(--line)] p-3">
              <Search className="h-4 w-4 text-[var(--accent)]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 flex-1 bg-transparent text-sm outline-none" placeholder={t({ en: "Search images...", ar: "ابحث في الصور..." })} />
            </div>
            <div className="grid flex-1 gap-3 overflow-y-auto p-4 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(asset.id);
                    setOpen(false);
                  }}
                  className={`rounded-2xl border p-2 text-start transition ${selectedId === asset.id ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"}`}
                >
                  <div className="overflow-hidden rounded-xl bg-black/25">
                    <div className="aspect-video">
                      <SafeImage src={asset.path} alt={asset.alt_en || asset.id} className="h-full w-full object-cover" />
                    </div>
                  </div>
                  <p className="mt-2 truncate text-[10px] font-bold text-[var(--text-3)]">{asset.alt_en || asset.alt_ar || asset.id}</p>
                </button>
              ))}
              {!filtered.length ? <p className="text-sm text-[var(--text-3)]">{t({ en: "No images found.", ar: "لا توجد صور." })}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SafeImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const imageSrc = resolveAdminAssetUrl(src);
  if (!imageSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black/30 text-xs font-black text-[var(--text-3)]">
        {alt}
      </div>
    );
  }
  return <img src={imageSrc} alt={alt} className={className} />;
}
