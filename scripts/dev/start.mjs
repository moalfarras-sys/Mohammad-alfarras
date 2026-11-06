import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const apps = [
  { name: "web", port: 3000 },
  { name: "admin", port: 3100 },
];
const children = new Set();
let stopping = false;

function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  for (const child of children) {
    if (process.platform === "win32" && child.pid) {
      // Next's CLI owns a server child; Windows must stop the whole tree.
      const cleanup = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
      cleanup.once("error", () => child.kill());
    } else {
      child.kill("SIGTERM");
    }
  }
  setTimeout(() => {
    for (const child of children) child.kill("SIGKILL");
  }, 8000).unref();
}

async function checkPort(port) {
  await new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

try {
  // Refuse an occupied port before starting either app; never stop another server.
  await Promise.all(apps.map(({ port }) => checkPort(port)));
  process.on("SIGINT", () => stop(0));
  process.on("SIGTERM", () => stop(0));

  for (const { name, port } of apps) {
    const directory = new URL(`../../apps/${name}/`, import.meta.url);
    const require = createRequire(new URL("package.json", directory));
    const child = spawn(process.execPath, [
      require.resolve("next/dist/bin/next"),
      "dev", "--hostname", "127.0.0.1", "--port", String(port),
    ], {
      cwd: fileURLToPath(directory),
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_WEB_APP_URL: "http://127.0.0.1:3000",
        NEXT_PUBLIC_ADMIN_APP_URL: "http://127.0.0.1:3100",
      },
    });
    children.add(child);
    child.once("error", (error) => {
      console.error(`Cannot start ${name}: ${error.message}`);
      stop(1);
    });
    child.once("exit", (code, signal) => {
      children.delete(child);
      if (!stopping) {
        console.error(`${name} stopped (${signal ?? code}); stopping the development session.`);
        stop(code || 1);
      }
    });
  }
  console.log("\nMoalfarras development: web http://127.0.0.1:3000/en | admin http://127.0.0.1:3100");
  console.log("Press Ctrl+C to stop both apps.\n");
} catch (error) {
  console.error(`Cannot start development: ${error.message}`);
  stop(1);
}
