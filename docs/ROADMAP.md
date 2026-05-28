# Roadmap

## Phase 001: v0.1 Bootstrap and deterministic TypeScript graph

Phase 001 is not complete until the Definition of Done in `docs/RUBRIC.md` passes.

- [x] Create project documentation and persistent engineering context.
- [x] Initialize Git repository.
- [x] Create pnpm TypeScript monorepo skeleton.
- [x] Verify `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [ ] Implement graph schema in `packages/core`.
- [ ] Implement TypeScript Compiler API import and symbol extraction in `packages/adapter-typescript`.
- [ ] Implement CLI commands: `index`, `find`, `trace`, `explain`, `map`.
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
