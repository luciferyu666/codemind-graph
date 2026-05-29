import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { extractTypeScriptGraph } from "../packages/adapter-typescript/dist/index.js";

test("extractTypeScriptGraph extracts files, symbols, imports, and exports", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-ts-"));

  try {
    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await writeFile(
      path.join(rootDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "NodeNext",
            moduleResolution: "NodeNext",
            strict: true,
          },
          include: ["src/**/*.ts"],
        },
        null,
        2,
      ),
    );
    await writeFile(
      path.join(rootDir, "src", "external.d.ts"),
      [
        'declare module "external-lib" {',
        "  export interface ExternalStats {",
        "    value: string;",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "user.ts"),
      [
        "export interface User {",
        "  id: string;",
        "}",
        "",
        "export class UserService {",
        "  find(id: string): User {",
        "    return { id };",
        "  }",
        "}",
        "",
        "export function createUser(id: string): User {",
        "  return { id };",
        "}",
        "",
        "export const localCounter = 0;",
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "index.ts"),
      [
        'import type { ExternalStats } from "external-lib";',
        'import { createUser, UserService } from "./user.js";',
        "",
        "export const apiName = createUser('demo').id;",
        "export type ApiStats = ExternalStats;",
        "export { UserService };",
        "",
      ].join("\n"),
    );

    const result = await extractTypeScriptGraph({ rootDir });
    const graph = result.graph;
    const nodesByName = new Set(graph.nodes.map((node) => `${node.kind}:${node.name}`));
    const importEdges = graph.edges.filter((edge) => edge.kind === "IMPORTS");
    const exportEdges = graph.edges.filter((edge) => edge.kind === "EXPORTS");

    assert.deepEqual(result.sourceFiles, ["src/index.ts", "src/user.ts"]);
    assert.equal(result.diagnostics.length, 0);
    assert.ok(nodesByName.has("file:index.ts"));
    assert.ok(nodesByName.has("file:user.ts"));
    assert.ok(nodesByName.has("interface:User"));
    assert.ok(nodesByName.has("class:UserService"));
    assert.ok(nodesByName.has("method:UserService.find"));
    assert.ok(nodesByName.has("function:createUser"));
    assert.ok(nodesByName.has("variable:apiName"));
    assert.ok(nodesByName.has("variable:localCounter"));
    assert.ok(nodesByName.has("type:ApiStats"));
    assert.ok(importEdges.some((edge) => edge.metadata?.specifier === "./user.js"));
    assert.ok(importEdges.some((edge) => edge.metadata?.specifier === "external-lib"));
    assert.ok(exportEdges.some((edge) => graph.nodes.find((node) => node.id === edge.toId)?.name === "createUser"));
    assert.ok(exportEdges.some((edge) => graph.nodes.find((node) => node.id === edge.toId)?.name === "apiName"));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("extractTypeScriptGraph covers rich import, re-export, class, and method fixtures", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "codemind-ts-fixtures-"));

  try {
    await mkdir(path.join(rootDir, "src"), { recursive: true });
    await writeTsConfig(rootDir);
    await writeFile(
      path.join(rootDir, "src", "external.d.ts"),
      [
        'declare module "external-lib" {',
        "  export const externalValue: number;",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "setup.ts"),
      ["export const setupFlag = true;", ""].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "models.ts"),
      [
        "export interface Report {",
        "  title: string;",
        "}",
        "",
        "export type ReportId = string;",
        "",
        "export enum ReportStatus {",
        '  Draft = "draft",',
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "math.ts"),
      [
        "export default function calculate(value: number): number {",
        "  return value * 2;",
        "}",
        "",
        "export function sum(left: number, right: number): number {",
        "  return left + right;",
        "}",
        "",
        "export interface NumericValue {",
        "  value: number;",
        "}",
        "",
        "export class Calculator {",
        "  constructor(private readonly factor = 2) {}",
        "",
        "  multiply(value: number): number {",
        "    return value * this.factor;",
        "  }",
        "",
        "  static create(): Calculator {",
        "    return new Calculator();",
        "  }",
        "}",
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "barrel.ts"),
      [
        'export { Calculator, sum } from "./math.js";',
        'export type { NumericValue } from "./math.js";',
        'export * from "./models.js";',
        "",
      ].join("\n"),
    );
    await writeFile(
      path.join(rootDir, "src", "consumer.ts"),
      [
        'import "./setup.js";',
        'import calculate, { Calculator, sum as add } from "./math.js";',
        'import type { NumericValue } from "./math.js";',
        'import * as models from "./models.js";',
        'import { externalValue } from "external-lib";',
        "",
        "export class ReportService {",
        "  build(value: NumericValue): models.Report {",
        "    const calculated = calculate(add(value.value, externalValue));",
        "    return { title: this.normalize(String(calculated)) };",
        "  }",
        "",
        "  private normalize(title: string): string {",
        "    return title.trim();",
        "  }",
        "",
        "  static create(): ReportService {",
        "    return new ReportService();",
        "  }",
        "}",
        "",
        "export const reportStatus = models.ReportStatus.Draft;",
        "export const calculator = Calculator.create();",
        "",
      ].join("\n"),
    );

    const result = await extractTypeScriptGraph({ rootDir });
    const graph = result.graph;

    assert.deepEqual(result.sourceFiles, [
      "src/barrel.ts",
      "src/consumer.ts",
      "src/math.ts",
      "src/models.ts",
      "src/setup.ts",
    ]);
    assert.equal(result.diagnostics.length, 0);

    assertSymbol(graph, "function", "calculate", { exported: true, filePath: "src/math.ts" });
    assertSymbol(graph, "function", "sum", { exported: true, filePath: "src/math.ts" });
    assertSymbol(graph, "interface", "NumericValue", { exported: true, filePath: "src/math.ts" });
    assertSymbol(graph, "class", "Calculator", { exported: true, filePath: "src/math.ts" });
    assertSymbol(graph, "method", "Calculator.multiply", { exported: false, filePath: "src/math.ts" });
    assertSymbol(graph, "method", "Calculator.create", { exported: false, filePath: "src/math.ts" });
    assertSymbol(graph, "class", "ReportService", { exported: true, filePath: "src/consumer.ts" });
    assertSymbol(graph, "method", "ReportService.build", { exported: false, filePath: "src/consumer.ts" });
    assertSymbol(graph, "method", "ReportService.normalize", { exported: false, filePath: "src/consumer.ts" });
    assertSymbol(graph, "method", "ReportService.create", { exported: false, filePath: "src/consumer.ts" });
    assertSymbol(graph, "enum", "ReportStatus", { exported: true, filePath: "src/models.ts" });

    assertImportEdge(graph, "src/consumer.ts", "./setup.js", {
      importKind: "side-effect",
      targetName: "src/setup.ts",
      targetSource: "project",
    });
    assertImportEdge(graph, "src/consumer.ts", "./math.js", {
      importKind: "default-and-named",
      targetName: "src/math.ts",
      targetSource: "project",
    });
    assertImportEdge(graph, "src/consumer.ts", "./math.js", {
      importKind: "type",
      targetName: "src/math.ts",
      targetSource: "project",
    });
    assertImportEdge(graph, "src/consumer.ts", "./models.js", {
      importKind: "namespace",
      targetName: "src/models.ts",
      targetSource: "project",
    });
    assertImportEdge(graph, "src/consumer.ts", "external-lib", {
      importKind: "named",
      targetName: "external-lib",
      targetSource: "external",
    });

    assertExportEdge(graph, "src/barrel.ts", "./math.js", {
      exportKind: "re-export",
      exportNames: ["Calculator", "sum"],
      targetName: "src/math.ts",
    });
    assertExportEdge(graph, "src/barrel.ts", "./math.js", {
      exportKind: "type-re-export",
      exportNames: ["NumericValue"],
      targetName: "src/math.ts",
    });
    assertExportEdge(graph, "src/barrel.ts", "./models.js", {
      exportKind: "export-all",
      exportNames: ["*"],
      targetName: "src/models.ts",
    });
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

async function writeTsConfig(rootDir) {
  await writeFile(
    path.join(rootDir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
        },
        include: ["src/**/*.ts"],
      },
      null,
      2,
    ),
  );
}

function assertSymbol(graph, kind, name, expected) {
  const node = graph.nodes.find((candidate) => candidate.kind === kind && candidate.name === name);

  assert.ok(node, `Expected ${kind}:${name}`);
  assert.equal(node.filePath, expected.filePath);
  assert.equal(node.metadata?.exported, expected.exported);
}

function assertImportEdge(graph, filePath, specifier, expected) {
  const edge = findFileEdge(graph, "IMPORTS", filePath, specifier, expected.importKind);
  const targetNode = getNode(graph, edge.toId);

  assert.equal(edge.metadata?.importKind, expected.importKind);
  assert.equal(targetNode.name, expected.targetName);
  assert.equal(targetNode.source, expected.targetSource);
}

function assertExportEdge(graph, filePath, specifier, expected) {
  const edge = findFileEdge(graph, "EXPORTS", filePath, specifier, expected.exportKind);
  const targetNode = getNode(graph, edge.toId);

  assert.equal(edge.metadata?.exportKind, expected.exportKind);
  assert.deepEqual(edge.metadata?.exportNames, expected.exportNames);
  assert.equal(targetNode.name, expected.targetName);
}

function findFileEdge(graph, kind, filePath, specifier, edgeKind) {
  const fileNode = graph.nodes.find((node) => node.kind === "file" && node.filePath === filePath);

  assert.ok(fileNode, `Expected file node ${filePath}`);

  const edge = graph.edges.find((candidate) => (
    candidate.kind === kind
    && candidate.fromId === fileNode.id
    && candidate.metadata?.specifier === specifier
    && (candidate.metadata?.importKind === edgeKind || candidate.metadata?.exportKind === edgeKind)
  ));

  assert.ok(edge, `Expected ${kind} edge from ${filePath} to ${specifier} with kind ${edgeKind}`);
  return edge;
}

function getNode(graph, nodeId) {
  const node = graph.nodes.find((candidate) => candidate.id === nodeId);

  assert.ok(node, `Expected node ${nodeId}`);
  return node;
}
