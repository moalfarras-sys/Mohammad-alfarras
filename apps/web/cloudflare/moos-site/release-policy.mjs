/** Pure publication and redirect policy; no network or database side effects. */
export function qualifyRelease(release, proof) {
  const iso = release.iso;
  if (release.system !== 'MoOS' || !Array.isArray(release.editions) || !release.editions.length) throw new Error('Invalid MoOS release');
  for (const edition of release.editions) {
    if (edition.installer && !/^\/downloads\/moos\/[a-zA-Z0-9._-]+\.sh$/.test(edition.installer)) throw new Error('Unsafe installer path');
  }
  if (!iso.available) return;
  for (const key of ['url', 'signatureUrl', 'checksumUrl']) {
    const url = new URL(iso[key]);
    if (url.protocol !== 'https:' || url.hostname !== 'moos-downloads.moalfarras-moos.workers.dev' || url.username || url.password || url.hash || url.search) throw new Error('Unqualified download origin');
  }
  if (iso.signatureUrl !== `${iso.url}.sig` || iso.checksumUrl !== `${iso.url}.sha256`) throw new Error('Verification files do not belong to this ISO');
  if (!Number.isSafeInteger(iso.sizeBytes) || iso.sizeBytes <= 0 || !/^[a-f0-9]{64}$/.test(iso.sha256)) throw new Error('Invalid ISO identity');
  for (const key of ['url', 'sizeBytes', 'sha256', 'sourceRevision', 'imageDigest', 'version']) {
    if (!iso[key] || iso[key] !== proof[key]) throw new Error(`ISO proof mismatch: ${key}`);
  }
  if (iso.deliveryVerifiedAt !== proof.checkedAt || !Number.isFinite(Date.parse(proof.checkedAt)) ||
      !proof.signatureVerified || !proof.fullHashVerified || !proof.anonymous || !proof.sidecarsVerified ||
      proof.http !== 200 || proof.rangeHttp !== 206 || !proof.isoRun || !proof.promotionRun || !proof.buildRun || proof.diskRuns?.length !== 3) throw new Error('Incomplete release proof');
}

export function downloadResponse(request, current) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  if (current.maintenance) return Response.json({ status: 'maintenance' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  const url = new URL(request.url);
  const type = (url.searchParams.get('type') || 'desktop').toLowerCase();
  let target;
  if (type === 'iso') {
    const asset = url.searchParams.get('asset') || 'iso';
    if (!['iso', 'signature', 'checksum'].includes(asset)) return Response.json({ status: 'bad_request' }, { status: 400 });
    if (!current.iso.available) return Response.json({ status: 'pending' }, { status: 503 });
    target = asset === 'signature' ? current.iso.signatureUrl : asset === 'checksum' ? current.iso.checksumUrl : current.iso.url;
  } else {
    const edition = current.editions.find((item) => item.id === type);
    if (!edition?.installer) return Response.json({ status: 'bad_request' }, { status: 400 });
    target = new URL(edition.installer, request.url).href;
  }
  if (!target) return Response.json({ status: 'pending' }, { status: 503 });
  return new Response(null, { status: 307, headers: { Location: target, 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
}
