# Nocturne — Faces-only rebuild plan

Target repo: `davealone69-gif/Nocturne`

**Skip lounge** (drinks / rooms). Product is a **free 3D face studio**.

## Product

- Home = Faces studio
- Free: no account, no paywall
- 3D head sculpt (three.js), drag to turn
- Looks: Female / Male / Cyborg / Vampire (Day 2+)
- Hair, facial hair, eyes, shape sliders (Day 3+)
- Text prompt, save faces, optional photoreal (Day 4+)

Stack: Vite + React + TypeScript + three.js

## Day slices

### Day 1 — Scaffold + blank face stage ✅
- App shell, dark UI, single home route
- `FaceStage` canvas, basic head mesh, drag rotate
- README how to run

### Day 2 — Sculpt + looks
- Face params UI + live sculpt
- Female / Male / Cyborg / Vampire

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

## Status

See `STATUS.md`.
