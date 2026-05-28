# CodeMind Graph

A local-first code knowledge graph and read-only MCP server that helps AI coding agents understand, query, and maintain large repositories.

> Stop feeding agents raw files. Give them a code graph.

## Positioning

CodeMind Graph is an AI-native knowledge layer for coding agents. It turns a repository into a deterministic symbol graph, dependency graph, and queryable architecture map.

The v0.1 target is intentionally narrow:

- TypeScript-first repository scanner
- Symbol graph and dependency graph model
- CLI-first deterministic queries
- Read-only MCP server
- Local-first SQLite storage
- Persistent project context for long-running Codex sessions

## Workspace

Primary local workspace:

```text
F:\Codex Projects\codemind-graph
```

Open with Codex Desktop:

```powershell
codex app "F:\Codex Projects\codemind-graph"
```

Resume the engineering session:

```powershell
codex resume "Inspect codemind-graph repo" -C "F:\Codex Projects\codemind-graph"
```

## Development

Install dependencies:

```powershell
pnpm install
```

Run checks:

```powershell
pnpm typecheck
pnpm test
pnpm build
```

