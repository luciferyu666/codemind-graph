# Vercel Deployment Readiness

Last updated: 2026-05-30

## Status

Slice W4 and W4b prepare the official website for Vercel deployment. Production publishing requires a Vercel-authenticated project link to the target team.

Current readiness:

- `apps/web` is a Next.js App Router application.
- Public locale routes are `/en`, `/zh-TW`, `/en/engineering`, and `/zh-TW/engineering`.
- `/sitemap.xml` includes landing and Engineering Practices routes with alternate links.
- `/robots.txt` allows public website routes and disallows private engineering paths.
- Locale pages publish canonical, alternate, Open Graph, and Twitter metadata.
- Browser QA covers routing, metadata, sitemap, robots, Engineering Practices pages, and visual baselines.

Latest deployment:

- GitHub `main` has been pushed through release checkpoint `b2d85fd`.
- GitHub Actions CI run `26664570193` passed `pnpm check`.
- Vercel CLI was upgraded to `54.6.1` and authenticated as `luciferyu666`.
- Vercel project `codemind-graph` is linked under `vincent-lius-projects-de5eeb92`.
- GitHub repository `https://github.com/luciferyu666/codemind-graph` is connected to the Vercel project.
- Production deployment `dpl_Ga9gXKbh5WfqYBoAp6bHVqa7PQSv` completed successfully.
- Production URL: `https://codemind-graph.vercel.app`
- Remote Browser QA passed against the production URL with `pnpm test:e2e:remote`.

## Vercel Project Settings

Use these settings when creating the Vercel project from GitHub:

- Target team/dashboard: `vincent-lius-projects-de5eeb92`
- Repository: `luciferyu666/codemind-graph`
- Framework preset: Next.js
- Root directory for local CLI deployment: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm --filter @codemind/web build`
- Output directory: Next.js default
- Node.js version: align with CI, currently Node.js `24.x`

The website is static landing-page content today. No required secret environment variables are needed for Slice W4.

Optional public environment variable:

```text
NEXT_PUBLIC_CODEMIND_SITE_URL=https://codemind-graph.vercel.app
```

The current default already points to the production alias:

```text
https://codemind-graph.vercel.app
```

Set this only if the final production URL or custom domain changes.

## Local Pre-Deploy Gates

Run these before creating a Vercel preview or production deployment:

```powershell
pnpm --filter @codemind/web build
pnpm test:e2e
pnpm check
```

Run remote Browser QA after a preview deployment exists:

```powershell
$env:CODEMIND_WEB_BASE_URL = "https://your-preview-url.vercel.app"
pnpm test:e2e:remote
Remove-Item Env:\CODEMIND_WEB_BASE_URL
```

## Privacy Boundary

Do not expose these paths or generated private project files as public website content:

- `.codemind/`
- `docs/SESSION_STATE.md`
- `docs/CURRENT_STATE.md`
- `docs/ENGINEERING_STATE.md`
- `Documentations/`
- Local MCP endpoints

Only synthetic demo graph data or public repository examples should be used in future website sections.

## Deployment Sequence

1. Confirm local pre-deploy gates pass.
2. Commit and push `main` to GitHub.
3. Create or link the Vercel project under `vincent-lius-projects-de5eeb92`.
4. Set Root Directory to `apps/web`.
5. Set `NEXT_PUBLIC_CODEMIND_SITE_URL` to the preview or production origin if it differs from the default.
6. Create a preview deployment.
7. Run `pnpm test:e2e:remote` against the preview URL.
8. Promote or deploy to production only after Browser QA passes.

CLI flow when Vercel credentials are available:

```powershell
vercel link --yes --project codemind-graph --scope vincent-lius-projects-de5eeb92 --cwd apps/web
vercel --prod --cwd apps/web --scope vincent-lius-projects-de5eeb92
```

Implemented production deploy command:

```powershell
vercel --prod --yes --cwd apps/web
```

Implemented Git connection command:

```powershell
vercel git connect https://github.com/luciferyu666/codemind-graph --cwd apps/web
```

## Not In Scope For Slice W4

- Production Vercel deployment
- Custom domain setup
- Analytics
- Public documentation site
- Public graph demo backed by real private repo data
