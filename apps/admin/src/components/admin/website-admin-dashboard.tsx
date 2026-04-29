"use client";

import type { ReactNode } from "react";
import {
  ArrowRight,
  Briefcase,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  MessageSquare,
  PlayCircle,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";

function cmsBaseAndLocale() {
  const base = (process.env.NEXT_PUBLIC_WEB_APP_URL || "https://moalfarras.space").replace(/\/$/, "");
  const locale = (process.env.NEXT_PUBLIC_WEB_ADMIN_DEFAULT_LOCALE || "en").replace(/^\//, "");
  return { base, locale };
}

export function WebsiteAdminDashboard() {
  const { base, locale } = cmsBaseAndLocale();
  const p = (path: string) => `${base}/${locale}${path}`;

  const modules: {
    id: string;
    icon: ReactNode;
    title: string;
    desc: string;
    action: string;
    href: string;
  }[] = [
    { id: "home", icon: <Globe className="h-5 w-5" />, title: "Homepage Story", desc: "Edit hero copy, proof badges, story sections, and main calls to action.", action: "Opens the page content editor.", href: p("/admin/pages") },
    { id: "cv", icon: <FileText className="h-5 w-5" />, title: "CV Builder", desc: "Update profile, timeline, skills, languages, project highlights, and exports.", action: "Opens the CV control engine.", href: p("/admin/cv") },
    { id: "projects", icon: <Briefcase className="h-5 w-5" />, title: "Case Studies", desc: "Manage project names, descriptions, stack, screenshots, and links.", action: "Opens project editing tools.", href: p("/admin/projects") },
    { id: "youtube", icon: <PlayCircle className="h-5 w-5" />, title: "Media Studio", desc: "Control YouTube proof, categories, collaboration copy, and video framing.", action: "Opens the shared pages editor.", href: p("/admin/pages") },
    { id: "copy", icon: <MessageSquare className="h-5 w-5" />, title: "Contact & Copy", desc: "Polish bilingual contact text, CTA clarity, and visitor instructions.", action: "Opens editable site copy.", href: p("/admin/pages") },
    { id: "seo", icon: <Search className="h-5 w-5" />, title: "SEO & Metadata", desc: "Review search-facing titles, descriptions, indexing, and brand metadata.", action: "Opens site settings.", href: p("/admin/settings") },
    { id: "media", icon: <ImageIcon className="h-5 w-5" />, title: "Media Library", desc: "Upload, inspect, and swap logo, portrait, project, and MoPlayer assets.", action: "Opens the drag-and-drop media library.", href: p("/admin/media") },
    { id: "theme", icon: <Settings className="h-5 w-5" />, title: "Theme & Branding", desc: "Review global colors, footer facts, navigation, and publishing status.", action: "Opens visual/site controls.", href: p("/admin/settings") },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="glass relative overflow-hidden rounded-[2rem] border-white/5 p-6 sm:p-8 md:rounded-[3rem] md:p-14">
        <div className="absolute right-0 top-0 p-8 opacity-10 md:p-10">
          <Globe className="h-20 w-20 text-cyan-400 md:h-32 md:w-32" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Website CMS</p>
          </div>
          <h1 className="headline-display text-3xl font-black tracking-tight text-white sm:text-4xl md:text-6xl">Website Control</h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            Open <span className="font-mono text-cyan-200/90">{base}</span> control routes in a new tab. The public site keeps its own session rules and locale-aware editing surfaces.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-[1.6rem] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">CMS locale</p>
                  <p className="text-sm font-black text-white">{locale}</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-[1.6rem] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security</p>
                  <p className="text-sm font-black text-white">Same auth boundary</p>
                </div>
              </div>
            </div>
            <div className="glass rounded-[1.6rem] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Deploy root</p>
                  <p className="text-sm font-black text-white">apps/web</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, idx) => (
          <motion.a
            key={m.id}
            href={m.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative glass flex min-h-[15rem] flex-col rounded-[2rem] border-white/5 p-6 transition-all hover:border-cyan-500/25 hover:bg-white/[0.03] md:rounded-[2.5rem] md:p-8"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-500 group-hover:scale-110 group-hover:border-cyan-400 group-hover:bg-cyan-500 group-hover:text-black">
              {m.icon}
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">{m.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{m.desc}</p>
            <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-[11px] font-bold leading-5 text-slate-400">
              {m.action}
            </p>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Open module
              <ExternalLink className="h-3 w-3" />
              <ArrowRight className="h-3 w-3 transition-all group-hover:translate-x-0.5" />
            </div>
          </motion.a>
        ))}
      </div>

      <section className="glass flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-white/5 bg-cyan-500/[0.02] p-6 md:flex-row md:items-center md:rounded-[3rem] md:p-10">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5">
            <Settings className="h-8 w-8 text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Publishing</h2>
            <p className="mt-1 text-sm text-slate-400">
              Ship changes through the normal git to Vercel flow for the <strong className="text-white">mohammad-alfarras</strong> project rooted at <code className="text-cyan-300">apps/web</code>.
            </p>
          </div>
        </div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Production</div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-[2rem] border border-white/5 p-6 md:rounded-[2.5rem] md:p-8">
          <h2 className="text-xl font-black tracking-tight text-white">Admin access reset</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Passwords are never shown in this dashboard. To reset access, update the secure environment variables or Supabase admin role, then redeploy the admin project.
          </p>
          <div className="mt-5 grid gap-2 text-xs leading-6 text-slate-500">
            <span>Allowed identities are controlled by the admin allowlist.</span>
            <span>Hashed passwords and session secrets stay server-side only.</span>
          </div>
        </div>
        <div className="glass rounded-[2rem] border border-white/5 p-6 md:rounded-[2.5rem] md:p-8">
          <h2 className="text-xl font-black tracking-tight text-white">Why modules open the site</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            The editing engines still live in the public web app for data safety. This command center is now the single entry point, while each module opens the exact secured editor that already writes to the live content model.
          </p>
        </div>
      </section>
    </div>
  );
}
