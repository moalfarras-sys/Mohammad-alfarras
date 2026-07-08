// Routes posters and channel logos through the local on-disk cache served by the
// main process, so they load instantly on later launches instead of re-downloading.
// Before the proxy base is known (or for non-http URLs) it returns the original URL,
// so an image is never blocked on the cache.

let base = "";

export function setImageProxyBase(value: string) {
  base = value || "";
}

/** Returns a cached-image URL when the cache is ready, otherwise the original URL. */
export function posterSrc(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (!base || !/^https?:\/\//i.test(url)) return url;
  return `${base}/img?url=${encodeURIComponent(url)}`;
}
