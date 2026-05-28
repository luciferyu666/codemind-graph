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
