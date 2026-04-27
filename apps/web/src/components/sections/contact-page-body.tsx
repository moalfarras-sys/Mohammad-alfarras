"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Mail, MapPin, MessageCircle, Send, Clock, Sparkles, Zap, Phone } from "lucide-react";

import { LiquidContactForm } from "@/components/site/liquid-contact-form";
import type { SiteViewModel } from "@/components/site/site-view-model";
import { cn } from "@/lib/cn";

const copy = {
  en: {
    eyebrow: "Direct Inquiry",
    title: "Defining Scope, Constraints, and Outcome.",
    body:
      "Strategic consultation for web presence, product architecture, MoPlayer ecosystem, and bilingual execution. Based in Germany, operating with a discovery-first rhythm.",
    email: "Send Email",
    whatsapp: "WhatsApp Direct",
    availabilityTitle: "System Availability",
    availability: [
      { label: "Operating Days", value: "Sat — Thu" },
      { label: "Timezone", value: "Germany · CET/CEST" },
      { label: "Discovery Call", value: "Via Inquiry" },
      { label: "Local presence", value: "Germany" },
    ],
    stepsTitle: "The Protocol",
    steps: [
      "Diagnostic review of your message to map the underlying business goal.",
      "Brief strategic response with immediate recommendations and initial clarity.",
      "Scope definition and migration to a clear, high-fidelity execution path.",
    ],
  },
  ar: {
    eyebrow: "طلب استشارة",
    title: "تحديد النطاق، القيود، والنتائج المتوقعة.",
    body:
      "استشارة استراتيجية لمواقع الويب، هندسة المنتجات، بيئة MoPlayer، والتنفيذ باللغتين. مقيم في ألمانيا وأعمل وفق إيقاع يبدأ من التشخيص والتحليل.",
    email: "إرسال بريد",
    whatsapp: "واتساب مباشر",
    availabilityTitle: "حالة النظام",
    availability: [
      { label: "أيام العمل", value: "السبت — الخميس" },
      { label: "التوقيت", value: "ألمانيا · CET/CEST" },
      { label: "جلسة اكتشاف", value: "عبر الطلب" },
      { label: "التواجد", value: "ألمانيا" },
    ],
    stepsTitle: "البروتوكول",
    steps: [
      "مراجعة تشخيصية لرسالتك لتحديد الهدف التجاري الحقيقي وراء الطلب.",
      "رد استراتيجي موجز مع توصيات فورية ووضوح مبدئي للمسار.",
      "تحديد نطاق العمل والانتقال إلى مسار تنفيذ عالي الجودة والدقة.",
    ],
  },
} as const;

export function ContactPageBody({ model }: { model: SiteViewModel }) {
  const t = copy[model.locale];
  const email = model.contact.emailAddress;
  const whatsapp = model.contact.whatsappUrl;
  const isAr = model.locale === "ar";
  const reduced = useReducedMotion();
  const heroImage = model.brandMedia.contactHero || model.brandMedia.gallery.tech || "/images/hero_tech.png";

  return (
    <div className="relative pb-32" data-testid="contact-page">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-48 md:pb-32">
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[var(--bg-base)]" />
          <div className="absolute -right-1/4 top-0 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, var(--text-3) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        </div>
        
        <div className="section-frame relative z-10">
          <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className={cn("flex items-center gap-3 mb-8", isAr ? "flex-row-reverse" : "")}>
                <span className="h-[1px] w-8 bg-indigo-500" />
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-500">{t.eyebrow}</p>
              </div>
              <h1 className="headline-display text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.05] tracking-tight text-[var(--text-1)]">
                {t.title}
              </h1>
              <p className="mt-8 text-lg leading-relaxed text-[var(--text-2)] md:text-xl max-w-2xl">
                {t.body}
              </p>
              
              <div className={cn("mt-12 flex flex-wrap gap-4", isAr ? "flex-row-reverse" : "")}>
                <a href={`mailto:${email}`} className="button-liquid-primary px-10 h-16 text-lg border-none bg-white text-black hover:bg-slate-200 shadow-xl">
                  <Mail className="h-5 w-5" />
                  {t.email}
                </a>
                <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="button-liquid-secondary px-8 h-16 group">
                  <MessageCircle className="h-5 w-5 text-emerald-500" />
                  {t.whatsapp}
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative"
            >
               <div className="absolute -inset-4 bg-gradient-to-br from-indigo-600/20 to-transparent blur-3xl opacity-30" />
               <div className="relative glass rounded-[3rem] border border-[var(--glass-border)] p-4 overflow-hidden shadow-2xl">
                  <div className="relative aspect-video w-full overflow-hidden rounded-[2.2rem]">
                    <Image
                      src={heroImage}
                      alt="Contact Visual"
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                       <div className="h-10 w-10 rounded-full border-2 border-white/20 bg-indigo-600 flex items-center justify-center">
                          <Zap className="h-5 w-5 text-white" />
                       </div>
                       <span className="text-sm font-black uppercase tracking-widest text-white">{isAr ? "دقة في التنفيذ" : "Precision Protocol"}</span>
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FORM & SIDEBAR ── */}
      <section className="py-24">
        <div className="section-frame">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
            
            {/* Form Container */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-[3.5rem] p-8 md:p-14 border-white/5 bg-white/[0.01] shadow-2xl"
            >
              <div className="mb-12">
                 <h2 className="text-3xl font-black text-[var(--text-1)]">{isAr ? "تفاصيل الطلب" : "Inquiry Parameters"}</h2>
                 <p className="text-[var(--text-3)] mt-3">{isAr ? "يرجى تقديم أكبر قدر ممكن من الوضوح للمساعدة في التشخيص." : "Please provide maximum clarity to assist the diagnostic phase."}</p>
              </div>
              <LiquidContactForm locale={model.locale} />
            </motion.div>

            {/* Sidebar */}
            <aside className="space-y-8">
              {/* Availability */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass rounded-[3rem] p-10 border-white/5"
              >
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                      <Clock className="h-5 w-5" />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-1)]">{t.availabilityTitle}</h3>
                </div>
                <div className="space-y-6">
                  {t.availability.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-4 border-b border-white/5 pb-5 last:border-0 last:pb-0">
                      <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-3)]">{row.label}</span>
                      <span className="text-sm font-black text-[var(--text-1)]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Protocol Steps */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass rounded-[3rem] p-10 border-white/5 bg-indigo-500/[0.01]"
              >
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                      <Send className="h-5 w-5" />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-1)]">{t.stepsTitle}</h3>
                </div>
                <div className="space-y-8 relative">
                   <div className="absolute left-5 top-0 bottom-0 w-px bg-white/5" />
                   {t.steps.map((step, idx) => (
                     <div key={idx} className="relative pl-12">
                        <div className="absolute left-2.5 top-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-black text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                          {idx + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-[var(--text-2)] pt-0.5">{step}</p>
                     </div>
                   ))}
                </div>
              </motion.div>

              {/* Channels */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass rounded-[3rem] p-10 border-white/5"
              >
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <Phone className="h-5 w-5" />
                   </div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-1)]">{isAr ? "قنوات التواصل" : "Direct Access"}</h3>
                </div>
                <div className="grid gap-4">
                  {model.contact.channels.slice(0, 3).map((channel) => {
                    const isEx = channel.value.startsWith("http");
                    return (
                      <a
                        key={channel.id}
                        href={channel.value}
                        target={isEx ? "_blank" : undefined}
                        className="group flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-widest text-[var(--text-1)]">{channel.label}</p>
                          <p className="text-[10px] text-[var(--text-3)] mt-1 truncate">{channel.description}</p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[var(--text-3)] group-hover:text-indigo-500 transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
