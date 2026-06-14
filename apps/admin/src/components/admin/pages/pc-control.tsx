"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  HardDrive,
  Monitor,
  Package,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { saveWindowsReleaseAction } from "@/app/actions";
import { useLocale } from "@/components/admin/locale-provider";
import { CopyButton, Field, PageHeader, StatCard, TextAreaField, Toggle } from "@/components/admin/ui";
import { UpdatedToast } from "@/components/admin/updated-toast";

const webBaseUrl = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");

function formatBytes(size?: number | null) {
  if (!size) return "—";
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function PcControl({ windowsRelease, updated }: { windowsRelease: Record<string, unknown>; updated?: string }) {
  const { t } = useLocale();
  const win = windowsRelease ?? {};
  const ws = (k: string) => (typeof win[k] === "string" ? (win[k] as string) : "");
  const wn = (k: string) => (typeof win[k] === "number" ? (win[k] as number) : undefined);
  const maintenance = win.maintenance === true;

  const version = ws("version");
  const installerSet = Boolean(ws("downloadUrl") || ws("file"));
  const portableSet = Boolean(ws("portableDownloadUrl") || ws("portableFile"));

  return (
    <>
      <UpdatedToast code={updated} />
      <PageHeader
        eyebrow="moplayer-pc · windows"
        title={t({ en: "MoPlayer PC", ar: "MoPlayer PC" })}
        subtitle={t({
          en: "A standalone product. Everything here controls only the Windows desktop app: version, installer and portable downloads, system requirements, and maintenance. It does not touch Classic or Pro.",
          ar: "منتج مستقل بذاته. كل شيء هنا يخص تطبيق ويندوز للكمبيوتر فقط: الإصدار، روابط المثبت والنسخة المحمولة، متطلبات النظام، والصيانة. لا يلمس Classic ولا Pro.",
        })}
        icon={<Monitor className="h-7 w-7" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`${webBaseUrl}/en/apps/moplayer-pc`} target="_blank" className="btn btn-sm">
              <ExternalLink className="h-4 w-4" />
              {t({ en: "Public page", ar: "الصفحة العامة" })}
            </Link>
            <Link href={`${webBaseUrl}/api/app/download/latest?product=moplayer2&platform=windows`} target="_blank" className="btn btn-sm">
              <Download className="h-4 w-4" />
              {t({ en: "Windows setup", ar: "مثبت Windows" })}
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label={t({ en: "Version", ar: "الإصدار" })}
          value={version ? `v${version}` : t({ en: "Static file", ar: "ملف ثابت" })}
          icon={<Package className="h-5 w-5" />}
          tone="violet"
        />
        <StatCard
          label={t({ en: "Status", ar: "الحالة" })}
          value={maintenance ? t({ en: "Maintenance", ar: "صيانة" }) : t({ en: "Online", ar: "يعمل" })}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone={maintenance ? "warning" : "success"}
        />
        <StatCard
          label={t({ en: "Installer", ar: "المثبت" })}
          value={installerSet ? t({ en: "Set", ar: "مضبوط" }) : t({ en: "Missing", ar: "ناقص" })}
          icon={<UploadCloud className="h-5 w-5" />}
        />
        <StatCard
          label={t({ en: "Portable", ar: "المحمولة" })}
          value={portableSet ? t({ en: "Set", ar: "مضبوطة" }) : t({ en: "Optional", ar: "اختياري" })}
          icon={<HardDrive className="h-5 w-5" />}
          tone="success"
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <GuideCard
          icon={<Monitor className="h-5 w-5" />}
          title={t({ en: "This product only", ar: "هذا المنتج فقط" })}
          body={t({
            en: "MoPlayer PC is the Windows desktop app. It has its own download links and version, separate from the Android Classic and Pro apps.",
            ar: "MoPlayer PC هو تطبيق ويندوز للكمبيوتر. له روابط تحميل وإصدار خاصة به، منفصلة تماماً عن تطبيقي أندرويد Classic وPro.",
          })}
        />
        <GuideCard
          icon={<UploadCloud className="h-5 w-5" />}
          title={t({ en: "How PC updates work", ar: "كيف يُحدَّث تطبيق PC" })}
          body={t({
            en: "These values drive both the public MoPlayer PC page and the Download button. Empty fields keep their current value — nothing is wiped.",
            ar: "هذه القيم تتحكم بصفحة MoPlayer PC العامة وبزر التحميل معاً. الحقول الفارغة تبقى على قيمتها الحالية — لا يُمسح شيء.",
          })}
        />
        <GuideCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title={t({ en: "Maintenance", ar: "الصيانة" })}
          body={t({
            en: "Turn on maintenance to tell PC visitors an update is in progress. The page stays up but the download is paused with a notice.",
            ar: "فعّل الصيانة لإخبار زوار PC بأن هناك تحديثاً جارياً. الصفحة تبقى ظاهرة لكن التحميل يتوقف مع إشعار.",
          })}
        />
      </section>

      {(installerSet || portableSet) && (
        <section className="glass fade-up rounded-[24px] p-5">
          <h2 className="mb-1 text-xl font-black text-[var(--text-1)]">{t({ en: "Current live download", ar: "التحميل الحالي المباشر" })}</h2>
          <p className="mb-4 text-xs leading-6 text-[var(--text-3)]">
            {t({ en: "What visitors get right now from the public page.", ar: "ما يحصل عليه الزائر الآن من الصفحة العامة." })}
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <DownloadRow
              label={t({ en: "Installer (.exe)", ar: "المثبت (.exe)" })}
              file={ws("file")}
              url={ws("downloadUrl")}
              size={formatBytes(wn("fileSizeBytes"))}
            />
            <DownloadRow
              label={t({ en: "Portable (.exe)", ar: "المحمولة (.exe)" })}
              file={ws("portableFile")}
              url={ws("portableDownloadUrl")}
              size={formatBytes(wn("portableFileSizeBytes"))}
            />
          </div>
        </section>
      )}

      <section className="glass fade-up rounded-[24px] p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-[var(--accent)]" />
          <h2 className="text-xl font-black text-[var(--text-1)]">{t({ en: "Windows release", ar: "إصدار ويندوز" })}</h2>
        </div>
        <form action={saveWindowsReleaseAction} className="grid gap-5 lg:grid-cols-2">
          <div className="grid gap-3 lg:col-span-2">
            <Toggle
              name="maintenance"
              label={t({ en: "PC maintenance mode", ar: "وضع صيانة PC" })}
              description={t({ en: "Shows a maintenance notice on the MoPlayer PC page and pauses the download.", ar: "يعرض إشعار صيانة على صفحة MoPlayer PC ويوقف التحميل مؤقتاً." })}
              checked={maintenance}
            />
          </div>
          <Field label={t({ en: "Version", ar: "الإصدار" })} name="version" defaultValue={ws("version")} placeholder="1.0.2" help={t({ en: "Human version like 1.0.2.", ar: "رقم النسخة مثل 1.0.2." })} />
          <Field label={t({ en: "Release date", ar: "تاريخ الإصدار" })} name="releaseDate" defaultValue={ws("releaseDate")} placeholder="2026-06-14" />
          <Field label={t({ en: "Installer file name", ar: "اسم ملف المثبت" })} name="file" defaultValue={ws("file")} placeholder="MoPlayer-PC-Setup.exe" />
          <Field label={t({ en: "Installer download URL (https)", ar: "رابط تحميل المثبت (https)" })} name="downloadUrl" defaultValue={ws("downloadUrl")} placeholder="https://github.com/.../MoPlayer-PC-Setup.exe" help={t({ en: "Public https link, e.g. GitHub Releases.", ar: "رابط https عام، مثل GitHub Releases." })} />
          <Field label={t({ en: "Installer size (bytes)", ar: "حجم المثبت (بايت)" })} name="fileSizeBytes" type="number" defaultValue={wn("fileSizeBytes") ? String(wn("fileSizeBytes")) : ""} />
          <Field label={t({ en: "Installer SHA-256", ar: "بصمة المثبت SHA-256" })} name="sha256" defaultValue={ws("sha256")} />
          <Field label={t({ en: "Portable file name", ar: "اسم النسخة المحمولة" })} name="portableFile" defaultValue={ws("portableFile")} placeholder="MoPlayer-PC-Portable.exe" />
          <Field label={t({ en: "Portable download URL (https)", ar: "رابط النسخة المحمولة (https)" })} name="portableDownloadUrl" defaultValue={ws("portableDownloadUrl")} />
          <Field label={t({ en: "Portable size (bytes)", ar: "حجم المحمولة (بايت)" })} name="portableFileSizeBytes" type="number" defaultValue={wn("portableFileSizeBytes") ? String(wn("portableFileSizeBytes")) : ""} />
          <Field label={t({ en: "Portable SHA-256", ar: "بصمة المحمولة SHA-256" })} name="portableSha256" defaultValue={ws("portableSha256")} />
          <Field label={t({ en: "System requirements", ar: "متطلبات النظام" })} name="systemRequirements" defaultValue={ws("systemRequirements")} placeholder="Windows 10/11 64-bit" />
          <TextAreaField label={t({ en: "Release notes", ar: "ملاحظات الإصدار" })} name="notes" defaultValue={ws("notes")} />
          <div className="lg:col-span-2">
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 className="h-4 w-4" />
              {t({ en: "Save MoPlayer PC release", ar: "حفظ إصدار MoPlayer PC" })}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function GuideCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(99,102,241,0.04))] p-4">
      <div className="mb-2 flex items-center gap-2 text-[var(--accent)]">{icon}</div>
      <p className="text-sm font-black text-[var(--text-1)]">{title}</p>
      <p className="mt-1 text-xs leading-6 text-[var(--text-3)]">{body}</p>
    </div>
  );
}

function DownloadRow({ label, file, url, size }: { label: string; file: string; url: string; size: string }) {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-[var(--text-1)]">{label}</p>
        <span className="badge">{size}</span>
      </div>
      <p className="truncate font-mono text-xs text-[var(--text-2)]">{file || t({ en: "Not set", ar: "غير مضبوط" })}</p>
      {url ? (
        <div className="mt-3 flex items-center gap-2">
          <CopyButton value={url} label={t({ en: "Copy link", ar: "نسخ الرابط" })} />
          <Link href={url} target="_blank" className="btn btn-sm">
            <ExternalLink className="h-4 w-4" />
            {t({ en: "Open", ar: "فتح" })}
          </Link>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--text-3)]">{t({ en: "No public link yet.", ar: "لا يوجد رابط عام بعد." })}</p>
      )}
    </div>
  );
}
