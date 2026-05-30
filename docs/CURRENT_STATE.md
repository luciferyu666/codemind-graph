# Current State

Last updated: 2026-05-30

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
- `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-05-30 Export 7.md` captures Export 7's public-narrative corrections and 90-day focus guidance.
- `docs/AGENT_HARNESS.md` defines Goal, MCP, Rubric, and Governance boundaries.
- `docs/TOOLCHAIN.md` defines the verified local toolchain and Current vs Planned documentation boundary.
- `docs/OPEN_SOURCE_STRATEGY_2026.md` captures the 2026 open-source project strategy and positions CodeMind Graph as the Knowledge Layer project.
- `docs/AI_AGENT_INFRASTRUCTURE_WHITEPAPER_2026.md` captures the 2026 AI Agent infrastructure whitepaper and publication-boundary notes.
- `docs/ENGINEERING_PRACTICE_STANDARD.md` captures the CodeMind Graph engineering practice standard and current/planned implementation boundaries.
- v0.1 quality gate is now defined in `docs/RUBRIC.md`.
- `packages/core` graph schema is implemented.
- `packages/adapter-typescript` TypeScript Compiler API extraction is implemented.
- `packages/cli` supports `index` and writes `.codemind/graph.json`.
- `packages/cli` supports `find` and reads `.codemind/graph.json` for symbol lookup.
- `packages/cli` supports `trace` and reads `.codemind/graph.json` for symbol-level dependency context.
- `packages/cli` supports `map` and writes `CODEMIND.md`.
- `packages/cli` supports `mcp start --root <path>` and delegates to the read-only MCP server.
- `packages/core` exposes reusable graph query helpers used by CLI commands.
- `packages/mcp-server` exposes a read-only MCP skeleton with `find_symbol`, `get_repo_map`, and `trace_symbol`.
- GitHub Actions CI is configured in `.github/workflows/ci.yml` for push and pull request.
- Release checkpoint `b2d85fd` has been pushed to GitHub `main`; GitHub Actions CI passed `pnpm check`.
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
- GitHub repository is connected to the Vercel project under `vincent-lius-projects-de5eeb92`.
- Vercel project Root Directory is configured as `apps/web`.
- Focused tests cover graph builder determinism and TypeScript extraction.
- TypeScript adapter fixtures now cover richer imports, re-exports, classes, and methods for future trace work.
- Focused CLI tests cover symbol trace success and no-match behavior.
- Focused CLI tests cover MCP startup delegation and invalid MCP startup options.
- Focused MCP tests cover symbol lookup, markdown repo map retrieval, symbol trace retrieval, and graph path containment.
- MCP protocol smoke test covers SDK client stdio initialization, `tools/list`, and `tools/call`.
- `docs/NEXT_DEVELOPMENT_TOPICS.md` defines the next AI-native graph platform development topics and slice plan.

## Known gaps

- Runtime is Node.js `v22.22.3`; project blueprint mentions Node.js `v24.16.0` LTS.
- CLI supports `index`, `find`, `trace`, `map`, and `mcp start`; `explain` is not implemented yet.
- Phase 001 still has the optional `explain` CLI gap, but the minimum v0.1 graph, trace, map, read-only MCP flow, and richer TypeScript fixture coverage are implemented.
- SQLite storage is not implemented yet; the current index target is JSON under `.codemind/graph.json`.
- MCP currently reads only `.codemind/graph.json`; live indexing from MCP is intentionally out of scope.
- CI badge is not added yet; add it after the first GitHub Actions run is visible on `main`.
- Custom domain setup is not implemented yet.
- The Vincent Liu digital business card uses a normalized portrait asset generated from `C:\Users\vince\Downloads\20260528_161756790.JPG`.
- Codex in-app Browser currently has no registered `iab` backend in this app runtime.
- Codex Chrome Extension is installed and available in the selected Chrome profile.

## Immediate target

Add Graph freshness / stale index warning metadata using source fingerprints rather than mtime alone.
