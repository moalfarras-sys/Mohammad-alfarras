"use client";

import { Globe, FileText, Briefcase, PlayCircle, MessageSquare, Image as ImageIcon, Search, Settings, ArrowRight, Zap, TrendingUp, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function WebsiteAdminDashboard() {
  const modules = [
    { id: "home", icon: <Globe className="h-5 w-5" />, title: "Homepage Story", desc: "Digital OS hero, proof badges, story arc, and primary CTAs." },
    { id: "cv", icon: <FileText className="h-5 w-5" />, title: "CV Builder", desc: "Profile, timeline, skills, languages, projects, and exports." },
    { id: "projects", icon: <Briefcase className="h-5 w-5" />, title: "Work Case Studies", desc: "Project challenge, solution, stack, visuals, and live links." },
    { id: "youtube", icon: <PlayCircle className="h-5 w-5" />, title: "Media Studio", desc: "Creator stats, content categories, collaboration copy, and videos." },
    { id: "leads", icon: <MessageSquare className="h-5 w-5" />, title: "Contact Leads", desc: "Website requests, product reviews, MoPlayer support, and replies." },
    { id: "seo", icon: <Search className="h-5 w-5" />, title: "SEO & Metadata", desc: "Titles, descriptions, social cards, JSON-LD, and index signals." },
    { id: "media", icon: <ImageIcon className="h-5 w-5" />, title: "Media Library", desc: "Logo, portrait, project screenshots, MoPlayer screens, and alt text." },
    { id: "theme", icon: <Settings className="h-5 w-5" />, title: "Theme & Branding", desc: "Digital OS colors, navigation, footer facts, and visual consistency." },
  ];

  return (
    <div className="space-y-10">
      {/* Header Panel */}
      <section className="relative overflow-hidden glass rounded-[3rem] p-10 md:p-14 border-white/5">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Globe className="h-32 w-32 text-cyan-400" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
             <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Live Production</p>
          </div>
          <h1 className="headline-display text-4xl font-black text-white md:text-6xl tracking-tight">Website Control</h1>
          <p className="max-w-2xl text-lg text-slate-400 leading-relaxed">
            A structured control surface for the public website: brand story, CV, work, YouTube, contact, media, and SEO.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-6">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/10">
                   <Zap className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Performance</p>
                   <p className="text-sm font-black text-white">Build verified</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/10">
                   <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security</p>
                   <p className="text-sm font-black text-white">Protected admin</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-violet-400 border border-white/10">
                   <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Visibility</p>
                   <p className="text-sm font-black text-white">Metadata managed</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative glass rounded-[2.5rem] p-8 border-white/5 hover:border-cyan-500/20 transition-all hover:bg-white/[0.02]"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-300 border border-white/10 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400 transition-all duration-500">
              {m.icon}
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{m.desc}</p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/0 transition-all duration-500 group-hover:text-cyan-500 group-hover:translate-x-1">
              Access Module <ArrowRight className="h-3 w-3" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Publishing Status */}
      <section className="glass rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 border-white/5 bg-cyan-500/[0.01]">
         <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center border border-white/10">
               <Settings className="h-8 w-8 text-slate-500" />
            </div>
            <div>
               <h2 className="text-xl font-black text-white tracking-tight">Publishing Status</h2>
               <p className="text-sm text-slate-400 mt-1">Content edits are reviewed and shipped through the project deployment workflow.</p>
            </div>
         </div>
         <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            Status Only
         </div>
      </section>
    </div>
  );
}
