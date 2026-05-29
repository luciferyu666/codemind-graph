# Agent Harness

CodeMind Graph uses AI-native engineering practices, but the engineering harness is not the product surface.

## Boundary

- `Goal`: defines what an engineering agent should finish.
- `MCP`: defines which repository context tools an AI client may call.
- `Rubric`: defines whether the work is good enough to accept.
- `Governance`: defines what is trusted, audited, and allowed in team or enterprise workflows.

Short version:

```text
Goal decides what the agent must complete.
MCP decides what the agent can safely call.
Rubric decides whether the result is good enough.
Governance decides whether the workflow can be trusted.
```

## Engineering Harness

The following files are part of the persistent engineering harness:

- `AGENTS.md`
- `docs/RUBRIC.md`
- `docs/SESSION_STATE.md`
- `docs/DECISIONS.md`
- `docs/ENGINEERING_STATE.md`

Codex agents should read these files before continuing engineering tasks.

## Product Surface

The v0.1 product surface is:

- `codemind index`
- `codemind find`
- `codemind map`
- read-only MCP tools such as `find_symbol` and `get_repo_map`
- `CODEMIND.md` repo map output

The MCP server must expose repository graph context only. It must not expose engineering session notes, private planning notes, or Codex handoff state by default.

## Safety Rules

- Keep MCP tools read-only in v0.1.
- Do not provide tools for file writes, shell execution, package installation, Git pushes, or destructive operations.
- Keep generated data under `.codemind/`.
- Require explicit architecture decisions before adding governance, DevSec, audit logs, or write-capable features.

## 90-Day Focus

Day 1-30:

- Finish CodeMind Graph v0.1 CLI and deterministic graph query flow.
- Complete `codemind index`, `codemind find`, and `codemind map`.
- Generate `CODEMIND.md`.

Day 31-60:

- Add read-only MCP server. Done.
- Provide `find_symbol` and `get_repo_map`. Done.
- Add schema validation for tool inputs. Done.
- Wire `codemind mcp start`. Done.
- Add GitHub Actions CI. Done.

Day 61-90:

- Prototype governance and DevSec integration points.
- Explore permission profiles, audit logs, and supply-chain data sources.

Day 90+:

- Revisit QuantAgent Lab as a separate vertical-domain brand project.
