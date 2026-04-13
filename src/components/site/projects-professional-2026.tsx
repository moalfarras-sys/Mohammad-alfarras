"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, Globe, Sun, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SiteViewModel } from "./site-view-client";

const rainParticles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  height: 40 + (i % 6) * 10,
  duration: 0.35 + (i % 5) * 0.08,
  delay: (i % 10) * 0.15,
}));

const thunderParticles = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  height: 60 + (i % 8) * 10,
  duration: 0.2 + (i % 4) * 0.06,
  delay: (i % 10) * 0.15,
}));

const snowParticles = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  startX: (i % 10) * 10 - 45,
  endX: (i % 6) * 28 - 84,
  duration: 4 + (i % 5) * 0.8,
  delay: (i % 8) * 0.25,
}));

function WeatherVisual({ condition }: { condition?: string | null }) {
  switch (condition) {
    case "Clear":
      return <Sun className="w-14 h-14 md:w-20 md:h-20 text-yellow-500 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]" />;
    case "Clouds":
      return <Cloud className="w-14 h-14 md:w-20 md:h-20 text-gray-300 drop-shadow-[0_0_20px_rgba(200,200,200,0.5)]" />;
    case "Rain":
      return <CloudRain className="w-14 h-14 md:w-20 md:h-20 text-[#00ff87] drop-shadow-[0_0_20px_rgba(0,255,135,0.8)]" />;
    case "Drizzle":
      return <CloudDrizzle className="w-14 h-14 md:w-20 md:h-20 text-[#00ff87]" />;
    case "Thunderstorm":
      return <CloudLightning className="w-14 h-14 md:w-20 md:h-20 text-[#a855f7] drop-shadow-[0_0_40px_rgba(168,85,247,0.9)]" />;
    case "Snow":
      return <CloudSnow className="w-14 h-14 md:w-20 md:h-20 text-white drop-shadow-[0_0_20px_white]" />;
    case "Mist":
      return <CloudFog className="w-14 h-14 md:w-20 md:h-20 text-gray-400" />;
    default:
      return <Sun className="w-14 h-14 md:w-20 md:h-20 text-yellow-500" />;
  }
}

// HTC Sense 3D Weather Canvas
const HTCWeatherCanvas = ({ condition }: { condition: string }) => {
  const isRain = ["Rain", "Drizzle"].includes(condition);
  const isThunder = condition === "Thunderstorm";
  const isSnow = condition === "Snow";
  const isClear = condition === "Clear";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem] opacity-80 mix-blend-screen z-0">
      
      {/* 3D Sunburst for Clear Weather */}
      {isClear && (
        <motion.div 
          animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
          transition={{ rotate: { duration: 60, repeat: Infinity, ease: "linear" }, scale: { duration: 4, repeat: Infinity } }}
          className="absolute -top-20 -right-20 w-96 h-96 opacity-60 mix-blend-plus-lighter"
          style={{ background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 60%)" }}
        />
      )}

      {/* Heavy 3D Rain slashes & Splashes */}
      {isRain && (
        <>
          <div className="absolute inset-0 flex space-x-2 md:space-x-4 opacity-50 -skew-x-12">
            {rainParticles.map((particle) => (
              <motion.div
                key={particle.id}
                className="w-1 bg-gradient-to-b from-transparent via-[#00ff87] to-[#00ff87]"
                initial={{ y: -100, opacity: 0, height: particle.height }}
                animate={{ y: [-100, 600], opacity: [0, 1, 0] }}
                transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: "linear" }}
              />
            ))}
          </div>
          {/* Glass Drops (Refraction effect simulation) */}
          <motion.div 
             className="absolute bottom-10 left-10 w-32 h-10 blur-xl bg-white/20"
             animate={{ opacity: [0, 0.4, 0], scale: [1, 1.5] }}
             transition={{ duration: 1.2, repeat: Infinity, delay: 0.5 }}
          />
        </>
      )}

      {/* Cinematic 3D Thunderstorm Flashes */}
      {isThunder && (
        <>
          <motion.div 
            className="absolute inset-0 bg-[#a855f7]"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.8, 0, 0, 0.9, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "loop", ease: "circIn" }}
          />
          <div className="absolute inset-0 flex space-x-2 md:space-x-4 opacity-70 -skew-x-12">
            {thunderParticles.map((particle) => (
              <motion.div
                key={particle.id}
                className="w-1 bg-gradient-to-b from-transparent via-white to-white"
                initial={{ y: -100, opacity: 0, height: particle.height }}
                animate={{ y: [-100, 600], opacity: [0, 1, 0] }}
                transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: "linear" }}
              />
            ))}
          </div>
        </>
      )}
      
      {isSnow && (
        <div className="absolute inset-0 flex justify-around opacity-90">
          {snowParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="w-2 h-2 rounded-full bg-white shadow-[0_0_10px_white]"
              initial={{ y: -50, x: particle.startX, opacity: 0 }}
              animate={{ y: [-50, 400], x: particle.endX, opacity: [0, 1, 0] }}
              transition={{ duration: particle.duration, repeat: Infinity, delay: particle.delay, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectsProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  
  const weather = model.live.weather;
  const matches = model.live.matches;

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, scale: 0.95, y: 50 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 60, damping: 15 } },
  };

  const projects = [
    {
      id: "seel",
      title: "SEEL Transport GmbH",
      tags: locale === "ar" ? ["تحول رقمي", "لوجستيات"] : ["Corporate", "Operations"],
      marketingCta: locale === "ar" ? "تحول رقمي جذري ضاعف كفاءة العمليات اللوجستية وجذب استثمارات ضخمة" : "A radical digital restructuring that doubled operational efficiency and secured top-tier logistics contracts.",
      url: "https://seeltransport.de",
      image: "/images/seel-home-case.png",
      color: "#00ff87",
      span: "col-span-12 md:col-span-7"
    },
    {
      id: "schnell",
      title: "Schnell Sicher Umzug",
      tags: locale === "ar" ? ["تجربة مستخدم", "مبيعات"] : ["Logistics", "Conversion UI"],
      marketingCta: locale === "ar" ? "منصة رقمية مصممة هندسياً لرفع نسبة التحويل والمبيعات بشكل جنوني" : "A precision-engineered platform designed purely to crush conversion rates and dominate sales.",
      url: "https://schnellsicherumzug.de",
      image: "/images/schnell-home-case.png",
      color: "#ff6b00",
      span: "col-span-12 md:col-span-5"
    },
    {
      id: "moplayer",
      title: "MoPlayer Application",
      tags: ["React Native", "Streaming", "App"],
      marketingCta: locale === "ar" ? "تطبيق ترفيهي متكامل يتجاوز حدود الأداء المعتاد بواجهة تفاعلية استثنائية" : "A full-scale native entertainment architecture delivering unprecedented streaming performance.",
      url: "#",
      image: "/images/moplayer-app-cover.jpeg",
      color: "#06b6d4",
      span: "col-span-12 md:col-span-5"
    },
    {
      id: "portfolio",
      title: "Void Neon Portfolio",
      tags: ["Live APIs", "3D Motion", "Next.js"],
      marketingCta: locale === "ar" ? "ليس مجرد موقع، بل أداة تكنولوجية حية تثبت القوة البرمجية الفائقة" : "Not just a website. A live technological weapon proving absolute frontend mastery and real-time execution.",
      url: "https://moalfarras.space/ar",
      image: "/images/hero_tech.png",
      color: "#a855f7",
      span: "col-span-12 md:col-span-7"
    }
  ];

  return (
    <div className="relative min-h-screen py-32 overflow-hidden" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="projects-page">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#04060A]" />
      
      {/* Dynamic Background Flare */}
      <motion.div 
        animate={{ filter: ["blur(60px)", "blur(100px)", "blur(60px)"] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-30"
        style={{
          background: "radial-gradient(circle at 10% 20%, rgba(0,255,135,0.1), transparent 50%), radial-gradient(circle at 90% 80%, rgba(168,85,247,0.1), transparent 50%)",
        }}
      />

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        {/* Header Marketing */}
        <div className="mb-16 text-center md:text-start flex flex-col items-center md:items-start text-balance">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold w-fit mb-5"
            style={{ background: "linear-gradient(90deg, rgba(0,255,135,0.1), transparent)", border: "1px solid rgba(0,255,135,0.3)", color: "#00ff87" }}>
            <Zap className="h-4 w-4 rounded-full text-[#00ff87]" fill="currentColor" />
            {locale === "ar" ? "إثبات التنفيذ (Proof of Execution)" : "Proof of Execution"}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl lg:text-8xl font-black text-white headline-arabic leading-[1.1] tracking-tight">
            {locale === "ar" ? "معرض وحوش الويب" : "Digital Titans"}
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-foreground-muted text-lg md:text-xl mt-6 max-w-3xl font-semibold leading-9">
            {locale === "ar" 
              ? "النتائج لا تكذب. هذه ليست مجرد تصاميم، بل هي أنظمة لوجستية وتجارية متكاملة بُنيت لتدمير المنافسين وزيادة الأرباح بقوة التكنولوجيا." 
              : "Results don't lie. These are not simple layouts, they are aggressive logistics and business systems built to crush competitors and multiply revenue."}
          </motion.p>
        </div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-12 gap-6 w-full">
          
          {/* Projects Gallery */}
          {projects.map((proj, index) => (
            <motion.a
              key={proj.id}
              href={proj.url}
              target="_blank" rel="noopener noreferrer"
              variants={item}
              whileHover={{ scale: 1.02, zIndex: 30, boxShadow: `0 30px 60px -15px ${proj.color}33` }}
              className={`group relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#0a0a0f] flex flex-col ${proj.span} min-h-[450px] shadow-2xl transition-all duration-500`}
            >
              {/* Aggressive Image Container */}
              <div className="relative flex-1 w-full h-[60%] overflow-hidden bg-black">
                <Image 
                  src={proj.image} alt={proj.title} fill
                  sizes={proj.span.includes("lg:col-span-2") ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 1024px) 100vw, 33vw"}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="object-cover object-top transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-black/40 to-transparent" />
              </div>
              
              {/* Marketing Content Panel */}
              <div className="relative z-10 p-8 md:p-10 h-[40%] flex flex-col justify-end bg-gradient-to-t from-[#0a0a0f] to-[#0a0a0f]/80">
                <div className="flex flex-wrap gap-2 mb-4">
                  {proj.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 backdrop-blur-md rounded-lg text-xs font-bold text-white/90 border border-white/20 uppercase tracking-widest shadow-lg">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3">{proj.title}</h3>
                <p className="text-sm md:text-base text-foreground-soft font-semibold leading-7 group-hover:text-white transition-colors duration-300">
                  {proj.marketingCta}
                </p>
                <div className="absolute right-8 top-8 w-14 h-14 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 backdrop-blur-md shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                  style={{ background: `${proj.color}44`, border: `2px solid ${proj.color}` }}>
                   <ArrowUpRight className="w-8 h-8" style={{ color: proj.color }} />
                </div>
              </div>
              
              {/* 3D Inner Stroke Glow */}
              <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[2.5rem]"
                   style={{ boxShadow: `inset 0 0 0 2px ${proj.color}aa` }} />
            </motion.a>
          ))}

          {/* Epic Live Data Hub */}
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            
            {/* 1. HTC 3D Weather Canvas Component */}
            {weather && (
              <motion.div variants={item} className="relative rounded-[3rem] p-10 md:p-14 overflow-hidden group border border-white/5 shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(8,12,20,0.9), rgba(5,7,12,0.95))",
                  backdropFilter: "blur(20px)"
                }}>
                
                {/* Massive 3D Weather Backdrop */}
                <HTCWeatherCanvas condition={weather.condition} />
                
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <div className="flex items-center gap-2 text-foreground-soft font-bold font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] mb-3">
                        <Globe className="w-5 h-5 text-[#00ff87]" /> {weather.city} (IP SYNCED)
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide mix-blend-difference">
                        {locale === "ar" ? "الحالة الجوية المباشرة" : "Live Atmospheric Data"}
                      </h3>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                    >
                      <WeatherVisual condition={weather?.condition} />
                    </motion.div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <span className="text-8xl md:text-[8rem] leading-none font-black text-white tracking-tighter" style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.5))" }}>
                      {weather.temp}°
                    </span>
                    <div className="mt-4 md:mt-8">
                      <span className="text-2xl md:text-3xl font-black text-foreground-soft uppercase tracking-widest">{weather.condition}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. Premium Match Command Dashboard */}
            {matches && matches.length > 0 && (
              <motion.div variants={item} className="relative rounded-[3rem] p-10 md:p-14 overflow-hidden group border border-white/5 shadow-2xl"
                style={{
                  background: "linear-gradient(135deg, rgba(8,12,20,0.9), rgba(2,4,10,0.95))",
                  backdropFilter: "blur(20px)"
                }}>
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#ff6b00] rounded-full mix-blend-screen filter blur-[150px] opacity-10 group-hover:opacity-30 pointer-events-none transition-opacity duration-1000" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 text-[#ff6b00] font-bold font-mono text-[10px] md:text-xs uppercase tracking-[0.3em] mb-3">
                      <Trophy className="w-5 h-5" /> {locale === "ar" ? "الرادار الرياضي" : "Global Match Radar"}
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide">
                      {locale === "ar" ? "أبرز مواجهات اليوم" : "Today's Top Fixtures"}
                    </h3>
                  </div>

                  <div className="grid gap-4 mt-auto">
                    {matches.slice(0, 3).map(match => (
                      <div key={match.id} className="p-5 md:p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition-all duration-300">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a855f7]">{match.league}</span>
                          <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full", 
                            match.status.includes("LIVE") || match.status.includes("HT") || match.time.includes("'")
                              ? "bg-red-600/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(255,0,0,0.3)] animate-pulse" 
                              : "bg-white/10 text-white"
                          )}>
                            {match.time}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          <div className="flex items-center gap-4 w-1/3">
                            <Image src={match.homeLogo} alt={match.homeTeam} width={36} height={36} className="object-contain drop-shadow-lg" />
                            <span className="font-bold text-white text-base truncate hidden md:block">{match.homeTeam}</span>
                          </div>
                          <div className="w-1/3 text-center text-3xl font-black font-mono tracking-widest text-[#00ff87] drop-shadow-[0_0_20px_rgba(0,255,135,0.4)]">
                            {match.homeScore ?? "-"}<span className="text-white/30 px-1">:</span>{match.awayScore ?? "-"}
                          </div>
                          <div className="flex items-center justify-end gap-4 w-1/3 flex-row-reverse">
                            <Image src={match.awayLogo} alt={match.awayTeam} width={36} height={36} className="object-contain drop-shadow-lg" />
                            <span className="font-bold text-white text-base truncate hidden md:block text-right">{match.awayTeam}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </div>
  );
}
