import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const electronBin = createRequire(import.meta.url)("electron");
const outDir = path.join(appRoot, "qa-screenshots");
const screens = ["home", "live", "guide", "matches", "multi", "multi-1", "multi-2", "multi-3", "multi-4", "multi-picker", "movies", "series", "search", "favorites", "settings", "license", "support", "player", "login"];
const rtlScreens = ["home", "matches", "multi", "multi-1", "multi-2", "multi-3", "multi-4", "multi-picker", "settings", "login"];

await mkdir(outDir, { recursive: true });

async function run(screen, options = {}) {
  const target = path.join(outDir, `${options.prefix ?? ""}${screen}.png`);
  const qaUserData = await mkdtemp(path.join(tmpdir(), `moplayer-pro-${screen}-`));
  return new Promise((resolve, reject) => {
    const args = [".", "--qa-fixture", `--qa-user-data=${qaUserData}`, `--qa-screen=${screen}`, `--qa-screenshot=${target}`];
    if (options.language) args.push(`--qa-language=${options.language}`);
    const child = spawn(electronBin, args, {
      cwd: appRoot,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
      stdio: "inherit",
      shell: false,
    });
    child.on("exit", async (code) => {
      await rm(qaUserData, { recursive: true, force: true }).catch(() => {});
      if (code === 0) resolve();
      else reject(new Error(`QA screenshot failed for ${screen} with code ${code}`));
    });
    child.on("error", async (error) => {
      await rm(qaUserData, { recursive: true, force: true }).catch(() => {});
      reject(error);
    });
  });
}

for (const screen of screens) {
  await run(screen);
}

for (const screen of rtlScreens) {
  await run(screen, { prefix: "ar-", language: "ar" });
}

console.log(`QA screenshots written to ${outDir}`);
