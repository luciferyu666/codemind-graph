# MCP Client Usage

This document explains how to connect an MCP client to CodeMind Graph's read-only stdio server.

CodeMind Graph MCP tools only read `.codemind/graph.json` inside the selected repository root. They do not write files, execute shell commands, install packages, run Git operations, mutate code, or expose engineering memory files.

## Prerequisites

From the repository root:

```powershell
pnpm install
pnpm build:packages
node packages/cli/dist/index.js index examples/ts-agent-workspace
```

Optional readiness checks:

```powershell
node packages/cli/dist/index.js health --root examples/ts-agent-workspace
node packages/cli/dist/index.js doctor --root examples/ts-agent-workspace
```

## Stdio Server Command

Use this command shape from an MCP client:

```json
{
  "command": "node",
  "args": [
    "F:/Codex Projects/codemind-graph/packages/cli/dist/index.js",
    "mcp",
    "start",
    "--root",
    "F:/Codex Projects/codemind-graph/examples/ts-agent-workspace"
  ]
}
```

Adjust both paths for your local clone and target repository.

Important: `codemind mcp start` intentionally writes no human-readable startup banner to stdout because stdout is the MCP protocol stream.

## Tools

### `find_symbol`

Find symbols by substring.

```json
{
  "query": "ContextPackBuilder"
}
```

Expected output:

- matching symbol rows
- location
- exported status
- graph freshness section

### `get_repo_map`

Return the deterministic Markdown repo map.

```json
{}
```

Expected output:

- Overview
- Freshness
- Files
- Symbols
- Imports
- Exports
- Calls
- Diagnostics

### `trace_symbol`

Trace a symbol to file-level dependency and call context.

```json
{
  "query": "buildDemoContext"
}
```

Expected output:

- symbol match
- imports
- exports
- Calls Out
- Called By
- related modules
- freshness status

### `explain_file`

Explain one indexed source file.

```json
{
  "path": "src/context-pack.ts"
}
```

Expected output:

- file overview
- symbols
- imports
- exports
- Calls Out
- Called By
- related modules
- diagnostics
- freshness status

## Optional Root And Graph Inputs

Each tool accepts optional `root` and `graph` values:

```json
{
  "query": "GraphStore",
  "root": "examples/ts-agent-workspace"
}
```

```json
{
  "query": "GraphStore",
  "graph": ".codemind/graph.json"
}
```

Both paths are constrained to the MCP server root. Path escape attempts are rejected.

## Read-only Safety Boundary

The v0.1.1 MCP server does not expose:

- write tools
- shell execution
- package installation
- Git commands
- source mutation
- `.env` access helpers
- engineering memory files such as `docs/SESSION_STATE.md`

## Troubleshooting

If a tool reports a missing graph file:

```powershell
node packages/cli/dist/index.js index <repo-root>
```

If freshness is `stale`:

```powershell
node packages/cli/dist/index.js index <repo-root>
```

If freshness is `unknown`, the graph may have been created before freshness metadata existed. Re-index with the current CLI.

If an MCP client cannot start the server, first verify the command directly:

```powershell
node packages/cli/dist/index.js mcp start --root examples/ts-agent-workspace
```

This command waits for MCP protocol messages over stdio, so it should not print a banner.
