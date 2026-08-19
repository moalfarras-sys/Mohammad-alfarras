// Real-user performance measurement against a live site.
//   node qa-perf.mjs <baseUrl> <outJson> [mobile|desktop]
import puppeteer from "puppeteer-core";
import { existsSync, writeFileSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);

const [, , base, out, mode = "desktop"] = process.argv;
const isMobile = mode === "mobile";

const PATHS = [
  "/ar", "/en", "/ar/moos", "/ar/apps", "/ar/apps/moplayer", "/ar/apps/moplayer2",
  "/ar/apps/moplayer-pc", "/ar/apps/moplayer-ios", "/ar/cv", "/ar/work",
  "/ar/services", "/ar/contact", "/ar/youtube", "/ar/support", "/activate",
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];
for (const p of PATHS) {
  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport(isMobile ? { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1440, height: 900 });

  const client = await page.createCDPSession();
  await client.send("Network.enable");
  if (isMobile) {
    // Slow 4G + 4x CPU — a realistic phone on mobile data.
    await client.send("Network.emulateNetworkConditions", {
      offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }

  const res = [];
  page.on("response", async (r) => {
    try {
      const h = r.headers();
      res.push({
        url: r.url(),
        status: r.status(),
        type: r.request().resourceType(),
        bytes: Number(h["content-length"] || 0),
        cache: h["cache-control"] || "",
      });
    } catch {}
  });

  const t0 = Date.now();
  let navOk = true;
  try {
    await page.goto(base + p, { waitUntil: "networkidle2", timeout: 90000 });
  } catch {
    navOk = false;
  }
  const wall = Date.now() - t0;

  const metrics = await page.evaluate(() => new Promise((resolve) => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    let lcp = 0, cls = 0;
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = Math.max(lcp, e.startTime); }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    } catch {}
    const paints = performance.getEntriesByType("paint");
    setTimeout(() => resolve({
      ttfb: Math.round(nav.responseStart || 0),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      load: Math.round(nav.loadEventEnd || 0),
      fcp: Math.round(paints.find((x) => x.name === "first-contentful-paint")?.startTime || 0),
      lcp: Math.round(lcp),
      cls: Number(cls.toFixed(3)),
      transferSize: nav.transferSize || 0,
      domNodes: document.getElementsByTagName("*").length,
    }), 1200);
  }));

  // Real transfer sizes from the protocol (content-length is often absent).
  const byType = {};
  let total = 0;
  for (const r of res) {
    byType[r.type] = (byType[r.type] || 0) + r.bytes;
    total += r.bytes;
  }
  const heaviest = res.filter((r) => r.bytes > 60_000).sort((a, b) => b.bytes - a.bytes).slice(0, 8)
    .map((r) => ({ kb: Math.round(r.bytes / 1024), type: r.type, url: r.url.replace(base, "").slice(0, 110) }));

  results.push({
    path: p, navOk, wallMs: wall, ...metrics,
    requests: res.length,
    totalKB: Math.round(total / 1024),
    byTypeKB: Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, Math.round(v / 1024)])),
    heaviest,
    errors: res.filter((r) => r.status >= 400).map((r) => `${r.status} ${r.url.replace(base, "").slice(0, 90)}`),
  });
  console.log(`${p.padEnd(22)} wall=${String(wall).padStart(5)}ms lcp=${String(metrics.lcp).padStart(5)} cls=${metrics.cls} req=${res.length} ${Math.round(total / 1024)}KB`);
  await page.close();
}

writeFileSync(out, JSON.stringify({ mode, base, results }, null, 1));
await browser.close();
