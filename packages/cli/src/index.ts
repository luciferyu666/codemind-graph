#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractTypeScriptGraph, type TypeScriptExtractionResult } from "@codemind/adapter-typescript";
import type { GraphNode } from "@codemind/core";

export interface CliOptions {
  readonly cwd?: string;
  readonly stdout?: WritableLike;
  readonly stderr?: WritableLike;
}

export interface GraphIndexFile {
  readonly schemaVersion: "0.1.0";
  readonly rootDir: string;
  readonly sourceFiles: readonly string[];
  readonly diagnostics: readonly string[];
  readonly graph: TypeScriptExtractionResult["graph"];
}

interface WritableLike {
  write(chunk: string): unknown;
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

const HELP_TEXT = `CodeMind Graph CLI

Usage:
  codemind index <path> [--out <file>]
  codemind find <symbol> [--root <path>] [--graph <file>]

Commands:
  index   Build a TypeScript graph and write .codemind/graph.json
  find    Find symbols in .codemind/graph.json
`;

export async function runCli(argv = process.argv.slice(2), options: CliOptions = {}): Promise<number> {
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const [command, ...args] = argv;

  try {
    if (command === undefined || command === "--help" || command === "-h") {
      stdout.write(HELP_TEXT);
      return 0;
    }

    if (command === "index") {
      const indexArgs = parseIndexArgs(args);
      await runIndexCommand(indexArgs, { cwd, stdout, stderr });
      return 0;
    }

    if (command === "find") {
      const findArgs = parseFindArgs(args);
      const found = await runFindCommand(findArgs, { cwd, stdout, stderr });
      return found ? 0 : 2;
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

async function runIndexCommand(args: IndexArgs, options: Required<CliOptions>): Promise<void> {
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

async function runFindCommand(args: FindArgs, options: Required<CliOptions>): Promise<boolean> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const matches = findSymbolMatches(indexFile.graph.nodes, args.symbol);

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
      options.stdout.write(` ${location}`);
    }
    options.stdout.write(`\n  id: ${match.id}\n`);
  }

  return true;
}

function resolveGraphPath(args: FindArgs, cwd: string): string {
  if (args.graphPath !== undefined) {
    return path.resolve(cwd, args.graphPath);
  }

  const rootDir = args.rootPath === undefined ? cwd : path.resolve(cwd, args.rootPath);
  return path.join(rootDir, ".codemind", "graph.json");
}

async function readGraphIndexFile(graphPath: string): Promise<GraphIndexFile> {
  const raw = await readFile(graphPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!isGraphIndexFile(parsed)) {
    throw new Error(`Invalid graph index file: ${graphPath}`);
  }

  return parsed;
}

function isGraphIndexFile(value: unknown): value is GraphIndexFile {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<GraphIndexFile>;
  return candidate.schemaVersion === "0.1.0"
    && Array.isArray(candidate.sourceFiles)
    && Array.isArray(candidate.diagnostics)
    && typeof candidate.graph === "object"
    && candidate.graph !== null
    && Array.isArray(candidate.graph.nodes)
    && Array.isArray(candidate.graph.edges);
}

function findSymbolMatches(nodes: readonly GraphNode[], symbol: string): readonly GraphNode[] {
  const normalizedSymbol = symbol.toLocaleLowerCase();
  return nodes
    .filter((node) => isSearchableSymbolNode(node) && node.name.toLocaleLowerCase().includes(normalizedSymbol))
    .sort(compareNodeMatches);
}

function isSearchableSymbolNode(node: GraphNode): boolean {
  return node.kind !== "repository" && node.kind !== "file" && node.kind !== "module";
}

function compareNodeMatches(left: GraphNode, right: GraphNode): number {
  const leftLocation = left.location;
  const rightLocation = right.location;
  const leftFilePath = left.filePath ?? leftLocation?.filePath ?? "";
  const rightFilePath = right.filePath ?? rightLocation?.filePath ?? "";
  const fileCompare = leftFilePath.localeCompare(rightFilePath);

  if (fileCompare !== 0) {
    return fileCompare;
  }

  const leftLine = leftLocation?.range.start.line ?? 0;
  const rightLine = rightLocation?.range.start.line ?? 0;
  if (leftLine !== rightLine) {
    return leftLine - rightLine;
  }

  return left.name.localeCompare(right.name);
}

function formatNodeLocation(node: GraphNode): string {
  const filePath = node.filePath ?? node.location?.filePath;
  if (filePath === undefined) {
    return "";
  }

  const position = node.location?.range.start;
  if (position === undefined) {
    return `(${filePath})`;
  }

  return `(${filePath}:${position.line}:${position.column})`;
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
