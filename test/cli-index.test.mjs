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
    assert.equal(typeof graphFile.freshness.indexedAt, "string");
    assert.equal(graphFile.freshness.rootDir, graphFile.rootDir);
    assert.equal(graphFile.freshness.sourceFileCount, 1);
    assert.match(graphFile.freshness.sourceFingerprint, /^sha256:[a-f0-9]{64}$/);
    assert.ok(nodeNames.has("function:greet"));
    assert.ok(graphFile.graph.edges.some((edge) => edge.kind === "EXPORTS"));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind find warns when the graph source fingerprint is stale", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-find-stale-"));

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
      "export function greet(name: string): string {\n  return `Hello, ${name}`;\n}\n",
    );

    await runCli(["index", "sample"], {
      cwd: rootDir,
      stdout: { write() {} },
      stderr: { write() {} },
    });
    await writeFile(
      path.join(rootDir, "sample", "src", "index.ts"),
      "export function greet(name: string): string {\n  return `Hi, ${name}`;\n}\n",
    );

    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["find", "greet", "--root", "sample"], {
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

    assert.equal(exitCode, 0);
    assert.equal(stderr, "");
    assert.match(stdout, /Warning: graph freshness is stale: source fingerprint changed/);
    assert.match(stdout, /Found 1 symbol\(s\) for "greet"/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind find warns but does not crash for legacy graph files without freshness metadata", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-find-legacy-"));

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
      "export function greet(name: string): string {\n  return `Hello, ${name}`;\n}\n",
    );
    await runCli(["index", "sample"], {
      cwd: rootDir,
      stdout: { write() {} },
      stderr: { write() {} },
    });

    const graphFilePath = path.join(rootDir, "sample", ".codemind", "graph.json");
    const graphFile = JSON.parse(await readFile(graphFilePath, "utf8"));
    delete graphFile.freshness;
    await writeFile(graphFilePath, `${JSON.stringify(graphFile, null, 2)}\n`, "utf8");

    let stdout = "";
    let stderr = "";
    const exitCode = await runCli(["find", "greet", "--root", "sample"], {
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

    assert.equal(exitCode, 0);
    assert.equal(stderr, "");
    assert.match(stdout, /Warning: graph freshness is unknown: graph index does not include freshness metadata/);
    assert.match(stdout, /Found 1 symbol\(s\) for "greet"/);
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
    assert.match(markdown, /^## Freshness/m);
    assert.match(markdown, /- Status: `fresh`/);
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

test("codemind trace reads .codemind/graph.json and reports symbol context", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-trace-"));

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
    const exitCode = await runCli(["trace", "greet", "--root", "sample"], {
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

    assert.equal(exitCode, 0);
    assert.equal(stderr, "");
    assert.match(stdout, /^# Trace/m);
    assert.match(stdout, /Query: `greet`/);
    assert.match(stdout, /Matches: 1/);
    assert.match(stdout, /^## Freshness/m);
    assert.match(stdout, /- Status: `fresh`/);
    assert.match(stdout, /- Symbol: `function greet`/);
    assert.match(stdout, /- File: `src\/index\.ts`/);
    assert.match(stdout, /^### Imports/m);
    assert.match(stdout, /\| src\/index\.ts \| module:src\/helper\.ts \| \.\/helper\.js \| named \|/);
    assert.match(stdout, /^### Exports/m);
    assert.match(stdout, /\| src\/index\.ts \| function:greet \|  \| named \|/);
    assert.match(stdout, /^### Calls Out/m);
    assert.match(stdout, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);
    assert.match(stdout, /^### Called By/m);
    assert.match(stdout, /No incoming calls found\./);
    assert.match(stdout, /^### Related Modules/m);
    assert.match(stdout, /\| src\/helper\.ts \| project \| \.\/helper\.js \|/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind explain reads .codemind/graph.json and reports file context", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-explain-"));

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
    const exitCode = await runCli(["explain", "src/index.ts", "--root", "sample"], {
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

    assert.equal(exitCode, 0);
    assert.equal(stderr, "");
    assert.match(stdout, /^# File Explain/m);
    assert.match(stdout, /File: `src\/index\.ts`/);
    assert.match(stdout, /^## Freshness/m);
    assert.match(stdout, /- Status: `fresh`/);
    assert.match(stdout, /^## File Overview/m);
    assert.match(stdout, /- Indexed path: `src\/index\.ts`/);
    assert.match(stdout, /- Symbols: 1/);
    assert.match(stdout, /- Imports: 1/);
    assert.match(stdout, /- Exports: 1/);
    assert.match(stdout, /^## Symbols/m);
    assert.match(stdout, /\| function \| greet \| src\/index\.ts:3:1 \| yes \|/);
    assert.match(stdout, /^## Imports/m);
    assert.match(stdout, /\| src\/index\.ts \| module:src\/helper\.ts \| \.\/helper\.js \| named \|/);
    assert.match(stdout, /^## Exports/m);
    assert.match(stdout, /\| src\/index\.ts \| function:greet \|  \| named \|/);
    assert.match(stdout, /^## Related Modules/m);
    assert.match(stdout, /\| src\/helper\.ts \| project \| \.\/helper\.js \|/);
    assert.match(stdout, /^## Diagnostics/m);
    assert.match(stdout, /No diagnostics\./);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind explain returns 2 when the file is not indexed", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-explain-empty-"));

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
    const exitCode = await runCli(["explain", "src/missing.ts", "--root", "sample"], {
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
    assert.match(stdout, /^# File Explain/m);
    assert.match(stdout, /File: `src\/missing\.ts`/);
    assert.match(stdout, /^## Freshness/m);
    assert.match(stdout, /No indexed file found\./);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind trace returns 2 when no symbols match", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-trace-empty-"));

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
    const exitCode = await runCli(["trace", "missing", "--root", "sample"], {
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
    assert.match(stdout, /^# Trace/m);
    assert.match(stdout, /No symbols found for `missing`\./);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind mcp start delegates to the read-only MCP server", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-cli-"));

  try {
    let stdout = "";
    let stderr = "";
    let startedRootDir = "";
    const exitCode = await runCli(["mcp", "start", "--root", "sample"], {
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
      async startMcpServer(options) {
        startedRootDir = options.rootDir;
      },
    });

    assert.equal(exitCode, 0);
    assert.equal(stdout, "");
    assert.equal(stderr, "");
    assert.equal(startedRootDir, path.join(rootDir, "sample"));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("codemind mcp start rejects unknown options", async () => {
  let stdout = "";
  let stderr = "";
  let started = false;
  const exitCode = await runCli(["mcp", "start", "--write"], {
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
    async startMcpServer() {
      started = true;
    },
  });

  assert.equal(exitCode, 1);
  assert.equal(stdout, "");
  assert.match(stderr, /Unknown option for mcp start: --write/);
  assert.equal(started, false);
});
