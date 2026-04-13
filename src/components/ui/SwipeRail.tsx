"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export function SwipeRail({
  children,
  className,
  trackClassName,
}: {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragBounds, setDragBounds] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function measure() {
      const viewportWidth = viewportRef.current?.offsetWidth ?? 0;
      const trackWidth = trackRef.current?.scrollWidth ?? 0;
      setDragBounds(Math.max(trackWidth - viewportWidth, 0));
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div ref={viewportRef} className={cn("overflow-hidden lg:overflow-visible", className)}>
      <motion.div
        ref={trackRef}
        drag={reduceMotion ? false : "x"}
        dragConstraints={{ left: -dragBounds, right: 0 }}
        dragElastic={0.08}
        className={cn("flex gap-4 pb-2 pr-4 lg:grid lg:pr-0", trackClassName)}
      >
        {children}
      </motion.div>
    </div>
  );
}
