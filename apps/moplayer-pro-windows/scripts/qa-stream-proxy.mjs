import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";

let rangeAcceptEncoding = "";
const upstream = http.createServer((request, response) => {
  if (request.url === "/master.m3u8") {
    response.writeHead(200, { "Content-Type": "application/vnd.apple.mpegurl" });
    response.end([
      "#EXTM3U",
      '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",URI="audio.m3u8"',
      '#EXT-X-MAP:URI="init.mp4"',
      "variant.m3u8",
    ].join("\n"));
    return;
  }

  if (request.url === "/file.mp4") {
    const body = Buffer.from("0123456789");
    rangeAcceptEncoding = request.headers["accept-encoding"] ?? "";
    if (request.headers.range === "bytes=2-5") {
      response.writeHead(206, {
        "Content-Type": "video/mp4",
        "Content-Length": "4",
        "Content-Range": "bytes 2-5/10",
        "Accept-Ranges": "bytes",
        ETag: "qa",
      });
      response.end(body.subarray(2, 6));
      return;
    }
    response.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": String(body.length) });
    response.end(body);
    return;
  }

  response.writeHead(200, { "Content-Type": "application/octet-stream" });
  response.end("ok");
});

upstream.listen(0, "127.0.0.1");
await once(upstream, "listening");
const address = upstream.address();
const upstreamPort = typeof address === "object" && address ? address.port : 0;
const { StreamProxy } = await import("../dist-electron/main/streamProxy.js");
const proxy = new StreamProxy();

try {
  const playlistUrl = await proxy.proxyUrl(`http://127.0.0.1:${upstreamPort}/master.m3u8`);
  const playlist = await (await fetch(playlistUrl)).text();
  assert.equal((playlist.match(/\/proxy\?url=/g) ?? []).length, 3);

  const fileUrl = await proxy.proxyUrl(`http://127.0.0.1:${upstreamPort}/file.mp4`);
  const response = await fetch(fileUrl, { headers: { Range: "bytes=2-5" } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(await response.text(), "2345");
  assert.equal(rangeAcceptEncoding, "identity");
  console.log("Stream proxy QA passed: HLS URI attributes and byte ranges.");
} finally {
  proxy.close();
  upstream.close();
  await once(upstream, "close").catch(() => {});
}
