# Nocturne — 5-day rebuild plan

Target repo: `davealone69-gif/Nocturne`  
Window: daily automation through **2026-11-07** (Australia/Perth).

## Product

18+ after-dark lounge + Faces studio.

- Age gate (DOB, 18+)
- Lounge: edition of the day, compose night (hour / mood / spirit), rooms, saved nights (localStorage)
- Faces: 3D sculpt (three.js), Female / Male / Cyborg / Vampire, hair style & colour, facial hair, eyes, shape sliders, text prompt, save faces, optional photoreal portrait (xAI image API, user-initiated)

Stack: TanStack Start, React, Tailwind, three.js.

## Day slices

### Day 1 — Scaffold
- `package.json`, Vite/TanStack Start wiring, `src/router.tsx`, `__root.tsx`, `index` route, styles, README run instructions

### Day 2 — Lounge
- `catalog` (drinks, rooms, editions, composeNight)
- Zustand store + age gate shell
- Home UI: edition, chips, composed drink, rooms list

### Day 3 — Faces core
- `/faces` route
- `face` params + sculpt math
- `FaceStage` three.js head, drag rotate

### Day 4 — Faces options
- Presentation / hair / facial hair / eyes
- Prompt apply + generate/reset
- Save/load faces (localStorage)
- Photoreal server fn (graceful if no credits)

### Day 5 — Polish
- README, copy, mobile layout pass
- STATUS.md final report
- Stop feature work after 2026-11-07

## Status

See `STATUS.md` (automation updates each run).
