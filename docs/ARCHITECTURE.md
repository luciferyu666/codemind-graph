# Architecture

CodeMind Graph uses a local-first, MCP-native architecture.

## Layers

1. Parsing layer: TypeScript Compiler API first, with future Tree-sitter and LSP integration.
2. Graph storage layer: local SQLite plus FTS in the MVP storage plan. FTS is for full-text symbol lookup, not semantic search.
3. Semantic indexing layer: symbol graph with modules, classes, functions, imports, calls, and references.
4. Integration layer: CLI and read-only MCP server.

## Development Harness vs Product Interfaces

- Codex App: persistent engineering session, diff review, and project-level context.
- VS Code: human-in-the-loop IDE.
- PowerShell: Windows native command runner.
- GitHub: source of truth after remote publication.
- `codemind` CLI: product command line interface.
- Read-only MCP server: product integration interface for AI agents.

## Packages

- `packages/core`: graph schema, store contracts, query model.
- `packages/adapter-typescript`: TypeScript symbol extraction.
- `packages/cli`: `codemind` command line entry point.
- `packages/mcp-server`: read-only MCP tools.

## Non-goals for v0.1

- Web dashboard
- Write-capable MCP tools
- Natural-language QA
- Cloud sync
- Deep Python analysis
- Exposing engineering session notes through MCP tools
