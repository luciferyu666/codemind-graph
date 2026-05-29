# CodeMind Graph Engineering Practice Standard

Last updated: 2026-05-30

This document defines CodeMind Graph's engineering practice standard for AI-native, local-first code knowledge graph development.

## Publication Boundary

Before using this document publicly:

- Cite external market and security numbers from primary or trusted sources.
- Distinguish GitHub Octoverse 2025 baseline data from 2026 interpretation.
- Describe MCP as an important open integration protocol, not the only universal channel.
- Keep the GitHub poisoned VS Code extension incident separate from Mini Shai-Hulud / Shai-Hulud package campaigns unless a cited source explicitly connects them.
- Do not describe SQLite, Tree-sitter, Python support, full call graph, MCP audit logs, or DevSec Sentinel integration as v0.1 completed features.
- Public claims must match the branch, release, or demo being shown.

## 1. Strategic Background

Software development is moving from AI-assisted coding toward agent-native engineering. GitHub Octoverse 2025 reported more than 230 new repositories per minute, an average of 43.2 million pull requests merged each month, and TypeScript becoming the most-used language by monthly contributors in August 2025.

Strategic interpretation:

- Repository volume increases context fragmentation.
- Pull request volume increases review pressure.
- Strong typing and explicit module boundaries improve AI compatibility.
- Code generation is becoming cheaper; current, structured context is becoming more valuable.

CodeMind Graph exists to provide that context as a local-first Knowledge Layer for coding agents.

## 2. Local-first Architecture

Local-first is the default because repository structure, source code, and internal architecture are sensitive assets.

CodeMind Graph should:

- index repositories locally
- keep generated graph data under `.codemind/`
- avoid cloud sync in v0.1
- expose graph context through CLI and read-only MCP
- keep engineering memory separate from product graph memory

## 3. Monorepo Governance

Current local workspace:

| Package | Current responsibility | Status |
| --- | --- | --- |
| `packages/core` | Graph schema, deterministic IDs, query helpers, map and trace rendering. | Implemented |
| `packages/adapter-typescript` | TypeScript Compiler API extraction for source files, imports, exports, and symbols. | Implemented |
| `packages/cli` | CLI commands: `index`, `find`, `trace`, `map`, `mcp start`. | Implemented |
| `packages/mcp-server` | Read-only MCP tools over persisted graph indexes. | Implemented |
| `apps/web` | Official website and Browser QA track. | Local track implemented; deployment requires explicit Slice W5 |

Planned later:

| Component | Planned responsibility |
| --- | --- |
| SQLite + FTS | Local graph runtime and full-text symbol lookup. |
| Tree-sitter | Possible syntax fallback or incremental parsing layer. |
| Pyright / Python adapter | Future Python support. |
| DevSec Sentinel | Future structure-aware security and trust layer. |

## 4. Parser And Symbol Graph Standard

v0.1 uses the TypeScript Compiler API first. This is the correct initial path because TypeScript compiler metadata can provide more semantic information than raw syntax scanning.

Current extraction coverage:

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

Current graph node kinds:

- `repository`
- `file`
- `module`
- `function`
- `class`
- `interface`
- `type`
- `enum`
- `variable`
- `method`
- `property`

Current graph edge kinds:

- `CONTAINS`
- `DEFINES`
- `IMPORTS`
- `EXPORTS`
- `REFERENCES`
- `CALLS`

Important status boundary:

- The schema allows `REFERENCES` and `CALLS`.
- The current TypeScript adapter mainly emits repository, file, module, symbol, `CONTAINS`, `DEFINES`, `IMPORTS`, and `EXPORTS`.
- Expanded reference and call graph extraction belongs to a later slice.

## 5. Deterministic IDs

All graph IDs should be deterministic.

Rationale:

If a symbol's ID changes on every index run, AI agents cannot build reliable cross-session understanding.

Standard:

- normalize Windows paths to POSIX-style `/` inside graph IDs
- base file IDs on workspace-relative paths
- base symbol IDs on file path, node kind, and stable symbol name
- keep original filesystem paths as metadata when needed
- avoid random IDs in persisted graph output

## 6. CLI Standard

Current CLI commands:

```text
codemind index <path>
codemind find <symbol>
codemind trace <symbol>
codemind map --format markdown
codemind mcp start --root <path>
```

Current generated artifacts:

```text
<root>/.codemind/graph.json
<root>/CODEMIND.md
```

CLI behavior should remain deterministic. Future machine-readable output modes can be added, but v0.1 should not expand into natural-language `ask`.

## 7. MCP Server Standard

MCP is an important open integration protocol for connecting LLM applications to external data and tools.

MCP role mapping:

| MCP role | CodeMind Graph mapping |
| --- | --- |
| Host | Claude Desktop, Cursor, Codex-like AI development environments |
| Client | Host-owned connector that speaks MCP |
| Server | `packages/mcp-server`, exposing read-only graph tools |

Current read-only tools:

- `find_symbol`
- `get_repo_map`
- `trace_symbol`

MCP v0.1 security policy:

- no file writes
- no shell execution
- no package installation
- no git operations
- no environment variable exposure
- no access outside the configured repository root
- no exposure of `AGENTS.md`, `docs/SESSION_STATE.md`, `docs/CURRENT_STATE.md`, `docs/DECISIONS.md`, or `docs/ENGINEERING_STATE.md`
- only query persisted graph indexes under `.codemind/`

Audit logs are a future governance feature, not a current v0.1 feature.

## 8. Quality Assurance Standard

Core verification:

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

Website and Browser QA verification:

```powershell
pnpm playwright:install
pnpm test:e2e
```

Use Browser QA when website, responsive layout, SEO metadata, Playwright config, or related CI workflows change. Do not require Browser QA for a core graph-only change unless the lockfile or shared build pipeline changes.

## 9. Docs-as-State

CodeMind Graph treats documentation as engineering state.

Persistent engineering files:

- `AGENTS.md`: project rules for Codex agents
- `docs/SESSION_STATE.md`: cross-session handoff
- `docs/CURRENT_STATE.md`: current repo status and known gaps
- `docs/ENGINEERING_STATE.md`: tools, verification, environment, and test status
- `docs/DECISIONS.md`: architecture decisions
- `docs/RUBRIC.md`: v0.1 quality gate
- `docs/TOOLCHAIN.md`: verified local toolchain and Current vs Planned boundaries

Rule:

Engineering harness files may be read by Codex during development, but MCP product tools must not expose them by default.

## 10. Next Development Standard: Slice H

The next core reliability slice is:

```text
Graph freshness / stale index warning metadata
```

Goal:

Warn users and agents when `.codemind/graph.json` may not match the current repository state.

Recommended metadata:

- `indexedAt`
- root path
- scanner name and version
- source file count
- latest mtime fast path
- source fingerprint based on normalized paths and file contents
- optional Git branch, commit, and dirty state

Freshness states:

- `fresh`
- `stale`
- `unknown`

Freshness reasons:

- `missing_metadata`
- `schema_mismatch`
- `git_dirty`
- `commit_mismatch`
- `source_hash_mismatch`
- `unsupported_workspace`

Expected behavior:

- `codemind index` writes freshness metadata.
- `codemind find`, `codemind trace`, and `codemind map` warn when freshness is stale or unknown.
- MCP tools include freshness status in read-only output.
- missing metadata does not crash CLI or MCP.

## 11. Open-source Success Rules

1. Prefer structured context over raw-file prompting.
2. Keep graph output deterministic and diffable.
3. Keep MCP read-only by default.
4. Keep private repository graph data local.
5. Separate current implementation from planned roadmap in public docs.
6. Treat trust, permissions, and auditability as core product value.

## References For Public Drafting

- GitHub Octoverse 2025: https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/
- MCP specification 2025-06-18: https://modelcontextprotocol.io/specification/2025-06-18/basic/index
- Sonatype Q1 2026 Open Source Malware Index: https://www.sonatype.com/press-releases/sonatype-q1-2026-open-source-malware-index
- Sonatype 2026 Open Source Malware report: https://www.sonatype.com/state-of-the-software-supply-chain/2026/open-source-malware
- GitHub internal repository incident coverage: https://techcrunch.com/2026/05/20/github-says-hackers-stole-data-from-thousands-of-internal-repositories/

