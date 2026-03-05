"use client";

import { m } from "framer-motion";

export function AnimatedPage({ children }: { children: React.ReactNode }) {
    return (
        <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
            {children}
        </m.div>
    );
}
