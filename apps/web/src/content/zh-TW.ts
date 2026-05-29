import type { SiteContent } from "./types";

export const zhTwContent: SiteContent = {
  locale: "zh-TW",
  languageName: "繁體中文",
  meta: {
    title: "CodeMind Graph | AI 原生知識圖譜平台",
    description: "Local-first 程式碼知識圖譜與唯讀 MCP 知識層，為長期 AI 工程工作階段提供穩定上下文。",
    ogLocale: "zh_TW",
  },
  nav: {
    product: "產品",
    engineering: "工程實踐",
    features: "功能",
    workflow: "流程",
    github: "GitHub",
  },
  hero: {
    eyebrow: "AI 原生圖譜平台",
    title: "CodeMind Graph",
    summary:
      "把 Repository 轉換為可持久保存的 Symbol Graph、Repo Map 與唯讀 MCP Context，讓 AI Coding Agent 能在長期工程工作階段中穩定接續脈絡。",
    primaryCta: "前往 GitHub",
    secondaryCta: "查看流程",
    stats: [
      { value: "Local-first", label: "私有程式碼上下文" },
      { value: "Read-only", label: "MCP 安全邊界" },
      { value: "雙語架構", label: "全球開發者入口" },
    ],
  },
  showcase: {
    eyebrow: "Workspace graph",
    title: "把 Repo Context 變成可導航圖譜",
    summary:
      "CodeMind Graph 將檔案、模組、符號、imports、exports 與 Agent Context 整合為 deterministic workspace layer。",
    nodes: [
      { label: "Symbol Graph", detail: "functions、classes、interfaces", tone: "cyan" },
      { label: "Repo Map", detail: "產生 CODEMIND.md", tone: "mint" },
      { label: "MCP Tools", detail: "find_symbol 與 get_repo_map", tone: "amber" },
      { label: "Session Memory", detail: "持久化工程交接", tone: "coral" },
    ],
    flows: ["index repo", "build graph", "rank context", "guide agent"],
  },
  why: {
    eyebrow: "為什麼需要 CodeMind Graph",
    title: "AI Coding Agent 需要的不只是原始檔案",
    summary:
      "大型 Repository 會快速耗盡 context window，架構關係也常被檔案樹掩蓋。CodeMind Graph 把程式碼結構轉成可持久保存的知識層，讓人類與 Agent 都能穩定查詢。",
    limitationsLabel: "現有限制",
    solutionsLabel: "CodeMind Graph 解法",
    limitations: [
      {
        title: "Context window 會碎片化",
        body: "模型可以讀取少量檔案，但在長期工程任務中，很難穩定維持完整依賴與架構脈絡。",
      },
      {
        title: "單純 RAG 不夠確定",
        body: "相似度搜尋能協助探索，卻無法保證符號歸屬、import path 與 module boundary 的 deterministic 關係。",
      },
      {
        title: "專案記憶容易漂移",
        body: "如果決策、Repo Map 與交接狀態沒有與目前 graph 對齊，Agent resume 後很容易依賴過期資訊。",
      },
    ],
    solutions: [
      {
        title: "Knowledge Graph",
        body: "把檔案、模組、符號、imports、exports 與 trace 轉為可定位的 graph entities，而不是鬆散文字片段。",
      },
      {
        title: "Local-first Runtime",
        body: "Repository intelligence 在本機產生並保存於 `.codemind/`，兼顧隱私、資料主權與低延遲查詢。",
      },
      {
        title: "Persistent Engineering Memory",
        body: "Repo Map 與唯讀 MCP tools 讓 Agent 跨 session 保持穩定上下文，同時不暴露私有工程筆記。",
      },
    ],
  },
  engineering: {
    eyebrow: "工程實踐",
    title: "AI 原生、在地優先的工程標準",
    summary:
      "CodeMind Graph 把結構化 context 視為一級工程產物。產品核心建立在 deterministic graph、隱私優先的本機處理，以及唯讀 Agent integration 之上。",
    pageTitle: "工程實踐",
    pageDescription:
      "CodeMind Graph 的設計哲學與工程標準：AI-native workflow、local-first processing、deterministic knowledge graph 與唯讀 MCP integration。",
    readMore: "閱讀工程實踐",
    principles: [
      {
        title: "AI-first Development",
        body: "Repository 同時為 Agent 與人類設計：指令輸出必須 deterministic、可 diff，且 context 必須結構化。",
      },
      {
        title: "Local-first Processing",
        body: "Source analysis 在開發者本機執行。除非專案擁有者明確發布 public demo，否則 graph data 不離開本機。",
      },
      {
        title: "Privacy-first Architecture",
        body: "MCP tools 預設唯讀，不暴露 session notes、私有 docs、環境變數，也不提供寫入操作。",
      },
      {
        title: "Source of Truth Management",
        body: "透過 persisted graph、Repo Map 與 docs-as-state，讓長期工程 session 能被 resume、review 與 audit。",
      },
    ],
    architecture: {
      eyebrow: "架構",
      title: "架構標準",
      body:
        "v0.1 架構以 TypeScript Compiler API adapter、deterministic core graph model、CLI-first query surface 與 read-only MCP server 為核心。",
      items: [
        {
          label: "Knowledge Graph Runtime",
          body: "將 files、modules、symbols、imports、exports 與 traces 建模為穩定 nodes 與 edges。",
        },
        {
          label: "AI-native Workflow",
          body: "在 Agent 行動前，讓 Implementer、Evaluator 與 Reviewer 共享同一份結構化 context。",
        },
        {
          label: "Persistent Context System",
          body: "以 generated repo map 與 project state docs 作為 long-running engineering session 的 handoff artifacts。",
        },
        {
          label: "Graph-based Code Intelligence",
          body: "在架構任務中，優先使用 deterministic symbol navigation，而不是近似的 raw-file prompting。",
        },
      ],
    },
    standards: {
      eyebrow: "標準",
      title: "操作標準",
      items: [
        {
          label: "Deterministic Output",
          body: "Index、find、trace、map 與 MCP responses 必須足夠穩定，才能支援 tests、review 與 diff。",
        },
        {
          label: "Read-only Agent Boundary",
          body: "MCP server 可以取回 graph context，但不能編輯檔案、執行 shell、安裝 package 或洩漏 secrets。",
        },
        {
          label: "Agent-friendly Context Design",
          body: "公開產品內容可以解釋 graph model，但不得發布私有 `.codemind/` data 或工程記憶文件。",
        },
        {
          label: "Quality Gate",
          body: "影響網站、graph query 或 MCP protocol 的變更，必須通過對應 build、test 與 browser QA workflow。",
        },
      ],
    },
  },
  positioning: {
    eyebrow: "品牌定位",
    title: "CodeMind Graph 不是另一層文件工具",
    summary:
      "CodeMind Graph 為大型 Repository、AI Agent 與長期工程開發而設計，結合 graph-driven code intelligence 與 local-first safety。",
    notLabel: "不是",
    isLabel: "而是",
    not: ["不是單純文件工具", "不只是向量資料庫", "不是 raw RAG wrapper"],
    is: ["AI-native code knowledge graph", "Local-first repository intelligence layer", "支援長期 Agent 的 graph-driven context system"],
  },
  features: [
    {
      title: "視覺化思維映射",
      body: "以節點與關係呈現專案結構，而不是把原始檔案直接塞給 Agent。",
    },
    {
      title: "AI 輔助知識連結",
      body: "在修改大型程式碼前，先給 Agent 穩定的符號與依賴上下文。",
    },
    {
      title: "持久化工程記憶",
      body: "把決策、狀態與 Repo Map 與私有原始碼曝光風險分離。",
    },
    {
      title: "多代理人協作",
      body: "為 Implementer、Evaluator 與 Librarian 建立共享圖譜上下文。",
    },
    {
      title: "AI 原生工作區",
      body: "讓 Repository 本身成為 Agent 可讀、可查詢、可接續的工程工作區。",
    },
    {
      title: "圖譜式上下文系統",
      body: "從模糊搜尋轉向符號、模組與依賴關係的結構化導航。",
    },
  ],
  workflow: {
    title: "從 Repository 到 Agent-ready Context",
    steps: [
      { label: "Index", body: "掃描 TypeScript 原始碼並寫入 .codemind/graph.json。" },
      { label: "Map", body: "產生 CODEMIND.md，供人類與 Agent 共同閱讀。" },
      { label: "Serve", body: "透過唯讀 MCP tools 精準取回圖譜上下文。" },
      { label: "Reason", body: "用圖譜結構支援長期持久化工程工作階段。" },
    ],
  },
  cta: {
    title: "從 deterministic repo map 開始",
    body: "CodeMind Graph 以 local-first 工程流程為核心。先產生圖譜、檢查符號，再把安全的唯讀上下文交給 Agent workflow。",
    command: "pnpm check && node packages/cli/dist/index.js map --root examples/ts-basic --format markdown",
    link: "https://github.com/luciferyu666/codemind-graph",
  },
};
