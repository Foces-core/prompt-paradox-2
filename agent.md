# Prompt Paradox 2 Agent Guide

## Scope
- Build and maintain the public Prompt Paradox 2 app.
- Keep the public path stable, cheap to run, and easy to verify.
- Treat the offline demo copy as separate unless the user says to merge work back.

## Repo
- Main work tree: `C:\Users\sebin\pp2-publish`
- Main branch is the public/deploy branch.
- Keep commits focused. Do not rewrite unrelated user changes.

## Stack
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Convex backend
- `lucide-react`
- `clsx`
- `pnpm`

## Package workflow
- Use `sfw` for package commands when available.
- Prefer:
  - `sfw pnpm run check`
  - `sfw pnpm run build`
  - `sfw pnpm run dev`
  - `sfw pnpm exec convex deploy`

## Core files
- `src/components/GameShell.tsx`
- `src/lib/game.ts`
- `src/lib/convexApi.ts`
- `convex/game.ts`
- `convex/answers.ts`
- `convex/schema.ts`
- `public/puzzles/level2.png`

## Product rules
- Keep the terminal / overmind look.
- No marketing landing page. First screen must be usable.
- Do not add decorative fluff that hurts scan speed.
- Keep controls obvious and fast.
- BGM must stay off by default.

## Runtime rules
- Story first, then `[LOADING...]`, then play.
- Loading must stay until admin starts the game.
- Final reveal text must stay as:
  - `OVERMIND has chosen you as its chosen operator`
- Left arrow = back.
- Right arrow = submit and advance where possible.
- Enter on already-submitted pages should behave like right arrow.
- Esc should bypass the monologue.

## Admin rules
- Admin panel must stay visible and not blank the page.
- Trim admin key input before use.
- `getPendingSubmissions` must fail closed without throwing.
- Safe fallback admin key for demo continuity: `overmind` if env key is missing.
- If the key is wrong, return empty queue or a clear message, not a runtime crash.

## Level rules
- Level 2 image is local PNG so hidden data stays intact.
- Level 3 cards are generated locally as SVG/data URLs.
- Do not depend on Cloudinary or external image CDN for puzzle-critical assets.
- Hint state must be tied to the displayed level, not a hidden internal pointer.
- Hints should reveal only on click.

## Deployment rules
- Public frontend deploys as static output / hosted site.
- Convex remains the live state layer for the public game.
- If backend code changes, deploy Convex and verify the live flow.
- Keep deployment note in public docs, but remove demo-only warnings from public site text.

## Test rules
- Always run `sfw pnpm run check`.
- Run `sfw pnpm run build` before shipping.
- Browser-smoke the public flow after runtime changes.
- Verify:
  - register
  - intro bypass
  - level navigation
  - hints
  - admin queue
  - winner screen

## Response style
- Be direct.
- State what changed, what was verified, and what still blocks if anything.
- If a detail is unclear, ask one short question instead of guessing.
