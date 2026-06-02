# CodeMind Graph

[![CI](https://github.com/luciferyu666/codemind-graph/actions/workflows/ci.yml/badge.svg)](https://github.com/luciferyu666/codemind-graph/actions/workflows/ci.yml)

CodeMind Graph is a local-first code knowledge graph and read-only MCP server for AI coding agents.

It turns a TypeScript repository into a deterministic symbol graph, dependency graph, basic static call/reference graph, queryable CLI surface, and Markdown repo map that humans and agents can both read.

> Stop feeding agents raw files. Give them a code graph.

Official website: [codemind-graph.vercel.app](https://codemind-graph.vercel.app)

## Why This Exists

AI coding agents are useful, but large repositories still break their context. Raw file search, loose summaries, and one-off chat memory do not give an agent a stable model of symbols, files, imports, exports, or stale context.

CodeMind Graph focuses on a smaller deterministic loop:

- Build a local graph from repository source files.
- Query symbols and dependency context from the graph.
- Capture conservative `CALLS` edges for static function and method calls.
- Capture conservative `REFERENCES` edges for project-local symbol usage and re-exports.
- Build deterministic context packets for AI agents.
- Generate `CODEMIND.md` as a call/reference-aware repo map.
- Expose the same graph through read-only MCP tools.
- Warn when `.codemind/graph.json` is stale or missing freshness metadata.
- Check local graph readiness with `codemind health` and `codemind doctor`.

## v0.1 Scope

Included in v0.1:

- TypeScript-first repository scanner.
- TypeScript Compiler API extraction for files, imports, exports, functions, classes, interfaces, type aliases, enums, variables, and methods.
- Basic static `CALLS` edge extraction for same-file function calls, imported function calls, namespace calls, constructors, same-class `this.method()` calls, same-file/imported class methods, and simple chained class methods.
- Conservative static `REFERENCES` edge extraction for same-file symbols, imported symbols, namespace symbols, type-only imports, and explicit re-exports.
- `trace` / `trace_symbol` output includes `Calls Out` and `Called By` sections when `CALLS` edges are indexed.
- `trace`, `explain`, `context`, and `map` output includes reference context when `REFERENCES` edges are indexed.
- Deterministic graph schema with stable node and edge IDs.
- Local `.codemind/graph.json` graph index.
- Graph index metadata with indexer, adapter, adapter version, language, and capabilities.
- Graph freshness metadata with `indexedAt`, `rootDir`, `sourceFileCount`, and `sourceFingerprint`.
- CLI commands: `index`, `find`, `trace`, `explain`, `context`, `map`, `health`, `doctor`, and `mcp start`.
- Read-only MCP tools: `find_symbol`, `get_repo_map`, `trace_symbol`, and `explain_file`.
- Deterministic `CODEMIND.md` repo map output with call/reference edge summaries, top callers, top callees, top referencers, top referenced symbols, and edge tables.

## v0.1.1 Highlights

The current public release is `v0.1.1`. Compared with the `v0.1.0` checkpoint, it adds:

- richer conservative TypeScript `CALLS` extraction for namespace calls, constructors, same-file static methods, and simple chained class methods.
- call-aware `codemind trace`, `codemind explain`, `codemind map`, MCP `trace_symbol`, MCP `explain_file`, and MCP `get_repo_map` output.
- read-only MCP `explain_file` for deterministic file-level context.
- protocol-level MCP negative/error coverage for invalid inputs, graph path containment, stale indexes, legacy graph files, and engineering memory leakage checks.
- graph index metadata with indexer, adapter, adapter version, language, and capabilities.

Release notes: [`docs/RELEASE_NOTES_v0.1.1.md`](docs/RELEASE_NOTES_v0.1.1.md)

## Current Main Public MVP Hardening

Current `main` also includes the post-v0.1.1 Public MVP Hardening Pack:

- `codemind health` and `codemind doctor` readiness checks.
- `codemind context <symbol-or-path>` for deterministic agent-ready Markdown context packets.
- read-only MCP `get_context_pack` for the same bounded context packet.
- conservative deterministic `REFERENCES` edges for project-local impact analysis.
- npm package / bin readiness for source-based CLI trials.
- CI badge and install-from-source quickstart polish.
- richer public demo fixture in `examples/ts-agent-workspace`.
- sanitized committed demo map at `examples/ts-agent-workspace/CODEMIND.md`.
- read-only MCP client usage docs in `docs/MCP_CLIENT_USAGE.md`.

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

## Try From Source

CodeMind Graph is currently used from source. A packaged npm release is not published yet.

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

Build the CLI packages:

```powershell
pnpm build:packages
```

Run the CLI from the workspace root:

```powershell
pnpm codemind --help
```

`pnpm codemind` is intended for human CLI use from source. For MCP stdio clients, use the direct `node packages/cli/dist/index.js mcp start ...` form shown below so package-manager output cannot pollute the protocol stream.

## Package / Bin Readiness

Current `main` prepares the runtime packages for npm packing, but the packages have not been published to npm yet.

Runtime packages:

- `@codemind/core`
- `@codemind/adapter-typescript`
- `@codemind/mcp-server`
- `@codemind/cli`

Pack the runtime packages locally:

```powershell
pnpm pack:packages
```

This writes tarballs under `.codemind/npm-pack/`. The tarballs contain only `dist` artifacts and package metadata; source files, TypeScript config, and `.tsbuildinfo` files are excluded.

## Quickstart Demo

Index the richer public demo repository:

```powershell
pnpm codemind index examples/ts-agent-workspace
```

Check graph readiness:

```powershell
pnpm codemind health --root examples/ts-agent-workspace
pnpm codemind doctor --root examples/ts-agent-workspace
```

The index writes:

- `.codemind/graph.json`
- graph index metadata: indexer, adapter, language, capabilities
- graph freshness metadata: indexed time, root, source file count, source fingerprint

Find a symbol:

```powershell
pnpm codemind find ContextPackBuilder --root examples/ts-agent-workspace
```

Trace symbol context:

```powershell
pnpm codemind trace buildDemoContext --root examples/ts-agent-workspace
```

Trace output includes symbol location, imports, exports, related modules, indexed call context through `Calls Out` / `Called By`, and reference context through `References Out` / `Referenced By`.

Explain one indexed file:

```powershell
pnpm codemind explain src/context-pack.ts --root examples/ts-agent-workspace
```

Explain output includes file symbols, imports, exports, outgoing calls, external callers, outgoing references, external references, related modules, diagnostics, and freshness status.

Build an agent-ready context packet:

```powershell
pnpm codemind context buildDemoContext --root examples/ts-agent-workspace --limit 2 --repo-map-lines 80
```

Context output includes graph overview, freshness, target context, selected symbol traces, selected file explanations, call/reference tables, row-limited tables, and a bounded repo map excerpt.

Generate the repo map:

```powershell
pnpm codemind map --root examples/ts-agent-workspace --format markdown
```

Repo map output includes files, symbols, imports, exports, diagnostics, graph index metadata, freshness status, deterministic calls overview for indexed `CALLS` edges, and deterministic references overview for indexed `REFERENCES` edges.

Expected map sections:

```text
## Overview
## Freshness
## Files
## Symbols
## Imports
## Exports
## Calls
## References
## Diagnostics
```

Expected context packet sections:

```text
# Context Pack
## Overview
## Freshness
## Target Context
## Symbol Trace
## File Explain
## Repo Map Excerpt
```

The generated files are:

- `examples/ts-agent-workspace/.codemind/graph.json`
- `examples/ts-agent-workspace/CODEMIND.md`

A sanitized committed demo map is available at [`examples/ts-agent-workspace/CODEMIND.md`](examples/ts-agent-workspace/CODEMIND.md).

Start the read-only MCP server over stdio:

```powershell
node packages/cli/dist/index.js mcp start --root examples/ts-agent-workspace
```

`mcp start` intentionally writes no human-readable preamble to stdout because stdout is the MCP protocol stream.

Read-only MCP tools available in v0.1.1:

- `find_symbol`
- `get_repo_map`
- `trace_symbol`
- `explain_file`
- `get_context_pack`

MCP client setup notes: [`docs/MCP_CLIENT_USAGE.md`](docs/MCP_CLIENT_USAGE.md)

## Freshness Warnings

`codemind index` writes graph freshness metadata into `.codemind/graph.json`:

- `metadata.indexer`
- `metadata.indexerVersion`
- `metadata.adapter`
- `metadata.adapterVersion`
- `metadata.language`
- `metadata.capabilities`
- `indexedAt`
- `rootDir`
- `sourceFileCount`
- `sourceFingerprint`

`metadata.capabilities` currently reports:

```text
symbols, imports, exports, calls, references
```

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
