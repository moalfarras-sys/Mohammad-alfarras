const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/site/portfolio-pages.tsx';
let content = fs.readFileSync(file, 'utf8');

const additionalSection = `
      {/* ── LANGUAGES & TOOLS ── */}
      <section className="py-16 md:py-20">
        <div className="section-frame">
          <div className="grid gap-10 lg:grid-cols-2">
            
            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{model.locale === "ar" ? "اللغات" : "Language Bars"}</p>
              <div className="mt-8 grid gap-6">
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-[var(--text-1)]">
                    <span>{model.locale === "ar" ? "العربية" : "Arabic"}</span>
                    <span className="text-[var(--text-3)]">{model.locale === "ar" ? "لغة أم" : "Native"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full bg-[var(--accent)]" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-[var(--text-1)]">
                    <span>{model.locale === "ar" ? "الإنجليزية" : "English"}</span>
                    <span className="text-[var(--text-3)]">{model.locale === "ar" ? "طلاقة مهنية" : "Fluent / Professional"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full bg-[var(--accent)]" style={{ width: "95%" }} />
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm font-bold text-[var(--text-1)]">
                    <span>{model.locale === "ar" ? "الألمانية" : "German"}</span>
                    <span className="text-[var(--text-3)]">{model.locale === "ar" ? "مستوى متقدم - B2/C1" : "Advanced - B2/C1"}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div className="h-full bg-[var(--accent)]" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{model.locale === "ar" ? "سحابة الأدوات" : "Tools Cloud"}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {["Figma", "VS Code", "Android Studio", "Premiere Pro", "After Effects", "Notion", "GitHub", "Vercel", "Supabase", "Cursor", "Linear"].map((tool) => (
                  <span key={tool} className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-base)] px-4 py-2 text-sm font-semibold text-[var(--text-1)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

          </div>
          
          <div className="mt-10 glass rounded-[var(--radius-xl)] p-8" style={{ boxShadow: "var(--shadow-card)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--accent)" }}>{model.locale === "ar" ? "مشاريع مميزة" : "Project Badges"}</p>
            <div className="mt-6 flex flex-wrap gap-4">
               {model.projects.slice(0, 4).map(p => (
                 <Link key={p.id} href={\`/\${model.locale}/work/\${p.slug}\`} className="flex items-center gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-4 py-2 hover:bg-[var(--glass-border)] transition">
                   <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                   <span className="text-sm font-bold text-[var(--text-1)]">{p.title}</span>
                 </Link>
               ))}
            </div>
          </div>
        </div>
      </section>
`;

if (!content.includes('LANGUAGES & TOOLS')) {
  content = content.replace('{/* ── TIMELINE ── */}', additionalSection + '\n      {/* ── TIMELINE ── */}');
  fs.writeFileSync(file, content);
  console.log('CV page updated with languages, tools, and project badges.');
} else {
  console.log('CV page already updated.');
}
