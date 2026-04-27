"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion, useSpring, useMotionValue } from "framer-motion";
import { 
  ArrowRight, 
  ArrowUpRight, 
  Code2, 
  Cpu, 
  Globe, 
  Layout, 
  MessageCircle, 
  Zap, 
  Sparkles,
  Github,
  Youtube,
  Linkedin,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { SiteViewModel } from "./site-view-model";

// ── CUSTOM COMPONENTS ──

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn("relative group transition-all duration-200", className)}
    >
      <div style={{ transform: "translateZ(50px)" }} className="relative z-10 h-full w-full">
        {children}
      </div>
      {/* Glow Effect */}
      <motion.div 
        className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 to-violet-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
      />
    </motion.div>
  );
}

// ── MAIN PAGE ──

export function PortfolioHomePageNew({ model }: { model: SiteViewModel }) {
  const isAr = model.locale === "ar";
  const { scrollY } = useScroll();
  const yHero = useTransform(scrollY, [0, 500], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 300], [1, 0]);
  const reduced = useReducedMotion();

  const socialLinks = [
    { icon: <Github className="h-5 w-5" />, href: "https://github.com/moalfarras-sys", color: "hover:text-white" },
    { icon: <Youtube className="h-5 w-5" />, href: "https://www.youtube.com/@Moalfarras", color: "hover:text-red-500" },
    { icon: <Linkedin className="h-5 w-5" />, href: "https://linkedin.com/in/mohammad-alfarras", color: "hover:text-blue-500" },
    { icon: <MessageCircle className="h-5 w-5" />, href: model.contact.whatsappUrl, color: "hover:text-emerald-500" },
  ];

  return (
    <div className="relative">
      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[100vh] flex items-center justify-center overflow-hidden pt-20">
        <motion.div 
          style={{ y: yHero, opacity: opacityHero }}
          className="container relative z-10 px-6"
        >
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/5 bg-white/[0.03] backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">
                {isAr ? "متاح لمشاريع استثنائية" : "Available for premium projects"}
              </p>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="headline-display text-[clamp(2.5rem,8vw,6.5rem)] font-black leading-[0.9] tracking-tighter text-white"
            >
              {isAr ? (
                 <>
                   أبني تجارب رقمية <br/>
                   <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-500">
                     تترك أثراً بصرياً.
                   </span>
                 </>
              ) : (
                <>
                  Crafting Digital <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-500">
                    Experiences that WOW.
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="mt-10 max-w-2xl text-lg md:text-2xl text-slate-400 leading-relaxed font-medium"
            >
              {model.profile.subtitle}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="mt-12 flex flex-wrap gap-6 items-center"
            >
              <Link 
                href={`/${model.locale}/work`} 
                className="group relative h-16 px-10 rounded-full bg-white text-black font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 flex items-center gap-3">
                   {isAr ? "استكشف الأعمال" : "Explore Projects"} 
                   <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              </Link>
              <Link 
                href={`/${model.locale}/contact`} 
                className="h-16 px-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-white font-black text-sm uppercase tracking-widest transition-all hover:bg-white/10"
              >
                {isAr ? "تواصل معي" : "Direct Inquiry"}
              </Link>
              
              <div className="flex gap-4 ml-4">
                 {socialLinks.map((link, idx) => (
                   <motion.a 
                     key={idx}
                     href={link.href}
                     target="_blank"
                     whileHover={{ y: -4, scale: 1.1 }}
                     className={cn("text-slate-500 transition-colors", link.color)}
                   >
                     {link.icon}
                   </motion.a>
                 ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[1000px] w-[1000px] rounded-full bg-cyan-500/5 blur-[160px]" />
           <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-500/5 blur-[140px]" />
        </div>
        
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500"
        >
           <ChevronDown className="h-6 w-6" />
        </motion.div>
      </section>

      {/* ── MARQUEE / STACK ── */}
      <section className="py-20 border-y border-white/5 bg-white/[0.01]">
         <div className="flex overflow-hidden gap-12 select-none">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-none gap-20 items-center animate-marquee whitespace-nowrap px-10">
                {["NEXT.JS", "TYPESCRIPT", "REACT", "FRAMER MOTION", "TAILWIND CSS", "SUPABASE", "ANDROID", "VLC ENGINE"].map((tech) => (
                  <span key={tech} className="text-4xl md:text-7xl font-black text-white/5 tracking-tighter">
                    {tech}
                  </span>
                ))}
              </div>
            ))}
         </div>
      </section>

      {/* ── SERVICES / SOLUTIONS ── */}
      <section className="py-32 relative">
        <div className="container px-6 relative z-10">
          <div className="max-w-4xl mb-24">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="flex items-center gap-3 mb-6"
             >
                <span className="h-[1px] w-8 bg-cyan-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">{isAr ? "القدرات" : "Capabilities"}</p>
             </motion.div>
             <h2 className="headline-display text-4xl md:text-6xl font-black text-white tracking-tighter leading-tight">
               {isAr ? "حلول رقمية مصممة للنمو والتميز." : "Digital solutions engineered for scale and impact."}
             </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {model.services.map((service, idx) => (
              <TiltCard key={service.id} className="h-full">
                <div className="relative h-full glass rounded-[2.5rem] p-10 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] overflow-hidden group">
                   <div className="mb-10 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-cyan-400 border border-white/10 group-hover:scale-110 transition-transform">
                      {idx === 0 ? <Layout className="h-6 w-6" /> : idx === 1 ? <Cpu className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                   </div>
                   <h3 className="text-2xl font-black text-white tracking-tight mb-4">{service.title}</h3>
                   <p className="text-slate-400 text-sm leading-relaxed mb-10">{service.body}</p>
                   
                   <ul className="space-y-3">
                      {service.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-slate-500">
                           <div className="h-1 w-1 rounded-full bg-cyan-500" />
                           {bullet}
                        </li>
                      ))}
                   </ul>
                   
                   <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                      {idx === 0 ? <Code2 className="h-20 w-20" /> : idx === 1 ? <Globe className="h-20 w-20" /> : <Zap className="h-20 w-20" />}
                   </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED PROJECT (MOPLAYER) ── */}
      <section className="py-32">
        <div className="container px-6">
           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="glass relative rounded-[4rem] border-white/5 bg-gradient-to-br from-cyan-500/[0.02] to-violet-500/[0.02] p-10 md:p-20 overflow-hidden"
           >
              <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12">
                 <Cpu className="h-96 w-96 text-white" />
              </div>
              
              <div className="grid gap-16 lg:grid-cols-2 items-center relative z-10">
                 <div className="order-2 lg:order-1">
                    <div className="mb-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
                       <Zap className="h-4 w-4" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Featured Product</span>
                    </div>
                    <h2 className="headline-display text-5xl md:text-7xl font-black text-white tracking-tighter mb-8">MoPlayer</h2>
                    <p className="text-xl text-slate-400 leading-relaxed mb-12">
                      {isAr ? "مشغل وسائط متطور يعتمد على محرك VLC، مصمم لتجربة مشاهدة سينمائية على Android TV والهواتف." : "A high-performance media engine powered by VLC, designed for a cinematic viewing experience across Android TV and mobile."}
                    </p>
                    <Link 
                      href={`/${model.locale}/apps/moplayer`} 
                      className="group flex items-center gap-4 text-white font-black text-sm uppercase tracking-widest"
                    >
                       {isAr ? "استكشف المنتج" : "Explore Product Surface"}
                       <div className="h-12 w-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                          <ArrowUpRight className="h-5 w-5" />
                       </div>
                    </Link>
                 </div>
                 
                 <div className="order-1 lg:order-2 relative">
                    <div className="absolute -inset-10 bg-cyan-500/10 blur-[80px] rounded-full animate-pulse" />
                    <motion.div 
                      animate={{ y: [0, -15, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10"
                    >
                       <Image 
                         src="/images/moplayer-hero-3d-final.png" 
                         alt="MoPlayer Mockup" 
                         width={800} 
                         height={600} 
                         className="w-full h-auto drop-shadow-[0_20px_50px_rgba(34,211,238,0.2)]"
                       />
                    </motion.div>
                 </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-40 text-center relative overflow-hidden">
         <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[120px]" />
         </div>
         <div className="container relative z-10 px-6">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="headline-display text-4xl md:text-8xl font-black text-white tracking-tighter mb-12"
            >
               {isAr ? "لنحول فكرتك إلى واقع بصري." : "Let's turn your vision into a visual reality."}
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
            >
               <Link 
                 href={`/${model.locale}/contact`} 
                 className="button-liquid-primary px-16 h-20 text-xl font-black"
               >
                  {isAr ? "ابدأ الآن" : "Let's Connect"}
               </Link>
            </motion.div>
         </div>
      </section>
    </div>
  );
}
