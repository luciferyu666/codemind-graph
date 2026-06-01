# ChatGPT 對話紀錄重點摘要 - 2026-06-01 Export 8

Source:

- `Documentations/ChatGPT-專案排序與建議 (8).md`
- Exported: 2026-06-01 07:24:32

## Core Update

Export 8 extends the prior CodeMind Graph strategy from project selection and product roadmap into an AI-native workflow methodology.

Main thesis:

```text
Do not build a single opaque mega-agent.
Build a workflow made of observable, verifiable, recoverable task nodes.
```

The recommended documentation artifact is:

```text
docs/TASK_DECOMPOSITION_GUIDE.md
```

## Key Concepts

Export 8 recommends a four-layer workflow model:

```text
Human SOP -> Skill -> Task Contract -> Agentic Workflow
```

Meaning:

- Human SOP describes how a human performs the work.
- Skill describes how an agent should perform a reusable capability.
- Task Contract defines inputs, outputs, success criteria, failure handling, and human review points.
- Agentic Workflow connects tasks, tools, structured artifacts, MCP, audit logs, and verification commands.

## Important Corrections

The export emphasizes several precision rules for public and engineering documents:

- Use `MUST`, `SHOULD`, and `MAY` only with RFC-style meaning.
- Do not claim JSON is the only valid node communication format; say structured artifacts, with JSON as the default where useful.
- MCP is a connection and interoperability layer, not a security guarantee.
- MCP-related workflows need user consent, least privilege, human approval, data privacy boundaries, and audit logs where appropriate.
- `/goal` belongs to the long-running agent control layer; it complements task decomposition and rubric-based evaluation.

## CodeMind Graph Link

Export 8 explicitly maps the methodology to CodeMind Graph Slice H:

```text
Slice H - Graph Freshness

Purpose:
Detect whether `.codemind/graph.json` is stale.

Required behavior:
- `codemind index .` writes freshness metadata.
- `codemind find <symbol>` warns when the graph is stale.
- MCP tools include freshness status.
- Missing metadata does not crash CLI or MCP tools.
```

This reinforces the current recommended next implementation task:

```text
Add Graph freshness / stale index warning metadata using source fingerprints.
```

## Project Actions Taken

- Archived the raw Export 8 Markdown under `Documentations/`.
- Added `docs/TASK_DECOMPOSITION_GUIDE.md`.
- Updated persistent engineering state docs to include Export 8.
- Kept the next product implementation priority as Slice H Graph freshness.

