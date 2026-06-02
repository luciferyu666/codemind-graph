import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const GRAPH_NODE_KINDS = [
  "repository",
  "file",
  "module",
  "function",
  "class",
  "interface",
  "type",
  "enum",
  "variable",
  "method",
  "property",
] as const;

export const GRAPH_EDGE_KINDS = [
  "CONTAINS",
  "DEFINES",
  "IMPORTS",
  "EXPORTS",
  "REFERENCES",
  "CALLS",
] as const;

export const SYMBOL_NODE_KINDS = [
  "function",
  "class",
  "interface",
  "type",
  "enum",
  "variable",
  "method",
  "property",
] as const;

export type GraphNodeKind = (typeof GRAPH_NODE_KINDS)[number];
export type GraphEdgeKind = (typeof GRAPH_EDGE_KINDS)[number];
export type SymbolNodeKind = (typeof SYMBOL_NODE_KINDS)[number];
export type GraphNodeId = string;
export type GraphEdgeId = string;

export type GraphScalar = string | number | boolean | null;
export type GraphMetadataValue = GraphScalar | readonly GraphScalar[];
export type GraphMetadata = Readonly<Record<string, GraphMetadataValue>>;

export const GRAPH_INDEX_SCHEMA_VERSION = "0.1.0" as const;

export const GRAPH_INDEX_CAPABILITIES = [
  "symbols",
  "imports",
  "exports",
  "calls",
  "references",
] as const;

export type GraphIndexSchemaVersion = typeof GRAPH_INDEX_SCHEMA_VERSION;
export type GraphIndexCapability = (typeof GRAPH_INDEX_CAPABILITIES)[number];

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

export interface SourceLocation {
  readonly filePath: string;
  readonly range: SourceRange;
}

export interface GraphNode {
  readonly id: GraphNodeId;
  readonly kind: GraphNodeKind;
  readonly name: string;
  readonly source: "project" | "external";
  readonly filePath?: string;
  readonly location?: SourceLocation;
  readonly metadata?: GraphMetadata;
}

export interface GraphEdge {
  readonly id: GraphEdgeId;
  readonly kind: GraphEdgeKind;
  readonly fromId: GraphNodeId;
  readonly toId: GraphNodeId;
  readonly location?: SourceLocation;
  readonly metadata?: GraphMetadata;
}

export interface CodeGraph {
  readonly rootPath: string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly metadata?: GraphMetadata;
}

export interface GraphIndexFile {
  readonly schemaVersion: GraphIndexSchemaVersion;
  readonly rootDir: string;
  readonly sourceFiles: readonly string[];
  readonly diagnostics: readonly string[];
  readonly metadata?: GraphIndexMetadata;
  readonly freshness?: GraphFreshnessMetadata;
  readonly graph: CodeGraph;
}

export interface GraphIndexMetadata {
  readonly indexer: string;
  readonly indexerVersion: string;
  readonly adapter: string;
  readonly adapterVersion: string;
  readonly language: string;
  readonly capabilities: readonly GraphIndexCapability[];
}

export interface GraphFreshnessMetadata {
  readonly indexedAt: string;
  readonly rootDir: string;
  readonly sourceFileCount: number;
  readonly sourceFingerprint: string;
}

export type GraphFreshnessStatus = "fresh" | "stale" | "unknown";

export interface GraphFreshnessReport {
  readonly status: GraphFreshnessStatus;
  readonly reason: string;
  readonly indexedAt?: string;
  readonly rootDir?: string;
  readonly indexedSourceFileCount?: number;
  readonly currentSourceFileCount?: number;
  readonly sourceFingerprint?: string;
  readonly currentSourceFingerprint?: string;
}

export interface SourceFingerprintFile {
  readonly filePath: string;
  readonly content: string;
}

export interface SymbolTrace {
  readonly symbol: GraphNode;
  readonly file: GraphNode | undefined;
  readonly imports: readonly GraphEdge[];
  readonly exports: readonly GraphEdge[];
  readonly callsOut: readonly GraphEdge[];
  readonly calledBy: readonly GraphEdge[];
  readonly referencesOut: readonly GraphEdge[];
  readonly referencedBy: readonly GraphEdge[];
  readonly relatedModules: readonly GraphNode[];
}

export interface FileExplanation {
  readonly file: GraphNode;
  readonly symbols: readonly GraphNode[];
  readonly imports: readonly GraphEdge[];
  readonly exports: readonly GraphEdge[];
  readonly callsOut: readonly GraphEdge[];
  readonly calledBy: readonly GraphEdge[];
  readonly referencesOut: readonly GraphEdge[];
  readonly referencedBy: readonly GraphEdge[];
  readonly relatedModules: readonly GraphNode[];
}

export type ContextPackTargetKind = "file" | "symbol" | "unknown";

export interface ContextPackOptions {
  readonly limit?: number;
  readonly repoMapLineLimit?: number;
}

export interface ContextPack {
  readonly target: string;
  readonly targetKind: ContextPackTargetKind;
  readonly limit: number;
  readonly repoMapLineLimit: number;
  readonly symbolTraces: readonly SymbolTrace[];
  readonly fileExplanations: readonly FileExplanation[];
}

export function normalizeGraphPath(value: string): string {
  return value.replaceAll("\\", "/").replace(/\/+/g, "/");
}

export function createNodeId(kind: GraphNodeKind, parts: readonly string[]): GraphNodeId {
  return [kind, ...parts.map(encodeIdPart)].join(":");
}

export function createEdgeId(
  kind: GraphEdgeKind,
  fromId: GraphNodeId,
  toId: GraphNodeId,
  discriminator = "",
): GraphEdgeId {
  const suffix = discriminator.length > 0 ? `:${encodeIdPart(discriminator)}` : "";
  return `${kind}:${encodeIdPart(fromId)}:${encodeIdPart(toId)}${suffix}`;
}

export function isGraphNodeKind(value: string): value is GraphNodeKind {
  return GRAPH_NODE_KINDS.includes(value as GraphNodeKind);
}

export function isGraphEdgeKind(value: string): value is GraphEdgeKind {
  return GRAPH_EDGE_KINDS.includes(value as GraphEdgeKind);
}

export function isSymbolNodeKind(value: string): value is SymbolNodeKind {
  return SYMBOL_NODE_KINDS.includes(value as SymbolNodeKind);
}

export function isSymbolNode(node: GraphNode): node is GraphNode & { readonly kind: SymbolNodeKind } {
  return isSymbolNodeKind(node.kind);
}

export class GraphBuilder {
  private readonly nodes = new Map<GraphNodeId, GraphNode>();
  private readonly edges = new Map<GraphEdgeId, GraphEdge>();

  public addNode(node: GraphNode): GraphNode {
    const existing = this.nodes.get(node.id);
    if (existing !== undefined) {
      return existing;
    }

    this.nodes.set(node.id, node);
    return node;
  }

  public addEdge(edge: GraphEdge): GraphEdge {
    const existing = this.edges.get(edge.id);
    if (existing !== undefined) {
      return existing;
    }

    this.edges.set(edge.id, edge);
    return edge;
  }

  public toGraph(rootPath: string, metadata?: GraphMetadata): CodeGraph {
    const graph: CodeGraph = {
      rootPath: normalizeGraphPath(rootPath),
      nodes: [...this.nodes.values()].sort(compareById),
      edges: [...this.edges.values()].sort(compareById),
      ...(metadata === undefined ? {} : { metadata }),
    };

    return graph;
  }
}

export function getNodeById(graph: CodeGraph, nodeId: GraphNodeId): GraphNode | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

export function listFiles(graph: CodeGraph): readonly GraphNode[] {
  return graph.nodes.filter((node) => node.kind === "file").sort(compareGraphNodes);
}

export function listModules(graph: CodeGraph): readonly GraphNode[] {
  return graph.nodes.filter((node) => node.kind === "module").sort(compareGraphNodes);
}

export function listSymbols(graph: CodeGraph): readonly GraphNode[] {
  return graph.nodes.filter(isSymbolNode).sort(compareGraphNodes);
}

export function findSymbols(graph: CodeGraph, query: string): readonly GraphNode[] {
  const normalizedQuery = query.toLocaleLowerCase();
  return listSymbols(graph)
    .filter((node) => node.name.toLocaleLowerCase().includes(normalizedQuery))
    .sort(compareGraphNodes);
}

export function traceSymbols(graph: CodeGraph, query: string): readonly SymbolTrace[] {
  return findSymbols(graph, query).map((symbol) => {
    const file = fileNodeForSymbol(graph, symbol);
    const imports = file === undefined ? [] : listImports(graph).filter((edge) => edge.fromId === file.id);
    const exports = file === undefined ? [] : listExports(graph).filter((edge) => edge.fromId === file.id);
    const callsOut = listCalls(graph).filter((edge) => edge.fromId === symbol.id);
    const calledBy = listCalls(graph).filter((edge) => edge.toId === symbol.id);
    const referencesOut = listReferences(graph).filter((edge) => edge.fromId === symbol.id);
    const referencedBy = listReferences(graph).filter((edge) => edge.toId === symbol.id);
    const relatedModules = uniqueSortedNodes([
      ...imports.map((edge) => getNodeById(graph, edge.toId)),
      ...exports.map((edge) => getNodeById(graph, edge.toId)).filter((node) => node?.kind === "module"),
    ]);

    return {
      symbol,
      file,
      imports,
      exports,
      callsOut,
      calledBy,
      referencesOut,
      referencedBy,
      relatedModules,
    };
  });
}

export function explainFile(
  graph: CodeGraph,
  filePath: string,
): FileExplanation | undefined {
  const normalizedFilePath = normalizeLookupFilePath(filePath);
  const file = listFiles(graph).find((node) =>
    normalizeLookupFilePath(node.filePath ?? node.name) === normalizedFilePath
  );

  if (file === undefined) {
    return undefined;
  }

  const fileNodePath = normalizeLookupFilePath(file.filePath ?? file.name);
  const symbols = listSymbols(graph).filter((node) =>
    normalizeLookupFilePath(node.filePath ?? node.location?.filePath ?? "") === fileNodePath
  );
  const imports = listImports(graph).filter((edge) => edge.fromId === file.id);
  const exports = listExports(graph).filter((edge) => edge.fromId === file.id);
  const symbolIds = new Set(symbols.map((node) => node.id));
  const fileAndSymbolIds = new Set([file.id, ...symbolIds]);
  const callsOut = listCalls(graph).filter((edge) => symbolIds.has(edge.fromId));
  const calledBy = listCalls(graph).filter((edge) => symbolIds.has(edge.toId) && !symbolIds.has(edge.fromId));
  const referencesOut = listReferences(graph).filter((edge) => fileAndSymbolIds.has(edge.fromId));
  const referencedBy = listReferences(graph).filter((edge) => symbolIds.has(edge.toId) && !fileAndSymbolIds.has(edge.fromId));
  const relatedModules = uniqueSortedNodes([
    ...imports.map((edge) => getNodeById(graph, edge.toId)),
    ...exports.map((edge) => getNodeById(graph, edge.toId)).filter((node) => node?.kind === "module"),
  ]);

  return {
    file,
    symbols,
    imports,
    exports,
    callsOut,
    calledBy,
    referencesOut,
    referencedBy,
    relatedModules,
  };
}

export function listImports(graph: CodeGraph): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.kind === "IMPORTS").sort(compareGraphEdges);
}

export function listExports(graph: CodeGraph): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.kind === "EXPORTS").sort(compareGraphEdges);
}

export function listCalls(graph: CodeGraph): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.kind === "CALLS").sort(compareGraphEdges);
}

export function listReferences(graph: CodeGraph): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.kind === "REFERENCES").sort(compareGraphEdges);
}

export function getOutgoingEdges(graph: CodeGraph, nodeId: GraphNodeId): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.fromId === nodeId).sort(compareGraphEdges);
}

export function getIncomingEdges(graph: CodeGraph, nodeId: GraphNodeId): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.toId === nodeId).sort(compareGraphEdges);
}

export function isGraphIndexFile(value: unknown): value is GraphIndexFile {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<GraphIndexFile>;
  return candidate.schemaVersion === GRAPH_INDEX_SCHEMA_VERSION
    && typeof candidate.rootDir === "string"
    && Array.isArray(candidate.sourceFiles)
    && Array.isArray(candidate.diagnostics)
    && (candidate.metadata === undefined || isGraphIndexMetadata(candidate.metadata))
    && (candidate.freshness === undefined || isGraphFreshnessMetadata(candidate.freshness))
    && typeof candidate.graph === "object"
    && candidate.graph !== null
    && Array.isArray(candidate.graph.nodes)
    && Array.isArray(candidate.graph.edges);
}

export async function createGraphFreshnessMetadata(
  rootDir: string,
  sourceFiles: readonly string[],
  indexedAt: Date = new Date(),
): Promise<GraphFreshnessMetadata> {
  const normalizedRootDir = normalizeGraphPath(path.resolve(rootDir));
  const normalizedSourceFiles = normalizeSourceFileList(sourceFiles);
  const sourceFingerprint = await createSourceFingerprintForFiles(
    normalizedRootDir,
    normalizedSourceFiles,
  );

  return {
    indexedAt: indexedAt.toISOString(),
    rootDir: normalizedRootDir,
    sourceFileCount: normalizedSourceFiles.length,
    sourceFingerprint,
  };
}

export async function evaluateGraphFreshness(
  indexFile: GraphIndexFile,
): Promise<GraphFreshnessReport> {
  const metadata = indexFile.freshness;

  if (metadata === undefined) {
    return {
      status: "unknown",
      reason: "graph index does not include freshness metadata",
    };
  }

  const rootDir = normalizeGraphPath(path.resolve(metadata.rootDir));
  const indexedSourceFiles = normalizeSourceFileList(indexFile.sourceFiles);

  let currentSourceFiles: readonly string[];
  try {
    currentSourceFiles = await scanTypeScriptSourceFiles(rootDir);
  } catch (error: unknown) {
    return {
      status: "unknown",
      reason: `unable to scan source files: ${formatUnknownError(error)}`,
      indexedAt: metadata.indexedAt,
      rootDir,
      indexedSourceFileCount: metadata.sourceFileCount,
      sourceFingerprint: metadata.sourceFingerprint,
    };
  }

  let currentSourceFingerprint: string;
  try {
    currentSourceFingerprint = await createSourceFingerprintForFiles(
      rootDir,
      currentSourceFiles,
    );
  } catch (error: unknown) {
    return {
      status: "stale",
      reason: `unable to read current source files: ${formatUnknownError(error)}`,
      indexedAt: metadata.indexedAt,
      rootDir,
      indexedSourceFileCount: metadata.sourceFileCount,
      currentSourceFileCount: currentSourceFiles.length,
      sourceFingerprint: metadata.sourceFingerprint,
    };
  }

  if (
    metadata.sourceFileCount !== currentSourceFiles.length ||
    indexedSourceFiles.length !== currentSourceFiles.length ||
    !sameStringList(indexedSourceFiles, currentSourceFiles)
  ) {
    return {
      status: "stale",
      reason: "source file list changed since the graph was indexed",
      indexedAt: metadata.indexedAt,
      rootDir,
      indexedSourceFileCount: metadata.sourceFileCount,
      currentSourceFileCount: currentSourceFiles.length,
      sourceFingerprint: metadata.sourceFingerprint,
      currentSourceFingerprint,
    };
  }

  if (metadata.sourceFingerprint !== currentSourceFingerprint) {
    return {
      status: "stale",
      reason: "source fingerprint changed since the graph was indexed",
      indexedAt: metadata.indexedAt,
      rootDir,
      indexedSourceFileCount: metadata.sourceFileCount,
      currentSourceFileCount: currentSourceFiles.length,
      sourceFingerprint: metadata.sourceFingerprint,
      currentSourceFingerprint,
    };
  }

  return {
    status: "fresh",
    reason: "source files match the indexed fingerprint",
    indexedAt: metadata.indexedAt,
    rootDir,
    indexedSourceFileCount: metadata.sourceFileCount,
    currentSourceFileCount: currentSourceFiles.length,
    sourceFingerprint: metadata.sourceFingerprint,
    currentSourceFingerprint,
  };
}

export function createSourceFingerprint(
  files: readonly SourceFingerprintFile[],
): string {
  const hash = createHash("sha256");
  const normalizedFiles = [...files].sort((left, right) =>
    normalizeGraphPath(left.filePath).localeCompare(
      normalizeGraphPath(right.filePath),
    ),
  );

  for (const file of normalizedFiles) {
    hash.update(normalizeGraphPath(file.filePath));
    hash.update("\0");
    hash.update(file.content);
    hash.update("\0");
  }

  return `sha256:${hash.digest("hex")}`;
}

export function renderFreshnessWarning(
  freshness: GraphFreshnessReport,
): string | undefined {
  if (freshness.status === "fresh") {
    return undefined;
  }

  return `Warning: graph freshness is ${freshness.status}: ${freshness.reason}`;
}

export function renderMarkdownFreshnessSection(
  freshness: GraphFreshnessReport,
): readonly string[] {
  return [
    "## Freshness",
    "",
    `- Status: \`${freshness.status}\``,
    `- Reason: ${freshness.reason}`,
    `- Indexed at: \`${freshness.indexedAt ?? "unknown"}\``,
    `- Root: \`${freshness.rootDir ?? "unknown"}\``,
    `- Indexed source files: ${freshness.indexedSourceFileCount ?? "unknown"}`,
    `- Current source files: ${freshness.currentSourceFileCount ?? "unknown"}`,
    `- Source fingerprint: \`${freshness.sourceFingerprint ?? "unknown"}\``,
    `- Current fingerprint: \`${freshness.currentSourceFingerprint ?? "unknown"}\``,
  ];
}

export function renderMarkdownRepoMap(
  indexFile: GraphIndexFile,
  freshness?: GraphFreshnessReport,
): string {
  const graph = indexFile.graph;
  const calls = listCalls(graph);
  const references = listReferences(graph);
  const lines: string[] = [
    "# CODEMIND",
    "",
    "Generated by CodeMind Graph.",
    "",
    "## Overview",
    "",
    `- Schema version: \`${indexFile.schemaVersion}\``,
    `- Root: \`${indexFile.rootDir}\``,
    ...renderGraphIndexMetadataOverview(indexFile.metadata),
    `- Source files: ${indexFile.sourceFiles.length}`,
    `- Nodes: ${graph.nodes.length}`,
    `- Edges: ${graph.edges.length}`,
    `- Calls: ${calls.length}`,
    `- References: ${references.length}`,
    `- Diagnostics: ${indexFile.diagnostics.length}`,
  ];

  if (freshness !== undefined) {
    lines.push("", ...renderMarkdownFreshnessSection(freshness));
  }

  lines.push(
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
    "## Calls",
    "",
    ...renderCallsOverview(graph, calls),
    "",
    "## References",
    "",
    ...renderReferencesOverview(graph, references),
    "",
    "## Diagnostics",
    "",
    ...renderDiagnostics(indexFile.diagnostics),
    "",
  );

  return `${lines.join("\n")}\n`;
}

export function renderMarkdownSymbolTrace(
  graph: CodeGraph,
  query: string,
  freshness?: GraphFreshnessReport,
): string {
  const traces = traceSymbols(graph, query);

  if (traces.length === 0) {
    const lines = [
      "# Trace",
      "",
      `No symbols found for \`${cell(query)}\`.`,
      "",
    ];

    if (freshness !== undefined) {
      lines.push(...renderMarkdownFreshnessSection(freshness), "");
    }

    return lines.join("\n");
  }

  const lines: string[] = [
    "# Trace",
    "",
    `Query: \`${cell(query)}\``,
    `Matches: ${traces.length}`,
    "",
  ];

  if (freshness !== undefined) {
    lines.push(...renderMarkdownFreshnessSection(freshness), "");
  }

  for (const [index, trace] of traces.entries()) {
    lines.push(
      `## Match ${index + 1}`,
      "",
      `- Symbol: \`${trace.symbol.kind} ${cell(trace.symbol.name)}\``,
      `- Location: \`${cell(formatNodeLocation(trace.symbol))}\``,
      `- File: \`${cell(trace.file?.filePath ?? trace.symbol.filePath ?? "unknown")}\``,
      "",
      "### Imports",
      "",
      ...renderTraceEdgeTable(graph, trace.imports, "Import"),
      "",
      "### Exports",
      "",
      ...renderTraceEdgeTable(graph, trace.exports, "Export"),
      "",
      "### Calls Out",
      "",
      ...renderCallEdgeTable(graph, trace.callsOut, "No outgoing calls found."),
      "",
      "### Called By",
      "",
      ...renderCallEdgeTable(graph, trace.calledBy, "No incoming calls found."),
      "",
      "### References Out",
      "",
      ...renderReferenceEdgeTable(graph, trace.referencesOut, "No outgoing references found."),
      "",
      "### Referenced By",
      "",
      ...renderReferenceEdgeTable(graph, trace.referencedBy, "No incoming references found."),
      "",
      "### Related Modules",
      "",
      ...renderRelatedModulesTable(trace.relatedModules),
      "",
    );
  }

  return `${lines.join("\n")}\n`;
}

export function renderMarkdownFileExplain(
  indexFile: GraphIndexFile,
  filePath: string,
  freshness?: GraphFreshnessReport,
): string {
  const normalizedFilePath = normalizeLookupFilePath(filePath);
  const explanation = explainFile(indexFile.graph, normalizedFilePath);
  const lines: string[] = [
    "# File Explain",
    "",
    `File: \`${cell(normalizedFilePath)}\``,
    "",
  ];

  if (freshness !== undefined) {
    lines.push(...renderMarkdownFreshnessSection(freshness), "");
  }

  if (explanation === undefined) {
    lines.push("No indexed file found.", "");
    return `${lines.join("\n")}\n`;
  }

  const indexedFilePath = explanation.file.filePath ?? explanation.file.name;
  const fileDiagnostics = diagnosticsForFile(
    indexFile.diagnostics,
    indexedFilePath,
  );

  lines.push(
    "## File Overview",
    "",
    `- Indexed path: \`${cell(indexedFilePath)}\``,
    `- Source: \`${explanation.file.source}\``,
    `- Symbols: ${explanation.symbols.length}`,
    `- Imports: ${explanation.imports.length}`,
    `- Exports: ${explanation.exports.length}`,
    `- Calls out: ${explanation.callsOut.length}`,
    `- Called by: ${explanation.calledBy.length}`,
    `- References out: ${explanation.referencesOut.length}`,
    `- Referenced by: ${explanation.referencedBy.length}`,
    `- Related modules: ${explanation.relatedModules.length}`,
    "",
    "## Symbols",
    "",
    ...renderFileSymbolsTable(explanation.symbols),
    "",
    "## Imports",
    "",
    ...renderTraceEdgeTable(indexFile.graph, explanation.imports, "Import"),
    "",
    "## Exports",
    "",
    ...renderTraceEdgeTable(indexFile.graph, explanation.exports, "Export"),
    "",
    "## Calls Out",
    "",
    ...renderCallEdgeTable(indexFile.graph, explanation.callsOut, "No outgoing calls found."),
    "",
    "## Called By",
    "",
    ...renderCallEdgeTable(indexFile.graph, explanation.calledBy, "No incoming calls found."),
    "",
    "## References Out",
    "",
    ...renderReferenceEdgeTable(indexFile.graph, explanation.referencesOut, "No outgoing references found."),
    "",
    "## Referenced By",
    "",
    ...renderReferenceEdgeTable(indexFile.graph, explanation.referencedBy, "No incoming references found."),
    "",
    "## Related Modules",
    "",
    ...renderRelatedModulesTable(explanation.relatedModules),
    "",
    "## Diagnostics",
    "",
    ...renderDiagnostics(fileDiagnostics),
    "",
  );

  return `${lines.join("\n")}\n`;
}

export function createContextPack(
  indexFile: GraphIndexFile,
  target: string,
  options: ContextPackOptions = {},
): ContextPack {
  const limit = normalizeContextLimit(options.limit);
  const repoMapLineLimit = normalizeRepoMapLineLimit(options.repoMapLineLimit);
  const fileExplanation = explainFile(indexFile.graph, target);

  if (fileExplanation !== undefined) {
    const symbolTraces = fileExplanation.symbols
      .slice(0, limit)
      .map((symbol) => traceForSymbol(indexFile.graph, symbol))
      .filter((trace): trace is SymbolTrace => trace !== undefined);

    return {
      target,
      targetKind: "file",
      limit,
      repoMapLineLimit,
      symbolTraces,
      fileExplanations: [fileExplanation],
    };
  }

  const symbolTraces = traceSymbols(indexFile.graph, target).slice(0, limit);
  const fileExplanations = uniqueSortedFilePaths(
    symbolTraces.map((trace) => trace.file?.filePath ?? trace.symbol.filePath),
  )
    .slice(0, limit)
    .map((filePath) => explainFile(indexFile.graph, filePath))
    .filter((explanation): explanation is FileExplanation => explanation !== undefined);

  return {
    target,
    targetKind: symbolTraces.length > 0 ? "symbol" : "unknown",
    limit,
    repoMapLineLimit,
    symbolTraces,
    fileExplanations,
  };
}

export function renderMarkdownContextPack(
  indexFile: GraphIndexFile,
  contextPack: ContextPack,
  freshness?: GraphFreshnessReport,
): string {
  const graph = indexFile.graph;
  const lines: string[] = [
    "# Context Pack",
    "",
    "Generated by CodeMind Graph.",
    "",
    "## Overview",
    "",
    `- Target: \`${cell(contextPack.target)}\``,
    `- Target kind: \`${contextPack.targetKind}\``,
    `- Match limit: ${contextPack.limit}`,
    `- Repo map excerpt line limit: ${contextPack.repoMapLineLimit}`,
    `- Symbol traces: ${contextPack.symbolTraces.length}`,
    `- File explanations: ${contextPack.fileExplanations.length}`,
    `- Source files: ${indexFile.sourceFiles.length}`,
    `- Nodes: ${graph.nodes.length}`,
    `- Edges: ${graph.edges.length}`,
    `- Calls: ${listCalls(graph).length}`,
    `- References: ${listReferences(graph).length}`,
    `- Diagnostics: ${indexFile.diagnostics.length}`,
    ...renderGraphIndexMetadataOverview(indexFile.metadata),
  ];

  if (freshness !== undefined) {
    lines.push("", ...renderMarkdownFreshnessSection(freshness));
  }

  lines.push(
    "",
    "## Target Context",
    "",
  );

  if (contextPack.targetKind === "unknown") {
    lines.push("No file or symbol context found for this target.", "");
  } else {
    lines.push(
      `- Type: \`${contextPack.targetKind}\``,
      `- Selected symbol traces: ${contextPack.symbolTraces.length}`,
      `- Selected file explanations: ${contextPack.fileExplanations.length}`,
      "",
    );
  }

  lines.push(
    "## Symbol Trace",
    "",
    ...renderContextSymbolTraces(indexFile.graph, contextPack.symbolTraces, contextPack.limit),
    "",
    "## File Explain",
    "",
    ...renderContextFileExplanations(indexFile, contextPack.fileExplanations, contextPack.limit),
    "",
    "## Repo Map Excerpt",
    "",
    ...renderRepoMapExcerpt(indexFile, contextPack.repoMapLineLimit),
    "",
  );

  return `${lines.join("\n")}\n`;
}

function renderContextSymbolTraces(
  graph: CodeGraph,
  traces: readonly SymbolTrace[],
  rowLimit: number,
): readonly string[] {
  if (traces.length === 0) {
    return ["No symbol traces selected."];
  }

  return traces.flatMap((trace, index): readonly string[] => {
    const imports = limitItems(trace.imports, rowLimit);
    const exports = limitItems(trace.exports, rowLimit);
    const callsOut = limitItems(trace.callsOut, rowLimit);
    const calledBy = limitItems(trace.calledBy, rowLimit);
    const referencesOut = limitItems(trace.referencesOut, rowLimit);
    const referencedBy = limitItems(trace.referencedBy, rowLimit);
    const relatedModules = limitItems(trace.relatedModules, rowLimit);

    return [
      `### Trace ${index + 1}: \`${cell(trace.symbol.kind)} ${cell(trace.symbol.name)}\``,
      "",
      `- Location: \`${cell(formatNodeLocation(trace.symbol))}\``,
      `- File: \`${cell(trace.file?.filePath ?? trace.symbol.filePath ?? "unknown")}\``,
      `- Imports: ${trace.imports.length}`,
      `- Exports: ${trace.exports.length}`,
      `- Calls out: ${trace.callsOut.length}`,
      `- Called by: ${trace.calledBy.length}`,
      `- References out: ${trace.referencesOut.length}`,
      `- Referenced by: ${trace.referencedBy.length}`,
      "",
      "#### Imports",
      "",
      ...renderTraceEdgeTable(graph, imports.items, "Import"),
      ...renderTruncationNote("imports", imports, rowLimit),
      "",
      "#### Exports",
      "",
      ...renderTraceEdgeTable(graph, exports.items, "Export"),
      ...renderTruncationNote("exports", exports, rowLimit),
      "",
      "#### Calls Out",
      "",
      ...renderCallEdgeTable(graph, callsOut.items, "No outgoing calls found."),
      ...renderTruncationNote("outgoing calls", callsOut, rowLimit),
      "",
      "#### Called By",
      "",
      ...renderCallEdgeTable(graph, calledBy.items, "No incoming calls found."),
      ...renderTruncationNote("incoming calls", calledBy, rowLimit),
      "",
      "#### References Out",
      "",
      ...renderReferenceEdgeTable(graph, referencesOut.items, "No outgoing references found."),
      ...renderTruncationNote("outgoing references", referencesOut, rowLimit),
      "",
      "#### Referenced By",
      "",
      ...renderReferenceEdgeTable(graph, referencedBy.items, "No incoming references found."),
      ...renderTruncationNote("incoming references", referencedBy, rowLimit),
      "",
      "#### Related Modules",
      "",
      ...renderRelatedModulesTable(relatedModules.items),
      ...renderTruncationNote("related modules", relatedModules, rowLimit),
      "",
    ];
  });
}

function renderContextFileExplanations(
  indexFile: GraphIndexFile,
  explanations: readonly FileExplanation[],
  rowLimit: number,
): readonly string[] {
  if (explanations.length === 0) {
    return ["No file explanations selected."];
  }

  return explanations.flatMap((explanation, index): readonly string[] => {
    const indexedFilePath = explanation.file.filePath ?? explanation.file.name;
    const fileDiagnostics = diagnosticsForFile(indexFile.diagnostics, indexedFilePath);
    const symbols = limitItems(explanation.symbols, rowLimit);
    const imports = limitItems(explanation.imports, rowLimit);
    const exports = limitItems(explanation.exports, rowLimit);
    const callsOut = limitItems(explanation.callsOut, rowLimit);
    const calledBy = limitItems(explanation.calledBy, rowLimit);
    const referencesOut = limitItems(explanation.referencesOut, rowLimit);
    const referencedBy = limitItems(explanation.referencedBy, rowLimit);
    const diagnostics = limitItems(fileDiagnostics, rowLimit);

    return [
      `### File ${index + 1}: \`${cell(indexedFilePath)}\``,
      "",
      `- Source: \`${explanation.file.source}\``,
      `- Symbols: ${explanation.symbols.length}`,
      `- Imports: ${explanation.imports.length}`,
      `- Exports: ${explanation.exports.length}`,
      `- Calls out: ${explanation.callsOut.length}`,
      `- Called by: ${explanation.calledBy.length}`,
      `- References out: ${explanation.referencesOut.length}`,
      `- Referenced by: ${explanation.referencedBy.length}`,
      `- Related modules: ${explanation.relatedModules.length}`,
      "",
      "#### Symbols",
      "",
      ...renderFileSymbolsTable(symbols.items),
      ...renderTruncationNote("symbols", symbols, rowLimit),
      "",
      "#### Imports",
      "",
      ...renderTraceEdgeTable(indexFile.graph, imports.items, "Import"),
      ...renderTruncationNote("imports", imports, rowLimit),
      "",
      "#### Exports",
      "",
      ...renderTraceEdgeTable(indexFile.graph, exports.items, "Export"),
      ...renderTruncationNote("exports", exports, rowLimit),
      "",
      "#### Calls Out",
      "",
      ...renderCallEdgeTable(indexFile.graph, callsOut.items, "No outgoing calls found."),
      ...renderTruncationNote("outgoing calls", callsOut, rowLimit),
      "",
      "#### Called By",
      "",
      ...renderCallEdgeTable(indexFile.graph, calledBy.items, "No incoming calls found."),
      ...renderTruncationNote("incoming calls", calledBy, rowLimit),
      "",
      "#### References Out",
      "",
      ...renderReferenceEdgeTable(indexFile.graph, referencesOut.items, "No outgoing references found."),
      ...renderTruncationNote("outgoing references", referencesOut, rowLimit),
      "",
      "#### Referenced By",
      "",
      ...renderReferenceEdgeTable(indexFile.graph, referencedBy.items, "No incoming references found."),
      ...renderTruncationNote("incoming references", referencedBy, rowLimit),
      "",
      "#### Diagnostics",
      "",
      ...renderDiagnostics(diagnostics.items),
      ...renderTruncationNote("diagnostics", diagnostics, rowLimit),
      "",
    ];
  });
}

function renderRepoMapExcerpt(indexFile: GraphIndexFile, lineLimit: number): readonly string[] {
  const repoMapLines = renderMarkdownRepoMap(indexFile).trimEnd().split("\n");
  const excerptLines = repoMapLines.slice(0, lineLimit);

  if (repoMapLines.length <= lineLimit) {
    return excerptLines;
  }

  return [
    ...excerptLines,
    "",
    `_Repo map excerpt truncated at ${lineLimit} of ${repoMapLines.length} lines._`,
  ];
}

interface LimitedItems<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly truncated: boolean;
}

function limitItems<T>(items: readonly T[], limit: number): LimitedItems<T> {
  return {
    items: items.slice(0, limit),
    total: items.length,
    truncated: items.length > limit,
  };
}

function renderTruncationNote<T>(label: string, limitedItems: LimitedItems<T>, limit: number): readonly string[] {
  if (!limitedItems.truncated) {
    return [];
  }

  return [`_${label} truncated at ${limit} of ${limitedItems.total} rows._`];
}

function traceForSymbol(graph: CodeGraph, symbol: GraphNode): SymbolTrace | undefined {
  return traceSymbols(graph, symbol.name).find((trace) => trace.symbol.id === symbol.id);
}

function uniqueSortedFilePaths(filePaths: readonly (string | undefined)[]): readonly string[] {
  return [...new Set(
    filePaths
      .filter((filePath): filePath is string => filePath !== undefined)
      .map(normalizeLookupFilePath),
  )].sort();
}

function normalizeContextLimit(value: number | undefined): number {
  return normalizeBoundedInteger(value, DEFAULT_CONTEXT_PACK_LIMIT, 1, MAX_CONTEXT_PACK_LIMIT);
}

function normalizeRepoMapLineLimit(value: number | undefined): number {
  return normalizeBoundedInteger(
    value,
    DEFAULT_CONTEXT_PACK_REPO_MAP_LINES,
    10,
    MAX_CONTEXT_PACK_REPO_MAP_LINES,
  );
}

function normalizeBoundedInteger(
  value: number | undefined,
  defaultValue: number,
  min: number,
  max: number,
): number {
  if (value === undefined || !Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}

export function compareGraphNodes(left: GraphNode, right: GraphNode): number {
  const leftFilePath = left.filePath ?? left.location?.filePath ?? "";
  const rightFilePath = right.filePath ?? right.location?.filePath ?? "";
  const fileCompare = leftFilePath.localeCompare(rightFilePath);

  if (fileCompare !== 0) {
    return fileCompare;
  }

  const leftLine = left.location?.range.start.line ?? 0;
  const rightLine = right.location?.range.start.line ?? 0;
  if (leftLine !== rightLine) {
    return leftLine - rightLine;
  }

  const kindCompare = left.kind.localeCompare(right.kind);
  if (kindCompare !== 0) {
    return kindCompare;
  }

  const nameCompare = left.name.localeCompare(right.name);
  if (nameCompare !== 0) {
    return nameCompare;
  }

  return left.id.localeCompare(right.id);
}

export function compareGraphEdges(left: GraphEdge, right: GraphEdge): number {
  const leftFilePath = left.location?.filePath ?? "";
  const rightFilePath = right.location?.filePath ?? "";
  const fileCompare = leftFilePath.localeCompare(rightFilePath);

  if (fileCompare !== 0) {
    return fileCompare;
  }

  const leftLine = left.location?.range.start.line ?? 0;
  const rightLine = right.location?.range.start.line ?? 0;
  if (leftLine !== rightLine) {
    return leftLine - rightLine;
  }

  const kindCompare = left.kind.localeCompare(right.kind);
  if (kindCompare !== 0) {
    return kindCompare;
  }

  return left.id.localeCompare(right.id);
}

export function formatNodeLocation(node: GraphNode): string {
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
      return `| ${cell(node.kind)} | ${cell(node.name)} | ${cell(formatNodeLocation(node))} | ${exported} |`;
    }),
  ];
}

function renderFileSymbolsTable(symbols: readonly GraphNode[]): readonly string[] {
  if (symbols.length === 0) {
    return ["No symbols defined in this file."];
  }

  return [
    "| Kind | Name | Location | Exported |",
    "| --- | --- | --- | --- |",
    ...symbols.map((node) => {
      const exported = node.metadata?.exported === true ? "yes" : "no";
      return `| ${cell(node.kind)} | ${cell(node.name)} | ${cell(formatNodeLocation(node))} | ${exported} |`;
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

function renderGraphIndexMetadataOverview(metadata: GraphIndexMetadata | undefined): readonly string[] {
  if (metadata === undefined) {
    return ["- Index metadata: `unknown`"];
  }

  return [
    `- Indexer: \`${metadata.indexer}@${metadata.indexerVersion}\``,
    `- Adapter: \`${metadata.adapter}@${metadata.adapterVersion}\``,
    `- Language: \`${metadata.language}\``,
    `- Capabilities: \`${metadata.capabilities.join(", ")}\``,
  ];
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

function renderTraceEdgeTable(graph: CodeGraph, edges: readonly GraphEdge[], label: string): readonly string[] {
  if (edges.length === 0) {
    return [`No ${label.toLocaleLowerCase()} edges found.`];
  }

  return [
    `| ${label} From | Target | Specifier | Kind |`,
    "| --- | --- | --- | --- |",
    ...edges.map((edge) => {
      const fromNode = getNodeById(graph, edge.fromId);
      const toNode = getNodeById(graph, edge.toId);
      const specifier = edge.metadata?.specifier ?? "";
      const kind = edge.metadata?.importKind ?? edge.metadata?.exportKind ?? "";
      return [
        formatEdgeNode(fromNode),
        formatEdgeNode(toNode),
        String(specifier),
        String(kind),
      ].map(cell).join(" | ").replace(/^/, "| ").replace(/$/, " |");
    }),
  ];
}

function renderCallEdgeTable(graph: CodeGraph, edges: readonly GraphEdge[], emptyMessage: string): readonly string[] {
  if (edges.length === 0) {
    return [emptyMessage];
  }

  return [
    "| Caller | Callee | Expression | Resolution |",
    "| --- | --- | --- | --- |",
    ...edges.map((edge) => {
      const fromNode = getNodeById(graph, edge.fromId);
      const toNode = getNodeById(graph, edge.toId);
      return [
        formatEdgeNode(fromNode),
        formatEdgeNode(toNode),
        String(edge.metadata?.callee ?? ""),
        String(edge.metadata?.resolution ?? ""),
      ].map(cell).join(" | ").replace(/^/, "| ").replace(/$/, " |");
    }),
  ];
}

function renderReferenceEdgeTable(graph: CodeGraph, edges: readonly GraphEdge[], emptyMessage: string): readonly string[] {
  if (edges.length === 0) {
    return [emptyMessage];
  }

  return [
    "| Referencer | Referenced Symbol | Reference | Resolution |",
    "| --- | --- | --- | --- |",
    ...edges.map((edge) => {
      const fromNode = getNodeById(graph, edge.fromId);
      const toNode = getNodeById(graph, edge.toId);
      return [
        formatEdgeNode(fromNode),
        formatEdgeNode(toNode),
        String(edge.metadata?.reference ?? ""),
        String(edge.metadata?.resolution ?? ""),
      ].map(cell).join(" | ").replace(/^/, "| ").replace(/$/, " |");
    }),
  ];
}

function renderCallsOverview(graph: CodeGraph, calls: readonly GraphEdge[]): readonly string[] {
  const callerIds = new Set(calls.map((edge) => edge.fromId));
  const calleeIds = new Set(calls.map((edge) => edge.toId));

  return [
    "### Summary",
    "",
    `- Call edges: ${calls.length}`,
    `- Unique callers: ${callerIds.size}`,
    `- Unique callees: ${calleeIds.size}`,
    "",
    "### Top Callers",
    "",
    ...renderCallRankTable(graph, rankCallNodes(calls, "caller"), "No callers indexed."),
    "",
    "### Top Callees",
    "",
    ...renderCallRankTable(graph, rankCallNodes(calls, "callee"), "No callees indexed."),
    "",
    "### Call Edges",
    "",
    ...renderCallEdgeTable(graph, calls, "No call edges indexed."),
  ];
}

function renderReferencesOverview(graph: CodeGraph, references: readonly GraphEdge[]): readonly string[] {
  const referencerIds = new Set(references.map((edge) => edge.fromId));
  const referencedIds = new Set(references.map((edge) => edge.toId));

  return [
    "### Summary",
    "",
    `- Reference edges: ${references.length}`,
    `- Unique referencers: ${referencerIds.size}`,
    `- Unique referenced symbols: ${referencedIds.size}`,
    "",
    "### Top Referencers",
    "",
    ...renderReferenceRankTable(graph, rankReferenceNodes(references, "referencer"), "No referencers indexed."),
    "",
    "### Top Referenced Symbols",
    "",
    ...renderReferenceRankTable(graph, rankReferenceNodes(references, "referenced"), "No referenced symbols indexed."),
    "",
    "### Reference Edges",
    "",
    ...renderReferenceEdgeTable(graph, references, "No reference edges indexed."),
  ];
}

function rankCallNodes(
  calls: readonly GraphEdge[],
  direction: "caller" | "callee",
): readonly { readonly nodeId: GraphNodeId; readonly count: number }[] {
  const counts = new Map<GraphNodeId, number>();

  for (const edge of calls) {
    const nodeId = direction === "caller" ? edge.fromId : edge.toId;
    counts.set(nodeId, (counts.get(nodeId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([nodeId, count]) => ({ nodeId, count }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return left.nodeId.localeCompare(right.nodeId);
    })
    .slice(0, 10);
}

function rankReferenceNodes(
  references: readonly GraphEdge[],
  direction: "referencer" | "referenced",
): readonly { readonly nodeId: GraphNodeId; readonly count: number }[] {
  const counts = new Map<GraphNodeId, number>();

  for (const edge of references) {
    const nodeId = direction === "referencer" ? edge.fromId : edge.toId;
    counts.set(nodeId, (counts.get(nodeId) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([nodeId, count]) => ({ nodeId, count }))
    .sort((left, right) => {
      if (left.count !== right.count) {
        return right.count - left.count;
      }

      return left.nodeId.localeCompare(right.nodeId);
    })
    .slice(0, 10);
}

function renderCallRankTable(
  graph: CodeGraph,
  rankedNodes: readonly { readonly nodeId: GraphNodeId; readonly count: number }[],
  emptyMessage: string,
): readonly string[] {
  if (rankedNodes.length === 0) {
    return [emptyMessage];
  }

  return [
    "| Symbol | Calls |",
    "| --- | ---: |",
    ...rankedNodes.map((rankedNode) =>
      `| ${cell(formatEdgeNode(getNodeById(graph, rankedNode.nodeId)))} | ${rankedNode.count} |`
    ),
  ];
}

function renderReferenceRankTable(
  graph: CodeGraph,
  rankedNodes: readonly { readonly nodeId: GraphNodeId; readonly count: number }[],
  emptyMessage: string,
): readonly string[] {
  if (rankedNodes.length === 0) {
    return [emptyMessage];
  }

  return [
    "| Symbol | References |",
    "| --- | ---: |",
    ...rankedNodes.map((rankedNode) =>
      `| ${cell(formatEdgeNode(getNodeById(graph, rankedNode.nodeId)))} | ${rankedNode.count} |`
    ),
  ];
}

function renderRelatedModulesTable(nodes: readonly GraphNode[]): readonly string[] {
  if (nodes.length === 0) {
    return ["No related modules found."];
  }

  return [
    "| Module | Source | Specifier |",
    "| --- | --- | --- |",
    ...nodes.map((node) => {
      const specifier = node.metadata?.specifier ?? "";
      return [
        node.name,
        node.source,
        String(specifier),
      ].map(cell).join(" | ").replace(/^/, "| ").replace(/$/, " |");
    }),
  ];
}

function fileNodeForSymbol(graph: CodeGraph, symbol: GraphNode): GraphNode | undefined {
  const symbolFilePath = symbol.filePath ?? symbol.location?.filePath;
  if (symbolFilePath === undefined) {
    return undefined;
  }

  return listFiles(graph).find((node) => node.filePath === symbolFilePath);
}

function uniqueSortedNodes(nodes: readonly (GraphNode | undefined)[]): readonly GraphNode[] {
  return [...new Map(nodes.filter((node): node is GraphNode => node !== undefined).map((node) => [node.id, node])).values()]
    .sort(compareGraphNodes);
}

async function scanTypeScriptSourceFiles(rootDir: string): Promise<readonly string[]> {
  const sourceFiles: string[] = [];

  async function visit(directoryPath: string): Promise<void> {
    const entries = await readdir(directoryPath, { withFileTypes: true });

    for (const entry of entries) {
      const absoluteEntryPath = path.join(directoryPath, entry.name);

      if (entry.isDirectory()) {
        if (!FRESHNESS_EXCLUDED_DIRECTORIES.has(entry.name)) {
          await visit(absoluteEntryPath);
        }
        continue;
      }

      if (entry.isFile() && isTypeScriptSourcePath(entry.name)) {
        sourceFiles.push(
          normalizeGraphPath(path.relative(rootDir, absoluteEntryPath)),
        );
      }
    }
  }

  await visit(rootDir);
  return normalizeSourceFileList(sourceFiles);
}

async function createSourceFingerprintForFiles(
  rootDir: string,
  sourceFiles: readonly string[],
): Promise<string> {
  const files = await Promise.all(
    sourceFiles.map(async (filePath): Promise<SourceFingerprintFile> => {
      const content = await readFile(path.join(rootDir, filePath), "utf8");
      return {
        filePath,
        content,
      };
    }),
  );

  return createSourceFingerprint(files);
}

function normalizeSourceFileList(sourceFiles: readonly string[]): readonly string[] {
  return [...sourceFiles].map(normalizeGraphPath).sort();
}

function sameStringList(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((entry, index) => entry === right[index]);
}

function isGraphFreshnessMetadata(
  value: unknown,
): value is GraphFreshnessMetadata {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<GraphFreshnessMetadata>;

  return (
    typeof candidate.indexedAt === "string" &&
    typeof candidate.rootDir === "string" &&
    typeof candidate.sourceFileCount === "number" &&
    typeof candidate.sourceFingerprint === "string"
  );
}

function isGraphIndexMetadata(value: unknown): value is GraphIndexMetadata {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<GraphIndexMetadata>;
  const capabilities = candidate.capabilities;

  return (
    typeof candidate.indexer === "string" &&
    typeof candidate.indexerVersion === "string" &&
    typeof candidate.adapter === "string" &&
    typeof candidate.adapterVersion === "string" &&
    typeof candidate.language === "string" &&
    Array.isArray(capabilities) &&
    capabilities.every((capability): capability is GraphIndexCapability =>
      typeof capability === "string" && isGraphIndexCapability(capability)
    )
  );
}

function isGraphIndexCapability(value: string): value is GraphIndexCapability {
  return GRAPH_INDEX_CAPABILITIES.includes(value as GraphIndexCapability);
}

function isTypeScriptSourcePath(fileName: string): boolean {
  return (
    (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) &&
    !fileName.endsWith(".d.ts")
  );
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeLookupFilePath(filePath: string): string {
  return normalizeGraphPath(filePath).replace(/^\.\//, "");
}

function diagnosticsForFile(
  diagnostics: readonly string[],
  filePath: string,
): readonly string[] {
  const normalizedFilePath = normalizeLookupFilePath(filePath);
  return diagnostics.filter((diagnostic) =>
    normalizeGraphPath(diagnostic).includes(normalizedFilePath)
  );
}

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function compareById<T extends { readonly id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function encodeIdPart(value: string): string {
  return encodeURIComponent(normalizeGraphPath(value));
}

const FRESHNESS_EXCLUDED_DIRECTORIES = new Set([
  ".codemind",
  ".git",
  "coverage",
  "dist",
  "node_modules",
]);

const DEFAULT_CONTEXT_PACK_LIMIT = 3;
const MAX_CONTEXT_PACK_LIMIT = 20;
const DEFAULT_CONTEXT_PACK_REPO_MAP_LINES = 80;
const MAX_CONTEXT_PACK_REPO_MAP_LINES = 240;
