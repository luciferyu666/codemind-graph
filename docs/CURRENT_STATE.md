# Current State

Last updated: 2026-06-02

## Repository status

- Local Git repository initialized on `main`.
- Persistent project context files created.
- pnpm workspace skeleton created.
- Dependencies installed with `pnpm install`.
- `pnpm typecheck`, `pnpm test`, and `pnpm build` pass.
- Git remote `origin` is configured as `https://github.com/luciferyu666/codemind-graph.git`.
- GitHub repository exists at `https://github.com/luciferyu666/codemind-graph`.
- Initial bootstrap has been pushed to `origin/main`.
- ChatGPT export `ChatGPT-專案排序與建議 (4).md` has been imported into `Documentations/`.
- ChatGPT export `ChatGPT-專案排序與建議 (5).md` has been imported into `Documentations/`.
- ChatGPT export `ChatGPT-專案排序與建議 (6).md` has been imported into `Documentations/`.
- ChatGPT export `ChatGPT-專案排序與建議 (7).md` has been imported into `Documentations/`.
- ChatGPT export `ChatGPT-專案排序與建議 (8).md` has been imported into `Documentations/`.
- ChatGPT export `ChatGPT-專案排序與建議 (9).md` has been imported into `Documentations/`.
- `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-05-30 Export 7.md` captures Export 7's public-narrative corrections and 90-day focus guidance.
- `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-06-01 Export 8.md` captures Export 8's Task Decomposition, Task Contract, Agentic Workflow, MCP safety, `/goal`, and Slice H guidance.
- `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-06-01 Export 9.md` captures Export 9's enterprise Agentic Workflow refinements and notes that the export did not complete the requested monetization blueprint.
- `Documentations/CodeMind Graph 商業化與變現策略藍圖.md` has been imported into `Documentations/`.
- `docs/BUSINESS_MONETIZATION_BLUEPRINT.md` captures the first business and monetization strategy for CodeMind Graph.
- `docs/AGENT_HARNESS.md` defines Goal, MCP, Rubric, and Governance boundaries.
- `docs/TASK_DECOMPOSITION_GUIDE.md` defines the Human SOP -> Skill -> Task Contract -> Agentic Workflow model for slice engineering.
- `docs/TOOLCHAIN.md` defines the verified local toolchain and Current vs Planned documentation boundary.
- `docs/OPEN_SOURCE_STRATEGY_2026.md` captures the 2026 open-source project strategy and positions CodeMind Graph as the Knowledge Layer project.
- `docs/AI_AGENT_INFRASTRUCTURE_WHITEPAPER_2026.md` captures the 2026 AI Agent infrastructure whitepaper and publication-boundary notes.
- `docs/ENGINEERING_PRACTICE_STANDARD.md` captures the CodeMind Graph engineering practice standard and current/planned implementation boundaries.
- v0.1 quality gate is now defined in `docs/RUBRIC.md`.
- `packages/core` graph schema is implemented.
- `packages/adapter-typescript` TypeScript Compiler API extraction is implemented.
- `packages/adapter-typescript` now extracts basic static `CALLS` edges for same-file function calls, imported function calls, same-class methods, and simple imported class methods.
- `packages/cli` supports `index` and writes `.codemind/graph.json`.
- `packages/cli` supports `find` and reads `.codemind/graph.json` for symbol lookup.
- `packages/cli` supports `trace` and reads `.codemind/graph.json` for symbol-level dependency and call context.
- `packages/cli` supports `explain` and reads `.codemind/graph.json` for deterministic file-level context, including outgoing calls and external callers.
- `packages/cli` supports `map` and writes `CODEMIND.md`.
- `packages/cli` writes graph freshness metadata during `index` and reports stale or unknown freshness during `find`, `trace`, and `map`.
- `packages/cli` supports `mcp start --root <path>` and delegates to the read-only MCP server.
- `packages/core` exposes reusable graph query helpers used by CLI commands, including `CALLS` edge trace and file explain context.
- `packages/mcp-server` exposes a read-only MCP skeleton with `find_symbol`, `get_repo_map`, and `trace_symbol`.
- `packages/mcp-server` reports graph freshness status in `find_symbol`, `get_repo_map`, and `trace_symbol` responses.
- GitHub Actions CI is configured in `.github/workflows/ci.yml` for push and pull request.
- Release checkpoint `60092e5` has been pushed to GitHub `main`; GitHub Actions CI passed `pnpm check`.
- Release tag `v0.1.0` has been pushed.
- GitHub Actions CI and Browser QA workflows now target `windows-2025-vs2026`, opt into `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`, and use Node.js 24 action majors.
- Official website and Vercel deployment planning is captured in `docs/OFFICIAL_WEBSITE_PLAN.md`.
- `apps/web` official website skeleton is implemented with Next.js, React, TypeScript, Tailwind CSS, `/en`, and `/zh-TW`.
- Root `pnpm check` now includes the web typecheck and production build.
- Browser QA workflow is documented in `docs/BROWSER_QA_WORKFLOW.md`.
- Playwright Chromium E2E and visual baseline testing is configured in `playwright.config.ts`.
- GitHub Actions Browser QA workflow is configured in `.github/workflows/browser-qa.yml`.
- Website Slice W4 is implemented with sitemap, robots, canonical alternates, Open Graph metadata, Twitter metadata, generated social image route, and Vercel readiness docs.
- Website Slice W4b is implemented with bilingual Engineering Practices routes, landing page `Why CodeMind Graph`, engineering standards, and brand positioning sections.
- Website Slice W5 production deployment is complete at `https://codemind-graph.vercel.app`.
- Website Slice W6 Vincent Liu digital business card is implemented at `/en/vincent-liu` and `/zh-TW/vincent-liu`.
- Website Slice W6 Vincent Liu digital business card is deployed to production at `https://codemind-graph.vercel.app/en/vincent-liu`.
- GitHub repository is connected to the Vercel project under `vincent-lius-projects-de5eeb92`.
- Vercel project Root Directory is configured as `apps/web`.
- Focused tests cover graph builder determinism and TypeScript extraction.
- TypeScript adapter fixtures now cover richer imports, re-exports, classes, methods, and basic `CALLS` edge extraction for future trace work.
- Focused CLI tests cover symbol trace success, no-match behavior, and rendered `CALLS` edge context.
- Focused CLI tests cover file explain success, no-match behavior, and rendered file-level `CALLS` context.
- Focused CLI tests cover stale source fingerprints and legacy graph files without freshness metadata.
- Focused CLI tests cover MCP startup delegation and invalid MCP startup options.
- Focused MCP tests cover symbol lookup, markdown repo map retrieval, symbol trace retrieval with `CALLS` edge context, freshness status, stale source fingerprints, and graph path containment.
- MCP protocol smoke test covers SDK client stdio initialization, `tools/list`, `tools/call`, read-only tool annotations, freshness status, and `CALLS` trace context for `find_symbol`, `get_repo_map`, and `trace_symbol`.
- MCP protocol negative/error coverage verifies missing graph, root escape attempts, graph path escape attempts, invalid tool input, legacy freshness metadata, stale freshness status, and no engineering memory leakage.
- `docs/NEXT_DEVELOPMENT_TOPICS.md` defines the next AI-native graph platform development topics and slice plan.
- README now documents the v0.1 quickstart demo, read-only MCP safety boundary, freshness warnings, scope, and non-goals.
- `docs/LEGACY_REPO_ONBOARDING_PACK.md` documents the first paid service wedge.

## Known gaps

- Runtime is Node.js `v22.22.3`; project blueprint mentions Node.js `v24.16.0` LTS.
- CLI supports `index`, `find`, `trace`, `explain`, `map`, and `mcp start`.
- Phase 001 minimum graph, freshness, trace, explain, map, read-only MCP flow, and richer TypeScript fixture coverage are implemented.
- SQLite storage is not implemented yet; the current index target is JSON under `.codemind/graph.json`.
- Full TypeScript call graph resolution is not implemented yet; Slice K only covers conservative static function and method call edges.
- MCP currently reads only `.codemind/graph.json`; live indexing from MCP is intentionally out of scope.
- CI badge is not added yet; add it after the first GitHub Actions run is visible on `main`.
- Custom domain setup is not implemented yet.
- The Vincent Liu digital business card uses a normalized portrait asset generated from `C:\Users\vince\Downloads\20260528_161756790.JPG`.
- Codex in-app Browser currently has no registered `iab` backend in this app runtime.
- Codex Chrome Extension is installed and available in the selected Chrome profile.

## Immediate target

Slice I `codemind explain <path>` is implemented and verified with `pnpm check` plus manual CLI verification.

Slice J MCP negative/error protocol coverage is implemented and verified with `pnpm check`.

Slice K TypeScript `CALLS` edge MVP is implemented and verified with focused adapter tests and full `pnpm check`.

`CALLS` edges are now exposed through `codemind trace` and MCP `trace_symbol` as `Calls Out` and `Called By`.

Slice L call-aware `codemind explain <path>` is implemented and verified with focused tests and full `pnpm check`.

Immediate target: decide whether the next slice should add MCP `explain_file` or richer call resolution.

Business strategy baseline now exists in `docs/BUSINESS_MONETIZATION_BLUEPRINT.md`, and the first service wedge is documented in `docs/LEGACY_REPO_ONBOARDING_PACK.md`.
