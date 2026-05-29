# Browser QA Workflow

Last updated: 2026-05-29

This document defines the browser-driven QA layer for the CodeMind Graph official website and future product UI.

## Stack

CodeMind Graph uses three browser automation surfaces:

- Codex in-app Browser: interactive agent browser surface for local and deployed UI checks.
- Chrome Extension Backend: bridge into the user's Chrome profile for authenticated or profile-dependent checks.
- Playwright Runtime: repo-managed E2E, screenshot, and visual regression test engine.

## Current Environment Status

The repo-managed Playwright runtime is enabled.

Current Codex browser bridge diagnostics:

- Codex in-app Browser: no `iab` backend is currently registered in the Codex App runtime.
- Chrome Extension Backend: enabled and verified through the Codex Chrome Extension.
- Browser backend discovery: `agent.browsers.list()` returns Chrome extension backends.
- Chrome native host manifest: installed and correct.
- Codex Chrome Extension: installed and enabled in the selected Chrome `Default` profile.

Chrome-backed Browser QA has been verified against the local website at `http://127.0.0.1:3000/en` with navigation, DOM inspection, screenshot capture, and language-switch click interaction.

## Local Playwright Commands

Install the Chromium browser once:

```powershell
pnpm playwright:install
```

Run browser QA against the local production build:

```powershell
pnpm test:e2e
```

Run headed browser QA:

```powershell
pnpm test:e2e:headed
```

Update visual baselines intentionally after reviewed UI changes:

```powershell
pnpm test:e2e:update
```

Open the HTML report after a run:

```powershell
pnpm test:e2e:report
```

## Remote / Vercel QA

Run the same tests against a deployed URL by setting `CODEMIND_WEB_BASE_URL`.

```powershell
$env:CODEMIND_WEB_BASE_URL = "https://your-vercel-site.vercel.app"
pnpm test:e2e:remote
Remove-Item Env:\CODEMIND_WEB_BASE_URL
```

When `CODEMIND_WEB_BASE_URL` is set, Playwright does not start the local Next.js server.

## Coverage

The initial browser QA suite covers:

- `/` redirects to `/en`.
- `/en` renders the English official website.
- `/zh-TW` renders the Traditional Chinese official website.
- Language switcher navigation.
- Product navigation anchors.
- Desktop English visual baseline.
- Mobile Traditional Chinese visual baseline.

## CI

`.github/workflows/browser-qa.yml` runs Playwright Chromium QA on Windows for pull requests that touch the website, E2E tests, Playwright config, package lockfile, or the workflow itself. The HTML report is uploaded as a GitHub Actions artifact.

The regular `.github/workflows/ci.yml` continues to run `pnpm check` without downloading browsers.

## Operating Rules

- Keep screenshots and visual baselines scoped to public website UI.
- Do not expose `.codemind/`, `docs/SESSION_STATE.md`, private engineering state, or local repository contents through website QA artifacts.
- Use external deployed URLs only through `CODEMIND_WEB_BASE_URL`; do not hard-code Vercel preview or production domains in tests.
- Update visual baselines only after reviewing the rendered UI.
