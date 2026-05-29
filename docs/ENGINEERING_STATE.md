# Engineering State

Last updated: 2026-05-30

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
- Initial bootstrap commit pushed to `origin/main`.

## Verification

- Dependency install: passed with `pnpm install`.
- Frozen dependency install: passed with `pnpm install --frozen-lockfile`.
- Typecheck: passed with `pnpm typecheck`, including `@codemind/web`.
- Tests: passed with `pnpm test` using 19 focused `node:test` tests.
- Build: passed with `pnpm build`, including `@codemind/web`.
- Consolidated check: passed with `pnpm check` on 2026-05-30 after Engineering Practices website integration.
- Browser QA: passed with `pnpm test:e2e` using Chromium desktop and mobile projects after Slice W4b Engineering Practices integration.
- GitHub Actions CI workflow: `.github/workflows/ci.yml` runs on push and pull request with Windows, Node.js `24.x`, pnpm `10.10.0`, frozen install, and `pnpm check`.
- Browser QA workflow: `.github/workflows/browser-qa.yml` runs Playwright Chromium checks for website-related pull requests.

## Website verification

Result:

- `apps/web` typecheck passed with `pnpm --filter @codemind/web typecheck`.
- `apps/web` production build passed with `pnpm --filter @codemind/web build`.
- Next.js prerenders `/`, `/_not-found`, `/en`, `/zh-TW`, `/en/engineering`, `/zh-TW/engineering`, `/robots.txt`, and `/sitemap.xml`.
- Locale pages publish canonical links, locale alternates, Open Graph metadata, Twitter metadata, and generated social image references.
- `/sitemap.xml` contains `/en`, `/zh-TW`, `/en/engineering`, and `/zh-TW/engineering` with language alternates.
- `/robots.txt` allows public landing pages and Engineering Practices pages, and disallows `.codemind/`, `docs/`, `Documentations/`, and API paths.
- Engineering Practices routes publish locale-specific canonical links, alternates, Open Graph metadata, and Twitter metadata.
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
node packages/cli/dist/index.js map --root examples/ts-basic --format markdown
```

Result:

- Indexed 1 TypeScript source file.
- Wrote `examples/ts-basic/.codemind/graph.json`.
- Found `function greet` in `src/index.ts`.
- Traced `function greet` to its file-level imports, exports, and related modules.
- Wrote `examples/ts-basic/CODEMIND.md`.

## Trace verification

Result:

- `packages/core` exposes `traceSymbols` and `renderMarkdownSymbolTrace`.
- `codemind trace <symbol>` reads `.codemind/graph.json` and emits deterministic Markdown.
- Trace output includes symbol, location, file, imports, exports, and related module tables.
- No-match trace returns exit code `2` with deterministic Markdown output.

## MCP verification

Result:

- `packages/mcp-server` creates a stdio-capable MCP server with read-only tool annotations.
- `find_symbol` reads `.codemind/graph.json` and returns deterministic Markdown symbol rows.
- `get_repo_map` reads `.codemind/graph.json` and returns deterministic `CODEMIND.md` Markdown.
- `trace_symbol` reads `.codemind/graph.json` and returns deterministic Markdown symbol trace output.
- `codemind mcp start --root <path>` delegates to the read-only MCP stdio server without writing stdout before transport startup.
- MCP protocol smoke coverage starts `node packages/cli/dist/index.js mcp start --root examples/ts-basic` through SDK stdio transport and verifies initialize, `tools/list`, and `tools/call`.
- Protocol-level `find_symbol` finds `greet`; protocol-level `get_repo_map` returns Markdown repo map content; protocol-level `trace_symbol` returns symbol trace context.
- Protocol-level tool metadata verifies read-only, non-destructive, and non-open-world annotations.
- MCP graph paths are constrained to the selected root.
- `packages/mcp-server/src` contains no file write APIs, shell execution APIs, engineering memory file exposure, or production `any` types.

## TypeScript adapter verification

Result:

- Adapter fixture coverage verifies side-effect, default-and-named, type-only, namespace, and external imports.
- Re-export fixture coverage verifies named re-exports, type re-exports, export-all re-exports, and deterministic `exportNames` metadata.
- Class and method fixture coverage verifies exported classes and non-exported method symbols with `ClassName.methodName` names.

## Documentation imports

- Imported `Documentations/ChatGPT-專案排序與建議 (5).md`.
- Imported `Documentations/ChatGPT-專案排序與建議 (6).md`.
- Added `docs/AGENT_HARNESS.md`.
- Added `docs/NEXT_DEVELOPMENT_TOPICS.md`.
- Added `docs/OFFICIAL_WEBSITE_PLAN.md` for the future official website and Vercel deployment track.
- Added `docs/VERCEL_DEPLOYMENT.md` for Slice W4 deployment readiness.
- Added `Documentations/ChatGPT 對話紀錄重點摘要 - 2026-05-30 Export 6.md`.
- Added `docs/TOOLCHAIN.md` for verified local toolchain, Current vs Planned boundaries, MCP role mapping, and Slice H freshness guidance.
- Added `docs/OPEN_SOURCE_STRATEGY_2026.md` for the 2026 open-source strategy brief and project ranking.
- Added `docs/AI_AGENT_INFRASTRUCTURE_WHITEPAPER_2026.md` for the 2026 AI Agent infrastructure strategy whitepaper.
- Added `docs/ENGINEERING_PRACTICE_STANDARD.md` for CodeMind Graph engineering practice standards.

## Latest website update

Result:

- Integrated the CodeMind Graph engineering practice standard into the official website.
- Added bilingual Engineering Practices routes at `/en/engineering` and `/zh-TW/engineering`.
- Added landing page `Why CodeMind Graph`, engineering standards, architecture, and brand positioning sections.
- Updated sitemap, robots, route metadata, Playwright route assertions, and visual baselines.
- `pnpm test:e2e` passed with 16 tests and 2 project-scoped skips.
- `pnpm check` passed with 19 `node:test` tests.

## Latest documentation-only update

Result:

- Export 6 was reviewed on 2026-05-30.
- The in-chat 2026 open-source strategy brief was distilled on 2026-05-30.
- The in-chat 2026 AI Agent infrastructure whitepaper was distilled on 2026-05-30.
- The in-chat CodeMind Graph engineering practice standard was distilled on 2026-05-30.
- No TypeScript source files were changed for this import.
- `pnpm check` was not rerun because the update is documentation-only.
