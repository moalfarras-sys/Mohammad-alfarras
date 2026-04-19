"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AtmosphericBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      {/* Base wash uses tokenized colors so it works in light + dark */}
      <div className="absolute inset-0" style={{ background: "var(--background)" }} />

      {/* Aurora orb A — top-left */}
      {prefersReducedMotion ? (
        <div
          className="absolute -left-[12%] -top-[18%] h-[640px] w-[640px] rounded-full opacity-60 blur-[120px]"
          style={{ background: "radial-gradient(circle at 35% 35%, var(--aurora-a), transparent 60%)" }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.06, 1], rotate: [0, 4, -2, 0] }}
          transition={{ opacity: { duration: 2 }, scale: { duration: 28, repeat: Infinity }, rotate: { duration: 60, repeat: Infinity } }}
          className="absolute -left-[12%] -top-[18%] h-[640px] w-[640px] rounded-full opacity-70 blur-[120px]"
          style={{ background: "radial-gradient(circle at 35% 35%, var(--aurora-a), transparent 60%)" }}
        />
      )}

      {/* Aurora orb B — bottom-right */}
      {prefersReducedMotion ? (
        <div
          className="absolute -right-[10%] bottom-[-20%] h-[720px] w-[720px] rounded-full opacity-55 blur-[140px]"
          style={{ background: "radial-gradient(circle at 60% 60%, var(--aurora-b), transparent 60%)" }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: [1, 1.04, 1], rotate: [0, -3, 2, 0] }}
          transition={{ opacity: { duration: 2.4 }, scale: { duration: 32, repeat: Infinity }, rotate: { duration: 80, repeat: Infinity } }}
          className="absolute -right-[10%] bottom-[-20%] h-[720px] w-[720px] rounded-full opacity-65 blur-[140px]"
          style={{ background: "radial-gradient(circle at 60% 60%, var(--aurora-b), transparent 60%)" }}
        />
      )}

      {/* Aurora orb C — center top, accent */}
      <div
        className="absolute left-1/2 top-[15%] h-[420px] w-[420px] -translate-x-1/2 rounded-full opacity-50 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--aurora-c), transparent 65%)" }}
      />

      {/* Subtle grid — visible in dark, near-invisible in light for paper feel */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          color: "var(--foreground)",
          maskImage: "radial-gradient(ellipse 65% 55% at 50% 40%, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 65% 55% at 50% 40%, black 30%, transparent 80%)",
        }}
      />

      {/* Film grain — subtle in both themes */}
      <div
        className="absolute inset-0 opacity-[0.045] mix-blend-overlay"
        style={{ backgroundImage: "var(--noise)" }}
      />

      {/* Vignette — frames the page edges so content reads better */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, var(--background) 95%)",
        }}
      />
    </div>
  );
}
