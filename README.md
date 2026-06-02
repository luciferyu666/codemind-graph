# CodeMind Graph

CodeMind Graph is a local-first code knowledge graph and read-only MCP server for AI coding agents.

It turns a TypeScript repository into a deterministic symbol graph, dependency graph, basic static call graph, queryable CLI surface, and Markdown repo map that humans and agents can both read.

> Stop feeding agents raw files. Give them a code graph.

Official website: [codemind-graph.vercel.app](https://codemind-graph.vercel.app)

## Why This Exists

AI coding agents are useful, but large repositories still break their context. Raw file search, loose summaries, and one-off chat memory do not give an agent a stable model of symbols, files, imports, exports, or stale context.

CodeMind Graph focuses on a smaller deterministic loop:

- Build a local graph from repository source files.
- Query symbols and dependency context from the graph.
- Capture conservative `CALLS` edges for static function and method calls.
- Generate `CODEMIND.md` as a call-aware repo map.
- Expose the same graph through read-only MCP tools.
- Warn when `.codemind/graph.json` is stale or missing freshness metadata.

## v0.1 Scope

Included in v0.1:

- TypeScript-first repository scanner.
- TypeScript Compiler API extraction for files, imports, exports, functions, classes, interfaces, type aliases, enums, variables, and methods.
- Basic static `CALLS` edge extraction for same-file function calls, imported function calls, namespace calls, constructors, same-class `this.method()` calls, same-file/imported class methods, and simple chained class methods.
- `trace` / `trace_symbol` output includes `Calls Out` and `Called By` sections when `CALLS` edges are indexed.
- Deterministic graph schema with stable node and edge IDs.
- Local `.codemind/graph.json` graph index.
- Graph freshness metadata with `indexedAt`, `rootDir`, `sourceFileCount`, and `sourceFingerprint`.
- CLI commands: `index`, `find`, `trace`, `explain`, `map`, and `mcp start`.
- Read-only MCP tools: `find_symbol`, `get_repo_map`, `trace_symbol`, and `explain_file`.
- Deterministic `CODEMIND.md` repo map output with call edge summary, top callers, top callees, and call edge tables.

Non-goals for v0.1:

- No write-capable MCP tools.
- No automatic code editing.
- No natural-language `ask` layer.
- No hosted graph sync.
- No web dashboard product.
- No deep Python support.
- No security scanner.
- No complete dynamic dispatch, higher-order call graph, or runtime call graph.

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

## Quickstart Demo

Build the packages first so the CLI entrypoint exists:

```powershell
pnpm build:packages
```

Index the example repository:

```powershell
node packages/cli/dist/index.js index examples/ts-basic
```

Find a symbol:

```powershell
node packages/cli/dist/index.js find greet --root examples/ts-basic
```

Trace symbol context:

```powershell
node packages/cli/dist/index.js trace greet --root examples/ts-basic
```

Trace output includes symbol location, imports, exports, related modules, and indexed call context through `Calls Out` / `Called By`.

Explain one indexed file:

```powershell
node packages/cli/dist/index.js explain src/index.ts --root examples/ts-basic
```

Explain output includes file symbols, imports, exports, outgoing calls, external callers, related modules, diagnostics, and freshness status.

Generate the repo map:

```powershell
node packages/cli/dist/index.js map --root examples/ts-basic --format markdown
```

Repo map output includes files, symbols, imports, exports, diagnostics, and a deterministic calls overview for indexed `CALLS` edges.

The generated files are:

- `examples/ts-basic/.codemind/graph.json`
- `examples/ts-basic/CODEMIND.md`

Start the read-only MCP server over stdio:

```powershell
node packages/cli/dist/index.js mcp start --root examples/ts-basic
```

`mcp start` intentionally writes no human-readable preamble to stdout because stdout is the MCP protocol stream.

## Freshness Warnings

`codemind index` writes graph freshness metadata into `.codemind/graph.json`:

- `indexedAt`
- `rootDir`
- `sourceFileCount`
- `sourceFingerprint`

`codemind find`, `codemind trace`, `codemind explain`, `codemind map`, and MCP tools compare the current source fingerprint against the indexed fingerprint. If the index is stale or was created before freshness metadata existed, the output includes a deterministic warning/status instead of crashing.

Example stale warning:

```text
Warning: graph freshness is stale: source fingerprint changed since the graph was indexed
```

## Read-only MCP Safety Boundary

The MCP server is read-only by design. v0.1 tools only read `.codemind/graph.json` inside the selected root and return deterministic graph context.

The MCP server does not expose:

- file writes
- shell execution
- package installation
- Git operations
- code mutation
- engineering memory files such as `docs/SESSION_STATE.md`

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
