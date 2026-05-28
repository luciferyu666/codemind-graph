# CodeMind Graph 開發藍圖：AI 原生持久化工程實踐指南

## 1. 專案願景與核心定位 (Project Vision & Positioning)

在 2026 年，軟體開發已進入由 AI 驅動的「便利循環 (Convenience Loop)」深度運作期。根據 GitHub Octoverse 2025 的數據，全球開發活動正以前所未有的速度擴張：平均每分鐘建立超過 230 個新 Repository，每月合併的 PR 數量高達 4,320 萬個。這種高頻產出的背後，是 AI 相容性 (AI Compatibility) 對技術選型的決定性影響。TypeScript 之所以超越 Python 與 JavaScript 成為 GitHub 最常用語言，正是因為其強型別特性能為 AI 提供更高精確度的推斷基礎，進而產生更多優質數據，讓 AI 在該生態中表現更佳。

然而，這種產出爆炸也引發了「上下文焦慮 (Context Anxiety)」。當代開發者與 AI Agent（如 Claude Code, Cursor）在大型專案中經常面臨「見樹不見林」的困境。當 Context Window 趨於飽和，Agent 會因無法掌握全域架構而產生幻覺或過早收工。

核心定位：CodeMind Graph 不僅是視覺化工具，它是專為 AI Coding Agent 打造的「知識層 (Knowledge Layer)」。它將模糊的語義搜尋轉化為精確的符號圖譜，為 Agent 提供一張具備結構化脈絡的導航地圖。

### 傳統工具 vs. CodeMind Graph

| 特性 | 傳統程式碼導航工具 | CodeMind Graph |
| --- | --- | --- |
| 目標對象 | 人類開發者（GUI 視覺化優先） | AI Agent（API/CLI 優先）與系統架構師 |
| 資料結構 | 靜態檔案樹、簡單調用圖 | 語義化 Symbol Graph、依賴解析圖 |
| AI 兼容性 | 低（Agent 難以解析視覺介面） | 極高（原生支援 MCP 協定與結構化檢索） |
| 核心價值 | 輔助人工代碼閱讀 | 賦予 Agent 執行跨模組行動的知識基礎 |

此願景直接指導了我們的架構：系統必須是 Local-first 以確保隱私，且必須是 MCP-native 以成為 AI 工作流的標準插件。

## 2. 系統架構設計 (System Architecture)

CodeMind Graph 採用 Local-first 與 MCP-native 架構。在 AI 時代，代碼資產的安全性與極致的掃描效能至關重要。我們放棄雲端託管，讓系統直接運行於開發者的本地環境，確保資料主權與低延遲響應。

### 四層架構深度解析

1. 掃描與解析層 (Parsing Layer)：利用 Tree-sitter 進行極速的增量語法解析，同時結合 LSP (Language Server Protocol) 與 TypeScript Compiler API。Tree-sitter 負責基礎語法樹的構建，而 LSP 則提供生產級的型別檢查與跨文件符號消歧 (Symbol Resolution)，確保索引的絕對精確。
2. 圖譜存儲層 (Graph Storage)：MVP 階段採用 SQLite + FTS (Full-Text Search)。SQLite 保證了零配置與高效能的本地存取，而 FTS 則提供必要的語義檢索能力，在存儲開銷與查詢靈活性間取得平衡。
3. 語義索引層 (Semantic Indexing)：構建 Symbol Graph。節點 (Nodes) 定義為 Function、Class、Module；邊 (Edges) 定義為 DEFINES、CALLS、IMPORTS 與 REFERENCES。這種結構將 Repo 轉化為 Agent 可理解的知識體系。
4. 接口與整合層 (Integration Layer)：透過 Codex CLI 與 MCP Server 對外通訊。MCP (Model Context Protocol) 讓 CodeMind Graph 成為 Agent 的「標準外部大腦」，實現按需加載上下文。

### Monorepo 工程結構

專案採用 pnpm workspace 管理，各 Package 職責分明：

- `packages/core`: 核心圖譜 Schema、存儲引擎與查詢邏輯。
- `packages/adapter-typescript`: 基於 Compiler API 的 TS 符號解析器。
- `packages/mcp-server`: 實作 MCP 協定，暴露 Read-only 工具集。
- `packages/cli`: 開發者交互入口（`codemind index/find`）。

這種架構確保了從底層解析到動態協作的完整閉環。

## 3. AI-native Engineering 工作流 (AI-native Engineering Workflow)

我們正從「手動協作」轉向「評價工程 (Evaluation Engineering)」。開發者的角色從編碼者演進為定義標準、設定目標並管理 Agent 迭代的架構師。

### 持久化工程會話 (Persistent Engineering Session)

透過 Codex APP 與 `AGENTS.md` 建立「長期記憶」。`SESSION_STATE.md` 與 `AGENTS.md` 不僅是文檔，更是 MCP Server 的結構化輸入。它們作為「交付產物 (Handoff Artifacts)」，確保 Agent 在重啟會話後能立即接續之前的決策脈絡，解決跨會話的資訊斷層。

### 雙角色協作架構 (Implementer/Evaluator)

實作「實作者」與「評審者」分離。透過嚴格的評價標準 (Rubric) 校準評審 Agent，迫使實作者在未達標前持續優化。

### `/goal` 指令範本

```text
/goal
- [Outcome]: 完成 packages/core 之符號索引，需通過 100% 之 TS Import 解析測試，且不得遺漏任何 node_modules 外部宣告。
- [Verification]: 執行 pnpm test 且通過所有 test-cases/ts-imports 測試。
- [Constraints]: 嚴禁使用 'any' 型別，保持 SQLite 權限為 Read-only。
- [Error Handling]: 若遇到無法解析的外部循環依賴，暫停並輸出依賴清單。
```

### 評價標準 (Rubric) 量化範例

| 維度 | 權重 | 量化標準 |
| --- | --- | --- |
| Scope Control | 30% | 是否嚴格限制在 TS/CLI 範圍內，零外部冗餘依賴。 |
| Model Quality | 40% | Symbol Graph 邊緣解析覆蓋率 (Edge Coverage) > 95%。 |
| Code Integrity | 30% | 100% 通過 Typecheck，嚴禁使用 `any`。 |

透過此流程，系統能觸發所謂的「Ralph Wiggum Method」創意飛躍。在持續迭代的第 10 輪之後，Agent 往往能超越平庸的模板，產出如從 2D 靜態導航向 3D 空間視角轉換的技術突破。

## 4. MVP 規劃與功能路徑 (MVP Roadmap)

CodeMind Graph 優先鎖定「確定性圖譜查詢 (Deterministic Query)」。在初期，結構化的準確性遠比自然語言問答重要。

### 里程碑規劃

- [x] Phase 001 (基礎設施)：
  - 利用 Tree-sitter 與 LSP 實作 TypeScript 深度掃描。
  - 構建本地 SQLite Symbol Graph。
  - 發佈 Read-only MCP Server（含 `find_symbol`, `trace_dep`）。
- [ ] Phase 002 (生態整合)：
  - 增加 Python 支援（整合 Pyright）。
  - 實作 Context Ranking 算法，優化輸出至 Agent 的上下文密度。
  - 發佈 VS Code 擴充功能原型。
- [ ] Phase 003 (智力擴張)：
  - 聯動 DevSec Sentinel 進行結構感知安全掃描。
  - 自動化技術債評分與 Onboarding 指南生成。

### 安全政策：Read-only by Default

基於 2026 年 5 月發生的 TeamPCP 攻擊事件（惡意擴充功能 "Mini Shai-Hulud" 導致 3,800 個內部儲存庫外洩），CodeMind Graph 強制執行「預設唯讀」政策。MCP Server 不會暴露修改檔案的工具，確保在企業級環境中的安全性。

## 5. 技術棧與環境配置 (Tech Stack & Environment)

為達成極致的本地性能，我們選擇 Windows Native Runtime 與 Node.js LTS (v24.16.0)。

### 核心技術棧

| 組件 | 技術選擇 | 理由 |
| --- | --- | --- |
| Runtime | Node.js v24.16.0 LTS | 高效 IO 與成熟的 LSP 支援 |
| Language | TypeScript ESM | 高 AI 兼容性與開發穩定性 |
| Package Manager | pnpm | 優秀的 Monorepo 管理機制 |
| Storage | SQLite + FTS | Local-first、零配置且效能卓越 |
| Validation | Zod | 嚴格驗證 MCP 與 CLI 的輸入安全 |

### Windows 初始化關鍵步驟

1. Git 配置：執行 `git config --global core.autocrlf true` 確保跨平台換行符一致。
2. PowerShell 環境：設定 `PNPM_HOME` 並執行 `Set-ExecutionPolicy RemoteSigned`。
3. 路徑規範：專案鎖定於 `F:\Codex Projects\codemind-graph` 以利自動化腳本定位。

## 6. 專案持久化記憶系統 (Project Memory Layer)

在 AI 工程中，「記憶」是系統的靈魂。我們在 `docs/` 資料夾中定義了嚴格的維護規範，作為 Agent 的長期記憶載體。

### 文件維護規範

- `CURRENT_STATE.md`: 紀錄當前 Context、剩餘 Bug 與下一階段目標。
- `DECISIONS.md`: 紀錄關鍵架構決策 (ADR)，防止 AI 重構時推翻先前邏輯。
- `ENGINEERING_STATE.md`: 紀錄 Build 狀態、測試覆蓋率與性能指標。

### `AGENTS.md` 內容範本

```markdown
# CodeMind Graph Engineering Rules

## Context Persistence

- MCP Server must read SESSION_STATE.md to resume tasks.
- Update CURRENT_STATE.md after every successful pnpm test.

## Engineering Standards

- Use TypeScript ESM only. No 'any' types allowed.
- MCP Tools must remain Read-only. Never expose 'write' operations.
- Reference DECISIONS.md before modifying the graph schema.
```

## 7. 部署、安全性與長期目標 (Ops, Security & Long-term Vision)

進入 2026 年，供應鏈安全已成為開源生態的核心挑戰。根據 Sonatype 2026 數據預警，2025 年偵測到 454,600 個新增惡意套件，累計已達 134.6 萬個。

### 安全與自動化 (DevSec)

透過 GitHub Actions 建立 CI/CD 流，每一筆 AI 生成的 PR 都必須經過結構感知掃描，確保不會引入惡意依賴或隱私外洩。

### 長期目標：從大腦到橋樑

CodeMind Graph 的願景是演進為「AI-native 知識圖譜」。

- 多代理人協作：讓 Implementer 與 Evaluator 共享同一圖譜 Context。
- 空間視角：透過 3D 空間視角呈現系統依賴，實現人類直覺與 AI 邏輯的完美融合。

總結：CodeMind Graph 是開發者的「大腦（知識）」、「護盾（安全）」與「橋樑（協定）」。在這個 AI 生成內容爆炸的時代，我們正從 Coder 轉型為「知識架構師」，用持久化的結構圖譜，為軟體工程奠定可信任的基石。
