import puppeteer from "puppeteer-core";
import { existsSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
if (!CHROME) throw new Error("No Chrome/Edge binary found");

const [, , url, out, wRaw, hRaw, fullRaw] = process.argv;
const width = Number(wRaw || 1440);
const height = Number(hRaw || 900);
const full = fullRaw !== "viewport";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=1"],
});
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 90000 });
// Hide the site-wide cookie banner + assistant so they don't cover the design.
await page.addStyleTag({
  content: '[class*="cookie"],[class*="consent"],[class*="moai"],[class*="assistant"]{display:none!important}',
});
// Trigger lazy images, then settle back.
await page.evaluate(async () => {
  const step = window.innerHeight;
  for (let y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
  window.scrollTo(0, 0);
});
await page.evaluate(() => Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))));
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: out, fullPage: full });
const broken = await page.evaluate(() =>
  Array.from(document.images)
    .filter((i) => !i.naturalWidth)
    .map((i) => i.currentSrc || i.src),
);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
console.log(JSON.stringify({ out, broken, horizontalOverflowPx: overflow }));
await browser.close();
