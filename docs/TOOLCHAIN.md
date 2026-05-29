# Toolchain

Last updated: 2026-05-30

This document describes the CodeMind Graph engineering toolchain and separates the currently verified local workspace from planned or not-yet-published work.

## Purpose

CodeMind Graph is a local-first, TypeScript-first code knowledge graph and read-only MCP server for AI coding agents.

This toolchain exists to support:

- deterministic graph indexing and querying
- TypeScript Compiler API-based symbol extraction
- CLI-first product workflows
- read-only MCP agent integration
- persistent AI-native engineering context
- website and Browser QA work without coupling it to the core graph engine

## Current Local Verified Stack

The current local workspace is verified with:

| Area | Current local state |
| --- | --- |
| OS/runtime shell | Windows Native Runtime with PowerShell 7 |
| Node.js | `v22.22.3` currently verified |
| Node.js target | CI targets Node.js `24.x`; keep Node 24 as compatibility target until local runtime is upgraded |
| Package manager | `pnpm 10.10.0` |
| Language | TypeScript ESM |
| Monorepo | pnpm workspace |
| Core verification | `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check` |
| Browser verification | `pnpm test:e2e` for the website track |
| MCP transport | stdio through `@modelcontextprotocol/sdk` |

## Public Status Boundary

Some Export 6 guidance was based on the public GitHub `main` snapshot, while this local workspace contains additional uncommitted website, Browser QA, MCP protocol, and trace work.

When writing public-facing README, slide decks, launch posts, or website copy:

- describe only pushed and publicly visible code as public completed work
- describe local uncommitted work as local workspace state or pending publication
- keep website, Browser QA, Vercel, and SEO claims aligned with what is actually present on the target branch
- do not expose `.codemind/`, `Documentations/`, or engineering memory files as product website content

## Workspace Layout

Current local layout:

```text
packages/
  core
  adapter-typescript
  cli
  mcp-server

examples/
  ts-basic

apps/
  web

docs/
Documentations/
test/
```

`packages/*` contain the product graph and MCP runtime. `apps/web` is the official website track and must stay isolated from private graph data and MCP local endpoints.

## TypeScript Compiler API

`packages/adapter-typescript` uses the TypeScript Compiler API as the v0.1 parser stack.

Current extraction coverage includes:

- source files
- imports
- exports
- functions
- classes
- interfaces
- type aliases
- enums
- variables
- methods

Future parser work should evaluate Tree-sitter, LSP abstraction, and Pyright only after the TypeScript-first deterministic graph loop remains stable.

## pnpm Workspace

pnpm is used because it fits the monorepo and CI workflow:

- content-addressable store reduces duplicate package storage
- hard links improve install efficiency
- non-flat dependency layout reduces ghost dependency risk
- workspace filters make package-level verification explicit

Current workspace globs:

```yaml
packages:
  - "packages/*"
  - "examples/*"
  - "apps/*"
```

## Quality Gates

Core quality gates:

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Browser QA gates for the website track:

```powershell
pnpm playwright:install
pnpm test:e2e
pnpm test:e2e:remote
```

Do not require Browser QA for core graph-only changes unless the website, Playwright config, lockfile, or browser workflow is affected.

## CLI Product Surface

Current CLI surface:

```text
codemind index <path>
codemind find <symbol>
codemind trace <symbol>
codemind map --format markdown
codemind mcp start --root <path>
```

Current index target:

```text
<root>/.codemind/graph.json
```

Generated graph data must remain under `.codemind/` and out of Git.

## MCP Integration

MCP roles:

| MCP role | CodeMind Graph mapping |
| --- | --- |
| MCP Host | Claude Desktop, Cursor, Codex-like AI development environments |
| MCP Client | Host-owned connector that speaks MCP |
| MCP Server | `packages/mcp-server` read-only graph tools |

Current MCP tools:

- `find_symbol`
- `get_repo_map`
- `trace_symbol`

MCP v0.1 policy:

- read-only by default
- no file writes
- no shell execution
- no package installation
- no git operations
- no environment variable exposure
- no access outside the configured repository root
- no exposure of `AGENTS.md`, `docs/SESSION_STATE.md`, `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, or `docs/ENGINEERING_STATE.md`
- only query persisted graph indexes under `.codemind/`

## AI-native Engineering Harness

Engineering harness files:

- `AGENTS.md`
- `docs/RUBRIC.md`
- `docs/SESSION_STATE.md`
- `docs/CURRENT_STATE.md`
- `docs/DECISIONS.md`
- `docs/ENGINEERING_STATE.md`
- `docs/AGENT_HARNESS.md`

These files preserve engineering context across Codex sessions. They are not product graph data and must not be exposed by MCP tools by default.

## Website And Browser QA Track

`apps/web` is the official website package and Vercel deployment target.

Current local website track includes:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- `/en` and `/zh-TW` locale routes
- sitemap and robots metadata routes
- canonical and language alternates
- Open Graph and Twitter metadata
- Playwright desktop/mobile Browser QA

Deployment remains a separate explicit step. Do not connect to Vercel production unless the project owner starts Slice W5.

## Learning Priority

For CodeMind Graph v0.1, prioritize:

| Priority | Topic | Reason |
| ---: | --- | --- |
| 1 | TypeScript Compiler API | Foundation for `adapter-typescript` and symbol graph quality |
| 2 | pnpm workspace | Package boundaries and repeatable CI |
| 3 | CLI / Node.js runtime | Primary product interface for deterministic queries |
| 4 | MCP protocol | Read-only AI agent integration |
| 5 | GitHub Actions | Reviewable verification gate |
| 6 | Playwright / Vercel / SEO | Website and deployment track, separate from core graph reliability |

## Next Toolchain Task

The next core reliability task is:

```text
Slice H: Graph freshness / stale index warning metadata
```

Recommended direction:

- write freshness metadata during `codemind index`
- compute source fingerprint from normalized paths and file contents
- include fast-path metadata such as file count and latest mtime
- include optional git branch, commit, and dirty state
- warn from `find`, `trace`, and `map` when the graph is stale or unknown
- include freshness status in MCP tool output without adding write-capable MCP behavior
