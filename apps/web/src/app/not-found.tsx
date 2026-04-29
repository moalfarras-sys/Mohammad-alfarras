"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Compass, Home, Languages, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const nodes = [
  ["Home", "/en"],
  ["Work", "/en/work"],
  ["MoPlayer", "/en/apps/moplayer"],
  ["YouTube", "/en/youtube"],
  ["CV", "/en/cv"],
  ["Contact", "/en/contact"],
] as const;

export default function GlobalNotFound() {
  return (
    <main className="not-found-os">
      <div className="not-found-grid" aria-hidden="true" />
      <motion.div
        className="not-found-orb not-found-orb-a"
        animate={{ scale: [1, 1.18, 1], opacity: [0.28, 0.46, 0.28] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="not-found-orb not-found-orb-b"
        animate={{ x: [0, 28, 0], y: [0, -18, 0], opacity: [0.18, 0.34, 0.18] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <section className="not-found-card">
        <div className="not-found-logo">
          <motion.span animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: "linear" }} />
          <Image src="/images/logo.png" alt="Mohammad Alfarras logo" width={74} height={74} priority />
        </div>

        <motion.p
          className="fresh-eyebrow"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Compass size={15} />
          Lost signal / إشارة مفقودة
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
        >
          404
        </motion.h1>

        <div className="not-found-copy">
          <h2>The page stepped outside the Digital OS.</h2>
          <p>
            The link may be old, moved, or mistyped. Choose a stable route below and get back to the useful part of the system.
          </p>
          <h2 dir="rtl">هذه الصفحة خرجت من النظام الرقمي.</h2>
          <p dir="rtl">
            ربما تغيّر الرابط أو كُتب بشكل غير صحيح. اختر مسارًا واضحًا من الأسفل وعد إلى التجربة الأساسية.
          </p>
        </div>

        <div className="not-found-actions">
          <Link href="/en" className="fresh-button fresh-button-primary magnetic-surface">
            <Home size={17} />
            English home
          </Link>
          <Link href="/ar" className="fresh-button magnetic-surface">
            <Languages size={17} />
            الرئيسية العربية
          </Link>
          <button type="button" className="fresh-button magnetic-surface" onClick={() => window.history.back()}>
            <RotateCcw size={17} />
            Go back
          </button>
        </div>

        <div className="not-found-routes">
          {nodes.map(([node, href], index) => (
            <Link key={node} href={href} className="magnetic-surface">
              <span>{String(index + 1).padStart(2, "0")}</span>
              {node}
              <ArrowUpRight size={14} />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
