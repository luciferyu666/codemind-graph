# Task Decomposition Guide

This guide defines how CodeMind Graph should turn ambiguous engineering goals into agent-executable work.

The goal is not to make a single mega-agent do everything. The goal is to design work as a set of observable, verifiable, recoverable task nodes.

For enterprise use, this can be described as an AI digital factory:

```text
rules + agents + tools + approvals + audit logs
```

The point is not to replace every deterministic workflow with an agent. The point is to combine deterministic rules, agentic reasoning, tool access, human review, and auditability into a controlled workflow.

## Core Model

Use this progression:

```text
Human SOP -> Skill -> Task Contract -> Agentic Workflow
```

Definitions:

- Human SOP: how a human performs a process.
- Skill: reusable agent behavior for a specific capability.
- Task Contract: the contract for one task node, including inputs, outputs, success criteria, failure handling, and human review.
- Agentic Workflow: multiple task nodes connected through structured artifacts, tools, verification commands, and review gates.

Short version:

```text
Human SOP lets people know how work is done.
Skill lets an agent know how work is done.
Task Contract lets the system know how to verify work.
Agentic Workflow lets multiple tasks run as a controlled production line.
```

## Design Rules

- Prefer small task nodes over broad open-ended prompts.
- Every task node must define observable inputs and outputs.
- Every task node must define how success is verified.
- Every task node must define what happens when required information is missing.
- Every risky operation must define its human review point.
- Prefer structured artifacts. JSON is the default interchange format when schema validation is useful, but Markdown, tables, manifests, and logs are valid artifacts when they are easier to review.
- Keep product runtime memory separate from engineering harness memory.
- Parameterize business rules that need safe configuration.
- Encode safety boundaries, schemas, permissions, and forbidden actions as deterministic policy or validators.
- Do not split tasks so finely that orchestration overhead exceeds verification value.

## Normative Language

When this guide uses the following keywords, interpret them as requirement levels:

- `MUST`: required for the task to be accepted.
- `SHOULD`: expected unless there is a clear reason not to.
- `MAY`: optional.

Use these words sparingly. Do not use them for style preferences.

## Rules And Policy

Do not use "no hardcoding" as an absolute rule.

Use this distinction:

```text
Variable business rules SHOULD be configurable.
Safety boundaries MUST be deterministic.
```

Examples:

- A finance review threshold may be configurable.
- An employee ID format should be schema-validated.
- Requests above a configured risk threshold should trigger a human review gate.
- Secret access, shell execution, write-capable tools, and destructive operations should be guarded by deterministic policy.
- Output formats should be schema-validated when downstream tasks depend on them.

## Structured Artifacts

Task nodes should exchange structured artifacts when possible.

JSON is a good default when schema validation matters, but it is not the only valid format. Markdown, CSV, file paths, manifests, and object storage references are valid when they fit the task better.

A minimal artifact envelope should include:

```json
{
  "type": "request_triage_result",
  "schema_version": "1.0.0",
  "producer": "request_triage",
  "created_at": "2026-06-01T00:00:00Z",
  "payload": {},
  "validation_status": "passed"
}
```

## Eval Log

Agentic workflows should turn failures into regression data.

Recommended loop:

```text
execute -> observe -> score -> classify failure -> update SOP / Skill / Contract -> regression test
```

Example:

```json
{
  "run_id": "request_triage_2026_001",
  "task": "request_triage",
  "input_case": "purchase_order_request",
  "expected_category": "Finance",
  "actual_category": "IT",
  "failure_type": "domain_keyword_missing",
  "fix_location": "references/finance_terms.md",
  "rubric_update_required": true
}
```

For CodeMind Graph, use this principle when adding graph freshness tests. A stale or unknown index condition should become a named fixture and regression case, not only an ad hoc CLI observation.

## Task Contract Template

```text
Task Name:
  Short stable name.

Purpose:
  Why this task exists.

Inputs:
  Required files, commands, data, or user-provided context.

Outputs:
  Files, structured artifacts, terminal output, docs, or deployed state.

Success Criteria:
  - MUST ...
  - SHOULD ...
  - MAY ...

Verification:
  Commands or checks that prove the task is done.

Failure Handling:
  What to do when inputs are missing, validation fails, or external systems are unavailable.

Human Review:
  Which conditions require explicit human review before continuing.

Scope Limits:
  What this task must not change.

Docs Update:
  Which persistent state docs must be updated after meaningful changes.
```

## Example: CodeMind Graph Slice H

Task Name:

```text
Slice H - Graph Freshness / Stale Index Warning
```

Purpose:

Detect whether `.codemind/graph.json` no longer reflects the current repository source state.

Inputs:

- Current repository root.
- Existing `.codemind/graph.json`.
- Source file list selected by the indexer.
- Existing graph schema and query helpers.

Outputs:

- Graph metadata containing freshness information.
- Deterministic CLI stale-index warnings.
- Read-only MCP responses that include freshness status.
- Tests covering fresh, stale, unknown, and missing metadata states.

Success Criteria:

- `codemind index <root>` MUST write freshness metadata.
- Query commands MUST tolerate older graph files without crashing.
- `codemind find <symbol>` MUST warn when graph freshness is stale or unknown.
- `codemind trace <symbol>` SHOULD include the same warning behavior.
- MCP tools MUST remain read-only.
- MCP tools SHOULD include freshness status in returned Markdown.
- Freshness detection SHOULD use source fingerprints rather than mtime alone.
- The task MUST NOT expose `docs/SESSION_STATE.md`, private planning notes, secrets, shell execution, package installation, or Git operations through MCP.

Verification:

```powershell
pnpm check
node packages/cli/dist/index.js index examples/ts-basic
node packages/cli/dist/index.js find greet --root examples/ts-basic
node packages/cli/dist/index.js trace greet --root examples/ts-basic
```

Failure Handling:

- If freshness metadata is missing, report `unknown` instead of failing.
- If source files cannot be read, report a deterministic diagnostic.
- If graph schema changes are required, update `docs/DECISIONS.md`.
- If MCP response shape changes in a breaking way, pause and document the compatibility impact.

Human Review:

- Required before changing graph schema semantics.
- Required before adding any write-capable MCP behavior.
- Required before exposing engineering harness documents through product tools.

Docs Update:

- Update `docs/SESSION_STATE.md` after meaningful implementation changes.
- Update `docs/ENGINEERING_STATE.md` after build, test, or environment verification.
- Update `docs/DECISIONS.md` if freshness metadata changes graph schema or storage design.

## MCP Safety Boundary

MCP helps agents connect to tools and data. It does not automatically make a workflow safe.

For CodeMind Graph v0.1:

- MCP tools MUST be read-only.
- MCP tools MUST NOT write files.
- MCP tools MUST NOT execute shell commands.
- MCP tools MUST NOT install packages.
- MCP tools MUST NOT perform Git operations.
- MCP tools MUST NOT expose engineering session notes by default.
- MCP outputs SHOULD be deterministic and reviewable.

## Human-In-The-Loop Gates

Human-in-the-loop is not just a confirmation button. It is a workflow control gate.

A workflow gate decides whether a run continues, pauses, rejects, escalates, or rolls back.

Workflow gates are required when:

- a destructive operation is requested
- credentials, secrets, or private keys are involved
- admin permissions are changed
- confidence is below the task threshold
- policy violations are detected
- the task requests capabilities outside its scope

For CodeMind Graph v0.1, graph queries should remain read-only and generally should not require approval. Approval is required before graph schema changes, storage design changes, or any MCP write capability.

## Goal, Rubric, And Workflow

Use `/goal` or an equivalent long-running task controller for work that spans multiple steps.

Relationship:

```text
Goal defines what must be completed.
Task Decomposition defines how the work is split.
Task Contract defines how each node is verified.
Rubric defines whether the result is good enough.
Persistent docs let the next session resume.
```

For CodeMind Graph, every substantial slice should include:

- outcome
- scope
- constraints
- verification commands
- docs update requirements
- stop conditions

## Anti-Patterns

Avoid:

- one prompt that asks an agent to plan, implement, test, deploy, and govern everything at once
- workflows that cannot be inspected between steps
- outputs that are only prose when a structured artifact is needed
- hidden state that only exists in a chat thread
- MCP tools that quietly expand permissions
- tests that rely on nondeterministic output

## Do Not Over-Decompose

Task decomposition is not "split everything into the smallest imaginable piece."

Split only until each node is:

- observable
- verifiable
- replaceable
- recoverable

Do not split when:

- the subtask's inputs and outputs become less clear
- the split increases orchestration cost without improving verification
- the same local reasoning context must remain intact
- the split only adds handoff overhead

## Practical Checklist

Before starting a new slice:

- Is the task small enough to finish and verify?
- Are inputs and outputs explicit?
- Are success criteria testable?
- Is there a deterministic verification command?
- Are private docs and product runtime data kept separate?
- Is a human review gate needed?
- Which persistent state files must be updated?
