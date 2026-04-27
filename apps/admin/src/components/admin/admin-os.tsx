"use client";

import { useState } from "react";
import { AppAdminDashboard } from "./app-admin-dashboard";
import { WebsiteAdminDashboard } from "./website-admin-dashboard";
import { Globe, Smartphone, ArrowLeft, Activity, LayoutDashboard, MessageSquare, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
} from "@/types/app-ecosystem";
import { logoutAdminAction } from "@/app/actions";

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
  runtimeConfig: AppRuntimeConfig;
}) {
  const [view, setView] = useState<View>("home");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] font-sans">
      {/* Animated Mesh Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(108,99,255,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,255,135,0.08),transparent_50%)]" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "var(--noise)" }} />
      </div>

      {/* OS Top Bar */}
      <header className="relative z-50 flex h-14 w-full items-center justify-between border-b border-white/5 bg-black/20 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-black">
              <Terminal className="h-4 w-4" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-foreground">Digital OS</span>
          </div>
          <nav className="hidden h-full items-center gap-1 md:flex">
             <button 
              onClick={() => setView("home")}
              className={`h-8 rounded-lg px-3 text-[11px] font-bold transition ${view === "home" ? "bg-white/10 text-white" : "text-foreground-soft hover:bg-white/5"}`}
             >
               Desktop
             </button>
             <button 
              onClick={() => setView("website")}
              className={`h-8 rounded-lg px-3 text-[11px] font-bold transition ${view === "website" ? "bg-white/10 text-white" : "text-foreground-soft hover:bg-white/5"}`}
             >
               Website CMS
             </button>
             <button 
              onClick={() => setView("app")}
              className={`h-8 rounded-lg px-3 text-[11px] font-bold transition ${view === "app" ? "bg-white/10 text-white" : "text-foreground-soft hover:bg-white/5"}`}
             >
               App Ecosystem
             </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[10px] font-medium text-foreground-soft md:flex">
             <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
             {adminEmail}
           </div>
           <form action={logoutAdminAction}>
              <button type="submit" className="text-[10px] font-black uppercase tracking-widest text-red-400/80 hover:text-red-400 transition-colors">
                Shutdown
              </button>
           </form>
        </div>
      </header>

      <main className="relative z-10 p-6 md:p-10 lg:p-12">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            {view === "app" && (
              <motion.div key="app" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
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
                  runtimeConfig={runtimeConfig}
                />
              </motion.div>
            )}

            {view === "website" && (
              <motion.div key="website" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <WebsiteAdminDashboard />
              </motion.div>
            )}

            {view === "home" && (
              <motion.div key="home" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-10">
                {/* Hero */}
                <div className="space-y-3">
                  <p className="eyebrow">Control Center v3.0</p>
                  <h1 className="headline-display text-5xl font-black text-foreground md:text-6xl">Command Surface</h1>
                  <p className="max-w-2xl text-lg text-foreground-muted">
                    Unified intelligence and management for the Mohammad Alfarras digital ecosystem.
                  </p>
                </div>

                {/* Grid Modules */}
                <div className="grid gap-6 md:grid-cols-2">
                  <motion.button
                    whileHover={{ y: -5 }}
                    onClick={() => setView("website")}
                    className="glass-card group flex flex-col items-center justify-center p-16 text-center border-accent-warm/10 hover:border-accent-warm/30 bg-accent-warm/5"
                  >
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-accent-warm/10 text-accent-warm ring-1 ring-accent-warm/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-accent-warm/20">
                      <Globe className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-black text-foreground">Website CMS</h2>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground-muted">
                      Personal brand, career timeline, portfolio projects, and inbound inquiries.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -5 }}
                    onClick={() => setView("app")}
                    className="glass-card group flex flex-col items-center justify-center p-16 text-center border-primary/10 hover:border-primary/30 bg-primary/5"
                  >
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-primary/10 text-primary ring-1 ring-primary/20 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/20">
                      <Smartphone className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-black text-foreground">App Control</h2>
                    <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground-muted">
                      MoPlayer releases, license keys, remote configuration, and device fleet.
                    </p>
                  </motion.button>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {[
                    { label: "Active Version", value: runtimeConfig.latestVersionName, icon: <Activity className="text-primary" /> },
                    { label: "Fleet Size", value: `${devices.length} Devices`, icon: <Terminal className="text-accent-gold" /> },
                    { label: "Ecosystem Status", value: "Operational", icon: <LayoutDashboard className="text-emerald-400" /> },
                    { label: "Inbox Leads", value: `${supportRequests.filter(s => s.status === 'new').length} New`, icon: <MessageSquare className="text-accent-warm" /> },
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass-panel p-6 rounded-[2rem] text-center flex flex-col items-center justify-center border-white/5"
                    >
                       <div className="mb-4 h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center">
                         {stat.icon}
                       </div>
                       <p className="stats-label text-[10px] font-black uppercase tracking-widest opacity-60">{stat.label}</p>
                       <p className="mt-2 text-xl font-black text-foreground">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
