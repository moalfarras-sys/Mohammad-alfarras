import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../apps/MoPlayer iphone ios/", import.meta.url));
for (const [command, ...args] of [
  ["flutter", "pub", "get"],
  ["dart", "format", "--output=none", "--set-exit-if-changed", "lib", "test"],
  ["flutter", "analyze"],
  ["flutter", "test"],
]) {
  const windows = process.platform === "win32";
  const result = spawnSync(
    windows ? "cmd.exe" : command,
    windows ? ["/d", "/c", `${command}.bat`, ...args] : args,
    { cwd, stdio: "inherit", env: process.env },
  );
  if (result.error) console.error(`Unable to launch ${command}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
