"use client";

import type { ReactNode } from "react";
import {
  Globe,
  FileText,
  Briefcase,
  PlayCircle,
  MessageSquare,
  Image as ImageIcon,
  Search,
  Settings,
  ArrowRight,
  Zap,
  TrendingUp,
  ShieldCheck,
  ExternalLink,
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
    href: string;
  }[] = [
    {
      id: "home",
      icon: <Globe className="h-5 w-5" />,
      title: "Homepage Story",
      desc: "Digital OS hero, proof badges, story arc, and primary CTAs.",
      href: p("/admin/pages"),
    },
    {
      id: "cv",
      icon: <FileText className="h-5 w-5" />,
      title: "CV Builder",
      desc: "Profile, timeline, skills, languages, projects, and exports.",
      href: p("/admin/cv"),
    },
    {
      id: "projects",
      icon: <Briefcase className="h-5 w-5" />,
      title: "Work Case Studies",
      desc: "Project challenge, solution, stack, visuals, and live links.",
      href: p("/admin/projects"),
    },
    {
      id: "youtube",
      icon: <PlayCircle className="h-5 w-5" />,
      title: "Media Studio",
      desc: "Creator stats, content categories, collaboration copy, and videos.",
      href: p("/admin/pages"),
    },
    {
      id: "leads",
      icon: <MessageSquare className="h-5 w-5" />,
      title: "Contact & site copy",
      desc: "Homepage sections, contact narrative, and bilingual strings in Pages.",
      href: p("/admin/pages"),
    },
    {
      id: "seo",
      icon: <Search className="h-5 w-5" />,
      title: "SEO & Metadata",
      desc: "Structured content and branding fields alongside site settings.",
      href: p("/admin/settings"),
    },
    {
      id: "media",
      icon: <ImageIcon className="h-5 w-5" />,
      title: "Media Library",
      desc: "Logo, portrait, project screenshots, MoPlayer screens, and alt text.",
      href: p("/admin/media"),
    },
    {
      id: "theme",
      icon: <Settings className="h-5 w-5" />,
      title: "Theme & Branding",
      desc: "Digital OS colors, navigation context, and footer facts via Settings.",
      href: p("/admin/settings"),
    },
  ];

  return (
    <div className="space-y-10">
      <section className="glass relative overflow-hidden rounded-[3rem] border-white/5 p-10 md:p-14">
        <div className="absolute right-0 top-0 p-10 opacity-10">
          <Globe className="h-32 w-32 text-cyan-400" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Website CMS</p>
          </div>
          <h1 className="headline-display text-4xl font-black tracking-tight text-white md:text-6xl">Website Control</h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-400">
            Opens <span className="font-mono text-cyan-200/90">{base}</span> admin routes in a new tab. Sign in on the site if prompted.
          </p>

          <div className="flex flex-wrap gap-6 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-cyan-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">CMS locale</p>
                <p className="text-sm font-black text-white">{locale}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security</p>
                <p className="text-sm font-black text-white">Same Supabase session rules</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Deploy</p>
                <p className="text-sm font-black text-white">Root: apps/web</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m, idx) => (
          <motion.a
            key={m.id}
            href={m.href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group relative glass flex flex-col rounded-[2.5rem] border-white/5 p-8 transition-all hover:border-cyan-500/25 hover:bg-white/[0.03]"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-500 group-hover:scale-110 group-hover:border-cyan-400 group-hover:bg-cyan-500 group-hover:text-black">
              {m.icon}
            </div>
            <h3 className="text-xl font-black tracking-tight text-white">{m.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{m.desc}</p>
            <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/0 transition-all duration-500 group-hover:text-cyan-400">
              Open in site admin
              <ExternalLink className="h-3 w-3" />
              <ArrowRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
            </div>
          </motion.a>
        ))}
      </div>

      <section className="glass flex flex-col items-center justify-between gap-8 rounded-[3rem] border border-white/5 bg-cyan-500/[0.02] p-10 md:flex-row">
        <div className="flex items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/5">
            <Settings className="h-8 w-8 text-slate-500" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Publishing</h2>
            <p className="mt-1 text-sm text-slate-400">Ship changes via your usual git → Vercel flow for the <strong className="text-white">mohammad-alfarras</strong> project (root <code className="text-cyan-300">apps/web</code>).</p>
          </div>
        </div>
        <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Production</div>
      </section>
    </div>
  );
}
