import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCli } from "../packages/cli/dist/index.js";

test("codemind index writes .codemind/graph.json", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-cli-"));

  try {
    await mkdir(path.join(rootDir, "sample", "src"), { recursive: true });
    await writeFile(
      path.join(rootDir, "sample", "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      path.join(rootDir, "sample", "src", "index.ts"),
      ["export function greet(name: string): string {", "  return `Hello, ${name}`;", "}", ""].join("\n"),
    );

    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["index", "sample"], {
      cwd: rootDir,
      stdout: {
        write(chunk) {
          stdout += String(chunk);
        },
      },
      stderr: {
        write(chunk) {
          stderr += String(chunk);
        },
      },
    });

    const graphFilePath = path.join(rootDir, "sample", ".codemind", "graph.json");
    const graphFile = JSON.parse(await readFile(graphFilePath, "utf8"));
    const nodeNames = new Set(graphFile.graph.nodes.map((node) => `${node.kind}:${node.name}`));

    assert.equal(exitCode, 0);
    assert.match(stdout, /Indexed 1 TypeScript source file/);
    assert.match(stdout, /sample\/\.codemind\/graph\.json/);
    assert.equal(stderr, "");
    assert.equal(graphFile.schemaVersion, "0.1.0");
    assert.deepEqual(graphFile.sourceFiles, ["src/index.ts"]);
    assert.equal(graphFile.diagnostics.length, 0);
    assert.ok(nodeNames.has("function:greet"));
    assert.ok(graphFile.graph.edges.some((edge) => edge.kind === "EXPORTS"));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind find reads .codemind/graph.json and finds symbols", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-find-"));

  try {
    await mkdir(path.join(rootDir, "sample", "src"), { recursive: true });
    await writeFile(
      path.join(rootDir, "sample", "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      path.join(rootDir, "sample", "src", "index.ts"),
      [
        "export class GreetingService {",
        "  greet(name: string): string {",
        "    return `Hello, ${name}`;",
        "  }",
        "}",
        "",
        "export function greet(name: string): string {",
        "  return new GreetingService().greet(name);",
        "}",
        "",
      ].join("\n"),
    );

    let indexStdout = "";
    let indexStderr = "";
    const indexExitCode = await runCli(["index", "sample"], {
      cwd: rootDir,
      stdout: {
        write(chunk) {
          indexStdout += String(chunk);
        },
      },
      stderr: {
        write(chunk) {
          indexStderr += String(chunk);
        },
      },
    });
    assert.equal(indexExitCode, 0);
    assert.equal(indexStderr, "");
    assert.match(indexStdout, /graph\.json/);

    let findStdout = "";
    let findStderr = "";
    const findExitCode = await runCli(["find", "greet", "--root", "sample"], {
      cwd: rootDir,
      stdout: {
        write(chunk) {
          findStdout += String(chunk);
        },
      },
      stderr: {
        write(chunk) {
          findStderr += String(chunk);
        },
      },
    });

    assert.equal(findExitCode, 0);
    assert.equal(findStderr, "");
    assert.match(findStdout, /Found 3 symbol\(s\) for "greet"/);
    assert.match(findStdout, /class GreetingService \(src\/index\.ts:1:1\)/);
    assert.match(findStdout, /method GreetingService\.greet \(src\/index\.ts:2:3\)/);
    assert.match(findStdout, /function greet \(src\/index\.ts:7:1\)/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind find returns 2 when no symbols match", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-find-empty-"));

  try {
    await mkdir(path.join(rootDir, "sample", "src"), { recursive: true });
    await writeFile(
      path.join(rootDir, "sample", "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ),
    );
    await writeFile(path.join(rootDir, "sample", "src", "index.ts"), "export const answer = 42;\n");

    await runCli(["index", "sample"], {
      cwd: rootDir,
      stdout: { write() {} },
      stderr: { write() {} },
    });

    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["find", "missing", "--root", "sample"], {
      cwd: rootDir,
      stdout: {
        write(chunk) {
          stdout += String(chunk);
        },
      },
      stderr: {
        write(chunk) {
          stderr += String(chunk);
        },
      },
    });

    assert.equal(exitCode, 2);
    assert.equal(stderr, "");
    assert.match(stdout, /No symbols found for "missing"/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind map writes deterministic CODEMIND.md", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-map-"));

  try {
    await mkdir(path.join(rootDir, "sample", "src"), { recursive: true });
    await writeFile(
      path.join(rootDir, "sample", "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      path.join(rootDir, "sample", "src", "helper.ts"),
      ["export function formatName(name: string): string {", "  return name.trim();", "}", ""].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "sample", "src", "index.ts"),
      [
        'import { formatName } from "./helper.js";',
        "",
        "export function greet(name: string): string {",
        "  return `Hello, ${formatName(name)}`;",
        "}",
        "",
      ].join("\n"),
    );

    await runCli(["index", "sample"], {
      cwd: rootDir,
      stdout: { write() {} },
      stderr: { write() {} },
    });

    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["map", "--root", "sample", "--format", "markdown"], {
      cwd: rootDir,
      stdout: {
        write(chunk) {
          stdout += String(chunk);
        },
      },
      stderr: {
        write(chunk) {
          stderr += String(chunk);
        },
      },
    });

    const codemindPath = path.join(rootDir, "sample", "CODEMIND.md");
    const markdown = await readFile(codemindPath, "utf8");

    assert.equal(exitCode, 0);
    assert.equal(stderr, "");
    assert.match(stdout, /Generated CODEMIND map for 2 TypeScript source file/);
    assert.match(stdout, /sample\/CODEMIND\.md/);
    assert.match(markdown, /^# CODEMIND/m);
    assert.match(markdown, /^## Overview/m);
    assert.match(markdown, /^## Files/m);
    assert.match(markdown, /^## Symbols/m);
    assert.match(markdown, /^## Imports/m);
    assert.match(markdown, /^## Exports/m);
    assert.match(markdown, /^## Diagnostics/m);
    assert.match(markdown, /\| src\/index\.ts \| 1 \| 1 \| 1 \|/);
    assert.match(markdown, /\| function \| greet \| src\/index\.ts:3:1 \| yes \|/);
    assert.match(markdown, /\| src\/index\.ts \| module:src\/helper\.ts \| \.\/helper\.js \|/);
    assert.match(markdown, /No diagnostics\./);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
