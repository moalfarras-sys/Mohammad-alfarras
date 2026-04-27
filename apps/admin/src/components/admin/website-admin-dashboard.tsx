"use client";

import { Globe, FileText, Briefcase, PlayCircle, MessageSquare, Image as ImageIcon, Search, Settings, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function WebsiteAdminDashboard() {
  const modules = [
    { id: "cv", icon: <FileText />, title: "CV Builder", desc: "Manage personal info, experience, and skills." },
    { id: "projects", icon: <Briefcase />, title: "Projects / Work", desc: "Add or edit portfolio case studies." },
    { id: "youtube", icon: <PlayCircle />, title: "YouTube Stats", desc: "Update view counts and channel data." },
    { id: "leads", icon: <MessageSquare />, title: "Contact Leads", desc: "View inbound project inquiries." },
    { id: "media", icon: <ImageIcon />, title: "Media Library", desc: "Upload logos and project mockups." },
    { id: "seo", icon: <Search />, title: "SEO / Metadata", desc: "Manage page titles and OG tags." },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card p-8 md:p-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="eyebrow">Website Control</p>
            <h1 className="headline-display text-4xl font-black md:text-5xl">Digital Ecosystem</h1>
            <p className="max-w-2xl text-lg text-foreground-muted">
              Manage your personal brand, CV, YouTube stats, and portfolio content.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, idx) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card group relative p-6 transition-all hover:bg-white/[0.03]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-warm/10 text-accent-warm ring-1 ring-accent-warm/30 group-hover:scale-110 transition-transform">
              {m.icon}
            </div>
            <h3 className="text-xl font-bold text-foreground">{m.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{m.desc}</p>
            <div className="mt-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-warm opacity-0 transition-opacity group-hover:opacity-100">
              Manage <ArrowRight className="h-3 w-3" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
        <Settings className="mb-4 h-10 w-10 text-foreground-muted opacity-20" />
        <h2 className="text-lg font-bold">Content Synchronization</h2>
        <p className="mt-2 max-w-md text-sm text-foreground-muted">
          All changes here are instantly pushed to the public website via Supabase Realtime.
        </p>
      </div>
    </div>
  );
}
