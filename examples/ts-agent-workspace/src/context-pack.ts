import { GraphStore, type RepoNode } from "./graph-store.js";
import * as text from "./string-utils.js";

export class ContextPackBuilder {
  constructor(private readonly store: GraphStore) {}

  buildSummary(entrypoint: string): string {
    const normalizedEntrypoint = text.normalizeLabel(entrypoint);
    const node = this.store.findNode(normalizedEntrypoint);
    return node === undefined ? "No context found." : this.formatNode(node);
  }

  private formatNode(node: RepoNode): string {
    return `${text.toSlug(node.kind)}:${node.label}`;
  }
}
