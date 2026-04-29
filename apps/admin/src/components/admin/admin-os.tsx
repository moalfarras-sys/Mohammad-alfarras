"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Smartphone,
} from "lucide-react";

import { logoutAdminAction } from "@/app/actions";
import { cn } from "@/lib/cn";
import { AppAdminDashboard } from "./app-admin-dashboard";
import { WebsiteAdminDashboard } from "./website-admin-dashboard";

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

type View = "home" | "website" | "app";

export function AdminOS({
  adminEmail,
  role,
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
  const [view, setView] = useState<View>("home");

  const navItems = useMemo(
    () => [
      { id: "home" as const, label: "Dashboard", short: "Home", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "website" as const, label: "Website", short: "Site", icon: <Globe className="h-4 w-4" /> },
      { id: "app" as const, label: "MoPlayer", short: "App", icon: <Smartphone className="h-4 w-4" /> },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] font-sans selection:bg-cyan-500/30">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.12),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      </div>

      <header className="relative z-50 border-b border-white/5 bg-slate-950/40 px-4 backdrop-blur-2xl md:px-8">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_20px_rgba(34,211,238,0.18)]">
                <Image src="/icons/icon-192.png" alt="Moalfarras Admin" width={44} height={44} className="h-9 w-9 rounded-xl object-cover" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Digital OS</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/80">Command Center</span>
              </div>
            </div>

            <nav className="hidden h-full items-center gap-2 md:flex">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all",
                    view === item.id ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 md:flex">
              <div className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-300">{adminEmail}</span>
                <span className="block text-[9px] uppercase tracking-[0.15em] text-slate-500">{role}</span>
              </div>
            </div>
            <form action={logoutAdminAction}>
              <button type="submit" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400/70 transition-colors hover:text-red-400">
                <span>Sign out</span>
                <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </div>

        <div className="pb-3 md:hidden">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
                  view === item.id
                    ? "border-cyan-400/25 bg-cyan-500/12 text-white"
                    : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
                )}
              >
                {item.icon}
                <span>{item.short}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 pb-28 md:p-8 md:pb-8 lg:p-12">
        <div className="mx-auto max-w-[1400px]">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div key="home" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8 md:space-y-12">
                <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="h-px w-6 bg-cyan-500" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">System v4.0.0</p>
                    </div>
                    <h1 className="headline-display text-4xl font-black tracking-tight text-white md:text-7xl">Digital OS Control</h1>
                    <p className="max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
                      A focused command center for the public brand, CV system, media studio, and MoPlayer ecosystem.
                    </p>
                  </div>

                  <div className="grid w-full gap-4 sm:grid-cols-2 md:w-auto">
                    <div className="glass flex min-h-[7rem] flex-col items-center justify-center rounded-[2rem] border-white/5 p-6">
                      <span className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Status</span>
                      <span className="text-sm font-black uppercase tracking-widest text-emerald-400">Active</span>
                    </div>
                    <div className="glass flex min-h-[7rem] flex-col items-center justify-center rounded-[2rem] border-white/5 p-6">
                      <span className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-500">Mode</span>
                      <span className="text-sm font-black uppercase tracking-widest text-white">Manual</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                  <motion.button whileHover={{ y: -8, scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setView("website")} className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-start transition-all duration-500 hover:border-cyan-500/30 md:rounded-[3.5rem] md:p-12">
                    <div className="glass absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black group-hover:shadow-[0_0_40px_rgba(34,211,238,0.4)] md:h-24 md:w-24 md:rounded-[2.5rem]">
                        <Globe className="h-9 w-9 md:h-10 md:w-10" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-white">Website Control</h2>
                      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400">
                        Edit homepage story, case studies, CV, media kit, contact surface, and SEO metadata.
                      </p>
                    </div>
                  </motion.button>

                  <motion.button whileHover={{ y: -8, scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setView("app")} className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 p-8 text-start transition-all duration-500 hover:border-violet-500/30 md:rounded-[3.5rem] md:p-12">
                    <div className="glass absolute inset-0" />
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="relative z-10">
                      <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5 text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white group-hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] md:h-24 md:w-24 md:rounded-[2.5rem]">
                        <Smartphone className="h-9 w-9 md:h-10 md:w-10" />
                      </div>
                      <h2 className="text-3xl font-black tracking-tight text-white">MoPlayer Control</h2>
                      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400">
                        Manage releases, activations, devices, runtime config, support, and app messaging.
                      </p>
                    </div>
                  </motion.button>
                </div>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                  {[
                    { label: "Active SDK", value: `API ${product.android_target_sdk}`, icon: <Activity className="text-cyan-400" /> },
                    { label: "Fleet Count", value: `${devices.length} Devices`, icon: <Smartphone className="text-violet-400" /> },
                    { label: "Pending Activation", value: `${activationRequests.filter((r) => r.status === "waiting").length} Req`, icon: <MessageSquare className="text-amber-400" /> },
                    { label: "Support Queue", value: `${supportRequests.filter((s) => s.status === "new").length} Open`, icon: <Activity className="text-red-400" /> },
                  ].map((stat, i) => (
                    <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass flex flex-col items-center justify-center rounded-[1.8rem] border-white/5 p-5 text-center md:rounded-[2rem] md:p-8">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">{stat.icon}</div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                      <p className="text-lg font-black text-white md:text-xl">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {(() => {
                  const published = releases.filter((r) => r.is_published);
                  const top = [...published].sort((a, b) => b.version_code - a.version_code)[0] ?? [...releases].sort((a, b) => b.version_code - a.version_code)[0];
                  if (!top) return null;
                  return (
                    <p className="text-center text-[13px] text-slate-500">
                      Latest tracked release: <span className="font-black text-cyan-400/90">{top.version_name}</span>
                      <span className="text-slate-600"> · </span>
                      <span className="text-slate-400">{published.length} published</span>
                    </p>
                  );
                })()}
              </motion.div>
            )}

            {view === "app" && (
              <motion.div key="app" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AppAdminDashboard
                  adminEmail={adminEmail}
                  role={role}
                  updated={updated}
                  product={product}
                  faqs={faqs}
                  screenshots={screenshots}
                  releases={releases}
                  supportRequests={supportRequests}
                  devices={devices}
                  activationRequests={activationRequests}
                  licenses={licenses}
                  providerSources={providerSources}
                  runtimeConfig={runtimeConfig}
                />
              </motion.div>
            )}

            {view === "website" && (
              <motion.div key="website" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <WebsiteAdminDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
