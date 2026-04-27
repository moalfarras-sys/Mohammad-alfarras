const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/site/portfolio-pages.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add framer-motion import
if (!content.includes('import { motion } from "framer-motion"')) {
    content = content.replace('import Image from "next/image";', 'import Image from "next/image";\nimport { motion } from "framer-motion";');
}

// 2. Add animation wrapper to the Section component
if (!content.includes('initial={{ opacity: 0, y: 20 }}') && content.includes('function Section({')) {
    content = content.replace(
        '<section data-testid={testId} className={`py-12 md:py-18 ${className}`}>',
        '<motion.section\n      initial={{ opacity: 0, y: 20 }}\n      whileInView={{ opacity: 1, y: 0 }}\n      viewport={{ once: true, margin: "-100px" }}\n      transition={{ duration: 0.6 }}\n      data-testid={testId}\n      className={`py-12 md:py-18 ${className}`}\n    >'
    );
    content = content.replace(
        '</section>',
        '</motion.section>'
    );
}

// 3. Add staggered animation to Card component
if (!content.includes('whileHover={{ y: -5 }}') && content.includes('function Card({')) {
    content = content.replace(
        '<div className={`glass rounded-[var(--radius-lg)] p-5 md:p-6 ${className}`}>{children}</div>',
        '<motion.div \n    whileHover={{ y: -5, boxShadow: "var(--shadow-elevated)", borderColor: "var(--primary-border)" }} \n    transition={{ type: "spring", stiffness: 300, damping: 20 }}\n    className={`glass rounded-[var(--radius-lg)] p-5 md:p-6 ${className}`}\n  >\n    {children}\n  </motion.div>'
    );
}

// 4. Update the portfolio projects images inside PortfolioHomePage to have hover animations
if (!content.includes('group-hover:scale-110') && content.includes('className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"')) {
    content = content.replace(
        /className="object-cover transition-transform duration-500 group-hover:scale-\[1.03\]"/g,
        'className="object-cover transition-transform duration-700 group-hover:scale-110"'
    );
}

fs.writeFileSync(file, content);
console.log('Portfolio pages updated with framer-motion animations and improved glass effects.');
