// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("retired MoOS conversion entrypoints", () => {
  it.each(["moos-install.sh", "moos-cloud-install.sh"])("%s cannot change a root host or skip verification", (name) => {
    const fixture = mkdtempSync(join(tmpdir(), "moos-installer-negative-"));
    try {
      const trace = join(fixture, "host-actions");
      for (const command of ["id", "bootc", "dnf", "cosign", "ostree", "hostname", "system-reinstall-bootc"]) {
        const file = join(fixture, command);
        writeFileSync(file, command === "id" ? "#!/bin/sh\necho 0\n" : `#!/bin/sh\necho '${command}' >> '${trace}'\n`);
        chmodSync(file, 0o700);
      }
      const script = fileURLToPath(new URL(`../../public/downloads/moos/${name}`, import.meta.url));
      for (const args of [[], ["--nvidia"], ["--unknown"]]) {
        const result = spawnSync("/bin/bash", [script, ...args], {
          env: { NODE_ENV: "test", PATH: `${fixture}:/usr/bin:/bin` }, encoding: "utf8", timeout: 3000,
        });
        expect(result.error).toBeUndefined();
        expect(result.status).toBe(78);
        expect(result.stdout).toContain("installation.html");
        expect(result.stdout).toContain("moai-do update");
        expect(existsSync(trace)).toBe(false);
      }
      const help = spawnSync("/bin/bash", [script, "--help"], { encoding: "utf8", timeout: 3000 });
      expect(help.status).toBe(0);
      expect(readFileSync(script, "utf8")).not.toContain("Continue without");
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });
});
