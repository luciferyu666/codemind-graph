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
  readonly graph: CodeGraph;
}

export interface SymbolTrace {
  readonly symbol: GraphNode;
  readonly file: GraphNode | undefined;
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
    const relatedModules = uniqueSortedNodes([
      ...imports.map((edge) => getNodeById(graph, edge.toId)),
      ...exports.map((edge) => getNodeById(graph, edge.toId)).filter((node) => node?.kind === "module"),
    ]);

    return {
      symbol,
      file,
      imports,
      exports,
      relatedModules,
    };
  });
}

export function listImports(graph: CodeGraph): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.kind === "IMPORTS").sort(compareGraphEdges);
}

export function listExports(graph: CodeGraph): readonly GraphEdge[] {
  return graph.edges.filter((edge) => edge.kind === "EXPORTS").sort(compareGraphEdges);
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
    && typeof candidate.graph === "object"
    && candidate.graph !== null
    && Array.isArray(candidate.graph.nodes)
    && Array.isArray(candidate.graph.edges);
}

export function renderMarkdownRepoMap(indexFile: GraphIndexFile): string {
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

export function renderMarkdownSymbolTrace(graph: CodeGraph, query: string): string {
  const traces = traceSymbols(graph, query);

  if (traces.length === 0) {
    return [
      "# Trace",
      "",
      `No symbols found for \`${cell(query)}\`.`,
      "",
    ].join("\n");
  }

  const lines: string[] = [
    "# Trace",
    "",
    `Query: \`${cell(query)}\``,
    `Matches: ${traces.length}`,
    "",
  ];

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
      "### Related Modules",
      "",
      ...renderRelatedModulesTable(trace.relatedModules),
      "",
    );
  }

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

function cell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function compareById<T extends { readonly id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function encodeIdPart(value: string): string {
  return encodeURIComponent(normalizeGraphPath(value));
}
