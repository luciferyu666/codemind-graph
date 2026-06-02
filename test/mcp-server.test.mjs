import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runCli } from "../packages/cli/dist/index.js";
import { createCodeMindMcpServer, explainFile, findSymbol, getRepoMap, traceSymbol } from "../packages/mcp-server/dist/index.js";

test("MCP server factory creates a connectable read-only server", () => {
  const server = createCodeMindMcpServer({ rootDir: process.cwd() });

  assert.equal(typeof server.connect, "function");
  assert.equal(server.isConnected(), false);
});

test("findSymbol reads graph.json and returns matching symbols", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-find-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);

    const result = await findSymbol({ query: "greet", root: "sample" }, { rootDir });
    const text = readTextResult(result);

    assert.match(text, /^# find_symbol/m);
    assert.match(text, /Query: `greet`/);
    assert.match(text, /Matches: 1/);
    assert.match(text, /^## Freshness/m);
    assert.match(text, /- Status: `fresh`/);
    assert.match(text, /\| function \| greet \| src\/index\.ts:3:1 \| yes \|/);
    assert.doesNotMatch(text, /SESSION_STATE/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("findSymbol returns a deterministic no-match response", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-find-empty-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);

    const result = await findSymbol({ query: "missing", root: "sample" }, { rootDir });
    const text = readTextResult(result);

    assert.match(text, /^# find_symbol/m);
    assert.match(text, /No symbols found for `missing`\./);
    assert.match(text, /^## Freshness/m);
    assert.match(text, /- Status: `fresh`/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("findSymbol reports stale freshness when indexed source content changes", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-find-stale-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);
    await writeFile(
      path.join(rootDir, "sample", "src", "index.ts"),
      ["export function greet(name: string): string {", "  return `Hi, ${name}`;", "}", ""].join("\n"),
    );

    const result = await findSymbol({ query: "greet", root: "sample" }, { rootDir });
    const text = readTextResult(result);

    assert.match(text, /^# find_symbol/m);
    assert.match(text, /Matches: 1/);
    assert.match(text, /^## Freshness/m);
    assert.match(text, /- Status: `stale`/);
    assert.match(text, /source fingerprint changed/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("getRepoMap reads graph.json and returns markdown repo map", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-map-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);

    const result = await getRepoMap({ root: "sample" }, { rootDir });
    const text = readTextResult(result);

    assert.match(text, /^# CODEMIND/m);
    assert.match(text, /^## Overview/m);
    assert.match(text, /- Adapter: `@codemind\/adapter-typescript@0\.1\.0`/);
    assert.match(text, /- Capabilities: `symbols, imports, exports, calls`/);
    assert.match(text, /^## Freshness/m);
    assert.match(text, /- Status: `fresh`/);
    assert.match(text, /^## Symbols/m);
    assert.match(text, /\| function \| greet \| src\/index\.ts:3:1 \| yes \|/);
    assert.match(text, /^## Calls/m);
    assert.match(text, /- Call edges: 1/);
    assert.match(text, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);
    assert.doesNotMatch(text, /SESSION_STATE/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("traceSymbol reads graph.json and returns markdown symbol trace", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-trace-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);

    const result = await traceSymbol({ query: "greet", root: "sample" }, { rootDir });
    const text = readTextResult(result);

    assert.match(text, /^# Trace/m);
    assert.match(text, /Query: `greet`/);
    assert.match(text, /Matches: 1/);
    assert.match(text, /^## Freshness/m);
    assert.match(text, /- Status: `fresh`/);
    assert.match(text, /- Symbol: `function greet`/);
    assert.match(text, /- File: `src\/index\.ts`/);
    assert.match(text, /^### Imports/m);
    assert.match(text, /^### Exports/m);
    assert.match(text, /^### Calls Out/m);
    assert.match(text, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);
    assert.match(text, /^### Called By/m);
    assert.doesNotMatch(text, /SESSION_STATE/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("explainFile reads graph.json and returns markdown file context", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-explain-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);

    const result = await explainFile({ path: "src/index.ts", root: "sample" }, { rootDir });
    const text = readTextResult(result);

    assert.match(text, /^# File Explain/m);
    assert.match(text, /File: `src\/index\.ts`/);
    assert.match(text, /^## Freshness/m);
    assert.match(text, /- Status: `fresh`/);
    assert.match(text, /^## File Overview/m);
    assert.match(text, /- Calls out: 1/);
    assert.match(text, /^## Calls Out/m);
    assert.match(text, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);
    assert.match(text, /^## Called By/m);
    assert.doesNotMatch(text, /SESSION_STATE/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("MCP graph path must stay inside the selected root", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-path-"));

  try {
    await writeSampleProject(rootDir);
    await indexSampleProject(rootDir);

    await assert.rejects(
      findSymbol({ query: "greet", root: "sample", graph: "../outside/graph.json" }, { rootDir }),
      /MCP graph path must stay inside/,
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

async function writeSampleProject(rootDir) {
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
}

async function indexSampleProject(rootDir) {
  let stderr = "";
  const exitCode = await runCli(["index", "sample"], {
    cwd: rootDir,
    stdout: { write() {} },
    stderr: {
      write(chunk) {
        stderr += String(chunk);
      },
    },
  });

  assert.equal(exitCode, 0);
  assert.equal(stderr, "");

  const graphPath = path.join(rootDir, "sample", ".codemind", "graph.json");
  await readFile(graphPath, "utf8");
}

function readTextResult(result) {
  assert.equal(result.content.length, 1);
  const [content] = result.content;
  assert.equal(content.type, "text");
  return content.text;
}
