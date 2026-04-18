"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

const particles = [
  { id: 0, x: 8, y: 18, size: 3, delay: 0.1, duration: 7 },
  { id: 1, x: 22, y: 30, size: 4, delay: 1.2, duration: 8 },
  { id: 2, x: 37, y: 14, size: 2, delay: 0.5, duration: 6 },
  { id: 3, x: 48, y: 42, size: 5, delay: 2.2, duration: 9 },
  { id: 4, x: 61, y: 24, size: 3, delay: 1.7, duration: 7.5 },
  { id: 5, x: 72, y: 52, size: 4, delay: 0.9, duration: 8.5 },
  { id: 6, x: 83, y: 20, size: 2, delay: 2.8, duration: 6.5 },
  { id: 7, x: 15, y: 68, size: 4, delay: 0.3, duration: 7.2 },
  { id: 8, x: 31, y: 78, size: 3, delay: 1.6, duration: 8.1 },
  { id: 9, x: 55, y: 72, size: 2, delay: 2.4, duration: 6.8 },
  { id: 10, x: 69, y: 84, size: 5, delay: 1.1, duration: 9.3 },
  { id: 11, x: 88, y: 64, size: 3, delay: 0.7, duration: 7.7 },
] as const;

export default function GlobalNotFound() {
  return (
    <section
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-20"
      style={{ background: "var(--background)" }}
    >
      {/* Animated background orbs */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, rgba(0,229,255,0.4), transparent 70%)" }}
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.45), transparent 70%)" }}
      />
      <motion.div
        aria-hidden
        animate={{ x: [0, 30, 0], opacity: [0.08, 0.14, 0.08] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute bottom-1/3 left-1/3 h-[300px] w-[300px] rounded-full blur-[80px]"
        style={{ background: "radial-gradient(circle, rgba(255,107,0,0.35), transparent 70%)" }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0 ? "var(--primary)" : p.id % 3 === 1 ? "var(--secondary)" : "var(--accent)",
            boxShadow: `0 0 ${p.size * 3}px currentColor`,
            opacity: 0.4,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      <div className="relative z-10 mx-auto max-w-2xl text-center">

        {/* Logo with rings */}
        <div className="relative mx-auto mb-12 flex h-28 w-28 items-center justify-center">
          {/* Outer ring — slow spin */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            style={{
              border: "2px dashed rgba(0,229,255,0.25)",
            }}
          />
          {/* Middle ring — opposite spin */}
          <motion.div
            className="absolute inset-3 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{
              border: "1px solid rgba(168,85,247,0.2)",
            }}
          />
          {/* Inner glow card */}
          <motion.div
            animate={{ y: [0, -6, 0], scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(0,229,255,0.12), rgba(168,85,247,0.1))",
              border: "1px solid rgba(0,229,255,0.3)",
              boxShadow: "0 0 40px rgba(0,229,255,0.2), 0 0 80px rgba(168,85,247,0.1)",
            }}
          >
            <Image
              src="/images/logo.png"
              alt="Moalfarras"
              width={54}
              height={44}
              className="object-contain"
            />
          </motion.div>
        </div>

        {/* Neon 404 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            animate={{
              textShadow: [
                "0 0 30px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2)",
                "0 0 60px rgba(0,229,255,0.8), 0 0 120px rgba(168,85,247,0.3)",
                "0 0 30px rgba(0,229,255,0.5), 0 0 80px rgba(0,229,255,0.2)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="block text-[7rem] font-black leading-none md:text-[9rem]"
            style={{
              background: "linear-gradient(135deg, #00E5FF 0%, #D946EF 60%, #6366F1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-brand)",
            }}
          >
            404
          </motion.span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7 }}
          className="mt-6 space-y-4"
        >
          <h1
            className="mx-auto max-w-lg text-2xl font-bold leading-relaxed text-foreground md:text-3xl"
            dir="rtl"
          >
            الصفحة التي تبحث عنها{" "}
            <motion.span
              animate={{ color: ["var(--secondary)", "var(--accent)", "var(--secondary)"] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              غادرت بدون إشعار مسبق
            </motion.span>
          </h1>
          <p className="mx-auto max-w-md text-base leading-8 text-foreground-muted" dir="rtl">
            ربما حُذفت، أو ربما الرابط كُتب خطأ. في كلتا الحالتين، الطريق للأمام موجود تحت هذا السطر.
          </p>
        </motion.div>

        {/* Glowing divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mx-auto my-10 h-px w-56"
          style={{ background: "linear-gradient(90deg, transparent, #00E5FF, #D946EF, transparent)" }}
        />

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04, y: -2 }}>
            <Link
              href="/ar"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-bold text-black transition duration-300"
              style={{
                background: "linear-gradient(135deg, #00E5FF, #00B8D4)",
                boxShadow: "0 0 40px rgba(0,229,255,0.3), 0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              <Home className="h-4 w-4" />
              العودة للرئيسية
            </Link>
          </motion.div>

          <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04, y: -2 }}>
            <Link
              href="/en"
              className="inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold text-foreground transition duration-300"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(0,229,255,0.25)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              English
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-xs font-semibold uppercase tracking-[0.3em] text-foreground-soft"
        >
          Moalfarras · Developer · Germany
        </motion.p>
      </div>
    </section>
  );
}
