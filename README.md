# CodeMind Graph

A local-first code knowledge graph and read-only MCP server that helps AI coding agents understand, query, and maintain large repositories.

> Stop feeding agents raw files. Give them a code graph.

## Positioning

CodeMind Graph is an AI-native knowledge layer for coding agents. It turns a repository into a deterministic symbol graph, dependency graph, and queryable architecture map.

The v0.1 target is intentionally narrow:

- TypeScript-first repository scanner
- Symbol graph and dependency graph model
- CLI-first deterministic queries
- Read-only MCP server
- Local-first SQLite storage
- Persistent project context for long-running Codex sessions

## Workspace

Primary local workspace:

```text
F:\Codex Projects\codemind-graph
```

Open with Codex Desktop:

```powershell
codex app "F:\Codex Projects\codemind-graph"
```

Resume the engineering session:

```powershell
codex resume "Inspect codemind-graph repo" -C "F:\Codex Projects\codemind-graph"
```

## Development

Install dependencies:

```powershell
pnpm install
```

Run checks:

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Run the local graph CLI demo:

```powershell
node packages/cli/dist/index.js index examples/ts-basic
node packages/cli/dist/index.js find greet --root examples/ts-basic
node packages/cli/dist/index.js trace greet --root examples/ts-basic
node packages/cli/dist/index.js map --root examples/ts-basic --format markdown
```

Run the official website locally:

```powershell
pnpm --filter @codemind/web dev
```

Run browser QA for the official website:

```powershell
pnpm playwright:install
pnpm test:e2e
```

Run the same browser QA against a deployed URL:

```powershell
$env:CODEMIND_WEB_BASE_URL = "https://your-vercel-site.vercel.app"
pnpm test:e2e:remote
Remove-Item Env:\CODEMIND_WEB_BASE_URL
```

Prepare the official website for Vercel:

```powershell
pnpm --filter @codemind/web build
pnpm test:e2e
pnpm check
```

Vercel deployment readiness notes are maintained in `docs/VERCEL_DEPLOYMENT.md`. Set `NEXT_PUBLIC_CODEMIND_SITE_URL` before production launch if the final public URL differs from `https://codemind-graph.vercel.app`.

## CI

GitHub Actions runs `pnpm install --frozen-lockfile` and `pnpm check` on push and pull request.

Browser QA is defined in `.github/workflows/browser-qa.yml` and runs Playwright Chromium checks for website-related pull requests.
