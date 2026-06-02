import { ContextPackBuilder } from "./context-pack.js";
import { GraphStore, type RepoNode } from "./graph-store.js";

const seedNodes: readonly RepoNode[] = [
  { id: "api", label: "Public API", kind: "module" },
  { id: "graph", label: "Graph Store", kind: "symbol" },
];

export function buildDemoContext(entrypoint = "api"): string {
  const store = GraphStore.fromSeed(seedNodes);
  const builder = new ContextPackBuilder(store);
  return builder.buildSummary(entrypoint);
}

export { ContextPackBuilder } from "./context-pack.js";
export { GraphStore } from "./graph-store.js";
export type { RepoNode } from "./graph-store.js";
