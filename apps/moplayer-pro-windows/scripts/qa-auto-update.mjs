/**
 * Live auto-update E2E: launches the *installed* app and watches the
 * electron-updater pipeline (check → download → restart-install) over CDP.
 *
 * Pre-conditions:
 *  - An older version is installed locally.
 *  - The production feed (latest.yml on the website) points to a newer
 *    GitHub-hosted release.
 *
 * Usage: node scripts/qa-auto-update.mjs [--expect=1.0.2]
 */
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const PORT = 9224;
const EXE = process.env.MOPLAYER_QA_EXE
  ?? path.join(process.env.LOCALAPPDATA ?? "", "Programs", "@moalfarrasmoplayer-pro-windows", "MoPlayer PC.exe");
const expected = process.argv.find((arg) => arg.startsWith("--expect="))?.slice("--expect=".length) ?? "";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findPageTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await response.json();
      const page = targets.find((t) => t.type === "page" && /index\.html/.test(t.url ?? ""));
      if (page?.webSocketDebuggerUrl) return page;
    } catch { /* starting */ }
    await wait(500);
  }
  throw new Error("Could not reach the app debugger endpoint.");
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let nextId = 1;
    const failAll = (reason) => {
      for (const { rej } of pending.values()) rej(new Error(reason));
      pending.clear();
    };
    ws.onopen = () => resolve({
      send(method, params = {}) {
        if (ws.readyState !== WebSocket.OPEN) return Promise.reject(new Error("ws_closed"));
        const id = nextId += 1;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { res, rej }));
      },
      close: () => { try { ws.close(); } catch { /* gone */ } },
    });
    ws.onerror = () => { failAll("ws_error"); reject(new Error("WebSocket error")); };
    ws.onclose = () => failAll("ws_closed");
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const { res, rej } = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) rej(new Error(message.error.message));
        else res(message.result);
      }
    };
  });
}

const userData = await mkdtemp(path.join(os.tmpdir(), "moplayer-pc-update-qa-"));
console.log(`exe: ${EXE}`);
console.log(`user data: ${userData}`);

const child = spawn(EXE, [`--qa-user-data=${userData}`, `--qa-debug-port=${PORT}`], { stdio: "ignore" });
let childExited = false;
child.on("exit", (code) => {
  childExited = true;
  console.log(`app process exited with code ${code}`);
});

async function dumpAppLog() {
  try {
    const { readFile, readdir } = await import("node:fs/promises");
    const logsDir = path.join(userData, "logs");
    for (const file of await readdir(logsDir)) {
      const body = await readFile(path.join(logsDir, file), "utf8");
      console.log(`--- app log ${file} (last 30 lines) ---`);
      console.log(body.split(/\r?\n/).slice(-30).join("\n"));
    }
  } catch (error) {
    console.log(`(no app log: ${error.message})`);
  }
}

let exitCode = 1;
let cdp = null;
try {
  const page = await findPageTarget();
  cdp = await connect(page.webSocketDebuggerUrl);

  // Capture updater events inside the page.
  await cdp.send("Runtime.evaluate", {
    expression: `
      window.__updaterEvents = [];
      window.moPlayer.app.onUpdaterEvent((event) => window.__updaterEvents.push(event));
      window.moPlayer.app.checkForUpdates();
    `,
    awaitPromise: true,
  });

  let installed = false;
  let lastLogged = 0;
  const started = Date.now();
  while (Date.now() - started < 6 * 60 * 1000) {
    await wait(2000);
    let events;
    try {
      const result = await cdp.send("Runtime.evaluate", {
        expression: "JSON.stringify(window.__updaterEvents ?? [])",
        returnByValue: true,
      });
      events = JSON.parse(result.result.value);
    } catch (error) {
      // The window died — either quitAndInstall kicked in or the app crashed.
      console.log(`page connection lost (${error.message}); app exited: ${childExited}`);
      if (!lastLogged) await dumpAppLog();
      break;
    }
    for (const event of events.slice(lastLogged)) {
      if (event.type !== "progress" || event.percent % 25 === 0) {
        console.log(`event: ${JSON.stringify(event)}`);
      }
    }
    lastLogged = events.length;
    const done = events.find((event) => event.type === "downloaded");
    if (done) {
      console.log("update downloaded — requesting restart-install...");
      cdp.send("Runtime.evaluate", { expression: "window.moPlayer.app.installUpdate()" }).catch(() => {});
      installed = true;
      await wait(4000);
      break;
    }
    if (events.some((event) => event.type === "error")) {
      throw new Error("Updater reported an error (see events above).");
    }
    if (events.some((event) => event.type === "not-available")) {
      throw new Error("Updater says no update available — feed not pointing at a newer version?");
    }
  }
  if (!installed) throw new Error("Update was not downloaded within the time budget.");

  // Give the silent installer time to replace the app and relaunch it.
  console.log("waiting for the silent install to finish...");
  await wait(25000);
  const { execSync } = await import("node:child_process");
  const version = execSync(
    `powershell -NoProfile -Command "(Get-Item '${EXE.replace(/'/g, "''")}').VersionInfo.ProductVersion"`,
    { encoding: "utf8" },
  ).trim();
  console.log(`installed product version now: ${version}`);
  if (expected && !version.startsWith(expected)) {
    throw new Error(`Expected version ${expected}, found ${version}.`);
  }
  console.log("AUTO-UPDATE E2E PASSED");
  exitCode = 0;
} catch (error) {
  console.error(`AUTO-UPDATE E2E FAILED: ${error.message}`);
  await dumpAppLog();
} finally {
  cdp?.close();
  try { child.kill(); } catch { /* already gone */ }
  await wait(1500);
  await rm(userData, { recursive: true, force: true }).catch(() => {});
}
process.exit(exitCode);
