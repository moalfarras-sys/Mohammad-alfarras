export async function sha1(input: string) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeUrl(raw: string, trailingSlash = false) {
  const value = raw.trim();
  if (!value) return "";
  const withScheme = /^https?:\/\//i.test(value) ? value : `http://${value.replace(/^\/+/, "")}`;
  return trailingSlash ? withScheme.replace(/\/?$/, "/") : withScheme;
}

export function hostLabel(raw: string) {
  try {
    return new URL(raw).host.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//i, "").split("/")[0] || "Source";
  }
}

export function byNewest<T extends { addedAt?: number; title: string }>(items: T[]) {
  return [...items].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0) || a.title.localeCompare(b.title));
}

