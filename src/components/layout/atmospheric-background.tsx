"use client";

import { motion, useReducedMotion } from "framer-motion";

export function AtmosphericBackground() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
      <div className="mesh-animated-overlay" />

      {!prefersReducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute inset-[-15%] opacity-30 blur-[120px] dark:opacity-15"
            style={{
              background: "radial-gradient(circle at 30% 30%, var(--color-primary), transparent 60%), radial-gradient(circle at 70% 70%, var(--color-accent-warm), transparent 60%)",
            }}
          />
        </motion.div>
      )}

      <div 
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.1] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "var(--noise)" }}
      />
      
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--bg-primary)_100%)] opacity-30" />
    </div>
  );
}
