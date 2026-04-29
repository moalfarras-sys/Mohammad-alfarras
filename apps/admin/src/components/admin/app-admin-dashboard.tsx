"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
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
  Bell,
} from "lucide-react";

import {
  deleteReleaseAction,
  deleteScreenshotAction,
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
import { cn } from "@/lib/cn";

const webBaseUrl = process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space";

function formatBytes(size?: number | null) {
  if (!size) return "Not uploaded";
  const mb = size / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
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
  icon?: React.ReactNode;
  children: React.ReactNode;
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

function InputField({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
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

function TextAreaField({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
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
  const isOk = status === "resolved" || status === "active" || status === "published";
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
      isOk ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
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

// ── DATA CARDS ──

function ScreenshotCard({ item }: { item: AppScreenshot }) {
  return (
    <div className="group relative glass rounded-[2.5rem] p-4 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all">
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-5">
         <img src={item.image_path} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
          </div>
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

function DeviceCard({ item }: { item: AppDevice }) {
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
                <h1 className="headline-display text-4xl font-black text-white md:text-6xl tracking-tight">MoPlayer OS</h1>
                <p className="max-w-2xl text-lg text-slate-400 leading-relaxed">
                  Unified management for product content, remote configuration, and device fleet operations.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                 <Link href={`${webBaseUrl}/en/apps/moplayer`} target="_blank" className="flex items-center h-14 px-8 rounded-full border border-white/10 bg-white/5 text-white text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
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

      {/* Runtime Control Panel */}
      <Panel 
        title="Runtime Configuration" 
        description="Real control switches consumed by MoPlayer through the public app configuration endpoint. Save once and the app reads the new state on sync."
        icon={<Settings2 className="h-6 w-6" />}
        className="bg-cyan-500/[0.01] border-cyan-500/10"
      >
        <form action={saveRuntimeConfigAction} className="grid gap-6 lg:grid-cols-2">
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
            Public links · in-app banner
          </p>
          <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
            <InputField label="Cloud Support Link" name="supportUrl" defaultValue={runtimeConfig.supportUrl} />
            <InputField label="Privacy Policy URI" name="privacyUrl" defaultValue={runtimeConfig.privacyUrl} />
          </div>

          <div className="lg:col-span-2 rounded-[2rem] border border-cyan-200/10 bg-cyan-200/[0.035] p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-200/8 text-cyan-100">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Broadcast / In-app Message</h3>
                <p className="text-xs leading-6 text-slate-400">Write one clear message. It is stored in runtime config and can be displayed by MoPlayer as a global banner.</p>
              </div>
            </div>
            <TextAreaField label="Message to users" name="message" defaultValue={runtimeConfig.message} placeholder="Example: A new version is ready. Please update for the best experience." />
          </div>
          
          <div className="lg:col-span-2 pt-4">
            <button type="submit" className="w-full md:w-auto px-10 h-14 rounded-full bg-cyan-500 text-black font-black text-[11px] uppercase tracking-[0.2em] hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all">
              Save & Sync Runtime
            </button>
          </div>
        </form>
      </Panel>

      {/* Release Management */}
      <Panel
        title="Release Architecture"
        description="Binary distribution and version control. Upload APK builds to the cloud infrastructure."
        icon={<UploadCloud className="h-6 w-6" />}
      >
        <form action={saveReleaseAction} className="grid gap-6 lg:grid-cols-2" encType="multipart/form-data">
           <div className="space-y-6">
              <InputField label="Release Slug" name="slug" placeholder="moplayer-v2-1-0" required />
              <div className="grid gap-4 sm:grid-cols-2">
                 <InputField label="Version Name" name="version_name" placeholder="2.1.0" required />
                 <InputField label="Version Code" name="version_code" type="number" defaultValue="3" required />
              </div>
              <InputField label="Hardware ABI" name="abi" defaultValue="arm64-v8a" required />
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
        </div>
      </Panel>

      {/* Device Fleet */}
      <Panel
        title="Device Fleet & Activations"
        description="Monitor active hardware nodes and resolve MO-XXXX license requests."
        icon={<Activity className="h-6 w-6" />}
      >
        <div className="grid gap-10 lg:grid-cols-2">
           <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Smartphone className="h-4 w-4" /> Live Nodes
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                 {devices.slice(0, 8).map(item => <DeviceCard key={item.id} item={item} />)}
              </div>
           </div>
           <div className="space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <Key className="h-4 w-4" /> Activation Queue
              </h3>
              <div className="space-y-4">
                 {activationRequests.filter(r => r.status === 'waiting').map(req => (
                    <div key={req.id} className="glass rounded-[1.5rem] p-6 border-amber-500/10 bg-amber-500/[0.02] flex items-center justify-between">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Code Required</p>
                          <p className="text-2xl font-black text-white font-mono tracking-tighter">{req.device_code}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] text-slate-500">Expires</p>
                          <p className="text-xs font-bold text-slate-300">{new Date(req.expires_at).toLocaleTimeString()}</p>
                       </div>
                    </div>
                 ))}
                 {!activationRequests.filter(r => r.status === 'waiting').length && (
                    <p className="text-sm text-slate-600 text-center py-10 italic">No pending activations.</p>
                 )}
              </div>
           </div>
           <div className="space-y-6 lg:col-span-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                 <UploadCloud className="h-4 w-4" /> Website Source Delivery
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                 {providerSources.slice(0, 9).map(item => <ProviderSourceCard key={item.id} item={item} />)}
              </div>
              {!providerSources.length && (
                <p className="text-sm text-slate-600 text-center py-8 italic">No website-delivered Xtream/M3U sources yet.</p>
              )}
           </div>
        </div>
      </Panel>

      <Panel
        title="License Manager"
        description="A clear operator view for active, pending, expired, and revoked access states. Key generation stays tied to your current activation backend."
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
            {licenses.slice(0, 8).map((license) => (
              <div key={license.id} className="grid grid-cols-[1.15fr_0.7fr_0.7fr] items-center gap-3 px-5 py-4 text-xs">
                <span className="min-w-0 truncate font-mono text-slate-300">{license.device_id}</span>
                <span className="font-black uppercase tracking-widest text-slate-400">{license.plan}</span>
                <StatusBadge status={license.status} />
              </div>
            ))}
            {!licenses.length && (
              <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
                <Key className="mb-3 h-8 w-8 text-slate-600" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-500">No licenses tracked yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[1.5rem] border border-cyan-200/10 bg-cyan-200/[0.035] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black text-white">Generate key flow</p>
            <p className="mt-1 text-xs leading-6 text-slate-400">Use the activation route for real device-bound keys. This panel keeps the operator focused on status and follow-up.</p>
          </div>
          <Link href={`${webBaseUrl}/en/activate`} target="_blank" className="admin-secondary-button">
            Open Activation
          </Link>
        </div>
      </Panel>

      {/* Support Inbox */}
      <Panel
        title="Intelligence Inbox"
        description="Encrypted user feedback and support inquiries from the global fleet."
        icon={<Mail className="h-6 w-6" />}
      >
        <div className="space-y-4">
          {supportRequests.map((item) => <SupportCard key={item.id} item={item} />)}
          {!supportRequests.length && (
             <div className="glass rounded-[2rem] p-20 flex flex-col items-center justify-center text-center opacity-30">
                <Mail className="h-12 w-12 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest">Inbox Zero</p>
             </div>
          )}
        </div>
      </Panel>

      {/* Visual Content */}
      <Panel
        title="Visual Brand Assets"
        description="Product mockups, TV banners, and gallery previews for the public landing surface."
        icon={<Layout className="h-6 w-6" />}
      >
        <form action={saveScreenshotAction} className="grid gap-6 lg:grid-cols-2" encType="multipart/form-data">
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
           {screenshots.map(item => <ScreenshotCard key={item.id} item={item} />)}
        </div>
      </Panel>
    </div>
  );
}
