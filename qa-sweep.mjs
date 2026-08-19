// Visual sweep: capture every important page at a given width.
//   node qa-sweep.mjs <baseUrl> <outDir> <width> <height> [full|viewport]
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
  ["home", "/ar"], ["moos", "/ar/moos"], ["apps", "/ar/apps"],
  ["moplayer", "/ar/apps/moplayer"], ["pro", "/ar/apps/moplayer2"],
  ["pc", "/ar/apps/moplayer-pc"], ["ios", "/ar/apps/moplayer-ios"],
  ["cv", "/ar/cv"], ["work", "/ar/work"], ["services", "/ar/services"],
  ["contact", "/ar/contact"], ["youtube", "/ar/youtube"],
  ["support", "/ar/support"], ["activate", "/activate"], ["setup", "/ar/moplayer/setup"],
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

for (const [name, path] of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile, hasTouch: isMobile });
  try {
    await page.goto(base + path, { waitUntil: "networkidle2", timeout: 90000 });
  } catch { /* still capture whatever rendered */ }
  await page.addStyleTag({ content: '[class*="cookie"],[class*="consent"]{display:none!important}' });
  await page.evaluate(async () => {
    const step = window.innerHeight;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 500));
  const health = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    broken: Array.from(document.images).filter((i) => !i.naturalWidth).map((i) => (i.currentSrc || i.src).slice(-70)),
    tinyText: Array.from(document.querySelectorAll("p,li,span,a")).filter((e) => {
      const s = parseFloat(getComputedStyle(e).fontSize);
      return s > 0 && s < 12 && e.innerText && e.innerText.trim().length > 12;
    }).length,
    tapTooSmall: Array.from(document.querySelectorAll("a,button")).filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32) && (e.innerText || "").trim().length > 0;
    }).length,
  }));
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: mode === "full" });
  console.log(`${name.padEnd(10)} overflow=${health.overflow} broken=${health.broken.length} tinyText=${health.tinyText} smallTaps=${health.tapTooSmall}${health.broken.length ? " :: " + health.broken.join(", ") : ""}`);
  await page.close();
}
await browser.close();
