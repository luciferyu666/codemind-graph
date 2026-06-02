# Roadmap

For detailed next development topics and slice planning, see `docs/NEXT_DEVELOPMENT_TOPICS.md`.

## Phase 001: v0.1 Bootstrap and deterministic TypeScript graph

Phase 001 is not complete until the Definition of Done in `docs/RUBRIC.md` passes.

- [x] Create project documentation and persistent engineering context.
- [x] Initialize Git repository.
- [x] Create pnpm TypeScript monorepo skeleton.
- [x] Verify `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [x] Implement graph schema in `packages/core`.
- [x] Implement TypeScript Compiler API import and symbol extraction in `packages/adapter-typescript`.
- [x] Add TypeScript adapter fixture coverage for imports, re-exports, classes, and methods.
- [x] Add TypeScript `CALLS` edge MVP for same-file function calls, imported function calls, same-class method calls, and simple imported class method calls.
- [x] Expose `CALLS` edges in `codemind trace` and MCP `trace_symbol` output.
- [x] Expose file-level `CALLS` context in `codemind explain`.
- [x] Implement CLI commands:
  - [x] `index`
  - [x] `find`
  - [x] `trace`
  - [x] `explain`
  - [x] `map`
  - [x] `mcp start`
- [x] Implement read-only MCP server tools:
  - [x] `find_symbol`
  - [x] `get_repo_map`
  - [x] `trace_symbol`
- [x] Wire MCP server through `codemind mcp start`.
- [x] Add MCP stdio protocol smoke coverage for `find_symbol` and `get_repo_map`.
- [x] Add MCP stdio protocol negative/error coverage for missing graph, invalid input, path escape, legacy freshness, and stale freshness.
- [x] Generate `CODEMIND.md` repository map.
- [x] Add GitHub Actions CI for `pnpm check`.

## Phase 002: Context ranking and ecosystem integration

- [ ] Add context ranking for agent output density.
- [ ] Evaluate Tree-sitter syntax fallback.
- [ ] Evaluate LSP adapter abstraction.
- [ ] Prototype VS Code extension.
- [ ] Evaluate Python support with Pyright.

## Phase 003: Intelligence and safety expansion

- [ ] Add structure-aware security scanning integration points.
- [ ] Add technical debt scoring.
- [ ] Add onboarding guide generation.

## Phase 004: Official Website and Vercel Deployment

See `docs/OFFICIAL_WEBSITE_PLAN.md`.

- [x] Capture official website plan.
- [x] Scaffold `apps/web` with Next.js, React, TypeScript, and Tailwind CSS.
- [x] Add English and Traditional Chinese locale routes.
- [x] Build landing hero and product dashboard showcase skeleton.
- [x] Add Playwright Browser QA workflow for E2E, screenshots, and visual baselines.
- [x] Add sitemap, robots, and complete SEO metadata.
- [x] Update CI to include web build after `apps/web` exists.
- [x] Add GitHub Actions Browser QA workflow for website-related pull requests.
- [x] Add Vercel deployment readiness checklist.
- [x] Configure Vercel project and production deployment.
- [x] Connect GitHub repository to Vercel deployment pipeline.
- [x] Verify production deployment at `https://codemind-graph.vercel.app`.

## Phase 005: Business Strategy And Commercial Validation

See `docs/BUSINESS_MONETIZATION_BLUEPRINT.md`.

- [x] Capture initial business and monetization blueprint.
- [x] Finish Slice H Graph freshness before public v0.1 commercial validation.
- [x] Prepare Legacy Repo Onboarding Pack one-pager.
- [x] Prepare v0.1 README demo and release tag.
- [ ] Validate first paid onboarding customer.

## 90-Day Strategic Focus

Day 1-30:

- Complete CodeMind Graph v0.1 deterministic graph query flow.
- Finish `codemind index`, `codemind find`, and `codemind map`. Done.
- Add `codemind trace`. Done.
- Add `codemind explain`. Done.
- Generate `CODEMIND.md`. Done.

Day 31-60:

- Add read-only MCP server. Done.
- Expose `find_symbol` and `get_repo_map`. Done.
- Expose `trace_symbol`. Done.
- Add schema validation for MCP tool inputs. Done.
- Wire MCP server through `codemind mcp start`. Done.
- Add MCP protocol smoke coverage. Done.
- Add MCP negative/error protocol coverage. Done.
- Add GitHub Actions CI. Done.

Day 61-90:

- Add Graph freshness / stale index warning metadata.
- Use `docs/TASK_DECOMPOSITION_GUIDE.md` as the Slice H task contract.
- Include freshness status in CLI and read-only MCP outputs.
- Maintain the pushed `v0.1.0` release checkpoint and use follow-up slices for CI/runtime maintenance, example coverage, and MCP negative-path tests.
- Slice I `codemind explain <path>` is implemented.
- Slice K TypeScript `CALLS` edge MVP is implemented.
- `codemind trace` and MCP `trace_symbol` now render `Calls Out` and `Called By` sections from indexed `CALLS` edges.
- `codemind explain` now renders file-level `Calls Out` and `Called By` sections from indexed `CALLS` edges.
- Keep governance, DevSec integration points, permission profiles, and audit logs as later expansion topics.

Day 90+:

- Expand DevSec Sentinel and MCP ToolHub concepts after CodeMind Graph v0.1 is reliable.
- Keep QuantAgent Lab as a separate vertical-domain brand project after CodeMind Graph has a working public demo.
