# Next Development Topics

This document defines the next best development topics for CodeMind Graph as an AI-native graph platform.

## Current Baseline

Implemented:

- Windows Codex App workspace and persistent engineering workflow.
- GitHub repository and local pnpm TypeScript monorepo.
- `packages/core` graph schema and deterministic `GraphBuilder`.
- `packages/adapter-typescript` TypeScript Compiler API extraction.
- `packages/cli` commands:
  - `codemind index <path>`
  - `codemind find <symbol>`
  - `codemind map --format markdown`
- `.codemind/graph.json` JSON graph index.
- `CODEMIND.md` markdown repo map output.
- Focused tests for core, TypeScript adapter, and CLI index/find.

Not yet implemented:

- `codemind trace`
- `codemind explain`
- read-only MCP server
- visualization UI
- deployment pipeline

## Product Direction

CodeMind Graph should evolve as an AI-native graph platform, but each phase must remain independently useful.

The core product loop is:

```text
index repo -> build graph -> query symbols -> generate repo map -> expose read-only MCP tools -> rank context for agents
```

The near-term strategy is CLI-first and local-first. UI, Vercel deployment, and multi-agent workflows should come after the graph index, repo map, and MCP tools are reliable.

## Next Best Topics

### 1. MVP Demo Slice: Repo Map Output

Priority: P0

Status: complete.

Goal:

Make the project demonstrable from a clean clone.

Commands:

```powershell
codemind index examples/ts-basic
codemind find greet --root examples/ts-basic
codemind map --root examples/ts-basic --format markdown
```

Deliverables:

- `codemind map --format markdown`
- `CODEMIND.md` generation
- module/symbol summary
- import/export summary
- deterministic markdown output
- tests for generated markdown

Why this is next:

`CODEMIND.md` is the first visible artifact that proves CodeMind Graph helps humans and agents understand a repo.

### 2. Graph Query Engine

Priority: P0

Status: partially complete.

Goal:

Move query logic out of CLI command handlers and into reusable core APIs.

Deliverables:

- `findSymbols(graph, query)`
- `listFiles(graph)`
- `listImports(graph)`
- `listExports(graph)`
- `getNodeById(graph, id)`
- `getOutgoingEdges(graph, nodeId)`
- `getIncomingEdges(graph, nodeId)`
- deterministic sorting helpers

Why this is next:

The CLI, MCP server, future UI, and AI reasoning workflow should share the same query engine instead of duplicating graph traversal logic.

### 3. TypeScript Dependency Trace

Priority: P1

Goal:

Support dependency-oriented graph reasoning.

Commands:

```powershell
codemind trace <symbol> --root <path>
```

Deliverables:

- trace symbol to file
- show imported modules for the symbol file
- show exported symbols from the file
- later: resolve cross-file references and call edges
- focused tests over `examples/ts-basic`

Why this matters:

Trace is the first step toward impact analysis and graph-based reasoning.

### 4. Read-only MCP Server

Priority: P1

Goal:

Expose CodeMind Graph to AI coding agents through read-only tools.

Initial tools:

- `find_symbol`
- `get_repo_map`
- `list_modules`
- `trace_dependency`

Constraints:

- no file writes
- no shell execution
- no package installation
- no Git operations
- no exposure of engineering session notes

Why this matters:

MCP is the agent integration layer, but it should only be added after CLI graph behavior is deterministic and tested.

### 5. Persistent Memory System

Priority: P1

Goal:

Separate product graph memory from engineering session memory.

Product memory:

- `.codemind/graph.json`
- `.codemind/CODEMIND.md`
- later `.codemind/index.sqlite`

Engineering memory:

- `AGENTS.md`
- `docs/SESSION_STATE.md`
- `docs/RUBRIC.md`
- `docs/DECISIONS.md`
- `docs/ENGINEERING_STATE.md`

Rule:

MCP tools expose product graph memory only unless explicitly configured otherwise.

### 6. Knowledge Graph Enrichment

Priority: P2

Goal:

Improve graph quality before adding visualization.

Deliverables:

- richer TypeScript examples
- namespace import handling tests
- default export tests
- re-export tests
- class method tests
- interface/type alias coverage
- external module nodes
- basic `REFERENCES` edges
- later `CALLS` edges

Why this matters:

A visual graph is only useful if the underlying graph is correct.

### 7. Graph-based Reasoning Workflow

Priority: P2

Goal:

Turn graph queries into agent-ready context packs.

Deliverables:

- `explain module`
- `impact analysis`
- context ranking by file/symbol relevance
- markdown context packets
- token budget controls

Non-goal for now:

Do not implement natural-language `ask` in v0.1.

### 8. AI Workspace Architecture

Priority: P2

Goal:

Make CodeMind Graph a durable workspace layer for Codex-like agents.

Deliverables:

- workspace manifest
- graph freshness metadata
- last indexed timestamp
- repo root detection
- clear stale-index warnings
- agent handoff instructions generated from graph output

### 9. UI and Visualization

Priority: P3

Goal:

Add visual inspection after CLI and MCP are useful.

Recommended first UI:

- static HTML graph report generated from `.codemind/graph.json`
- file/module list
- symbol search
- import/export table

Avoid early:

- complex interactive canvas
- 3D graph
- full dashboard
- Vercel app before static report exists

### 10. Vercel Deployment

Priority: P3

Goal:

Deploy public docs and demo visualization, not private repo analysis.

Deployable artifacts:

- marketing/docs site
- static demo graph
- generated public `CODEMIND.md`
- example repo visualization

Do not deploy:

- private `.codemind/graph.json`
- raw local source code
- local MCP server
- engineering session notes

### 11. GitHub Workflow

Priority: P1

Goal:

Make every agent-generated change safe to review.

Deliverables:

- GitHub Actions CI
- `pnpm install --frozen-lockfile`
- `pnpm check`
- dependency audit gate
- pull request template
- issue templates for graph bugs and adapter bugs

### 12. Multi-Agent Architecture

Priority: P3

Goal:

Coordinate implementer/evaluator agents through shared graph artifacts.

Roles:

- Implementer: changes code.
- Evaluator: checks rubric, tests, graph quality, and docs.
- Librarian: updates `docs/SESSION_STATE.md`, `docs/DECISIONS.md`, and `CODEMIND.md`.

Precondition:

Do not formalize multi-agent workflow until v0.1 CLI and MCP are stable.

## MVP Slice Engineering

### Slice A: `map` and `CODEMIND.md`

Status: complete.

Outcome:

`codemind map --root examples/ts-basic --format markdown` generates a deterministic repo map.

Tasks:

- Add core graph query helpers.
- Add CLI `map`.
- Generate markdown sections:
  - Overview
  - Files
  - Symbols
  - Imports
  - Exports
  - Diagnostics
- Add snapshot-like tests using stable string assertions.
- Update `docs/RUBRIC.md`.

Verification:

```powershell
pnpm check
node packages/cli/dist/index.js index examples/ts-basic
node packages/cli/dist/index.js map --root examples/ts-basic --format markdown
```

### Slice B: Query Engine

Status: partially complete.

Outcome:

CLI command handlers reuse core query functions.

Tasks:

- Add query helpers in `packages/core`.
- Refactor CLI `find` to use `findSymbols`.
- Add query tests.

Verification:

```powershell
pnpm check
```

### Slice C: Read-only MCP Skeleton

Outcome:

`codemind mcp start` starts a read-only MCP server that can return graph context.

Tasks:

- Add MCP SDK dependency with ADR entry.
- Add tool schemas.
- Implement `find_symbol`.
- Implement `get_repo_map`.
- Add tests for handlers without requiring an external MCP client.

Verification:

```powershell
pnpm check
node packages/cli/dist/index.js mcp start --root examples/ts-basic
```

### Slice D: GitHub CI

Outcome:

Every push and PR runs project verification.

Tasks:

- Add `.github/workflows/ci.yml`.
- Run `pnpm install --frozen-lockfile`.
- Run `pnpm check`.
- Add README status badge after workflow is active.

Verification:

- GitHub Actions passes on `main`.

## Long-term Roadmap

### v0.1: Deterministic Graph MVP

- TypeScript Compiler API extraction
- JSON graph index
- CLI `index`
- CLI `find`
- CLI `map`
- `CODEMIND.md`
- read-only MCP skeleton
- CI

### v0.2: Better Context for Agents

- query engine hardening
- `trace`
- `explain`
- context ranking
- stale index detection
- richer examples
- basic visualization report

### v0.3: Local Graph Runtime

- SQLite storage
- FTS symbol lookup
- incremental index metadata
- larger TypeScript repo tests
- performance benchmarks

### v0.4: AI Integration Platform

- MCP tool expansion
- context packs
- impact analysis
- Codex/Cursor/Claude usage docs
- governance notes

### v0.5: Visualization and Deployment

- static graph report
- hosted public demo on Vercel
- docs site
- example visualizations

## Recommended Next Task

The next task should be:

```text
Implement Slice C: read-only MCP skeleton with find_symbol and get_repo_map.
```

Reason:

The CLI demo loop is now in place. The next v0.1 gap is exposing the same graph context through safe read-only MCP tools.
