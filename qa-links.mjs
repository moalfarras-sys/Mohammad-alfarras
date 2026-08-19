// Crawl the live site like a visitor: collect every link/button on every page,
// then check each destination actually resolves.
//   node qa-links.mjs <baseUrl> <outJson>
import puppeteer from "puppeteer-core";
import { existsSync, writeFileSync } from "node:fs";

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);

const [, , base, out] = process.argv;

const PAGES = [
  "/ar", "/en", "/ar/moos", "/en/moos", "/ar/apps", "/ar/apps/moplayer",
  "/ar/apps/moplayer/classic", "/ar/apps/moplayer2", "/ar/apps/moplayer-pc",
  "/ar/apps/moplayer-ios", "/ar/moplayer/setup", "/ar/cv", "/ar/work",
  "/ar/services", "/ar/contact", "/ar/youtube", "/ar/support", "/activate",
  "/ar/about", "/ar/privacy", "/ar/impressum",
];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const pages = [];
const allLinks = new Map(); // href -> Set(found on)

for (const p of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 160)));

  let ok = true;
  try { await page.goto(base + p, { waitUntil: "networkidle2", timeout: 90000 }); } catch { ok = false; }

  const found = await page.evaluate(() => {
    const links = [...document.querySelectorAll("a[href]")].map((a) => ({
      href: a.getAttribute("href"),
      text: (a.innerText || a.getAttribute("aria-label") || "").trim().slice(0, 60),
      target: a.getAttribute("target") || "",
    }));
    const buttons = [...document.querySelectorAll("button")].map((b) => ({
      text: (b.innerText || b.getAttribute("aria-label") || "").trim().slice(0, 60),
      disabled: b.disabled,
      type: b.getAttribute("type") || "",
    })).filter((b) => b.text);
    const h1 = [...document.querySelectorAll("h1")].map((h) => h.innerText.trim().slice(0, 80));
    const imgsNoAlt = [...document.querySelectorAll("img")].filter((i) => !i.getAttribute("alt") && !i.getAttribute("aria-hidden")).length;
    const emptyLinks = links.filter((l) => !l.text && !l.href.startsWith("#")).length;
    return { links, buttons, h1, imgsNoAlt, emptyLinks, title: document.title };
  });

  for (const l of found.links) {
    if (!l.href || l.href.startsWith("#") || l.href.startsWith("mailto:") || l.href.startsWith("tel:") || l.href.startsWith("javascript:")) continue;
    const abs = l.href.startsWith("http") ? l.href : base + (l.href.startsWith("/") ? l.href : "/" + l.href);
    if (!allLinks.has(abs)) allLinks.set(abs, new Set());
    allLinks.get(abs).add(p);
  }

  pages.push({
    path: p, ok, title: found.title, h1Count: found.h1.length, h1: found.h1,
    linkCount: found.links.length, buttonCount: found.buttons.length,
    buttons: found.buttons.slice(0, 25),
    imgsNoAlt: found.imgsNoAlt, emptyLinks: found.emptyLinks,
    consoleErrors: [...new Set(consoleErrors)].slice(0, 6),
  });
  console.log(`page ${p.padEnd(24)} links=${found.links.length} btns=${found.buttons.length} h1=${found.h1.length} errs=${consoleErrors.length}`);
  await page.close();
}

// Check every distinct destination.
const checker = await browser.newPage();
const linkResults = [];
for (const [href, from] of allLinks) {
  let status = 0, finalUrl = href, err = "";
  try {
    const r = await checker.goto(href, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = r ? r.status() : 0;
    finalUrl = checker.url();
  } catch (e) { err = String(e).slice(0, 90); }
  linkResults.push({ href: href.replace(base, ""), status, finalUrl: finalUrl.replace(base, ""), from: [...from], err });
  if (status >= 400 || err) console.log(`BAD ${status} ${href} (from ${[...from].join(",")}) ${err}`);
}

writeFileSync(out, JSON.stringify({ pages, links: linkResults }, null, 1));
console.log(`\nchecked ${linkResults.length} distinct destinations`);
await browser.close();
