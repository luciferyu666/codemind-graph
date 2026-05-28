# Architecture Decisions

## ADR-0001: Use Windows Native Runtime for initial development

Date: 2026-05-27

Decision: Use Windows Native Runtime with PowerShell, pnpm, Node.js, VS Code, GitHub CLI, and Codex Desktop.

Reasoning: The project owner is developing with Windows Codex APP and wants local-first repository analysis without requiring WSL.

## ADR-0002: Use pnpm TypeScript monorepo

Date: 2026-05-27

Decision: Structure the repository as a pnpm workspace with `packages/core`, `packages/adapter-typescript`, `packages/cli`, and `packages/mcp-server`.

Reasoning: The design requires clear boundaries between graph modeling, language adapters, CLI integration, and MCP server tools.

## ADR-0003: Keep MCP tools read-only in v0.1

Date: 2026-05-27

Decision: MCP tools must not expose file writes, shell execution, package installation, Git pushes, or destructive actions in v0.1.

Reasoning: CodeMind Graph is intended to be safe for AI agent workflows and enterprise repositories.

## ADR-0004: Use TypeScript Compiler API first for v0.1 parsing

Date: 2026-05-28

Decision: Implement the v0.1 TypeScript adapter with the TypeScript Compiler API before adding Tree-sitter, LSP adapters, or Pyright.

Reasoning: v0.1 needs deterministic TypeScript symbol, import, and export extraction before cross-language parser abstraction. Tree-sitter and LSP remain valid future directions.

## ADR-0005: Treat SQLite FTS as full-text lookup, not semantic search

Date: 2026-05-28

Decision: Describe SQLite + FTS as local graph storage and full-text symbol lookup in v0.1.

Reasoning: Semantic ranking requires a separate context ranking, embedding, or reranking layer and belongs in a later phase.

## ADR-0006: Keep engineering memory separate from MCP product context

Date: 2026-05-28

Decision: Codex agents may read `docs/SESSION_STATE.md` to resume engineering work, but the MCP server must not expose engineering session notes by default.

Reasoning: Engineering handoff notes and product repository graph context have different privacy boundaries.

## ADR-0007: Use deterministic graph IDs and explicit node/edge kinds

Date: 2026-05-28

Decision: Define the v0.1 graph schema in `packages/core` with explicit node kinds, edge kinds, source locations, metadata, deterministic node IDs, deterministic edge IDs, and a `GraphBuilder` that deduplicates and sorts graph output.

Reasoning: CodeMind Graph needs stable graph output for CLI queries, tests, MCP responses, and future persisted storage. Deterministic IDs also make generated graph data easier to diff.

## ADR-0008: Extract TypeScript symbols with source-level graph edges first

Date: 2026-05-28

Decision: The first TypeScript adapter extracts project source files, imported modules, functions, classes, interfaces, type aliases, enums, variables, methods, and export edges. It returns a `CodeGraph` directly rather than writing storage.

Reasoning: v0.1 needs deterministic extraction before introducing SQLite storage, CLI persistence, or MCP transport. Keeping extraction pure makes it easy to test and reuse across CLI and MCP packages.
