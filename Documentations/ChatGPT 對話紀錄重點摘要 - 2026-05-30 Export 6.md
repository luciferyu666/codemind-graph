# ChatGPT 對話紀錄重點摘要 - 2026-05-30 Export 6

來源：`ChatGPT-專案排序與建議 (6).md`

## 新增重點

- Export 6 主要補強 CodeMind Graph 對外工程敘事、工具鏈導覽、系統架構規格，以及 Slice H graph freshness 的實作規格。
- 對外文件必須嚴格分清楚 `Current` 與 `Planned`，避免把尚未推送到公開 GitHub `main` 的本機成果寫成公開已驗證能力。
- 本機工作樹目前已具備 `apps/web`、Playwright Browser QA、SEO/Vercel readiness 與 MCP `trace_symbol`，但 Export 6 的部分判斷是依公開 GitHub 狀態而來；後續公開簡報或 README 應以實際 push 後的 repo 狀態為準。
- `docs/TOOLCHAIN.md` 被建議作為正式工具鏈導覽文件，內容應涵蓋 TypeScript Compiler API、pnpm workspace、CLI、MCP、安全政策、AI-native engineering harness、Browser QA / Vercel track。
- CodeMind Graph 對外定位應維持：
  - local-first
  - TypeScript-first
  - deterministic graph queries
  - read-only MCP server
  - AI coding agent knowledge layer
- MCP 說明應補 Host / Client / Server 三層：
  - MCP Host：Claude Desktop、Cursor、Codex 類 AI 開發環境。
  - MCP Client：Host 內部連接 MCP Server 的協定元件。
  - MCP Server：`packages/mcp-server`，暴露 read-only graph tools。
- MCP v0.1 安全政策應寫得更具體：
  - no file writes
  - no shell execution
  - no package installation
  - no git operations
  - no environment variable exposure
  - no engineering memory exposure
  - only query persisted graph index under `.codemind/`
- `AGENTS.md`、`docs/RUBRIC.md`、`docs/SESSION_STATE.md`、`docs/DECISIONS.md` 應被描述為 Engineering Harness，不是 MCP product runtime。
- Slice H 應從單純 `mtime` 檢查升級為 fingerprint-based freshness：
  - file count
  - latest mtime fast path
  - normalized path + file content hash
  - optional git branch / commit / dirty state
- Freshness status 建議使用：
  - `fresh`
  - `stale`
  - `unknown`
- Freshness reason 建議包含：
  - `missing_metadata`
  - `schema_mismatch`
  - `git_dirty`
  - `commit_mismatch`
  - `source_hash_mismatch`
  - `unsupported_workspace`

## 已納入 repo 的調整

- 完整 Export 6 對話紀錄已匯入 `Documentations/ChatGPT-專案排序與建議 (6).md`。
- 新增本摘要檔。
- 新增 `docs/TOOLCHAIN.md`，作為 CodeMind Graph 工具鏈與 Current vs Planned 邊界文件。
- 更新 `docs/SESSION_STATE.md`、`docs/CURRENT_STATE.md`、`docs/ENGINEERING_STATE.md`、`docs/NEXT_DEVELOPMENT_TOPICS.md`。

## 後續實作優先級

下一個最佳工程任務仍是：

```text
Slice H: Graph freshness / stale index warning metadata
```

原因：

- `index/find/trace/map/mcp` 的 deterministic query loop 已可運作。
- MCP-native 核心能力已具備基本 protocol smoke coverage。
- 現在最需要補的是讓 CLI 與 MCP 能明確告知 `.codemind/graph.json` 是否過期，避免 Agent 使用 stale graph 做錯工程判斷。
