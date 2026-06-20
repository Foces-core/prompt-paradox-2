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
- The public site is static; live game state comes from Convex.
- Use the Rust-based `rtk` wrapper for git inspection commands such as `git diff` when it is available.

## Consolidated Notes

### Agents & Convex

- This repo uses Convex as its backend. When working on Convex code, always read `convex/_generated/ai/guidelines.md` before making changes — it contains project-specific rules for Convex functions and AI agent usage.
- Convex agent skills for common tasks can be installed with `npx convex ai-files install`.

### Package manager & environment

- Use `pnpm` by default for JavaScript/TypeScript package management: prefer `pnpm install`, `pnpm add`, `pnpm run <script>`, and `pnpm dlx`.
- When available, wrap networked package/tool commands with the `sfw` wrapper (example: `sfw pnpm install`) to respect local firewall policies.

### Level 3 Assets (Glitch Gallery)

- Place nine images (PNG recommended) into `public/puzzles/level3/`. One image should be the real scannable QR encoding the passphrase (default behaviour expects `real.png` or mark the entry in `manifest.json` with `"real": true`).
- A sample `manifest.json` is included at `public/puzzles/level3/manifest.json`. Each manifest entry may be a string filename or an object with `{ file, real?, answer? }`.
- Gallery behaviour:
  - Images are shuffled deterministically per participant ID (so layout changes per participant but is stable for that participant).
  - Only one card may be flipped/open at a time.
  - Participants scan the flipped image using their phone camera; there is no in-app scan button.
  - If no manifest or assets exist, the UI falls back to generated placeholder visuals so the grid remains functional.

PowerShell quick copy example (from Downloads\img into the workspace):

```powershell
# from within your user Downloads folder
Copy-Item -Path "$env:USERPROFILE\Downloads\img\*" -Destination "$PWD\public\puzzles\level3\" -Recurse
```

### Documentation consolidation

- Per-folder READMEs (for example `public/puzzles/level3/README.md`) have been consolidated into this top-level README to centralize project notes.

### Architecture notes

- Recent undocumented architectural changes have been recorded to `/memories/repo/architecture.md`. See that file for a precise change log (gloss: GlitchGallery refactor, seeded shuffle, manifest handling, placeholder fallback, removal of in-app scan button, and README consolidation).
