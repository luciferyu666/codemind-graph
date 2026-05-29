# 2026 Open Source Strategy

Last updated: 2026-05-30

This document captures the strategic positioning for CodeMind Graph and related future project ideas. It is a strategy brief, not a release note.

## Publication Boundary

Before using this text in a public deck, website, or README:

- Cite primary sources for external market numbers.
- Distinguish GitHub Octoverse 2025 data from 2026 trend interpretation.
- Describe only pushed public repository state as publicly verified.
- Describe local uncommitted work as local workspace state or pending publication.
- Avoid describing MCP as the only standard path for all AI ecosystems; use "important open protocol" or "one of the key integration standards."
- Keep Python support, DevSec Sentinel, and MCP ToolHub as future tracks unless explicitly implemented.

## Executive Summary

Software development is moving toward an agent-native operating model. The developer's role is expanding from code author to workflow architect, context curator, and governance owner.

The major open-source gaps are:

| Layer | Gap | Project fit |
| --- | --- | --- |
| Knowledge Layer | AI agents need structured repo context beyond raw files. | CodeMind Graph |
| Trust Layer | Developer tools, packages, extensions, and MCP servers need stronger safety checks. | DevSec Sentinel |
| Governance Layer | Teams need registries, permission profiles, and audit logs for MCP tools. | MCP ToolHub |
| Proof Layer | Vertical AI systems need rigorous domain validation. | QuantAgent Lab |

Recommended first project:

```text
CodeMind Graph
```

Reason:

CodeMind Graph is closest to the current AI coding workflow problem: agents need a deterministic, local-first code knowledge layer that can be queried through CLI and read-only MCP tools.

## Core Trends

### 1. Convenience Loop And Code Volume

AI coding tools reduce the cost of creating and modifying software. This increases repository activity, pull request volume, and the need for automated context management.

Strategic implication:

The scarce resource is no longer only code generation. The scarce resource is reliable context, traceable decisions, and reviewable change impact.

### 2. AI Compatibility

AI-friendly toolchains matter. Strong types, explicit module boundaries, deterministic test output, and structured metadata make codebases easier for agents to inspect and modify.

Strategic implication:

TypeScript-first tooling is a strong starting point because compiler metadata can produce stable symbols, imports, exports, and future reference edges.

### 3. Developer Supply Chain Risk

Developer workstations, package registries, IDE extensions, and AI tool bridges are now part of the trust surface.

Strategic implication:

Security and governance tools should cover:

- package dependencies
- VS Code extensions
- MCP servers
- local developer tokens and permissions
- agent tool execution logs

Keep public references precise: TeamPCP / GitHub internal repository access and Mini Shai-Hulud-style malicious package events should be described as separate supply-chain risks unless a verified source directly connects them.

## Project Ranking

| Rank | Project | Strategic layer | Core value |
| ---: | --- | --- | --- |
| 1 | CodeMind Graph | Knowledge Layer | Gives AI agents a deterministic map of large repositories. |
| 2 | DevSec Sentinel | Trust Layer | Audits developer-tool and agent-tool supply-chain risk. |
| 3 | MCP ToolHub | Governance Layer | Provides registry, permission profiles, and audit logs for MCP servers. |
| 4 | QuantAgent Lab | Proof Layer | Demonstrates AI-assisted reasoning in a demanding vertical domain. |

Other possible projects:

- AgentForge Studio: visual AI agent workflow orchestration.
- LocalPilot AI: privacy-first local AI coding assistant.
- RepoLens AI: repository architecture and technical debt analysis.
- EdgeGuard Vision: edge AI field safety monitoring.
- AutoPR Mate: AI-assisted pull request and code review helper.
- RAGFlow Lite: lightweight retrieval-augmented knowledge base.

## CodeMind Graph Positioning

CodeMind Graph is an AI-native, local-first code knowledge graph and read-only MCP server for coding agents.

It is not primarily a visualization tool. It is a structured knowledge layer that turns a repository into queryable symbols, files, dependencies, and maps.

Core value:

```text
Stop feeding agents raw files. Give them a code graph.
```

Current local v0.1 capabilities:

- pnpm TypeScript monorepo.
- TypeScript Compiler API extraction in `packages/adapter-typescript`.
- Deterministic graph schema and query helpers in `packages/core`.
- CLI commands: `index`, `find`, `trace`, `map`, `mcp start`.
- JSON graph index under `.codemind/graph.json`.
- Markdown repo map output through `CODEMIND.md`.
- Read-only MCP tools: `find_symbol`, `get_repo_map`, `trace_symbol`.
- MCP protocol-level smoke coverage.
- Website and Browser QA track exists locally, with deployment still requiring explicit Slice W5 work.

v0.1 non-goals:

- Natural-language `ask`.
- Write-capable MCP tools.
- Deep Python support.
- DevSec scanning.
- Cloud sync.
- Vercel production deployment.

## DevSec Sentinel Positioning

DevSec Sentinel should focus on AI-era developer supply-chain risk.

Potential scope:

- VS Code extension auditing.
- MCP server permission inspection.
- Package dependency risk summaries.
- CI secret exposure checks.
- Agent workflow audit trails.

Do not make the first version a generic vulnerability scanner. The sharper angle is developer-tool and agent-tool trust.

## MCP ToolHub Positioning

MCP ToolHub should be a governance and control plane, not only a marketplace.

Potential scope:

- MCP server registry.
- Permission profiles.
- Trust score for tools and dependencies.
- Tool execution audit logs.
- Team-approved MCP server bundles.

MCP should be described as an important open integration protocol for LLM applications, not as the only path to all AI ecosystems.

## QuantAgent Lab Positioning

QuantAgent Lab is best used as a second-stage vertical proof project.

It should avoid "AI auto-profit" claims and focus on:

- strategy research workflow
- backtest review
- overfitting checks
- risk commentary
- reproducible experiment reports

## CodeMind Graph v0.1 Engineering State

Current local state:

- Windows Native Runtime and PowerShell workflow are configured.
- GitHub repository exists at `https://github.com/luciferyu666/codemind-graph`.
- `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm check`, and `pnpm test:e2e` have passed locally.
- `packages/core`, `packages/adapter-typescript`, `packages/cli`, and `packages/mcp-server` exist.
- `apps/web` exists locally as the official website track.

Public status note:

Only claim these as public completed work after the current local changes are committed and pushed.

## Next Best Task

The next product reliability task is:

```text
Slice H: Graph freshness / stale index warning metadata
```

Goal:

Help CLI and MCP users know whether `.codemind/graph.json` still reflects the current repository state.

Recommended freshness model:

- `indexedAt`
- root path
- scanner name and version
- source file count
- latest mtime fast path
- source fingerprint hash based on normalized file paths and file contents
- optional Git branch, commit, and dirty state

Expected states:

- `fresh`
- `stale`
- `unknown`

Expected reasons:

- `missing_metadata`
- `schema_mismatch`
- `git_dirty`
- `commit_mismatch`
- `source_hash_mismatch`
- `unsupported_workspace`

## 90-Day Route

### Day 1-30: CodeMind Graph MVP

- Complete deterministic TypeScript graph loop.
- Stabilize `index`, `find`, `trace`, and `map`.
- Generate `CODEMIND.md`.
- Add freshness metadata.

### Day 31-60: MCP And Agent Integration

- Harden read-only MCP tools.
- Add negative/error MCP protocol tests.
- Add richer graph query helpers.
- Document Codex/Cursor/Claude usage patterns.

### Day 61-90: Trust And Governance Expansion

- Prototype DevSec Sentinel concepts.
- Prototype MCP ToolHub permission profile ideas.
- Add governance notes, audit log design, and policy boundaries.

## Execution Rules

- Solve trust before adding more features.
- Keep v0.1 deterministic and local-first.
- Prefer graph facts over natural-language guesses.
- Keep MCP read-only by default.
- Keep engineering memory separate from product graph memory.
- Public-facing claims must match the branch being shown.

