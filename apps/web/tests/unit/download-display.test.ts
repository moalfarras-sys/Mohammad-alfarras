import { describe, expect, it } from "vitest";

import { hasPublicDownloadCount } from "@/lib/download-display";

describe("hasPublicDownloadCount", () => {
  it("hides the counter when the value is zero or missing", () => {
    expect(hasPublicDownloadCount(undefined)).toBe(false);
    expect(hasPublicDownloadCount({ value: 0 })).toBe(false);
  });

  it("hides the counter when the counter store was unreachable", () => {
    expect(hasPublicDownloadCount({ value: 12, available: false })).toBe(false);
  });

  it("shows a real positive count", () => {
    expect(hasPublicDownloadCount({ value: 12 })).toBe(true);
    expect(hasPublicDownloadCount({ value: 12, available: true })).toBe(true);
  });
});
