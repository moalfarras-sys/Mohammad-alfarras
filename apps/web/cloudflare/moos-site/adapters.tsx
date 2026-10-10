import type { ComponentProps, CSSProperties } from "react";

/** Plain, immutable images: this independent page has no image optimizer. */
export function StaticImage({ fill, priority, unoptimized: _unoptimized, quality: _quality,
  style, ...props }: ComponentProps<"img"> & { fill?: boolean; priority?: boolean; unoptimized?: boolean; quality?: number }) {
  void _unoptimized;
  void _quality;
  const positioning: CSSProperties = fill ? { position: "absolute", height: "100%", width: "100%", inset: 0 } : {};
  // eslint-disable-next-line @next/next/no-img-element -- immutable Cloudflare assets
  return <img {...props} alt={props.alt ?? ""} style={{ ...positioning, ...style }}
    loading={priority ? "eager" : props.loading ?? "lazy"} fetchPriority={priority ? "high" : props.fetchPriority} />;
}

/** No application router, navigation prefetch, RSC request or Vercel endpoint. */
export function StaticLink({ prefetch: _prefetch, ...props }: ComponentProps<"a"> & { prefetch?: boolean }) {
  void _prefetch;
  return <a {...props} />;
}
