# Official Website Plan

This document defines the temporary inserted product track for the CodeMind Graph official website and future Vercel deployment.

## Goal

Build the official website for CodeMind Graph as the public entry point for:

- AI-native Graph Platform positioning
- SaaS landing page
- Knowledge graph product showcase
- Persistent engineering workspace narrative
- GitHub repository traffic
- AI agent workflow explanation
- Future Vercel-hosted public demo

The website must not expose private repository data, `.codemind/graph.json` from private projects, local MCP endpoints, or engineering session notes.

## Positioning

Primary message:

```text
CodeMind Graph is an AI-native knowledge graph for persistent engineering workspaces.
```

Supporting ideas:

- Graph-based reasoning for software teams and AI agents
- Persistent AI memory grounded in deterministic code graphs
- Multi-agent engineering workflow context
- Local-first repository analysis with read-only MCP integration
- Developer-first UX for understanding large codebases

## Technical Direction

Planned stack:

- Next.js
- React
- TypeScript
- Tailwind CSS
- pnpm workspace
- Vercel deployment
- GitHub-backed CI/CD

Recommended package boundary:

```text
apps/web
```

Workspace change when implementation begins:

```yaml
packages:
  - "packages/*"
  - "examples/*"
  - "apps/*"
```

The web app should be isolated from `packages/core`, `packages/cli`, and `packages/mcp-server` until there is a clear product need to share generated public demo data.

## Information Architecture

Initial routes:

- `/en`
- `/zh-TW`
- `/en/engineering`
- `/zh-TW/engineering`
- `/en/vincent-liu`
- `/zh-TW/vincent-liu`

Optional later routes:

- `/en/docs`
- `/zh-TW/docs`
- `/en/demo`
- `/zh-TW/demo`
- `/en/changelog`
- `/zh-TW/changelog`

Locale routing should use deterministic route segments so pages are Vercel-compatible and SEO-friendly.

## Page Sections

### Landing Hero

Purpose:

Introduce CodeMind Graph as an AI-native graph platform for persistent engineering context.

Content:

- CodeMind Graph name as the primary first-viewport signal
- AI-native Workspace
- Graph-based Reasoning
- Persistent AI Memory
- Multi-Agent Engineering Workflow
- Primary CTA to GitHub
- Secondary CTA for generated repo map or demo

Design:

- Dark mode dashboard aesthetic
- Graph visualization background or live canvas-like product visual
- No decorative generic gradient hero
- Product concept visible in first viewport

### Product Dashboard Showcase

Purpose:

Show what the product helps users inspect.

Panels:

- Graph visualization
- AI reasoning flow
- Knowledge node system
- Agent workflow graph
- Persistent session architecture

The first implementation can use static synthetic demo data. Do not publish private repo graphs.

### Engineering Practices

Purpose:

Explain CodeMind Graph's engineering philosophy and product differentiation as an AI-native, local-first code knowledge graph platform.

Content:

- Why AI coding agents need structured repository context
- Local-first architecture and privacy boundary
- Knowledge graph runtime and graph-based code intelligence
- AI-native workflow and persistent context system
- Deterministic engineering workflow and read-only MCP standard
- Brand positioning: not a generic document tool, not only a vector database, and not a raw RAG wrapper

Implementation:

- Landing page summary section
- Dedicated bilingual route at `/en/engineering` and `/zh-TW/engineering`
- Locale-specific metadata, canonical links, sitemap entries, and robots allow rules

### Feature Sections

Features:

- Visual Thought Mapping
- AI-assisted Knowledge Linking
- Persistent Engineering Memory
- Multi-Agent Collaboration
- AI-native Workspace
- Graph-based Context System

Each feature should connect directly to a product capability rather than broad AI marketing language.

### GitHub and Developer CTA

Purpose:

Drive technical users to the repository and local-first workflow.

Content:

- GitHub repository link
- Example CLI flow
- Read-only MCP safety message
- Local-first privacy note

### Personal Digital Business Card

Purpose:

Publish a concise founder/operator profile for Vincent Liu that can be used as a LinkedIn, GitHub, personal brand, project showcase, and About Me destination.

Content:

- Vincent Liu as AI Workflow Architect
- AI Native Product Builder, Knowledge Graph Engineer, and AI Agent System Architect positioning
- Contact email
- Core expertise list
- Featured project links for GuardVision Edge, TAIFEX Quant Trading Platform, Caregiver VR Training System, and CodeMind Graph
- Production and productization status

Implementation:

- Dedicated bilingual route at `/en/vincent-liu` and `/zh-TW/vincent-liu`
- Locale-specific metadata, canonical links, sitemap entries, and robots allow rules
- Normalized portrait asset from the verified local photo

## Bilingual Architecture

Required locales:

- English: `en`
- Traditional Chinese: `zh-TW`

Implementation requirements:

- Language switcher
- Locale-specific metadata
- Locale-specific Open Graph text
- Alternate language links
- Sitemap entries for both locales
- Shared content schema so sections stay aligned across languages

Recommended content structure:

```text
apps/web/src/content/en.ts
apps/web/src/content/zh-TW.ts
```

## Visual Direction

Use:

- Dark mode dashboard UI
- Developer-first information density
- Graph visualization aesthetic
- Clear node/edge language
- Modern SaaS layout
- Minimal futuristic product styling

Avoid:

- Vague AI stock imagery
- Decorative orb-heavy backgrounds
- Overly generic gradient landing page
- Private source code screenshots
- Claims that imply cloud indexing of user repositories

## Vercel Deployment Plan

Target:

- Vercel project connected to GitHub repository
- Production deployment on push to `main`
- Preview deployments for pull requests

Expected settings after `apps/web` exists:

- Framework: Next.js
- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @codemind/web build`
- Output: Next.js default
- Node.js runtime: align with project CI target

Initial environment variables:

- None required for static landing page

Future environment variables:

- Analytics provider keys
- Public demo graph source URL
- Documentation search index URL

## Safety and Privacy Rules

- Do not deploy private `.codemind/graph.json`.
- Do not expose local MCP server endpoints.
- Do not publish `docs/SESSION_STATE.md`, `docs/CURRENT_STATE.md`, or private planning notes as product content.
- Use synthetic or public demo graph data only.
- Keep website analytics optional and privacy-conscious.

## Slice Plan

### Slice W0: Website Planning

Status: complete when this document is reviewed.

Deliverables:

- Official website plan
- Roadmap entry
- Session state update

### Slice W1: Next.js Scaffold

Status: complete.

Deliverables:

- `apps/web`
- Next.js + React + TypeScript
- Tailwind CSS
- pnpm workspace update
- `pnpm --filter @codemind/web build`
- CI updated to include web build

### Slice W2: Landing Page MVP

Status: initial skeleton complete.

Deliverables:

- English landing page
- Traditional Chinese landing page
- Language switcher
- Hero section
- Feature sections
- GitHub CTA

### Slice W3: Dashboard Showcase

Status: initial skeleton complete.

Deliverables:

- Synthetic graph visualization
- AI reasoning flow panel
- Persistent session architecture panel
- Responsive desktop and mobile verification

### Slice W4: SEO and Vercel Readiness

Status: complete.

Deliverables:

- Locale metadata
- Open Graph metadata
- sitemap
- robots
- production build verification
- deployment checklist

Implemented scope:

- `apps/web/src/app/sitemap.ts`
- `apps/web/src/app/robots.ts`
- locale canonical and alternate metadata
- Open Graph and Twitter metadata
- generated per-locale Open Graph image route
- `docs/VERCEL_DEPLOYMENT.md`
- Browser QA assertions for SEO endpoints and metadata

### Slice W4a: Browser QA Pipeline

Status: complete.

Deliverables:

- Playwright Chromium runtime
- Desktop and mobile projects
- Local production-server E2E flow
- Remote URL E2E flow through `CODEMIND_WEB_BASE_URL`
- Visual baseline snapshots
- GitHub Actions Browser QA workflow
- Browser bridge diagnostics for Codex in-app Browser and Chrome Extension Backend

### Slice W4b: Engineering Practices Content Integration

Status: complete.

Deliverables:

- Landing page `Why CodeMind Graph` section
- Landing page engineering standards section
- Landing page brand positioning section
- Dedicated bilingual Engineering Practices routes
- Route-specific metadata, canonical links, locale alternates, sitemap entries, and robots allow rules
- Browser QA coverage for engineering routes and updated visual baselines

### Slice W5: Vercel Deployment

Status: complete.

Deliverables:

- Vercel project setup
- GitHub integration
- preview deployment
- production deployment
- README deployment link after production is stable

Implemented:

- Vercel project `codemind-graph` linked under `vincent-lius-projects-de5eeb92`.
- GitHub repository connected to the Vercel project.
- Vercel project Root Directory configured as `apps/web`.
- Production deployment completed.
- Production URL: `https://codemind-graph.vercel.app`.
- Remote Browser QA passed against production.
- README includes the production website URL.

### Slice W6: Vincent Liu Digital Business Card

Status: complete.

Deliverables:

- Bilingual personal profile routes
- Dark-mode SaaS digital business card layout
- Core expertise and featured project sections
- Contact CTA and project status section
- Locale metadata, canonical links, sitemap entries, and robots allow rules
- Browser QA coverage for desktop and mobile route behavior

Implemented:

- `/en/vincent-liu`
- `/zh-TW/vincent-liu`
- Normalized portrait treatment using `apps/web/public/vincent-liu/portrait.jpg`.

## Recommended Next Website Task

When the project owner explicitly switches back to website implementation, the next optional tasks are:

```text
Custom domain setup, analytics, or Git-linked automatic deployment refinement.
```
