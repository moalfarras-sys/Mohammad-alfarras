import { afterEach, expect, it, vi } from "vitest";

const created = vi.hoisted(() => vi.fn());
vi.mock("pg", () => ({ Pool: class {
  constructor(options: unknown) { created(options); }
  query = async () => ({ rows: [] });
} }));
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); vi.clearAllMocks(); });

it("uses the IPv4 pooler with CA/hostname verification even when the URL has sslmode", async () => {
  vi.stubEnv("DATABASE_URL", "postgres://user:pass@pooler.example.test:6543/postgres?sslmode=require");
  vi.stubEnv("DIRECT_URL", "postgres://user:pass@ipv6-only.example.test/postgres");
  vi.stubEnv("DATABASE_SSL_CA", "certificate-line-1\\ncertificate-line-2");
  const { queryRows } = await import("../../../packages/db/src/server-db");
  await queryRows("select 1");
  expect(created).toHaveBeenCalledWith(expect.objectContaining({
    connectionString: "postgres://user:pass@pooler.example.test:6543/postgres",
    ssl: { rejectUnauthorized: true, ca: "certificate-line-1\ncertificate-line-2" },
    connectionTimeoutMillis: 10_000,
  }));
});

it("retains certificate verification when only a direct URL is configured", async () => {
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("DIRECT_URL", "postgres://user:pass@database.example.test/postgres");
  vi.stubEnv("DATABASE_SSL_CA", "");
  const { queryRows } = await import("../../../packages/db/src/server-db");
  await queryRows("select 1");
  expect(created).toHaveBeenCalledWith(expect.objectContaining({ ssl: { rejectUnauthorized: true } }));
});
