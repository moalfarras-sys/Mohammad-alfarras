"use client";

import { useState } from "react";
import { AppAdminDashboard } from "./app-admin-dashboard";
import { WebsiteAdminDashboard } from "./website-admin-dashboard";
import { Globe, Smartphone, ArrowLeft, Activity, LayoutDashboard, MessageSquare, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";

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
    <div className="relative min-h-screen overflow-hidden bg-[#020617] font-sans selection:bg-cyan-500/30">
      {/* Animated Mesh Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(124,58,237,0.12),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* OS Top Bar */}
      <header className="relative z-50 flex h-16 w-full items-center justify-between border-b border-white/5 bg-slate-950/40 px-8 backdrop-blur-2xl">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-black shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
               <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Digital OS</span>
               <span className="text-[9px] font-bold uppercase tracking-widest text-cyan-500/80">Command Center</span>
            </div>
          </div>
          <nav className="hidden h-full items-center gap-2 md:flex">
             {[
               { id: "home", label: "Dashboard", icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
               { id: "website", label: "Website Control", icon: <Globe className="h-3.5 w-3.5" /> },
               { id: "app", label: "MoPlayer Control", icon: <Smartphone className="h-3.5 w-3.5" /> },
             ].map((item) => (
               <button 
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  view === item.id ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
               >
                 {item.icon}
                 {item.label}
               </button>
             ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-2 md:flex">
             <div className="relative flex h-2 w-2">
               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
               <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{adminEmail}</span>
           </div>
           <form action={logoutAdminAction}>
              <button type="submit" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400/70 hover:text-red-400 transition-colors">
                <span>Shutdown</span>
                <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-1" />
              </button>
           </form>
        </div>
      </header>

      <main className="relative z-10 p-8 md:p-12">
        <div className="mx-auto max-w-[1400px]">
          <AnimatePresence mode="wait">
            {view === "home" && (
              <motion.div 
                key="home" 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                {/* Hero */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="h-px w-6 bg-cyan-500" />
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">System v4.0.0</p>
                    </div>
                    <h1 className="headline-display text-5xl font-black text-white md:text-7xl tracking-tight">Digital OS Control</h1>
                    <p className="max-w-2xl text-lg text-slate-400 leading-relaxed">
                      A focused command center for the public brand, CV system, media studio, and MoPlayer ecosystem.
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                     <div className="glass rounded-[2rem] p-6 border-white/5 flex flex-col items-center justify-center min-w-[140px]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</span>
                        <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">Active</span>
                     </div>
                     <div className="glass rounded-[2rem] p-6 border-white/5 flex flex-col items-center justify-center min-w-[140px]">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Mode</span>
                        <span className="text-sm font-black text-white uppercase tracking-widest">Manual</span>
                     </div>
                  </div>
                </div>

                {/* Grid Modules */}
                <div className="grid gap-8 md:grid-cols-2">
                  <motion.button
                    whileHover={{ y: -8, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setView("website")}
                    className="relative group overflow-hidden glass rounded-[3.5rem] p-12 text-center border-white/5 hover:border-cyan-500/30 transition-all duration-500"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 text-white border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black group-hover:shadow-[0_0_40px_rgba(34,211,238,0.4)]">
                        <Globe className="h-10 w-10" />
                      </div>
                      <h2 className="text-3xl font-black text-white tracking-tight">Website Control</h2>
                      <p className="mt-4 mx-auto max-w-sm text-[15px] leading-relaxed text-slate-400">
                        Edit homepage story, case studies, CV, media kit, contact surface, and SEO metadata.
                      </p>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ y: -8, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setView("app")}
                    className="relative group overflow-hidden glass rounded-[3.5rem] p-12 text-center border-white/5 hover:border-violet-500/30 transition-all duration-500"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10">
                      <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-white/5 text-white border border-white/10 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white group-hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]">
                        <Smartphone className="h-10 w-10" />
                      </div>
                      <h2 className="text-3xl font-black text-white tracking-tight">MoPlayer Control</h2>
                      <p className="mt-4 mx-auto max-w-sm text-[15px] leading-relaxed text-slate-400">
                        Manage releases, activations, devices, runtime config, support, and app messaging.
                      </p>
                    </div>
                  </motion.button>
                </div>
                
                {/* Stats Widgets */}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                  {[
                    { label: "Active SDK", value: `API ${product.android_target_sdk}`, icon: <Activity className="text-cyan-400" /> },
                    { label: "Fleet Count", value: `${devices.length} Devices`, icon: <Terminal className="text-violet-400" /> },
                    { label: "Pending Activation", value: `${activationRequests.filter(r => r.status === 'waiting').length} Req`, icon: <MessageSquare className="text-amber-400" /> },
                    { label: "Support Queue", value: `${supportRequests.filter(s => s.status === 'new').length} Open`, icon: <Activity className="text-red-400" /> },
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="glass rounded-[2rem] p-8 border-white/5 flex flex-col items-center justify-center text-center"
                    >
                       <div className="mb-4 h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                         {stat.icon}
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
                       <p className="text-xl font-black text-white">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {(() => {
                  const published = releases.filter((r) => r.is_published);
                  const top = [...published].sort((a, b) => b.version_code - a.version_code)[0]
                    ?? [...releases].sort((a, b) => b.version_code - a.version_code)[0];
                  if (!top) return null;
                  return (
                    <p className="text-center text-[13px] text-slate-500">
                      Latest tracked release:{" "}
                      <span className="font-black text-cyan-400/90">{top.version_name}</span>
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
