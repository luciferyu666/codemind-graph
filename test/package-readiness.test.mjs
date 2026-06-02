import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tarCommand = process.platform === "win32" ? "tar.exe" : "tar";
const packageVersion = "0.1.2";
const packageDirs = [
  ["@codemind/core", "packages/core"],
  ["@codemind/adapter-typescript", "packages/adapter-typescript"],
  ["@codemind/mcp-server", "packages/mcp-server"],
  ["@codemind/cli", "packages/cli"],
];

async function readPackageJson(packageDir) {
  const packageJson = await readFile(path.join(repoRoot, packageDir, "package.json"), "utf8");
  return JSON.parse(packageJson);
}

function run(command, args, options = {}) {
  if (command === "pnpm" && process.platform === "win32") {
    return spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "pnpm", ...args], {
      cwd: options.cwd ?? repoRoot,
      encoding: "utf8",
      shell: false,
    });
  }

  return spawnSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    encoding: "utf8",
    shell: false,
  });
}

function assertDistOnlyPackageEntries(entries) {
  assert.ok(entries.includes("package/package.json"));
  assert.ok(entries.includes("package/dist/index.js"));
  assert.ok(entries.includes("package/dist/index.d.ts"));
  assert.equal(entries.some((entry) => entry.startsWith("package/src/")), false);
  assert.equal(entries.includes("package/tsconfig.json"), false);
  assert.equal(entries.some((entry) => entry.endsWith(".tsbuildinfo")), false);
}

function assertWorkspaceDependencySource(packageJson, dependencyName) {
  assert.equal(packageJson.dependencies?.[dependencyName], "workspace:*");
}

function assertPackedDependencyVersion(packageJson, dependencyName) {
  assert.equal(packageJson.dependencies?.[dependencyName], packageVersion);
}

test("runtime packages expose npm-ready metadata", async () => {
  for (const [packageName, packageDir] of packageDirs) {
    const packageJson = await readPackageJson(packageDir);

    assert.equal(packageJson.name, packageName);
    assert.equal(packageJson.private, undefined);
    assert.equal(packageJson.version, packageVersion);
    assert.equal(packageJson.type, "module");
    assert.equal(packageJson.main, "./dist/index.js");
    assert.equal(packageJson.types, "./dist/index.d.ts");
    assert.equal(packageJson.exports?.["."]?.types, "./dist/index.d.ts");
    assert.equal(packageJson.exports?.["."]?.import, "./dist/index.js");
    assert.equal(packageJson.publishConfig?.access, "public");
    assert.equal(packageJson.repository?.url, "git+https://github.com/luciferyu666/codemind-graph.git");
    assert.equal(packageJson.repository?.directory, packageDir);
    assert.equal(packageJson.bugs?.url, "https://github.com/luciferyu666/codemind-graph/issues");
    assert.equal(packageJson.homepage, "https://github.com/luciferyu666/codemind-graph#readme");
    assert.equal(packageJson.engines?.node, ">=22.0.0");
    assert.deepEqual(packageJson.files, [
      "dist/**/*.js",
      "dist/**/*.js.map",
      "dist/**/*.d.ts",
      "dist/**/*.d.ts.map",
    ]);
  }

  const adapterPackage = await readPackageJson("packages/adapter-typescript");
  const mcpPackage = await readPackageJson("packages/mcp-server");
  const cliPackage = await readPackageJson("packages/cli");

  assertWorkspaceDependencySource(adapterPackage, "@codemind/core");
  assertWorkspaceDependencySource(mcpPackage, "@codemind/core");
  assertWorkspaceDependencySource(cliPackage, "@codemind/core");
  assertWorkspaceDependencySource(cliPackage, "@codemind/adapter-typescript");
  assertWorkspaceDependencySource(cliPackage, "@codemind/mcp-server");
  assert.equal(cliPackage.bin?.codemind, "./dist/index.js");
});

test("workspace codemind script exposes the CLI help", () => {
  const result = run("pnpm", ["codemind", "--help"]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /CodeMind Graph CLI/);
  assert.match(result.stdout, /codemind index <path>/);
});

test("pnpm pack emits dist-only tarballs with semver internal dependencies", async () => {
  const packDestination = await mkdtemp(path.join(os.tmpdir(), "codemind-npm-pack-"));

  try {
    for (const [packageName, packageDir] of packageDirs) {
      const packResult = run("pnpm", ["pack", "--pack-destination", packDestination], {
        cwd: path.join(repoRoot, packageDir),
      });
      assert.equal(packResult.status, 0, packResult.stderr);

      const tarballName = packageName.replace("@", "").replace("/", "-");
      const tarballPath = path.join(packDestination, `${tarballName}-${packageVersion}.tgz`);
      const listResult = run(tarCommand, ["-tf", tarballPath]);
      assert.equal(listResult.status, 0, listResult.stderr);

      const entries = listResult.stdout.trim().split(/\r?\n/);
      assertDistOnlyPackageEntries(entries);

      const packageJsonResult = run(tarCommand, ["-xOf", tarballPath, "package/package.json"]);
      assert.equal(packageJsonResult.status, 0, packageJsonResult.stderr);

      const packageJson = JSON.parse(packageJsonResult.stdout);
      assert.equal(packageJson.private, undefined);
      assert.equal(packageJson.version, packageVersion);
    }

    const files = await readdir(packDestination);
    assert.equal(files.length, packageDirs.length);

    const adapterPackageJson = JSON.parse(
      run(tarCommand, [
        "-xOf",
        path.join(packDestination, `codemind-adapter-typescript-${packageVersion}.tgz`),
        "package/package.json",
      ]).stdout,
    );
    const mcpPackageJson = JSON.parse(
      run(tarCommand, ["-xOf", path.join(packDestination, `codemind-mcp-server-${packageVersion}.tgz`), "package/package.json"])
        .stdout,
    );
    const cliPackageJson = JSON.parse(
      run(tarCommand, ["-xOf", path.join(packDestination, `codemind-cli-${packageVersion}.tgz`), "package/package.json"])
        .stdout,
    );

    assertPackedDependencyVersion(adapterPackageJson, "@codemind/core");
    assertPackedDependencyVersion(mcpPackageJson, "@codemind/core");
    assertPackedDependencyVersion(cliPackageJson, "@codemind/core");
    assertPackedDependencyVersion(cliPackageJson, "@codemind/adapter-typescript");
    assertPackedDependencyVersion(cliPackageJson, "@codemind/mcp-server");
    assert.equal(cliPackageJson.bin?.codemind, "./dist/index.js");
  } finally {
    await rm(packDestination, { recursive: true, force: true });
  }
});
