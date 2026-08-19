"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Cloud,
  Copy,
  Cpu,
  Disc3,
  Download,
  GitBranch,
  Layers,
  Monitor,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/types/cms";
import type { MoosRelease } from "@/lib/moos-release";

const fade = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 78, damping: 18 } },
};

function formatBytes(size?: number | null) {
  if (!size || size <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function CopyCommand({ command, label }: { command: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="group relative flex items-stretch gap-2 rounded-2xl border border-[#4ED7C8]/20 bg-[#0c1416]/80 p-1.5 pl-4 backdrop-blur-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3 py-2">
        <Terminal className="h-4 w-4 shrink-0 text-[#4ED7C8]/70" aria-hidden />
        <code dir="ltr" className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[13px] text-[#cfeee9] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {command}
        </code>
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(command).then(
            () => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            },
            () => undefined,
          );
        }}
        aria-label={label}
        className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#4ED7C8]/25 bg-[#4ED7C8]/10 px-3 text-xs font-bold text-[#A8F1E8] transition-colors hover:bg-[#4ED7C8]/20"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{copied ? (label.includes("نسخ") ? "تم النسخ" : "Copied") : label}</span>
      </button>
    </div>
  );
}

export function MoosLanding({ locale, release }: { locale: Locale; release: MoosRelease | null }) {
  const isAr = locale === "ar";
  const repoUrl = release?.repoUrl ?? "https://github.com/moalfarras-sys/moos-image";
  const signingKeyUrl =
    release?.signingKeyUrl ?? "https://raw.githubusercontent.com/moalfarras-sys/moos-image/main/cosign.pub";
  const editions = release?.editions ?? [];
  const desktopImage = editions.find((e) => e.id === "desktop")?.image ?? "ghcr.io/moalfarras-sys/moos:latest";
  const cloudImage = editions.find((e) => e.id === "cloud")?.image ?? "ghcr.io/moalfarras-sys/moos-cloud:latest";
  const isoReady = Boolean(release?.iso.available && release.iso.url);
  const maintenance = Boolean(release?.maintenance);

  const t = isAr
    ? {
        badge: "نظام تشغيل حقيقي",
        title: "MoOS",
        tagline: "نظام تشغيل شخصي للكمبيوتر — مبني على Fedora Atomic و KDE Plasma 6، بتحديثات موقّعة لا تنكسر، وعربية أصيلة من الجذر.",
        base: release?.base ?? "Fedora Atomic (bootc) · KDE Plasma 6",
        getIt: "ثبّت MoOS الآن",
        viewRepo: "المصدر على GitHub",
        isoBtnReady: "تحميل ISO للـ USB",
        isoBtnPending: "ISO للـ USB — قريباً",
        whatTitle: "نظام يحدّث نفسه بأمان، ولا يتعطّل",
        whatBody: "MoOS ليس توزيعة عادية — كل صورة تُبنى وتُوقَّع آلياً وتُدفع إلى السجل، وجهازك يسحب التحديث الموقّع ويطبّقه عند إعادة التشغيل. إن حدث خطأ، تعود للإصدار السابق بأمر واحد.",
        features: [
          { icon: ShieldCheck, title: "ذرّي وموقّع", body: "نظام صور (OSTree) للقراءة فقط؛ التحديثات متحقَّقة بـ cosign، والتراجع فوري عبر GRUB أو bootc rollback." },
          { icon: Monitor, title: "KDE Plasma 6 · Wayland", body: "سطح مكتب زجاجي أنيق (MoOS UI · Liquid Glass)، عائلة ثيمات كاملة، ودعم 4K/HiDPI من الدرجة الأولى." },
          { icon: Sparkles, title: "تطبيقات MoOS مدمجة", body: "Mo AI ومتجر Mo Store و MoPlayer و Mo PC Remote مبنية داخل الصورة — جاهزة من أول إقلاع." },
          { icon: Layers, title: "عربية و RTL أصيلة", body: "العربية وواجهات RTL أهداف من الدرجة الأولى في نظام التصميم، لا ترجمة لاحقة." },
        ],
        editionsTitle: "اختر نسختك",
        editionsBody: "كل نسخة تُبنى من نفس الشجرة ونفس مفتاح التوقيع، وتأخذ نفس قطار التحديثات.",
        recommended: "موصى به",
        installOne: "أمر واحد على جهاز Fedora Atomic (Kinoite) قائم",
        copyLabel: "نسخ",
        verifyTitle: "تحقّق قبل التبديل (اختياري لكن موصى به)",
        cloudTitle: "MoOS Cloud — على خادم يعمل ٧/٢٤",
        cloudBody: "نفس MoOS لكن على VPS رخيص، للتطوير وتشغيل Mo AI ومشاريعك — بلا جهاز حقيقي. استأجر خادم Fedora وشغّل أمراً واحداً.",
        cloudNote: "يعمل على Hetzner و Contabo و OVH و Vultr و Oracle — أي مزوّد يقدّم Fedora. الوصول عبر Tailscale + Mo PC Remote (مبنيان أصلاً).",
        updateTitle: "التحديث والتراجع",
        updateStep: "تحديث لأحدث صورة موقّعة (يُطبَّق عند إعادة التشغيل):",
        rollbackStep: "تراجع فوري لأي إصدار سابق:",
        isoTitle: "قرص USB قابل للإقلاع",
        isoPendingBody: release?.iso.notes ?? "ملف الـ ISO يُبنى عند الطلب من الصورة المنشورة، والاستضافة الدائمة قيد الإنهاء. حتى ذلك الحين، ثبّت MoOS بالأمر أعلاه — نفس النظام تماماً.",
        isoReadyBody: "اكتب الصورة على USB بـ Fedora Media Writer أو Rufus. لا تستخدم Ventoy — يكسر أقراص bootc الحية.",
        footTitle: "MoOS مفتوح ومجاني",
        footBody: "المصدر الكامل، البوابات، ومفتاح التوقيع كلها علنية. لا رسوم، لا حساب، لا تتبّع.",
      }
    : {
        badge: "A real operating system",
        title: "MoOS",
        tagline: "A personal desktop OS — built on Fedora Atomic and KDE Plasma 6, with signed updates that don't break, and Arabic as a first-class citizen from the root.",
        base: release?.base ?? "Fedora Atomic (bootc) · KDE Plasma 6",
        getIt: "Install MoOS now",
        viewRepo: "Source on GitHub",
        isoBtnReady: "Download USB ISO",
        isoBtnPending: "USB ISO — coming soon",
        whatTitle: "An OS that updates itself safely, and won't break",
        whatBody: "MoOS isn't an ordinary distro — every image is built and signed automatically and pushed to a registry, and your machine pulls the signed update and applies it on reboot. If anything goes wrong, you roll back with one command.",
        features: [
          { icon: ShieldCheck, title: "Atomic & signed", body: "A read-only image system (OSTree); updates are cosign-verified, and rollback is instant via GRUB or bootc rollback." },
          { icon: Monitor, title: "KDE Plasma 6 · Wayland", body: "An elegant glass desktop (MoOS UI · Liquid Glass), a full theme family, and first-class 4K/HiDPI support." },
          { icon: Sparkles, title: "MoOS apps built in", body: "Mo AI, Mo Store, MoPlayer and Mo PC Remote are built into the image — ready from first boot." },
          { icon: Layers, title: "Arabic & RTL native", body: "Arabic and RTL are first-class targets of the design system, not an afterthought translation." },
        ],
        editionsTitle: "Pick your edition",
        editionsBody: "Each edition builds from the same tree and the same signing key, and rides the same update train.",
        recommended: "Recommended",
        installOne: "One command on an existing Fedora Atomic (Kinoite) machine",
        copyLabel: "Copy",
        verifyTitle: "Verify before you switch (optional, recommended)",
        cloudTitle: "MoOS Cloud — on a 24/7 server",
        cloudBody: "The same MoOS on a cheap VPS, for development, running Mo AI, and your own projects — with no physical machine. Rent a Fedora server and run one command.",
        cloudNote: "Works on Hetzner, Contabo, OVH, Vultr, Oracle — any provider that offers Fedora. Reach it over Tailscale + Mo PC Remote (both built in).",
        updateTitle: "Updates & rollback",
        updateStep: "Update to the latest signed image (applied on reboot):",
        rollbackStep: "Instantly roll back to any previous version:",
        isoTitle: "Bootable USB disc",
        isoPendingBody: release?.iso.notes ?? "The ISO is built on request from the published image, and permanent hosting is being finalized. Until then, install MoOS with the command above — it's exactly the same system.",
        isoReadyBody: "Write the image to a USB with Fedora Media Writer or Rufus. Do not use Ventoy — it breaks bootc live discs.",
        footTitle: "MoOS is open and free",
        footBody: "The full source, the build gates, and the signing key are all public. No fees, no account, no tracking.",
      };

  const editionMeta: Record<string, { icon: typeof Cpu; command: string }> = {
    desktop: { icon: Monitor, command: `sudo bootc switch ${desktopImage} && sudo systemctl reboot` },
    nvidia: {
      icon: Cpu,
      command: `sudo bootc switch ${editions.find((e) => e.id === "nvidia")?.image ?? "ghcr.io/moalfarras-sys/moos-nvidia:latest"} && sudo systemctl reboot`,
    },
    cloud: { icon: Cloud, command: `sudo dnf install -y system-reinstall-bootc && sudo system-reinstall-bootc ${cloudImage} && sudo reboot` },
  };

  const verifyCommand = `cosign verify --key ${signingKeyUrl} ${desktopImage}`;
  const cloudCommand = editionMeta.cloud.command;
  const updateCommand = "moai-do update";
  const rollbackCommand = "sudo bootc rollback && sudo systemctl reboot";
  const isoHref = "/api/os/download?type=iso";

  return (
    <main dir={isAr ? "rtl" : "ltr"} className="relative min-h-screen overflow-hidden bg-[#080d0f] text-white selection:bg-[#4ED7C8]/30 selection:text-[#e6fffb]">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[#080d0f]" />
        <div className="absolute inset-x-0 top-0 h-[80vh] opacity-25">
          <Image src="/images/moos/moos-wallpaper-dark.webp" alt="" fill sizes="100vw" className="object-cover object-top" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#080d0f]/70 to-[#080d0f]" />
        </div>
        <div className="absolute left-[-8%] top-[-12%] h-[42%] w-[42%] rounded-full bg-[#4ED7C8]/12 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-8%] h-[38%] w-[38%] rounded-full bg-[#78AFFF]/10 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.015] [background:radial-gradient(#ffffff_0.5px,transparent_0.5px)] [background-size:26px_26px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 pb-14 pt-24 md:grid-cols-[1.05fr_0.95fr] md:pt-28">
          <motion.div variants={fade} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#4ED7C8]/30 bg-[#4ED7C8]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#A8F1E8] backdrop-blur-sm">
              <Cpu className="h-3.5 w-3.5" /> {t.badge}
            </span>
            <h1 className="mt-5 text-6xl font-black tracking-tight sm:text-7xl">
              <span className="bg-gradient-to-br from-white via-[#cfeee9] to-[#4ED7C8]/70 bg-clip-text text-transparent">MoOS</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">{t.tagline}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-xs text-white/60" dir="ltr">
              <Layers className="h-3.5 w-3.5 text-[#4ED7C8]/70" /> {t.base}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href="#install"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4ED7C8] to-[#33b7ac] px-6 py-3 text-sm font-bold text-[#052b28] shadow-[0_10px_35px_rgba(78,215,200,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_44px_rgba(78,215,200,0.42)]"
              >
                <Terminal className="h-4 w-4" /> {t.getIt}
              </a>
              {isoReady ? (
                <a href={isoHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#4ED7C8]/25 bg-[#4ED7C8]/10 px-6 py-3 text-sm font-bold text-[#A8F1E8] transition-all hover:-translate-y-0.5 hover:bg-[#4ED7C8]/20">
                  <Download className="h-4 w-4" /> {t.isoBtnReady}
                </a>
              ) : (
                <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white/45">
                  <Disc3 className="h-4 w-4" /> {t.isoBtnPending}
                </span>
              )}
              <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white/80 transition-all hover:-translate-y-0.5 hover:border-[#4ED7C8]/30 hover:bg-white/10">
                <GitBranch className="h-4 w-4" /> {t.viewRepo}
              </a>
            </div>
          </motion.div>

          <motion.div variants={fade} initial="hidden" animate="show" className="relative">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <Image src="/images/moos/moos-desktop-dark.webp" alt={isAr ? "سطح مكتب MoOS" : "MoOS desktop"} width={1600} height={1000} className="h-auto w-full" />
            </div>
          </motion.div>
        </section>

        {maintenance ? (
          <div className="mb-10 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-center text-sm font-semibold text-amber-200">
            {isAr ? "MoOS قيد التحديث حالياً — التحميل سيعود قريباً." : "MoOS is being updated right now — downloads will return shortly."}
          </div>
        ) : null}

        {/* What is MoOS */}
        <section className="border-t border-white/10 py-14">
          <motion.h2 variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="max-w-2xl text-3xl font-black tracking-tight">
            {t.whatTitle}
          </motion.h2>
          <motion.p variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-3 max-w-2xl text-base leading-relaxed text-white/65">
            {t.whatBody}
          </motion.p>
          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            {t.features.map((f) => (
              <motion.div key={f.title} variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4ED7C8]/12 text-[#4ED7C8]">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Install / editions */}
        <section id="install" className="scroll-mt-24 border-t border-white/10 py-14">
          <motion.h2 variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-3xl font-black tracking-tight">
            {t.editionsTitle}
          </motion.h2>
          <motion.p variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-3 max-w-2xl text-base leading-relaxed text-white/65">
            {t.editionsBody}
          </motion.p>

          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {editions.map((ed) => {
              const meta = editionMeta[ed.id] ?? { icon: Monitor, command: `sudo bootc switch ${ed.image} && sudo systemctl reboot` };
              const Icon = meta.icon;
              return (
                <motion.div
                  key={ed.id}
                  variants={fade}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  className={`flex flex-col rounded-2xl border p-5 ${ed.recommended ? "border-[#4ED7C8]/40 bg-[#4ED7C8]/[0.06]" : "border-white/10 bg-white/[0.03]"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4ED7C8]/12 text-[#4ED7C8]">
                      <Icon className="h-5 w-5" />
                    </div>
                    {ed.recommended ? (
                      <span className="rounded-full border border-[#4ED7C8]/30 bg-[#4ED7C8]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#A8F1E8]">{t.recommended}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{ed.name}</h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/60">{ed.summary}</p>
                  <code dir="ltr" className="mt-4 block truncate rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] text-[#8fd8cf]">
                    {ed.image}
                  </code>
                  <div className="mt-3">
                    <CopyCommand command={meta.command} label={t.copyLabel} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Verify */}
          <motion.div variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white/85">
              <ShieldCheck className="h-4 w-4 text-[#4ED7C8]" /> {t.verifyTitle}
            </div>
            <div className="mt-3">
              <CopyCommand command={verifyCommand} label={t.copyLabel} />
            </div>
          </motion.div>
        </section>

        {/* Cloud */}
        <section className="border-t border-white/10 py-14">
          <div className="rounded-3xl border border-[#78AFFF]/20 bg-gradient-to-br from-[#78AFFF]/[0.08] to-transparent p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#78AFFF]/15 text-[#78AFFF]">
              <Cloud className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight">{t.cloudTitle}</h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/65">{t.cloudBody}</p>
            <div className="mt-5 max-w-3xl">
              <CopyCommand command={cloudCommand} label={t.copyLabel} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/45">{t.cloudNote}</p>
          </div>
        </section>

        {/* Updates & rollback */}
        <section className="border-t border-white/10 py-14">
          <motion.h2 variants={fade} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-3xl font-black tracking-tight">
            {t.updateTitle}
          </motion.h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-white/85">
                <RefreshCw className="h-4 w-4 text-[#4ED7C8]" /> {t.updateStep}
              </div>
              <div className="mt-3">
                <CopyCommand command={updateCommand} label={t.copyLabel} />
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-white/85">
                <RotateCcw className="h-4 w-4 text-[#4ED7C8]" /> {t.rollbackStep}
              </div>
              <div className="mt-3">
                <CopyCommand command={rollbackCommand} label={t.copyLabel} />
              </div>
            </div>
          </div>
        </section>

        {/* ISO */}
        <section className="border-t border-white/10 py-14">
          <div className="grid items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
              <Image src="/images/moos/moos-launcher.webp" alt={isAr ? "مشغّل تطبيقات MoOS" : "MoOS app launcher"} width={1400} height={900} className="h-auto w-full" />
            </div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4ED7C8]/12 text-[#4ED7C8]">
                <Disc3 className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-tight">{t.isoTitle}</h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-white/65">{isoReady ? t.isoReadyBody : t.isoPendingBody}</p>
              <div className="mt-5">
                {isoReady ? (
                  <a href={isoHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4ED7C8] to-[#33b7ac] px-6 py-3 text-sm font-bold text-[#052b28] shadow-[0_10px_35px_rgba(78,215,200,0.28)] transition-all hover:-translate-y-0.5">
                    <Download className="h-4 w-4" /> {t.isoBtnReady}
                    {release?.iso.sizeBytes ? <span className="opacity-70">· {formatBytes(release.iso.sizeBytes)}</span> : null}
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white/45">
                    <Disc3 className="h-4 w-4" /> {t.isoBtnPending}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="border-t border-white/10 py-14">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center sm:p-10">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{t.footTitle}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60">{t.footBody}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a href={repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#4ED7C8]/25 bg-[#4ED7C8]/10 px-5 py-2.5 text-sm font-bold text-[#A8F1E8] transition-colors hover:bg-[#4ED7C8]/20">
                <GitBranch className="h-4 w-4" /> {t.viewRepo} <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Link href={`/${locale}/apps`} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white/80 transition-colors hover:bg-white/10">
                {isAr ? "بقية التطبيقات" : "More apps"}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
