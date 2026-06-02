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

## ADR-0009: Implement MCP tools over persisted graph indexes only

Date: 2026-05-28

Decision: The initial MCP server uses `@modelcontextprotocol/sdk` with Zod input schemas and exposes only read-only graph tools: `find_symbol`, `get_repo_map`, `trace_symbol`, and `explain_file`. These tools read `.codemind/graph.json`, reuse `packages/core` query and Markdown rendering helpers, and do not expose file writes, shell execution, package installation, Git operations, or engineering memory files.

Reasoning: MCP should provide AI agents with deterministic product context while preserving the v0.1 safety boundary. Reading an already-generated graph index keeps MCP behavior predictable and avoids mixing indexing side effects into tool calls.

Guardrail: Tool inputs may select a root or graph path only inside the configured MCP root, preventing accidental reads outside the selected workspace.

## ADR-0010: Start MCP through CLI without stdout preamble

Date: 2026-05-28

Decision: `codemind mcp start --root <path>` delegates directly to `packages/mcp-server` and starts the MCP stdio transport without writing human-readable status output to stdout.

Reasoning: MCP stdio uses stdout as the protocol stream. Keeping startup quiet prevents CLI convenience output from corrupting MCP client handshakes while still allowing tests to verify startup delegation through dependency injection.

## ADR-0011: Run v0.1 CI on Windows with Node 24 and pnpm 10

Date: 2026-05-28

Decision: GitHub Actions CI runs on `windows-latest`, uses Node.js `24.x`, installs pnpm `10.10.0`, runs `pnpm install --frozen-lockfile`, and then runs `pnpm check`.

Reasoning: CodeMind Graph is developed as a Windows-first local tool and the project blueprint targets Node.js 24. CI should validate the same primary runtime family while keeping the verification gate identical to local development.

Status: Superseded by ADR-0015 for the runner image and JavaScript action runtime setting.

## ADR-0012: Keep the official website as a separate app track

Date: 2026-05-28

Decision: The official website and Vercel deployment track uses a separate `apps/web` package. It remains separate from `packages/core`, `packages/cli`, and `packages/mcp-server`.

Reasoning: Website dependencies, Vercel deployment, and public marketing content have different release and privacy boundaries than the local graph engine and MCP server. Keeping the site in `apps/web` lets CI include a production build without coupling website implementation to graph package APIs.

Guardrail: The website may use synthetic or public demo graph data, but it must not deploy private `.codemind/graph.json`, local MCP endpoints, or engineering memory files.

## ADR-0013: Use deterministic public SEO metadata for the website

Date: 2026-05-29

Decision: The official website uses deterministic Next.js metadata routes and locale metadata in `apps/web`, with `https://codemind-graph.vercel.app` as the default public origin and `NEXT_PUBLIC_CODEMIND_SITE_URL` as the override for preview, production, or future custom domain deployment.

Reasoning: Sitemap, robots, canonical URLs, alternate language links, and social metadata must be stable for tests, previews, and Vercel deployment while still allowing the final production origin to be configured without code changes.

Guardrail: SEO and deployment metadata must not expose `.codemind/`, `Documentations/`, engineering memory files, private graph data, or local MCP endpoints as public website content.

## ADR-0014: Store source-fingerprint freshness metadata in graph indexes

Date: 2026-06-01

Decision: `codemind index` writes freshness metadata into `.codemind/graph.json`: `indexedAt`, `rootDir`, `sourceFileCount`, and a deterministic `sourceFingerprint` derived from source file paths and file contents. CLI and MCP read paths evaluate this metadata before returning graph context.

Reasoning: AI agents need to know whether a persisted graph still represents the current repository. File modification times are not enough for deterministic workflows, so v0.1 uses content fingerprints and source file counts. Legacy graph files without freshness metadata remain valid but produce an `unknown` freshness warning instead of crashing.

Guardrail: Freshness checking remains read-only. MCP tools may report `fresh`, `stale`, or `unknown`, but they must not re-index, write files, run shell commands, or expose engineering memory files.

## ADR-0015: Opt CI into Windows 2025 VS 2026 and Node.js 24 action runtime

Date: 2026-06-01

Decision: GitHub Actions CI and Browser QA workflows use `windows-2025-vs2026`, set `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` at workflow level, and use Node.js 24 runtime action majors for checkout, setup-node, pnpm setup, and artifact upload.

Reasoning: GitHub Actions emitted notices that JavaScript actions running on Node.js 20 are deprecated and that `windows-latest` / `windows-2025` are migrating to the Windows Server 2025 Visual Studio 2026 image in June 2026. Opting in explicitly makes the project test against the incoming default runtime before it becomes implicit.

Guardrail: Keep the project runtime under test as Node.js `24.x` and pnpm `10.10.0`; this ADR changes the GitHub Actions JavaScript action runtime and runner image, not the product runtime contract.

## ADR-0016: Keep TypeScript CALLS extraction conservative in Slice K

Date: 2026-06-02

Decision: Implement the first TypeScript `CALLS` edge extraction as a deterministic AST-based MVP. The adapter records same-file function calls, simple imported function calls, same-class `this.method()` calls, and simple imported class method calls without claiming full runtime dispatch resolution.

Reasoning: CodeMind Graph needs call-edge data to make future `trace` and MCP context more useful, but v0.1 should avoid unstable or over-broad call graph claims. A conservative extractor is easier to test, keeps output deterministic, and preserves the local-first no-side-effect adapter boundary.

Guardrail: Do not treat this as a complete TypeScript call graph. Dynamic dispatch, interface dispatch, higher-order calls, namespace calls, chained calls, and TypeChecker-backed cross-project call resolution remain future work.
