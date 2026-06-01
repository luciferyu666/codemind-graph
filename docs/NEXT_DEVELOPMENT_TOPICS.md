# Next Development Topics

This document defines the next best development topics for CodeMind Graph as an AI-native graph platform.

## Current Baseline

Implemented:

- Windows Codex App workspace and persistent engineering workflow.
- GitHub repository and local pnpm TypeScript monorepo.
- 2026 open-source strategy captured in `docs/OPEN_SOURCE_STRATEGY_2026.md`.
- 2026 AI Agent infrastructure strategy captured in `docs/AI_AGENT_INFRASTRUCTURE_WHITEPAPER_2026.md`.
- CodeMind Graph engineering practice standard captured in `docs/ENGINEERING_PRACTICE_STANDARD.md`.
- Task Decomposition and Task Contract workflow captured in `docs/TASK_DECOMPOSITION_GUIDE.md`.
- `packages/core` graph schema and deterministic `GraphBuilder`.
- `packages/adapter-typescript` TypeScript Compiler API extraction.
- `docs/TOOLCHAIN.md` verified local toolchain and Current vs Planned documentation boundary.
- `packages/cli` commands:
  - `codemind index <path>`
  - `codemind find <symbol>`
  - `codemind trace <symbol>`
  - `codemind map --format markdown`
- `.codemind/graph.json` JSON graph index.
- `CODEMIND.md` markdown repo map output.
- Focused tests for core, TypeScript adapter, and CLI index/find.

Not yet implemented:

- `codemind explain`
- broader real-world TypeScript repository fixtures
- visualization UI
- Vercel deployment pipeline

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

Status: initial CLI slice complete.

Goal:

Support dependency-oriented graph reasoning.

Commands:

```powershell
codemind trace <symbol> --root <path>
```

Deliverables:

- trace symbol to file done
- show imported modules for the symbol file done
- show exported symbols from the file done
- later: resolve cross-file references and call edges
- focused tests over generated graph fixtures done

Why this matters:

Trace is the first step toward impact analysis and graph-based reasoning.

### 4. Read-only MCP Server

Priority: P1

Status: initial slice complete for `find_symbol`, `get_repo_map`, and `codemind mcp start`.

Goal:

Expose CodeMind Graph to AI coding agents through read-only tools.

Initial tools:

- `find_symbol` done
- `get_repo_map` done
- `trace_symbol` done
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
- namespace import handling tests done
- default export tests done
- re-export tests done
- class method tests done
- interface/type alias coverage
- external module nodes done
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

Recommended Slice H direction:

- Follow the task contract in `docs/TASK_DECOMPOSITION_GUIDE.md`.
- Use source fingerprints, not mtime alone.
- Store indexed timestamp, root path, scanner version, source file count, latest mtime, content hash, and optional Git state.
- Return freshness states as `fresh`, `stale`, or `unknown`.
- Keep stale warnings deterministic for CLI and read-only MCP output.

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

Status: official website plan captured; implementation not started.

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

### 10A. Official Website

Priority: P2

Status: Slice W1 complete; bilingual landing skeleton exists in `apps/web`.

Goal:

Create the official website for CodeMind Graph as an AI-native graph platform landing page and future Vercel deployment target.

Recommended package:

- `apps/web`

Initial deliverables:

- Next.js + React + TypeScript + Tailwind CSS done
- English and Traditional Chinese locale routes done
- landing hero skeleton done
- product dashboard showcase skeleton done
- feature sections done
- language switcher done
- GitHub repository CTA done
- SEO metadata and language alternates
- Playwright Browser QA pipeline done

Constraints:

- no private repo graph data
- no local MCP endpoint exposure
- no engineering memory documents as product content
- no Vercel deployment before a production build passes locally

### 10B. Browser QA Pipeline

Priority: P1

Status: initial Playwright slice complete; Codex App browser bridge requires external setup.

Goal:

Make website and future product UI changes verifiable through real browser automation.

Implemented:

- `@playwright/test` runtime
- desktop and mobile Chromium projects
- E2E tests for routing, language switching, and anchors
- visual baseline snapshots
- local production-server flow
- remote deployed URL flow through `CODEMIND_WEB_BASE_URL`
- GitHub Actions Browser QA workflow
- browser bridge diagnostics documented

Remaining external setup:

- Codex in-app Browser currently has no registered `iab` backend.
- Codex Chrome Extension is not installed in the selected Chrome profile.
- Chrome native host manifest is correct.

### 11. GitHub Workflow

Priority: P1

Status: initial CI slice complete.

Goal:

Make every agent-generated change safe to review.

Deliverables:

- GitHub Actions CI done
- `pnpm install --frozen-lockfile` done
- `pnpm check` done
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

Status: complete.

Outcome:

`codemind mcp start` starts a read-only MCP server that can return graph context.

Completed tasks:

- Added MCP SDK dependency with ADR entry.
- Added tool schemas.
- Implemented `find_symbol`.
- Implemented `get_repo_map`.
- Wired `codemind mcp start --root <path>` through `packages/cli`.
- Added tests for handlers without requiring an external MCP client.
- Added CLI delegation tests for MCP startup.
- Added protocol-level smoke coverage through SDK stdio client transport.

Verification:

```powershell
pnpm check
node packages/cli/dist/index.js mcp start --root examples/ts-basic
```

### Slice D: GitHub CI

Status: complete.

Outcome:

Every push and PR runs project verification.

Completed tasks:

- Added `.github/workflows/ci.yml`.
- Runs `pnpm install --frozen-lockfile`.
- Runs `pnpm check`.
- Uses `windows-2025-vs2026`, Node.js `24.x`, pnpm `10.10.0`, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`, and Node.js 24 action majors.

Remaining:

- Add README status badge after the first workflow run is visible on GitHub.

Verification:

- GitHub Actions passes on `main`.

### Slice W0: Official Website Planning

Status: complete.

Outcome:

Official website and Vercel deployment architecture is captured without introducing web dependencies into the current core graph checkpoint.

Completed tasks:

- Added `docs/OFFICIAL_WEBSITE_PLAN.md`.
- Added Phase 004 website roadmap.
- Defined `apps/web` as the recommended future package boundary.
- Defined bilingual, SEO, Vercel, safety, and privacy requirements.

### Slice W1: Next.js Website Scaffold

Status: complete.

Outcome:

`apps/web` exists as a Vercel-ready Next.js app with bilingual route structure.

Completed tasks:

- Added `apps/*` to `pnpm-workspace.yaml`.
- Scaffolded `apps/web`.
- Added TypeScript and Tailwind CSS.
- Added `/en` and `/zh-TW` routes.
- Added language switcher skeleton.
- Added `pnpm --filter @codemind/web build`.
- Updated root `pnpm check` so CI runs the web typecheck and production build.

Verification:

```powershell
pnpm install
pnpm --filter @codemind/web build
pnpm check
```

### Slice W4: SEO and Vercel Readiness

Status: complete.

Outcome:

The website has production-ready metadata, sitemap, robots, and a Vercel setup checklist.

Tasks:

- Added `sitemap.ts`.
- Added `robots.ts`.
- Completed Open Graph and Twitter metadata strategy.
- Documented Vercel project settings in `docs/VERCEL_DEPLOYMENT.md`.
- Added pre-deploy and remote Browser QA checklist.
- Added Playwright coverage for SEO endpoints and locale metadata.

### Slice W4a: Browser QA Pipeline

Status: complete.

Outcome:

Website changes can be tested in Chromium across desktop and mobile projects with screenshots and visual baselines.

Completed tasks:

- Added `playwright.config.ts`.
- Added `test/e2e/web.spec.ts`.
- Added `pnpm test:e2e`, `pnpm test:e2e:update`, `pnpm test:e2e:headed`, and `pnpm test:e2e:remote`.
- Added `.github/workflows/browser-qa.yml`.
- Added `docs/BROWSER_QA_WORKFLOW.md`.

Verification:

```powershell
pnpm playwright:install
pnpm test:e2e
```

## Long-term Roadmap

### v0.1: Deterministic Graph MVP

- TypeScript Compiler API extraction
- JSON graph index
- CLI `index`
- CLI `find`
- CLI `trace`
- CLI `map`
- `CODEMIND.md`
- read-only MCP skeleton with `codemind mcp start`
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
- official website on Vercel
- hosted public demo on Vercel
- docs site
- example visualizations

## Recommended Next Task

The next task should be:

```text
Add Graph freshness / stale index warning metadata.
```

Reason:

The CLI and MCP deterministic query loop now includes find, map, and trace. The next best reliability step is making graph freshness explicit so agents know when `.codemind/graph.json` may be stale. Export 6 recommends using source fingerprints rather than relying on mtime alone.

Export 7 reinforces this priority and recommends keeping the 90-day roadmap focused on CodeMind Graph reliability before expanding into DevSec Sentinel, MCP ToolHub, or QuantAgent Lab.

Export 8 reinforces the same priority and adds a task-contract frame for Slice H: define inputs, outputs, success criteria, failure handling, human review gates, and docs update rules before implementing freshness metadata.

Export 9 adds enterprise workflow refinements to the same task-contract model: use hybrid rules + agents + approvals + audit logs, encode safety boundaries deterministically, use structured artifacts, capture eval logs, treat HITL as workflow gates, and avoid over-decomposition.

Business note:

The initial business strategy now exists in `docs/BUSINESS_MONETIZATION_BLUEPRINT.md`.

Commercial baseline:

- do not compete as another AI IDE
- sell repo-specific engineering memory for AI coding agents
- keep Community Edition useful
- use Legacy Repo Onboarding Pack as the first paid wedge
- defer hosted graph API and HA distributed graph storage
- finish Slice H before commercial packaging

Website note:

The official website track now has a working Next.js app, Browser QA pipeline, SEO readiness, Engineering Practices content, and production Vercel deployment at `https://codemind-graph.vercel.app`.
