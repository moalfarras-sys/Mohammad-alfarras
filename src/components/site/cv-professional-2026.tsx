"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, CloudLightning, Download, Globe, Layers, MapPin, Zap } from "lucide-react";
import type { SiteViewModel } from "./site-view-client";

type CvLinksSetting = {
  ar?: string;
  en?: string;
  de?: string;
  portrait?: string;
};

export function CvProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale, experience } = model;
  const cvLinks = (model.settings?.cv_links?.value_json ?? {}) as CvLinksSetting;

  const cvPortrait = cvLinks.portrait || "/images/portrait.jpg";
  const cvAr = cvLinks.ar || "/Lebenslauf.pdf";
  const cvEn = cvLinks.en || "/Lebenslauf.pdf";
  const cvDe = cvLinks.de || "/Lebenslauf.pdf";

  // Timeline entries (Only using Database Experiences, plus the single authentic Rhenus entry if empty)
  const cmsEntries = experience.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    period: e.period,
    location: e.location,
    story: (locale === "ar" && e.description) ? e.description : (e.description || "Detailed experience logged internally."),
    highlights: e.highlights || [],
  }));

  const fallbackEntries = [
    {
      id: "fb-1",
      company: "Rhenus Home Delivery GmbH",
      role: "Dispositionsmitarbeiter",
      period: "Prior Experience",
      location: locale === "ar" ? "ألمانيا" : "Germany",
      story: locale === "ar" 
        ? "تنظيم وإدارة مهام السائقين بدقة عالية، والتعامل المباشر مع العملاء عبر أنظمة إدارة النقل (TMS) لضمان تسليم خالي من الأخطاء تحت ضغط العمل المستمر."
        : "Structured driver coordination and robust customer service operations leveraging modern TMS to ensure flawless execution under daily high-pressure scenarios.",
      highlights: ["TMS System", "Fahrerbetreuung", "Kundendienst"],
    }
  ];

  const timeline = cmsEntries.length > 0 ? cmsEntries : fallbackEntries;

  // Language Data with flags and exact percentages
  const languages = [
    { code: "ar", label: locale === "ar" ? "العربية" : "Arabic", level: locale === "ar" ? "اللغة الأم" : "Native", pct: 100, flag: "🇸🇦", color: "#00ff87" },
    { code: "en", label: locale === "ar" ? "الإنجليزية" : "English", level: "Fluent (C1)", pct: 90, flag: "🇬🇧", color: "#06b6d4" },
    { code: "de", label: locale === "ar" ? "الألمانية" : "German", level: "Advanced (B2)", pct: 85, flag: "🇩🇪", color: "#ff6b00" },
  ];

  const coreSkills = [
    { label: locale === "ar" ? "Next.js / React" : "Next.js / React", pct: 95, color: "#00ff87" },
    { label: locale === "ar" ? "UI/UX & واجهات" : "UI/UX & Interfaces", pct: 88, color: "#a855f7" },
    { label: locale === "ar" ? "التنفيذيات اللوجستية" : "Logistics Execution", pct: 92, color: "#ff6b00" },
  ];

  // Bento Variants
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 40, filter: "blur(12px)", scale: 0.95 },
    show: { opacity: 1, y: 0, filter: "blur(0px)", scale: 1, transition: { type: "spring" as const, stiffness: 70, damping: 15 } },
  };

  return (
    <div className="relative min-h-screen py-32 overflow-hidden" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="cv-page">
      
      {/* Immersive Void Background with animated particles */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#04060A]" />
      <motion.div
        animate={{ filter: ["blur(40px)", "blur(60px)", "blur(40px)"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-30"
        style={{
          background: "radial-gradient(circle at 15% 30%, rgba(0,255,135,0.12) 0%, transparent 50%), radial-gradient(circle at 85% 70%, rgba(168,85,247,0.12) 0%, transparent 50%)",
        }}
      />

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-12 gap-8 w-full">
          
          {/* Main Hero Identity (Span 12 -> full width banner) */}
          <motion.div
            variants={item}
            whileHover={{ boxShadow: "0 25px 60px -12px rgba(0,255,135,0.1)" }}
            className="md:col-span-12 flex flex-col md:flex-row items-center md:items-start gap-10 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group"
            style={{
              background: "linear-gradient(145deg, rgba(14, 20, 35, 0.7) 0%, rgba(8, 12, 20, 0.9) 100%)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Magnetic Glow Tracker Approximation */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#00ff87] rounded-full mix-blend-screen filter blur-[150px] opacity-0 group-hover:opacity-10 transition-opacity duration-700 pointer-events-none" />

            {/* Profile Picture with rotation anim */}
            <div className="shrink-0 relative">
              <motion.div 
                whileHover={{ rotate: 3, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden relative ring-[6px] ring-black shadow-2xl"
              >
                {/* Neon Ring */}
                <div className="absolute inset-0 rounded-full border-[2px] border-[#00ff87]/30 z-10 pointer-events-none" />
                <Image
                  src={cvPortrait}
                  alt={model.profile.name}
                  fill
                  sizes="(max-width: 768px) 160px, 224px"
                  className="object-cover"
                />
              </motion.div>
            </div>

            <div className="flex-1 flex flex-col justify-center text-center md:text-start pt-4">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold w-fit mb-5 mx-auto md:mx-0"
                style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)", color: "#00ff87" }}>
                <span className="h-2 w-2 rounded-full bg-[#00ff87] animate-pulse shadow-[0_0_8px_#00ff87]" />
                {locale === "ar" ? "جاهز للعمل والمشاركة" : "Available for opportunities"}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white headline-arabic leading-tight mb-2 tracking-tight">
                {model.profile.name}
              </h1>
              <p className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff87] to-[#06b6d4] font-mono text-sm tracking-widest uppercase mb-6 font-bold">
                {model.profile.subtitle}
              </p>
              <p className="text-foreground-muted text-base leading-8 max-w-2xl mx-auto md:mx-0">
                {locale === "ar" 
                  ? "السيرة الذاتية ليست مجرد ورق؛ إنها إثبات لقدرات التنفيذ. من الدقة الصارمة في العمليات اللوجستية إلى بناء الواجهات وحلول الويب القوية، أدمج العقلية الهندسية مع الحس البصري المبهر."
                  : "A resume isn't just paper; it is proof of execution. Bridging strict logistics discipline with cutting-edge digital development and content creation."}
              </p>
            </div>
          </motion.div>

          {/* Languages Component (Span 5) */}
          <motion.div
            variants={item}
            className="md:col-span-5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden"
            style={{
              background: "rgba(10, 15, 25, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Globe className="w-6 h-6 text-[#00ff87]" />
                {locale === "ar" ? "اللغات" : "Languages"}
              </h3>
            </div>

            <div className="space-y-8">
              {languages.map((lng, i) => (
                <div key={lng.code} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl filter drop-shadow-md">{lng.flag}</span>
                      <div>
                        <span className="text-white font-bold block">{lng.label}</span>
                        <span className="text-xs text-foreground-soft font-mono uppercase tracking-wider">{lng.level}</span>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-black" style={{ color: lng.color }}>{lng.pct}%</span>
                  </div>
                  {/* Glowing Track */}
                  <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${lng.pct}%` }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                      className="absolute top-0 bottom-0 left-0 rounded-full"
                      style={{ 
                        background: `linear-gradient(90deg, transparent, ${lng.color})`, 
                        boxShadow: `0 0 20px ${lng.color}` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* PDF Download Cards (Span 7) */}
          <motion.div
            variants={item}
            className="md:col-span-7 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden flex flex-col justify-between"
            style={{
              background: "rgba(10, 15, 25, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
              <CloudLightning className="w-64 h-64 text-white" />
            </div>

            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
              <Download className="w-6 h-6 text-[#a855f7]" />
              {locale === "ar" ? "تحميل النسخ بصيغة PDF" : "Download PDF Versions"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.a 
                whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                href={cvEn} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#06b6d4]/10 flex items-center justify-center border border-[#06b6d4]/20">
                  <span className="text-xl">🇬🇧</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-white block">English Version</span>
                  <span className="text-xs text-foreground-soft font-mono uppercase">Curriculum Vitae</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-foreground-soft group-hover:text-white transition-colors" />
              </motion.a>

              <motion.a 
                whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                href={cvDe} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#ff6b00]/10 flex items-center justify-center border border-[#ff6b00]/20">
                  <span className="text-xl">🇩🇪</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-white block">German Version</span>
                  <span className="text-xs text-foreground-soft font-mono uppercase">Lebenslauf</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-foreground-soft group-hover:text-white transition-colors" />
              </motion.a>

              <motion.a 
                whileHover={{ scale: 1.02, y: -2, backgroundColor: "rgba(255,255,255,0.08)" }}
                href={cvAr} target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5 transition-all group md:col-span-2"
              >
                <div className="w-12 h-12 rounded-full bg-[#00ff87]/10 flex items-center justify-center border border-[#00ff87]/20">
                  <span className="text-xl">🇸🇦</span>
                </div>
                <div className="flex-1">
                  <span className="font-bold text-white block">النسخة العربية</span>
                  <span className="text-xs text-foreground-soft font-mono uppercase">السيرة الذاتية</span>
                </div>
                <ArrowUpRight className="w-5 h-5 text-foreground-soft group-hover:text-white transition-colors" />
              </motion.a>
            </div>
          </motion.div>

          {/* Interactive Skills (Span 5) */}
          <motion.div
            variants={item}
            className="md:col-span-5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden"
            style={{
              background: "rgba(10, 15, 25, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <h3 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
              <Zap className="w-6 h-6 text-[#ff6b00]" />
              {locale === "ar" ? "المهارات الدقيقة" : "Core Competencies"}
            </h3>

            <div className="space-y-6">
              {coreSkills.map((skill, i) => (
                <div key={skill.label} className="group cursor-default">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-black text-white/90 group-hover:text-white transition-colors">{skill.label}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: skill.color }}>{skill.pct}%</span>
                  </div>
                  <div className="h-[4px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: skill.color, boxShadow: `0 0 15px ${skill.color}aa` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {["TypeScript", "Framer Motion", "React", "Next.js", "TailwindCSS", "Supabase", "TMS Systems"].map(t => (
                <span key={t} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-white/80 border border-white/10 hover:border-[#00ff87]/40 hover:text-[#00ff87] transition-colors cursor-default">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Professional Timeline (Span 7) */}
          <motion.div
            variants={item}
            className="md:col-span-7 rounded-[2.5rem] p-8 md:p-10 relative"
            style={{
              background: "rgba(10, 15, 25, 0.4)",
              border: "1px solid rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Layers className="w-6 h-6 text-[#06b6d4]" />
                {locale === "ar" ? "المسار المهني" : "Professional Journey"}
              </h3>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:ml-[22px] md:before:translate-x-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#00ff87] before:via-[#a855f7] before:to-transparent">
              {timeline.map((entry, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  key={entry.id} 
                  className="relative pl-8 md:pl-16 group"
                >
                  {/* Glowing Node Point */}
                  <div className="absolute left-0 top-1.5 md:top-2 w-4 h-4 md:w-5 md:h-5 rounded-full border-4 border-black bg-[#00ff87] shadow-[0_0_15px_#00ff87] md:translate-x-2" />
                  
                  <div className="bg-white/[0.02] border border-white/5 group-hover:border-white/10 rounded-2xl p-6 transition-colors duration-300">
                    <div className="flex flex-col md:flex-row md:justify-between tracking-wide gap-3 mb-4">
                      <div>
                        <h4 className="text-xl font-black text-white">{entry.company}</h4>
                        <p className="text-sm font-semibold text-[#00ff87] mt-1 bg-[#00ff87]/10 px-3 py-1 rounded-full w-fit">{entry.role}</p>
                      </div>
                      <div className="flex md:flex-col items-start md:items-end gap-2 text-xs font-mono text-foreground-soft">
                        <span className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white">{entry.period}</span>
                        {entry.location && <span className="flex items-center gap-1.5 opacity-80"><MapPin className="w-3.5 h-3.5" /> {entry.location}</span>}
                      </div>
                    </div>
                    <p className="text-foreground-muted text-sm leading-relaxed mb-5">
                      {entry.story}
                    </p>
                    {entry.highlights && entry.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.highlights.map(h => (
                          <span key={h} className="inline-flex items-center text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white">
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
