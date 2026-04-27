const MOJIBAKE_MARKERS = /[ÃÂØÙâ]/;
const ARABIC_RANGE = /[\u0600-\u06ff]/;

function mojibakeScore(value: string) {
  const markers = value.match(/[ÃÂØÙâ]/g)?.length ?? 0;
  const arabic = value.match(/[\u0600-\u06ff]/g)?.length ?? 0;
  return markers * 3 - arabic;
}

export function repairMojibake(value: string) {
  if (!MOJIBAKE_MARKERS.test(value)) {
    return value;
  }

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const looksBetter = mojibakeScore(decoded) < mojibakeScore(value) || ARABIC_RANGE.test(decoded);
    return looksBetter ? decoded : value;
  } catch {
    return value;
  }
}

export function repairMojibakeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return repairMojibake(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairMojibakeDeep(item)) as T;
  }

  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, repairMojibakeDeep(item)]),
      ) as T;
    }
  }

  return value;
}
