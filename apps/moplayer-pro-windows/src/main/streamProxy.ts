import http from "node:http";
import { once } from "node:events";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const PLAYLIST_BYTES_LIMIT = 12 * 1024 * 1024;

function looksLikePlaylistTarget(target: string, contentType: string) {
  const path = target.split("?")[0].toLowerCase();
  return (
    contentType.includes("mpegurl") ||
    contentType.includes("x-mpegurl") ||
    path.endsWith(".m3u8") ||
    path.endsWith(".m3u")
  );
}

function isPlaylistBody(body: string) {
  return body.trimStart().startsWith("#EXTM3U");
}

function toAbsoluteUrl(line: string, baseUrl: string) {
  try {
    return new URL(line, baseUrl).toString();
  } catch {
    return line;
  }
}

function rewritePlaylist(body: string, baseUrl: string, proxyBase: string) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      if (trimmed.startsWith("#")) {
        // HLS can place media, subtitles, encryption keys, and init segments in
        // URI attributes. All of them need the same local proxy treatment.
        if (trimmed.includes("URI=")) {
          return line.replace(/URI="([^"]+)"/g, (_match, uri: string) => (
            `URI="${proxyBase}/proxy?url=${encodeURIComponent(toAbsoluteUrl(uri, baseUrl))}"`
          ));
        }
        return line;
      }
      return `${proxyBase}/proxy?url=${encodeURIComponent(toAbsoluteUrl(trimmed, baseUrl))}`;
    })
    .join("\n");
}

export class StreamProxy {
  private server: http.Server | null = null;
  private baseUrl = "";

  async start() {
    if (this.server && this.baseUrl) return this.baseUrl;
    this.server = http.createServer((request, response) => {
      void this.handle(request, response);
    });
    this.server.keepAliveTimeout = 30_000;
    this.server.headersTimeout = 35_000;

    this.server.listen(0, "127.0.0.1");
    await once(this.server, "listening");
    const address = this.server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    this.baseUrl = `http://127.0.0.1:${port}`;
    return this.baseUrl;
  }

  private async handle(request: http.IncomingMessage, response: http.ServerResponse) {
    const abort = new AbortController();
    response.on("close", () => {
      if (!response.writableEnded) abort.abort();
    });
    try {
      const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
      if (requestUrl.pathname !== "/proxy") {
        response.writeHead(404).end("Not found");
        return;
      }
      const target = requestUrl.searchParams.get("url");
      if (!target || !/^https?:\/\//i.test(target)) {
        response.writeHead(400).end("Invalid stream URL");
        return;
      }

      const headers: Record<string, string> = {
        "User-Agent": "MoPlayer Pro Windows/1.0",
        Accept: "*/*",
      };
      const range = request.headers.range;
      if (range) {
        headers.Range = range;
      } else {
        headers["Accept-Encoding"] = "identity";
      }
      const ifRange = request.headers["if-range"];
      if (typeof ifRange === "string") headers["If-Range"] = ifRange;

      const upstream = await fetch(target, {
        method: request.method === "HEAD" ? "HEAD" : "GET",
        headers,
        redirect: "follow",
        signal: abort.signal,
      });
      const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";
      const status = upstream.status;
      const contentLength = Number(upstream.headers.get("content-length") ?? 0);

      if (
        looksLikePlaylistTarget(target, contentType) &&
        (!contentLength || contentLength <= PLAYLIST_BYTES_LIMIT)
      ) {
        const text = await upstream.text();
        if (isPlaylistBody(text)) {
          const rewritten = rewritePlaylist(text, upstream.url || target, this.baseUrl);
          response.writeHead(status, {
            "Content-Type": "application/vnd.apple.mpegurl",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
          });
          response.end(rewritten);
          return;
        }
        response.writeHead(status, {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
        });
        response.end(text);
        return;
      }

      response.writeHead(status, {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        ...(upstream.headers.get("content-length") ? { "Content-Length": upstream.headers.get("content-length") as string } : {}),
        ...(upstream.headers.get("content-range") ? { "Content-Range": upstream.headers.get("content-range") as string } : {}),
        ...(upstream.headers.get("accept-ranges") ? { "Accept-Ranges": upstream.headers.get("accept-ranges") as string } : {}),
        ...(upstream.headers.get("cache-control") ? { "Cache-Control": upstream.headers.get("cache-control") as string } : {}),
        ...(upstream.headers.get("etag") ? { ETag: upstream.headers.get("etag") as string } : {}),
        ...(upstream.headers.get("last-modified") ? { "Last-Modified": upstream.headers.get("last-modified") as string } : {}),
      });

      if (request.method === "HEAD" || !upstream.body) {
        response.end();
        return;
      }
      await pipeline(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]), response);
    } catch (error) {
      if (abort.signal.aborted) {
        response.destroy();
        return;
      }
      if (!response.headersSent) {
        response.writeHead(502, { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" });
        response.end(`Stream proxy error: ${error instanceof Error ? error.message : String(error)}`);
      } else {
        response.destroy();
      }
    }
  }

  async proxyUrl(url: string) {
    const base = await this.start();
    if (!/^https?:\/\//i.test(url)) return url;
    return `${base}/proxy?url=${encodeURIComponent(url)}`;
  }

  close() {
    this.server?.close();
    this.server = null;
    this.baseUrl = "";
  }
}
