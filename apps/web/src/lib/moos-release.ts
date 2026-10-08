import { readFile } from "node:fs/promises";
import path from "node:path";

import { getSiteSetting, readSnapshot } from "@/lib/content/store";

export type MoosEdition = {
  id: string;
  name: string;
  image: string;
  recommended?: boolean;
  summary?: string;
  /** Site-relative path of the official installer script for this edition. */
  installer?: string;
  /** Extra flag the installer needs for this edition (e.g. "--nvidia"). */
  installerArgs?: string;
  /** Edition guide when its artifact is separate from the x86 ISO. */
  guideUrl?: string;
};

export type MoosIso = {
  available: boolean;
  url?: string;
  sizeBytes?: number;
  sha256?: string;
  notes?: string;
  signatureUrl?: string;
  checksumUrl?: string;
  version?: string;
  architecture?: string;
  sourceRevision?: string;
  deliveryVerifiedAt?: string;
};

export type MoosRelease = {
  system: "MoOS";
  channel?: string;
  base?: string;
  repoUrl?: string;
  signingKeyUrl?: string;
  releaseDate?: string;
  editions: MoosEdition[];
  iso: MoosIso;
  maintenance?: boolean;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asHttpsUrl(value: unknown) {
  const raw = asString(value);
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.hostname && !url.username && !url.password && !url.hash ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function asNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : undefined;
}

function mapEditions(raw: unknown): MoosEdition[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): MoosEdition | null => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const id = asString(record.id);
      const name = asString(record.name);
      const image = asString(record.image);
      if (!id || !name || !/^ghcr\.io\/moalfarras-sys\/moos(?:-nvidia|-cloud|-arm)?(?::[a-zA-Z0-9._-]+|@sha256:[a-f0-9]{64})$/.test(image)) return null;
      const installer = asString(record.installer);
      return {
        id,
        name,
        image,
        recommended: record.recommended === true,
        summary: asString(record.summary) || undefined,
        // Only site-relative installer paths are accepted, so a CMS edit can
        // never point the install button at a third-party script.
        installer: /^\/downloads\/moos\/[a-zA-Z0-9._-]+\.sh$/.test(installer) ? installer : undefined,
        installerArgs: asString(record.installerArgs) || undefined,
        guideUrl: asHttpsUrl(record.guideUrl),
      };
    })
    .filter((item): item is MoosEdition => Boolean(item));
}

function mapIso(raw: unknown): MoosIso {
  const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const url = asHttpsUrl(record.url);
  const signatureUrl = asHttpsUrl(record.signatureUrl);
  const checksumUrl = asHttpsUrl(record.checksumUrl);
  const sizeBytes = asNumber(record.sizeBytes);
  const sha256 = asString(record.sha256).toLowerCase();
  const deliveryVerifiedAt = asString(record.deliveryVerifiedAt);
  // The publisher must qualify the full anonymous transfer first. Metadata alone
  // cannot prove host uptime, but incomplete CMS overrides must stay unavailable.
  const available = record.available === true && Boolean(url && signatureUrl && checksumUrl)
    && Boolean(sizeBytes && Number.isSafeInteger(sizeBytes)) && /^[a-f0-9]{64}$/.test(sha256)
    && Boolean(deliveryVerifiedAt && Number.isFinite(Date.parse(deliveryVerifiedAt)));
  return {
    available,
    url: available ? url : undefined,
    sizeBytes,
    sha256: sha256 || undefined,
    notes: asString(record.notes) || undefined,
    signatureUrl: available ? signatureUrl : undefined,
    checksumUrl: available ? checksumUrl : undefined,
    version: asString(record.version) || undefined,
    architecture: asString(record.architecture) || undefined,
    sourceRevision: asString(record.sourceRevision) || undefined,
    deliveryVerifiedAt: deliveryVerifiedAt || undefined,
  };
}

function mapMoosRelease(raw: Record<string, unknown>): MoosRelease | null {
  const editions = mapEditions(raw.editions);
  if (!editions.length) return null;
  return {
    system: "MoOS",
    channel: asString(raw.channel) || undefined,
    base: asString(raw.base) || undefined,
    repoUrl: asHttpsUrl(raw.repoUrl),
    signingKeyUrl: asHttpsUrl(raw.signingKeyUrl),
    releaseDate: asString(raw.releaseDate) || undefined,
    editions,
    iso: mapIso(raw.iso),
    maintenance: raw.maintenance === true,
  };
}

async function readBundledMoosRelease(): Promise<MoosRelease | null> {
  try {
    const filePath = path.join(process.cwd(), "public", "downloads", "moos", "latest-moos.json");
    const raw = JSON.parse(await readFile(filePath, "utf8")) as Record<string, unknown>;
    return mapMoosRelease(raw);
  } catch {
    return null;
  }
}

function mergeMoosDefaults(base: MoosRelease | null, override: MoosRelease): MoosRelease {
  if (!base) return override;
  return {
    ...base,
    ...override,
    editions: override.editions.length ? override.editions : base.editions,
    iso: { ...base.iso, ...override.iso },
  };
}

export async function readLatestMoosRelease(): Promise<MoosRelease | null> {
  const bundled = await readBundledMoosRelease();

  // Dashboard-managed override wins so the owner can flip the ISO on, bump the
  // channel, or set maintenance from the admin without a redeploy — same pattern
  // as readLatestWindowsRelease().
  try {
    const snapshot = await readSnapshot();
    const cms = getSiteSetting<Record<string, unknown>>(snapshot, "moos_release", {});
    const mapped = mapMoosRelease(cms);
    if (mapped) return mergeMoosDefaults(bundled, mapped);
  } catch {
    // fall through to the bundled file
  }

  return bundled;
}
