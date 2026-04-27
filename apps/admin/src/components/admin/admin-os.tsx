"use client";

import { useState } from "react";
import { AppAdminDashboard } from "./app-admin-dashboard";
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
    <div className="relative min-h-screen p-6 md:p-12 overflow-hidden bg-[var(--bg-primary)]">
      {/* Mesh Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(108,99,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,255,135,0.1),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <AnimatePresence mode="wait">
          {view === "app" && (
            <motion.div key="app" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <button
                onClick={() => setView("home")}
                className="button-ghost-shell mb-4 inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-md"
              >
                <ArrowLeft className="h-4 w-4" /> Back to OS Home
              </button>
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
              <button
                onClick={() => setView("home")}
                className="button-ghost-shell mb-4 inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-md"
              >
                <ArrowLeft className="h-4 w-4" /> Back to OS Home
              </button>
              
              <div className="glass-card p-8 md:p-12">
                <div className="space-y-4">
                  <p className="eyebrow">Website Control</p>
                  <h1 className="headline-display text-4xl font-black md:text-5xl">Digital OS Ecosystem</h1>
                  <p className="max-w-2xl text-lg text-foreground-muted">
                    Manage your personal brand, CV, YouTube stats, contact messages, and portfolio.
                  </p>
                </div>
              </div>

              <div className="glass-card flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                <Globe className="mb-4 h-12 w-12 text-accent-warm opacity-80" />
                <h2 className="text-xl font-bold">Module Under Construction</h2>
                <p className="mt-2 max-w-md text-foreground-muted">
                  The website content management system is partially built. Please return to the OS Home and use the App Control module for MoPlayer.
                </p>
              </div>
            </motion.div>
          )}

          {view === "home" && (
            <motion.div key="home" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-8">
              {/* Header */}
              <header className="glass-card p-8 md:p-12">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-4">
                    <p className="eyebrow">Mohammad Alfarras</p>
                    <h1 className="headline-display text-4xl font-black md:text-5xl">Digital OS Control Center</h1>
                    <p className="max-w-2xl text-lg text-foreground-muted">
                      Unified command surface for your public website and the MoPlayer Android TV ecosystem.
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-foreground-soft backdrop-blur-md">
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      Signed in as {adminEmail} <span className="mx-2 opacity-30">|</span> Role: {role}
                    </div>
                  </div>
                  <div>
                    <form action={logoutAdminAction}>
                      <button type="submit" className="button-secondary-shell">
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </header>

              {/* Modules */}
              <div className="grid gap-6 md:grid-cols-2">
                <motion.button
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => setView("website")}
                  className="bento-card group flex flex-col items-center justify-center p-12 text-center border-accent-warm/20"
                >
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent-warm/10 text-accent-warm ring-1 ring-accent-warm/30 transition-transform duration-500 group-hover:scale-110 group-hover:bg-accent-warm/20">
                    <Globe className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-black text-foreground">Website Control</h2>
                  <p className="mt-4 max-w-sm text-base leading-relaxed text-foreground-muted">
                    Manage CV, Portfolio, YouTube media kit, and inbound contact requests.
                  </p>
                </motion.button>

                <motion.button
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  onClick={() => setView("app")}
                  className="bento-card group flex flex-col items-center justify-center p-12 text-center border-[#00ff87]/20"
                >
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-[#00ff87]/10 text-[#00ff87] ring-1 ring-[#00ff87]/30 transition-transform duration-500 group-hover:scale-110 group-hover:bg-[#00ff87]/20">
                    <Smartphone className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl font-black text-foreground">App Control</h2>
                  <p className="mt-4 max-w-sm text-base leading-relaxed text-foreground-muted">
                    Manage MoPlayer releases, activations, licenses, remote config, and devices.
                  </p>
                </motion.button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="stats-glass-card rounded-[2rem] p-6 text-center">
                   <Activity className="mx-auto mb-4 h-6 w-6 text-[var(--color-accent)]" />
                   <p className="stats-label text-[10px] font-black uppercase tracking-widest">App Version</p>
                   <p className="mt-2 text-2xl font-black">{runtimeConfig.latestVersionName}</p>
                </div>
                <div className="stats-glass-card rounded-[2rem] p-6 text-center">
                   <Terminal className="mx-auto mb-4 h-6 w-6 text-accent-gold" />
                   <p className="stats-label text-[10px] font-black uppercase tracking-widest">Active Devices</p>
                   <p className="mt-2 text-2xl font-black">{devices.length}</p>
                </div>
                <div className="stats-glass-card rounded-[2rem] p-6 text-center">
                   <LayoutDashboard className="mx-auto mb-4 h-6 w-6 text-[#00ff87]" />
                   <p className="stats-label text-[10px] font-black uppercase tracking-widest">Website Status</p>
                   <p className="mt-2 text-2xl font-black text-[#00ff87]">Online</p>
                </div>
                <div className="stats-glass-card rounded-[2rem] p-6 text-center">
                   <MessageSquare className="mx-auto mb-4 h-6 w-6 text-accent-warm" />
                   <p className="stats-label text-[10px] font-black uppercase tracking-widest">Support Msgs</p>
                   <p className="mt-2 text-2xl font-black">{supportRequests.filter(s => s.status === 'new').length} New</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
