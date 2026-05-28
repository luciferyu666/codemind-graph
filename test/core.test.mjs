import assert from "node:assert/strict";
import test from "node:test";
import {
  GraphBuilder,
  createEdgeId,
  createNodeId,
  findSymbols,
  getIncomingEdges,
  getNodeById,
  getOutgoingEdges,
  listExports,
  listFiles,
  listSymbols,
  normalizeGraphPath,
} from "../packages/core/dist/index.js";

test("GraphBuilder deduplicates nodes and returns deterministic ordering", () => {
  const builder = new GraphBuilder();
  const repositoryId = createNodeId("repository", ["F:/repo"]);
  const fileId = createNodeId("file", ["src/index.ts"]);
  const symbolId = createNodeId("function", ["src/index.ts", "run", "1:1"]);

  builder.addNode({
    id: symbolId,
    kind: "function",
    name: "run",
    source: "project",
    filePath: "src/index.ts",
  });
  builder.addNode({
    id: repositoryId,
    kind: "repository",
    name: "repo",
    source: "project",
    filePath: ".",
  });
  builder.addNode({
    id: fileId,
    kind: "file",
    name: "index.ts",
    source: "project",
    filePath: "src/index.ts",
  });
  builder.addNode({
    id: fileId,
    kind: "file",
    name: "index.ts",
    source: "project",
    filePath: "src/index.ts",
  });

  builder.addEdge({
    id: createEdgeId("DEFINES", fileId, symbolId),
    kind: "DEFINES",
    fromId: fileId,
    toId: symbolId,
  });
  builder.addEdge({
    id: createEdgeId("CONTAINS", repositoryId, fileId),
    kind: "CONTAINS",
    fromId: repositoryId,
    toId: fileId,
  });

  const graph = builder.toGraph("F:\\repo");

  assert.equal(normalizeGraphPath("F:\\repo\\src\\index.ts"), "F:/repo/src/index.ts");
  assert.deepEqual(
    graph.nodes.map((node) => node.id),
    [...graph.nodes.map((node) => node.id)].sort(),
  );
  assert.equal(graph.nodes.length, 3);
  assert.equal(graph.edges.length, 2);
  assert.equal(graph.rootPath, "F:/repo");
  assert.equal(getNodeById(graph, symbolId)?.name, "run");
  assert.deepEqual(listFiles(graph).map((node) => node.name), ["index.ts"]);
  assert.deepEqual(listSymbols(graph).map((node) => node.name), ["run"]);
  assert.deepEqual(findSymbols(graph, "ru").map((node) => node.name), ["run"]);
  assert.equal(getOutgoingEdges(graph, fileId).length, 1);
  assert.equal(getIncomingEdges(graph, symbolId).length, 1);
  assert.equal(listExports(graph).length, 0);
});
