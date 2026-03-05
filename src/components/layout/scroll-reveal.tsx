"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

export function ScrollReveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
        >
            {children}
        </m.div>
    );
}
