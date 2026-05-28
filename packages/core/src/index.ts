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

function compareById<T extends { readonly id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function encodeIdPart(value: string): string {
  return encodeURIComponent(normalizeGraphPath(value));
}
