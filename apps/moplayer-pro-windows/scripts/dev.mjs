import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(appRoot, "..", "..");
const binExt = process.platform === "win32" ? ".cmd" : "";
const viteBin = path.join(workspaceRoot, "node_modules", ".bin", `vite${binExt}`);
const tscBin = path.join(workspaceRoot, "node_modules", ".bin", `tsc${binExt}`);
const electronBin = process.platform === "win32"
  ? path.join(workspaceRoot, "node_modules", "electron", "dist", "electron.exe")
  : path.join(workspaceRoot, "node_modules", ".bin", "electron");

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: false,
    ...options,
  });
  return child;
}

const vite = run(viteBin, ["--host", "127.0.0.1", "--port", "5179"]);
const electronBuild = run(tscBin, ["-p", "tsconfig.electron.json", "--watch", "--preserveWatchOutput"]);

let electron = null;
const launchTimer = setTimeout(() => {
  electron = run(electronBin, ["."], {
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: "http://127.0.0.1:5179",
    },
  });
  electron.on("exit", () => {
    vite.kill();
    electronBuild.kill();
  });
}, 2600);

function shutdown() {
  clearTimeout(launchTimer);
  vite.kill();
  electronBuild.kill();
  electron?.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
