import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projects = {
  classic: "../apps/moplayer-android/",
  pro: "../apps/moplayer-pro-android/",
};
const [project, ...args] = process.argv.slice(2);
if (!Object.hasOwn(projects, project) || args.length === 0) {
  console.error("Usage: node scripts/run-gradle.mjs <classic|pro> <task> [options]");
  process.exit(1);
}

const windows = process.platform === "win32";
const result = spawnSync(
  windows ? "cmd.exe" : "sh",
  windows ? ["/d", "/c", "gradlew.bat", ...args] : ["./gradlew", ...args],
  {
    cwd: fileURLToPath(new URL(projects[project], import.meta.url)),
    stdio: "inherit",
    env: process.env,
  },
);
if (result.error) console.error(`Unable to launch Gradle: ${result.error.message}`);
process.exit(result.status ?? 1);
