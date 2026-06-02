# Engineering State

Last updated: 2026-06-02

## Local tools

- PowerShell: `7.5.5`
- Git: `2.48.1.windows.1`
- Node.js: `v22.22.3`
- pnpm: `10.10.0`
- GitHub CLI: `2.89.0`
- VS Code CLI: `1.121.0`
- Codex CLI: `0.135.0`

## Git configuration

- `core.autocrlf`: `true`
- `init.defaultBranch`: `main`
- Local branch: `main`
- Remote: `origin -> https://github.com/luciferyu666/codemind-graph.git`
- Upstream: `origin/main`

## Codex health

- `codex doctor`: passed with 13 ok, 1 idle, 1 note, 0 warn, 0 fail.
- Codex auth: ChatGPT auth configured.
- Codex configured cwd: `F:\Codex Projects\codemind-graph`
- Codex app-server: not running; current mode is ephemeral.
- Codex Desktop sidebar synchronization: confirmed. `codemind-graph` appears under Projects with `Inspect codemind-graph repo`.

## GitHub status

- GitHub CLI authenticated as `luciferyu666`.
- Repository `luciferyu666/codemind-graph` exists on GitHub.
- Repository visibility: public.
- Repository URL: `https://github.com/luciferyu666/codemind-graph`.
- Local `origin` points to `https://github.com/luciferyu666/codemind-graph.git`.
- Release checkpoint `60092e5` (`feat: prepare v0.1 release checkpoint`) pushed to `origin/main`.
- Release tag `v0.1.0` points to `60092e5`.
- GitHub Actions CI run `26744683567` passed `pnpm check` on `main`.

## Vercel status

- Target dashboard/team slug requested by project owner: `vincent-lius-projects-de5eeb92`.
- Vercel CLI is installed as `54.6.1`.
- Vercel CLI is authenticated as `luciferyu666`.
- Active Vercel team: `vincent-lius-projects-de5eeb92` (`Vincent Liu's projects`).
- `apps/web` is linked to Vercel project `codemind-graph`.
- GitHub repository `https://github.com/luciferyu666/codemind-graph` is connected to the Vercel project.
- Vercel project Root Directory is configured as `apps/web`.
- Vercel project ID: `prj_1KX0DWGVnWAarFwnBMDWwEikvNoT`.
- Vercel org ID: `team_J3gReNe6pjh5lSeqL4I7vKTw`.
- Manual production deployment ID: `dpl_Ga9gXKbh5WfqYBoAp6bHVqa7PQSv`.
- Git-triggered production deployment ID: `dpl_4WescTDuCzWjERWBetMXH5krotBf`.
- Vincent Liu profile production deployment is verified through the production alias.
- Production URL: `https://codemind-graph.vercel.app`.
- Remote Browser QA passed against the production URL.

## Verification

- Dependency install: passed with `pnpm install`.
- Frozen dependency install: passed with `pnpm install --frozen-lockfile`.
- Typecheck: passed with `pnpm typecheck`, including `@codemind/web`.
- Tests: passed with `pnpm test` using 26 focused `node:test` tests.
- Build: passed with `pnpm build`, including `@codemind/web`.
- Consolidated check: passed with `pnpm check` on 2026-06-02 after Slice N call-aware repo map output.
- Browser QA: passed with `pnpm test:e2e` using Chromium desktop and mobile projects after Slice W6 digital business card integration.
- GitHub Actions CI workflow: `.github/workflows/ci.yml` runs on push and pull request with `windows-2025-vs2026`, Node.js `24.x`, pnpm `10.10.0`, frozen install, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`, Node.js 24 action majors, and `pnpm check`.
- Browser QA workflow: `.github/workflows/browser-qa.yml` runs Playwright Chromium checks for website-related pull requests with `windows-2025-vs2026`, `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`, and Node.js 24 action majors.

## Website verification

Result:

- `apps/web` typecheck passed with `pnpm --filter @codemind/web typecheck`.
- `apps/web` production build passed with `pnpm --filter @codemind/web build`.
- Next.js prerenders `/`, `/_not-found`, `/en`, `/zh-TW`, `/en/engineering`, `/zh-TW/engineering`, `/en/vincent-liu`, `/zh-TW/vincent-liu`, `/robots.txt`, and `/sitemap.xml`.
- Locale pages publish canonical links, locale alternates, Open Graph metadata, Twitter metadata, and generated social image references.
- `/sitemap.xml` contains `/en`, `/zh-TW`, `/en/engineering`, `/zh-TW/engineering`, `/en/vincent-liu`, and `/zh-TW/vincent-liu` with language alternates.
- `/robots.txt` allows public landing pages, Engineering Practices pages, and Vincent Liu profile pages, and disallows `.codemind/`, `docs/`, `Documentations/`, and API paths.
- Engineering Practices routes publish locale-specific canonical links, alternates, Open Graph metadata, and Twitter metadata.
- Vincent Liu digital business card routes publish locale-specific canonical links, alternates, Open Graph metadata, Twitter metadata, featured project links, and responsive layout coverage.
- Landing page now includes `Why CodeMind Graph`, engineering standards, and brand positioning sections.

## Browser automation verification

Status:

- Codex in-app Browser backend list returned no registered browser backends.
- `agent.browsers.get("iab")` reported the in-app Browser backend is unavailable.
- Chrome Extension backend is available through the Codex Chrome Extension.
- `agent.browsers.list()` returns Chrome extension backends.
- Chrome is installed and running.
- Chrome native host manifest is installed and correct.
- Codex Chrome Extension is installed and enabled in the selected Chrome `Default` profile.
- Repo-managed Playwright Chromium runtime is configured for E2E, screenshots, and visual baselines.

Verification:

- Chrome-backed browser navigation to `http://127.0.0.1:3000/en`: passed.
- Chrome-backed DOM inspection and screenshot capture: passed.
- Chrome-backed language-switch click interaction to `/zh-TW`: passed.
- `pnpm playwright:install`: passed.
- `pnpm test:e2e:update`: passed and generated desktop/mobile visual baselines.
- `pnpm test:e2e`: passed with 16 tests and 2 project-scoped skips after adding Engineering Practices route coverage and updated visual baselines.

## Manual CLI verification

Command:

```powershell
node packages/cli/dist/index.js index examples/ts-basic
node packages/cli/dist/index.js find greet --root examples/ts-basic
node packages/cli/dist/index.js trace greet --root examples/ts-basic
node packages/cli/dist/index.js explain src/index.ts --root examples/ts-basic
node packages/cli/dist/index.js map --root examples/ts-basic --format markdown
```

Result:

- Indexed 1 TypeScript source file.
- Wrote `examples/ts-basic/.codemind/graph.json`.
- Graph index now includes `indexedAt`, `rootDir`, `sourceFileCount`, and `sourceFingerprint`.
- Found `function greet` in `src/index.ts`.
- Traced `function greet` to its file-level imports, exports, and related modules.
- Explained `src/index.ts` with file overview, symbols, imports, exports, related modules, diagnostics, and freshness status.
- `find` returned no freshness warning for a fresh index.
- `trace`, `explain`, and `map` include a `Freshness` section when run against a graph index.
- Wrote call-aware `examples/ts-basic/CODEMIND.md` during map verification.

## Trace verification

Result:

- `packages/core` exposes `traceSymbols` and `renderMarkdownSymbolTrace`.
- `codemind trace <symbol>` reads `.codemind/graph.json` and emits deterministic Markdown.
- Trace output includes symbol, location, file, imports, exports, `Calls Out`, `Called By`, and related module tables.
- Trace output includes graph freshness status.
- No-match trace returns exit code `2` with deterministic Markdown output.

## Explain verification

Result:

- `packages/core` exposes `explainFile` and `renderMarkdownFileExplain`.
- `codemind explain <path>` reads `.codemind/graph.json` and emits deterministic Markdown.
- Explain output includes file overview, symbols, imports, exports, `Calls Out`, `Called By`, related modules, diagnostics, and graph freshness status.
- No-match explain returns exit code `2` with deterministic Markdown output.

## MCP verification

Result:

- `packages/mcp-server` creates a stdio-capable MCP server with read-only tool annotations.
- `find_symbol` reads `.codemind/graph.json` and returns deterministic Markdown symbol rows.
- `get_repo_map` reads `.codemind/graph.json` and returns deterministic call-aware `CODEMIND.md` Markdown.
- `trace_symbol` reads `.codemind/graph.json` and returns deterministic Markdown symbol trace output.
- `explain_file` reads `.codemind/graph.json` and returns deterministic Markdown file explain output.
- `codemind mcp start --root <path>` delegates to the read-only MCP stdio server without writing stdout before transport startup.
- MCP protocol smoke coverage starts `node packages/cli/dist/index.js mcp start --root examples/ts-basic` through SDK stdio transport and verifies initialize, `tools/list`, and `tools/call`.
- Protocol-level `find_symbol` finds `greet`; protocol-level `get_repo_map` returns call-aware Markdown repo map content; protocol-level `trace_symbol` returns symbol trace and `CALLS` context; protocol-level `explain_file` returns file explain context.
- MCP tool responses include graph freshness status.
- Protocol-level negative/error coverage verifies missing graph files, root escape attempts, graph path escape attempts, invalid tool input, legacy freshness metadata, stale freshness status, and engineering memory leakage checks.
- Protocol-level tool metadata verifies read-only, non-destructive, and non-open-world annotations.
- MCP graph paths are constrained to the selected root.
- `packages/mcp-server/src` contains no file write APIs, shell execution APIs, engineering memory file exposure, or production `any` types.

## TypeScript adapter verification

Result:

- Adapter fixture coverage verifies side-effect, default-and-named, type-only, namespace, and external imports.
- Re-export fixture coverage verifies named re-exports, type re-exports, export-all re-exports, and deterministic `exportNames` metadata.
- Class and method fixture coverage verifies exported classes and non-exported method symbols with `ClassName.methodName` names.
- Slice K/M `CALLS` edge fixture coverage verifies same-file function calls, imported function calls, namespace calls, constructor calls, same-class `this.method()` calls, same-file/imported class method calls, simple chained class method calls, and top-level variable initializer callers.

## Documentation imports

- Imported `Documentations/ChatGPT-專案排序與建議 (5).md`.
- Imported `Documentations/ChatGPT-專案排序與建議 (6).md`.
- Imported `Documentations/ChatGPT-專案排序與建議 (7).md`.
- Imported `Documentations/ChatGPT-專案排序與建議 (8).md`.
- Imported `Documentations/ChatGPT-專案排序與建議 (9).md`.
- Imported `Documentations/CodeMind Graph 商業化與變現策略藍圖.md`.
- Added `docs/AGENT_HARNESS.md`.
- Added `docs/NEXT_DEVELOPMENT_TOPICS.md`.
- Added `docs/OFFICIAL_WEBSITE_PLAN.md` for the future official website and Vercel deployment track.
- Added `docs/VERCEL_DEPLOYMENT.md` for Slice W4 deployment readiness.
- Added `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-05-30 Export 6.md`.
- Added `docs/TOOLCHAIN.md` for verified local toolchain, Current vs Planned boundaries, MCP role mapping, and Slice H freshness guidance.
- Added `docs/OPEN_SOURCE_STRATEGY_2026.md` for the 2026 open-source strategy brief and project ranking.
- Added `docs/AI_AGENT_INFRASTRUCTURE_WHITEPAPER_2026.md` for the 2026 AI Agent infrastructure strategy whitepaper.
- Added `docs/ENGINEERING_PRACTICE_STANDARD.md` for CodeMind Graph engineering practice standards.
- Added `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-05-30 Export 7.md` for public-narrative corrections, 90-day focus, and Slice H prioritization.
- Added `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-06-01 Export 8.md` for Task Decomposition, Task Contract, Agentic Workflow, MCP safety, `/goal`, and Slice H guidance.
- Added `docs/TASK_DECOMPOSITION_GUIDE.md` for the Human SOP -> Skill -> Task Contract -> Agentic Workflow model and Slice H task contract.
- Added `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-06-01 Export 9.md` for enterprise Agentic Workflow refinements and the unresolved monetization-blueprint gap.
- Added `docs/BUSINESS_MONETIZATION_BLUEPRINT.md` for CodeMind Graph product positioning, commercial model, pricing caveats, target markets, productization stages, and first paid wedge.

## Latest website update

Result:

- Integrated the CodeMind Graph engineering practice standard into the official website.
- Added bilingual Engineering Practices routes at `/en/engineering` and `/zh-TW/engineering`.
- Added landing page `Why CodeMind Graph`, engineering standards, architecture, and brand positioning sections.
- Updated sitemap, robots, route metadata, Playwright route assertions, and visual baselines.
- `pnpm test:e2e` passed with 16 tests and 2 project-scoped skips.
- `pnpm check` passed with 19 `node:test` tests.
- GitHub `main` was pushed and GitHub Actions CI passed.
- Production Vercel deployment is complete at `https://codemind-graph.vercel.app`.
- Vercel standalone build required `apps/web/tsconfig.json` to be self-contained and `typescript` / `@types/node` to be present in `apps/web` dev dependencies.

## Latest documentation-only update

Result:

- Export 6 was reviewed on 2026-05-30.
- The in-chat 2026 open-source strategy brief was distilled on 2026-05-30.
- The in-chat 2026 AI Agent infrastructure whitepaper was distilled on 2026-05-30.
- The in-chat CodeMind Graph engineering practice standard was distilled on 2026-05-30.
- No TypeScript source files were changed for this import.
- `pnpm check` was not rerun because the update is documentation-only.

## Latest ChatGPT export update

Result:

- Export 9 was reviewed on 2026-06-01.
- The raw export was archived under `Documentations/`.
- The summary emphasizes enterprise Agentic Workflow refinements: hybrid rules + agents + approvals + audit logs, deterministic safety boundaries, structured artifacts, eval logs, HITL workflow gates, and avoiding over-decomposition.
- The export prompt requested monetization analysis, but the response did not complete a business blueprint.
- The recommended engineering priority remains Slice H: Graph freshness / stale index warning metadata.
- No TypeScript source files were changed for this import.
- `pnpm check` was not rerun because the update is documentation-only.

## Latest business strategy update

Result:

- The CodeMind Graph business and monetization blueprint was reviewed on 2026-06-01.
- The raw file was archived under `Documentations/`.
- `docs/BUSINESS_MONETIZATION_BLUEPRINT.md` now defines the open-core, Pro, Team, Enterprise, and Legacy Repo Onboarding Pack strategy.
- Official competitor pricing pages were spot-checked on 2026-06-01, but public-facing pricing claims should be revalidated before publication.
- No TypeScript source files were changed for this import.
- `pnpm check` was not rerun because the update is documentation-only.

## Latest website profile update

Result:

- Added Vincent Liu digital business card pages at `/en/vincent-liu` and `/zh-TW/vincent-liu`.
- Added bilingual profile positioning, contact CTA, core expertise, featured projects, project status, route metadata, sitemap entries, and robots allow rules.
- Added normalized portrait asset at `apps/web/public/vincent-liu/portrait.jpg` from `C:\Users\vince\Downloads\20260528_161756790.JPG`.
- `pnpm --filter @codemind/web build` passed.
- `pnpm test:e2e` passed with 18 tests and 2 project-scoped skips.
- `pnpm check` passed with 19 `node:test` tests.
- Existing local Next.js dev server on `http://127.0.0.1:3000` returned `200` for `/en/vincent-liu` and `/zh-TW/vincent-liu`.
- Browser plugin verification opened `http://127.0.0.1:3000/en/vincent-liu` through the Chrome Extension backend and confirmed the `Vincent Liu` hero heading is visible with loaded portrait image dimensions `960x1280`.
- Git commit `9527da4` was pushed to `origin/main`.
- Vercel production deployment completed and was aliased to `https://codemind-graph.vercel.app`.
- Remote Browser QA passed against production with `CODEMIND_WEB_BASE_URL=https://codemind-graph.vercel.app pnpm test:e2e:remote`.
- GitHub Actions CI run `26678510880` passed on `main`.
- Vercel error log scan returned no error logs for the last hour.

## Latest Slice H and v0.1 readiness update

Result:

- Implemented graph freshness metadata in `packages/core` and `packages/cli`.
- `codemind index` writes `indexedAt`, `rootDir`, `sourceFileCount`, and content-based `sourceFingerprint`.
- `codemind find`, `codemind trace`, and `codemind map` report stale or unknown graph freshness without crashing on legacy graph files.
- MCP `find_symbol`, `get_repo_map`, and `trace_symbol` return graph freshness status while preserving the read-only boundary.
- Added CLI tests for stale source fingerprints and legacy graph indexes without freshness metadata.
- Added MCP and MCP protocol assertions for freshness status.
- Updated README with v0.1 positioning, quickstart demo, freshness warnings, read-only MCP safety boundary, scope, and non-goals.
- Added `docs/LEGACY_REPO_ONBOARDING_PACK.md` for the first service-oriented commercial wedge.
- Updated `docs/DECISIONS.md`, `docs/RUBRIC.md`, `docs/CURRENT_STATE.md`, and `docs/SESSION_STATE.md`.
- `pnpm test` passed with 22 `node:test` tests.
- `pnpm check` passed on 2026-06-01.
- Manual CLI verification passed:

```powershell
node packages/cli/dist/index.js index examples/ts-basic
node packages/cli/dist/index.js find greet --root examples/ts-basic
```

## Latest CI runtime update

Result:

- Updated `.github/workflows/ci.yml` to use `windows-2025-vs2026`.
- Updated `.github/workflows/browser-qa.yml` to use `windows-2025-vs2026`.
- Added `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` to both workflows to opt into the Node.js 24 JavaScript action runtime ahead of GitHub's Node 20 action runtime deprecation.
- Upgraded GitHub Actions steps to Node.js 24 runtime majors: `actions/checkout@v6`, `actions/setup-node@v6`, `pnpm/action-setup@v6`, and `actions/upload-artifact@v6`.
- Rationale is based on GitHub Actions deprecation notices for Node.js 20 action runtime and the Windows Server 2025 / Visual Studio 2026 image migration.
- Local `pnpm check` passed after the workflow and documentation updates.

## Latest Slice I explain update

Result:

- Implemented `codemind explain <path>` in `packages/cli`.
- Added reusable file explain helpers in `packages/core`.
- Explain output remains read-only and only reads `.codemind/graph.json`.
- Added focused CLI tests for explain success and missing indexed file behavior.
- `pnpm test` passed with 24 `node:test` tests.
- `pnpm check` passed.
- Manual CLI verification passed:

```powershell
node packages/cli/dist/index.js index examples/ts-basic
node packages/cli/dist/index.js find greet --root examples/ts-basic
node packages/cli/dist/index.js trace greet --root examples/ts-basic
node packages/cli/dist/index.js explain src/index.ts --root examples/ts-basic
node packages/cli/dist/index.js map --root examples/ts-basic --format markdown
```

## Latest Slice J MCP protocol update

Result:

- Added MCP stdio protocol negative/error coverage in `test/mcp-protocol.test.mjs`.
- Covered missing `.codemind/graph.json`.
- Covered root escape attempts and graph path escape attempts.
- Covered invalid tool input through the MCP client.
- Covered legacy graph indexes without freshness metadata.
- Covered stale graph freshness status after source changes.
- Verified negative/error outputs do not leak `SESSION_STATE`, `CURRENT_STATE`, `ENGINEERING_STATE`, or `SECRET_SESSION_NOTE`.
- Focused protocol verification passed:

```powershell
pnpm build:packages
node --test test/mcp-protocol.test.mjs
```
- Full `pnpm check` passed with 25 `node:test` tests.

## Latest Slice K TypeScript CALLS update

Result:

- Implemented conservative TypeScript `CALLS` edge extraction in `packages/adapter-typescript`.
- Slice M expands coverage to namespace calls, constructor calls, same-file static methods, and simple chained class methods.
- Covered same-file function calls, imported function calls, namespace calls, constructor calls, same-class `this.method()` calls, same-file/imported class method calls, and simple chained class method calls.
- Kept local variable initializer calls inside methods/functions attributed to the enclosing method/function.
- Kept dynamic dispatch, arbitrary chained calls, higher-order calls, interface dispatch, and full TypeChecker-backed call resolution out of scope.
- Focused adapter verification passed:

```powershell
pnpm build:packages
node --test test/typescript-adapter.test.mjs
```

- Full verification passed:

```powershell
pnpm check
```

## Latest CALLS trace/MCP context update

Result:

- `packages/core` trace helpers now include outgoing and incoming `CALLS` edges as `callsOut` and `calledBy`.
- `renderMarkdownSymbolTrace` now renders `Calls Out` and `Called By` sections.
- CLI `codemind trace` and MCP `trace_symbol` use the same renderer, so both surfaces expose call context without separate implementations.
- Focused verification passed:

```powershell
pnpm build:packages
node --test test/core.test.mjs test/cli-index.test.mjs test/mcp-server.test.mjs test/mcp-protocol.test.mjs
```

- Full verification passed:

```powershell
pnpm check
```

## Latest Slice L call-aware explain update

Result:

- `packages/core` file explanations now include outgoing `CALLS` edges for symbols defined in the explained file.
- File explanations also include incoming `CALLS` edges from external symbols into symbols defined in the explained file.
- `renderMarkdownFileExplain` now renders `Calls Out` and `Called By` sections.
- CLI `codemind explain <path>` exposes this context without adding a new command.
- Focused verification passed:

```powershell
pnpm build:packages
node --test test/core.test.mjs test/cli-index.test.mjs
```

- Full verification passed:

```powershell
pnpm check
```

## Latest MCP explain_file update

Result:

- Added read-only MCP `explain_file` tool in `packages/mcp-server`.
- `explain_file` reuses `renderMarkdownFileExplain` from `packages/core`.
- Input schema accepts `path`, optional `root`, and optional `graph`.
- Direct MCP tests verify file explain output, freshness, and `CALLS` sections.
- Protocol tests verify `tools/list`, read-only annotations, `tools/call`, invalid input handling, and no engineering memory leakage.
- Focused verification passed:

```powershell
pnpm build:packages
node --test test/mcp-server.test.mjs test/mcp-protocol.test.mjs
```

- Full verification passed:

```powershell
pnpm check
```

## Latest Slice N call-aware repo map update

Result:

- `renderMarkdownRepoMap` now includes a `Calls` section.
- Repo map output includes call edge count, unique callers, unique callees, top callers, top callees, and deterministic call edge rows.
- CLI `codemind map` and MCP `get_repo_map` share the same renderer, so both surfaces expose the same call-aware `CODEMIND.md` output.
- Focused verification passed:

```powershell
pnpm build:packages
node --test test/cli-index.test.mjs test/mcp-server.test.mjs test/mcp-protocol.test.mjs
```

- Full verification passed:

```powershell
pnpm check
```
