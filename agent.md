# Prompt Paradox 2 Agent Guide

## Purpose
<<<<<<< HEAD

- Maintain the public Prompt Paradox 2 experience.
- Keep the main repo aligned with the deployed site.
- Prefer small, verifiable changes over broad rewrites.

## Working Set

=======
- Maintain the public Prompt Paradox 2 experience.
- Keep the main repo aligned with the deployed site.
- Prefer small, verifiable changes over broad rewrites.

## Working Set
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Repo root: `C:\Users\sebin\pp2-publish`
- Main branch is the deploy branch.
- Keep the offline demo copy separate unless the user explicitly asks to merge it back.

## Stack
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Convex backend
- `lucide-react`
- `clsx`
- `pnpm`

## Commands
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Install: `sfw pnpm install`
- Check: `sfw pnpm run check`
- Build: `sfw pnpm run build`
- Dev: `sfw pnpm run dev`
- Deploy Convex: `sfw pnpm exec convex deploy`
<<<<<<< HEAD

## Repository Areas
=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0

## Repository Areas
- `src/components/GameShell.tsx`
- `src/lib/game.ts`
- `src/lib/convexApi.ts`
- `convex/game.ts`
- `convex/answers.ts`
- `convex/schema.ts`
- `public/puzzles/level2.png`

## Product Rules
<<<<<<< HEAD

- Keep the overmind / terminal tone.
- Do not turn the first screen into a marketing page.
- Keep the UI snappy and readable.
- Audio must stay off by default.
- Avoid decorative clutter that slows scanning or hides controls.

## Game Flow

=======
- Keep the overmind / terminal tone.
- Do not turn the first screen into a marketing page.
- Keep the UI snappy and readable.
- Audio must stay off by default.
- Avoid decorative clutter that slows scanning or hides controls.

## Game Flow
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Story first.
- Then `[LOADING...]`.
- Then play only after admin starts the game.
- Final reveal text:
  - `OVERMIND has chosen you as its chosen operator`
- Left arrow = back.
- Right arrow = submit and advance where possible.
- Enter on already-submitted pages should behave like right arrow.
- Esc should bypass the monologue.

## Admin Rules
<<<<<<< HEAD

- Admin panel must stay visible.
- A bad key must not blank the page.
- Trim the admin key before use.
- Queue fetch must fail closed, not crash.
- Demo fallback admin key: `overmind` when no env key is present.

## Puzzle Rules

=======
- Admin panel must stay visible.
- A bad key must not blank the page.
- Trim the admin key before use.
- Queue fetch must fail closed, not crash.
- Demo fallback admin key: `overmind` when no env key is present.

## Puzzle Rules
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Level 2 must use the local PNG asset so hidden bytes survive.
- Level 3 cards are generated locally as SVG/data URLs.
- Do not use Cloudinary or any remote image CDN for puzzle-critical assets.
- Hints should reveal only after clicking HINT.
- Hint state must follow the displayed level.

## State Source
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Convex is the source of truth for:
  - registration
  - level progression
  - hints
  - leaderboard
  - admin start/pause
  - winner selection
- Client code is presentation and interaction only.

## Deployment Rules
<<<<<<< HEAD

- Deploy backend changes before trusting browser verification.
- Keep the public site no-cost where possible.
- Do not add runtime dependencies that make the game fragile or expensive.

## Verification

- Run `sfw pnpm run check`.
- Run `sfw pnpm run build`.
- Smoke test:
  - register
  - bypass intro
  - navigate levels
  - show hint
  - open admin panel
  - load review queue
  - select winner
  - confirm final reveal

## Handoff Notes

- When a backend change lands, verify the live deployment, not just local build output.
- If the shell bridge fails in this thread, let a worker finish the repo-side change instead of stalling.
- Keep the workspace clean before pushing.

## Response Style
=======
- Deploy backend changes before trusting browser verification.
- Keep the public site no-cost where possible.
- Do not add runtime dependencies that make the game fragile or expensive.
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0

## Verification
- Run `sfw pnpm run check`.
- Run `sfw pnpm run build`.
- Smoke test:
  - register
  - bypass intro
  - navigate levels
  - show hint
  - open admin panel
  - load review queue
  - select winner
  - confirm final reveal

## Handoff Notes
- When a backend change lands, verify the live deployment, not just local build output.
- If the shell bridge fails in this thread, let a worker finish the repo-side change instead of stalling.
- Keep the workspace clean before pushing.

## Response Style
- Be direct.
- State what changed, what was verified, and what still blocks.
- If something is unclear, ask one short question instead of guessing.
