#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractTypeScriptGraph, type TypeScriptExtractionResult } from "@codemind/adapter-typescript";
import {
  findSymbols,
  formatNodeLocation,
  isGraphIndexFile,
  renderMarkdownRepoMap,
  renderMarkdownSymbolTrace,
  traceSymbols,
  type GraphIndexFile,
  type GraphNode,
} from "@codemind/core";
import type { CodeMindMcpOptions } from "@codemind/mcp-server";

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
  codemind map [--root <path>] [--graph <file>] [--format markdown] [--out <file>]
  codemind mcp start [--root <path>]

Commands:
  index   Build a TypeScript graph and write .codemind/graph.json
  find    Find symbols in .codemind/graph.json
  trace   Trace a symbol to its file imports, exports, and related modules
  map     Generate CODEMIND.md from .codemind/graph.json
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

    if (command === "map") {
      const mapArgs = parseMapArgs(args);
      await runMapCommand(mapArgs, resolvedOptions);
      return 0;
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

async function runIndexCommand(args: IndexArgs, options: ResolvedCliOptions): Promise<void> {
  const rootDir = path.resolve(options.cwd, args.targetPath);
  const extraction = await extractTypeScriptGraph({ rootDir });
  const graphFile = createGraphIndexFile(extraction);
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
  const traces = traceSymbols(indexFile.graph, args.symbol);
  const markdown = renderMarkdownSymbolTrace(indexFile.graph, args.symbol);

  options.stdout.write(markdown);
  return traces.length > 0;
}

async function runMapCommand(args: MapArgs, options: ResolvedCliOptions): Promise<void> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const markdown = renderMarkdownRepoMap(indexFile);
  const outputPath = resolveMapOutputPath(args, options.cwd, indexFile.rootDir);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, "utf8");

  options.stdout.write(`Generated CODEMIND map for ${indexFile.sourceFiles.length} TypeScript source file(s).\n`);
  options.stdout.write(`Wrote ${path.relative(options.cwd, outputPath).replaceAll("\\", "/")}\n`);
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

function createGraphIndexFile(extraction: TypeScriptExtractionResult): GraphIndexFile {
  return {
    schemaVersion: "0.1.0",
    rootDir: extraction.rootDir,
    sourceFiles: extraction.sourceFiles,
    diagnostics: extraction.diagnostics,
    graph: extraction.graph,
  };
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
