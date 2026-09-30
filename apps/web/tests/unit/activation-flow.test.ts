import { describe, expect, it } from "vitest";

import {
  activationPageProduct,
  adoptableActivationProduct,
  IMPORT_POLL_BUDGET_MS,
  importPollDelayMs,
  importProgressIsFinal,
  nextImportProgress,
  requestedActivationProduct,
} from "@/lib/activation-flow";

describe("requestedActivationProduct", () => {
  it("treats a missing product as 'resolve it from the code'", () => {
    expect(requestedActivationProduct(null)).toBeNull();
    expect(requestedActivationProduct(undefined)).toBeNull();
    expect(requestedActivationProduct("  ")).toBeNull();
    expect(requestedActivationProduct("auto")).toBeNull();
  });

  it("keeps explicit products scoped, including Pro and PC aliases", () => {
    expect(requestedActivationProduct("moplayer")).toBe("moplayer");
    expect(requestedActivationProduct("moplayer2")).toBe("moplayer2");
    expect(requestedActivationProduct("MoPlayer_Pro")).toBe("moplayer2");
    expect(requestedActivationProduct("moplayer-pc")).toBe("moplayer2");
  });
});

describe("activationPageProduct", () => {
  it("returns undefined (auto-detect) for a bare or unknown product", () => {
    expect(activationPageProduct("")).toBeUndefined();
    expect(activationPageProduct(undefined)).toBeUndefined();
    expect(activationPageProduct("something-else")).toBeUndefined();
  });

  it("maps explicit products to the page product", () => {
    expect(activationPageProduct("moplayer")).toBe("moplayer");
    expect(activationPageProduct("moplayer2")).toBe("moplayer2");
    expect(activationPageProduct("pro")).toBe("moplayer2");
    expect(activationPageProduct("moplayer-pc")).toBe("moplayer-pc");
    expect(activationPageProduct("windows")).toBe("moplayer-pc");
  });

  it("only adopts real API product slugs", () => {
    expect(adoptableActivationProduct("moplayer2")).toBe("moplayer2");
    expect(adoptableActivationProduct("moplayer")).toBe("moplayer");
    expect(adoptableActivationProduct("moplayer-pc")).toBeUndefined();
    expect(adoptableActivationProduct(undefined)).toBeUndefined();
  });
});

describe("nextImportProgress", () => {
  it("follows the device from sent to fetched to the final result", () => {
    expect(nextImportProgress("waiting", "source_sent")).toBe("waiting");
    expect(nextImportProgress("waiting", "source_fetched")).toBe("fetched");
    expect(nextImportProgress("fetched", "imported")).toBe("imported");
    expect(nextImportProgress("fetched", "failed")).toBe("failed");
    expect(nextImportProgress("waiting", "revoked")).toBe("revoked");
  });

  it("keeps the current progress when the status is unknown or missing", () => {
    expect(nextImportProgress("waiting", "none")).toBe("waiting");
    expect(nextImportProgress("fetched", undefined)).toBe("fetched");
  });

  it("treats an expired handoff as final only before the TV fetched it", () => {
    expect(nextImportProgress("waiting", "expired")).toBe("expired");
    expect(nextImportProgress("fetched", "expired")).toBe("fetched");
  });

  it("marks only device results as final", () => {
    expect(importProgressIsFinal("waiting")).toBe(false);
    expect(importProgressIsFinal("fetched")).toBe(false);
    expect(importProgressIsFinal("imported")).toBe(true);
    expect(importProgressIsFinal("failed")).toBe(true);
    expect(importProgressIsFinal("expired")).toBe(true);
  });
});

describe("importPollDelayMs", () => {
  it("polls quickly first, then backs off within the ten-minute budget", () => {
    expect(importPollDelayMs(0)).toBe(4000);
    expect(importPollDelayMs(59_000)).toBe(4000);
    expect(importPollDelayMs(61_000)).toBe(10_000);
    expect(IMPORT_POLL_BUDGET_MS).toBe(10 * 60 * 1000);
  });
});
