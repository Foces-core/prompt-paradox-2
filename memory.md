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
- For system-performance posts, use the current Windows snapshot plus built-in `WinSAT` scores as the baseline unless the user supplies a different benchmark.

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
- Admin review queue should always show an explicit loading / empty / hidden state; never a visually blank panel while resolving.
- If a change touches Convex, verify the deployed backend.
- If a change touches puzzle assets, verify exact bytes / rendering.
- If a change touches admin flow, verify bad auth stays non-fatal.
- Level 5 proof is reviewed inside winner selection, not as a separate admin queue; expose chat link, screenshot, and participant metadata only in the finalist detail view.
- Production Convex deployment for the live site is `prod:proper-goshawk-251`; deploy backend changes there after admin-flow edits.
- Reduce Convex contention by keeping answer attempts append-only in `answerAttempts`, making `setEventStarted` idempotent, and catching same-email registration races before they retry the shared participant row.
- Verified the UI responsiveness and auth flow using Playwright responsive spec (42/42 tests passing across desktop/mobile viewports and slower network/motion lanes before deployment).
- For LinkedIn workspace/setup posts, prefer hard numbers from local scans: installed browser/editor/CLI counts, explicit versions, and concrete `settings.json` / `prefs.js` tweaks over generic claims.
- Startup delay decision: `locustfile.py` is a load-test orchestration script, not a Windows app launcher. Windows 11 built-in startup tools can delay individual startup apps or scheduled tasks, but they cannot natively reproduce this script's custom staggered per-step behavior without a wrapper or separate scheduled tasks.
- Native startup conversion decision: replace `C:\Users\sebin\Tools\staggered-startup.ps1` with separate Task Scheduler logon tasks per wave, using minute-granularity delays. Disable the original `StaggeredStartup` task after registering the native replacements.
2026-06-16: Competition integrity decision: keep Level 5 auto-approval unchanged unless user explicitly asks otherwise. Bot protection may use Cloudflare Turnstile via NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY; winner selection must be server-validated.
2026-06-20: Winner selection validity is based on `finishTime` plus all levels completed. Do not require `currentLevel > MAX_LEVEL`; final submissions may leave `currentLevel` at `MAX_LEVEL`.
2026-06-20: Prefer the Rust-based `rtk` wrapper for git inspection commands such as `git diff` when it is available.
2026-06-20: Public site uses `robots.txt` plus Next metadata `noindex`/`nofollow` to discourage crawler indexing. This is not access control; use Cloudflare WAF/Access or an app gate for real competition privacy.
2026-06-20: Player progress restores from Convex participant state keyed by the local `pp_participant_id`. Timer display derives from Convex `startTime`/`finishTime`; do not freeze or stop other players when a winner is selected.
2026-06-20: Timer start is `max(participant.startTime, event.startedAt)` so pre-event registrations do not show multi-day elapsed values. Long elapsed values render as `HH:MM:SS`.
