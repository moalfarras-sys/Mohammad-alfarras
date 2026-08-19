// Diagnose WHAT the LCP element is and what blocks it, on a throttled phone.
//   node qa-lcp.mjs <url>
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);

const [, , url] = process.argv;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const client = await page.createCDPSession();
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
});
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

await page.goto(url, { waitUntil: "networkidle2", timeout: 120000 });

const report = await page.evaluate(() => new Promise((resolve) => {
  let lcpEntry = null;
  try {
    new PerformanceObserver((l) => { const es = l.getEntries(); lcpEntry = es[es.length - 1]; })
      .observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
  setTimeout(() => {
    const res = performance.getEntriesByType("resource")
      .map((r) => ({
        name: r.name.split("/").slice(-1)[0].slice(0, 60),
        type: r.initiatorType,
        start: Math.round(r.startTime),
        dur: Math.round(r.duration),
        end: Math.round(r.responseEnd),
        kb: Math.round((r.encodedBodySize || r.transferSize || 0) / 1024),
      }))
      .sort((a, b) => b.end - a.end);
    const nav = performance.getEntriesByType("navigation")[0] || {};
    resolve({
      lcp: lcpEntry ? {
        time: Math.round(lcpEntry.startTime),
        element: lcpEntry.element ? lcpEntry.element.tagName + (lcpEntry.element.className ? "." + String(lcpEntry.element.className).split(" ")[0] : "") : "?",
        url: lcpEntry.url ? lcpEntry.url.split("/").slice(-1)[0].slice(0, 70) : "(text)",
        size: lcpEntry.size,
      } : null,
      domInteractive: Math.round(nav.domInteractive || 0),
      domComplete: Math.round(nav.domComplete || 0),
      totalJsKb: Math.round(performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024),
      totalCssKb: Math.round(performance.getEntriesByType("resource").filter((r) => r.initiatorType === "link" || r.initiatorType === "css").reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024),
      totalImgKb: Math.round(performance.getEntriesByType("resource").filter((r) => r.initiatorType === "img" || r.initiatorType === "image").reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024),
      fontsKb: Math.round(performance.getEntriesByType("resource").filter((r) => /\.(woff2?|ttf)/.test(r.name)).reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024),
      lastResources: res.slice(0, 12),
      requestCount: res.length,
    });
  }, 2500);
}));
console.log(url);
console.log(JSON.stringify(report, null, 1));
await browser.close();
