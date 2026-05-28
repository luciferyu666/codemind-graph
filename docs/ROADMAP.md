# Roadmap

For detailed next development topics and slice planning, see `docs/NEXT_DEVELOPMENT_TOPICS.md`.

## Phase 001: v0.1 Bootstrap and deterministic TypeScript graph

Phase 001 is not complete until the Definition of Done in `docs/RUBRIC.md` passes.

- [x] Create project documentation and persistent engineering context.
- [x] Initialize Git repository.
- [x] Create pnpm TypeScript monorepo skeleton.
- [x] Verify `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [x] Implement graph schema in `packages/core`.
- [x] Implement TypeScript Compiler API import and symbol extraction in `packages/adapter-typescript`.
- [ ] Implement CLI commands:
  - [x] `index`
  - [x] `find`
  - [ ] `trace`
  - [ ] `explain`
  - [ ] `map`
- [ ] Implement read-only MCP server tools.
- [ ] Generate `CODEMIND.md` repository map.

## Phase 002: Context ranking and ecosystem integration

- [ ] Add context ranking for agent output density.
- [ ] Evaluate Tree-sitter syntax fallback.
- [ ] Evaluate LSP adapter abstraction.
- [ ] Prototype VS Code extension.
- [ ] Evaluate Python support with Pyright.

## Phase 003: Intelligence and safety expansion

- [ ] Add structure-aware security scanning integration points.
- [ ] Add technical debt scoring.
- [ ] Add onboarding guide generation.

## 90-Day Strategic Focus

Day 1-30:

- Complete CodeMind Graph v0.1 deterministic graph query flow.
- Finish `codemind index`, `codemind find`, and `codemind map`.
- Generate `CODEMIND.md`.

Day 31-60:

- Add read-only MCP server.
- Expose `find_symbol` and `get_repo_map`.
- Add schema validation for MCP tool inputs.

Day 61-90:

- Prototype governance and DevSec integration points.
- Explore permission profiles and audit logs.

Day 90+:

- Keep QuantAgent Lab as a separate vertical-domain brand project after CodeMind Graph has a working public demo.
