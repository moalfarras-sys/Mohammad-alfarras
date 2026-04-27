const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/sections/youtube-page-body.tsx';
let content = fs.readFileSync(file, 'utf8');

const tEn = content.indexOf('title: "Arabic tech content that earns trust, not just attention."');
if (tEn > -1) {
  content = content.replace('title: "Arabic tech content that earns trust, not just attention."', 'title: "Creator Media Kit & Channel Stats"');
}
const bEn = content.indexOf('body: "The channel is part of the professional identity.');
if (bEn > -1) {
  content = content.replace('body: "The channel is part of the professional identity. It proves that product explanation, consistency, and presentation quality can grow a real audience over time."', 'body: "A business card for sponsors and partners. Engaging Arabic tech content with 1.5M+ Views focused on Tech & Design."');
}
const tAr = content.indexOf('title: "محتوى تقني عربي يصنع الثقة لا مجرد استهلاك الانتباه."');
if (tAr > -1) {
  content = content.replace('title: "محتوى تقني عربي يصنع الثقة لا مجرد استهلاك الانتباه."', 'title: "الملف الإعلامي وإحصائيات القناة"');
}
const bAr = content.indexOf('body: "القناة جزء من الهوية المهنية.');
if (bAr > -1) {
  content = content.replace('body: "القناة جزء من الهوية المهنية. تُثبت أن جودة الشرح والتقديم والثبات يمكن أن تبني جمهورًا حقيقيًا يتراكم مع الوقت."', 'body: "واجهة للشركاء والرعاة. محتوى تقني عربي يركز على التكنولوجيا والتصميم مع أكثر من مليون ونصف مشاهدة."');
}

const sponsorSection = `
      {/* ── DEMOGRAPHICS & SPONSORSHIP ── */}
      <section className="py-16 md:py-24">
        <div className="section-frame">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <h2 className="text-2xl font-black text-[var(--text-1)]">{isAr ? "لماذا ترعى القناة؟" : "Why Sponsor Me?"}</h2>
              <ul className="mt-6 grid gap-4">
                <li className="flex gap-3"><Sparkles className="h-5 w-5 text-[var(--accent)]" /><span className="text-[var(--text-2)]">{isAr ? "محتوى عالي الجودة مع إنتاج سينمائي" : "High-quality content with cinematic production"}</span></li>
                <li className="flex gap-3"><MonitorSmartphone className="h-5 w-5 text-[var(--accent)]" /><span className="text-[var(--text-2)]">{isAr ? "جمهور مستهدف مهتم بالتقنية والتصميم" : "Targeted audience interested in Tech & Design"}</span></li>
                <li className="flex gap-3"><Bot className="h-5 w-5 text-[var(--accent)]" /><span className="text-[var(--text-2)]">{isAr ? "مصداقية وثقة عالية بين المتابعين" : "High credibility and trust among followers"}</span></li>
              </ul>
              <div className="mt-8">
                <a href={\`/\${model.locale}/contact?subject=Sponsorship\`} className="button-liquid-primary inline-flex items-center gap-2">
                  {isAr ? "تواصل للرعاية" : "Contact for Sponsorship"}
                </a>
              </div>
            </div>
            
            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <h2 className="text-2xl font-black text-[var(--text-1)]">{isAr ? "ديموغرافيا الجمهور" : "Audience Demographics"}</h2>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
                  <div className="text-2xl font-black text-[var(--accent)]">80%</div>
                  <div className="mt-1 text-sm font-bold text-[var(--text-2)]">MENA Region</div>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
                  <div className="text-2xl font-black text-[var(--accent)]">20%</div>
                  <div className="mt-1 text-sm font-bold text-[var(--text-2)]">Europe & Global</div>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
                  <div className="text-2xl font-black text-[var(--accent)]">90%</div>
                  <div className="mt-1 text-sm font-bold text-[var(--text-2)]">Male</div>
                </div>
                <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-elevated)] p-4">
                  <div className="text-2xl font-black text-[var(--accent)]">18-34</div>
                  <div className="mt-1 text-sm font-bold text-[var(--text-2)]">Age Group</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
`;

if (!content.includes('DEMOGRAPHICS & SPONSORSHIP')) {
  content = content.replace(/\{model\.latestVideos\.slice\(0, 6\)/g, '{model.latestVideos.slice(0, 3)');
  content = content.replace('<ContactCtaSection locale={model.locale} />', sponsorSection + '\n      <ContactCtaSection locale={model.locale} />');
  fs.writeFileSync(file, content);
  console.log('YouTube page updated.');
} else {
  console.log('Already updated.');
}
