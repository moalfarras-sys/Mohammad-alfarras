"use client";

import { motion, Variants } from "framer-motion";
import Image from "next/image";
import { BarChart, Heart, MessageSquare, Play, PlayCircle, Users } from "lucide-react";
import type { LiveYoutubeComment, LiveYoutubeVideo } from "@/lib/youtube-live";
import type { SiteViewModel } from "./site-view-client";

export function YoutubeProfessional2026({ model }: { model: SiteViewModel }) {
  const { locale } = model;
  const ytData = model.live.youtube;

  const channelId = "Moalfarras"; // Fallback identifier
  const channelUrl = `https://www.youtube.com/@${channelId}`;

  // Fallbacks if data fails
  const subscribers = ytData?.subscribers ?? 1500;
  const totalViews = ytData?.totalViews ?? 50000;
  const videos: LiveYoutubeVideo[] = ytData?.videos ?? [];
  const comments: LiveYoutubeComment[] = ytData?.comments ?? [];

  const fmtSub = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { notation: "compact" }).format(subscribers);
  const fmtViews = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { notation: "compact" }).format(totalViews);

  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring" as const, stiffness: 80, damping: 15 } },
  };

  return (
    <div className="relative min-h-screen py-32 overflow-hidden" dir={locale === "ar" ? "rtl" : "ltr"} data-testid="youtube-page">
      {/* Immersive Void Background with dynamic Red/Purple glow for YouTube */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[#04060A]" />
      <motion.div
        animate={{ filter: ["blur(50px)", "blur(80px)", "blur(50px)"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 z-0 mix-blend-screen opacity-20"
        style={{
          background: "radial-gradient(circle at 20% 0%, rgba(255,0,50,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.15) 0%, transparent 60%)",
        }}
      />

      <div className="section-frame relative z-10 w-full max-w-[1400px]">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          
          {/* Main Hero Identity (Span 12) */}
          <motion.div
            variants={item}
            className="md:col-span-12 flex flex-col md:flex-row gap-10 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group items-center"
            style={{
              background: "linear-gradient(145deg, rgba(20, 10, 15, 0.6) 0%, rgba(10, 8, 15, 0.8) 100%)",
              border: "1px solid rgba(255, 0, 50, 0.1)",
              backdropFilter: "blur(24px)",
            }}
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff0000] rounded-full mix-blend-screen filter blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />

            <div className="flex-1 flex flex-col justify-center text-center md:text-start z-10">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold w-fit mb-4 mx-auto md:mx-0"
                style={{ background: "rgba(255,0,0,0.08)", border: "1px solid rgba(255,0,0,0.2)", color: "#ff4d4d" }}>
                <span className="h-2 w-2 rounded-full bg-[#ff0000] animate-pulse shadow-[0_0_8px_#ff0000]" />
                {locale === "ar" ? "قناة يوتيوب الرسمية" : "Official YouTube Channel"}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white headline-arabic leading-tight mb-2">
                {locale === "ar" ? "المحتوى التقني" : "Tech Content Hub"}
              </h1>
              <p className="text-[#a855f7] font-mono text-sm tracking-widest uppercase mb-6 font-bold">
                LOGISTICS • FRONTEND • ECOSYSTEM
              </p>
              <p className="text-foreground-muted text-base md:text-lg leading-8 max-w-2xl mx-auto md:mx-0 mb-8">
                {locale === "ar" 
                  ? "أشارك رحلتي وتجاربي في دمج العمليات اللوجستية مع تطوير الويب. أستعرض تقنيات الـ Frontend العصرية وكيفية استخدام التكنولوجيا لحل مشاكل معقدة في العالم الحقيقي."
                  : "I share my journey blending hard logistics with modern web development. Exploring cutting edge Frontend technologies and solving complex real-world operational problems."}
              </p>
              
              <motion.a 
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,0,0,0.3)" }}
                whileTap={{ scale: 0.98 }}
                href={channelUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-red-600 text-white font-bold mx-auto md:mx-0 w-fit"
                style={{ background: "linear-gradient(135deg, #ff0033, #cc0000)" }}
              >
                <PlayCircle className="w-5 h-5 fill-white text-red-600" />
                {locale === "ar" ? "انتقال إلى القناة" : "Enter Channel"}
              </motion.a>
            </div>

            {/* Live Stats Ring */}
            <div className="shrink-0 relative w-full md:w-auto flex justify-center mt-10 md:mt-0 z-10">
              <div className="flex gap-4 md:flex-col">
                <div className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl text-center min-w-[140px] md:min-w-[180px]">
                  <Users className="w-6 h-6 text-[#ff4d4d] mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-white font-mono">{fmtSub}</p>
                  <p className="text-xs text-foreground-soft font-bold uppercase tracking-wider mt-1">{locale === "ar" ? "مشترك" : "Subscribers"}</p>
                </div>
                <div className="bg-black/50 border border-white/10 rounded-3xl p-6 backdrop-blur-xl text-center min-w-[140px] md:min-w-[180px]">
                  <BarChart className="w-6 h-6 text-[#a855f7] mx-auto mb-3" />
                  <p className="text-3xl md:text-4xl font-black text-white font-mono">{fmtViews}</p>
                  <p className="text-xs text-foreground-soft font-bold uppercase tracking-wider mt-1">{locale === "ar" ? "مشاهدة" : "Total Views"}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Interactive Cinematic Videos Grid (Span 12) */}
          {videos.length > 0 && (
            <motion.div
              variants={item}
              className="md:col-span-12 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
              style={{
                background: "rgba(10, 15, 25, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-8">
                <Play className="w-6 h-6 text-[#ff0033]" fill="#ff0033" />
                {locale === "ar" ? "أحدث الفيديوهات" : "Latest Releases"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videos.map((vid) => (
                  <motion.a
                    key={vid.id}
                    href={`https://www.youtube.com/watch?v=${vid.id}`}
                    target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group relative rounded-[2rem] overflow-hidden border border-white/5 bg-black"
                  >
                    <div className="aspect-video w-full relative overflow-hidden">
                      <Image 
                        src={vid.thumbnail} alt={vid.title} fill sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
                      
                      {/* Hover Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </div>
                      </div>

                      {/* Video Data overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 pt-12">
                        <h4 className="text-lg md:text-xl font-bold text-white leading-tight mb-3 line-clamp-2">{vid.title}</h4>
                        <div className="flex items-center gap-4 text-xs font-bold font-mono text-foreground-soft">
                          <span className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                            {new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { notation: "compact" }).format(vid.views)} {locale === "ar" ? "مشاهدة" : "Views"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Real-Time Comments Marquee / Grid (Span 12) */}
          {comments.length > 0 && (
            <motion.div
              variants={item}
              className="md:col-span-12 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
              style={{
                background: "rgba(10, 15, 25, 0.4)",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(20px)",
              }}
            >
              <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-8">
                <MessageSquare className="w-6 h-6 text-[#a855f7]" />
                {locale === "ar" ? "تفاعل الجمهور المباشر" : "Live Audience Engagement"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {comments.map((cm) => (
                  <motion.a
                    key={cm.id}
                    href={`https://www.youtube.com/watch?v=${cm.videoId}&lc=${cm.id}`}
                    target="_blank" rel="noopener noreferrer"
                    whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#a855f7] to-[#00ff87] flex items-center justify-center text-xs font-bold text-black uppercase">
                          {cm.author.substring(0, 1) || "U"}
                        </div>
                        <span className="text-sm font-bold text-white/80">{cm.author.replace("@", "")}</span>
                      </div>
                      <p className="text-foreground-muted text-sm leading-relaxed line-clamp-4 italic">
                        &ldquo;{cm.text}&rdquo;
                      </p>
                    </div>
                    {cm.likes > 0 && (
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#ff4d4d]">
                        <Heart className="w-3.5 h-3.5" fill="currentColor" /> {cm.likes}
                      </div>
                    )}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}

        </motion.div>
      </div>
    </div>
  );
}
