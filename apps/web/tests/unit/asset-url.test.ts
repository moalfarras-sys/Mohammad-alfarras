import { describe, expect, it } from "vitest";

import { normalizePublicImagePath } from "@/lib/asset-url";

describe("normalizePublicImagePath", () => {
  it("keeps valid external URLs unchanged", () => {
    expect(normalizePublicImagePath("https://example.com/image.png")).toBe(
      "https://example.com/image.png",
    );
  });

  it("repairs external URLs missing the colon", () => {
    expect(normalizePublicImagePath("https//example.com/image.png")).toBe(
      "https://example.com/image.png",
    );
  });

  it("normalizes public image paths and legacy aliases", () => {
    expect(normalizePublicImagePath("images/portrait.jpg")).toBe("/images/portrait.jpg");
    expect(normalizePublicImagePath("/images/moplayer_ui_playlist.png")).toBe(
      "/images/moplayer_ui_playlist-final.png",
    );
  });
});
