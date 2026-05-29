import type { SiteContent } from "./types";

export const enContent: SiteContent = {
  locale: "en",
  languageName: "English",
  meta: {
    title: "CodeMind Graph | AI-native Graph Platform",
    description: "A local-first code knowledge graph and read-only MCP layer for persistent AI engineering workspaces.",
    ogLocale: "en_US",
  },
  nav: {
    product: "Product",
    engineering: "Engineering",
    features: "Features",
    workflow: "Workflow",
    github: "GitHub",
  },
  hero: {
    eyebrow: "AI-native graph platform",
    title: "CodeMind Graph",
    summary:
      "A persistent engineering workspace that turns repositories into deterministic symbol graphs, repo maps, and read-only context tools for AI coding agents.",
    primaryCta: "View GitHub",
    secondaryCta: "Explore workflow",
    stats: [
      { value: "Local-first", label: "private repository context" },
      { value: "Read-only", label: "MCP integration boundary" },
      { value: "Bilingual", label: "global developer entry point" },
    ],
  },
  showcase: {
    eyebrow: "Workspace graph",
    title: "Repository context as a navigable graph",
    summary:
      "CodeMind Graph maps files, modules, symbols, imports, exports, and agent-facing context into one deterministic workspace layer.",
    nodes: [
      { label: "Symbol Graph", detail: "functions, classes, interfaces", tone: "cyan" },
      { label: "Repo Map", detail: "CODEMIND.md generated context", tone: "mint" },
      { label: "MCP Tools", detail: "find_symbol and get_repo_map", tone: "amber" },
      { label: "Session Memory", detail: "persistent engineering handoff", tone: "coral" },
    ],
    flows: ["index repo", "build graph", "rank context", "guide agent"],
  },
  why: {
    eyebrow: "Why CodeMind Graph",
    title: "AI coding agents need more than raw files",
    summary:
      "Large repositories overwhelm context windows, hide architecture behind file trees, and lose decisions between sessions. CodeMind Graph turns repository structure into a persistent knowledge layer that both humans and agents can inspect.",
    limitationsLabel: "Limits",
    solutionsLabel: "CodeMind Graph",
    limitations: [
      {
        title: "Context windows fragment",
        body: "A model can read a few files, but it rarely keeps the whole dependency story in view during long-running engineering work.",
      },
      {
        title: "RAG alone is approximate",
        body: "Similarity search helps discovery, but it does not provide deterministic symbol ownership, import paths, or module boundaries.",
      },
      {
        title: "Project memory drifts",
        body: "Decisions, generated maps, and handoff state become unreliable when they are not grounded in the current repository graph.",
      },
    ],
    solutions: [
      {
        title: "Knowledge graph",
        body: "Files, modules, symbols, imports, exports, and traces become addressable graph entities instead of loose text chunks.",
      },
      {
        title: "Local-first runtime",
        body: "Repository intelligence is generated locally and stored under `.codemind/`, preserving privacy and low-latency lookup.",
      },
      {
        title: "Persistent engineering memory",
        body: "Repo maps and read-only MCP tools give agents stable context across sessions without exposing private engineering notes.",
      },
    ],
  },
  engineering: {
    eyebrow: "Engineering practices",
    title: "AI-native, local-first engineering standards",
    summary:
      "CodeMind Graph treats structured context as a first-class engineering artifact. The product is built around deterministic graphs, privacy-preserving local processing, and read-only agent integration.",
    pageTitle: "Engineering Practices",
    pageDescription:
      "The design philosophy and engineering standard behind CodeMind Graph: AI-native workflows, local-first processing, deterministic knowledge graphs, and read-only MCP integration.",
    readMore: "Read engineering practices",
    principles: [
      {
        title: "AI-first development",
        body: "The repository is shaped for agents as well as humans: commands are deterministic, outputs are diffable, and context is structured.",
      },
      {
        title: "Local-first processing",
        body: "Source analysis runs on the developer machine. Generated graph data stays local unless the owner explicitly publishes a public demo.",
      },
      {
        title: "Privacy-first architecture",
        body: "MCP tools are read-only by default and do not expose session notes, private docs, environment variables, or write operations.",
      },
      {
        title: "Source of truth management",
        body: "The persisted graph, repo map, and docs-as-state files make long-running engineering sessions resumable and auditable.",
      },
    ],
    architecture: {
      eyebrow: "Architecture",
      title: "Architecture standard",
      body:
        "The v0.1 architecture starts with a TypeScript Compiler API adapter, a deterministic core graph model, a CLI-first query surface, and a read-only MCP server.",
      items: [
        {
          label: "Knowledge Graph Runtime",
          body: "Represent files, modules, symbols, imports, exports, and traces as stable nodes and edges.",
        },
        {
          label: "AI-native Workflow",
          body: "Give implementer, evaluator, and reviewer agents the same structured context before they act.",
        },
        {
          label: "Persistent Context System",
          body: "Use generated repo maps and project state docs as handoff artifacts for long engineering sessions.",
        },
        {
          label: "Graph-based Code Intelligence",
          body: "Prefer deterministic symbol navigation over approximate raw-file prompting for architecture work.",
        },
      ],
    },
    standards: {
      eyebrow: "Standards",
      title: "Operational standards",
      items: [
        {
          label: "Deterministic output",
          body: "Index, find, trace, map, and MCP responses must remain stable enough for tests, reviews, and diffs.",
        },
        {
          label: "Read-only agent boundary",
          body: "The MCP server can retrieve graph context, but it cannot edit files, run shells, install packages, or leak secrets.",
        },
        {
          label: "Agent-friendly context design",
          body: "Public product content explains the graph model without publishing private `.codemind/` data or engineering memory.",
        },
        {
          label: "Quality gate",
          body: "Changes that affect the website, graph queries, or MCP protocol must pass the relevant build, test, and browser QA workflow.",
        },
      ],
    },
  },
  positioning: {
    eyebrow: "Brand positioning",
    title: "A code knowledge graph platform, not another document layer",
    summary:
      "CodeMind Graph is designed for large repositories, AI agents, and persistent engineering work. It combines graph-driven code intelligence with local-first safety.",
    notLabel: "Not",
    isLabel: "Is",
    not: ["Not a generic document tool", "Not only a vector database", "Not a raw RAG wrapper"],
    is: [
      "AI-native code knowledge graph",
      "Local-first repository intelligence layer",
      "Graph-driven context system for long-running agents",
    ],
  },
  features: [
    {
      title: "Visual thought mapping",
      body: "Represent project structure as readable nodes and relationships instead of raw file dumps.",
    },
    {
      title: "AI-assisted knowledge linking",
      body: "Give agents stable symbol and dependency context before they modify large codebases.",
    },
    {
      title: "Persistent engineering memory",
      body: "Keep decisions, state, and generated repo maps separate from private source code exposure.",
    },
    {
      title: "Multi-agent collaboration",
      body: "Prepare one shared graph context for implementer, evaluator, and librarian workflows.",
    },
    {
      title: "AI-native workspace",
      body: "Design the repo itself as an agent-readable workspace with deterministic command output.",
    },
    {
      title: "Graph-based context system",
      body: "Move from approximate search to structured navigation across symbols and modules.",
    },
  ],
  workflow: {
    title: "From repository to agent-ready context",
    steps: [
      { label: "Index", body: "Scan TypeScript sources and write .codemind/graph.json." },
      { label: "Map", body: "Generate CODEMIND.md for human and agent review." },
      { label: "Serve", body: "Expose read-only MCP tools for targeted graph retrieval." },
      { label: "Reason", body: "Use graph structure to guide persistent engineering sessions." },
    ],
  },
  cta: {
    title: "Start with a deterministic repo map",
    body: "CodeMind Graph is built for local-first engineering. Generate the graph, inspect symbols, and expose safe read-only context to your agent workflow.",
    command: "pnpm check && node packages/cli/dist/index.js map --root examples/ts-basic --format markdown",
    link: "https://github.com/luciferyu666/codemind-graph",
  },
};
