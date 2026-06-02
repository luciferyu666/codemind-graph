# Release Notes Draft: v0.1.1

Status: draft

Target tag: `v0.1.1`

Base checkpoint: `v0.1.0`

## Positioning

`v0.1.1` is a reliability and context-quality release for the local-first CodeMind Graph v0.1 line.

The release keeps the product focused on deterministic TypeScript graph indexing, CLI queries, and read-only MCP tools. It does not add natural-language QA, write-capable MCP tools, cloud sync, Python support, or a web dashboard product.

## Highlights

- Richer conservative TypeScript `CALLS` edge extraction.
- Call-aware `codemind trace`, `codemind explain`, and `codemind map`.
- Read-only MCP `explain_file` tool.
- MCP protocol smoke and negative/error coverage.
- Call-aware `CODEMIND.md` repo map output.
- Graph index metadata for adapter/version/capability awareness.
- Legacy graph compatibility for missing freshness or index metadata.

## CLI Changes

### `codemind trace <symbol>`

Trace output now includes:

- `Calls Out`
- `Called By`

This makes symbol-level context more useful for impact analysis and AI agent navigation.

### `codemind explain <path>`

File explain output now includes:

- file overview
- symbols defined in file
- imports
- exports
- outgoing calls from symbols in the file
- external callers of symbols in the file
- related modules
- diagnostics
- freshness status

### `codemind map --format markdown`

Repo map output now includes a call-aware `Calls` section with:

- call edge count
- unique callers
- unique callees
- top callers
- top callees
- deterministic call edge rows

The generated `CODEMIND.md` also displays graph index metadata in the Overview section.

## TypeScript Adapter Changes

The TypeScript adapter now extracts deterministic `CALLS` edges for:

- same-file function calls
- imported function calls
- namespace calls
- constructor calls
- same-class `this.method()` calls
- same-file class methods
- imported class methods
- same-file static methods
- simple chained class methods

Still out of scope:

- dynamic dispatch
- interface dispatch
- higher-order call graph resolution
- arbitrary chained calls
- TypeChecker-backed full call graph resolution
- runtime call graph tracing

## MCP Changes

Read-only MCP tools in this release candidate:

- `find_symbol`
- `get_repo_map`
- `trace_symbol`
- `explain_file`

`trace_symbol` and `explain_file` reuse the same core renderers as the CLI, keeping CLI and MCP output aligned.

`get_repo_map` returns the same call-aware `CODEMIND.md` Markdown map as `codemind map`.

## Graph Index Metadata

`.codemind/graph.json` now includes top-level graph index metadata:

```json
{
  "metadata": {
    "indexer": "codemind-cli",
    "indexerVersion": "0.1.0",
    "adapter": "@codemind/adapter-typescript",
    "adapterVersion": "0.1.0",
    "language": "typescript",
    "capabilities": ["symbols", "imports", "exports", "calls"]
  }
}
```

Legacy graph indexes without top-level metadata remain readable. Repo map output renders `Index metadata: unknown` instead of crashing.

## Freshness And Safety

Graph freshness metadata remains content-fingerprint based:

- `indexedAt`
- `rootDir`
- `sourceFileCount`
- `sourceFingerprint`

CLI and MCP outputs report `fresh`, `stale`, or `unknown` freshness state.

MCP tools remain read-only and do not expose:

- file writes
- shell execution
- package installation
- Git operations
- automatic code mutation
- engineering memory files such as `docs/SESSION_STATE.md`

## Verification

Local verification command:

```powershell
pnpm check
```

Expected result:

- TypeScript project references pass.
- `@codemind/web` typecheck passes.
- `node:test` suite passes.
- package build passes.
- Next.js production build passes.

Focused coverage includes:

- CLI index/find/trace/explain/map flows
- stale freshness and legacy graph behavior
- graph index metadata assertions
- TypeScript adapter symbol/import/export/call fixtures
- direct MCP tool calls
- MCP stdio protocol smoke coverage
- MCP negative/error protocol coverage
- engineering memory leakage checks

## Release Checklist

- [x] README v0.1.1 demo refresh prepared.
- [x] Release notes draft prepared.
- [x] `pnpm check` passed after Slice O.
- [ ] Push release-readiness docs.
- [ ] Confirm GitHub Actions CI passes on `main`.
- [ ] Create and push `v0.1.1` tag.
- [ ] Publish GitHub Release using this draft.

## Suggested Tag Command

Run only after `main` is pushed and CI passes:

```powershell
git tag v0.1.1
git push origin v0.1.1
```
