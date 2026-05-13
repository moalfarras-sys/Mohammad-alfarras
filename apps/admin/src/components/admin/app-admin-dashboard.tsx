"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Smartphone, 
  Key, 
  Box, 
  UploadCloud, 
  Mail, 
  Settings2, 
  Trash2, 
  Download, 
  ExternalLink,
  Shield,
  Layout,
  CheckCircle2,
  MessageSquare,
  FileText,
  HelpCircle,
  Search,
  Copy,
  SlidersHorizontal,
} from "lucide-react";

import {
  deleteFaqAction,
  deleteReleaseAction,
  deleteScreenshotAction,
  saveFaqAction,
  saveProductAction,
  saveReleaseAction,
  saveRuntimeConfigAction,
  saveScreenshotAction,
  updateSupportRequestAction,
} from "@/app/actions";
import type {
  ActivationRequest,
  AppDevice,
  AppFaq,
  AppLicense,
  AppProduct,
  AppRelease,
  AppRuntimeConfig,
  AppScreenshot,
  AppSupportRequest,
  DeviceProviderSourceQueue,
} from "@/types/app-ecosystem";
import { resolveAdminAssetUrl } from "@/lib/asset-url";
import { cn } from "@/lib/cn";

const webBaseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space";
type SectionKey = "overview" | "runtime" | "releases" | "activations" | "devices" | "sources" | "content" | "support";
type RuntimeConfigExtras = AppRuntimeConfig & {
  widgets: AppRuntimeConfig["widgets"] & {
    weatherCity?: string;
    footballMaxMatches?: number;
  };
};

function formatBytes(size?: number | null) {
  if (!size) return "Not uploaded";
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function structuredLines(items: Array<{ title: string; body: string }>) {
  return items.map((item) => `${item.title} :: ${item.body}`).join("\n");
}

function simpleLines(items: string[]) {
  return items.join("\n");
}

function runtimeNumber(value: unknown, fallback: number) {
  const next = Number(value);
  return Number.isFinite(next) && next > 0 ? next : fallback;
}

function activationLink(productSlug: string, code?: string) {
  const params = new URLSearchParams({ product: productSlug });
  if (code) params.set("code", code);
  return `${webBaseUrl}/en/activate?${params.toString()}`;
}

// ── REUSABLE COMPONENTS ──

function Panel({
  title,
  description,
  icon,
  children,
  className
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden glass rounded-[3rem] p-8 md:p-10 border-white/5", className)}>
      <div className="mb-10 flex items-start gap-5">
        {icon && (
          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-300 border border-white/10 shadow-xl">
            {icon}
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function InputField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label>
      <input
        {...props}
        className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-sm text-white outline-none focus:border-cyan-500/50 focus:bg-cyan-500/[0.02] transition-all placeholder:text-slate-600"
      />
    </div>
  );
}

function TextAreaField({ label, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">{label}</label>
      <textarea
        {...props}
        className="w-full min-h-[120px] rounded-[2rem] bg-white/5 border border-white/10 p-6 text-sm text-white outline-none focus:border-cyan-500/50 focus:bg-cyan-500/[0.02] transition-all placeholder:text-slate-600 leading-relaxed"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isOk = ["resolved", "active", "published", "imported", "fetched"].includes(status);
  const isDanger = ["expired", "failed", "revoked", "blocked"].includes(status);
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
      isOk
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : isDanger
          ? "bg-red-500/10 text-red-300 border-red-500/20"
          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
    )}>
      {status}
    </span>
  );
}

function NativeToggle({
  name,
  label,
  description,
  checked,
  tone = "cyan",
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  tone?: "cyan" | "red" | "green";
}) {
  return (
    <label className={`admin-toggle-card admin-toggle-${tone}`}>
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" name={name} defaultChecked={checked} />
      <i aria-hidden />
    </label>
  );
}

function EmptyState({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.025] p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-500">
        {icon}
      </div>
      <p className="text-sm font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-slate-500">{body}</p>
    </div>
  );
}

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => void navigator.clipboard?.writeText(value)}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black uppercase tracking-widest text-slate-300 transition hover:border-cyan-200/30 hover:text-cyan-100"
    >
      <Copy className="mr-2 h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ── DATA CARDS ──

function ScreenshotCard({ item }: { item: AppScreenshot }) {
  const imageSrc = resolveAdminAssetUrl(item.image_path);
  return (
    <div className="group relative glass rounded-[2.5rem] p-4 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-5">
         <img src={imageSrc} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
         <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white">{item.device_frame}</span>
         </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-sm font-black text-white tracking-tight">{item.title}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">{item.image_path}</p>
        </div>
        <form action={deleteScreenshotAction}>
          <input type="hidden" name="id" value={item.id} />
          <button type="submit" className="text-red-400/50 hover:text-red-400 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ReleaseCard({ item }: { item: AppRelease }) {
  const primary = item.assets.find((asset) => asset.is_primary) ?? item.assets[0];
  const advanced = item.assets.filter((asset) => asset.id !== primary?.id);
  return (
    <div className="glass rounded-[2.5rem] p-8 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={item.is_published ? "published" : "draft"} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{new Date(item.published_at).toLocaleDateString("en-GB")}</span>
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">{item.version_name} <span className="text-slate-600 font-mono text-sm ml-2">({item.slug})</span></h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400 whitespace-pre-line max-w-2xl">{item.release_notes}</p>
          </div>
          <div className="flex flex-wrap gap-4 pt-2">
             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                {primary?.abi || "Universal"}
             </div>
             <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-300">
                {formatBytes(primary?.file_size_bytes)}
             </div>
             <div className="px-4 py-2 rounded-xl bg-emerald-400/10 border border-emerald-300/20 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                Primary TV download
             </div>
          </div>
          {advanced.length ? (
            <div className="flex flex-wrap gap-2">
              {advanced.map((asset) => (
                <span key={asset.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold text-slate-400">
                  Advanced: {asset.abi ?? "APK"} / {formatBytes(asset.file_size_bytes)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-row md:flex-col gap-3">
          <Link
            href={`${webBaseUrl}/api/app/releases/${item.slug}/download`}
            className="flex items-center justify-center h-12 px-6 rounded-2xl bg-cyan-500 text-black font-black text-[11px] uppercase tracking-widest hover:bg-cyan-400 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Link>
          <form action={deleteReleaseAction}>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="flex items-center justify-center h-12 w-12 rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all">
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SupportCard({ item }: { item: AppSupportRequest }) {
  return (
    <div className="glass rounded-[2rem] p-8 border-white/5 bg-white/[0.01]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <StatusBadge status={item.status} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{new Date(item.created_at).toLocaleString("en-GB")}</span>
          </div>
          <div>
            <h3 className="text-lg font-black text-white">{item.name}</h3>
            <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mt-1">{item.email}</p>
          </div>
          <p className="text-sm leading-relaxed text-slate-400 max-w-3xl italic">&ldquo;{item.message}&rdquo;</p>
        </div>
        <form action={updateSupportRequestAction} className="flex items-center gap-3">
          <input type="hidden" name="id" value={item.id} />
          <select
            name="status"
            defaultValue={item.status}
            className="h-12 rounded-2xl border border-white/10 bg-black/40 px-4 text-[11px] font-black uppercase tracking-widest text-white outline-none focus:border-cyan-500/50"
          >
            <option value="new">new</option>
            <option value="resolved">resolved</option>
          </select>
          <button type="submit" className="h-12 px-6 rounded-2xl bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
            Update
          </button>
        </form>
      </div>
    </div>
  );
}

function DeviceCard({ item, activationCount = 0 }: { item: AppDevice; activationCount?: number }) {
  return (
    <div className="glass rounded-3xl p-6 border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
         <StatusBadge status={item.status} />
         <span className="text-[9px] font-bold text-slate-500">{new Date(item.last_seen_at).toLocaleDateString()}</span>
      </div>
      <h3 className="font-mono text-sm font-black text-white truncate mb-4">{item.public_device_id}</h3>
      <div className="space-y-2 border-t border-white/5 pt-4">
         <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Hardware</span>
            <span className="text-slate-300 font-bold">{item.platform}</span>
         </div>
         <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">OS Version</span>
            <span className="text-slate-300 font-bold">Android {item.device_type}</span>
         </div>
         <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">App Core</span>
            <span className="text-slate-300 font-bold">v{item.app_version || "2.0.0"}</span>
         </div>
         <div className="flex justify-between text-[10px]">
            <span className="text-slate-500">Activations</span>
            <span className="text-slate-300 font-bold">{activationCount}</span>
         </div>
      </div>
    </div>
  );
}

function ProviderSourceCard({ item }: { item: DeviceProviderSourceQueue }) {
  return (
    <div className="glass rounded-[1.5rem] p-5 border-white/5 bg-white/[0.02]">
      <div className="mb-4 flex items-center justify-between gap-3">
         <StatusBadge status={item.status} />
         <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.sourceType}</span>
      </div>
      <h3 className="text-sm font-black text-white truncate">{item.displayName || "MoPlayer source"}</h3>
      <p className="mt-2 font-mono text-[10px] text-slate-500 truncate">{item.publicDeviceId}</p>
      <div className="mt-4 border-t border-white/5 pt-4 text-[10px]">
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Updated</span>
          <span className="font-bold text-slate-300">{new Date(item.updatedAt).toLocaleString("en-GB")}</span>
        </div>
        {item.lastTestMessage && (
          <p className={cn("mt-3 leading-relaxed", item.lastTestStatus === "failed" ? "text-red-300" : "text-emerald-300")}>
            {item.lastTestMessage}
          </p>
        )}
        {item.failureMessage && <p className="mt-3 leading-relaxed text-red-300">{item.failureMessage}</p>}
      </div>
    </div>
  );
}

// ── MAIN DASHBOARD ──

export function AppAdminDashboard({
  updated,
  product,
  faqs,
  screenshots,
  releases,
  supportRequests,
  devices,
  activationRequests,
  licenses,
  providerSources,
  runtimeConfig,
}: {
  adminEmail: string;
  role: string;
  updated?: string;
  product: AppProduct;
  faqs: AppFaq[];
  screenshots: AppScreenshot[];
  releases: AppRelease[];
  supportRequests: AppSupportRequest[];
  devices: AppDevice[];
  activationRequests: ActivationRequest[];
  licenses: AppLicense[];
  providerSources: DeviceProviderSourceQueue[];
  runtimeConfig: AppRuntimeConfig;
}) {
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [deviceQuery, setDeviceQuery] = useState("");
  const runtime = runtimeConfig as RuntimeConfigExtras;
  const latestRelease = useMemo(() => [...releases].sort((a, b) => b.version_code - a.version_code)[0], [releases]);
  const waitingActivations = activationRequests.filter((request) => request.status === "waiting");
  const failedSources = providerSources.filter((source) => source.status === "failed");
  const openSupport = supportRequests.filter((request) => request.status === "new");
  const deviceActivationCounts = useMemo(() => {
    const counts = new Map<string, number>();
    activationRequests.forEach((request) => counts.set(request.public_device_id, (counts.get(request.public_device_id) ?? 0) + 1));
    return counts;
  }, [activationRequests]);
  const filteredDevices = devices.filter((device) => {
    const needle = deviceQuery.trim().toLowerCase();
    if (!needle) return true;
    return [device.public_device_id, device.name, device.platform, device.device_type, device.app_version, device.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const runtimePreview = {
    product: product.slug,
    enabled: runtimeConfig.enabled,
    maintenanceMode: runtimeConfig.maintenanceMode,
    forceUpdate: runtimeConfig.forceUpdate,
    minimumVersionCode: runtimeConfig.minimumVersionCode,
    latestVersionName: runtimeConfig.latestVersionName,
    widgets: runtime.widgets,
    update: runtime.update,
  };
  const sections: Array<{ id: SectionKey; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "runtime", label: "Runtime" },
    { id: "releases", label: "Releases", count: releases.length },
    { id: "activations", label: "Activations", count: waitingActivations.length },
    { id: "devices", label: "Devices", count: devices.length },
    { id: "sources", label: "Sources", count: providerSources.length },
    { id: "content", label: "Content", count: faqs.length },
    { id: "support", label: "Support", count: openSupport.length },
  ];

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Panel */}
      <section className="relative overflow-hidden glass rounded-[3.5rem] p-10 md:p-14 border-white/5 bg-cyan-500/[0.01]">
        <div className="absolute top-0 right-0 p-14 opacity-5">
           <Smartphone className="h-40 w-40 text-cyan-400" />
        </div>
        <div className="relative z-10 space-y-8">
           <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">App Ecosystem Control</p>
                </div>
                <h1 className="headline-display text-4xl font-black text-white md:text-6xl tracking-tight">{product.product_name} OS</h1>
                <p className="max-w-2xl text-lg text-slate-400 leading-relaxed">
                  Unified management for {product.product_name} content, remote configuration, and device fleet operations.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                 <Link href={`${webBaseUrl}/en/apps/${product.slug}`} target="_blank" className="flex items-center h-14 px-8 rounded-full border border-white/10 bg-white/5 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Public View
                 </Link>
              </div>
           </div>
           
           {updated && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest"
             >
                <CheckCircle2 className="h-4 w-4" />
                Update Sequence Completed: {updated}
             </motion.div>
           )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="sticky top-4 z-20 -mx-1 overflow-x-auto rounded-[2rem] border border-white/10 bg-slate-950/80 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex min-w-max gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition",
                activeSection === section.id ? "bg-cyan-400 text-black" : "hover:bg-white/[0.06] hover:text-white",
              )}
            >
              {section.label}
              {typeof section.count === "number" ? (
                <span className={cn("rounded-full px-2 py-0.5", activeSection === section.id ? "bg-black/15" : "bg-white/[0.08] text-slate-300")}>
                  {section.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {activeSection === "overview" ? (
        <>
      <section className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
        {[
          { label: "Fleet", value: devices.length, icon: <Activity className="text-cyan-400" /> },
          { label: "Licenses", value: licenses.length, icon: <Shield className="text-emerald-400" /> },
          { label: "Waiting", value: activationRequests.filter(r => r.status === 'waiting').length, icon: <Key className="text-amber-400" /> },
          { label: "Sources", value: providerSources.length, icon: <UploadCloud className="text-cyan-400" /> },
          { label: "Releases", value: releases.length, icon: <Box className="text-violet-400" /> },
          { label: "Visual Assets", value: screenshots.length, icon: <Layout className="text-sky-200" /> },
          { label: "Inquiries", value: supportRequests.filter(s => s.status === 'new').length, icon: <Mail className="text-red-400" /> },
        ].map((item, idx) => (
          <motion.div 
            key={item.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="glass rounded-[2rem] p-6 border-white/5 text-center flex flex-col items-center justify-center hover:bg-white/[0.02] transition-colors"
          >
            <div className="mb-3 h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
               {item.icon}
            </div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{item.label}</p>
            <p className="text-2xl font-black text-white">{item.value}</p>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Latest release",
            value: latestRelease?.version_name ?? "No release",
            body: latestRelease ? `${latestRelease.slug} / code ${latestRelease.version_code}` : "Upload a published APK before users depend on downloads.",
            action: "Open Releases",
            section: "releases" as const,
            icon: <Box className="h-5 w-5" />,
          },
          {
            title: "Runtime state",
            value: runtimeConfig.maintenanceMode ? "Maintenance" : runtimeConfig.enabled ? "Online" : "Offline",
            body: runtimeConfig.forceUpdate ? "Force update is enabled for old builds." : "No forced update gate is active.",
            action: "Open Runtime",
            section: "runtime" as const,
            icon: <Settings2 className="h-5 w-5" />,
          },
          {
            title: "Needs attention",
            value: `${waitingActivations.length + failedSources.length + openSupport.length}`,
            body: `${waitingActivations.length} activations, ${failedSources.length} failed sources, ${openSupport.length} support messages.`,
            action: "Open Activations",
            section: "activations" as const,
            icon: <SlidersHorizontal className="h-5 w-5" />,
          },
        ].map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setActiveSection(item.section)}
            className="glass rounded-[2rem] border-white/5 bg-white/[0.02] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-200/20 hover:bg-white/[0.04]"
          >
            <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-cyan-100">
              {item.icon}
            </span>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.title}</p>
            <p className="mt-2 text-2xl font-black text-white">{item.value}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
            <span className="mt-5 inline-block text-[10px] font-black uppercase tracking-widest text-cyan-200">{item.action}</span>
          </button>
        ))}
      </section>
        </>
      ) : null}

      {/* Runtime Control Panel */}
      {activeSection === "runtime" ? (
      <Panel 
        title="Runtime Configuration" 
        description={`Real control switches consumed by ${product.product_name} through the public app configuration endpoint. Save once and the app reads the new state on sync.`}
        icon={<Settings2 className="h-6 w-6" />}
        className="bg-cyan-500/[0.01] border-cyan-500/10"
      >
        <form action={saveRuntimeConfigAction} className="grid gap-6 lg:grid-cols-2">
          <input type="hidden" name="product_slug" value={product.slug} />
          <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
            <NativeToggle
              name="enabled"
              label="App Master Switch"
              description={runtimeConfig.enabled ? "MoPlayer is online for users." : "MoPlayer is currently offline."}
              checked={runtimeConfig.enabled}
              tone="green"
            />
            <NativeToggle
              name="maintenanceMode"
              label="Maintenance Mode"
              description="Show controlled downtime state inside the app."
              checked={runtimeConfig.maintenanceMode}
              tone="red"
            />
            <NativeToggle
              name="forceUpdate"
              label="Force Update"
              description="Require users to install the newest build."
              checked={runtimeConfig.forceUpdate}
            />
            <NativeToggle
              name="weather"
              label="Weather Widget"
              description="Enable the website proxy powered weather module."
              checked={runtimeConfig.widgets.weather}
            />
            <NativeToggle
              name="football"
              label="Football Widget"
              description="Enable match widgets through website proxies."
              checked={runtimeConfig.widgets.football}
            />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 lg:col-span-2">
            Version gates · accent
          </p>
          <div className="space-y-6 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Min Version Code" name="minimumVersionCode" type="number" defaultValue={String(runtimeConfig.minimumVersionCode)} />
              <InputField label="Latest Build Name" name="latestVersionName" defaultValue={runtimeConfig.latestVersionName} />
            </div>
            <InputField label="System Accent Color" name="accentColor" defaultValue={runtimeConfig.accentColor} />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 lg:col-span-2">
            Public links · Supabase in-app banner
          </p>
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <InputField label="Cloud Support Link" name="supportUrl" defaultValue={runtimeConfig.supportUrl} />
            <InputField label="Privacy Policy URI" name="privacyUrl" defaultValue={runtimeConfig.privacyUrl} />
            <InputField label="App Logo URL" name="logoUrl" defaultValue={runtimeConfig.logoUrl} />
            <InputField label="App Background URL" name="backgroundUrl" defaultValue={runtimeConfig.backgroundUrl} />
          </div>

          <div className="lg:col-span-2 rounded-[2rem] border border-cyan-200/10 bg-cyan-200/[0.035] p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-200/8 text-cyan-100">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">In-app Broadcast Message</h3>
                <p className="text-xs leading-6 text-slate-400">Write one clear message. It is stored in Supabase runtime config and displayed by MoPlayer when the app syncs.</p>
              </div>
            </div>
            <TextAreaField label="Message to users" name="message" defaultValue={runtimeConfig.message} placeholder="Example: A new version is ready. Please update for the best experience." />
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 lg:col-span-2">
            Pro runtime extensions
          </p>
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <InputField label="Latest Version Code" name="latestVersionCode" type="number" defaultValue={String(runtimeNumber(runtime.latestVersionCode ?? runtime.update?.latestVersionCode, runtimeConfig.minimumVersionCode))} />
            <InputField label="Sync Interval Minutes" name="syncIntervalMinutes" type="number" defaultValue={String(runtimeNumber(runtime.syncIntervalMinutes, 120))} />
            <InputField label="App Name Override" name="appName" defaultValue={runtime.appName ?? product.product_name} />
            <InputField label="Package Name Override" name="packageName" defaultValue={runtime.packageName ?? product.package_name} />
            <InputField label="Weather City" name="weatherCity" defaultValue={runtime.widgets.weatherCity ?? ""} placeholder="Berlin" />
            <InputField label="Football Max Matches" name="footballMaxMatches" type="number" defaultValue={String(runtimeNumber(runtime.widgets.footballMaxMatches, 8))} />
            <InputField label="Football Provider Mode" name="footballProviderMode" defaultValue={runtime.footballProviderMode ?? "auto"} />
            <InputField label="Weather Background Mode" name="weatherBackgroundMode" defaultValue={runtime.weatherBackgroundMode ?? "city_daily"} />
            <InputField label="Weather Background URL" name="weatherBackgroundUrl" defaultValue={runtime.weatherBackgroundUrl ?? ""} />
            <label className="flex items-center justify-between p-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Source Protocol Fallback</span>
              <input type="checkbox" name="sourceProtocolFallback" defaultChecked={runtime.sourceProtocolFallback ?? true} className="h-5 w-5 accent-cyan-500" />
            </label>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 lg:col-span-2">
            Update payload
          </p>
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <InputField label="Update Download URL" name="updateDownloadUrl" defaultValue={runtime.update?.downloadUrl ?? `/api/app/download/latest?product=${product.slug}`} />
            <InputField label="APK Size Bytes" name="updateApkSizeBytes" type="number" defaultValue={String(runtimeNumber(runtime.update?.apkSizeBytes, 0))} />
            <InputField label="Checksum SHA-256" name="updateChecksumSha256" defaultValue={runtime.update?.checksumSha256 ?? ""} />
            <TextAreaField label="Update Release Notes" name="updateReleaseNotes" defaultValue={runtime.update?.releaseNotes ?? ""} />
          </div>

          <div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-black/30 p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Config preview</p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-300">{JSON.stringify(runtimePreview, null, 2)}</pre>
          </div>
          
          <div className="lg:col-span-2 pt-4">
            <button type="submit" className="w-full md:w-auto px-10 h-14 rounded-full bg-cyan-500 text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
              Save & Sync Runtime
            </button>
          </div>
        </form>
      </Panel>
      ) : null}

      {/* Release Management */}
      {activeSection === "releases" ? (
      <Panel
        title="Release Architecture"
        description="Binary distribution and version control. Upload APK builds to the cloud infrastructure."
        icon={<UploadCloud className="h-6 w-6" />}
      >
        <form action={saveReleaseAction} className="grid gap-6 lg:grid-cols-2" encType="multipart/form-data">
           <input type="hidden" name="product_slug" value={product.slug} />
           <div className="space-y-6">
              <InputField label="Release Slug" name="slug" placeholder="moplayer-v2-1-0" required />
              <div className="grid gap-4 sm:grid-cols-2">
                 <InputField label="Version Name" name="version_name" placeholder="2.1.0" required />
                 <InputField label="Version Code" name="version_code" type="number" defaultValue="3" required />
              </div>
              <InputField label="Hardware ABI" name="abi" defaultValue="universal" required />
           </div>
           <div className="space-y-6">
              <InputField label="Publish Timestamp" name="published_at" type="datetime-local" />
              <label className="flex items-center justify-between p-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Instant Publish</span>
                <input type="checkbox" name="is_published" defaultChecked className="h-5 w-5 accent-cyan-500" />
              </label>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Binary Payload (APK)</label>
                 <div className="relative h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center px-4 overflow-hidden">
                    <input type="file" name="file" accept=".apk" className="absolute inset-0 opacity-0 cursor-pointer" />
                    <span className="text-sm text-slate-500">Select file for upload...</span>
                 </div>
              </div>
           </div>
           <div className="lg:col-span-2">
              <TextAreaField label="Release Intelligence (Notes)" name="release_notes" placeholder="Whats new in this build..." required />
           </div>
           <div className="lg:col-span-2">
              <button type="submit" className="px-10 h-14 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">
                Finalize Release Distribution
              </button>
           </div>
        </form>

        <div className="mt-12 space-y-4">
          {releases.map((item) => <ReleaseCard key={item.id} item={item} />)}
          {!releases.length ? (
            <EmptyState icon={<Box className="h-6 w-6" />} title="No releases yet" body="Upload a published APK release so public download routes and app update checks have a real artifact." />
          ) : null}
        </div>

        <div className="mt-10 rounded-[2rem] border border-amber-300/15 bg-amber-300/[0.045] p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">TV install troubleshooting</h3>
              <p className="text-xs leading-6 text-slate-400">Use this when a TV shows “App not installed”. The recommended fix is usually the universal APK plus a clean reinstall if a previous build used a different signature.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              "Download the Recommended TV APK first. It contains all packaged native architectures.",
              `If an older ${product.product_name} build exists and Android refuses the update, uninstall the old app first, then install again.`,
              "Keep Android 7.0+ as the minimum device requirement.",
              "If the TV still fails, connect ADB and read the PackageInstaller reason before publishing another build.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </Panel>
      ) : null}

      {activeSection === "activations" ? (
        <Panel
          title="Activation Requests"
          description="Review every MO-XXXX request, copy the exact activation link, and distinguish waiting, activated, expired, and failed states."
          icon={<Key className="h-6 w-6" />}
        >
          <div className="space-y-4">
            {activationRequests.map((req) => (
              <div key={req.id} className="glass rounded-[1.5rem] border-white/5 bg-white/[0.02] p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <StatusBadge status={req.status} />
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        {req.product_slug ?? product.slug}
                      </span>
                    </div>
                    <p className="font-mono text-3xl font-black tracking-tighter text-white">{req.device_code}</p>
                    <p className="mt-2 truncate font-mono text-xs text-slate-500">{req.public_device_id}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expires</p>
                      <p className="mt-1 text-sm font-bold text-slate-300">{new Date(req.expires_at).toLocaleString("en-GB")}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <CopyButton value={req.device_code} label="Code" />
                      <CopyButton value={activationLink(product.slug, req.device_code)} label="Link" />
                      <Link href={activationLink(product.slug, req.device_code)} target="_blank" className="admin-secondary-button h-10 px-3 text-[10px]">
                        Open
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!activationRequests.length ? (
              <EmptyState icon={<Key className="h-6 w-6" />} title="No activation requests" body="New MO-XXXX codes will appear here when an app requests activation." />
            ) : null}
          </div>
        </Panel>
      ) : null}

      {activeSection === "devices" ? (
        <>
          <Panel
            title="Device Fleet"
            description="Search and inspect device records. Destructive controls such as block/revoke should be added only after the database policy is intentionally designed."
            icon={<Smartphone className="h-6 w-6" />}
          >
            <div className="mb-6 flex flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center">
              <Search className="h-5 w-5 text-cyan-200" />
              <input
                value={deviceQuery}
                onChange={(event) => setDeviceQuery(event.target.value)}
                placeholder="Search device id, platform, version, status..."
                className="h-11 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{filteredDevices.length} shown</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDevices.map((item) => (
                <DeviceCard key={item.id} item={item} activationCount={deviceActivationCounts.get(item.public_device_id) ?? 0} />
              ))}
            </div>
            {!filteredDevices.length ? (
              <EmptyState icon={<Smartphone className="h-6 w-6" />} title="No matching devices" body="Try a different search term or wait for app clients to report device status." />
            ) : null}
          </Panel>

          <Panel
            title="License Manager"
            description="Operator view for active, expired, and revoked access states. Key generation stays tied to the activation backend."
            icon={<Shield className="h-6 w-6" />}
            className="border-emerald-300/10 bg-emerald-300/[0.01]"
          >
            <div className="mb-8 grid gap-4 md:grid-cols-3">
              {[
                { label: "Active", value: licenses.filter((item) => item.status === "active").length, tone: "text-emerald-300" },
                { label: "Expired", value: licenses.filter((item) => item.status === "expired").length, tone: "text-amber-300" },
                { label: "Revoked", value: licenses.filter((item) => item.status === "revoked").length, tone: "text-red-300" },
              ].map((item) => (
                <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className={`mt-2 text-3xl font-black ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
              <div className="grid grid-cols-[1.15fr_0.7fr_0.7fr] gap-3 border-b border-white/10 px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span>Device</span>
                <span>Plan</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-white/10">
                {licenses.slice(0, 12).map((license) => (
                  <div key={license.id} className="grid grid-cols-[1.15fr_0.7fr_0.7fr] items-center gap-3 px-5 py-4 text-xs">
                    <span className="min-w-0 truncate font-mono text-slate-300">{license.device_id}</span>
                    <span className="font-black uppercase tracking-widest text-slate-400">{license.plan}</span>
                    <StatusBadge status={license.status} />
                  </div>
                ))}
                {!licenses.length ? (
                  <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                    <Key className="mb-3 h-8 w-8 text-slate-600" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-500">No licenses tracked yet</p>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-cyan-200/10 bg-cyan-200/[0.035] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-black text-white">Activation flow</p>
                <p className="mt-1 text-xs leading-6 text-slate-400">Open the product-specific activation page when you need a real device-bound key.</p>
              </div>
              <Link href={activationLink(product.slug)} target="_blank" className="admin-secondary-button">
                Open Activation
              </Link>
            </div>
          </Panel>
        </>
      ) : null}

      {activeSection === "sources" ? (
        <Panel
          title="Website Source Delivery"
          description="Track Xtream/M3U source handoff from the website activation flow to the Android app. Credentials stay encrypted server-side."
          icon={<UploadCloud className="h-6 w-6" />}
        >
          <div className="mb-6 rounded-[1.5rem] border border-amber-300/15 bg-amber-300/[0.045] p-5">
            <p className="text-sm font-black text-amber-100">Current storage note</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              Active source delivery currently uses app_settings-backed encrypted queues. The older device_provider_sources table should stay hidden until it is intentionally migrated.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providerSources.map((item) => <ProviderSourceCard key={item.id} item={item} />)}
          </div>
          {!providerSources.length ? (
            <EmptyState icon={<UploadCloud className="h-6 w-6" />} title="No website-delivered sources yet" body="When a user adds a source through activation, its queue status will appear here." />
          ) : null}
        </Panel>
      ) : null}

      {activeSection === "content" ? (
        <>
          <Panel
            title="Product Content"
            description="Edit the public product story, support links, app metadata, compatibility notes, and install guidance for this product only."
            icon={<FileText className="h-6 w-6" />}
          >
            <form action={saveProductAction} className="grid gap-6 lg:grid-cols-2">
              <input type="hidden" name="product_slug" value={product.slug} />
              <InputField label="Product Name" name="product_name" defaultValue={product.product_name} required />
              <InputField label="Hero Badge" name="hero_badge" defaultValue={product.hero_badge} />
              <InputField label="Package Name" name="package_name" defaultValue={product.package_name} required />
              <InputField label="Download Label" name="default_download_label" defaultValue={product.default_download_label} />
              <InputField label="Support Email" name="support_email" defaultValue={product.support_email} />
              <InputField label="Support WhatsApp" name="support_whatsapp" defaultValue={product.support_whatsapp} />
              <InputField label="Support URL" name="support_url" defaultValue={product.support_url ?? ""} />
              <InputField label="Privacy Path" name="privacy_path" defaultValue={product.privacy_path} />
              <InputField label="Play Store URL" name="play_store_url" defaultValue={product.play_store_url ?? ""} />
              <InputField label="Min SDK" name="android_min_sdk" type="number" defaultValue={String(product.android_min_sdk)} />
              <InputField label="Target SDK" name="android_target_sdk" type="number" defaultValue={String(product.android_target_sdk)} />
              <label className="flex items-center justify-between p-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Android TV Ready</span>
                <input type="checkbox" name="android_tv_ready" defaultChecked={product.android_tv_ready} className="h-5 w-5 accent-cyan-500" />
              </label>
              <InputField label="Logo Path" name="logo_path" defaultValue={product.logo_path ?? ""} />
              <InputField label="Hero Image Path" name="hero_image_path" defaultValue={product.hero_image_path ?? ""} />
              <InputField label="TV Banner Path" name="tv_banner_path" defaultValue={product.tv_banner_path ?? ""} />
              <TextAreaField label="Tagline" name="tagline" defaultValue={product.tagline} />
              <TextAreaField label="Short Description" name="short_description" defaultValue={product.short_description} />
              <TextAreaField label="Long Description" name="long_description" defaultValue={product.long_description} />
              <TextAreaField label="Feature Highlights (Title :: Body)" name="feature_highlights" defaultValue={structuredLines(product.feature_highlights)} />
              <TextAreaField label="How It Works (Title :: Body)" name="how_it_works" defaultValue={structuredLines(product.how_it_works)} />
              <TextAreaField label="Install Steps (Title :: Body)" name="install_steps" defaultValue={structuredLines(product.install_steps)} />
              <TextAreaField label="Compatibility Notes (one per line)" name="compatibility_notes" defaultValue={simpleLines(product.compatibility_notes)} />
              <TextAreaField label="Legal Notes (one per line)" name="legal_notes" defaultValue={simpleLines(product.legal_notes)} />
              <TextAreaField label="Changelog Intro" name="changelog_intro" defaultValue={product.changelog_intro} />
              <div className="lg:col-span-2">
                <button type="submit" className="px-10 h-14 rounded-full bg-cyan-500 text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-cyan-400 transition-all">
                  Save Product Content
                </button>
              </div>
            </form>
          </Panel>

          <Panel
            title="FAQ Manager"
            description="Create, update, and remove product-specific FAQ rows shown on the public app page."
            icon={<HelpCircle className="h-6 w-6" />}
          >
            <form action={saveFaqAction} className="mb-8 grid gap-5 lg:grid-cols-[0.6fr_1fr_1fr_0.4fr]">
              <input type="hidden" name="product_slug" value={product.slug} />
              <InputField label="Existing ID" name="id" placeholder="optional for update" />
              <InputField label="Question" name="question" required />
              <InputField label="Answer" name="answer" required />
              <InputField label="Order" name="sort_order" type="number" defaultValue={String(faqs.length + 1)} />
              <div className="lg:col-span-4">
                <button type="submit" className="px-10 h-14 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">
                  Save FAQ
                </button>
              </div>
            </form>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-200">#{faq.sort_order} / {faq.id}</p>
                      <p className="mt-2 text-sm font-black text-white">{faq.question}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{faq.answer}</p>
                    </div>
                    <form action={deleteFaqAction}>
                      <input type="hidden" name="id" value={faq.id} />
                      <input type="hidden" name="product_slug" value={product.slug} />
                      <button type="submit" className="admin-secondary-button text-red-200">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
              {!faqs.length ? (
                <EmptyState icon={<HelpCircle className="h-6 w-6" />} title="No FAQ rows" body="Add answers for common installation, activation, and legal source questions." />
              ) : null}
            </div>
          </Panel>

          <Panel
            title="Visual Brand Assets"
            description="Product mockups, TV banners, and gallery previews for the public landing surface."
            icon={<Layout className="h-6 w-6" />}
          >
            <form action={saveScreenshotAction} className="grid gap-6 lg:grid-cols-2" encType="multipart/form-data">
              <input type="hidden" name="product_slug" value={product.slug} />
              <div className="space-y-6">
                <InputField label="Asset Title" name="title" required />
                <InputField label="Index Order" name="sort_order" type="number" defaultValue="1" required />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Device Frame</label>
                  <select name="device_frame" className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-5 text-[11px] font-black uppercase tracking-widest text-white outline-none">
                    <option value="phone">phone</option>
                    <option value="tv">tv</option>
                    <option value="landscape">landscape</option>
                  </select>
                </div>
                <label className="flex items-center justify-between p-4 h-14 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Featured Asset</span>
                  <input type="checkbox" name="is_featured" className="h-5 w-5 accent-cyan-500" />
                </label>
              </div>
              <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
                <InputField label="Public Path Override" name="image_path" placeholder="/images/..." />
                <label className="group relative flex min-h-20 cursor-pointer items-center justify-between overflow-hidden rounded-[2rem] border border-dashed border-cyan-200/20 bg-cyan-200/[0.035] px-6 py-5 transition hover:border-cyan-200/45 hover:bg-cyan-200/[0.06]">
                  <span>
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-cyan-100">Drag / Select Image</span>
                    <span className="mt-1 block text-xs text-slate-500">Upload and store a new app visual asset.</span>
                  </span>
                  <UploadCloud className="h-6 w-6 text-cyan-100" />
                  <input type="file" name="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" />
                </label>
              </div>
              <div className="lg:col-span-2">
                <button type="submit" className="px-10 h-14 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">
                  Upload & Sync Asset
                </button>
              </div>
            </form>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {screenshots.map((item) => <ScreenshotCard key={item.id} item={item} />)}
            </div>
          </Panel>
        </>
      ) : null}

      {activeSection === "support" ? (
        <Panel
          title="Intelligence Inbox"
          description="User feedback and support inquiries from the app fleet."
          icon={<Mail className="h-6 w-6" />}
        >
          <div className="space-y-4">
            {supportRequests.map((item) => <SupportCard key={item.id} item={item} />)}
            {!supportRequests.length ? (
              <EmptyState icon={<Mail className="h-6 w-6" />} title="Inbox zero" body="New support requests will appear here with a status selector for operator follow-up." />
            ) : null}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
