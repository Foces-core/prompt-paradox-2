# Prompt Paradox 2

Local MVP for the Signal Trials puzzle event.

## Run

```bash
sfw pnpm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
sfw pnpm run check
sfw pnpm run build
sfw pnpm run test:all
```

`test:all` runs:

- `test:answers`: accepted/rejected answer variants for every level.
- `test:state`: paused-event behavior, level 5 auto-scoring, final-level bounds, hint idempotency, leaderboard sort.
- `test:ui`: `C:\Users\sebin\buse.bat --pp2-test`, which clicks registration, nav/admin buttons, hint, and all eight level submissions in the browser.

## Current Rules

- Level 1 accepts only the ASCII binary for `Central Processing Unit`; the phrase itself is rejected.
- Level 5 is answer-checked and proceeds without admin approval.
- Admin pause blocks answer submission and resumes without changing progress.
