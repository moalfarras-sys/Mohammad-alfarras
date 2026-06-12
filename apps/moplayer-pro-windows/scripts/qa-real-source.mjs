/**
 * Real-provider end-to-end QA for the packaged/installed MoPlayer PC app.
 *
 * Drives the real UI over the Chrome DevTools Protocol: signs in with a real
 * Xtream account, waits for the full library sync, captures screenshots of
 * every main screen, starts live playback, and watches for renderer hangs.
 *
 * Credentials come from env vars so they never land in the repo:
 *   MOPLAYER_QA_XTREAM_URL   e.g. http://host:80
 *   MOPLAYER_QA_XTREAM_USER
 *   MOPLAYER_QA_XTREAM_PASS
 * Optional:
 *   MOPLAYER_QA_EXE          path to the app exe (defaults to the installed app)
 *
 * Usage: node scripts/qa-real-source.mjs
 */
import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const shotsDir = path.join(appRoot, "qa-screenshots");
const PORT = 9223;

const XTREAM_URL = process.env.MOPLAYER_QA_XTREAM_URL ?? "";
const XTREAM_USER = process.env.MOPLAYER_QA_XTREAM_USER ?? "";
const XTREAM_PASS = process.env.MOPLAYER_QA_XTREAM_PASS ?? "";
const EXE = process.env.MOPLAYER_QA_EXE
  ?? path.join(process.env.LOCALAPPDATA ?? "", "Programs", "@moalfarrasmoplayer-pro-windows", "MoPlayer PC.exe");

if (!XTREAM_URL || !XTREAM_USER || !XTREAM_PASS) {
  console.error("Set MOPLAYER_QA_XTREAM_URL / MOPLAYER_QA_XTREAM_USER / MOPLAYER_QA_XTREAM_PASS first.");
  process.exit(2);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findPageTarget() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await response.json();
      const page = targets.find((t) => t.type === "page" && /index\.html/.test(t.url ?? ""));
      if (page?.webSocketDebuggerUrl) return page;
    } catch { /* app still starting */ }
    await wait(500);
  }
  throw new Error("Could not reach the app debugger endpoint.");
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const pending = new Map();
    let nextId = 1;
    ws.onopen = () => resolve({
      send(method, params = {}) {
        const id = nextId += 1;
        ws.send(JSON.stringify({ id, method, params }));
        return new Promise((res, rej) => pending.set(id, { res, rej }));
      },
      close: () => ws.close(),
    });
    ws.onerror = (event) => reject(new Error(`WebSocket error: ${event.message ?? "unknown"}`));
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

let cdp = null;
/** Evaluate an expression in the page; resolves promises and returns JSON values. */
async function evaluate(expression, { timeoutMs = 30000 } = {}) {
  const started = Date.now();
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout: timeoutMs,
  });
  if (result.exceptionDetails) {
    throw new Error(`Page evaluation failed: ${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ""}`.slice(0, 300));
  }
  return { value: result.result?.value, elapsedMs: Date.now() - started };
}

async function screenshot(name) {
  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  await writeFile(path.join(shotsDir, `${name}.png`), Buffer.from(shot.data, "base64"));
  console.log(`shot: ${name}.png`);
}

/** Renderer responsiveness probe — a trivial evaluate should answer fast. */
async function probeResponsiveness(label, budgetMs = 1500) {
  const { elapsedMs } = await evaluate("1 + 1");
  const status = elapsedMs <= budgetMs ? "ok" : "SLOW";
  console.log(`responsiveness ${label}: ${elapsedMs}ms (${status})`);
  return elapsedMs;
}

async function clickDock(index) {
  await evaluate(`document.querySelectorAll(".premium-dock .dock-item")[${index}]?.click()`);
  await wait(900);
}

const userData = await mkdtemp(path.join(os.tmpdir(), "moplayer-pc-real-qa-"));
await mkdir(shotsDir, { recursive: true });
console.log(`exe: ${EXE}`);
console.log(`user data: ${userData}`);

const child = spawn(EXE, [`--qa-user-data=${userData}`, `--remote-debugging-port=${PORT}`], {
  stdio: "ignore",
  detached: false,
});

let exitCode = 1;
try {
  const page = await findPageTarget();
  cdp = await connect(page.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // 1. Wait for the login surface.
  for (let i = 0; i < 40; i += 1) {
    const { value } = await evaluate("Boolean(document.querySelector('.login-surface'))");
    if (value) break;
    await wait(500);
  }
  await screenshot("real-login");

  // 2. Switch to the Xtream tab and fill the real credentials.
  await evaluate(`document.querySelectorAll(".mode-tabs button")[1]?.click()`);
  await wait(400);
  const fill = (index, value) => `
    (() => {
      const input = document.querySelectorAll(".source-form label input")[${index}];
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    })()
  `;
  await evaluate(fill(0, "Real QA"));
  await evaluate(fill(1, XTREAM_URL));
  await evaluate(fill(2, XTREAM_USER));
  await evaluate(fill(3, XTREAM_PASS));
  await screenshot("real-xtream-filled");
  await evaluate(`document.querySelector(".source-form button[type=submit]")?.click()`);

  // 3. Wait for the full library sync; probe responsiveness while it loads.
  console.log("syncing real library...");
  let synced = false;
  const syncStart = Date.now();
  while (Date.now() - syncStart < 8 * 60 * 1000) {
    await wait(5000);
    await probeResponsiveness("during sync", 2500);
    const { value } = await evaluate("Boolean(document.querySelector('.hub-grid')) && !document.querySelector('.login-surface')");
    if (value) { synced = true; break; }
    const { value: errorToast } = await evaluate("document.querySelector('.toast.is-error')?.textContent ?? ''");
    if (errorToast) console.log(`toast: ${errorToast}`);
  }
  if (!synced) throw new Error("Library sync did not finish within 8 minutes.");
  console.log(`library synced in ${Math.round((Date.now() - syncStart) / 1000)}s`);
  await wait(1500);

  const { value: counts } = await evaluate(`
    Array.from(document.querySelectorAll(".hub-card")).map((card) => card.textContent.trim().replace(/\\s+/g, " ")).join(" | ")
  `);
  console.log(`hub: ${counts}`);
  await screenshot("real-home-loaded");

  // 4. Visit every main screen. Dock order: search, home, live, guide, multi, movies, series, favorites, settings.
  const screens = [[2, "real-live"], [3, "real-guide"], [4, "real-multi"], [5, "real-movies"], [6, "real-series"], [8, "real-settings"]];
  for (const [index, name] of screens) {
    await clickDock(index);
    await wait(1700);
    await probeResponsiveness(name);
    await screenshot(name);
  }

  // 5. Live playback: open Live TV and play the first channel.
  await clickDock(2);
  await wait(1500);
  await evaluate(`document.querySelector(".channel-row .channel-action")?.click()`);
  console.log("waiting for live playback...");
  let playback = null;
  for (let i = 0; i < 45; i += 1) {
    await wait(1000);
    const { value } = await evaluate(`
      (() => {
        const video = document.querySelector("video");
        if (!video) return null;
        return { readyState: video.readyState, paused: video.paused, error: video.error?.code ?? 0, time: video.currentTime };
      })()
    `);
    playback = value;
    if (value && value.readyState >= 3 && !value.paused && value.time > 1) break;
  }
  console.log(`playback: ${JSON.stringify(playback)}`);
  await screenshot("real-player");
  if (!playback || playback.readyState < 3 || playback.error) {
    throw new Error("Live playback did not reach a playing state.");
  }
  await probeResponsiveness("during playback");

  // 6. Search QA against the real library.
  await evaluate(`document.querySelector(".player-back, [aria-label='Back']")?.click()`);
  await wait(800);
  await clickDock(0);
  await wait(600);
  await evaluate(`
    (() => {
      const input = document.getElementById("global-search");
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, "news");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    })()
  `);
  await wait(1500);
  const { value: results } = await evaluate(`document.querySelectorAll(".media-card").length`);
  console.log(`search results visible: ${results}`);
  await screenshot("real-search");

  console.log("REAL SOURCE QA PASSED");
  exitCode = 0;
} catch (error) {
  console.error(`REAL SOURCE QA FAILED: ${error.message}`);
  try { await screenshot("real-failure"); } catch { /* ignore */ }
} finally {
  try { cdp?.close(); } catch { /* ignore */ }
  child.kill();
  await wait(1500);
  await rm(userData, { recursive: true, force: true }).catch(() => {});
}
process.exit(exitCode);
