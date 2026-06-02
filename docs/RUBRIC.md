# Rubric

This file defines the quality gate for CodeMind Graph v0.1.

## v0.1 Definition of Done

CodeMind Graph v0.1 is complete only when all of the following are true:

- [x] `pnpm install` passes on Windows PowerShell.
- [x] `pnpm typecheck` passes.
- [x] `pnpm test` passes.
- [x] `pnpm build` passes.
- [x] `packages/core` contains graph node and edge types.
- [x] `packages/adapter-typescript` extracts TypeScript source files, functions, classes, interfaces, imports, and exports with the TypeScript Compiler API.
- [x] TypeScript adapter fixtures cover import kinds, local/external module resolution, re-exports, classes, and class methods.
- [x] TypeScript adapter extracts basic deterministic `CALLS` edges for same-file function calls, imported function calls, same-class methods, and simple imported class methods.
- [x] `codemind index examples/ts-basic` writes graph data under `.codemind/`.
- [x] `codemind find <symbol>` returns a deterministic result.
- [x] `codemind trace <symbol>` returns deterministic symbol file, import, export, call, and related module context.
- [x] `codemind explain <path>` returns deterministic file overview, symbols, imports, exports, related modules, diagnostics, and freshness status.
- [x] `codemind map --format markdown` generates `CODEMIND.md`.
- [x] `.codemind/graph.json` includes freshness metadata with `indexedAt`, `rootDir`, `sourceFileCount`, and `sourceFingerprint`.
- [x] `codemind find`, `codemind trace`, and `codemind map` report stale or unknown graph freshness without crashing on legacy graph files.
- [x] `packages/mcp-server` exposes read-only `find_symbol` and `get_repo_map` tools.
- [x] `packages/mcp-server` exposes read-only `trace_symbol` over the same core trace helper used by CLI.
- [x] `trace_symbol` includes the same `Calls Out` and `Called By` context as CLI trace output.
- [x] MCP `find_symbol`, `get_repo_map`, and `trace_symbol` responses include graph freshness status.
- [x] `codemind mcp start` exposes read-only tools.
- [x] MCP stdio protocol smoke coverage verifies initialize, `tools/list`, and `tools/call` for `find_symbol`, `get_repo_map`, and `trace_symbol`.
- [x] MCP stdio protocol negative/error coverage verifies missing graph, path escape attempts, invalid tool input, legacy freshness metadata, stale freshness status, and no engineering memory leakage.
- [x] No write-capable MCP tools exist.
- [x] GitHub Actions runs `pnpm check` on push and pull request.
- [x] README documents the v0.1 quickstart demo, read-only MCP boundary, and v0.1 non-goals.
- [x] Legacy Repo Onboarding Pack is documented as the first service-oriented wedge.
- [x] `docs/SESSION_STATE.md` and `docs/DECISIONS.md` are updated.

## Evaluation Weights

| Dimension | Weight | Standard |
| --- | ---: | --- |
| Scope control | 30% | Work stays inside TypeScript, CLI, local graph, and read-only MCP v0.1 scope. |
| Model quality | 40% | Symbol graph, dependency edges, and basic static call edges are deterministic and covered by focused tests. |
| Code integrity | 30% | `pnpm check` passes, public APIs use explicit types, and production TypeScript avoids `any`. |

## Anti-patterns

- Do not mark Phase 001 complete before the Definition of Done passes.
- Do not introduce Tree-sitter or LSP into v0.1 unless the TypeScript Compiler API path is already working.
- Do not describe SQLite FTS as semantic search; it is full-text symbol lookup.
- Do not expose `docs/SESSION_STATE.md`, `docs/CURRENT_STATE.md`, or other engineering notes through MCP tools by default.
- Do not add web dashboard, natural-language QA, Python deep support, DevSec scanning, or write-capable MCP tools in v0.1.
- Do not describe the Slice K `CALLS` edge MVP as a complete runtime or dynamic-dispatch call graph.
