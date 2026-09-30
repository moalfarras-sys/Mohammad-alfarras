/**
 * Pure helpers for the MoPlayer QR activation flow, shared by the activation API routes and the
 * client activation page (no server-only imports here).
 */
import { resolveManagedAppSlug, type ManagedAppSlug } from "@moalfarras/shared/app-products";

/** What the activation page shows. `moplayer-pc` is display-only: the API resolves it to `moplayer2`. */
export type ActivationPageProduct = "moplayer" | "moplayer2" | "moplayer-pc";

const pcProductAliases = new Set([
  "moplayer-pc",
  "mo-player-pc",
  "moplayer-windows",
  "mo-player-windows",
  "windows",
  "windows-pc",
]);

function normalizeProductParam(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");
}

/**
 * The product an activation API request explicitly asked for, or null when it carries none (the bare
 * /activate URL, or the Classic TV app, which never sends one). Null means "resolve it from the code".
 */
export function requestedActivationProduct(value: string | null | undefined): ManagedAppSlug | null {
  const raw = normalizeProductParam(value);
  if (!raw || raw === "auto") return null;
  return resolveManagedAppSlug(raw);
}

/** Maps a page `?product=` value to the product the page shows; undefined means "detect it from the code". */
export function activationPageProduct(value: string | null | undefined): ActivationPageProduct | undefined {
  const raw = normalizeProductParam(value);
  if (!raw) return undefined;
  if (pcProductAliases.has(raw)) return "moplayer-pc";
  if (raw === "moplayer") return "moplayer";
  if (resolveManagedAppSlug(raw) === "moplayer2") return "moplayer2";
  return undefined;
}

/** A product slug returned by the API that the page may adopt, or undefined for anything else. */
export function adoptableActivationProduct(value: unknown): ActivationPageProduct | undefined {
  return value === "moplayer" || value === "moplayer2" ? value : undefined;
}

/** Device-side progress after "Send to device", as reported by the status route's `sourceStatus`. */
export type ImportProgress = "waiting" | "fetched" | "imported" | "failed" | "revoked" | "expired";

export const IMPORT_POLL_BUDGET_MS = 10 * 60 * 1000;

/** Poll quickly while the TV normally picks the source up, then back off while it loads channels. */
export function importPollDelayMs(elapsedMs: number) {
  return elapsedMs < 60 * 1000 ? 4000 : 10 * 1000;
}

export function importProgressIsFinal(progress: ImportProgress) {
  return progress === "imported" || progress === "failed" || progress === "revoked" || progress === "expired";
}

export function nextImportProgress(previous: ImportProgress, sourceStatus: string | null | undefined): ImportProgress {
  switch (sourceStatus) {
    case "source_sent":
      return previous === "fetched" ? previous : "waiting";
    case "source_fetched":
      return "fetched";
    case "imported":
    case "failed":
    case "revoked":
      return sourceStatus;
    case "expired":
      // A lapsed delivery receipt after the TV fetched the source is not a failure: it may still be loading.
      return previous === "fetched" ? previous : "expired";
    default:
      return previous;
  }
}
