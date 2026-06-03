# Prompt Paradox 2

Production static site for the Signal Trials puzzle event.

## What It Uses

- Next.js static export.
- Convex for live backend state and admin controls.
- GitHub Pages for free public hosting.

## Local Setup

Prerequisites:

- Node.js
- pnpm

Install:

```bash
 pnpm install
```

Run locally:

```bash
 pnpm run dev
```

## Build And Verify

```bash
 pnpm run check
 pnpm run build
```

## Deploy

Backend:

```bash
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251';  pnpm exec convex deploy --typecheck disable
```

Pause or resume the live event:

```bash
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251';  pnpm exec convex env set MAINTENANCE_MODE 1
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251';  pnpm exec convex env set MAINTENANCE_MODE 0
```

GitHub Pages:

- The repo is public and the workflow lives in `.github/workflows/pages.yml`.
- Push to `main` to publish.
- Public URL: `https://foces-core.github.io/prompt-paradox-2-/`

## Deployment Note

- The public site is a static export hosted on GitHub Pages.
- The live event state, answer validation, hints, leaderboard, and admin actions still run through the Convex backend.
- Set `MAINTENANCE_MODE=1` in Convex when you want to pause the event without taking the site down.

## Admin Setup

- Admin auth is controlled by `ADMIN_KEY` in Convex production env.
- Set it in Convex production:

```bash
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251'; sfw pnpm exec convex env set ADMIN_KEY "<your-admin-key>"
```

- The app’s admin panel uses this key to pause/resume the event and select the winning team.

## Architecture

- `src/components/GameShell.tsx` drives the UI and admin controls.
- `src/lib/game.ts` contains public level metadata only.
- `convex/answers.ts` stores canonical answers and normalization rules.
- `convex/game.ts` handles registration, validation, hints, leaderboard sorting, pause/resume, and winner selection.
- `MAINTENANCE_MODE=1` keeps the backend alive but blocks live event usage.

## Important Rules

- Level 1 accepts only the binary encoding of `Central Processing Unit`.
- Level 5 proceeds without admin approval in the current implementation.
- The public site is static; live game state  comes from Convex.
