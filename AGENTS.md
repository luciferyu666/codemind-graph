# AGENTS.md

## Project Mission

CodeMind Graph is a local-first code knowledge graph and read-only MCP server for AI coding agents.

The goal is to help agents understand, query, and maintain large TypeScript repositories through symbol graphs, dependency graphs, call graphs, CLI commands, and MCP tools.

## Communication

- Respond to the project owner in Traditional Chinese unless explicitly asked otherwise.
- Keep implementation notes direct and grounded in the current repository state.

## Current v0.1 Scope

Build only:

- TypeScript-first repository scanner
- TypeScript Compiler API-first parser stack
- Symbol graph model
- Basic dependency graph
- CLI commands:
  - `codemind index .`
  - `codemind find <symbol>`
  - `codemind trace <symbol>`
  - `codemind explain <path>`
  - `codemind context <symbol-or-path>`
  - `codemind map --format markdown`
  - `codemind health`
  - `codemind doctor`
  - `codemind mcp start`
- Read-only MCP server
- `CODEMIND.md` repo map output

Do not build yet:

- Web dashboard
- Vercel deployment, unless the project owner explicitly switches to deployment work
- Full natural language QA
- Automatic code editing
- Write-capable MCP tools
- Security scanner
- Deep Python support
- Cloud sync

## Architecture

Use a pnpm TypeScript monorepo:

- `packages/core`: graph schema, graph store, query engine
- `packages/adapter-typescript`: TypeScript source analysis
- `packages/cli`: command line interface
- `packages/mcp-server`: read-only MCP tools
- `examples/ts-basic`: small test repository
- `examples/ts-agent-workspace`: richer public demo repository
- `apps/web`: official website package

## Development Commands

Use PowerShell on Windows.

Install dependencies:

```powershell
pnpm install
```

Run typecheck:

```powershell
pnpm typecheck
```

Run tests:

```powershell
pnpm test
```

Build:

```powershell
pnpm build
```

## Engineering Rules

- Prefer small, reviewable changes.
- Keep v0.1 focused on deterministic graph queries.
- Do not add new production dependencies without explaining why.
- Do not implement write-capable MCP tools in v0.1.
- MCP tools must be read-only by default.
- Never exfiltrate repository contents.
- Keep generated data under `.codemind/`.
- Reference `docs/DECISIONS.md` before changing graph schema or storage design.
- Reference `docs/RUBRIC.md` before declaring v0.1 work complete.
- Reference `docs/AGENT_HARNESS.md` when discussing Goal, MCP, Rubric, Governance, or long-running agent workflows.
- Reference `docs/TASK_DECOMPOSITION_GUIDE.md` when defining slices, task contracts, verification gates, or agentic workflow steps.
- Update `docs/SESSION_STATE.md` after meaningful changes.
- Update `docs/ENGINEERING_STATE.md` after build, test, or environment changes.
- Update `docs/DECISIONS.md` when making architecture decisions.
- Codex agents may use `docs/SESSION_STATE.md` to resume engineering work.
- MCP server tools must not expose engineering session notes by default.

## Testing Expectations

After changing TypeScript files, run:

```powershell
pnpm check
```

If tests do not exist yet, create minimal tests for the changed module.

## Preferred Style

- TypeScript ESM
- Explicit types for public APIs
- No `any` in production TypeScript
- Zod for CLI/MCP input validation where useful
- Avoid premature abstraction
- Prefer readable graph schema over clever implementation
