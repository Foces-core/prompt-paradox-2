# Prompt Paradox 2 Project Guide

## Purpose
<<<<<<< HEAD

- This repo powers the public Prompt Paradox 2 experience.
- Keep the codebase aligned with the deployed site.
- Prefer small, verifiable changes.

## Core Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Convex backend
- `lucide-react`
- `clsx`
- `pnpm`

## Commands

- Install: `sfw pnpm install`
- Check: `sfw pnpm run check`
- Build: `sfw pnpm run build`
- Dev: `sfw pnpm run dev`
- Convex deploy: `sfw pnpm exec convex deploy`

## Repository Rules

=======
- This repo powers the public Prompt Paradox 2 experience.
- Keep the codebase aligned with the deployed site.
- Prefer small, verifiable changes.

## Core Stack
- Next.js 15 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Convex backend
- `lucide-react`
- `clsx`
- `pnpm`

## Commands
- Install: `sfw pnpm install`
- Check: `sfw pnpm run check`
- Build: `sfw pnpm run build`
- Dev: `sfw pnpm run dev`
- Convex deploy: `sfw pnpm exec convex deploy`

## Repository Rules
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Main work tree: `C:\Users\sebin\pp2-publish`
- Main branch is the deployment branch.
- Keep the offline demo copy separate unless the user asks to merge it back.
- Do not overwrite unrelated user changes.

## Runtime Rules
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Story first, then loading, then play.
- Loading does not clear until admin starts the game.
- Final reveal line:
  - `OVERMIND has chosen you as its chosen operator`
- Left arrow = back.
- Right arrow = submit and advance where possible.
- Enter on already-submitted pages should behave like right arrow.
- Esc bypasses the monologue.
- Audio toggle starts off.

## Admin Rules
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Trim admin input before use.
- Bad admin auth must not crash the page.
- `getPendingSubmissions` should fail closed without throwing.
- Demo fallback admin key is `overmind` when no env key is set.
- Admin panel should stay visible and stable.

## Asset Rules
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Level 2 uses local PNG so steganography stays intact.
- Level 3 uses local SVG/data-url generation.
- Do not use Cloudinary or other remote image services for puzzle-critical assets.
- External CDN/cache tricks are fine only for generic performance work.

## State Rules
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
- Client-side code is presentation and interaction only.

## Verification Rules
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- Run `sfw pnpm run check`.
- Run `sfw pnpm run build`.
- Smoke test:
  - register
  - bypass intro
  - navigate levels
  - reveal hints
  - open admin panel
  - load review queue
  - choose winner
  - confirm final reveal

## Docs
<<<<<<< HEAD

=======
>>>>>>> e4d3c0eafe3fccedafb0ec95fe7e5e30e054f6c0
- `agent.md`: live handoff guide.
- `memory.md`: architecture and decision log.
- Keep this file aligned with both.
