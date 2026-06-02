#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  createContextPack,
  evaluateGraphFreshness,
  findSymbols,
  formatNodeLocation,
  isGraphIndexFile,
  renderMarkdownContextPack,
  renderMarkdownFreshnessSection,
  renderMarkdownFileExplain,
  renderMarkdownRepoMap,
  renderMarkdownSymbolTrace,
  type GraphIndexFile,
  type GraphNode,
} from "@codemind/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod/v4";

export interface CodeMindMcpOptions {
  readonly rootDir?: string | undefined;
}

export interface FindSymbolInput {
  readonly query: string;
  readonly root?: string | undefined;
  readonly graph?: string | undefined;
}

export interface GetRepoMapInput {
  readonly root?: string | undefined;
  readonly graph?: string | undefined;
}

export interface TraceSymbolInput {
  readonly query: string;
  readonly root?: string | undefined;
  readonly graph?: string | undefined;
}

export interface ExplainFileInput {
  readonly path: string;
  readonly root?: string | undefined;
  readonly graph?: string | undefined;
}

export interface GetContextPackInput {
  readonly target: string;
  readonly root?: string | undefined;
  readonly graph?: string | undefined;
  readonly limit?: number | undefined;
  readonly repoMapLines?: number | undefined;
}

interface GraphReadOptions {
  readonly baseRootDir: string;
  readonly root?: string | undefined;
  readonly graph?: string | undefined;
}

const findSymbolInputSchema = {
  query: z.string().min(1),
  root: z.string().min(1).optional(),
  graph: z.string().min(1).optional(),
};

const getRepoMapInputSchema = {
  root: z.string().min(1).optional(),
  graph: z.string().min(1).optional(),
};

const traceSymbolInputSchema = {
  query: z.string().min(1),
  root: z.string().min(1).optional(),
  graph: z.string().min(1).optional(),
};

const explainFileInputSchema = {
  path: z.string().min(1),
  root: z.string().min(1).optional(),
  graph: z.string().min(1).optional(),
};

const getContextPackInputSchema = {
  target: z.string().min(1),
  root: z.string().min(1).optional(),
  graph: z.string().min(1).optional(),
  limit: z.number().int().positive().optional(),
  repoMapLines: z.number().int().positive().optional(),
};

const findSymbolInputParser = z.object(findSymbolInputSchema);
const getRepoMapInputParser = z.object(getRepoMapInputSchema);
const traceSymbolInputParser = z.object(traceSymbolInputSchema);
const explainFileInputParser = z.object(explainFileInputSchema);
const getContextPackInputParser = z.object(getContextPackInputSchema);

export function createCodeMindMcpServer(options: CodeMindMcpOptions = {}): McpServer {
  const baseRootDir = path.resolve(options.rootDir ?? process.cwd());
  const server = new McpServer({
    name: "codemind-graph",
    version: "0.1.2",
  });

  server.registerTool(
    "find_symbol",
    {
      title: "Find symbol",
      description: "Find symbols from a CodeMind .codemind/graph.json index. Read-only.",
      inputSchema: findSymbolInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => findSymbol(input, { rootDir: baseRootDir }),
  );

  server.registerTool(
    "get_repo_map",
    {
      title: "Get repo map",
      description: "Return the deterministic Markdown repo map from a CodeMind graph index. Read-only.",
      inputSchema: getRepoMapInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => getRepoMap(input, { rootDir: baseRootDir }),
  );

  server.registerTool(
    "trace_symbol",
    {
      title: "Trace symbol",
      description: "Trace a symbol to its file imports, exports, calls, and related modules from a CodeMind graph index. Read-only.",
      inputSchema: traceSymbolInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => traceSymbol(input, { rootDir: baseRootDir }),
  );

  server.registerTool(
    "explain_file",
    {
      title: "Explain file",
      description: "Explain an indexed file with symbols, imports, exports, calls, references, related modules, diagnostics, and freshness status. Read-only.",
      inputSchema: explainFileInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => explainFile(input, { rootDir: baseRootDir }),
  );

  server.registerTool(
    "get_context_pack",
    {
      title: "Get context pack",
      description: "Return a deterministic bounded Markdown context packet for a symbol or indexed file. Read-only.",
      inputSchema: getContextPackInputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (input) => getContextPack(input, { rootDir: baseRootDir }),
  );

  return server;
}

export async function startStdioServer(options: CodeMindMcpOptions = {}): Promise<void> {
  const server = createCodeMindMcpServer(options);
  await server.connect(new StdioServerTransport());
}

export async function findSymbol(input: FindSymbolInput, options: CodeMindMcpOptions = {}): Promise<CallToolResult> {
  const parsedInput = findSymbolInputParser.parse(input);
  const { graphPath, indexFile } = await readGraphIndex({
    baseRootDir: path.resolve(options.rootDir ?? process.cwd()),
    root: parsedInput.root,
    graph: parsedInput.graph,
  });
  const freshness = await evaluateGraphFreshness(indexFile);
  const matches = findSymbols(indexFile.graph, parsedInput.query);

  if (matches.length === 0) {
    return textResult([
      "# find_symbol",
      "",
      `No symbols found for \`${escapeMarkdown(parsedInput.query)}\`.`,
      "",
      `Graph: \`${formatOutputPath(graphPath)}\``,
      "",
      ...renderMarkdownFreshnessSection(freshness),
      "",
    ].join("\n"));
  }

  return textResult([
    "# find_symbol",
    "",
    `Query: \`${escapeMarkdown(parsedInput.query)}\``,
    `Graph: \`${formatOutputPath(graphPath)}\``,
    `Matches: ${matches.length}`,
    "",
    ...renderMarkdownFreshnessSection(freshness),
    "",
    "| Kind | Name | Location | Exported | Id |",
    "| --- | --- | --- | --- | --- |",
    ...matches.map(formatSymbolRow),
    "",
  ].join("\n"));
}

export async function getRepoMap(input: GetRepoMapInput = {}, options: CodeMindMcpOptions = {}): Promise<CallToolResult> {
  const parsedInput = getRepoMapInputParser.parse(input);
  const { indexFile } = await readGraphIndex({
    baseRootDir: path.resolve(options.rootDir ?? process.cwd()),
    root: parsedInput.root,
    graph: parsedInput.graph,
  });
  const freshness = await evaluateGraphFreshness(indexFile);

  return textResult(renderMarkdownRepoMap(indexFile, freshness));
}

export async function traceSymbol(input: TraceSymbolInput, options: CodeMindMcpOptions = {}): Promise<CallToolResult> {
  const parsedInput = traceSymbolInputParser.parse(input);
  const { indexFile } = await readGraphIndex({
    baseRootDir: path.resolve(options.rootDir ?? process.cwd()),
    root: parsedInput.root,
    graph: parsedInput.graph,
  });
  const freshness = await evaluateGraphFreshness(indexFile);

  return textResult(renderMarkdownSymbolTrace(indexFile.graph, parsedInput.query, freshness));
}

export async function explainFile(input: ExplainFileInput, options: CodeMindMcpOptions = {}): Promise<CallToolResult> {
  const parsedInput = explainFileInputParser.parse(input);
  const { indexFile } = await readGraphIndex({
    baseRootDir: path.resolve(options.rootDir ?? process.cwd()),
    root: parsedInput.root,
    graph: parsedInput.graph,
  });
  const freshness = await evaluateGraphFreshness(indexFile);

  return textResult(renderMarkdownFileExplain(indexFile, parsedInput.path, freshness));
}

export async function getContextPack(
  input: GetContextPackInput,
  options: CodeMindMcpOptions = {},
): Promise<CallToolResult> {
  const parsedInput = getContextPackInputParser.parse(input);
  const { indexFile } = await readGraphIndex({
    baseRootDir: path.resolve(options.rootDir ?? process.cwd()),
    root: parsedInput.root,
    graph: parsedInput.graph,
  });
  const freshness = await evaluateGraphFreshness(indexFile);
  const contextPack = createContextPack(indexFile, parsedInput.target, {
    ...(parsedInput.limit === undefined ? {} : { limit: parsedInput.limit }),
    ...(parsedInput.repoMapLines === undefined ? {} : { repoMapLineLimit: parsedInput.repoMapLines }),
  });

  return textResult(renderMarkdownContextPack(indexFile, contextPack, freshness));
}

async function readGraphIndex(options: GraphReadOptions): Promise<{
  readonly graphPath: string;
  readonly indexFile: GraphIndexFile;
}> {
  const rootDir = resolveRootDir(options.baseRootDir, options.root);
  const graphPath = resolveGraphPath(rootDir, options.graph);
  const raw = await readFile(graphPath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!isGraphIndexFile(parsed)) {
    throw new Error(`Invalid graph index file: ${graphPath}`);
  }

  return {
    graphPath,
    indexFile: parsed,
  };
}

function resolveRootDir(baseRootDir: string, inputRoot: string | undefined): string {
  const rootDir = inputRoot === undefined ? baseRootDir : path.resolve(baseRootDir, inputRoot);
  assertPathInside(baseRootDir, rootDir, "root");
  return rootDir;
}

function resolveGraphPath(rootDir: string, inputGraph: string | undefined): string {
  const graphPath = inputGraph === undefined
    ? path.join(rootDir, ".codemind", "graph.json")
    : path.resolve(rootDir, inputGraph);
  assertPathInside(rootDir, graphPath, "graph");
  return graphPath;
}

function assertPathInside(rootDir: string, targetPath: string, label: string): void {
  const relativePath = path.relative(rootDir, targetPath);
  if (relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath))) {
    return;
  }

  throw new Error(`MCP ${label} path must stay inside ${rootDir}`);
}

function textResult(text: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text,
      },
    ],
  };
}

function formatSymbolRow(node: GraphNode): string {
  const exported = node.metadata?.exported === true ? "yes" : "no";
  return [
    cell(node.kind),
    cell(node.name),
    cell(formatNodeLocation(node)),
    exported,
    cell(node.id),
  ].join(" | ").replace(/^/, "| ").replace(/$/, " |");
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function escapeMarkdown(value: string): string {
  return value.replaceAll("`", "\\`");
}

function formatOutputPath(value: string): string {
  return value.replaceAll("\\", "/");
}

function parseDirectArgs(argv: readonly string[]): CodeMindMcpOptions {
  let rootDir: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const nextArg = argv[index + 1];
      if (nextArg === undefined || nextArg.startsWith("-")) {
        throw new Error("Missing value for --root");
      }
      rootDir = nextArg;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option for MCP server: ${arg}`);
  }

  return rootDir === undefined ? {} : { rootDir };
}

function isDirectExecution(): boolean {
  const entryPath = process.argv[1];
  return entryPath !== undefined && pathToFileURL(path.resolve(entryPath)).href === import.meta.url;
}

if (isDirectExecution()) {
  startStdioServer(parseDirectArgs(process.argv.slice(2))).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
