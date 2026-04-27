const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/site/home-page-new.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add framer-motion import
if (!content.includes('import { motion } from "framer-motion"')) {
    content = content.replace('import Image from "next/image";', 'import Image from "next/image";\nimport { motion } from "framer-motion";');
}

// 2. Wrap main roles in staggered animations
if (!content.includes('motion.div')) {
    // Convert 'section' tags into 'motion.section' (but only those with 'section-frame')
    content = content.replace(
        /<section className="(py-16 md:py-24[^"]*)"/g,
        '<motion.section initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.7 }} className="$1"'
    );
    content = content.replace(
        /<\/section>/g,
        '</motion.section>'
    );

    // Make the Links inside roles motion links if possible, or just animate the container.
    // Instead of replacing complex link structures, I'll wrap the roles map.
    content = content.replace(
        /\{roles\.map\(\(r\) => \(/g,
        '{roles.map((r, i) => (\n              <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>'
    );
    content = content.replace(
        /<\/Link>\n            \}\)\}/g,
        '</Link>\n              </motion.div>\n            ))}'
    );
    
    // Animate the hero image
    content = content.replace(
        /<div className="relative w-full max-w-\[340px\] lg:max-w-none">/g,
        '<motion.div initial={{ opacity: 0, scale: 0.9, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, type: "spring" }} className="relative w-full max-w-[340px] lg:max-w-none">'
    );
    content = content.replace(
        /<\/div>\n            <\/div>\n\n          <\/div>/g,
        '</motion.div>\n            </div>\n\n          </div>'
    );
    
    // Animate the story arc nodes
    content = content.replace(
        /\{storyNodes\.map\(\(node, i\) => \(/g,
        '{storyNodes.map((node, i) => (\n              <motion.div key={node.year} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="flex-1 min-w-[200px]">'
    );
    content = content.replace(
        /<\/div>\n            \}\)\}/g,
        '</motion.div>\n            ))}'
    );
}

fs.writeFileSync(file, content);
console.log('Framer Motion added to home-page-new.tsx');
