import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runCli } from "../packages/cli/dist/index.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");
const cliEntryPath = path.join(repoRoot, "packages", "cli", "dist", "index.js");
const requireFromMcpServer = createRequire(pathToFileURL(path.join(repoRoot, "packages", "mcp-server", "package.json")));

test("MCP stdio protocol exposes read-only graph tools", { timeout: 20_000 }, async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-protocol-"));
  let client;
  let stderr = "";

  try {
    await writeExampleProject(rootDir);
    await indexExampleProject(rootDir);

    const { Client, StdioClientTransport } = await importMcpClientSdk();
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliEntryPath, "mcp", "start", "--root", "examples/ts-basic"],
      cwd: rootDir,
      stderr: "pipe",
    });
    transport.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    client = new Client({
      name: "codemind-protocol-smoke-test",
      version: "0.1.0",
    });
    await client.connect(transport);

    assert.deepEqual(client.getServerVersion(), {
      name: "codemind-graph",
      version: "0.1.0",
    });
    assert.ok(client.getServerCapabilities()?.tools);

    const toolsResult = await client.listTools();
    const tools = toolsResult.tools;
    const toolNames = tools.map((tool) => tool.name).sort();

    assert.deepEqual(toolNames, ["explain_file", "find_symbol", "get_repo_map", "trace_symbol"]);
    for (const tool of tools) {
      assert.equal(tool.annotations?.readOnlyHint, true, `${tool.name} must be read-only`);
      assert.equal(tool.annotations?.destructiveHint, false, `${tool.name} must be non-destructive`);
      assert.equal(tool.annotations?.openWorldHint, false, `${tool.name} must not depend on open-world access`);
      assert.doesNotMatch(tool.name, /write|edit|delete|mutate|apply/i);
    }

    const findResult = await client.callTool({
      name: "find_symbol",
      arguments: {
        query: "greet",
      },
    });
    const findText = readTextToolResult(findResult);

    assert.match(findText, /^# find_symbol/m);
    assert.match(findText, /Query: `greet`/);
    assert.match(findText, /Matches: 1/);
    assert.match(findText, /^## Freshness/m);
    assert.match(findText, /- Status: `fresh`/);
    assert.match(findText, /\| function \| greet \| src\/index\.ts:3:1 \| yes \|/);

    const repoMapResult = await client.callTool({
      name: "get_repo_map",
      arguments: {},
    });
    const repoMapText = readTextToolResult(repoMapResult);

    assert.match(repoMapText, /^# CODEMIND/m);
    assert.match(repoMapText, /^## Overview/m);
    assert.match(repoMapText, /^## Freshness/m);
    assert.match(repoMapText, /- Status: `fresh`/);
    assert.match(repoMapText, /^## Symbols/m);
    assert.match(repoMapText, /\| function \| greet \| src\/index\.ts:3:1 \| yes \|/);
    assert.match(repoMapText, /^## Calls/m);
    assert.match(repoMapText, /- Call edges: 1/);
    assert.match(repoMapText, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);

    const traceResult = await client.callTool({
      name: "trace_symbol",
      arguments: {
        query: "greet",
      },
    });
    const traceText = readTextToolResult(traceResult);

    assert.match(traceText, /^# Trace/m);
    assert.match(traceText, /Query: `greet`/);
    assert.match(traceText, /^## Freshness/m);
    assert.match(traceText, /- Status: `fresh`/);
    assert.match(traceText, /- Symbol: `function greet`/);
    assert.match(traceText, /- File: `src\/index\.ts`/);
    assert.match(traceText, /^### Calls Out/m);
    assert.match(traceText, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);
    assert.match(traceText, /^### Called By/m);

    const explainResult = await client.callTool({
      name: "explain_file",
      arguments: {
        path: "src/index.ts",
      },
    });
    const explainText = readTextToolResult(explainResult);

    assert.match(explainText, /^# File Explain/m);
    assert.match(explainText, /File: `src\/index\.ts`/);
    assert.match(explainText, /^## Freshness/m);
    assert.match(explainText, /- Status: `fresh`/);
    assert.match(explainText, /^## Calls Out/m);
    assert.match(explainText, /\| function:greet \| function:formatName \| formatName \| imported-function \|/);
    assert.match(explainText, /^## Called By/m);

    const combinedOutput = `${JSON.stringify(toolsResult)}\n${findText}\n${repoMapText}\n${traceText}\n${explainText}`;
    assert.doesNotMatch(combinedOutput, /SESSION_STATE|CURRENT_STATE|ENGINEERING_STATE|SECRET_SESSION_NOTE/);
    assert.equal(stderr, "");
  } finally {
    await client?.close();
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("MCP stdio protocol handles negative and freshness edge cases", { timeout: 20_000 }, async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-mcp-protocol-negative-"));
  let client;
  let stderr = "";

  try {
    await writeExampleProject(rootDir);

    const { Client, StdioClientTransport } = await importMcpClientSdk();
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliEntryPath, "mcp", "start", "--root", "."],
      cwd: rootDir,
      stderr: "pipe",
    });
    transport.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });

    client = new Client({
      name: "codemind-protocol-negative-test",
      version: "0.1.0",
    });
    await client.connect(transport);

    const missingGraphError = await readRejectedMessage(() =>
      client.callTool({
        name: "get_repo_map",
        arguments: {
          root: "examples/ts-basic",
        },
      })
    );
    assert.match(missingGraphError, /graph\.json|ENOENT|no such file/i);

    const rootEscapeError = await readRejectedMessage(() =>
      client.callTool({
        name: "get_repo_map",
        arguments: {
          root: "..",
        },
      })
    );
    assert.match(rootEscapeError, /MCP root path must stay inside/);

    const graphEscapeError = await readRejectedMessage(() =>
      client.callTool({
        name: "find_symbol",
        arguments: {
          query: "greet",
          root: "examples/ts-basic",
          graph: "../outside/graph.json",
        },
      })
    );
    assert.match(graphEscapeError, /MCP graph path must stay inside/);

    const invalidInputError = await readRejectedMessage(() =>
      client.callTool({
        name: "find_symbol",
        arguments: {},
      })
    );
    assert.match(invalidInputError, /query|invalid|expected|required/i);

    const invalidExplainInputError = await readRejectedMessage(() =>
      client.callTool({
        name: "explain_file",
        arguments: {},
      })
    );
    assert.match(invalidExplainInputError, /path|invalid|expected|required/i);

    await indexExampleProject(rootDir);
    const graphPath = path.join(rootDir, "examples", "ts-basic", ".codemind", "graph.json");
    const legacyGraph = JSON.parse(await readFile(graphPath, "utf8"));
    delete legacyGraph.freshness;
    await writeFile(graphPath, `${JSON.stringify(legacyGraph, null, 2)}\n`, "utf8");

    const legacyMapResult = await client.callTool({
      name: "get_repo_map",
      arguments: {
        root: "examples/ts-basic",
      },
    });
    const legacyMapText = readTextToolResult(legacyMapResult);

    assert.match(legacyMapText, /^# CODEMIND/m);
    assert.match(legacyMapText, /^## Freshness/m);
    assert.match(legacyMapText, /- Status: `unknown`/);
    assert.match(legacyMapText, /graph index does not include freshness metadata/);

    await indexExampleProject(rootDir);
    await writeFile(
      path.join(rootDir, "examples", "ts-basic", "src", "index.ts"),
      ["export function greet(name: string): string {", "  return `Hi, ${name}`;", "}", ""].join("\n"),
      "utf8",
    );
    const staleFindResult = await client.callTool({
      name: "find_symbol",
      arguments: {
        query: "greet",
        root: "examples/ts-basic",
      },
    });
    const staleFindText = readTextToolResult(staleFindResult);

    assert.match(staleFindText, /^# find_symbol/m);
    assert.match(staleFindText, /Matches: 1/);
    assert.match(staleFindText, /^## Freshness/m);
    assert.match(staleFindText, /- Status: `stale`/);
    assert.match(staleFindText, /source fingerprint changed/);

    const combinedOutput = [
      missingGraphError,
      rootEscapeError,
      graphEscapeError,
      invalidInputError,
      invalidExplainInputError,
      legacyMapText,
      staleFindText,
    ].join("\n");
    assert.doesNotMatch(combinedOutput, /SESSION_STATE|CURRENT_STATE|ENGINEERING_STATE|SECRET_SESSION_NOTE/);
    assert.equal(stderr, "");
  } finally {
    await client?.close();
    await rm(rootDir, { recursive: true, force: true });
  }
});

async function importMcpClientSdk() {
  const clientModulePath = requireFromMcpServer.resolve("@modelcontextprotocol/sdk/client");
  const stdioModulePath = requireFromMcpServer.resolve("@modelcontextprotocol/sdk/client/stdio.js");
  const [{ Client }, { StdioClientTransport }] = await Promise.all([
    import(pathToFileURL(clientModulePath).href),
    import(pathToFileURL(stdioModulePath).href),
  ]);

  return {
    Client,
    StdioClientTransport,
  };
}

async function writeExampleProject(rootDir) {
  await mkdir(path.join(rootDir, "examples", "ts-basic", "src"), { recursive: true });
  await mkdir(path.join(rootDir, "docs"), { recursive: true });
  await writeFile(path.join(rootDir, "docs", "SESSION_STATE.md"), "SECRET_SESSION_NOTE\n", "utf8");
  await writeFile(
    path.join(rootDir, "examples", "ts-basic", "tsconfig.json"),
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
    "utf8",
  );
  await writeFile(
    path.join(rootDir, "examples", "ts-basic", "src", "helper.ts"),
    ["export function formatName(name: string): string {", "  return name.trim();", "}", ""].join("\n"),
    "utf8",
  );
  await writeFile(
    path.join(rootDir, "examples", "ts-basic", "src", "index.ts"),
    [
      'import { formatName } from "./helper.js";',
      "",
      "export function greet(name: string): string {",
      "  return `Hello, ${formatName(name)}`;",
      "}",
      "",
    ].join("\n"),
    "utf8",
  );
}

async function indexExampleProject(rootDir) {
  let stderr = "";
  const exitCode = await runCli(["index", "examples/ts-basic"], {
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

  const graphPath = path.join(rootDir, "examples", "ts-basic", ".codemind", "graph.json");
  await readFile(graphPath, "utf8");
}

async function readRejectedMessage(action) {
  try {
    const result = await action();
    assert.fail(`Expected MCP call to fail, but received: ${JSON.stringify(result)}`);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function readTextToolResult(result) {
  assert.equal(result.content.length, 1);
  const [content] = result.content;
  assert.equal(content.type, "text");
  return content.text;
}
