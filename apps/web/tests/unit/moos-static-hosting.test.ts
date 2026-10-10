import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// The policy is shared with the actual independently deployed Worker.
import { downloadResponse, qualifyRelease } from "../../cloudflare/moos-site/release-policy.mjs";
import nextConfig from "../../next.config";

const release = JSON.parse(readFileSync(path.resolve("public/downloads/moos/latest-moos.json"), "utf8"));
const proof = JSON.parse(readFileSync(path.resolve("public/downloads/moos/delivery-proof.json"), "utf8"));
const request = (query: string, method = "GET") => new Request(`https://moos-site.moalfarras-moos.workers.dev/api/os/download?${query}`, { method });

describe("independent MoOS hosting", () => {
  it("requires the successful signed, full-delivery proof", () => {
    expect(() => qualifyRelease(release, proof)).not.toThrow();
    for (const key of ["signatureVerified", "fullHashVerified", "anonymous", "sidecarsVerified"]) {
      expect(() => qualifyRelease(release, { ...proof, [key]: false })).toThrow();
    }
    for (const key of ["url", "sizeBytes", "sha256", "sourceRevision", "imageDigest", "version"]) {
      expect(() => qualifyRelease(release, { ...proof, [key]: "wrong" })).toThrow();
    }
  });
  it("refuses alternate origins, credentials and unsafe installer paths", () => {
    for (const url of ["http://moos-downloads.moalfarras-moos.workers.dev/file.iso", "https://evil.example/file.iso", "https://user:secret@moos-downloads.moalfarras-moos.workers.dev/file.iso"]) {
      expect(() => qualifyRelease({ ...release, iso: { ...release.iso, url } }, proof)).toThrow();
    }
    expect(() => qualifyRelease({ ...release, editions: [{ id: "desktop", installer: "https://evil.example/run.sh" }] }, proof)).toThrow();
    expect(() => qualifyRelease({ ...release, iso: { ...release.iso, signatureUrl: release.iso.url + ".other.sig" } }, proof)).toThrow();
    expect(() => qualifyRelease({ ...release, iso: { ...release.iso, checksumUrl: release.iso.url + ".other.sha256" } }, proof)).toThrow();
  });
  it("redirects GET and HEAD to exactly the R2 asset without fetching it", () => {
    for (const method of ["GET", "HEAD"]) for (const asset of ["iso", "signature", "checksum"]) {
      const response = downloadResponse(request(`type=iso&asset=${asset}&url=https://evil.example`, method), release);
      expect(response.status).toBe(307);
      expect(response.body).toBeNull();
      expect(response.headers.get("Location")).toBe(asset === "iso" ? release.iso.url : asset === "signature" ? release.iso.signatureUrl : release.iso.checksumUrl);
    }
  });
  it("keeps scripts on the independent site and refuses unknown requests", () => {
    const response = downloadResponse(request("type=nvidia"), release);
    expect(response.headers.get("Location")).toBe("https://moos-site.moalfarras-moos.workers.dev/downloads/moos/moos-install.sh");
    expect(downloadResponse(request("type=arm"), release).status).toBe(400);
    expect(downloadResponse(request("type=garbage"), release).status).toBe(400);
    expect(downloadResponse(request("type=iso&asset=unknown"), release).status).toBe(400);
    expect(downloadResponse(request("type=iso", "POST"), release).status).toBe(405);
  });
  it("honours maintenance and unavailable files", () => {
    expect(downloadResponse(request("type=iso"), { ...release, maintenance: true }).status).toBe(503);
    expect(downloadResponse(request("type=desktop"), { ...release, maintenance: true }).status).toBe(503);
    expect(downloadResponse(request("type=iso"), { ...release, iso: { ...release.iso, available: false } }).status).toBe(503);
  });
  it("lets static pages and assets bypass the billable Worker handler", () => {
    const config = JSON.parse(readFileSync(path.resolve("cloudflare/moos-site/wrangler.jsonc"), "utf8"));
    expect(config.assets.run_worker_first).toEqual(["/api/os/download*"]);
    expect(config.assets.not_found_handling).toBe("none");
    expect(config).not.toHaveProperty("r2_buckets");
    expect(config).not.toHaveProperty("routes");
  });
  it("moves only MoOS entrypoints before the Next proxy and application routes", async () => {
    const redirects = await nextConfig.redirects!();
    const moos = redirects.filter((rule) => rule.destination.startsWith("https://moos-site.moalfarras-moos.workers.dev"));
    expect(moos.map((rule) => rule.source)).toEqual(["/:locale(en|ar)/apps/moos", "/:locale(en|ar)/moos", "/moos", "/api/os/download"]);
    expect(moos.every((rule) => rule.permanent === false)).toBe(true);
    expect(redirects.find((rule) => rule.source === "/:locale(en|ar)/admin")?.destination).toBe("https://admin.moalfarras.space");
    expect(redirects.find((rule) => rule.source === "/downloads/moplayer2/app-release.apk")?.destination).toBe("/api/app/download/latest?product=moplayer2");
  });
});
