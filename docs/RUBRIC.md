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
- [x] `codemind index examples/ts-basic` writes graph data under `.codemind/`.
- [x] `codemind find <symbol>` returns a deterministic result.
- [x] `codemind map --format markdown` generates `CODEMIND.md`.
- [ ] `codemind mcp start` exposes read-only tools.
- [ ] No write-capable MCP tools exist.
- [x] `docs/SESSION_STATE.md` and `docs/DECISIONS.md` are updated.

## Evaluation Weights

| Dimension | Weight | Standard |
| --- | ---: | --- |
| Scope control | 30% | Work stays inside TypeScript, CLI, local graph, and read-only MCP v0.1 scope. |
| Model quality | 40% | Symbol graph and dependency edges are deterministic and covered by focused tests. |
| Code integrity | 30% | `pnpm check` passes, public APIs use explicit types, and production TypeScript avoids `any`. |

## Anti-patterns

- Do not mark Phase 001 complete before the Definition of Done passes.
- Do not introduce Tree-sitter or LSP into v0.1 unless the TypeScript Compiler API path is already working.
- Do not describe SQLite FTS as semantic search; it is full-text symbol lookup.
- Do not expose `docs/SESSION_STATE.md`, `docs/CURRENT_STATE.md`, or other engineering notes through MCP tools by default.
- Do not add web dashboard, natural-language QA, Python deep support, DevSec scanning, or write-capable MCP tools in v0.1.
