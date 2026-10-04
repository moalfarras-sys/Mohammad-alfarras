/**
 * Pick a download host that is actually up, preferring the free one.
 *
 * Binaries live in two places:
 *   - GitHub Releases  — free, unlimited bandwidth for a public repo. Primary.
 *   - Vercel Blob      — metered on the Hobby plan. Mirror.
 *
 * GitHub is preferred so downloads never consume a paid quota, but the repo
 * has gone private before, which took every download link down with it. So the
 * primary is health-checked and the mirror takes over automatically when it is
 * unreachable — and the check is cached, so a download never waits on it more
 * than once every few minutes.
 */

type Verdict = { ok: boolean; checkedAt: number };

const CACHE_TTL_MS = 10 * 60 * 1000;
const CHECK_TIMEOUT_MS = 2500;
const verdicts = new Map<string, Verdict>();

async function isReachable(url: string): Promise<boolean> {
  const cached = verdicts.get(url);
  if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) return cached.ok;

  let ok = false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);
    // GitHub answers a release asset with a redirect to its CDN; `manual` keeps
    // us from downloading a single byte of a 115 MB file just to check it.
    const response = await fetch(url, { method: "HEAD", redirect: "manual", signal: controller.signal });
    clearTimeout(timer);
    ok = response.status < 400;
  } catch {
    ok = false;
  }

  verdicts.set(url, { ok, checkedAt: Date.now() });
  return ok;
}

/**
 * Returns the URL to redirect a visitor to. Falls back to the mirror only when
 * the primary is genuinely unreachable; with no mirror configured the primary
 * is returned unchanged so behaviour is never worse than before.
 */
export async function resolveDownloadTarget(primary: string, mirror?: string | null): Promise<string> {
  if (!mirror || mirror === primary) return primary;
  if (!/^https?:\/\//i.test(primary)) return primary;
  return (await isReachable(primary)) ? primary : mirror;
}

/**
 * Mirrors for the URLs shipped in the offline fallback data. Keyed by the
 * primary URL so a CMS-managed URL that happens to match still gets a mirror.
 *
 * Only list a mirror after it answers HTTP 200 with the exact size and SHA-256
 * of the primary file. The previous Vercel Blob mirrors (Classic 2.4.0 and
 * Pro 2.6.5) returned HTTP 403 and were removed so a GitHub outage can never
 * redirect visitors to a broken link.
 */
export const DOWNLOAD_MIRRORS: Record<string, string> = {};

export function mirrorFor(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return DOWNLOAD_MIRRORS[url];
}
