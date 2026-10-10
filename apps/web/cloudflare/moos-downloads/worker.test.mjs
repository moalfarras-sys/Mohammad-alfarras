import assert from 'node:assert/strict';
import test from 'node:test';
import worker from './worker.mjs';

const size = 5827067904;
const path = '/releases/44.20261010.1022/x86_64/moos-offline.iso';
const etag = '"qualified-object"';
const uploaded = new Date('2026-10-08T10:00:00Z');

function rig({ missing = false, wrongSize = false, changed = false, wrongRange = false, objectSize = size, publishedVersion = "44.20261010.1022" } = {}) {
  const calls = [];
  const info = { size: wrongSize ? 99 : objectSize, httpEtag: etag, uploaded };
  const env = { PUBLISHED_ISO_VERSION: publishedVersion, MOOS_RELEASES: {
    async head(key) { calls.push(['head', key]); return missing ? null : info; },
    async get(key, options) {
      calls.push(['get', key, options]);
      const range = options?.range;
      const offset = range?.offset ?? 0;
      const count = range?.length ?? 32;
      assert.ok(count <= 64, 'Test never materializes the full ISO');
      const bytes = Uint8Array.from({ length: count }, (_, n) => (offset + n) % 251);
      return { ...info, httpEtag: changed ? '"changed-object"' : etag,
        range: wrongRange ? { offset: 0, length: count } : range,
        body: new ReadableStream({ start(controller) { controller.enqueue(bytes); controller.close(); } }),
      };
    },
  } };
  return { calls, env };
}

async function request(headers = {}, method = 'GET', options = {}, pathname = path) {
  const { env, calls } = rig(options);
  const response = await worker.fetch(new Request(`https://downloads.example${pathname}`, { method, headers }), env);
  return { response, calls };
}

test('full response retains exact >4-GiB length, strong validator and attachment name', async () => {
  const { response } = await request();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Content-Length'), String(size));
  assert.equal(response.headers.get('ETag'), etag);
  assert.match(response.headers.get('Content-Disposition'), /moos-offline\.iso/);
  assert.match(response.headers.get('Cache-Control'), /no-transform/);
  assert.equal((await response.arrayBuffer()).byteLength, 32);
});

test('new qualified release resumes beyond 4 GiB and retains both verification files', async () => {
  const current = path;
  const currentSize = size;
  const { response } = await request({ Range: 'bytes=4294967296-4294967311' }, 'GET', { objectSize: currentSize }, current);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('Content-Range'), `bytes 4294967296-4294967311/${currentSize}`);
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], Array.from({ length: 16 }, (_, n) => (4294967296 + n) % 251));
  for (const [suffix, objectSize] of [['.sig', 96], ['.sha256', 83]]) {
    const file = await request({}, 'HEAD', { objectSize }, current + suffix);
    assert.equal(file.response.status, 200);
    assert.equal(file.response.headers.get('Content-Length'), String(objectSize));
  }
  assert.equal((await request({}, 'GET', { objectSize: 5796462592 }, current)).response.status, 503);
});

test('retired immutable paths return 410 without silently redirecting or reading R2', async () => {
  for (const suffix of ['', '.sig', '.sha256']) for (const method of ['GET', 'HEAD']) {
    const result = await request({}, method, {}, '/releases/44.20261007.1011/x86_64/moos-offline.iso' + suffix);
    assert.equal(result.response.status, 410);
    assert.equal(result.response.headers.get('Location'), null);
    assert.match(result.response.headers.get('Link'), /latest-version/);
    assert.equal(result.calls.length, 0);
  }
});

test('previous qualified release is resumable during its stated grace window, then explicitly retired', async () => {
  const previous = '/releases/44.20261009.1018/x86_64/moos-offline.iso';
  const previousSize = 5808128000;
  const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-11T14:59:59Z');
    const result = await request({ Range: 'bytes=4294967296-4294967311' }, 'GET', { objectSize: previousSize }, previous);
    assert.equal(result.response.status, 206);
    assert.equal(result.response.headers.get('Content-Range'), `bytes 4294967296-4294967311/${previousSize}`);
    Date.now = () => Date.parse('2026-10-11T15:00:00Z');
    for (const suffix of ['', '.sig', '.sha256']) {
      const retired = await request({}, 'GET', {}, previous + suffix);
      assert.equal(retired.response.status, 410);
      assert.equal(retired.calls.length, 0);
      assert.equal(retired.response.headers.get('Location'), null);
    }
  } finally { Date.now = realNow; }
});


test('a failed or delayed replacement never expires the still-qualified public release', async () => {
  const realNow = Date.now;
  try {
    Date.now = () => Date.parse('2026-10-12T00:00:00Z');
    for (const publishedVersion of [undefined, '', '44.20261009.1018', 'unverified']) {
      const result = await request({ Range: 'bytes=4294967296-4294967311' }, 'GET',
        { objectSize: 5808128000, publishedVersion: publishedVersion ?? null },
        '/releases/44.20261009.1018/x86_64/moos-offline.iso');
      assert.equal(result.response.status, 206);
      assert.equal(result.response.headers.get('Content-Range'), 'bytes 4294967296-4294967311/5808128000');
      assert.equal((await result.response.arrayBuffer()).byteLength, 16);
    }
  } finally { Date.now = realNow; }
});

for (const [value, first, count] of [
  ['bytes=0-15', 0, 16],
  ['bytes=4294967296-4294967311', 4294967296, 16],
  [`bytes=${size - 16}-${size - 1}`, size - 16, 16],
  ['bytes=-16', size - 16, 16],
  [`bytes=${size - 16}-`, size - 16, 16],
  [`bytes=${size - 16}-${size + 20}`, size - 16, 16],
]) {
  test(`correct resumable bytes for ${value}`, async () => {
    const { response } = await request({ Range: value });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Range'), `bytes ${first}-${first + count - 1}/${size}`);
    assert.equal(response.headers.get('Content-Length'), String(count));
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], Array.from({ length: count }, (_, n) => (first + n) % 251));
  });
}

for (const range of [`bytes=${size}-`, 'bytes=10-2', 'bytes=-0', 'bytes=-', 'bytes=1-3,8-9', 'bytes=9007199254740992-']) {
  test(`reject invalid/unsatisfiable range ${range} without reading object data`, async () => {
    const { response, calls } = await request({ Range: range });
    assert.equal(response.status, 416);
    assert.equal(response.headers.get('Content-Range'), `bytes */${size}`);
    assert.equal(calls.some(([action]) => action === 'get'), false);
  });
}

test('HEAD reads metadata only and GET conditional match returns 304', async () => {
  const head = await request({}, 'HEAD');
  assert.equal(head.response.status, 200);
  assert.equal(head.response.body, null);
  assert.equal(head.calls.length, 1);
  const cached = await request({ 'If-None-Match': etag });
  assert.equal(cached.response.status, 304);
  assert.equal(cached.calls.length, 1);
});

test('If-Range mismatch returns the whole representation', async () => {
  const { response, calls } = await request({ Range: 'bytes=0-15', 'If-Range': '"old"' });
  assert.equal(response.status, 200);
  assert.equal(calls[1][2], undefined);
});

test('public endpoint cannot list, upload or expose another bucket object', async () => {
  for (const pathname of ['/', '/photos/private.jpg', '/releases/44.20261007.1011/x86_64/credentials.json']) {
    const { response, calls } = await request({}, 'GET', {}, pathname);
    assert.equal(response.status, 404); assert.equal(calls.length, 0);
  }
  const { response, calls } = await request({}, 'POST');
  assert.equal(response.status, 405); assert.equal(calls.length, 0);
});

test('missing, replaced or inconsistent release objects fail closed', async () => {
  assert.equal((await request({}, 'GET', { missing: true })).response.status, 404);
  assert.equal((await request({}, 'GET', { wrongSize: true })).response.status, 503);
  assert.equal((await request({}, 'GET', { changed: true })).response.status, 409);
  assert.equal((await request({ Range: 'bytes=16-31' }, 'GET', { wrongRange: true })).response.status, 503);
});
