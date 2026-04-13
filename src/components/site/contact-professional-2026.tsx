"use client";

import { motion, Variants } from "framer-motion";
import { Clock, Mail, MessageCircleMore, Send, Zap } from "lucide-react";
import type { SiteViewModel } from "./site-view-client";
import { ContactForm } from "./contact-form";

export function ContactProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale, t } = model;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(12px) scale(0.95)" },
    show: { opacity: 1, y: 0, filter: "blur(0px) scale(1)", transition: { type: "spring" as const, stiffness: 80, damping: 15 } },
  };

  // The reasons are dynamic from the CMS/locale text
  const reasons = t.contact.reasons || [
    { title: "Project Inquiry", body: "Looking for high-end web dev." },
    { title: "Consulting", body: "Need logistics optimization." },
    { title: "Sponsorship", body: "YouTube channel partnership." }
  ];

  return (
    <div className="relative min-h-screen py-32 overflow-hidden" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="contact-page">
      {/* Immersive Void + Global Map Grid Pattern */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#04060A]" />
      
      {/* Fake Digital World Map / Grid Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-10"
         style={{
           backgroundImage: 'radial-gradient(rgba(0, 255, 135, 0.4) 1px, transparent 1px)',
           backgroundSize: '40px 40px',
           transform: 'perspective(1000px) rotateX(60deg) scale(2.5) translateY(-20%)',
           transformOrigin: 'top center',
         }}>
      </div>
      
      {/* Massive Glowing Neon Flare behind the Form */}
      <motion.div 
        animate={{ filter: ["blur(100px)", "blur(150px)", "blur(100px)"], scale: [1, 1.2, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 mix-blend-screen opacity-30 w-[800px] h-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 255, 135, 0.15) 0%, rgba(168, 85, 247, 0.05) 50%, transparent 70%)",
        }}
      />

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        {/* Availability Beacon & Header */}
        <div className="mb-16 md:mb-24 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full px-6 py-2 border mb-8 bg-black/40 backdrop-blur-xl"
            style={{ borderColor: "rgba(0, 255, 135, 0.3)", boxShadow: "0 0 30px rgba(0,255,135,0.1)" }}
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00ff87] drop-shadow-[0_0_8px_#00ff87]"></span>
            </span>
            <span className="text-sm font-bold tracking-widest uppercase text-white/90 font-mono">
              {locale === "ar" ? "متاح لاستقبال المشاريع (Available)" : "Available for New Opportunities"}
            </span>
          </motion.div>
          
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} 
            className="text-5xl md:text-7xl lg:text-8xl font-black text-white headline-arabic leading-[1.1] tracking-tight">
            {locale === "ar" ? "ابدأ بفكرة." : "Start with an Idea."}<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff87] to-[#06b6d4]">
              {locale === "ar" ? "سنبني الباقي." : "We'll Build the Rest."}
            </span>
          </motion.h1>
          
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-foreground-muted text-lg md:text-xl mt-6 max-w-2xl mx-auto font-semibold leading-9">
            {t.contact.body || (locale === "ar" 
              ? "سواء كنت تبحث عن تحول رقمي، دمج أنظمة لوجستية، أو واجهة مستخدم تزيد من المبيعات... تواصل معي مباشرة للتنفيذ الفوري."
              : "Whether you need a digital overhaul, logistics integrations, or a purely conversion-focused UI. Let's make it happen.")}
          </motion.p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 w-full">
          
          {/* Left Side: Communication Architecture & Methods */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Massive Direct Links */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4 mb-10 w-full">
              <a href={model.contact.whatsappUrl} target="_blank" rel="noopener noreferrer"
                 className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] text-black font-black uppercase tracking-wider transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_40px_rgba(0,255,135,0.2)]"
                 style={{ background: "linear-gradient(135deg, #00ff87, #00cc6e)" }}>
                 <MessageCircleMore className="w-6 h-6" /> WhatsApp
              </a>
              <a href={`mailto:${model.contact.emailAddress}`}
                 className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[2rem] text-white font-bold tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] bg-white/5 border border-white/10 hover:bg-white/10">
                 <Mail className="w-5 h-5 opacity-70" /> Email Me
              </a>
            </motion.div>

            <motion.h3 variants={item} className="text-2xl font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#ff6b00]" fill="currentColor" />
              {locale === "ar" ? "أسباب التواصل" : "Core Competencies"}
            </motion.h3>

            <div className="space-y-4">
              {reasons.map((reason, i) => {
                const colors = ["#00ff87", "#ff6b00", "#a855f7", "#06b6d4"];
                const color = colors[i % 4];
                return (
                  <motion.div key={i} variants={item}
                    whileHover={{ x: locale === "ar" ? -8 : 8, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="group relative p-6 rounded-[2rem] border border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md overflow-hidden"
                  >
                    {/* Hover Glow Edge inside the card */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                         style={{ boxShadow: `inset 0 0 0 1px ${color}55` }} />
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-screen filter blur-[60px] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none" 
                         style={{ background: color }} />
                         
                    <div className="relative flex items-start gap-5">
                      <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-transform group-hover:rotate-12"
                           style={{ background: `${color}15`, color: color, border: `1px solid ${color}33` }}>
                        0{i + 1}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white mb-2">{reason.title}</p>
                        <p className="text-sm font-semibold text-foreground-muted leading-relaxed group-hover:text-foreground-soft transition-colors tracking-wide">
                          {reason.body}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Response Time Guarantee Box */}
            <motion.div variants={item} className="mt-8 p-6 rounded-[2rem] flex items-center gap-5 relative overflow-hidden"
              style={{ background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)" }}>
              <Clock className="w-8 h-8 text-[#a855f7] shrink-0" />
              <div>
                <p className="font-bold text-white text-base mb-1">{t.contact.directTitle || (locale === "ar" ? "رد خلال 24 ساعة" : "24H Response SLA")}</p>
                <p className="text-sm text-foreground-muted">{t.contact.directBody || (locale === "ar" ? "أقوم بمراجعة جميع الطلبات والرد بخطة تنفيذ واضحة." : "All inquiries get reviewed directly with an actionable reply.")}</p>
              </div>
            </motion.div>

          </div>

          {/* Right Side: The Glassmorphic Contact Form */}
          <motion.div variants={item} className="lg:col-span-7 h-full">
            <div className="h-full rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-center border shadow-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(12,15,25,0.9), rgba(5,7,12,0.95))",
                borderColor: "rgba(0, 255, 135, 0.15)",
                backdropFilter: "blur(40px)",
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}>
              <div className="absolute top-0 right-0 w-1/2 h-40 bg-[#00ff87] rounded-full mix-blend-screen filter blur-[150px] opacity-[0.03] pointer-events-none" />
              
              <div className="mb-8">
                <h3 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                  <Send className="w-6 h-6 text-[#00ff87]" />
                  {locale === "ar" ? "نظام الإرسال المباشر" : "Direct Transmission"}
                </h3>
                <p className="text-foreground-muted font-semibold">
                  {locale === "ar" ? "تجاوز الروتين وأرسل بيانات مشروعك مباشرة ليتم تحليلها." : "Bypass the friction. Drop your requirements directly."}
                </p>
              </div>

              {/* Securely embedding his exact form logic within the new spectacular 3D UI wrapper */}
              <div className="contact-form-wrapper">
                <ContactForm locale={locale} whatsappUrl={model.contact.whatsappUrl} />
              </div>

            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}
