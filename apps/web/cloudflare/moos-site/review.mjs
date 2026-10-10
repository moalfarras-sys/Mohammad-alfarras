import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.MOOS_REVIEW_URL || 'http://127.0.0.1:19410';
const origin = new URL(base);
if (!['127.0.0.1', 'moos-site.moalfarras-moos.workers.dev'].includes(origin.hostname)) throw new Error('Review only the owned local or public MoOS host');
const directory = process.env.MOOS_REVIEW_OUTPUT || path.resolve('cloudflare/moos-site/.build/review');
await mkdir(directory, { recursive: true });
const options = { headless: true, chromiumSandbox: true };
if (process.env.MOOS_BROWSER_PATH) options.executablePath = process.env.MOOS_BROWSER_PATH;
const browser = await chromium.launch(options);
const results = [];
try {
  for (const locale of ['ar', 'en']) for (const width of [390, 768, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [], requests = [], failures = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('request', (request) => requests.push(request.url()));
    page.on('response', (response) => { if (response.status() >= 400) failures.push({ url: response.url(), status: response.status() }); });
    const response = await page.goto(`${base}/${locale}/`, { waitUntil: 'networkidle' });
    if (response.status() !== 200) throw new Error('Page did not load');
    await page.evaluate(() => document.fonts.ready);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((position) => window.scrollTo(0, position), y);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      viewport: innerWidth,
      contentWidth: document.documentElement.scrollWidth,
      missingImages: [...document.images].filter((image) => !image.complete || !image.naturalWidth).map((image) => image.src),
      imageCount: document.images.length,
      fontStatus: document.fonts.status,
      downloadLinks: [...document.querySelectorAll('a[href]')].map((a) => a.href).filter((url) => url.includes('moos-offline.iso')),
    }));
    const unexpected = requests.filter((url) => ![origin.hostname, 'i.ytimg.com'].includes(new URL(url).hostname));
    if (state.lang !== locale || state.dir !== (locale === 'ar' ? 'rtl' : 'ltr') || state.contentWidth > width || state.missingImages.length || errors.length || failures.length || unexpected.length) {
      throw new Error(JSON.stringify({ locale, width, state, errors, failures, unexpected }));
    }
    if (!state.downloadLinks.some((url) => url.endsWith('.iso')) || !state.downloadLinks.some((url) => url.endsWith('.sig')) || !state.downloadLinks.some((url) => url.endsWith('.sha256'))) throw new Error('Missing direct verification downloads');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(directory, `${locale}-${width}.png`), fullPage: width === 390 });
    await page.keyboard.press('Tab');
    if (await page.evaluate(() => document.activeElement?.textContent?.trim()) !== (locale === 'ar' ? 'تخطّ إلى المحتوى' : 'Skip to content')) throw new Error('Skip link is not keyboard accessible');
    results.push({ locale, width, ...state, errors, failures, unexpected, requests: [...new Set(requests)], screenshot: `${locale}-${width}.png` });
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${base}/ar/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1100);
  await page.locator('a[href="/en/"]').click();
  await page.waitForLoadState('networkidle');
  if (await page.locator('html').getAttribute('lang') !== 'en' || errors.length) throw new Error('Language switch failed');
  await context.close();
  // Actual Worker policy, response headers and immutable script bytes.
  const head = await fetch(`${base}/api/os/download?type=iso`, { method: 'HEAD', redirect: 'manual' });
  const signature = await fetch(`${base}/api/os/download?type=iso&asset=signature`, { redirect: 'manual' });
  const unknown = await fetch(`${base}/api/os/download?type=invalid`);
  const post = await fetch(`${base}/api/os/download?type=iso`, { method: 'POST' });
  const script = await fetch(`${base}/downloads/moos/moos-install.sh`);
  const local = await readFile(path.resolve('public/downloads/moos/moos-install.sh'));
  if (head.status !== 307 || !head.headers.get('location')?.endsWith('moos-offline.iso') || signature.status !== 307 || !signature.headers.get('location')?.endsWith('.sig') || unknown.status !== 400 || post.status !== 405 || script.status !== 200 || !Buffer.from(await script.arrayBuffer()).equals(local)) throw new Error('Actual Worker/script contract failed');
  const receipt = { checkedAt: new Date().toISOString(), base, results, languageClick: true,
    workerHead: head.status, signatureRedirect: signature.status, unknown: unknown.status, post: post.status,
    scriptBytesMatch: true, noVercelRequests: true, scope: 'Actual Chromium on the independent static assets and local/real Worker; not other projects or a complete YouTube playback test.' };
  await writeFile(path.join(directory, 'receipt.json'), JSON.stringify(receipt, null, 2));
  console.log(JSON.stringify({ checkedAt: receipt.checkedAt, base, views: results.length, noVercelRequests: true, languageClick: true, workerAndScript: 'PASS' }));
} finally { await browser.close(); }
