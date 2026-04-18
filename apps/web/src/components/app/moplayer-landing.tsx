"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDownToLine,
  ChevronRight,
  ShieldCheck,
  Zap,
  PlayCircle,
  MonitorSmartphone,
  MessageCircle,
  TerminalSquare,
  Lock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import type { AppEcosystemData } from "@/types/app-ecosystem";

function formatBytes(size?: number | null) {
  if (!size) return null;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

const featureIcons = [PlayCircle, Zap, ShieldCheck, MonitorSmartphone];

export function MoPlayerLanding({ ecosystem }: { ecosystem: AppEcosystemData }) {
  const { product, screenshots, faqs, releases } = ecosystem;
  const latestRelease = releases[0] ?? null;
  const primaryAsset = latestRelease?.assets.find((asset) => asset.is_primary) ?? latestRelease?.assets[0] ?? null;
  const releaseDate = formatDate(latestRelease?.published_at ?? product.last_updated_at);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const navLinks = [
    { label: "Portfolio", href: "/ar/projects" },
    { label: "Privacy", href: "/privacy" },
    { label: "Support", href: "/support" }
  ];

  return (
    <div className="bg-[#050811] text-white selection:bg-[#00E5FF]/30 selection:text-white font-sans antialiased">
      
      {/* --- FLOATING NAVBAR --- */}
      <nav className="fixed inset-x-0 top-0 z-50 px-6 py-4 transition-all duration-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/5 bg-[#0A0F1C]/80 px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-[12px] shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-transform group-hover:scale-105 overflow-hidden">
              <Image 
                src={product.logo_path ? product.logo_path.replace('.png', '-final.png') : "/images/moplayer-brand-logo-final.png"} 
                alt="Logo" 
                width={40} height={40} 
                className="h-full w-full object-cover" 
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-wide text-white">MoPlayer</span>
              <span className="text-[9px] uppercase tracking-widest text-[#00E5FF]">by moalfarras</span>
            </div>
          </Link>
          
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-xs font-semibold uppercase tracking-widest text-white/50 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
            {latestRelease && (
              <Link href={`/api/app/releases/${latestRelease.slug}/download`} className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-xs font-bold uppercase tracking-widest text-black transition-all hover:bg-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)]">
                <ArrowDownToLine className="h-4 w-4" />
                Download
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- CINEMATIC HERO --- */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden pt-20">
        {/* Deep background effects */}
        <div className="absolute inset-0 bg-[#050811]" />
        <div className="absolute top-1/4 left-1/2 -mt-[200px] -ml-[300px] h-[600px] w-[600px] rounded-full bg-[#0055FF]/20 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-[#00E5FF]/10 blur-[120px]" />
        
        {/* Subtle grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />

        <motion.div style={{ y, opacity }} className="relative z-10 flex max-w-5xl flex-col items-center px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00E5FF] backdrop-blur-md"
          >
            <Zap className="h-3 w-3 fill-[#00E5FF]" />
            {product.hero_badge || "The New Standard in Media"}
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-6xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[7rem]"
          >
            Cinematic. <br />
            <span className="bg-gradient-to-r from-white via-[#C4D2FF] to-[#00E5FF] bg-clip-text text-transparent">
              Uncompromised.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 max-w-2xl text-balance text-lg font-medium leading-relaxed text-white/60 md:text-xl"
          >
            {product.tagline || "MoPlayer delivers an intelligent, lightning-fast streaming experience for your Android and TV devices."}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row"
          >
            {latestRelease ? (
              <Link 
                href={`/api/app/releases/${latestRelease.slug}/download`} 
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-8 py-4 font-bold text-black transition-all hover:scale-105 active:scale-95"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                <ArrowDownToLine className="h-5 w-5" />
                {product.default_download_label || "Download for Android"}
              </Link>
            ) : (
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white/50 backdrop-blur-md">
                    Release Pending
                </div>
            )}
            <Link 
              href="#manifesto" 
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white transition-colors hover:bg-white/10 active:scale-95"
            >
              Explore Features
              <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Specs Mini Bar */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-6 text-[11px] font-medium uppercase tracking-widest text-white/40"
          >
            <span>v{latestRelease?.version_name || "1.0.0"}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span>SDK {product.android_target_sdk}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span>{primaryAsset?.abi || "Universal"}</span>
            <span className="h-4 w-[1px] bg-white/10" />
            <span>Secure</span>
          </motion.div>
        </motion.div>
      </section>

      {/* --- HERO PRODUCT SHOWCASE --- */}
      <section className="relative z-20 -mt-24 w-full px-6 md:-mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0A0F1C] shadow-[0_40px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/5 md:rounded-[3rem]"
        >
          <Image 
            src={product.hero_image_path ? product.hero_image_path.replace(/\.(png|jpe?g)$/i, '-final.$1') : screenshots[0]?.image_path ? screenshots[0]?.image_path.replace(/\.(png|jpe?g)$/i, '-final.$1') : "/images/moplayer-hero-3d-final.png"}
            alt="MoPlayer UI Interface"
            width={1920}
            height={1080}
            priority
            className="w-full object-cover"
          />
        </motion.div>
      </section>

      {/* --- FEATURES MANIFESTO --- */}
      <section id="manifesto" className="mx-auto max-w-7xl px-6 py-32 md:py-48">
        <div className="mb-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-white">
            Engineered for <br/> <span className="text-white/40">performance.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
            {product.long_description || "We removed all the friction. What's left is a singular, focused media experience that instantly reacts to your commands."}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {product.feature_highlights.map((item, index) => {
            const Icon = featureIcons[index % featureIcons.length];
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 transition-colors hover:bg-white/[0.04]"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white/80 ring-1 ring-white/10 transition-colors group-hover:bg-[#00E5FF]/10 group-hover:text-[#00E5FF] group-hover:ring-[#00E5FF]/30">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white tracking-tight">{item.title}</h3>
                <p className="text-sm leading-relaxed text-white/50">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* --- BENTO GRID: DETAILS & SPECS --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="grid gap-6 md:grid-cols-3 md:grid-rows-2 h-auto md:h-[600px]">
          
          {/* Main Visual Block */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-[#0A0F1C] md:col-span-2 md:row-span-2">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            <Image 
              src={screenshots[1]?.image_path ? screenshots[1]?.image_path.replace('.png', '-final.png') : "/images/moplayer-ui-mock-final.png"}
              alt="Playlist feature"
              fill
              className="object-cover opacity-60 transition-transform duration-700 hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 z-20 p-8 md:p-12">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1 backdrop-blur-md">
                <TerminalSquare className="h-4 w-4 text-[#00E5FF]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Fluid Navigation</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white md:text-5xl">Content first.<br/>Distractions zero.</h3>
            </div>
          </div>

          {/* Release Block */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/5 bg-gradient-to-b from-white/[0.05] to-transparent p-8">
            <div>
               <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00E5FF]/20 text-[#00E5FF]">
                 <ArrowDownToLine className="h-5 w-5" />
               </div>
               <h3 className="text-2xl font-bold text-white tracking-tight">Version {latestRelease?.version_name || "1.0"}</h3>
               {releaseDate && <p className="mt-2 text-sm text-white/50">Shipped on {releaseDate}</p>}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-white/40">Size</span>
                    <span className="font-mono text-white/80">{formatBytes(primaryAsset?.file_size_bytes) || "N/A"}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-white/40">Target API</span>
                    <span className="font-mono text-white/80">{product.android_target_sdk}</span>
                </div>
            </div>
          </div>

          {/* Security / Legal Block */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.02] p-8">
             <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/50">
                 <Lock className="h-5 w-5" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Privacy & Safety</h3>
             <ul className="space-y-3 mt-4">
                 <li className="flex items-start gap-3 text-sm text-white/50">
                     <ShieldCheck className="h-4 w-4 shrink-0 text-[#00E5FF] mt-0.5" />
                     <span>No tracking or intrusive analytics.</span>
                 </li>
                 <li className="flex items-start gap-3 text-sm text-white/50">
                     <ShieldCheck className="h-4 w-4 shrink-0 text-[#00E5FF] mt-0.5" />
                     <span>Direct encrypted downloads.</span>
                 </li>
             </ul>
          </div>
        </div>
      </section>

      {/* --- INSTALLATION & HOW IT WORKS --- */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div className="grid gap-12 md:grid-cols-2">
            <div>
                <h3 className="text-2xl font-bold tracking-tight text-white mb-8">Installation Flow</h3>
                <div className="space-y-6">
                    {product.install_steps.map((step, idx) => (
                        <div key={idx} className="flex gap-6 group">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-white/50 transition-colors group-hover:border-[#00E5FF]/50 group-hover:text-[#00E5FF]">
                                {idx + 1}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-white mb-1">{step.title}</h4>
                                <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-[2.5rem] border border-white/5 bg-[#0A0F1C] p-8 md:p-12">
                <h3 className="text-2xl font-bold tracking-tight text-white mb-6">Frequently Asked</h3>
                <div className="space-y-6">
                    {faqs.slice(0, 4).map((faq) => (
                        <div key={faq.id} className="border-b border-white/5 pb-6 last:border-0 last:pb-0">
                            <h4 className="text-base font-semibold text-white mb-2">{faq.question}</h4>
                            <p className="text-sm text-white/50 leading-relaxed">{faq.answer}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* --- SUPPORT & FINAL CTA --- */}
      <section className="relative border-t border-white/5 bg-[#0A0F1C] py-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -ml-[400px] h-[300px] w-[800px] rounded-full bg-[#00E5FF]/10 blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-4xl px-6 text-center relative z-10">
          <h2 className="text-4xl font-extrabold tracking-tight text-white md:text-6xl mb-6 text-balance">
            Ready to upgrade your media?
          </h2>
          <p className="text-lg text-white/50 mb-12">
            Get the latest version directly without storefront delays. Support requests are handled through our dedicated portal or WhatsApp.
          </p>

          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            {latestRelease && (
              <Link 
                href={`/api/app/releases/${latestRelease.slug}/download`} 
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#00E5FF] px-8 py-4 font-bold text-black transition-transform hover:scale-105 active:scale-95 sm:w-auto"
              >
                <ArrowDownToLine className="h-5 w-5" />
                Download APK
              </Link>
            )}
            <Link 
                href={product.support_whatsapp || "/support"}
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold text-white transition-colors hover:bg-white/10 active:scale-95 sm:w-auto"
            >
                <MessageCircle className="h-5 w-5" />
                Contact Support
            </Link>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
                <Image src={product.logo_path ?? "/images/moplayer-brand-logo.png"} alt="Logo" width={24} height={24} className="h-6 w-6 invert brightness-0 opacity-50" />
                <span className="text-sm font-semibold text-white/30">© {new Date().getFullYear()} MoPlayer Ecosystem.</span>
            </div>
            <div className="flex gap-6 text-sm font-medium text-white/40">
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/support" className="hover:text-white transition-colors">Help Center</Link>
            </div>
        </div>
      </footer>

    </div>
  );
}
   
    
 