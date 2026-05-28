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

export type GraphNodeKind = (typeof GRAPH_NODE_KINDS)[number];
export type GraphEdgeKind = (typeof GRAPH_EDGE_KINDS)[number];
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

function compareById<T extends { readonly id: string }>(left: T, right: T): number {
  return left.id.localeCompare(right.id);
}

function encodeIdPart(value: string): string {
  return encodeURIComponent(normalizeGraphPath(value));
}
