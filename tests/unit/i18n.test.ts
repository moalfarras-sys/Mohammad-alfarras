import { describe, expect, it } from "vitest";

import { defaultLocale, isLocale, withLocale } from "@/lib/i18n";

describe("i18n helpers", () => {
  it("validates locales", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
  });

  it("builds locale paths", () => {
    expect(defaultLocale).toBe("ar");
    expect(withLocale("ar", "")).toBe("/ar");
    expect(withLocale("en", "blog")).toBe("/en/blog");
  });
});
