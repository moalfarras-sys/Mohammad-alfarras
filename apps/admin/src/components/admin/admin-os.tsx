"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  CircleGauge,
  Command,
  DatabaseZap,
  Globe,
  LayoutDashboard,
  RadioTower,
  Search,
  Smartphone,
  Zap,
} from "lucide-react";

import { logoutAdminAction } from "@/app/actions";
import { cn } from "@/lib/cn";
import { AppAdminDashboard } from "./app-admin-dashboard";
import { WebsiteAdminDashboard } from "./website-admin-dashboard";
import type { WebsiteCmsData } from "@/lib/website-cms";

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

function SystemMetric({ label, value, tone = "cyan" }: { label: string; value: string; tone?: "cyan" | "green" | "amber" }) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} className={`command-metric command-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </motion.div>
  );
}

function CommandPalette({
  open,
  onClose,
  setView,
}: {
  open: boolean;
  onClose: () => void;
  setView: (view: View) => void;
}) {
  const actions = [
    { label: "Open Home HUD", hint: "Dashboard overview", view: "home" as const, icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Website CMS", hint: "Edit public website surfaces", view: "website" as const, icon: <Globe className="h-4 w-4" /> },
    { label: "MoPlayer OS Control", hint: "Runtime, releases, fleet, support", view: "app" as const, icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div className="command-palette-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            className="command-palette"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-white/10 p-4">
              <Search className="h-5 w-5 text-cyan-200" />
              <input autoFocus placeholder="Search commands, modules, devices..." className="h-12 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
              <kbd className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-slate-400">ESC</kbd>
            </div>
            <div className="space-y-2 p-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  className="flex w-full items-center gap-4 rounded-2xl border border-transparent p-4 text-left transition hover:border-cyan-200/20 hover:bg-cyan-200/8"
                  onClick={() => {
                    setView(action.view);
                    onClose();
                  }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-100">{action.icon}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-black text-white">{action.label}</span>
                    <span className="block text-xs text-slate-500">{action.hint}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

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
  website,
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
  website: WebsiteCmsData;
}) {
  const [view, setView] = useState<View>("home");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const waitingActivations = activationRequests.filter((request) => request.status === "waiting").length;
  const activeLicenses = licenses.filter((license) => license.status === "active").length;
  const latestRelease = [...releases].sort((a, b) => b.version_code - a.version_code)[0];

  const navItems = useMemo(
    () => [
      { id: "home" as const, label: "HOME", title: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { id: "website" as const, label: "SITE CMS", title: "Website", icon: <Globe className="h-4 w-4" /> },
      { id: "app" as const, label: "APP ECOSYSTEM", title: "MoPlayer", icon: <Smartphone className="h-4 w-4" /> },
    ],
    [],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (key === "escape") setPaletteOpen(false);
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        if (key === "s") setView("app");
        if (key === "n") setView("website");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="command-center min-h-screen overflow-hidden bg-black text-slate-200">
      <div className="command-bg" aria-hidden />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} setView={setView} />

      <header className="command-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-cyan-200/15 bg-cyan-200/8 shadow-[0_0_34px_rgba(91,220,255,0.18)]">
            <Image src="/images/logo.png" alt="Moalfarras Admin" width={44} height={44} className="h-10 w-10 rounded-2xl object-contain" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-black uppercase tracking-[0.28em] text-cyan-200">Digital Command Center</p>
            <p className="truncate text-xs font-bold text-slate-500">{adminEmail} / {role}</p>
          </div>
        </div>

        <div className="hidden rounded-full border border-white/10 bg-white/[0.045] p-1 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn("command-tab", view === item.id && "command-tab-active")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setPaletteOpen(true)} className="command-icon-button" aria-label="Open command palette">
            <Command className="h-4 w-4" />
          </button>
          <form action={logoutAdminAction}>
            <button type="submit" className="command-icon-button text-red-200/80" aria-label="Sign out">
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </form>
        </div>
      </header>

      <nav className="command-mobile-dock">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setView(item.id)} className={cn("command-dock-item", view === item.id && "command-dock-item-active")}>
            {item.icon}
            <span>{item.title}</span>
          </button>
        ))}
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 pb-28 pt-24 sm:px-6 md:px-8 md:pb-10 lg:px-10">
        <AnimatePresence mode="wait">
          {view === "home" ? (
            <motion.div key="home" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6 md:space-y-8">
              <section className="command-hero">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/8 px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                    Server Health Online
                  </div>
                  <div>
                    <h1 className="headline-display text-4xl font-black leading-[0.95] text-white sm:text-5xl md:text-7xl">Ultimate Admin OS.</h1>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
                      A native-feeling control center for moalfarras.space and MoPlayer: website CMS entry points, APK releases, runtime switches, support, licenses, activations, and device fleet signals.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <SystemMetric label="Fleet Devices" value={`${devices.length}`} />
                    <SystemMetric label="Active Licenses" value={`${activeLicenses}`} tone="green" />
                    <SystemMetric label="Pending Codes" value={`${waitingActivations}`} tone="amber" />
                  </div>
                </div>
                <div className="command-hud">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Heartbeat</p>
                      <p className="mt-1 text-xl font-black text-white">Production Roots</p>
                    </div>
                    <Activity className="h-6 w-6 text-cyan-200" />
                  </div>
                  <div className="heartbeat-line" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Public Site</p>
                      <p className="mt-1 text-sm font-black text-emerald-200">moalfarras.space</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Admin PWA</p>
                      <p className="mt-1 text-sm font-black text-cyan-100">standalone ready</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Deploy Web", text: "Open the Website CMS and ship through Vercel.", icon: <Zap className="h-5 w-5" />, view: "website" as const },
                  { label: "Clear Cache", text: "Review site settings and publishing state.", icon: <DatabaseZap className="h-5 w-5" />, view: "website" as const },
                  { label: "Sync Fleet", text: "Open MoPlayer runtime and device signals.", icon: <RadioTower className="h-5 w-5" />, view: "app" as const },
                ].map((action) => (
                  <motion.button key={action.label} whileHover={{ y: -5, scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={() => setView(action.view)} className="command-action-card">
                    <span className="command-action-icon">{action.icon}</span>
                    <span className="text-left">
                      <strong>{action.label}</strong>
                      <small>{action.text}</small>
                    </span>
                  </motion.button>
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <button onClick={() => setView("website")} className="command-module-card command-module-card-cyan">
                  <Globe className="h-9 w-9" />
                  <span>Website CMS</span>
                      <p>Supabase powered content, media, messages, projects, and public site controls.</p>
                </button>
                <button onClick={() => setView("app")} className="command-module-card command-module-card-ice">
                  <Smartphone className="h-9 w-9" />
                  <span>App Ecosystem</span>
                  <p>Runtime config, releases, activation queue, licenses, support, and product assets.</p>
                </button>
              </section>

              <section className="command-status-strip">
                <CircleGauge className="h-5 w-5 text-cyan-200" />
                <span>Latest release: <strong>{latestRelease?.version_name ?? product.default_download_label}</strong></span>
                <span>Runtime: <strong>{runtimeConfig.enabled ? "Online" : "Offline"}</strong></span>
                <span>Maintenance: <strong>{runtimeConfig.maintenanceMode ? "On" : "Off"}</strong></span>
                {updated ? <span>Last action: <strong>{updated}</strong></span> : null}
              </section>
            </motion.div>
          ) : null}

          {view === "app" ? (
            <motion.div key="app" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
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
          ) : null}

          {view === "website" ? (
            <motion.div key="website" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }}>
              <WebsiteAdminDashboard data={website} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}
