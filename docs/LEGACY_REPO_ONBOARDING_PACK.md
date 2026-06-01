# Legacy Repo Onboarding Pack

Last updated: 2026-06-01

## Positioning

Legacy Repo Onboarding Pack is the first service-oriented wedge for CodeMind Graph.

It packages the v0.1 deterministic graph loop into a paid onboarding deliverable for teams that need to understand an existing TypeScript codebase quickly before refactoring, hiring, migration, or AI-agent adoption.

This is not a SaaS feature yet. It is a repeatable consulting-style offer built from:

- `codemind index`
- `codemind find`
- `codemind trace`
- `codemind map --format markdown`
- read-only MCP graph context
- graph freshness status

## Target Customers

- Independent consultants inheriting unfamiliar TypeScript repositories.
- SaaS teams with legacy frontend, backend, or monorepo codebases.
- Engineering managers onboarding new developers into an older repo.
- AI coding workflow teams that need a trusted local knowledge layer before using agents on production code.
- Startup teams preparing technical due diligence, refactoring plans, or architecture handoff docs.

## Service Contents

The onboarding pack should produce a deterministic, local-first repository snapshot.

Core analysis:

- Repo map generated from `CODEMIND.md`.
- Architecture summary based on files, symbols, imports, exports, and module boundaries.
- Key symbols list for functions, classes, interfaces, types, variables, and methods.
- Dependency overview from `IMPORTS` and `EXPORTS` graph edges.
- Symbol trace examples for selected business-critical symbols.
- Graph freshness report showing whether `.codemind/graph.json` matches current source files.

Optional manual review:

- Identify unclear module boundaries.
- Identify likely high-risk refactor zones.
- Identify missing tests or weak onboarding docs.
- Suggest the next 3 engineering slices for the repo owner.

## Deliverables

Minimum deliverables:

- `CODEMIND.md`
- `Graph Summary.md`
- `Onboarding Report.md`
- Freshness report with indexed time, source file count, and source fingerprint status.

Recommended report sections:

- Executive summary
- Repository shape
- Primary modules
- Key symbols
- Import/export overview
- Trace examples
- Freshness status
- Risks and unknowns
- Recommended next slices

## Pricing Assumption

Initial service hypothesis:

- US$500-2,000 per repository.

Suggested tiers:

| Tier | Price assumption | Scope |
| --- | ---: | --- |
| Starter | US$500 | Small TypeScript repo, generated repo map, graph summary, freshness report. |
| Standard | US$1,000 | Medium repo, generated map, architecture summary, selected symbol traces, onboarding report. |
| Deep Dive | US$2,000 | Larger legacy repo, manual review, refactor risk notes, prioritized engineering slices. |

Pricing must be validated with real customers before being published as fixed product pricing.

## Operating Constraints

- Keep analysis local-first by default.
- Do not upload private source code to hosted systems without explicit customer approval.
- Do not expose customer `docs/SESSION_STATE.md`, `.env`, secrets, or private engineering notes.
- Do not position v0.1 as a complete security scanner.
- Do not claim full natural-language repository QA.
- Do not promise full call graph precision until call graph extraction is implemented.

## Delivery Workflow

1. Confirm repository scope, language, and privacy constraints.
2. Install dependencies in the customer-approved local environment.
3. Run `codemind index <repo>`.
4. Review freshness metadata in `.codemind/graph.json`.
5. Run focused `codemind find` and `codemind trace` examples for important symbols.
6. Run `codemind map --root <repo> --format markdown`.
7. Draft `Graph Summary.md` and `Onboarding Report.md`.
8. Deliver artifacts and recommended next engineering slices.

## Success Criteria

- The customer can understand the repository's major modules within one reading session.
- The customer can identify important symbols and where they live.
- The customer has a deterministic `CODEMIND.md` artifact that can be regenerated and diffed.
- The customer sees whether the graph index is fresh before trusting AI-agent context.
- The customer receives a practical next-step plan rather than a generic architecture essay.
