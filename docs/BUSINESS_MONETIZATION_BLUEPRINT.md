# Business And Monetization Blueprint

This document defines the first commercial strategy for CodeMind Graph.

It is based on `Documentations/CodeMind Graph 商業化與變現策略藍圖.md` and should be treated as an internal strategy draft, not a public pricing page.

Last reviewed: 2026-06-01

## Core Positioning

CodeMind Graph should not be positioned as another AI IDE or general AI coding assistant.

Recommended positioning:

```text
CodeMind Graph is a local-first repo knowledge graph and read-only MCP context server
for AI coding agents, engineering teams, and enterprise codebase governance.
```

Short positioning:

```text
Repo-specific engineering memory for AI coding agents.
```

Chinese positioning:

```text
CodeMind Graph 是 AI Coding Agent 的本機優先程式碼知識圖譜與唯讀 MCP 上下文伺服器，
協助個人開發者、團隊與企業把大型 repo 轉化為可查詢、可審計、可治理的工程記憶層。
```

## What Not To Sell

Do not sell CodeMind Graph as:

- another Cursor, Copilot, Windsurf, or AI IDE
- a general-purpose graph database
- a generic agent memory store
- a cloud-first source-code indexing platform

The product should be sold as:

- local-first repo understanding
- persistent engineering memory
- deterministic graph context for agents
- read-only MCP context infrastructure
- team and enterprise codebase governance layer

## Market Position

The AI coding market is already crowded at the IDE and assistant layer.

CodeMind Graph should live below those tools as an infrastructure layer:

| Category | Examples | Their Value | CodeMind Graph Opportunity |
| --- | --- | --- | --- |
| AI IDE / coding agent | Cursor, Copilot, Windsurf | generate, edit, review code | provide repo graph context |
| Enterprise code intelligence | Sourcegraph | code search and enterprise code understanding | local-first MCP-native context graph |
| Open agent workflow tools | Continue, Claude Code, Codex | configurable agents and workflows | plug-in knowledge graph backend |
| General graph / memory | Neo4j, Graphiti / Zep | graph database or agent memory | vertical code and engineering memory |

The strategic wedge:

```text
AI coding tools need better codebase context.
CodeMind Graph supplies that context without becoming the coding tool itself.
```

## Target Markets

Primary:

- independent developers maintaining multiple repos
- AI engineers building coding-agent workflows
- software consultants onboarding to client codebases
- SaaS teams with long-lived repositories
- teams maintaining legacy TypeScript repositories

Secondary:

- SI system integrators
- enterprise engineering departments
- regulated engineering teams that require local-first analysis
- AI Agent platform teams that need a repo context backend

## Monetization Model

Use a four-layer model:

```text
Open Core + Local-first Pro + Team Shared Memory + Enterprise Governance
```

### Community Edition

Price:

```text
Free / Open Source
```

Purpose:

- GitHub traction
- developer trust
- MCP ecosystem adoption
- standardize the repo graph format

Included:

- `codemind index`
- `codemind find`
- `codemind trace`
- `codemind map`
- `.codemind/graph.json`
- `CODEMIND.md`
- basic read-only MCP tools
- TypeScript-first local adapter
- local-only storage

Community Edition must remain useful enough to build trust.

### Professional Plan

Indicative price:

```text
US$12-19 / month
```

Target:

- individual power users
- solo consultants
- independent developers
- AI engineers

Possible paid features:

- richer local reports
- multiple workspace profiles
- advanced repo onboarding report generation
- local graph history
- local visual report
- custom context pack templates
- priority local adapters after TypeScript

Pricing constraint:

Professional should be priced below full AI IDE tools because CodeMind Graph is companion infrastructure, not a complete coding environment.

### Team Plan

Indicative price:

```text
US$15-25 / seat / month
```

Target:

- small SaaS teams
- engineering teams maintaining shared repos
- consultancies
- agencies and SI teams

Possible paid features:

- shared team graph memory
- team-level repo onboarding reports
- shared `CODEMIND.md` history
- GitHub PR context packs
- team graph freshness dashboard
- team audit trail for graph queries
- private team templates and task contracts

Team Plan value:

```text
Make repo knowledge reusable across people and agents.
```

### Enterprise Plan

Indicative price:

```text
US$15K-100K+ / year
```

Target:

- mid-market and enterprise R&D teams
- financial, medical, industrial, and regulated software teams
- organizations that require local-first or self-hosted analysis
- SI partners building AI engineering workflows for clients

Initial Enterprise features:

- self-hosted single-node deployment
- SSO / SAML / OIDC
- RBAC
- MCP policy controls
- audit logs
- repository allowlists
- compliance-oriented deployment docs
- support SLA
- onboarding workshops

Do not promise HA distributed graph storage in the first Enterprise version. Treat it as Enterprise v2.

## First Paid Wedge

The best first monetizable product is:

```text
Legacy Repo Onboarding Pack
```

Target customer:

- software consultants
- SaaS teams onboarding new engineers
- companies with undocumented TypeScript repos
- teams preparing AI coding-agent adoption

Offer:

- run CodeMind Graph on the target repo
- generate `CODEMIND.md`
- produce architecture and module map
- identify key symbols, entry points, and imports/exports
- provide graph freshness and risk notes when Slice H exists
- deliver an onboarding report and consultation session

Indicative pricing:

```text
US$500-2,000 per repository
```

Why this should come before pure SaaS:

- faster first revenue
- validates buyer pain
- generates case studies
- informs Pro and Team feature priorities
- avoids building billing and hosted infra too early

## Productization Roadmap

### Stage 1: Open-source local-first CLI and MCP

Goal:

- developer trust
- GitHub traction
- clear demo loop

Deliverables:

- reliable TypeScript graph
- CLI `index`, `find`, `trace`, `map`
- `CODEMIND.md`
- read-only MCP
- Graph freshness / stale index warnings
- README demo

### Stage 2: Paid Pro local app

Goal:

- individual power users
- paid local workflows

Deliverables:

- local visual report
- advanced context packs
- workspace profiles
- historical graph snapshots

Indicative target:

```text
US$1K-2K MRR
```

### Stage 3: Repo Onboarding service

Goal:

- first customer proof
- service revenue
- case studies

Indicative target:

```text
US$1K-5K service revenue / month
```

### Stage 4: Team shared engineering memory

Goal:

- recurring team subscription
- shared repo knowledge

Deliverables:

- shared team memory
- PR context packs
- team freshness dashboard
- team templates
- audit trail

Indicative target:

```text
US$10K-30K MRR
```

### Stage 5: Enterprise self-hosted governance

Goal:

- annual contracts
- regulated and enterprise adoption
- SI partnerships

Deliverables:

- self-hosted deployment
- SSO / RBAC
- MCP policies
- audit logs
- support SLA

### Stage 6: Agent-native development platform

Goal:

- long-term category creation

Potential expansion:

- agent workflow marketplace
- context pack marketplace
- enterprise graph governance
- multi-agent engineering workflows
- AI engineering memory control plane

## Commercial Moats

### Repo-Specific Graph Schema

Generic graph databases are broad. CodeMind Graph should own a vertical schema for AI coding agents:

- files
- modules
- functions
- classes
- methods
- imports
- exports
- references
- future call graph edges
- freshness metadata

### Persistent Engineering Memory

The strongest commercial language is:

```text
CodeMind Graph sells trusted engineering memory for AI agents.
```

Memory layers:

- repo onboarding memory
- team engineering memory
- architecture decision context
- graph freshness state
- agent-ready context packs

### MCP-Native Interoperability

Read-only MCP makes CodeMind Graph pluggable into agent ecosystems.

Enterprise version can later add:

- MCP policy controls
- allowlists
- read-only tool registry
- audit logs
- tool invocation reports

### Task Contract And Workflow Integration

The workflow methodology in `docs/TASK_DECOMPOSITION_GUIDE.md` can become an Enterprise feature:

- task contracts
- eval logs
- verification gates
- repo-aware workflow templates
- human review gates

## Priority Paid Features

Recommended order:

| Priority | Feature | Reason |
| --- | --- | --- |
| 1 | Graph freshness warnings | trust and reliability |
| 2 | Repo onboarding report | first service revenue |
| 3 | Local visual report | Pro value |
| 4 | Team shared memory | team subscription core |
| 5 | PR context pack | team workflow integration |
| 6 | Audit log | Enterprise requirement |
| 7 | MCP policy controls | Enterprise governance |
| 8 | RBAC / SSO | Enterprise contract requirement |

## Pricing Caveats

Do not publish competitor pricing without re-checking official sources.

Reference snapshot reviewed on 2026-06-01:

- Cursor pricing listed Individual at `US$20/month`, Teams at `US$40/user/month`, and Enterprise as custom with MCP access controls, audit logs, and service accounts.
- Continue pricing listed Team at `US$20/seat/month` and Company as custom pricing.
- Neo4j AuraDB Professional listed `US$65/GB/month`.
- GitHub Copilot and Sourcegraph pricing pages should be rechecked before public publication because plan packaging can change.

Official sources:

- https://cursor.com/pricing
- https://github.com/features/copilot/plans
- https://sourcegraph.com/pricing
- https://www.continue.dev/pricing
- https://neo4j.com/pricing/

## Risks

- Selling as another AI IDE will place CodeMind Graph against stronger incumbents.
- Selling as a graph database will dilute the vertical value proposition.
- Usage-based API billing should not be launched too early.
- Professional plans should avoid unlimited promises that create support costs.
- Enterprise plans should not overpromise HA distributed storage before the product needs it.
- Cloud sync must not violate the local-first trust boundary.

## Near-Term Action Plan

Engineering:

- Finish Slice H Graph freshness.
- Add README demo after freshness is implemented.
- Prepare v0.1.0 release tag.

Go-to-market:

- Publish a simple demo flow:

```powershell
codemind index examples/ts-basic
codemind find greet --root examples/ts-basic
codemind trace greet --root examples/ts-basic
codemind map --root examples/ts-basic --format markdown
```

- Create a `Legacy Repo Onboarding Pack` one-pager.
- Offer the first onboarding engagement to a consultant, SaaS team, or founder-led engineering team.
- Use feedback to decide which Pro and Team features are worth building.

## Final Thesis

CodeMind Graph has commercial potential if it avoids the wrong categories.

It should not sell "more code generation."

It should sell:

```text
AI agents can trust this repo because CodeMind Graph keeps its engineering memory structured, local, queryable, and fresh.
```

Commercial summary:

```text
Open-source core builds trust.
Repo Onboarding Pack earns the first revenue.
Pro Plan monetizes individual power users.
Team Plan monetizes shared engineering memory.
Enterprise Plan monetizes governance, audit, policy, and self-hosting.
```

