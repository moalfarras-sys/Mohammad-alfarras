const fs = require('fs');
const file = 'c:/Users/Moalfarras/Desktop/Desktop_Transfer_2026-04-25/Moalfarrasappseit/apps/web/src/components/layout/site-footer.tsx';
let content = fs.readFileSync(file, 'utf8');
const start = content.indexOf('<CollapsibleSection title={isAr ?');
const end = content.indexOf('</CollapsibleSection>', start) + '</CollapsibleSection>'.length;
if (start !== -1 && end !== -1) {
  const newBlock = `<CollapsibleSection title={isAr ? "حقائق سريعة" : "Quick facts"}>
              <div className="flex flex-col gap-2.5 pt-1 md:pt-0">
                <span className="flex w-fit items-center rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] shadow-sm">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
                  {isAr ? "مقيم في ألمانيا" : "Based in Germany"}
                </span>
                <span className="flex w-fit items-center rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] shadow-sm">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                  {isAr ? "الجذور: الحسكة، سوريا" : "Roots: Al-Hasakah, Syria"}
                </span>
                <span className="flex w-fit items-center rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-2)] shadow-sm">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                  {isAr ? "العربية / الألمانية / الإنجليزية" : "Languages: AR / DE / EN"}
                </span>
                <span className="flex w-fit items-center rounded-lg border border-[var(--glass-border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-bold text-[var(--accent-glow)] shadow-sm">
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[var(--accent-glow)] animate-pulse"></span>
                  {isAr ? "+1.5M مشاهدة على يوتيوب" : "1.5M+ YouTube views"}
                </span>
              </div>
            </CollapsibleSection>`;
  content = content.substring(0, start) + newBlock + content.substring(end);
  fs.writeFileSync(file, content);
  console.log("Footer facts replaced.");
} else {
  console.log("Could not find the target section.");
}
