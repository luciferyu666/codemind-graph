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
- [x] Expand TypeScript `CALLS` edge resolution for namespace calls, constructors, same-file static methods, and simple chained class methods.
- [x] Expose `CALLS` edges in `codemind trace` and MCP `trace_symbol` output.
- [x] Expose file-level `CALLS` context in `codemind explain`.
- [x] Expose `CALLS` overview in `codemind map` / `CODEMIND.md` and MCP `get_repo_map`.
- [x] Implement CLI commands:
  - [x] `index`
  - [x] `find`
  - [x] `trace`
  - [x] `explain`
  - [x] `context`
  - [x] `map`
  - [x] `health`
  - [x] `doctor`
  - [x] `mcp start`
- [x] Implement read-only MCP server tools:
  - [x] `find_symbol`
  - [x] `get_repo_map`
  - [x] `trace_symbol`
  - [x] `explain_file`
  - [x] `get_context_pack`
- [x] Wire MCP server through `codemind mcp start`.
- [x] Add MCP stdio protocol smoke coverage for `find_symbol` and `get_repo_map`.
- [x] Add MCP stdio protocol negative/error coverage for missing graph, invalid input, path escape, legacy freshness, and stale freshness.
- [x] Generate `CODEMIND.md` repository map.
- [x] Add Public MVP Hardening Pack with `codemind health`, `codemind doctor`, README install polish, CI badge, richer public fixture, sanitized public demo `CODEMIND.md`, and MCP client usage docs.
- [x] Add Context Pack MVP with `codemind context <symbol-or-path>` for bounded agent-ready Markdown packets.
- [x] Add npm package / bin readiness for runtime packages and source-based `pnpm codemind` CLI trials.
- [x] Add graph index metadata versioning with indexer, adapter, language, and capabilities.
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
- [x] Prepare v0.1.1 README demo refresh and release notes draft.
- [x] Prepare Public MVP Hardening Pack for external developer trial.
- [x] Prepare npm package / bin readiness before any npm publish decision.
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
- Expose `explain_file`. Done.
- Add schema validation for MCP tool inputs. Done.
- Wire MCP server through `codemind mcp start`. Done.
- Add MCP protocol smoke coverage. Done.
- Add MCP negative/error protocol coverage. Done.
- Add GitHub Actions CI. Done.

Day 61-90:

- Graph freshness / stale index warning metadata is implemented.
- Use `docs/TASK_DECOMPOSITION_GUIDE.md` as the Slice H task contract.
- Include freshness status in CLI and read-only MCP outputs.
- Maintain the pushed `v0.1.0` release checkpoint and use follow-up slices for CI/runtime maintenance, example coverage, and MCP negative-path tests.
- Slice I `codemind explain <path>` is implemented.
- Slice K TypeScript `CALLS` edge MVP is implemented.
- Slice M richer TypeScript `CALLS` resolution is implemented.
- `codemind trace` and MCP `trace_symbol` now render `Calls Out` and `Called By` sections from indexed `CALLS` edges.
- `codemind explain` now renders file-level `Calls Out` and `Called By` sections from indexed `CALLS` edges.
- `codemind map` and MCP `get_repo_map` now render a call/reference-aware `CODEMIND.md` overview with call counts, reference counts, top callers, top callees, top referencers, top referenced symbols, and edge tables.
- Slice Q1 TypeScript `REFERENCES` edge MVP is implemented for conservative project-local same-file, imported, namespace, type-only import, local export, and explicit re-export references.
- `.codemind/graph.json` now records indexer, adapter, adapter version, language, and graph capabilities.
- `codemind health` and `codemind doctor` now provide public-MVP readiness checks.
- `codemind context` now composes selected trace, explain, and repo map context into a bounded Markdown packet.
- MCP `get_context_pack` now exposes the same bounded context packet through the read-only MCP server.
- `examples/ts-agent-workspace/CODEMIND.md` provides the first committed sanitized public demo map.
- `docs/MCP_CLIENT_USAGE.md` documents read-only MCP client setup and tool usage.
- Runtime packages are npm-pack-ready at `0.1.2`, and root `pnpm codemind` supports source-based human CLI trials.
- Before any npm publish decision, add install-from-tarball smoke coverage or explicitly approve publishing policy.
- Keep governance, DevSec integration points, permission profiles, and audit logs as later expansion topics.

Day 90+:

- Expand DevSec Sentinel and MCP ToolHub concepts after CodeMind Graph v0.1 is reliable.
- Keep QuantAgent Lab as a separate vertical-domain brand project after CodeMind Graph has a working public demo.
