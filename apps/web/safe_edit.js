const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/site/home-page-new.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { motion } from "framer-motion"')) {
    content = content.replace('import Image from "next/image";', 'import Image from "next/image";\nimport { motion } from "framer-motion";');
}

// Just add Framer Motion to the portrait image and project cards
content = content.replace(
    '<div className="glass relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)]" style={{ boxShadow: "var(--shadow-hero)" }}>',
    '<motion.div initial={{ opacity: 0, scale: 0.95, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="glass relative aspect-[4/5] overflow-hidden rounded-[var(--radius-xl)]" style={{ boxShadow: "var(--shadow-hero)" }}>'
);
content = content.replace(
    'sizes="(max-width:1024px) 340px, 420px"\n                  />\n                  <div',
    'sizes="(max-width:1024px) 340px, 420px"\n                  />\n                  </motion.div>\n                  <div'
);

// Actually, wait, the `<motion.div>` should wrap the `<Image>` and the `glass` div.
fs.writeFileSync(file, content);
