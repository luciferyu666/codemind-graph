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
- Official website: planned public brand and product showcase, isolated from private graph data.
- Playwright: repo-managed browser QA engine for E2E, screenshots, and visual regression.

## Packages

- `packages/core`: graph schema, store contracts, query model.
- `packages/adapter-typescript`: TypeScript symbol extraction.
- `packages/cli`: `codemind` command line entry point.
- `packages/mcp-server`: read-only MCP tools.
- `apps/web`: official website package built with Next.js, React, TypeScript, and Tailwind CSS.

## Website Architecture

`apps/web` uses Next.js App Router with deterministic locale routes:

- `/en`
- `/zh-TW`

The website currently renders a static bilingual landing page skeleton with:

- product hero
- graph dashboard showcase
- feature sections
- workflow section
- language switcher
- GitHub CTA

The website must use synthetic or public demo content only. It must not deploy private `.codemind/graph.json`, local MCP endpoints, or engineering memory files.

## Browser QA Architecture

Browser automation is split into environment-backed and repo-managed surfaces:

- Codex in-app Browser: interactive Codex App browser backend when an `iab` runtime is registered.
- Chrome Extension Backend: optional bridge into the user's Chrome profile when the Codex Chrome Extension is installed and enabled.
- Playwright Runtime: deterministic repo-managed QA under `playwright.config.ts` and `test/e2e/`.

Playwright starts the production Next.js server locally unless `CODEMIND_WEB_BASE_URL` is set. This keeps the same test suite usable for local development, Vercel preview URLs, and production deployments.

## CLI Graph Commands

`codemind index <path>` writes a deterministic graph index file to:

```text
<path>/.codemind/graph.json
```

The index file contains:

- `schemaVersion`
- normalized `rootDir`
- indexed `sourceFiles`
- TypeScript `diagnostics`
- extracted `CodeGraph`

Generated graph data remains under `.codemind/` and is ignored by Git.

`codemind find <symbol>` reads `.codemind/graph.json` and returns deterministic symbol matches. By default it reads the current working directory graph, and `--root <path>` can point it at another indexed repo.

`codemind map --format markdown` reads `.codemind/graph.json` and writes a deterministic `CODEMIND.md` repo map.

`codemind mcp start --root <path>` starts the read-only MCP stdio server for an indexed workspace. The command delegates to `packages/mcp-server` and does not write status text to stdout before MCP transport starts.

## MCP Tools

`packages/mcp-server` currently exposes two read-only tools over persisted graph indexes:

- `find_symbol`: reads `.codemind/graph.json` and returns deterministic Markdown symbol rows.
- `get_repo_map`: reads `.codemind/graph.json` and returns the deterministic Markdown repo map.

The MCP server does not index code, write files, run shell commands, or expose engineering memory files. Tool-selected graph paths must remain inside the configured MCP root.

## Graph Model

The initial graph schema is deterministic and ID-based.

Node kinds:

- `repository`
- `file`
- `module`
- `function`
- `class`
- `interface`
- `type`
- `enum`
- `variable`
- `method`
- `property`

Edge kinds:

- `CONTAINS`
- `DEFINES`
- `IMPORTS`
- `EXPORTS`
- `REFERENCES`
- `CALLS`

The TypeScript adapter currently emits repository, file, module, and symbol nodes plus `CONTAINS`, `DEFINES`, `IMPORTS`, and `EXPORTS` edges.

## Non-goals for v0.1

- Web dashboard
- Write-capable MCP tools
- Natural-language QA
- Cloud sync
- Deep Python analysis
- Exposing engineering session notes through MCP tools
