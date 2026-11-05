import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
import { createAdminSession, getAdminSessionEmail } from "../src/lib/auth";

const now = new Date("2026-11-05T12:00:00Z");
function setSession(email: string, issuedAt = now.getTime(), suffix = "") {
  const payload = `v1.${Buffer.from(email).toString("base64url")}.${issuedAt}`;
  const signature = createHmac("sha256", "test-session-secret").update(payload).digest("hex");
  cookieStore.get.mockReturnValue({ value: `${payload}.${signature}${suffix}` });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("ADMIN_SESSION_SECRET", "test-session-secret");
  vi.stubEnv("ADMIN_ALLOWLIST", "owner@example.test");
  vi.stubEnv("ADMIN_PASSWORD", "test-password");
  vi.stubEnv("ADMIN_PASSWORD_HASH", "");
  vi.clearAllMocks();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("admin session authorization", () => {
  it("accepts a recent signed session for a configured administrator", async () => {
    setSession("owner@example.test");
    expect(await getAdminSessionEmail()).toBe("owner@example.test");
  });
  it("revokes a session when its email leaves the allowlist", async () => {
    setSession("removed@example.test");
    expect(await getAdminSessionEmail()).toBeNull();
  });
  it.each([now.getTime() - 8 * 60 * 60 * 1000, now.getTime() + 61_000, -1])(
    "rejects an invalid session timestamp %s", async (timestamp) => {
      setSession("owner@example.test", timestamp);
      expect(await getAdminSessionEmail()).toBeNull();
    },
  );
  it("tolerates small server clock differences", async () => {
    setSession("owner@example.test", now.getTime() + 30_000);
    expect(await getAdminSessionEmail()).toBe("owner@example.test");
  });
  it.each([".extra", "tampered"])("rejects malformed or tampered tokens: %s", async (suffix) => {
    setSession("owner@example.test", now.getTime(), suffix);
    expect(await getAdminSessionEmail()).toBeNull();
  });
  it("sets a bounded httpOnly cookie only after successful login", async () => {
    expect(await createAdminSession("owner@example.test", "wrong")).toBe(false);
    expect(cookieStore.set).not.toHaveBeenCalled();
    expect(await createAdminSession(" OWNER@example.test ", "test-password")).toBe(true);
    expect(cookieStore.set).toHaveBeenCalledWith("mf_admin_session", expect.any(String), expect.objectContaining({
      httpOnly: true, sameSite: "lax", path: "/", maxAge: 8 * 60 * 60,
    }));
  });
});
