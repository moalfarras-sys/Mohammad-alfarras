import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.resolve(appRoot, "release");

if (!releaseDir.startsWith(`${appRoot}${path.sep}`)) {
  throw new Error(`Refusing to remove path outside app root: ${releaseDir}`);
}

await rm(releaseDir, { recursive: true, force: true });
