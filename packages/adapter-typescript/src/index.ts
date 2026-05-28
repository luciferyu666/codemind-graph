import { access, readdir } from "node:fs/promises";
import path from "node:path";
import {
  createEdgeId,
  createNodeId,
  GraphBuilder,
  type CodeGraph,
  type GraphEdge,
  type GraphMetadata,
  type GraphNode,
  type GraphNodeId,
  type GraphNodeKind,
  type SourceLocation,
  type SourcePosition,
} from "@codemind/core";
import ts from "typescript";

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

const DEFAULT_EXCLUDED_DIRECTORIES = new Set([
  ".codemind",
  ".git",
  "coverage",
  "dist",
  "node_modules",
]);

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

  const diagnostics = [
    ...project.diagnostics,
    ...ts.getPreEmitDiagnostics(program).map(formatDiagnostic),
  ];

  return {
    rootDir: normalizePath(rootDir),
    graph: builder.toGraph(rootDir, {
      language: "typescript",
      adapter: "@codemind/adapter-typescript",
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
    builder.addNode(moduleNode);
    builder.addEdge(createGraphEdge("EXPORTS", fileNodeId, moduleNode.id, sourceFile, node, relativeFilePath, {
      specifier: node.moduleSpecifier.text,
      exportKind: "re-export",
    }));
  }
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
      language: "typescript",
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
