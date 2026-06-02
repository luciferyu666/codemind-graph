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
  readonly schemaVersion: "0.1.0";
  readonly rootDir: string;
  readonly sourceFiles: readonly string[];
  readonly diagnostics: readonly string[];
  readonly freshness?: GraphFreshnessMetadata;
  readonly graph: CodeGraph;
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
  readonly relatedModules: readonly GraphNode[];
}

export interface FileExplanation {
  readonly file: GraphNode;
  readonly symbols: readonly GraphNode[];
  readonly imports: readonly GraphEdge[];
  readonly exports: readonly GraphEdge[];
  readonly relatedModules: readonly GraphNode[];
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
  const relatedModules = uniqueSortedNodes([
    ...imports.map((edge) => getNodeById(graph, edge.toId)),
    ...exports.map((edge) => getNodeById(graph, edge.toId)).filter((node) => node?.kind === "module"),
  ]);

  return {
    file,
    symbols,
    imports,
    exports,
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
  return candidate.schemaVersion === "0.1.0"
    && typeof candidate.rootDir === "string"
    && Array.isArray(candidate.sourceFiles)
    && Array.isArray(candidate.diagnostics)
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
