import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("../../", import.meta.url));
let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? "OK" : "MISSING"} ${label}: ${detail}`);
  if (!ok) failures++;
}
function version(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", shell: process.platform === "win32" });
  return { ok: result.status === 0, text: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n")[0] };
}
const expectedNode = readFileSync(path.join(root, ".nvmrc"), "utf8").trim();
check("Node.js", process.versions.node.split(".")[0] === expectedNode, `${process.version} (project: ${expectedNode})`);
const npm = version("npm", ["--version"]);
check("npm", npm.ok, npm.text || "Install npm with Node.js");
const installed = existsSync(path.join(root, "node_modules/next/package.json"));
check("Workspace dependencies", installed, installed ? "installed" : "Run npm ci at the repository root");
const javaCommand = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java") : "java";
const java = version(javaCommand, ["-version"]);
check("Java 17", java.ok && /version "17\./.test(java.text), java.text || "Set JAVA_HOME to a JDK 17 installation");
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
check("Android SDK 36", Boolean(sdk && existsSync(path.join(sdk, "platforms/android-36/android.jar"))), sdk || "Set ANDROID_HOME");
for (const app of ["web", "admin"]) {
  const local = path.join(root, "apps", app, ".env.local");
  // Report presence only: never print secrets or connect to production.
  check(`${app} local environment`, existsSync(local), existsSync(local) ? "present (values hidden)" : `Use apps/${app}/.env.example`);
}
const flutter = version("flutter", ["--version"]);
console.log(`${flutter.ok ? "OK" : "OPTIONAL"} Flutter: ${flutter.text || "needed for the iOS preview workspace"}`);
console.log("iOS signing requires macOS/Xcode; Windows installers require their packaging toolchain.");
process.exitCode = failures ? 1 : 0;
