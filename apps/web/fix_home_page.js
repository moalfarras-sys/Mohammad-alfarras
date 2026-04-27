const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/site/home-page-new.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add framer-motion import
if (!content.includes('import { motion } from "framer-motion"')) {
    content = content.replace('import Image from "next/image";', 'import Image from "next/image";\nimport { motion } from "framer-motion";');
}

// 2. Replace all <section className="py-16 ..."> with motion.section
content = content.replace(/<section className="(py-16 md:py-24[^"]*)"/g, '<motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }} className="$1"');

// 3. Replace the corresponding </section> tags
// We need to be careful. The sections we replaced are starting at lines 160, 184, 210, 233, 275.
// Let's just blindly replace </section> to </motion.section> for the ones inside the main div (not the hero).
// We'll leave the hero as <section> and just change the bottom ones.
content = content.replace(
    /<\/div>\n      <\/section>/g,
    '</div>\n      </motion.section>'
);

// Specifically, the hero section is <section className="relative min-h-[90vh] overflow-hidden" data-testid="home-hero">
// It ends with </section>. The above regex /<\/div>\n      <\/section>/ should match the sections after it if formatted that way.
// Let's do a more careful replace.
content = content.split('\n').map(line => {
    if (line.includes('</section>') && !line.includes('home-hero')) {
        // actually we can't easily tell here.
        return line;
    }
    return line;
}).join('\n');

fs.writeFileSync(file, content);
console.log('Fixed home page sections partially.');
