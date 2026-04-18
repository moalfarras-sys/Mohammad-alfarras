import { describe, expect, it } from "vitest";

import { createPasswordHash, verifyAdminPassword, type AdminCredentials } from "@/lib/auth";

describe("admin password helpers", () => {
  it("verifies password against scrypt hash", () => {
    const hash = createPasswordHash("correct-horse-battery");
    const creds: AdminCredentials = { emails: ["a@b.com"], passwordHash: hash, legacyPassword: "" };
    expect(verifyAdminPassword("correct-horse-battery", creds)).toBe(true);
    expect(verifyAdminPassword("wrong", creds)).toBe(false);
  });

  it("falls back to legacy plain password when no hash", () => {
    const creds: AdminCredentials = { emails: ["a@b.com"], passwordHash: "", legacyPassword: "legacy" };
    expect(verifyAdminPassword("legacy", creds)).toBe(true);
    expect(verifyAdminPassword("other", creds)).toBe(false);
  });
});
