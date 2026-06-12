import { spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(appRoot, "..", "..");
const builderCli = path.join(workspaceRoot, "node_modules", "electron-builder", "cli.js");
const releaseDir = path.resolve(appRoot, "release");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanRelease() {
  if (!releaseDir.startsWith(`${appRoot}${path.sep}`)) {
    throw new Error(`Refusing to remove path outside app root: ${releaseDir}`);
  }

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      await rm(releaseDir, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      await wait(750 * attempt);
    }
  }
}

function runBuilder(outputDir) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      [
        builderCli,
        "--win",
        "nsis",
        "portable",
        "--publish",
        "never",
        `--config.directories.output=${outputDir}`,
      ],
      {
        cwd: appRoot,
        stdio: "inherit",
        shell: false,
      },
    );

    child.on("exit", (code) => resolve(code ?? 1));
  });
}

let tempOutput = "";
let exitCode = 1;
let finalDir = releaseDir;

try {
  tempOutput = await mkdtemp(path.join(os.tmpdir(), "moplayer-pro-windows-"));

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    // Try to clean old release dir; if locked, use alternate path
    try {
      await cleanRelease();
    } catch (error) {
      if (error.code === "EBUSY" || error.code === "EPERM") {
        finalDir = path.resolve(appRoot, `release-${Date.now()}`);
        console.warn(`Release dir locked (stale installer?). Using ${finalDir} instead.`);
      } else {
        throw error;
      }
    }
    await rm(tempOutput, { recursive: true, force: true });
    tempOutput = await mkdtemp(path.join(os.tmpdir(), "moplayer-pro-windows-"));
    await wait(1500 * attempt);

    exitCode = await runBuilder(tempOutput);
    if (exitCode === 0) {
      try {
        if (finalDir === releaseDir) await cleanRelease();
      } catch { /* ignore locked */ }
      await cp(tempOutput, finalDir, { recursive: true });
      if (finalDir !== releaseDir) {
        console.log(`Installer output written to: ${finalDir}`);
        console.log(`(Old release dir is locked. Kill stale MoPlayer-Pro-Setup process or reboot.)`);
      }
      break;
    }

    console.warn(`electron-builder failed on attempt ${attempt}; retrying after cleanup.`);
  }
} finally {
  if (tempOutput) {
    await rm(tempOutput, { recursive: true, force: true });
  }
}

process.exit(exitCode);
