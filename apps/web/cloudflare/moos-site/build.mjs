import { build } from 'esbuild';
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { qualifyRelease } from './release-policy.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const web = path.resolve(here, '../..');
const out = path.join(here, 'out');
const temp = path.join(here, '.build');
const siteOrigin = 'https://moos-site.moalfarras-moos.workers.dev';
const hash = (data) => createHash('sha256').update(data).digest('hex');
const json = (data) => JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

const release = JSON.parse(await readFile(path.join(web, 'public/downloads/moos/latest-moos.json'), 'utf8'));
const proof = JSON.parse(await readFile(path.join(web, 'public/downloads/moos/delivery-proof.json'), 'utf8'));
qualifyRelease(release, proof);
await mkdir(temp, { recursive: true });
// Only retire a previous output created by this builder, never arbitrary files.
try {
  const marker = await readFile(path.join(out, '.moos-static-build'), 'utf8');
  if (marker !== 'MoOS static assets\n') throw new Error('Refusing an unowned output directory');
  await rm(out, { recursive: true });
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await mkdir(path.join(out, 'assets'), { recursive: true });
await writeFile(path.join(out, '.moos-static-build'), 'MoOS static assets\n');
await cp(path.join(web, 'public/images/moos'), path.join(out, 'images/moos'), { recursive: true });
await cp(path.join(web, 'public/downloads/moos'), path.join(out, 'downloads/moos'), { recursive: true });

const adapters = path.join(here, 'adapters.tsx');
const plugin = {
  name: 'moos-static-framework-adapters',
  setup(bundle) {
    bundle.onResolve({ filter: /^next\/(image|link)$/ }, ({ path: name }) => ({ path: name, namespace: 'moos-static' }));
    bundle.onLoad({ filter: /.*/, namespace: 'moos-static' }, ({ path: name }) => ({
      contents: `export { ${name.endsWith('image') ? 'StaticImage' : 'StaticLink'} as default } from ${JSON.stringify(adapters)};`, resolveDir: here, loader: 'js',
    }));
    bundle.onResolve({ filter: /^@\// }, ({ path: name, kind }) => bundle.resolve(path.join(web, 'src', name.slice(2)), { kind, resolveDir: web }));
    // The shared page's CSS is compiled together with the existing design tokens below.
    bundle.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }));
  },
};
const common = { bundle: true, plugins: [plugin], jsx: 'automatic', logLevel: 'warning' };
await writeFile(path.join(temp, 'server.tsx'), `import { renderToString } from 'react-dom/server';\nimport { App } from '../runtime';\nexport function render(data) { return renderToString(<App {...data}/>); }\n`);
await build({ ...common, entryPoints: [path.join(temp, 'server.tsx')], outfile: path.join(temp, 'server.mjs'), platform: 'node', format: 'esm', packages: 'external' });
const browser = await build({ ...common, entryPoints: [path.join(here, 'runtime.tsx')], write: false, platform: 'browser', format: 'esm', minify: true, define: { 'process.env.NODE_ENV': '"production"' } });
const script = browser.outputFiles[0].contents;
const scriptName = `site-${hash(script).slice(0, 16)}.js`;
await writeFile(path.join(out, 'assets', scriptName), script);
const files = ['src/app/globals.css', 'src/styles/studio.css', 'src/styles/v3-motion.css', 'src/styles/v3-moos.css'];
const css = (await Promise.all(files.map((name) => readFile(path.join(web, name), 'utf8')))).join('\n') + '\n' + await readFile(path.join(here, 'static.css'), 'utf8');
const compiled = await postcss([tailwind({ base: web }), autoprefixer()]).process(css, { from: path.join(web, 'src/app/globals.css'), to: path.join(out, 'assets/site.css') });
await writeFile(path.join(out, 'assets/site.css'), compiled.css);

// Fetch the existing website's font families at build time. Visitors contact only
// this static host for fonts; no Google stylesheet, optimizer or runtime fetch.
const fontsUrl = 'https://fonts.googleapis.com/css2?family=Alexandria:wght@100..900&family=Cairo:wght@200..1000&family=Geist+Mono:wght@100..900&family=Instrument+Serif:ital@1&family=Manrope:wght@200..800&display=swap';
const response = await fetch(fontsUrl, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'Mozilla/5.0 MoOS-Static-Font-Build/1.0' } });
if (!response.ok) throw new Error(`Font stylesheet unavailable: ${response.status}`);
let fontCss = await response.text();
if (Buffer.byteLength(fontCss) > 128 * 1024) throw new Error('Font stylesheet too large');
await mkdir(path.join(out, 'fonts'), { recursive: true });
const fonts = [];
for (const url of new Set(Array.from(fontCss.matchAll(/url\((https:\/\/[^)]+)\)/g), (m) => m[1]))) {
  if (new URL(url).hostname !== 'fonts.gstatic.com') throw new Error('Unexpected font host');
  const result = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!result.ok) throw new Error(`Font unavailable: ${result.status}`);
  const bytes = Buffer.from(await result.arrayBuffer());
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) throw new Error('Font size invalid');
  const ext = new URL(url).pathname.endsWith('.woff2') ? 'woff2' : 'ttf';
  const name = `${hash(bytes)}.${ext}`;
  await writeFile(path.join(out, 'fonts', name), bytes);
  fonts.push({ source: url, path: `/fonts/${name}`, sha256: hash(bytes), size: bytes.length });
  fontCss = fontCss.split(url).join(`/fonts/${name}`);
}
await writeFile(path.join(out, 'assets/fonts.css'), fontCss);
for (const family of ['alexandria', 'cairo', 'geistmono', 'instrumentserif', 'manrope']) {
  const url = `https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`;
  const result = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!result.ok) throw new Error(`Missing font attribution: ${family}`);
  await writeFile(path.join(out, 'fonts', `${family}-OFL.txt`), await result.text());
}
const { render } = await import(path.join(temp, 'server.mjs'));
for (const locale of ['ar', 'en']) {
  const data = { locale, release, siteOrigin };
  const title = locale === 'ar' ? 'MoOS — نظام تشغيل عربي للكمبيوتر' : 'MoOS — Arabic-first desktop operating system';
  const description = locale === 'ar' ? 'تعرّف إلى MoOS وميرا، وحمّل الإصدار الموقّع مع بصمته وإثبات تثبيته. مشروع قيد التطوير واختبار الأجهزة.' : 'Explore MoOS and Mira. Download the signed release with its checksum and installation proof. Hardware qualification is ongoing.';
  const html = `<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${siteOrigin}/${locale}/"><link rel="alternate" hreflang="ar" href="${siteOrigin}/ar/"><link rel="alternate" hreflang="en" href="${siteOrigin}/en/"><link rel="icon" href="/images/moos/moos-logo.png"><link rel="stylesheet" href="/assets/fonts.css"><link rel="stylesheet" href="/assets/site.css"><noscript><style>[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}</style></noscript></head><body><div id="moos-root">${render(data)}</div><script id="moos-page-data" type="application/json">${json(data)}</script><script type="module" src="/assets/${scriptName}"></script></body></html>`;
  await mkdir(path.join(out, locale), { recursive: true });
  await writeFile(path.join(out, locale, 'index.html'), html);
}
await writeFile(path.join(out, '_redirects'), '/ /ar/ 302\n/moos /ar/ 302\n/ar/moos /ar/ 302\n/en/moos /en/ 302\n');
await writeFile(path.join(out, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://i.ytimg.com data:; font-src 'self'; connect-src 'self'; frame-src https://www.youtube-nocookie.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\n/assets/*\n  Cache-Control: public, max-age=86400\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n/images/*\n  Cache-Control: public, max-age=86400\n/downloads/moos/*\n  Cache-Control: public, max-age=300\n`);
await writeFile(path.join(temp, 'release.json'), json(release));
const entries = [];
async function inventory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await inventory(filename);
    else { const bytes = await readFile(filename); entries.push({ path: path.relative(out, filename), size: bytes.length, sha256: hash(bytes) }); }
  }
}
await inventory(out);
await writeFile(path.join(temp, 'build-receipt.json'), JSON.stringify({ siteOrigin, release: release.iso.version, sourceRevision: release.iso.sourceRevision, totalBytes: entries.reduce((sum, item) => sum + item.size, 0), files: entries, fonts, scope: 'Static MoOS only: no CMS, visit beacon, Vercel analytics, optimizer, polling or database.' }, null, 2));
console.log(`MoOS static export: ${entries.length} files, ${entries.reduce((sum, item) => sum + item.size, 0)} bytes`);
