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
  listCalls,
  listSymbols,
  normalizeGraphPath,
  renderMarkdownSymbolTrace,
  traceSymbols,
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

test("traceSymbols returns symbol file imports exports and related modules", () => {
  const builder = new GraphBuilder();
  const repositoryId = createNodeId("repository", ["F:/repo"]);
  const fileId = createNodeId("file", ["src/index.ts"]);
  const moduleId = createNodeId("module", ["project", "src/helper.ts"]);
  const symbolId = createNodeId("function", ["src/index.ts", "run", "3:1"]);
  const helperSymbolId = createNodeId("function", ["src/helper.ts", "formatName", "1:1"]);

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
    id: moduleId,
    kind: "module",
    name: "src/helper.ts",
    source: "project",
    filePath: "src/helper.ts",
    metadata: {
      specifier: "./helper.js",
    },
  });
  builder.addNode({
    id: symbolId,
    kind: "function",
    name: "run",
    source: "project",
    filePath: "src/index.ts",
    metadata: {
      exported: true,
    },
  });
  builder.addNode({
    id: helperSymbolId,
    kind: "function",
    name: "formatName",
    source: "project",
    filePath: "src/helper.ts",
    metadata: {
      exported: true,
    },
  });
  builder.addEdge({
    id: createEdgeId("CONTAINS", repositoryId, fileId),
    kind: "CONTAINS",
    fromId: repositoryId,
    toId: fileId,
  });
  builder.addEdge({
    id: createEdgeId("IMPORTS", fileId, moduleId),
    kind: "IMPORTS",
    fromId: fileId,
    toId: moduleId,
    metadata: {
      specifier: "./helper.js",
      importKind: "named",
    },
  });
  builder.addEdge({
    id: createEdgeId("EXPORTS", fileId, symbolId),
    kind: "EXPORTS",
    fromId: fileId,
    toId: symbolId,
    metadata: {
      exportKind: "named",
    },
  });
  builder.addEdge({
    id: createEdgeId("CALLS", symbolId, helperSymbolId, "formatName"),
    kind: "CALLS",
    fromId: symbolId,
    toId: helperSymbolId,
    metadata: {
      callee: "formatName",
      resolution: "imported-function",
    },
  });

  const graph = builder.toGraph("F:/repo");
  const traces = traceSymbols(graph, "run");
  const markdown = renderMarkdownSymbolTrace(graph, "run");

  assert.equal(listCalls(graph).length, 1);
  assert.equal(traces.length, 1);
  assert.equal(traces[0]?.symbol.name, "run");
  assert.equal(traces[0]?.file?.filePath, "src/index.ts");
  assert.equal(traces[0]?.imports.length, 1);
  assert.equal(traces[0]?.exports.length, 1);
  assert.equal(traces[0]?.callsOut.length, 1);
  assert.equal(traces[0]?.calledBy.length, 0);
  assert.deepEqual(traces[0]?.relatedModules.map((node) => node.name), ["src/helper.ts"]);
  assert.match(markdown, /^# Trace/m);
  assert.match(markdown, /Query: `run`/);
  assert.match(markdown, /\| src\/index\.ts \| module:src\/helper\.ts \| \.\/helper\.js \| named \|/);
  assert.match(markdown, /\| src\/index\.ts \| function:run \|  \| named \|/);
  assert.match(markdown, /^### Calls Out/m);
  assert.match(markdown, /\| function:run \| function:formatName \| formatName \| imported-function \|/);
  assert.match(markdown, /^### Called By/m);
  assert.match(markdown, /No incoming calls found\./);
});
