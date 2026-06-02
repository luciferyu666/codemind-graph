#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packDestination = path.join(repoRoot, ".codemind", "npm-pack");
const packageDirs = [
  "packages/core",
  "packages/adapter-typescript",
  "packages/mcp-server",
  "packages/cli",
];

function runPnpm(args, cwd) {
  if (process.platform === "win32") {
    return spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "pnpm", ...args], {
      cwd,
      stdio: "inherit",
    });
  }

  return spawnSync("pnpm", args, {
    cwd,
    stdio: "inherit",
  });
}

mkdirSync(packDestination, { recursive: true });

for (const packageDir of packageDirs) {
  const cwd = path.join(repoRoot, packageDir);
  const result = runPnpm(["pack", "--pack-destination", packDestination], cwd);

  if (result.error) {
    console.error(result.error.message);
  }
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    break;
  }
}

if (process.exitCode === undefined) {
  console.log(`Packed CodeMind packages into ${packDestination}`);
}
