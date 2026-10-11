// Stream only the qualified public release. The R2 bucket and upload credentials
// remain private; this endpoint has no upload, listing, or arbitrary-object route.
const retiredPrefixes = ["/releases/44.20261007.1011/x86_64/", "/releases/44.20261009.1018/x86_64/"];
const previousPrefix = "/releases/44.20261010.1022/x86_64/";
const currentVersion = "44.20261011.1026";
const currentPrefix = `/releases/${currentVersion}/x86_64/`;
// Announced grace window for clients already downloading the previous ISO.
const previousRetiresAt = Date.parse("2026-10-12T12:00:00Z");
const retired = new Set(retiredPrefixes.flatMap(prefix => ["moos-offline.iso", "moos-offline.iso.sig", "moos-offline.iso.sha256"].map(name => prefix + name)));
const files = new Map([
  [`${previousPrefix}moos-offline.iso`, { size: 5827067904, type: "application/octet-stream", retiresAt: previousRetiresAt }],
  [`${previousPrefix}moos-offline.iso.sig`, { size: 96, type: "text/plain; charset=utf-8", retiresAt: previousRetiresAt }],
  [`${previousPrefix}moos-offline.iso.sha256`, { size: 83, type: "text/plain; charset=utf-8", retiresAt: previousRetiresAt }],
  [`${currentPrefix}moos-offline.iso`, { size: 5827133440, type: "application/octet-stream" }],
  [`${currentPrefix}moos-offline.iso.sig`, { size: 96, type: "text/plain; charset=utf-8" }],
  [`${currentPrefix}moos-offline.iso.sha256`, { size: 83, type: "text/plain; charset=utf-8" }],
]);

export function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2])) return null;
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if ((first !== null && !Number.isSafeInteger(first)) || (last !== null && !Number.isSafeInteger(last))) return null;
  if (first === null) {
    if (last === 0) return null;
    const length = Math.min(last, size);
    return { offset: size - length, length };
  }
  if (first >= size || (last !== null && last < first)) return null;
  const end = last === null ? size - 1 : Math.min(last, size - 1);
  return { offset: first, length: end - first + 1 };
}

const worker = {
  async fetch(request, env) {
    if (!['GET', 'HEAD'].includes(request.method)) {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const path = new URL(request.url).pathname;
    const file = files.get(path);
    // Upload/verification can fail. Never expire the still-advertised release
    // merely because its planned replacement missed the publication deadline.
    const replacementPublished = env.PUBLISHED_ISO_VERSION === currentVersion;
    if (retired.has(path) || (replacementPublished && file?.retiresAt && Date.now() >= file.retiresAt)) {
      return new Response(request.method === 'HEAD' ? null : 'This release has been retired. Choose the current verified release at https://moos-site.moalfarras-moos.workers.dev/ar/\n', {
        status: 410, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300',
          Link: '<https://moos-site.moalfarras-moos.workers.dev/ar/>; rel="latest-version"', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    if (!file) return new Response('Not found', { status: 404 });
    const key = path.slice(1);
    try {
      const info = await env.MOOS_RELEASES.head(key);
      if (!info) return new Response('Not found', { status: 404 });
      if (info.size !== file.size) return new Response('Release unavailable', { status: 503 });
      const headers = new Headers({
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${path.split('/').pop()}"`,
        'Content-Length': String(info.size),
        'Accept-Ranges': 'bytes',
        'ETag': info.httpEtag,
        'Last-Modified': info.uploaded.toUTCString(),
        'Cache-Control': 'public, max-age=86400, immutable, no-transform',
        'X-Content-Type-Options': 'nosniff',
      });
      if (request.method === 'HEAD') return new Response(null, { headers });
      if (request.headers.get('If-None-Match') === info.httpEtag) {
        headers.delete('Content-Length');
        return new Response(null, { status: 304, headers });
      }
      let rangeHeader = request.headers.get('Range');
      const ifRange = request.headers.get('If-Range');
      if (ifRange && ifRange !== info.httpEtag && ifRange !== info.uploaded.toUTCString()) rangeHeader = null;
      const range = rangeHeader ? parseRange(rangeHeader, info.size) : undefined;
      if (rangeHeader && !range) {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}`, 'Accept-Ranges': 'bytes' } });
      }
      const object = await env.MOOS_RELEASES.get(key, range ? { range } : undefined);
      if (!object || !object.body || object.size !== file.size) return new Response('Release unavailable', { status: 503 });
      if (object.httpEtag !== info.httpEtag) return new Response('Release changed; retry', { status: 409 });
      if (range) {
        if (object.range?.offset !== range.offset || object.range?.length !== range.length) {
          return new Response('Release range unavailable', { status: 503 });
        }
        headers.set('Content-Length', String(range.length));
        headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${info.size}`);
      }
      // Pass the native R2 stream through. Never buffer a multi-GB ISO in RAM.
      return new Response(object.body, { status: range ? 206 : 200, headers });
    } catch {
      return new Response('Release temporarily unavailable', { status: 503 });
    }
  },
};
export default worker;
