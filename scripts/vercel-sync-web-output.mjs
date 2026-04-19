import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const webRoot = path.join(repoRoot, "apps", "web");

const syncTargets = [
  { source: path.join(webRoot, ".next"), destination: path.join(repoRoot, ".next") },
  { source: path.join(webRoot, "public"), destination: path.join(repoRoot, "public") },
];

for (const { source, destination } of syncTargets) {
  if (!fs.existsSync(source)) {
    continue;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

process.stdout.write("Synced apps/web build output to repository root for Vercel.\n");
