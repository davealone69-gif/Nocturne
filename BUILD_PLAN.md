# Nocturne — Faces-only rebuild plan

Target repo: `davealone69-gif/Nocturne`  
Pivot (2026-11-02): **skip lounge / drinks / rooms**. Product is a **3D face studio** only.

## Product

- Home = Faces studio (no cocktail lounge)
- Optional light 18+ notice only if needed; no full lounge age-gate flow
- 3D head sculpt (three.js), drag to turn
- Looks: Female / Male / Cyborg / Vampire
- Hair style & colour, facial hair, eye colour, shape sliders
- Text prompt → apply
- Generate / reset
- Save / load / delete faces (localStorage)
- Optional photoreal portrait (xAI image API, user-initiated; graceful if no credits)
- Later: upload image as starting idea

Stack: Vite + React (or TanStack Start if scaffolding is easy), Tailwind, three.js.

## Day slices

### Day 1 — Scaffold + blank face stage
- App shell, dark UI, single home route
- `FaceStage` canvas, basic head mesh, drag rotate
- README how to run

### Day 2 — Sculpt + looks
- Face params + sculpt math
- Female / Male / Cyborg / Vampire
- Shape sliders live-update the mesh

### Day 3 — Hair, facial hair, eyes
- Hair styles & colours
- Facial hair options
- Eye colours (incl. red for vampire)

### Day 4 — Prompt + save + photoreal
- Text prompt apply
- Generate / reset
- Save/load faces
- Photoreal button (fail soft if no credits)

### Day 5 — Polish
- Mobile layout, copy, README
- Upload idea (if time)
- STATUS.md final report

## Status

See `STATUS.md`.
