"use client";

import { motion, useScroll, useSpring, useMotionValue } from "framer-motion";
import { useEffect } from "react";

export function CinematicOverlay() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-cyan-500 z-[9999] origin-left"
        style={{ scaleX }}
      />

      {/* Cinematic Noise Grain */}
      <div className="fixed inset-0 pointer-events-none z-[9998] opacity-[0.03] mix-blend-overlay">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      {/* Mouse Follower Glow (Desktop only) */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none z-[9997]">
        <motion.div
          className="h-96 w-96 rounded-full bg-cyan-500/5 blur-[100px]"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%"
          }}
        />
        <motion.div
          className="h-[30px] w-[30px] rounded-full border border-cyan-500/30 flex items-center justify-center"
          style={{
            x: mouseX,
            y: mouseY,
            translateX: "-50%",
            translateY: "-50%"
          }}
        >
           <div className="h-1 w-1 rounded-full bg-cyan-500" />
        </motion.div>
      </div>

      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/4 -left-1/4 h-[800px] w-[800px] rounded-full bg-indigo-600/5 blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 120, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/4 -right-1/4 h-[700px] w-[700px] rounded-full bg-cyan-600/5 blur-[120px]"
        />
      </div>
    </>
  );
}
