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
- Current public branding is `Overmind`, not `Prompt Paradox`.
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
- Left arrow goes back one level.
- Right arrow submits or advances.
- Back stops at level 1.
- Level 5 should advance to level 6 immediately after successful submit unless admin review logic explicitly blocks it.
- Local UI uses a confirmed-level floor so stale queries do not bounce the user backward.

## Load / Story Decisions
- Loading screen has visible `ADMIN` and `STORY MODE` buttons.
- Story can be reopened from the loading screen when paused.
- Overmind name should be readable and larger in the UI.

## Mobile / Responsive Decisions
- Safe-area padding is required for iPhone top and bottom bars.
- Header/nav should wrap on narrow screens.
- Reduced-motion mode should suppress decorative animation.

## Performance Decisions
- Lazy-load noncritical images.
- Keep heavy animation off reduced-motion paths.
- Avoid unnecessary runtime image services for gameplay assets.

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
- Level 5 copy updated to a constrained prompt: target output `I am a reflection of your own intelligence.` with banned words `reflection`, `your`, `own`, `intelligence`.
- Keep the existing public-link + screenshot submission flow; only the visible level text changed.
- Level progression should be driven by server-returned `nextLevel` values, not a persistent client-side floor. Remove floor bump hacks when they reappear.
- Level 5 is auto-approved on submit; there should be no pending-review waiting state in the normal flow.
- Level 5 completion must use the server-returned `nextLevel` value instead of hardcoding `6`.
- If a change touches Convex, verify the deployed backend.
- If a change touches puzzle assets, verify exact bytes / rendering.
- If a change touches admin flow, verify bad auth stays non-fatal.
