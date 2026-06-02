import { access, readdir } from "node:fs/promises";
import path from "node:path";
import {
  createEdgeId,
  createNodeId,
  GraphBuilder,
  type CodeGraph,
  type GraphEdge,
  type GraphIndexCapability,
  type GraphMetadata,
  type GraphNode,
  type GraphNodeId,
  type GraphNodeKind,
  type SourceLocation,
  type SourcePosition,
} from "@codemind/core";
import ts from "typescript";

export const TYPESCRIPT_ADAPTER_NAME = "@codemind/adapter-typescript";
export const TYPESCRIPT_ADAPTER_VERSION = "0.1.2";
export const TYPESCRIPT_ADAPTER_LANGUAGE = "typescript";
export const TYPESCRIPT_ADAPTER_CAPABILITIES = [
  "symbols",
  "imports",
  "exports",
  "calls",
  "references",
] as const satisfies readonly GraphIndexCapability[];

export interface TypeScriptExtractionOptions {
  readonly rootDir: string;
  readonly tsconfigPath?: string;
  readonly includeDeclarationFiles?: boolean;
}

export interface TypeScriptExtractionResult {
  readonly rootDir: string;
  readonly graph: CodeGraph;
  readonly sourceFiles: readonly string[];
  readonly diagnostics: readonly string[];
}

interface ProjectConfig {
  readonly rootDir: string;
  readonly compilerOptions: ts.CompilerOptions;
  readonly rootNames: readonly string[];
  readonly diagnostics: readonly string[];
}

interface SymbolNodeOptions {
  readonly kind: GraphNodeKind;
  readonly name: string;
  readonly sourceFile: ts.SourceFile;
  readonly node: ts.Node;
  readonly fileNodeId: GraphNodeId;
  readonly relativeFilePath: string;
  readonly isExported: boolean;
  readonly metadata?: GraphMetadata;
}

interface DeclarationContext {
  readonly className?: string;
  readonly exportedVariableStatement?: boolean;
}

interface CallVisitContext {
  readonly className?: string;
  readonly caller?: GraphNode;
}

interface SymbolIndex {
  readonly symbolsByFileAndName: ReadonlyMap<string, readonly GraphNode[]>;
  readonly exportedSymbolsByFileAndName: ReadonlyMap<string, GraphNode>;
  readonly fileNodesByPath: ReadonlyMap<string, GraphNode>;
}

interface ImportBinding {
  readonly importedName: string;
  readonly moduleFilePath: string | undefined;
  readonly kind: "default" | "named" | "namespace";
  readonly isTypeOnly: boolean;
}

interface ResolvedGraphTarget {
  readonly node: GraphNode;
  readonly resolution: string;
}

const DEFAULT_EXCLUDED_DIRECTORIES = new Set([
  ".codemind",
  ".git",
  "coverage",
  "dist",
  "node_modules",
]);

const REFERENCE_TARGET_NODE_KINDS = [
  "function",
  "class",
  "interface",
  "type",
  "enum",
  "variable",
  "method",
  "property",
] as const satisfies readonly GraphNodeKind[];

export async function extractTypeScriptGraph(
  options: TypeScriptExtractionOptions,
): Promise<TypeScriptExtractionResult> {
  const rootDir = path.resolve(options.rootDir);
  const project = await loadProjectConfig(rootDir, options.tsconfigPath);
  const compilerOptions = {
    ...project.compilerOptions,
    noEmit: true,
  };
  const program = ts.createProgram({
    rootNames: [...project.rootNames],
    options: compilerOptions,
  });
  const builder = new GraphBuilder();
  const sourceFiles = program
    .getSourceFiles()
    .filter((sourceFile) => isProjectSourceFile(rootDir, sourceFile, options.includeDeclarationFiles === true))
    .sort((left, right) => normalizePath(path.relative(rootDir, left.fileName)).localeCompare(
      normalizePath(path.relative(rootDir, right.fileName)),
    ));

  const repositoryNode = createRepositoryNode(rootDir);
  builder.addNode(repositoryNode);

  for (const sourceFile of sourceFiles) {
    extractSourceFile(builder, rootDir, sourceFile, compilerOptions, repositoryNode.id);
  }

  const symbolIndex = buildSymbolIndex(builder.toGraph(rootDir));
  for (const sourceFile of sourceFiles) {
    extractCalls(builder, rootDir, sourceFile, compilerOptions, symbolIndex);
  }

  for (const sourceFile of sourceFiles) {
    extractReferences(builder, rootDir, sourceFile, compilerOptions, symbolIndex);
  }

  const diagnostics = [
    ...project.diagnostics,
    ...ts.getPreEmitDiagnostics(program).map(formatDiagnostic),
  ];

  return {
    rootDir: normalizePath(rootDir),
    graph: builder.toGraph(rootDir, {
      language: TYPESCRIPT_ADAPTER_LANGUAGE,
      adapter: TYPESCRIPT_ADAPTER_NAME,
      adapterVersion: TYPESCRIPT_ADAPTER_VERSION,
      capabilities: TYPESCRIPT_ADAPTER_CAPABILITIES,
    }),
    sourceFiles: sourceFiles.map((sourceFile) => normalizePath(path.relative(rootDir, sourceFile.fileName))),
    diagnostics,
  };
}

async function loadProjectConfig(rootDir: string, tsconfigPath?: string): Promise<ProjectConfig> {
  const configPath = tsconfigPath === undefined ? path.join(rootDir, "tsconfig.json") : path.resolve(rootDir, tsconfigPath);
  const hasConfig = await pathExists(configPath);

  if (hasConfig) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error !== undefined) {
      return {
        rootDir,
        compilerOptions: defaultCompilerOptions(),
        rootNames: await scanTypeScriptFiles(rootDir),
        diagnostics: [formatDiagnostic(configFile.error)],
      };
    }

    const parsed = ts.parseJsonConfigFileContent(
      configFile.config as Record<string, unknown>,
      ts.sys,
      path.dirname(configPath),
      defaultCompilerOptions(),
      configPath,
    );
    const rootNames = parsed.fileNames.length > 0 ? parsed.fileNames : await scanTypeScriptFiles(rootDir);

    return {
      rootDir,
      compilerOptions: parsed.options,
      rootNames,
      diagnostics: parsed.errors.map(formatDiagnostic),
    };
  }

  return {
    rootDir,
    compilerOptions: defaultCompilerOptions(),
    rootNames: await scanTypeScriptFiles(rootDir),
    diagnostics: [],
  };
}

function defaultCompilerOptions(): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    strict: true,
    skipLibCheck: true,
  };
}

async function scanTypeScriptFiles(rootDir: string): Promise<readonly string[]> {
  const files: string[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!DEFAULT_EXCLUDED_DIRECTORIES.has(entry.name)) {
          await visit(entryPath);
        }
        continue;
      }

      if (entry.isFile() && isTypeScriptSourcePath(entry.name)) {
        files.push(entryPath);
      }
    }
  }

  await visit(rootDir);
  return files.sort((left, right) => normalizePath(left).localeCompare(normalizePath(right)));
}

function extractSourceFile(
  builder: GraphBuilder,
  rootDir: string,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  repositoryNodeId: GraphNodeId,
): void {
  const relativeFilePath = normalizePath(path.relative(rootDir, sourceFile.fileName));
  const fileNode = createFileNode(relativeFilePath, sourceFile);
  builder.addNode(fileNode);
  builder.addEdge(createGraphEdge("CONTAINS", repositoryNodeId, fileNode.id, sourceFile, sourceFile, relativeFilePath));

  sourceFile.forEachChild((node) => {
    extractImportOrExport(builder, rootDir, sourceFile, compilerOptions, fileNode.id, relativeFilePath, node);
  });

  visitDeclarations(sourceFile, (node, context) => {
    const symbolOptions = getSymbolNodeOptions(node, sourceFile, fileNode.id, relativeFilePath, context);
    if (symbolOptions !== undefined) {
      addSymbolNode(builder, symbolOptions);
    }
  });
}

function extractImportOrExport(
  builder: GraphBuilder,
  rootDir: string,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  fileNodeId: GraphNodeId,
  relativeFilePath: string,
  node: ts.Node,
): void {
  if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
    const moduleNode = createModuleNode(rootDir, sourceFile.fileName, node.moduleSpecifier.text, compilerOptions);
    builder.addNode(moduleNode);
    builder.addEdge(createGraphEdge("IMPORTS", fileNodeId, moduleNode.id, sourceFile, node, relativeFilePath, {
      specifier: node.moduleSpecifier.text,
      importKind: importKindForDeclaration(node),
    }));
    return;
  }

  if (ts.isExportDeclaration(node) && node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier)) {
    const moduleNode = createModuleNode(rootDir, sourceFile.fileName, node.moduleSpecifier.text, compilerOptions);
    const exportNames = exportNamesForDeclaration(node);
    builder.addNode(moduleNode);
    builder.addEdge(createGraphEdge("EXPORTS", fileNodeId, moduleNode.id, sourceFile, node, relativeFilePath, {
      specifier: node.moduleSpecifier.text,
      exportKind: exportKindForDeclaration(node),
      ...(exportNames.length === 0 ? {} : { exportNames }),
    }));
  }
}

function extractCalls(
  builder: GraphBuilder,
  rootDir: string,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  symbolIndex: SymbolIndex,
): void {
  const relativeFilePath = normalizePath(path.relative(rootDir, sourceFile.fileName));
  const importBindings = collectImportBindings(rootDir, sourceFile, compilerOptions);

  function visit(node: ts.Node, context: CallVisitContext): void {
    const target = context.caller === undefined
      ? undefined
      : resolveCallLikeTarget(node, relativeFilePath, context, importBindings, symbolIndex, sourceFile);

    if (target !== undefined && context.caller !== undefined) {
      builder.addEdge(createGraphEdge("CALLS", context.caller.id, target.node.id, sourceFile, node, relativeFilePath, {
        callee: target.callee,
        resolution: target.resolution,
      }));
    }

    const childContext = contextForCallChildren(node, context, relativeFilePath, symbolIndex);
    node.forEachChild((child) => {
      visit(child, childContext);
    });
  }

  sourceFile.forEachChild((node) => {
    visit(node, {});
  });
}

function extractReferences(
  builder: GraphBuilder,
  rootDir: string,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  symbolIndex: SymbolIndex,
): void {
  const relativeFilePath = normalizePath(path.relative(rootDir, sourceFile.fileName));
  const importBindings = collectImportBindings(rootDir, sourceFile, compilerOptions);
  const fileNode = symbolIndex.fileNodesByPath.get(relativeFilePath);

  if (fileNode === undefined) {
    return;
  }

  sourceFile.forEachChild((node) => {
    addExportDeclarationReferences(builder, rootDir, sourceFile, compilerOptions, relativeFilePath, fileNode, importBindings, symbolIndex, node);
  });

  function visit(node: ts.Node, context: CallVisitContext): void {
    const referencer = context.caller ?? fileNode;
    const target = resolveReferenceTarget(node, relativeFilePath, context, importBindings, symbolIndex);

    if (referencer !== undefined && target !== undefined && target.node.id !== referencer.id) {
      builder.addEdge(createGraphEdge("REFERENCES", referencer.id, target.node.id, sourceFile, node, relativeFilePath, {
        reference: referenceTextForNode(node, sourceFile),
        resolution: target.resolution,
      }));
    }

    const childContext = contextForCallChildren(node, context, relativeFilePath, symbolIndex);
    node.forEachChild((child) => {
      visit(child, childContext);
    });
  }

  sourceFile.forEachChild((node) => {
    visit(node, {});
  });
}

function collectImportBindings(
  rootDir: string,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
): ReadonlyMap<string, ImportBinding> {
  const bindings = new Map<string, ImportBinding>();

  sourceFile.forEachChild((node) => {
    if (!ts.isImportDeclaration(node) || !ts.isStringLiteral(node.moduleSpecifier)) {
      return;
    }

    const moduleFilePath = resolveProjectModuleFilePath(rootDir, sourceFile.fileName, node.moduleSpecifier.text, compilerOptions);
    const importClause = node.importClause;
    if (importClause === undefined) {
      return;
    }

    if (importClause.name !== undefined) {
      bindings.set(importClause.name.text, {
        importedName: "default",
        moduleFilePath,
        kind: "default",
        isTypeOnly: importClause.isTypeOnly,
      });
    }

    const namedBindings = importClause.namedBindings;
    if (namedBindings === undefined) {
      return;
    }

    if (ts.isNamespaceImport(namedBindings)) {
      bindings.set(namedBindings.name.text, {
        importedName: "*",
        moduleFilePath,
        kind: "namespace",
        isTypeOnly: importClause.isTypeOnly,
      });
      return;
    }

    for (const element of namedBindings.elements) {
      bindings.set(element.name.text, {
        importedName: element.propertyName?.text ?? element.name.text,
        moduleFilePath,
        kind: "named",
        isTypeOnly: importClause.isTypeOnly || element.isTypeOnly,
      });
    }
  });

  return bindings;
}

function visitDeclarations(sourceFile: ts.SourceFile, onDeclaration: (node: ts.Node, context: DeclarationContext) => void): void {
  function visit(node: ts.Node, context: DeclarationContext): void {
    onDeclaration(node, context);
    const childContext = contextForChildren(node, context);
    node.forEachChild((child) => {
      visit(child, childContext);
    });
  }

  sourceFile.forEachChild((node) => {
    visit(node, {});
  });
}

function contextForChildren(node: ts.Node, context: DeclarationContext): DeclarationContext {
  let nextContext = context;

  if (ts.isClassDeclaration(node) && node.name !== undefined) {
    nextContext = {
      ...nextContext,
      className: node.name.text,
    };
  }

  if (ts.isVariableStatement(node)) {
    nextContext = {
      ...nextContext,
      exportedVariableStatement: isExported(node),
    };
  }

  return nextContext;
}

function contextForCallChildren(
  node: ts.Node,
  context: CallVisitContext,
  relativeFilePath: string,
  symbolIndex: SymbolIndex,
): CallVisitContext {
  let nextContext = context;

  if (ts.isClassDeclaration(node) && node.name !== undefined) {
    const caller = findSymbolByFileAndName(symbolIndex, relativeFilePath, node.name.text, ["class"]);
    nextContext = {
      ...nextContext,
      className: node.name.text,
      ...(caller === undefined || context.caller !== undefined ? {} : { caller }),
    };
  }

  if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
    const caller = findSymbolByFileAndName(symbolIndex, relativeFilePath, node.name.text, ["function"]);
    nextContext = caller === undefined ? nextContext : {
      ...nextContext,
      caller,
    };
  }

  if (ts.isMethodDeclaration(node) && node.name !== undefined && ts.isIdentifier(node.name)) {
    const methodName = nextContext.className === undefined ? node.name.text : `${nextContext.className}.${node.name.text}`;
    const caller = findSymbolByFileAndName(symbolIndex, relativeFilePath, methodName, ["method"]);
    nextContext = caller === undefined ? nextContext : {
      ...nextContext,
      caller,
    };
  }

  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && context.caller === undefined) {
    const caller = findSymbolByFileAndName(symbolIndex, relativeFilePath, node.name.text, ["variable"]);
    nextContext = caller === undefined ? nextContext : {
      ...nextContext,
      caller,
    };
  }

  return nextContext;
}

function buildSymbolIndex(graph: CodeGraph): SymbolIndex {
  const symbolsByFileAndName = new Map<string, GraphNode[]>();
  const exportedSymbolsByFileAndName = new Map<string, GraphNode>();
  const fileNodesByPath = new Map<string, GraphNode>();

  for (const node of graph.nodes) {
    if (node.kind === "file") {
      const filePath = node.filePath ?? node.name;
      fileNodesByPath.set(normalizePath(filePath), node);
      continue;
    }

    if (!isSymbolLikeNode(node)) {
      continue;
    }

    const filePath = node.filePath ?? node.location?.filePath;
    if (filePath === undefined) {
      continue;
    }

    const key = symbolIndexKey(filePath, node.name);
    const existing = symbolsByFileAndName.get(key) ?? [];
    symbolsByFileAndName.set(key, [...existing, node]);
  }

  for (const edge of graph.edges) {
    if (edge.kind !== "EXPORTS") {
      continue;
    }

    const fromNode = graph.nodes.find((node) => node.id === edge.fromId);
    const toNode = graph.nodes.find((node) => node.id === edge.toId);
    if (fromNode?.kind !== "file" || toNode === undefined || !isSymbolLikeNode(toNode)) {
      continue;
    }

    const filePath = fromNode.filePath ?? fromNode.name;
    exportedSymbolsByFileAndName.set(symbolIndexKey(filePath, toNode.name), toNode);

    if (edge.metadata?.exportKind === "default") {
      exportedSymbolsByFileAndName.set(symbolIndexKey(filePath, "default"), toNode);
    }
  }

  return {
    symbolsByFileAndName,
    exportedSymbolsByFileAndName,
    fileNodesByPath,
  };
}

function resolveCallLikeTarget(
  node: ts.Node,
  relativeFilePath: string,
  context: CallVisitContext,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
  sourceFile: ts.SourceFile,
): { readonly node: GraphNode; readonly resolution: string; readonly callee: string } | undefined {
  if (ts.isCallExpression(node)) {
    const target = resolveCallTarget(node, relativeFilePath, context, importBindings, symbolIndex);
    return target === undefined ? undefined : {
      ...target,
      callee: node.expression.getText(sourceFile),
    };
  }

  if (ts.isNewExpression(node)) {
    const target = resolveConstructorTarget(node, relativeFilePath, importBindings, symbolIndex);
    return target === undefined ? undefined : {
      ...target,
      callee: `new ${node.expression.getText(sourceFile)}`,
    };
  }

  return undefined;
}

function resolveCallTarget(
  callExpression: ts.CallExpression,
  relativeFilePath: string,
  context: CallVisitContext,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const expression = callExpression.expression;

  if (ts.isIdentifier(expression)) {
    return resolveIdentifierCallTarget(expression.text, relativeFilePath, importBindings, symbolIndex);
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return resolvePropertyAccessCallTarget(expression, relativeFilePath, context, importBindings, symbolIndex);
  }

  return undefined;
}

function resolveIdentifierCallTarget(
  localName: string,
  relativeFilePath: string,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const binding = importBindings.get(localName);
  if (binding !== undefined && !binding.isTypeOnly && binding.moduleFilePath !== undefined && binding.kind !== "namespace") {
    const imported = findImportedSymbol(symbolIndex, binding.moduleFilePath, binding, localName);
    if (imported !== undefined && isCallableTargetNode(imported)) {
      return {
        node: imported,
        resolution: "imported-function",
      };
    }
  }

  const sameFile = findSymbolByFileAndName(symbolIndex, relativeFilePath, localName, ["function", "method", "variable"]);
  if (sameFile !== undefined) {
    return {
      node: sameFile,
      resolution: "same-file-function",
    };
  }

  return undefined;
}

function resolvePropertyAccessCallTarget(
  expression: ts.PropertyAccessExpression,
  relativeFilePath: string,
  context: CallVisitContext,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const propertyName = expression.name.text;

  if (expression.expression.kind === ts.SyntaxKind.ThisKeyword && context.className !== undefined) {
    const method = findSymbolByFileAndName(symbolIndex, relativeFilePath, `${context.className}.${propertyName}`, ["method"]);
    if (method !== undefined) {
      return {
        node: method,
        resolution: "same-class-method",
      };
    }
  }

  const namespaceTarget = resolveNamespaceCallTarget(expression, importBindings, symbolIndex);
  if (namespaceTarget !== undefined) {
    return namespaceTarget;
  }

  const classReference = classReferenceForPropertyBase(expression.expression);
  if (classReference === undefined) {
    return undefined;
  }

  const binding = importBindings.get(classReference.className);
  if (binding !== undefined && !binding.isTypeOnly && binding.moduleFilePath !== undefined && binding.kind !== "namespace") {
    const method = findSymbolByFileAndName(
      symbolIndex,
      binding.moduleFilePath,
      `${binding.importedName}.${propertyName}`,
      ["method"],
    );
    if (method !== undefined) {
      return {
        node: method,
        resolution: classReference.isChained ? "imported-chained-method" : "imported-method",
      };
    }
  }

  const sameFileMethod = findSymbolByFileAndName(symbolIndex, relativeFilePath, `${classReference.className}.${propertyName}`, ["method"]);
  if (sameFileMethod !== undefined) {
    return {
      node: sameFileMethod,
      resolution: classReference.isChained ? "same-file-chained-method" : "same-file-method",
    };
  }

  return undefined;
}

function resolveNamespaceCallTarget(
  expression: ts.PropertyAccessExpression,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const propertyName = expression.name.text;

  if (ts.isIdentifier(expression.expression)) {
    const binding = importBindings.get(expression.expression.text);
    if (binding?.kind !== "namespace" || binding.isTypeOnly || binding.moduleFilePath === undefined) {
      return undefined;
    }

    const exported = findExportedSymbolByFileAndName(symbolIndex, binding.moduleFilePath, propertyName);
    if (exported !== undefined && isCallableTargetNode(exported)) {
      return {
        node: exported,
        resolution: "namespace-function",
      };
    }
  }

  if (ts.isPropertyAccessExpression(expression.expression) && ts.isIdentifier(expression.expression.expression)) {
    const binding = importBindings.get(expression.expression.expression.text);
    if (binding?.kind !== "namespace" || binding.isTypeOnly || binding.moduleFilePath === undefined) {
      return undefined;
    }

    const method = findSymbolByFileAndName(
      symbolIndex,
      binding.moduleFilePath,
      `${expression.expression.name.text}.${propertyName}`,
      ["method"],
    );
    if (method !== undefined) {
      return {
        node: method,
        resolution: "namespace-method",
      };
    }
  }

  return undefined;
}

function resolveConstructorTarget(
  expression: ts.NewExpression,
  relativeFilePath: string,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  if (ts.isIdentifier(expression.expression)) {
    const className = expression.expression.text;
    const binding = importBindings.get(className);

    if (binding !== undefined && !binding.isTypeOnly && binding.moduleFilePath !== undefined && binding.kind !== "namespace") {
      const imported = findImportedClassSymbol(symbolIndex, binding.moduleFilePath, binding, className);
      if (imported !== undefined) {
        return {
          node: imported,
          resolution: "imported-constructor",
        };
      }
    }

    const sameFile = findSymbolByFileAndName(symbolIndex, relativeFilePath, className, ["class"]);
    if (sameFile !== undefined) {
      return {
        node: sameFile,
        resolution: "same-file-constructor",
      };
    }
  }

  if (ts.isPropertyAccessExpression(expression.expression) && ts.isIdentifier(expression.expression.expression)) {
    const binding = importBindings.get(expression.expression.expression.text);
    if (binding?.kind === "namespace" && !binding.isTypeOnly && binding.moduleFilePath !== undefined) {
      const exported = findExportedSymbolByFileAndName(symbolIndex, binding.moduleFilePath, expression.expression.name.text);
      if (exported?.kind === "class") {
        return {
          node: exported,
          resolution: "namespace-constructor",
        };
      }
    }
  }

  return undefined;
}

function classReferenceForPropertyBase(expression: ts.Expression): { readonly className: string; readonly isChained: boolean } | undefined {
  if (ts.isIdentifier(expression)) {
    return {
      className: expression.text,
      isChained: false,
    };
  }

  if (ts.isNewExpression(expression) && ts.isIdentifier(expression.expression)) {
    return {
      className: expression.expression.text,
      isChained: false,
    };
  }

  if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression)) {
    const baseReference = classReferenceForPropertyBase(expression.expression.expression);
    return baseReference === undefined ? undefined : {
      className: baseReference.className,
      isChained: true,
    };
  }

  return undefined;
}

function addExportDeclarationReferences(
  builder: GraphBuilder,
  rootDir: string,
  sourceFile: ts.SourceFile,
  compilerOptions: ts.CompilerOptions,
  relativeFilePath: string,
  fileNode: GraphNode,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
  node: ts.Node,
): void {
  if (!ts.isExportDeclaration(node) || node.exportClause === undefined || ts.isNamespaceExport(node.exportClause)) {
    return;
  }

  const moduleFilePath = node.moduleSpecifier !== undefined && ts.isStringLiteral(node.moduleSpecifier)
    ? resolveProjectModuleFilePath(rootDir, sourceFile.fileName, node.moduleSpecifier.text, compilerOptions)
    : undefined;

  for (const element of node.exportClause.elements) {
    const referencedName = element.propertyName?.text ?? element.name.text;
    const target = moduleFilePath === undefined
      ? resolveLocalOrImportedReferenceByName(referencedName, relativeFilePath, importBindings, symbolIndex)
      : findExportedSymbolByFileAndName(symbolIndex, moduleFilePath, referencedName);

    if (target === undefined || target.id === fileNode.id) {
      continue;
    }

    builder.addEdge(createGraphEdge("REFERENCES", fileNode.id, target.id, sourceFile, element, relativeFilePath, {
      reference: element.getText(sourceFile),
      resolution: moduleFilePath === undefined ? "export-symbol" : "re-export-symbol",
    }));
  }
}

function resolveReferenceTarget(
  node: ts.Node,
  relativeFilePath: string,
  context: CallVisitContext,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  if (ts.isIdentifier(node) && isReferenceIdentifier(node)) {
    return resolveIdentifierReferenceTarget(node.text, relativeFilePath, importBindings, symbolIndex);
  }

  if (ts.isPropertyAccessExpression(node)) {
    return resolvePropertyAccessReferenceTarget(node, relativeFilePath, context, importBindings, symbolIndex);
  }

  if (ts.isQualifiedName(node)) {
    return resolveQualifiedNameReferenceTarget(node, importBindings, symbolIndex);
  }

  return undefined;
}

function resolveIdentifierReferenceTarget(
  localName: string,
  relativeFilePath: string,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const imported = resolveImportedReferenceByName(localName, importBindings, symbolIndex);
  if (imported !== undefined) {
    return imported;
  }

  const sameFile = findSymbolByFileAndName(symbolIndex, relativeFilePath, localName, REFERENCE_TARGET_NODE_KINDS);
  if (sameFile !== undefined) {
    return {
      node: sameFile,
      resolution: "same-file-symbol",
    };
  }

  return undefined;
}

function resolveLocalOrImportedReferenceByName(
  localName: string,
  relativeFilePath: string,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): GraphNode | undefined {
  return resolveIdentifierReferenceTarget(localName, relativeFilePath, importBindings, symbolIndex)?.node;
}

function resolveImportedReferenceByName(
  localName: string,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const binding = importBindings.get(localName);
  if (binding === undefined || binding.moduleFilePath === undefined || binding.kind === "namespace") {
    return undefined;
  }

  const imported = findImportedSymbol(symbolIndex, binding.moduleFilePath, binding, localName);
  if (imported === undefined) {
    return undefined;
  }

  return {
    node: imported,
    resolution: binding.isTypeOnly ? "type-imported-symbol" : "imported-symbol",
  };
}

function resolvePropertyAccessReferenceTarget(
  expression: ts.PropertyAccessExpression,
  relativeFilePath: string,
  context: CallVisitContext,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  const propertyName = expression.name.text;

  if (expression.expression.kind === ts.SyntaxKind.ThisKeyword && context.className !== undefined) {
    const method = findSymbolByFileAndName(symbolIndex, relativeFilePath, `${context.className}.${propertyName}`, ["method"]);
    if (method !== undefined) {
      return {
        node: method,
        resolution: "same-class-symbol",
      };
    }
  }

  const namespaceTarget = resolveNamespaceReferenceTarget(expression, importBindings, symbolIndex);
  if (namespaceTarget !== undefined) {
    return namespaceTarget;
  }

  const classReference = classReferenceForPropertyBase(expression.expression);
  if (classReference === undefined) {
    return undefined;
  }

  const binding = importBindings.get(classReference.className);
  if (binding !== undefined && binding.moduleFilePath !== undefined && binding.kind !== "namespace") {
    const method = findSymbolByFileAndName(
      symbolIndex,
      binding.moduleFilePath,
      `${binding.importedName}.${propertyName}`,
      ["method"],
    );
    if (method !== undefined) {
      return {
        node: method,
        resolution: classReference.isChained ? "imported-chained-symbol" : "imported-symbol-member",
      };
    }
  }

  const sameFileMethod = findSymbolByFileAndName(symbolIndex, relativeFilePath, `${classReference.className}.${propertyName}`, ["method"]);
  if (sameFileMethod !== undefined) {
    return {
      node: sameFileMethod,
      resolution: classReference.isChained ? "same-file-chained-symbol" : "same-file-symbol-member",
    };
  }

  return undefined;
}

function resolveNamespaceReferenceTarget(
  expression: ts.PropertyAccessExpression,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  if (!ts.isIdentifier(expression.expression)) {
    return undefined;
  }

  const binding = importBindings.get(expression.expression.text);
  if (binding?.kind !== "namespace" || binding.moduleFilePath === undefined) {
    return undefined;
  }

  const exported = findExportedSymbolByFileAndName(symbolIndex, binding.moduleFilePath, expression.name.text);
  if (exported === undefined) {
    return undefined;
  }

  return {
    node: exported,
    resolution: binding.isTypeOnly ? "type-namespace-symbol" : "namespace-symbol",
  };
}

function resolveQualifiedNameReferenceTarget(
  qualifiedName: ts.QualifiedName,
  importBindings: ReadonlyMap<string, ImportBinding>,
  symbolIndex: SymbolIndex,
): ResolvedGraphTarget | undefined {
  if (!ts.isIdentifier(qualifiedName.left)) {
    return undefined;
  }

  const binding = importBindings.get(qualifiedName.left.text);
  if (binding?.kind !== "namespace" || binding.moduleFilePath === undefined) {
    return undefined;
  }

  const exported = findExportedSymbolByFileAndName(symbolIndex, binding.moduleFilePath, qualifiedName.right.text);
  if (exported === undefined) {
    return undefined;
  }

  return {
    node: exported,
    resolution: binding.isTypeOnly ? "type-namespace-symbol" : "namespace-symbol",
  };
}

function isReferenceIdentifier(node: ts.Identifier): boolean {
  const parent = node.parent;

  if (parent === undefined) {
    return true;
  }

  if (
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    ts.isQualifiedName(parent) ||
    isDeclarationName(parent, node) ||
    isImportOrExportBindingIdentifier(parent, node)
  ) {
    return false;
  }

  if (
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    (ts.isEnumMember(parent) && parent.name === node)
  ) {
    return false;
  }

  return true;
}

function isDeclarationName(parent: ts.Node, node: ts.Identifier): boolean {
  return (
    (ts.isFunctionDeclaration(parent) && parent.name === node) ||
    (ts.isClassDeclaration(parent) && parent.name === node) ||
    (ts.isInterfaceDeclaration(parent) && parent.name === node) ||
    (ts.isTypeAliasDeclaration(parent) && parent.name === node) ||
    (ts.isEnumDeclaration(parent) && parent.name === node) ||
    (ts.isMethodDeclaration(parent) && parent.name === node) ||
    (ts.isPropertyDeclaration(parent) && parent.name === node) ||
    (ts.isParameter(parent) && parent.name === node) ||
    (ts.isVariableDeclaration(parent) && parent.name === node) ||
    (ts.isBindingElement(parent) && parent.name === node) ||
    (ts.isTypeParameterDeclaration(parent) && parent.name === node) ||
    (ts.isModuleDeclaration(parent) && parent.name === node)
  );
}

function isImportOrExportBindingIdentifier(parent: ts.Node, node: ts.Identifier): boolean {
  return (
    (ts.isImportClause(parent) && parent.name === node) ||
    (ts.isNamespaceImport(parent) && parent.name === node) ||
    (ts.isImportSpecifier(parent) && (parent.name === node || parent.propertyName === node)) ||
    (ts.isExportSpecifier(parent) && (parent.name === node || parent.propertyName === node)) ||
    (ts.isNamespaceExport(parent) && parent.name === node)
  );
}

function referenceTextForNode(node: ts.Node, sourceFile: ts.SourceFile): string {
  return ts.isIdentifier(node) ? node.text : node.getText(sourceFile);
}

function getSymbolNodeOptions(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  fileNodeId: GraphNodeId,
  relativeFilePath: string,
  context: DeclarationContext,
): SymbolNodeOptions | undefined {
  if (ts.isFunctionDeclaration(node) && node.name !== undefined) {
    return createSymbolNodeOptions("function", node.name.text, sourceFile, node, fileNodeId, relativeFilePath, isExported(node));
  }

  if (ts.isClassDeclaration(node) && node.name !== undefined) {
    return createSymbolNodeOptions("class", node.name.text, sourceFile, node, fileNodeId, relativeFilePath, isExported(node));
  }

  if (ts.isInterfaceDeclaration(node)) {
    return createSymbolNodeOptions("interface", node.name.text, sourceFile, node, fileNodeId, relativeFilePath, isExported(node));
  }

  if (ts.isTypeAliasDeclaration(node)) {
    return createSymbolNodeOptions("type", node.name.text, sourceFile, node, fileNodeId, relativeFilePath, isExported(node));
  }

  if (ts.isEnumDeclaration(node)) {
    return createSymbolNodeOptions("enum", node.name.text, sourceFile, node, fileNodeId, relativeFilePath, isExported(node));
  }

  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
    return createSymbolNodeOptions(
      "variable",
      node.name.text,
      sourceFile,
      node,
      fileNodeId,
      relativeFilePath,
      context.exportedVariableStatement === true,
    );
  }

  if (ts.isMethodDeclaration(node) && node.name !== undefined && ts.isIdentifier(node.name)) {
    const methodName = context.className === undefined ? node.name.text : `${context.className}.${node.name.text}`;
    return createSymbolNodeOptions("method", methodName, sourceFile, node, fileNodeId, relativeFilePath, false);
  }

  return undefined;
}

function createSymbolNodeOptions(
  kind: GraphNodeKind,
  name: string,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  fileNodeId: GraphNodeId,
  relativeFilePath: string,
  exported: boolean,
): SymbolNodeOptions {
  return {
    kind,
    name,
    sourceFile,
    node,
    fileNodeId,
    relativeFilePath,
    isExported: exported,
  };
}

function addSymbolNode(builder: GraphBuilder, options: SymbolNodeOptions): void {
  const start = positionForOffset(options.sourceFile, options.node.getStart(options.sourceFile));
  const node = createSymbolNode(options, start);

  builder.addNode(node);
  builder.addEdge(createGraphEdge("DEFINES", options.fileNodeId, node.id, options.sourceFile, options.node, options.relativeFilePath));

  if (options.isExported) {
    builder.addEdge(createGraphEdge("EXPORTS", options.fileNodeId, node.id, options.sourceFile, options.node, options.relativeFilePath, {
      exportKind: hasDefaultModifier(options.node) ? "default" : "named",
    }));
  }
}

function createRepositoryNode(rootDir: string): GraphNode {
  return {
    id: createNodeId("repository", [normalizePath(rootDir)]),
    kind: "repository",
    name: path.basename(rootDir),
    source: "project",
    filePath: ".",
  };
}

function createFileNode(relativeFilePath: string, sourceFile: ts.SourceFile): GraphNode {
  return {
    id: createNodeId("file", [relativeFilePath]),
    kind: "file",
    name: path.basename(relativeFilePath),
    source: "project",
    filePath: relativeFilePath,
    location: sourceLocation(sourceFile, sourceFile, relativeFilePath),
    metadata: {
      language: TYPESCRIPT_ADAPTER_LANGUAGE,
    },
  };
}

function createModuleNode(
  rootDir: string,
  containingFile: string,
  specifier: string,
  compilerOptions: ts.CompilerOptions,
): GraphNode {
  const resolved = ts.resolveModuleName(specifier, containingFile, compilerOptions, ts.sys).resolvedModule;
  const resolvedFileName = resolved?.resolvedFileName;
  const isProjectModule = resolvedFileName === undefined ? specifier.startsWith(".") : isPathInside(rootDir, resolvedFileName);
  const moduleName = resolvedFileName !== undefined && isProjectModule
    ? normalizePath(path.relative(rootDir, resolvedFileName))
    : specifier;

  return {
    id: createNodeId("module", [isProjectModule ? "project" : "external", moduleName]),
    kind: "module",
    name: moduleName,
    source: isProjectModule ? "project" : "external",
    ...(isProjectModule ? { filePath: moduleName } : {}),
    metadata: {
      specifier,
    },
  };
}

function createSymbolNode(options: SymbolNodeOptions, start: SourcePosition): GraphNode {
  return {
    id: createNodeId(options.kind, [options.relativeFilePath, options.name, `${start.line}:${start.column}`]),
    kind: options.kind,
    name: options.name,
    source: "project",
    filePath: options.relativeFilePath,
    location: sourceLocation(options.sourceFile, options.node, options.relativeFilePath),
    metadata: {
      exported: options.isExported,
      ...(options.metadata === undefined ? {} : options.metadata),
    },
  };
}

function createGraphEdge(
  kind: GraphEdge["kind"],
  fromId: GraphNodeId,
  toId: GraphNodeId,
  sourceFile: ts.SourceFile,
  node: ts.Node,
  relativeFilePath: string,
  metadata?: GraphMetadata,
): GraphEdge {
  const start = positionForOffset(sourceFile, node.getStart(sourceFile));
  const edge: GraphEdge = {
    id: createEdgeId(kind, fromId, toId, `${relativeFilePath}:${start.line}:${start.column}`),
    kind,
    fromId,
    toId,
    location: sourceLocation(sourceFile, node, relativeFilePath),
    ...(metadata === undefined ? {} : { metadata }),
  };

  return edge;
}

function sourceLocation(sourceFile: ts.SourceFile, node: ts.Node, relativeFilePath: string): SourceLocation {
  return {
    filePath: relativeFilePath,
    range: {
      start: positionForOffset(sourceFile, node.getStart(sourceFile)),
      end: positionForOffset(sourceFile, node.getEnd()),
    },
  };
}

function positionForOffset(sourceFile: ts.SourceFile, offset: number): SourcePosition {
  const position = sourceFile.getLineAndCharacterOfPosition(offset);
  return {
    line: position.line + 1,
    column: position.character + 1,
    offset,
  };
}

function importKindForDeclaration(node: ts.ImportDeclaration): string {
  if (node.importClause === undefined) {
    return "side-effect";
  }

  if (node.importClause.isTypeOnly) {
    return "type";
  }

  if (node.importClause.namedBindings !== undefined && ts.isNamespaceImport(node.importClause.namedBindings)) {
    return "namespace";
  }

  if (node.importClause.name !== undefined && node.importClause.namedBindings !== undefined) {
    return "default-and-named";
  }

  if (node.importClause.name !== undefined) {
    return "default";
  }

  return "named";
}

function exportKindForDeclaration(node: ts.ExportDeclaration): string {
  if (node.isTypeOnly) {
    return "type-re-export";
  }

  if (node.exportClause === undefined) {
    return "export-all";
  }

  if (ts.isNamespaceExport(node.exportClause)) {
    return "namespace-re-export";
  }

  return "re-export";
}

function exportNamesForDeclaration(node: ts.ExportDeclaration): readonly string[] {
  if (node.exportClause === undefined) {
    return ["*"];
  }

  if (ts.isNamespaceExport(node.exportClause)) {
    return [`* as ${node.exportClause.name.text}`];
  }

  return node.exportClause.elements.map((element) => element.name.text).sort();
}

function isExported(node: ts.Node): boolean {
  return modifierKinds(node).includes(ts.SyntaxKind.ExportKeyword);
}

function hasDefaultModifier(node: ts.Node): boolean {
  return modifierKinds(node).includes(ts.SyntaxKind.DefaultKeyword);
}

function modifierKinds(node: ts.Node): readonly ts.SyntaxKind[] {
  if (!ts.canHaveModifiers(node)) {
    return [];
  }

  return (ts.getModifiers(node) ?? []).map((modifier) => modifier.kind);
}

function isProjectSourceFile(rootDir: string, sourceFile: ts.SourceFile, includeDeclarationFiles: boolean): boolean {
  if (!includeDeclarationFiles && sourceFile.isDeclarationFile) {
    return false;
  }

  if (!isPathInside(rootDir, sourceFile.fileName)) {
    return false;
  }

  const relativePath = normalizePath(path.relative(rootDir, sourceFile.fileName));
  return !relativePath.split("/").some((part) => DEFAULT_EXCLUDED_DIRECTORIES.has(part));
}

function resolveProjectModuleFilePath(
  rootDir: string,
  containingFile: string,
  specifier: string,
  compilerOptions: ts.CompilerOptions,
): string | undefined {
  const resolved = ts.resolveModuleName(specifier, containingFile, compilerOptions, ts.sys).resolvedModule;
  const resolvedFileName = resolved?.resolvedFileName;

  if (resolvedFileName === undefined || !isPathInside(rootDir, resolvedFileName)) {
    return undefined;
  }

  return normalizePath(path.relative(rootDir, resolvedFileName));
}

function findSymbolByFileAndName(
  symbolIndex: SymbolIndex,
  filePath: string,
  name: string,
  preferredKinds: readonly GraphNodeKind[],
): GraphNode | undefined {
  const candidates = symbolIndex.symbolsByFileAndName.get(symbolIndexKey(filePath, name)) ?? [];
  return preferredKinds
    .map((kind) => candidates.find((node) => node.kind === kind))
    .find((node): node is GraphNode => node !== undefined);
}

function findExportedSymbolByFileAndName(
  symbolIndex: SymbolIndex,
  filePath: string,
  name: string,
): GraphNode | undefined {
  return symbolIndex.exportedSymbolsByFileAndName.get(symbolIndexKey(filePath, name));
}

function findImportedSymbol(
  symbolIndex: SymbolIndex,
  filePath: string,
  binding: ImportBinding,
  localName: string,
): GraphNode | undefined {
  return findExportedSymbolByFileAndName(symbolIndex, filePath, binding.importedName)
    ?? (binding.kind === "default" ? findExportedSymbolByFileAndName(symbolIndex, filePath, localName) : undefined);
}

function findImportedClassSymbol(
  symbolIndex: SymbolIndex,
  filePath: string,
  binding: ImportBinding,
  localName: string,
): GraphNode | undefined {
  const imported = findImportedSymbol(symbolIndex, filePath, binding, localName);
  return imported?.kind === "class" ? imported : undefined;
}

function symbolIndexKey(filePath: string, name: string): string {
  return `${normalizePath(filePath)}:${name}`;
}

function isCallableTargetNode(node: GraphNode): boolean {
  return ["function", "method", "class", "variable"].includes(node.kind);
}

function isSymbolLikeNode(node: GraphNode): boolean {
  return (REFERENCE_TARGET_NODE_KINDS as readonly string[]).includes(node.kind);
}

function isPathInside(rootDir: string, targetPath: string): boolean {
  const relativePath = path.relative(rootDir, targetPath);
  return relativePath.length === 0 || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function isTypeScriptSourcePath(fileName: string): boolean {
  return (fileName.endsWith(".ts") || fileName.endsWith(".tsx")) && !fileName.endsWith(".d.ts");
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function formatDiagnostic(diagnostic: ts.Diagnostic): string {
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
  if (diagnostic.file === undefined || diagnostic.start === undefined) {
    return message;
  }

  const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  return `${normalizePath(diagnostic.file.fileName)}:${position.line + 1}:${position.character + 1} ${message}`;
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}
