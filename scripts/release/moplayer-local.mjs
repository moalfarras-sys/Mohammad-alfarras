#!/usr/bin/env node
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const androidDir = resolve(root, "android/moplayer");
const publicDir = resolve(root, "apps/web/public/downloads/moplayer");

const artifacts = [
  {
    abi: "arm64-v8a",
    source: resolve(androidDir, "build-output/app/outputs/apk/sideload/release/app-sideload-arm64-v8a-release.apk"),
    target: resolve(publicDir, "app-sideload-arm64-v8a-release.apk"),
  },
  {
    abi: "armeabi-v7a",
    source: resolve(androidDir, "build-output/app/outputs/apk/sideload/release/app-sideload-armeabi-v7a-release.apk"),
    target: resolve(publicDir, "app-sideload-armeabi-v7a-release.apk"),
  },
];

function run(command, args, cwd) {
  const result =
    process.platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", command, ...args], { cwd, stdio: "inherit" })
      : spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function checksum(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

run(process.platform === "win32" ? "gradlew.bat" : "./gradlew", ["assembleSideloadRelease"], androidDir);

mkdirSync(publicDir, { recursive: true });

for (const artifact of artifacts) {
  if (!existsSync(artifact.source)) {
    throw new Error(`Missing release artifact for ${artifact.abi}: ${artifact.source}`);
  }

  mkdirSync(dirname(artifact.target), { recursive: true });
  copyFileSync(artifact.source, artifact.target);

  const size = statSync(artifact.target).size;
  console.log(`${artifact.abi}: ${artifact.target}`);
  console.log(`  size: ${size}`);
  console.log(`  sha256: ${checksum(artifact.target)}`);
}
