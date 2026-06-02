# Agent Harness

CodeMind Graph uses AI-native engineering practices, but the engineering harness is not the product surface.

## Boundary

- `Goal`: defines what an engineering agent should finish.
- `Task Contract`: defines one task node's inputs, outputs, verification, failure handling, and review gates.
- `MCP`: defines which repository context tools an AI client may call.
- `Rubric`: defines whether the work is good enough to accept.
- `Governance`: defines what is trusted, audited, and allowed in team or enterprise workflows.

Short version:

```text
Goal decides what the agent must complete.
Task Contract decides how each node is verified and recovered.
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
- `docs/TASK_DECOMPOSITION_GUIDE.md`

Codex agents should read these files before continuing engineering tasks.

## Product Surface

The v0.1 product surface is:

- `codemind index`
- `codemind find`
- `codemind trace`
- `codemind explain`
- `codemind map`
- `codemind health`
- `codemind doctor`
- `codemind mcp start`
- read-only MCP tools: `find_symbol`, `get_repo_map`, `trace_symbol`, and `explain_file`
- `CODEMIND.md` repo map output
- `examples/ts-agent-workspace/CODEMIND.md` sanitized public demo output

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
- Add public readiness checks with `codemind health` and `codemind doctor`.
- Generate `CODEMIND.md`.

Day 31-60:

- Add read-only MCP server. Done.
- Provide `find_symbol` and `get_repo_map`. Done.
- Add schema validation for tool inputs. Done.
- Wire `codemind mcp start`. Done.
- Add GitHub Actions CI. Done.

Day 61-90:

- Graph freshness / stale index warning metadata is implemented.
- Include freshness status in CLI and read-only MCP outputs.
- Use `docs/TASK_DECOMPOSITION_GUIDE.md` to define slice-level task contracts.

Day 90+:

- Prototype governance and DevSec integration points.
- Explore permission profiles, audit logs, and supply-chain data sources.
- Revisit QuantAgent Lab as a separate vertical-domain brand project.
