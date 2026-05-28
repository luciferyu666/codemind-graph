# Codex App Setup

This document records the local setup steps for the `Inspect codemind-graph repo` engineering session.

## Project path

```text
F:\Codex Projects\codemind-graph
```

## Open workspace in Codex Desktop

```powershell
codex app "F:\Codex Projects\codemind-graph"
```

## Resume session from Codex CLI

```powershell
codex resume "Inspect codemind-graph repo" -C "F:\Codex Projects\codemind-graph"
```

If the named session is not available in the CLI picker, use:

```powershell
codex resume --last -C "F:\Codex Projects\codemind-graph"
```

## VS Code integration

Open the workspace file:

```powershell
code "F:\Codex Projects\codemind-graph\codemind-graph.code-workspace"
```

## Project memory files

- `AGENTS.md`
- `docs/SESSION_STATE.md`
- `docs/CURRENT_STATE.md`
- `docs/DECISIONS.md`
- `docs/ENGINEERING_STATE.md`

## Sidebar synchronization note

Codex Desktop project/sidebar membership is controlled by the desktop app. The repository can prepare the workspace path, Git root, project memory files, and resume commands, but moving or pinning a live chat into the left sidebar may require the Codex Desktop UI.

Status: confirmed on 2026-05-27. `codemind-graph` appears under the Codex Desktop `Projects` sidebar, and `Inspect codemind-graph repo` is listed beneath it.
