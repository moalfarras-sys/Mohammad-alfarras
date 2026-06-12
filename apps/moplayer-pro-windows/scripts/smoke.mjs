import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(appRoot, "..", "..");
const electronBin = process.platform === "win32"
  ? path.join(workspaceRoot, "node_modules", "electron", "dist", "electron.exe")
  : path.join(workspaceRoot, "node_modules", ".bin", "electron");

const child = spawn(electronBin, [".", "--smoke-test"], {
  stdio: "inherit",
  shell: false,
  cwd: appRoot,
});

const timer = setTimeout(() => {
  child.kill();
  console.error("Smoke test timed out.");
  process.exit(1);
}, 15000);

child.on("exit", (code) => {
  clearTimeout(timer);
  process.exit(code ?? 1);
});
