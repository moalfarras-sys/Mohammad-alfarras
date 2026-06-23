const path = require('path');
const { chromium } = require(path.resolve('apps/web/node_modules/playwright'));
const OUT = path.resolve('apps/web/public/cv');
(async () => {
  const browser = await chromium.launch();
  for (const loc of ['ar', 'en']) {
    const page = await browser.newPage();
    await page.goto(`http://localhost:3000/${loc}/cv-print`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('.cvp-page', { timeout: 30000 });
    await page.emulateMedia({ media: 'print' });
    await page.waitForTimeout(800);
    const file = path.join(OUT, `Mohammad-Alfarras-CV-${loc}.pdf`);
    await page.pdf({ path: file, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    console.log('wrote', file);
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
