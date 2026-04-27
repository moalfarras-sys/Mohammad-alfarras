const fs = require('fs');

// 1. Fix Youtube Page Categories
const ytFile = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/sections/youtube-page-body.tsx';
if (fs.existsSync(ytFile)) {
    let ytContent = fs.readFileSync(ytFile, 'utf8');
    ytContent = ytContent.replace(/const categories = \[([\s\S]*?)\];/, `const categories = [
    { id: "ai", icon: <Bot className="h-6 w-6" />, titleEn: "AI & SaaS Tools", titleAr: "أدوات الذكاء الاصطناعي و SaaS" },
    { id: "apps", icon: <Box className="h-6 w-6" />, titleEn: "Apps", titleAr: "تطبيقات" },
    { id: "tech", icon: <MonitorSmartphone className="h-6 w-6" />, titleEn: "Electronics", titleAr: "إلكترونيات" },
    { id: "design", icon: <PenTool className="h-6 w-6" />, titleEn: "Design Tools", titleAr: "أدوات التصميم" },
    { id: "marketing", icon: <Wand2 className="h-6 w-6" />, titleEn: "Marketing Tools", titleAr: "أدوات التسويق" },
    { id: "tutorials", icon: <Lightbulb className="h-6 w-6" />, titleEn: "Tutorials", titleAr: "شروحات" },
  ];`);
    fs.writeFileSync(ytFile, ytContent);
}

// 2. Enhance CV Career Map Visuals in portfolio-pages.tsx
const portfolioFile = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/site/portfolio-pages.tsx';
if (fs.existsSync(portfolioFile)) {
    let pfContent = fs.readFileSync(portfolioFile, 'utf8');
    
    // Improve Timeline Dot
    pfContent = pfContent.replace(
        '<div className="absolute left-[11px] top-1.5 h-2.5 w-2.5 rounded-full border-2 bg-[var(--bg-base)] md:left-[157px]" style={{ borderColor: "var(--accent)" }} />',
        '<div className="absolute left-[8px] top-1.5 h-4 w-4 rounded-full border-4 bg-[var(--bg-base)] shadow-[0_0_15px_rgba(0,229,255,0.5)] md:left-[153px]" style={{ borderColor: "var(--accent)" }} />'
    );
    
    // Add "Career Map" Heading if missing
    if (!pfContent.includes('Career Map')) {
       pfContent = pfContent.replace(
           '{t.experienceTitle}',
           'Career Map · {t.experienceTitle}'
       );
    }
    
    fs.writeFileSync(portfolioFile, pfContent);
}

console.log('UI Fixes Applied.');
