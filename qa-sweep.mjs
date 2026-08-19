// Visual + layout-health sweep.
//   node qa-sweep.mjs <baseUrl> <outDir> <width> <height> [full|viewport]
// Captures every page and reports concrete layout defects: horizontal overflow,
// text overflowing its box, overlapping text nodes, tiny text, small tap
// targets and broken images.
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);

const [, , base, outDir, wRaw, hRaw, mode = "full"] = process.argv;
const width = Number(wRaw), height = Number(hRaw);
const isMobile = width < 700;
mkdirSync(outDir, { recursive: true });

const PAGES = [
  ["home", "/ar"], ["home-en", "/en"], ["moos", "/ar/moos"], ["apps", "/ar/apps"],
  ["moplayer", "/ar/apps/moplayer"], ["classic", "/ar/apps/moplayer/classic"],
  ["pro", "/ar/apps/moplayer2"], ["pc", "/ar/apps/moplayer-pc"],
  ["ios", "/ar/apps/moplayer-ios"], ["cv", "/ar/cv"], ["work", "/ar/work"],
  ["services", "/ar/services"], ["contact", "/ar/contact"],
  ["youtube", "/ar/youtube"], ["support", "/ar/support"],
  ["activate", "/activate"], ["about", "/ar/about"], ["impressum", "/ar/impressum"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"], protocolTimeout: 180000,
});

for (const [name, path] of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });
  try {
    await page.goto(base + path, { waitUntil: "networkidle2", timeout: 90000 });
  } catch { /* capture whatever rendered */ }
  await page.addStyleTag({ content: '[class*="cookie"],[class*="consent"]{display:none!important}' });
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 600));

  const health = await page.evaluate(() => {
    const txt = (e) => (e.innerText || "").trim();
    const vis = (e) => {
      const s = getComputedStyle(e);
      return s.display !== "none" && s.visibility !== "hidden" && Number(s.opacity) > 0.05;
    };
    const leaves = [...document.querySelectorAll("h1,h2,h3,h4,p,span,a,li,strong,em,button,code")]
      .filter((e) => vis(e) && txt(e) && !e.querySelector("h1,h2,h3,h4,p,span,a,li,strong,em,button,code"));

    // Text wider/taller than the box that paints it (a real clipping bug).
    const clipped = [];
    for (const e of leaves) {
      const s = getComputedStyle(e);
      if (s.overflow === "auto" || s.overflow === "scroll" || s.overflowX === "auto") continue;
      if (e.scrollWidth > e.clientWidth + 2 && e.clientWidth > 0 && s.overflowX === "hidden") {
        clipped.push({ t: txt(e).slice(0, 40), by: e.scrollWidth - e.clientWidth });
      }
    }

    // Text painted outside the viewport horizontally.
    const outside = leaves.filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && (r.left < -2 || r.right > window.innerWidth + 2);
    }).map((e) => ({ t: txt(e).slice(0, 40), left: Math.round(e.getBoundingClientRect().left), right: Math.round(e.getBoundingClientRect().right) }));

    // Two text nodes physically overlapping (unreadable stacking).
    const boxes = leaves.map((e) => ({ e, r: e.getBoundingClientRect() })).filter((b) => b.r.width > 30 && b.r.height > 8);
    const overlaps = [];
    for (let i = 0; i < boxes.length && overlaps.length < 6; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
        const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (ox > 12 && oy > 8) {
          overlaps.push({ a: txt(a.e).slice(0, 28), b: txt(b.e).slice(0, 28), ox: Math.round(ox), oy: Math.round(oy) });
          break;
        }
      }
    }

    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      broken: [...document.images].filter((i) => !i.naturalWidth).map((i) => (i.currentSrc || i.src).slice(-60)),
      clipped: clipped.slice(0, 5),
      outside: outside.slice(0, 5),
      overlaps,
      tiny: leaves.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12 && txt(e).length > 15).length,
      smallTap: [...document.querySelectorAll("a,button")].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.height < 32 || r.width < 32) && txt(e).length > 0;
      }).length,
      height: document.documentElement.scrollHeight,
    };
  });

  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: mode === "full" });
  const flags = [];
  if (health.overflow > 0) flags.push(`OVERFLOW:${health.overflow}px`);
  if (health.broken.length) flags.push(`BROKEN:${health.broken.length}`);
  if (health.clipped.length) flags.push(`CLIPPED:${health.clipped.length}`);
  if (health.outside.length) flags.push(`OUTSIDE:${health.outside.length}`);
  if (health.overlaps.length) flags.push(`OVERLAP:${health.overlaps.length}`);
  console.log(`${name.padEnd(11)} h=${String(health.height).padStart(5)} tiny=${String(health.tiny).padStart(2)} tap=${String(health.smallTap).padStart(2)} ${flags.join(" ") || "clean"}`);
  for (const c of health.clipped) console.log(`    clipped +${c.by}px: "${c.t}"`);
  for (const o of health.outside) console.log(`    outside [${o.left},${o.right}]: "${o.t}"`);
  for (const o of health.overlaps) console.log(`    overlap ${o.ox}x${o.oy}: "${o.a}" / "${o.b}"`);
  await page.close();
}
await browser.close();
