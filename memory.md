# Prompt Paradox 2 Memory

## Current architecture

- Public app is a Next.js frontend with Convex as the live backend.
- Stack chosen: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Convex, `lucide-react`, `clsx`.
- Package manager: `pnpm`.
- Public work lives in `C:\Users\sebin\pp2-publish`.
- Main branch is the public branch.

## Deployment model

- Public site is served as a static / hosted frontend.
- Convex holds event state, registration, answers, hints, leaderboard, admin actions, and winner state.
- Current Convex prod deployment:
  - `prod:proper-goshawk-251`
- If backend code changes, deploy Convex before trusting browser results.
- Offline demo copy stays separate from the public repo unless the user asks to merge it back.

## Admin decision

- Admin auth uses `ADMIN_KEY` in Convex when present.
- If env key is missing, demo fallback key is `overmind`.
- Admin input is trimmed before compare.
- Wrong admin key must not crash the UI.
- `getPendingSubmissions` now returns an empty list on bad auth instead of throwing.
- Admin review queue is lazy loaded by button, so the panel stays mounted even before queue fetch.

## Game state decisions

- Story gate comes first.
- Loading gate stays up until admin starts the event.
- Final victory copy is:
  - `OVERMIND has chosen you as its chosen operator`
- Winner reveal stays celebratory around that line.
- If final winner is unresolved, show `You Won` / `OVERMIND is thinking...` style pending state.

## Navigation and controls

- Left arrow maps to back.
- Right arrow maps to submit and advance.
- Enter on already-submitted pages should act like right arrow.
- Story replay has its own button after the game starts.
- Esc bypasses monologue.
- Back button should stop at level 1.

## Level-specific decisions

- Level 1: strict input handling preserved where format matters.
- Level 2: use local PNG asset so steganography data is not destroyed.
- Level 3: QR / card images are generated locally as SVG/data URLs, not fetched from an external image service.
- Level 5: manual review exists in admin panel.
- Level 6: custom puzzle input path exists.
- Level 8: final payload and winner flow live here.

## Asset and CDN decisions

- Do not rely on Cloudinary for puzzle-critical assets.
- Do not rely on external QR or image APIs for gameplay images.
- Use local assets or deterministic client/server generation instead.
- Use CDN/cache tricks only for generic site speed, not for core puzzle correctness.

## Hint and feedback decisions

- Hint reveal state must track the displayed level.
- Hint should stay hidden until the user clicks the button.
- Correct answers should trigger fast, stronger celebration.
- Wrong answers should fail fast but not stall the app.

## Admin / leaderboard / winner decisions

- Leaderboard label is the public-facing name, not grid board.
- Leaderboard must sort live results and show clear rank state.
- Admin can pause / resume the event.
- Admin can select the winning team when ties or final judgment require it.
- Final selection should flow into the winner reveal screen.

## Reliability decisions

- Never let an auth mismatch hard-crash the page.
- Never blank the admin screen just because the queue query failed.
- Trim and sanitize user-facing admin input before compare.
- Keep backend responses deterministic where possible.
- Server / Convex is the source of truth; client code is presentation and interaction only.

## UX decisions

- Terminal theme stays.
- No card-over-card clutter.
- Keep text readable and compact.
- Audio toggle stays off by default.
- Add stronger success feedback and faster state changes, but do not let animation block play.

## Performance decisions

- Local SVG/data-url generation is preferred over remote fetch for puzzle visuals.
- Keep the UI snappy.
- Avoid expensive dependencies on the critical path.
- Use static assets where the puzzle depends on exact bytes.
- Keep no-cost deployment in mind: static frontend where possible, no paid image CDN for puzzle flow.

## Testing decisions

- Validate with:
  - `sfw pnpm run check`
  - `sfw pnpm run build`
  - browser smoke test through the local app
- Verify:
  - registration
  - intro bypass
  - admin panel
  - hint click
  - level navigation
  - final winner reveal

## Known stable strings

- Loading gate: `[LOADING...]`
- Final line:
  - `OVERMIND has chosen you as its chosen operator`
- Demo admin fallback key:
  - `overmind`

## Notes for future edits

- If a change touches Convex, test the live deployment path too.
- If a change touches puzzles, verify the exact asset behavior again.
- If a change touches admin flow, confirm the queue stays non-fatal on bad input.
