# Prompt Paradox 2

Production static site for the Signal Trials puzzle event. The public site is a static Next.js export hosted on GitHub Pages, while live game state (registration, answer validation, hints, leaderboard, admin controls) runs on a Convex backend.

## What it uses

- Next.js static export (`output: "export"` in `next.config.js`)
- Convex for live backend state and admin controls
- GitHub Pages for free public hosting
- TypeScript, Tailwind CSS v4, pnpm

## Local setup

Prerequisites: Node.js and pnpm. A Convex account is needed for backend functions.

```bash
pnpm install
cp .env.example .env    # Placeholder NEXT_PUBLIC_CONVEX_URL lives here
pnpm run convex:dev     # Starts the Convex dev backend and wires your deployment URL
pnpm run dev            # Next.js dev server (turbopack)
```

## Checks and build

```bash
pnpm run check           # ESLint plus tsc --noEmit
pnpm run build           # Static export build
pnpm run test:all        # Answers, state, and UI script tests
pnpm run test:responsive # Playwright responsive suite
```

## Deploy

Backend:

```powershell
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251';  pnpm exec convex deploy --typecheck disable
```

Pause or resume the live event:

```powershell
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251';  pnpm exec convex env set MAINTENANCE_MODE 1
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251';  pnpm exec convex env set MAINTENANCE_MODE 0
```

GitHub Pages:

- The repo is public and the workflow lives in `.github/workflows/pages.yml`.
- Push to `main` to publish.
- Public URL: https://foces-core.github.io/prompt-paradox-2-/

## Deployment notes

- The public site is a static export hosted on GitHub Pages.
- Live event state, answer validation, hints, leaderboard, and admin actions still run through the Convex backend.
- Set `MAINTENANCE_MODE=1` in Convex when you want to pause the event without taking the site down.

## Admin setup

Admin auth is controlled by `ADMIN_KEY` in the Convex production environment. Set it with:

```powershell
$env:CONVEX_DEPLOYMENT='prod:proper-goshawk-251'; sfw pnpm exec convex env set ADMIN_KEY "<your-admin-key>"
```

The admin panel uses this key to pause or resume the event and select the winning team.

## Architecture

- `src/components/GameShell.tsx` drives the UI and admin controls.
- `src/lib/game.ts` contains public level metadata only.
- `convex/answers.ts` stores canonical answers and normalization rules.
- `convex/game.ts` handles registration, validation, hints, leaderboard sorting, pause/resume, and winner selection.
- `MAINTENANCE_MODE=1` keeps the backend alive but blocks live event usage.

## Game rules and player flow

- Level 1 accepts only the binary encoding of `Central Processing Unit`.
- Level 5 proceeds without admin approval in the current implementation.
- The public site is static; live game state comes from Convex.
- Left arrow goes back, right arrow submits and advances where possible, Enter behaves like right arrow on already submitted pages, Esc bypasses the monologue, and audio starts off.

## Level 3 assets (glitch gallery)

- Place nine images (PNG recommended) into `public/puzzles/level3/`. One image should be a real scannable QR encoding the passphrase. Default behaviour expects `real.png`, or mark the entry in `manifest.json` with `"real": true`.
- A sample manifest ships at `public/puzzles/level3/manifest.json`. Each entry may be a filename string or an object with `{ file, real?, answer? }`.
- Gallery behaviour:
  - Images shuffle deterministically per participant ID, so layout differs per participant but stays stable for each one.
  - Only one card may be flipped open at a time.
  - Participants scan the flipped image with their phone camera; there is no in-app scan button.
  - With no manifest or assets present, the UI falls back to generated placeholder visuals so the grid remains functional.

PowerShell quick copy example:

```powershell
# from within your user Downloads folder
Copy-Item -Path "$env:USERPROFILE\Downloads\img\*" -Destination "$PWD\public\puzzles\level3\" -Recurse
```

## Tooling conventions

- Use pnpm by default for JavaScript and TypeScript package management: `pnpm install`, `pnpm add`, `pnpm run <command>`, `pnpm dlx`.
- Wrap networked package commands with the `sfw` wrapper when available, for example `sfw pnpm install`.
- Use the Rust based `rtk` wrapper for git inspection commands such as `git diff` when available.
- When changing Convex code, read `convex/_generated/ai/guidelines.md` first; it contains project specific rules for Convex functions. Convex agent skills for common tasks install with `npx convex ai-files install`.

## Documentation map

- Per folder READMEs were consolidated into this top level README to centralize project notes.
- `agent.md` is the live handoff guide; `memory.md` is the architecture and decision log.

## Security

This repository uses [gitleaks](https://github.com/gitleaks/gitleaks) for automatic secret scanning on every commit.

### Pre-commit hook

A pre-commit hook is configured to scan for secrets before each commit. This helps prevent accidentally committing sensitive information like:

- API keys
- Passwords
- Tokens
- Private keys

### Setup

To enable the pre-commit hook locally:

```bash
pip install pre-commit
pre-commit install
```

### Bypass (emergency only)

In case of emergency, you can bypass the hook:

```bash
git commit --no-verify -m "emergency commit"
```

> Only use `--no-verify` in emergency situations. Regular commits should always be scanned.
