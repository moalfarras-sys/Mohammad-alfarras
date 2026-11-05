import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packaged = process.argv.includes("--packaged");
if (packaged && process.platform !== "win32") throw new Error("Packaged smoke requires Windows.");
const electronBin = packaged
  ? path.join(appRoot, "release", "win-unpacked", "MoPlayer PC.exe")
  : createRequire(import.meta.url)("electron");
const userData = await mkdtemp(path.join(os.tmpdir(), "moplayer-pc-smoke-"));

const child = spawn(electronBin, [...(packaged ? [] : ["."]), "--smoke-test", `--qa-user-data=${userData}`], {
  stdio: "inherit",
  shell: false,
  cwd: appRoot,
  env: { ...process.env, ELECTRON_RUN_AS_NODE: undefined },
});

let finished = false;
async function finish(code, message = "") {
  if (finished) return;
  finished = true;
  clearTimeout(timer);
  if (message) console.error(message);
  await rm(userData, { recursive: true, force: true }).catch(() => {});
  process.exit(code);
}

const timer = setTimeout(() => {
  child.kill();
  void finish(1, "Smoke test timed out.");
}, 15000);

child.on("error", (error) => void finish(1, `Smoke test failed to start: ${error.message}`));
child.on("exit", (code) => void finish(code ?? 1));
