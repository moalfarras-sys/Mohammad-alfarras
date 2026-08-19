// Native-resolution viewport capture at a scroll offset.
//   node qa-view.mjs <url> <out.png> <width> <height> <scrollY> [keepWidgets]
import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);

const [, , url, out, wRaw, hRaw, yRaw, keep] = process.argv;
const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"], protocolTimeout: 180000,
});
const page = await browser.newPage();
await page.setViewport({ width: Number(wRaw), height: Number(hRaw), deviceScaleFactor: 1, isMobile: Number(wRaw) < 700, hasTouch: Number(wRaw) < 700 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
await page.addStyleTag({ content: keep ? '[class*="cookie"],[class*="consent"]{display:none!important}' : '[class*="cookie"],[class*="consent"]{display:none!important}' });
await page.evaluate(async () => {
  const step = window.innerHeight;
  for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
});
await page.evaluate((y) => window.scrollTo(0, y), Number(yRaw || 0));
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: out });
console.log("ok " + out);
await browser.close();
