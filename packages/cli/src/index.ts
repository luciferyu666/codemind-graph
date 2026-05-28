#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { extractTypeScriptGraph, type TypeScriptExtractionResult } from "@codemind/adapter-typescript";
import {
  findSymbols,
  getNodeById,
  listExports,
  listFiles,
  listImports,
  listSymbols,
  type CodeGraph,
  type GraphEdge,
  type GraphNode,
} from "@codemind/core";

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

interface MapArgs {
  readonly rootPath?: string;
  readonly graphPath?: string;
  readonly outputPath?: string;
  readonly format: "markdown";
}

interface GraphPathArgs {
  readonly rootPath?: string;
  readonly graphPath?: string;
}

const HELP_TEXT = `CodeMind Graph CLI

Usage:
  codemind index <path> [--out <file>]
  codemind find <symbol> [--root <path>] [--graph <file>]
  codemind map [--root <path>] [--graph <file>] [--format markdown] [--out <file>]

Commands:
  index   Build a TypeScript graph and write .codemind/graph.json
  find    Find symbols in .codemind/graph.json
  map     Generate CODEMIND.md from .codemind/graph.json
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

    if (command === "map") {
      const mapArgs = parseMapArgs(args);
      await runMapCommand(mapArgs, { cwd, stdout, stderr });
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
      options.stdout.write(` ${location}`);
    }
    options.stdout.write(`\n  id: ${match.id}\n`);
  }

  return true;
}

async function runMapCommand(args: MapArgs, options: Required<CliOptions>): Promise<void> {
  const graphPath = resolveGraphPath(args, options.cwd);
  const indexFile = await readGraphIndexFile(graphPath);
  const markdown = renderMarkdownRepoMap(indexFile);
  const outputPath = resolveMapOutputPath(args, options.cwd, indexFile.rootDir);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, "utf8");

  options.stdout.write(`Generated CODEMIND map for ${indexFile.sourceFiles.length} TypeScript source file(s).\n`);
  options.stdout.write(`Wrote ${path.relative(options.cwd, outputPath).replaceAll("\\", "/")}\n`);
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

function renderMarkdownRepoMap(indexFile: GraphIndexFile): string {
  const graph = indexFile.graph;
  const lines: string[] = [
    "# CODEMIND",
    "",
    "Generated by CodeMind Graph.",
    "",
    "## Overview",
    "",
    `- Schema version: \`${indexFile.schemaVersion}\``,
    `- Root: \`${indexFile.rootDir}\``,
    `- Source files: ${indexFile.sourceFiles.length}`,
    `- Nodes: ${graph.nodes.length}`,
    `- Edges: ${graph.edges.length}`,
    `- Diagnostics: ${indexFile.diagnostics.length}`,
    "",
    "## Files",
    "",
    ...renderFilesTable(graph),
    "",
    "## Symbols",
    "",
    ...renderSymbolsTable(graph),
    "",
    "## Imports",
    "",
    ...renderEdgeTable(graph, listImports(graph), "Import"),
    "",
    "## Exports",
    "",
    ...renderEdgeTable(graph, listExports(graph), "Export"),
    "",
    "## Diagnostics",
    "",
    ...renderDiagnostics(indexFile.diagnostics),
    "",
  ];

  return `${lines.join("\n")}\n`;
}

function renderFilesTable(graph: CodeGraph): readonly string[] {
  const files = listFiles(graph);
  if (files.length === 0) {
    return ["No files indexed."];
  }

  const rows = files.map((fileNode) => {
    const symbols = listSymbols(graph).filter((node) => node.filePath === fileNode.filePath).length;
    const imports = listImports(graph).filter((edge) => edge.fromId === fileNode.id).length;
    const exports = listExports(graph).filter((edge) => edge.fromId === fileNode.id).length;
    return `| ${cell(fileNode.filePath ?? fileNode.name)} | ${symbols} | ${imports} | ${exports} |`;
  });

  return [
    "| File | Symbols | Imports | Exports |",
    "| --- | ---: | ---: | ---: |",
    ...rows,
  ];
}

function renderSymbolsTable(graph: CodeGraph): readonly string[] {
  const symbols = listSymbols(graph);
  if (symbols.length === 0) {
    return ["No symbols indexed."];
  }

  return [
    "| Kind | Name | Location | Exported |",
    "| --- | --- | --- | --- |",
    ...symbols.map((node) => {
      const exported = node.metadata?.exported === true ? "yes" : "no";
      return `| ${cell(node.kind)} | ${cell(node.name)} | ${cell(formatPlainNodeLocation(node))} | ${exported} |`;
    }),
  ];
}

function renderEdgeTable(graph: CodeGraph, edges: readonly GraphEdge[], label: string): readonly string[] {
  if (edges.length === 0) {
    return [`No ${label.toLocaleLowerCase()} edges indexed.`];
  }

  return [
    `| ${label} From | Target | Detail |`,
    "| --- | --- | --- |",
    ...edges.map((edge) => {
      const fromNode = getNodeById(graph, edge.fromId);
      const toNode = getNodeById(graph, edge.toId);
      const detail = edge.metadata?.specifier ?? edge.metadata?.exportKind ?? "";
      return `| ${cell(formatEdgeNode(fromNode))} | ${cell(formatEdgeNode(toNode))} | ${cell(String(detail))} |`;
    }),
  ];
}

function renderDiagnostics(diagnostics: readonly string[]): readonly string[] {
  if (diagnostics.length === 0) {
    return ["No diagnostics."];
  }

  return diagnostics.map((diagnostic) => `- ${diagnostic}`);
}

function formatPlainNodeLocation(node: GraphNode): string {
  const filePath = node.filePath ?? node.location?.filePath;
  if (filePath === undefined) {
    return "";
  }

  const position = node.location?.range.start;
  if (position === undefined) {
    return filePath;
  }

  return `${filePath}:${position.line}:${position.column}`;
}

function formatEdgeNode(node: GraphNode | undefined): string {
  if (node === undefined) {
    return "unknown";
  }

  if (node.kind === "file") {
    return node.filePath ?? node.name;
  }

  return `${node.kind}:${node.name}`;
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
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
