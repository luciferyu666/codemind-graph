#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  extractTypeScriptGraph,
  TYPESCRIPT_ADAPTER_CAPABILITIES,
  TYPESCRIPT_ADAPTER_LANGUAGE,
  TYPESCRIPT_ADAPTER_NAME,
  TYPESCRIPT_ADAPTER_VERSION,
  type TypeScriptExtractionResult,
} from "@codemind/adapter-typescript";
import {
  createGraphFreshnessMetadata,
  evaluateGraphFreshness,
  explainFile,
  findSymbols,
  formatNodeLocation,
  GRAPH_INDEX_SCHEMA_VERSION,
  isGraphIndexFile,
  renderMarkdownFreshnessSection,
  renderFreshnessWarning,
  renderMarkdownFileExplain,
  renderMarkdownRepoMap,
  renderMarkdownSymbolTrace,
  traceSymbols,
  type GraphIndexFile,
  type GraphNode,
} from "@codemind/core";
import type { CodeMindMcpOptions } from "@codemind/mcp-server";

const CODEMIND_CLI_INDEXER_NAME = "codemind-cli";
const CODEMIND_CLI_INDEXER_VERSION = "0.1.0";

export interface CliOptions {
  readonly cwd?: string;
  readonly stdout?: WritableLike;
  readonly stderr?: WritableLike;
  readonly startMcpServer?: StartMcpServer;
}

interface WritableLike {
  write(chunk: string): unknown;
}

type StartMcpServer = (options: CodeMindMcpOptions) => Promise<void>;

interface ResolvedCliOptions {
  readonly cwd: string;
  readonly stdout: WritableLike;
  readonly stderr: WritableLike;
  readonly startMcpServer: StartMcpServer;
}

interface IndexArgs {
  readonly targetPath: string;
  readonly outputPath?: string;
}

interface FindArgs {
  readonly symbol: string;
  readonly rootPath?: string;
  readonly graphPath?: string;
}

interface TraceArgs {
  readonly symbol: string;
  readonly rootPath?: string;
  readonly graphPath?: string;
}

interface ExplainArgs {
  readonly filePath: string;
  readonly rootPath?: string;
  readonly graphPath?: string;
}

interface MapArgs {
  readonly rootPath?: string;
  readonly graphPath?: string;
  readonly outputPath?: string;
  readonly format: "markdown";
}

interface McpArgs {
  readonly rootPath?: string;
}

interface GraphPathArgs {
  readonly rootPath?: string;
  readonly graphPath?: string;
}

const HELP_TEXT = `CodeMind Graph CLI

Usage:
  codemind index <path> [--out <file>]
  codemind find <symbol> [--root <path>] [--graph <file>]
  codemind trace <symbol> [--root <path>] [--graph <file>]
  codemind explain <path> [--root <path>] [--graph <file>]
  codemind map [--root <path>] [--graph <file>] [--format markdown] [--out <file>]
  codemind health [--root <path>] [--graph <file>]
  codemind doctor [--root <path>] [--graph <file>]
  codemind mcp start [--root <path>]

Commands:
  index   Build a TypeScript graph and write .codemind/graph.json
  find    Find symbols in .codemind/graph.json
  trace   Trace a symbol to its file imports, exports, and related modules
  explain Explain an indexed file from .codemind/graph.json
  map     Generate CODEMIND.md from .codemind/graph.json
  health  Report graph index freshness and capabilities
  doctor  Check local runtime, TypeScript config, graph, freshness, and MCP readiness
  mcp     Start the read-only MCP server
`;

export async function runCli(argv = process.argv.slice(2), options: CliOptions = {}): Promise<number> {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const startMcpServer = options.startMcpServer ?? defaultStartMcpServer;
  const [command, ...args] = argv;
  const resolvedOptions: ResolvedCliOptions = {
    cwd,
    stdout,
    stderr,
    startMcpServer,
  };

  try {
    if (command === undefined || command === "--help" || command === "-h") {
      stdout.write(HELP_TEXT);
      return 0;
    }

    if (command === "index") {
      const indexArgs = parseIndexArgs(args);
      await runIndexCommand(indexArgs, resolvedOptions);
      return 0;
    }

    if (command === "find") {
      const findArgs = parseFindArgs(args);
      const found = await runFindCommand(findArgs, resolvedOptions);
      return found ? 0 : 2;
    }

    if (command === "trace") {
      const traceArgs = parseTraceArgs(args);
      const found = await runTraceCommand(traceArgs, resolvedOptions);
      return found ? 0 : 2;
    }

    if (command === "explain") {
      const explainArgs = parseExplainArgs(args);
      const found = await runExplainCommand(explainArgs, resolvedOptions);
      return found ? 0 : 2;
    }

    if (command === "map") {
      const mapArgs = parseMapArgs(args);
      await runMapCommand(mapArgs, resolvedOptions);
      return 0;
    }

    if (command === "health") {
      const healthArgs = parseHealthArgs(args);
      const healthy = await runHealthCommand(healthArgs, resolvedOptions);
      return healthy ? 0 : 2;
    }

    if (command === "doctor") {
      const doctorArgs = parseDoctorArgs(args);
      const passed = await runDoctorCommand(doctorArgs, resolvedOptions);
      return passed ? 0 : 2;
    }

    if (command === "mcp") {
      const mcpArgs = parseMcpArgs(args);
      await runMcpCommand(mcpArgs, resolvedOptions);
      return 0;
    }

    stderr.write(`Unknown command: ${command}\n\n${HELP_TEXT}`);
    return 1;
  } catch (error) {
    stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parseIndexArgs(args: readonly string[]): IndexArgs {
  let targetPath: string | undefined;
  let outputPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--out") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --out");
      }
      outputPath = nextArg;
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for index: ${arg}`);
    }

    if (targetPath !== undefined) {
      throw new Error(`Unexpected extra argument for index: ${arg}`);
    }

    targetPath = arg;
  }

  if (targetPath === undefined) {
    throw new Error("Usage: codemind index <path> [--out <file>]");
  }

  return {
    targetPath,
    ...(outputPath === undefined ? {} : { outputPath }),
  };
}

function parseFindArgs(args: readonly string[]): FindArgs {
  let symbol: string | undefined;
  let rootPath: string | undefined;
  let graphPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--root") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--graph") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --graph");
      }
      graphPath = nextArg;
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for find: ${arg}`);
    }

    if (symbol !== undefined) {
      throw new Error(`Unexpected extra argument for find: ${arg}`);
    }

    symbol = arg;
  }

  if (symbol === undefined) {
    throw new Error("Usage: codemind find <symbol> [--root <path>] [--graph <file>]");
  }

  return {
    symbol,
    ...(rootPath === undefined ? {} : { rootPath }),
    ...(graphPath === undefined ? {} : { graphPath }),
  };
}

function parseTraceArgs(args: readonly string[]): TraceArgs {
  let symbol: string | undefined;
  let rootPath: string | undefined;
  let graphPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--root") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--graph") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --graph");
      }
      graphPath = nextArg;
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for trace: ${arg}`);
    }

    if (symbol !== undefined) {
      throw new Error(`Unexpected extra argument for trace: ${arg}`);
    }

    symbol = arg;
  }

  if (symbol === undefined) {
    throw new Error("Usage: codemind trace <symbol> [--root <path>] [--graph <file>]");
  }

  return {
    symbol,
    ...(rootPath === undefined ? {} : { rootPath }),
    ...(graphPath === undefined ? {} : { graphPath }),
  };
}

function parseExplainArgs(args: readonly string[]): ExplainArgs {
  let filePath: string | undefined;
  let rootPath: string | undefined;
  let graphPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--root") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--graph") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --graph");
      }
      graphPath = nextArg;
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for explain: ${arg}`);
    }

    if (filePath !== undefined) {
      throw new Error(`Unexpected extra argument for explain: ${arg}`);
    }

    filePath = arg;
  }

  if (filePath === undefined) {
    throw new Error("Usage: codemind explain <path> [--root <path>] [--graph <file>]");
  }

  return {
    filePath,
    ...(rootPath === undefined ? {} : { rootPath }),
    ...(graphPath === undefined ? {} : { graphPath }),
  };
}

function parseMapArgs(args: readonly string[]): MapArgs {
  let rootPath: string | undefined;
  let graphPath: string | undefined;
  let outputPath: string | undefined;
  let format: "markdown" = "markdown";

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--root") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--graph") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --graph");
      }
      graphPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--out") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --out");
      }
      outputPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--format") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --format");
      }
      if (nextArg !== "markdown") {
        throw new Error(`Unsupported map format: ${nextArg}`);
      }
      format = "markdown";
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for map: ${arg}`);
    }

    throw new Error(`Unexpected argument for map: ${arg}`);
  }

  return {
    format,
    ...(rootPath === undefined ? {} : { rootPath }),
    ...(graphPath === undefined ? {} : { graphPath }),
    ...(outputPath === undefined ? {} : { outputPath }),
  };
}

function parseMcpArgs(args: readonly string[]): McpArgs {
  const [subcommand, ...remainingArgs] = args;

  if (subcommand === undefined || subcommand === "--help" || subcommand === "-h") {
    throw new Error("Usage: codemind mcp start [--root <path>]");
  }

  if (subcommand !== "start") {
    throw new Error(`Unknown mcp subcommand: ${subcommand}\nUsage: codemind mcp start [--root <path>]`);
  }

  let rootPath: string | undefined;

  for (let index = 0; index < remainingArgs.length; index += 1) {
    const arg = remainingArgs[index];

    if (arg === "--root") {
      const nextArg = remainingArgs[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootPath = nextArg;
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for mcp start: ${arg}`);
    }

    throw new Error(`Unexpected argument for mcp start: ${arg}`);
  }

  return rootPath === undefined ? {} : { rootPath };
}

function parseHealthArgs(args: readonly string[]): GraphPathArgs {
  return parseGraphPathArgs(args, "health");
}

function parseDoctorArgs(args: readonly string[]): GraphPathArgs {
  return parseGraphPathArgs(args, "doctor");
}

function parseGraphPathArgs(args: readonly string[], commandName: string): GraphPathArgs {
  let rootPath: string | undefined;
  let graphPath: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--root") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootPath = nextArg;
      index += 1;
      continue;
    }

    if (arg === "--graph") {
      const nextArg = args[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --graph");
      }
      graphPath = nextArg;
      index += 1;
      continue;
    }

    if (arg?.startsWith("-")) {
      throw new Error(`Unknown option for ${commandName}: ${arg}`);
    }

    throw new Error(`Unexpected argument for ${commandName}: ${arg}`);
  }

  return {
    ...(rootPath === undefined ? {} : { rootPath }),
    ...(graphPath === undefined ? {} : { graphPath }),
  };
}

async function runIndexCommand(args: IndexArgs, options: ResolvedCliOptions): Promise<void> {
  const rootDir = path.resolve(options.cwd, args.targetPath);
  const extraction = await extractTypeScriptGraph({ rootDir });
  const graphFile = await createGraphIndexFile(extraction);
  const outputPath = args.outputPath === undefined
    ? path.join(rootDir, ".codemind", "graph.json")
    : path.resolve(options.cwd, args.outputPath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(graphFile, null, 2)}\n`, "utf8");

  options.stdout.write(`Indexed ${extraction.sourceFiles.length} TypeScript source file(s).\n`);
  options.stdout.write(`Wrote ${path.relative(options.cwd, outputPath).replaceAll("\\", "/")}\n`);

  if (extraction.diagnostics.length > 0) {
    options.stderr.write(`Indexed with ${extraction.diagnostics.length} TypeScript diagnostic(s).\n`);
    for (const diagnostic of extraction.diagnostics) {
      options.stderr.write(`- ${diagnostic}\n`);
    }
  }
}

async function runFindCommand(args: FindArgs, options: ResolvedCliOptions): Promise<boolean> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const freshness = await evaluateGraphFreshness(indexFile);
  writeFreshnessWarning(freshness, options.stdout);
  const matches = findSymbols(indexFile.graph, args.symbol);

  if (matches.length === 0) {
    options.stdout.write(`No symbols found for "${args.symbol}".\n`);
    options.stdout.write(`Searched ${path.relative(options.cwd, graphPath).replaceAll("\\", "/")}\n`);
    return false;
  }

  options.stdout.write(`Found ${matches.length} symbol(s) for "${args.symbol}".\n`);

  for (const match of matches) {
    const location = formatNodeLocation(match);
    options.stdout.write(`- ${match.kind} ${match.name}`);
    if (location.length > 0) {
      options.stdout.write(` (${location})`);
    }
    options.stdout.write(`\n  id: ${match.id}\n`);
  }

  return true;
}

async function runTraceCommand(args: TraceArgs, options: ResolvedCliOptions): Promise<boolean> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const freshness = await evaluateGraphFreshness(indexFile);
  const traces = traceSymbols(indexFile.graph, args.symbol);
  const markdown = renderMarkdownSymbolTrace(indexFile.graph, args.symbol, freshness);

  options.stdout.write(markdown);
  return traces.length > 0;
}

async function runExplainCommand(args: ExplainArgs, options: ResolvedCliOptions): Promise<boolean> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const freshness = await evaluateGraphFreshness(indexFile);
  const explanation = explainFile(indexFile.graph, args.filePath);
  const markdown = renderMarkdownFileExplain(indexFile, args.filePath, freshness);

  options.stdout.write(markdown);
  return explanation !== undefined;
}

async function runMapCommand(args: MapArgs, options: ResolvedCliOptions): Promise<void> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const freshness = await evaluateGraphFreshness(indexFile);
  const markdown = renderMarkdownRepoMap(indexFile, freshness);
  const outputPath = resolveMapOutputPath(args, options.cwd, indexFile.rootDir);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, "utf8");

  writeFreshnessWarning(freshness, options.stdout);
  options.stdout.write(`Generated CODEMIND map for ${indexFile.sourceFiles.length} TypeScript source file(s).\n`);
  options.stdout.write(`Wrote ${path.relative(options.cwd, outputPath).replaceAll("\\", "/")}\n`);
}

async function runHealthCommand(args: GraphPathArgs, options: ResolvedCliOptions): Promise<boolean> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const freshness = await evaluateGraphFreshness(indexFile);

  options.stdout.write(renderMarkdownHealth(indexFile, graphPath, options.cwd, freshness));
  return freshness.status === "fresh";
}

async function runDoctorCommand(args: GraphPathArgs, options: ResolvedCliOptions): Promise<boolean> {
  const rootDir = args.rootPath === undefined ? options.cwd : path.resolve(options.cwd, args.rootPath);
  const graphPath = resolveGraphPath(args, options.cwd);
  const checks: DoctorCheck[] = [];

  checks.push({
    name: "Node.js runtime",
    status: nodeRuntimeStatus(process.version),
    detail: process.version,
  });
  checks.push({
    name: "Repository root",
    status: await pathExists(rootDir) ? "pass" : "fail",
    detail: formatOutputPath(rootDir),
  });
  checks.push({
    name: "TypeScript config",
    status: await pathExists(path.join(rootDir, "tsconfig.json")) ? "pass" : "warn",
    detail: await pathExists(path.join(rootDir, "tsconfig.json")) ? "tsconfig.json found" : "tsconfig.json not found",
  });

  const graphRead = await tryReadGraphIndexFile(graphPath);
  if (graphRead.ok) {
    const indexFile = graphRead.indexFile;
    const freshness = await evaluateGraphFreshness(indexFile);
    checks.push({
      name: "Graph index",
      status: "pass",
      detail: formatOutputPath(path.relative(options.cwd, graphPath)),
    });
    checks.push({
      name: "Graph freshness",
      status: freshness.status === "fresh" ? "pass" : "warn",
      detail: `${freshness.status}: ${freshness.reason}`,
    });
    checks.push({
      name: "Graph capabilities",
      status: hasRequiredCapabilities(indexFile) ? "pass" : "warn",
      detail: formatCapabilities(indexFile),
    });
  } else {
    checks.push({
      name: "Graph index",
      status: "warn",
      detail: graphRead.reason,
    });
  }

  checks.push({
    name: "Read-only MCP tools",
    status: "pass",
    detail: "find_symbol, get_repo_map, trace_symbol, explain_file",
  });

  options.stdout.write(renderMarkdownDoctor(rootDir, graphPath, checks));
  return checks.every((check) => check.status !== "fail");
}

async function runMcpCommand(args: McpArgs, options: ResolvedCliOptions): Promise<void> {
  const rootDir = args.rootPath === undefined ? options.cwd : path.resolve(options.cwd, args.rootPath);
  await options.startMcpServer({ rootDir });
}

async function defaultStartMcpServer(options: CodeMindMcpOptions): Promise<void> {
  const { startStdioServer } = await import("@codemind/mcp-server");
  await startStdioServer(options);
}

function resolveGraphPath(args: GraphPathArgs, cwd: string): string {
  if (args.graphPath !== undefined) {
    return path.resolve(cwd, args.graphPath);
  }

  const rootDir = args.rootPath === undefined ? cwd : path.resolve(cwd, args.rootPath);
  return path.join(rootDir, ".codemind", "graph.json");
}

function resolveMapOutputPath(args: MapArgs, cwd: string, indexedRootDir: string): string {
  if (args.outputPath !== undefined) {
    return path.resolve(cwd, args.outputPath);
  }

  if (args.rootPath !== undefined) {
    return path.join(path.resolve(cwd, args.rootPath), "CODEMIND.md");
  }

  return path.join(path.resolve(indexedRootDir), "CODEMIND.md");
}

async function readGraphIndexFile(graphPath: string): Promise<GraphIndexFile> {
  const raw = await readFile(graphPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!isGraphIndexFile(parsed)) {
    throw new Error(`Invalid graph index file: ${graphPath}`);
  }

  return parsed;
}

async function tryReadGraphIndexFile(graphPath: string): Promise<
  | { readonly ok: true; readonly indexFile: GraphIndexFile }
  | { readonly ok: false; readonly reason: string }
> {
  try {
    return {
      ok: true,
      indexFile: await readGraphIndexFile(graphPath),
    };
  } catch (error: unknown) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}

async function createGraphIndexFile(extraction: TypeScriptExtractionResult): Promise<GraphIndexFile> {
  const freshness = await createGraphFreshnessMetadata(
    extraction.rootDir,
    extraction.sourceFiles,
  );

  return {
    schemaVersion: GRAPH_INDEX_SCHEMA_VERSION,
    rootDir: extraction.rootDir,
    sourceFiles: extraction.sourceFiles,
    diagnostics: extraction.diagnostics,
    metadata: {
      indexer: CODEMIND_CLI_INDEXER_NAME,
      indexerVersion: CODEMIND_CLI_INDEXER_VERSION,
      adapter: TYPESCRIPT_ADAPTER_NAME,
      adapterVersion: TYPESCRIPT_ADAPTER_VERSION,
      language: TYPESCRIPT_ADAPTER_LANGUAGE,
      capabilities: TYPESCRIPT_ADAPTER_CAPABILITIES,
    },
    freshness,
    graph: extraction.graph,
  };
}

interface DoctorCheck {
  readonly name: string;
  readonly status: "pass" | "warn" | "fail";
  readonly detail: string;
}

function renderMarkdownHealth(
  indexFile: GraphIndexFile,
  graphPath: string,
  cwd: string,
  freshness: Awaited<ReturnType<typeof evaluateGraphFreshness>>,
): string {
  const metadata = indexFile.metadata;
  const lines = [
    "# Health",
    "",
    `- Graph: \`${formatOutputPath(path.relative(cwd, graphPath))}\``,
    `- Status: \`${freshness.status}\``,
    `- Reason: ${freshness.reason}`,
    "",
    "## Index",
    "",
    `- Schema version: \`${indexFile.schemaVersion}\``,
    `- Root: \`${indexFile.rootDir}\``,
    `- Source files: ${indexFile.sourceFiles.length}`,
    `- Nodes: ${indexFile.graph.nodes.length}`,
    `- Edges: ${indexFile.graph.edges.length}`,
    `- Indexer: \`${metadata === undefined ? "unknown" : `${metadata.indexer}@${metadata.indexerVersion}`}\``,
    `- Adapter: \`${metadata === undefined ? "unknown" : `${metadata.adapter}@${metadata.adapterVersion}`}\``,
    `- Language: \`${metadata?.language ?? "unknown"}\``,
    `- Capabilities: \`${metadata === undefined ? "unknown" : metadata.capabilities.join(", ")}\``,
    "",
    ...renderMarkdownFreshnessSection(freshness),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function renderMarkdownDoctor(rootDir: string, graphPath: string, checks: readonly DoctorCheck[]): string {
  const lines = [
    "# Doctor",
    "",
    `- Root: \`${formatOutputPath(rootDir)}\``,
    `- Graph: \`${formatOutputPath(graphPath)}\``,
    "",
    "## Checks",
    "",
    "| Check | Status | Detail |",
    "| --- | --- | --- |",
    ...checks.map((check) => `| ${cell(check.name)} | ${check.status} | ${cell(check.detail)} |`),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function hasRequiredCapabilities(indexFile: GraphIndexFile): boolean {
  const capabilities = indexFile.metadata?.capabilities ?? [];
  const requiredCapabilities = ["symbols", "imports", "exports", "calls"] as const;
  return requiredCapabilities.every((capability) => capabilities.includes(capability));
}

function formatCapabilities(indexFile: GraphIndexFile): string {
  const capabilities = indexFile.metadata?.capabilities;
  return capabilities === undefined ? "missing graph index metadata" : capabilities.join(", ");
}

function nodeRuntimeStatus(version: string): DoctorCheck["status"] {
  const major = Number(version.replace(/^v/, "").split(".")[0]);
  return Number.isFinite(major) && major >= 22 ? "pass" : "warn";
}

function writeFreshnessWarning(
  freshness: Awaited<ReturnType<typeof evaluateGraphFreshness>>,
  stdout: WritableLike,
): void {
  const warning = renderFreshnessWarning(freshness);
  if (warning !== undefined) {
    stdout.write(`${warning}\n`);
  }
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function formatOutputPath(value: string): string {
  return value.replaceAll("\\", "/");
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function isDirectCliExecution(): boolean {
  const entryPath = process.argv[1];
  return entryPath !== undefined && pathToFileURL(path.resolve(entryPath)).href === import.meta.url;
}

if (isDirectCliExecution()) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  }, (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
