import { normalizeLabel } from "./string-utils.js";

export interface RepoNode {
  readonly id: string;
  readonly label: string;
  readonly kind: "file" | "symbol" | "module";
}

export class GraphStore {
  private readonly nodes = new Map<string, RepoNode>();

  addNode(node: RepoNode): void {
    this.nodes.set(normalizeLabel(node.id), node);
  }

  findNode(id: string): RepoNode | undefined {
    return this.nodes.get(normalizeLabel(id));
  }

  listNodes(): readonly RepoNode[] {
    return [...this.nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
  }

  static fromSeed(seed: readonly RepoNode[]): GraphStore {
    const store = new GraphStore();
    for (const node of seed) {
      store.addNode(node);
    }
    return store;
  }
}
