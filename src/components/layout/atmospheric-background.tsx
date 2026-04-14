"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function AtmosphericBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Primary Orb - Drifts around top-left */}
      <motion.div
        animate={{
          x: ["-10%", "10%", "-5%", "-10%"],
          y: ["-10%", "5%", "15%", "-10%"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-[10%] -top-[10%] h-[60vw] w-[60vw] rounded-full blur-[120px] opacity-[0.07]"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
      />

      {/* Secondary Orb - Drifts around bottom-right */}
      <motion.div
        animate={{
          x: ["10%", "-10%", "5%", "10%"],
          y: ["10%", "-5%", "-15%", "10%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -right-[10%] -bottom-[10%] h-[50vw] w-[50vw] rounded-full blur-[110px] opacity-[0.06]"
        style={{ background: "radial-gradient(circle, var(--secondary), transparent 70%)" }}
      />

      {/* Accent Orb - Drifts in the middle */}
      <motion.div
        animate={{
          scale: [1, 1.2, 0.9, 1],
          opacity: [0.03, 0.05, 0.03],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 h-[40vw] w-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
      />

      {/* Subtle Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "var(--noise)" }}
      />
    </div>
  );
}
