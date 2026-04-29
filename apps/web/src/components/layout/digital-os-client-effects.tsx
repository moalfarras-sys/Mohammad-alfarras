"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function DigitalOsClientEffects() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 420, damping: 34, mass: 0.45 });
  const springY = useSpring(cursorY, { stiffness: 420, damping: 34, mass: 0.45 });
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const onMove = (event: PointerEvent) => {
      cursorX.set(event.clientX - 11);
      cursorY.set(event.clientY - 11);
    };

    const onOver = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      setHovering(Boolean(target.closest("a, button, input, textarea, select, [role='button'], .magnetic-surface")));
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className={hovering ? "os-cursor os-cursor-active" : "os-cursor"}
      aria-hidden="true"
      style={{ x: springX, y: springY }}
    />
  );
}
