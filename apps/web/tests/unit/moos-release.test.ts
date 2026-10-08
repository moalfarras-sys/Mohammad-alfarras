// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ cms: {} as Record<string, unknown> }));
vi.mock("@/lib/content/store", () => ({
  readSnapshot: vi.fn(async () => ({})),
  getSiteSetting: vi.fn(() => state.cms),
}));

const { readLatestMoosRelease } = await import("@/lib/moos-release");
const edition = { id: "desktop", name: "MoOS", image: "ghcr.io/moalfarras-sys/moos:latest", installer: "/downloads/moos/moos-install.sh" };
const iso = {
  available: true,
  url: "https://downloads.example.org/moos.iso",
  signatureUrl: "https://downloads.example.org/moos.iso.sig",
  checksumUrl: "https://downloads.example.org/moos.iso.sha256",
  sizeBytes: 5796462592,
  sha256: "cbe92573e620101f274081c884671e4b63ffbcdb765521713d21ada1dbe9cb1c",
  deliveryVerifiedAt: "2026-10-08T10:00:00Z",
};

beforeEach(() => { state.cms = { editions: [edition], iso: { ...iso } }; });

describe("MoOS release qualification metadata", () => {
  it("accepts complete HTTPS signature/checksum and full-download qualification metadata", async () => {
    const release = await readLatestMoosRelease();
    expect(release?.iso.available).toBe(true);
    expect(release?.iso.signatureUrl).toBe(iso.signatureUrl);
    expect(release?.iso.sizeBytes).toBe(5796462592);
  });

  it.each([
    { signatureUrl: undefined }, { checksumUrl: undefined }, { deliveryVerifiedAt: undefined },
    { deliveryVerifiedAt: "invalid" }, { sha256: "abc" }, { sizeBytes: 0 }, { sizeBytes: 1.5 },
    { url: "http://downloads.example.org/moos.iso" },
    { url: "https://user:password@downloads.example.org/moos.iso" },
    { url: "https://downloads.example.org/moos.iso#fragment" },
  ])("keeps incomplete or unsuitable publisher metadata unavailable: %j", async (change) => {
    state.cms.iso = { ...iso, ...change };
    const release = await readLatestMoosRelease();
    expect(release?.iso.available).toBe(false);
    expect(release?.iso.url).toBeUndefined();
  });

  it("preserves the owner's maintenance switch and rejects remote installer paths", async () => {
    state.cms = { editions: [{ ...edition, installer: "//elsewhere.example/script.sh" }], iso, maintenance: true };
    const release = await readLatestMoosRelease();
    expect(release?.maintenance).toBe(true);
    expect(release?.editions[0].installer).toBeUndefined();
  });

  it("does not put an unrelated or shell-injectable container into public commands", async () => {
    state.cms.editions = [edition, { ...edition, id: "bad", image: "ghcr.io/other/image:latest; command" }];
    expect((await readLatestMoosRelease())?.editions).toHaveLength(1);
  });
});
