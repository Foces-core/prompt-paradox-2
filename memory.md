# Prompt Paradox 2 Memory

## Current Shape
- Public app: Next.js frontend with Convex as live backend.
- Main repo: `C:\Users\sebin\pp2-publish`
- Main branch is the deployment branch.
- Package manager: `pnpm`
- Command wrapper: `sfw`

## Live Deployment
- Convex production deployment:
  - `prod:proper-goshawk-251`
- If backend code changes, deploy Convex and recheck the live flow.
- Public frontend is hosted separately from Convex.

## Core Decisions
- Story gate comes first.
- Loading stays visible until admin starts the game.
- Final victory line is:
  - `OVERMIND has chosen you as its chosen operator`
- Winner reveal should stay celebratory.
- Pending final result should use a thinking / unresolved state.

## Admin Decisions
- Admin auth uses `ADMIN_KEY` when present.
- If `ADMIN_KEY` is missing, demo fallback is `overmind`.
- Trim admin input before comparing.
- Do not let a bad key crash the page.
- `getPendingSubmissions` returns an empty list on bad auth.
- Queue loads only when the admin clicks the button.

## Game State Decisions
- Convex is the source of truth for:
  - registration
  - answers
  - hints
  - leaderboard
  - pause / resume
  - winner selection
- Client-side state is for display, navigation, and immediate feedback only.
- Client code must not be trusted for anti-cheat.

## Puzzle / Asset Decisions
- Level 2 uses local PNG to preserve steganography.
- Level 3 uses local SVG/data-url generation.
- No Cloudinary for puzzle-critical assets.
- No external QR/image API for core gameplay images.
- CDN/cache tricks are fine for generic assets, not for puzzle correctness.

## Hint Decisions
- Hint reveal belongs to the displayed level.
- Hints stay hidden until clicked.
- Hints should not appear automatically on page load.

## Navigation Decisions
- Left arrow maps to back.
- Right arrow maps to submit and advance.
- Enter on already-submitted screens should behave like right arrow.
- Story replay gets its own button after the game starts.
- Esc bypasses the monologue.
- Back stops at level 1.

## UX Decisions
- Overmind / terminal styling stays.
- Audio toggle starts off.
- Correct answers should celebrate quickly.
- Wrong answers should fail fast.
- Keep the UI readable and compact.

## Performance Decisions
- Use deterministic local generation for puzzle visuals when exact bytes matter.
- Keep dependencies light.
- Keep the public deploy cheap to run.
- Avoid paid image/CDN dependencies in the gameplay path.

## Documentation Decisions
- `CLAUDE.md`, `agent.md`, and `memory.md` should stay aligned.
- `agent.md` is the live handoff guide.
- `memory.md` is the architecture and decision log.
- `CLAUDE.md` should point to the same rules and commands as the other docs.

## Verification Rules
- Run `sfw pnpm run check`.
- Run `sfw pnpm run build`.
- Browser-smoke after runtime/backend changes.
- Recheck admin queue, hint clicks, and final winner flow.

## Handoff Snapshot
- If the shell bridge fails in the main thread, use a worker thread to keep moving.
- Do not treat the docs as the source of truth for code; verify against the repo.
- Keep the live deployment and the local repo in sync after every backend change.

## Stable Strings
- Loading gate:
  - `[LOADING...]`
- Demo fallback admin key:
  - `overmind`
- Final reveal:
  - `OVERMIND has chosen you as its chosen operator`

## Follow-Up Rule
- If a change touches Convex, verify the deployed backend.
- If a change touches puzzle assets, verify exact bytes / rendering.
- If a change touches admin flow, verify bad auth stays non-fatal.
