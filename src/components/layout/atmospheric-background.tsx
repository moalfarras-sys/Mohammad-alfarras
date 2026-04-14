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
    <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden bg-background">
      {/* Dynamic Mesh Layers */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0"
      >
        <div 
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.8] mix-blend-soft-light transition-opacity duration-1000"
          style={{ 
            background: `
              var(--mesh-1), 
              var(--mesh-2), 
              var(--mesh-3), 
              var(--mesh-4), 
              var(--mesh-5)
            `,
            backgroundSize: "200% 200%",
          }}
        />

        {/* Animated Drift Overlay */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-[-20%] opacity-30 blur-[100px] dark:opacity-20"
          style={{
            background: "radial-gradient(circle at 30% 30%, var(--primary), transparent), radial-gradient(circle at 70% 70%, var(--secondary), transparent)",
          }}
        />
      </motion.div>

      {/* Subtle Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.1] dark:opacity-[0.14] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "var(--noise)" }}
      />
      
      {/* vignette to focus content */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_100%)] opacity-40" />
    </div>
  );
}
