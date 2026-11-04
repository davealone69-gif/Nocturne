# Nocturne — Faces

Free 3D face studio in the browser.

- Looks: Female, Male, Cyborg, Vampire
- Hair style & colour, facial hair, eye colour
- Shape sliders, text prompt, generate / reset
- Save faces on this device
- Drag the head to turn it

## Run

```bash
npm install
npm run dev
```

## Stack

Vite + React 19 + TypeScript + three.js

## Photoreal (FreeLLMAPI)

1. Install and run [FreeLLMAPI](https://freellmapi.co/) (default `http://127.0.0.1:3001`).
2. Add a free image provider key (e.g. Cloudflare Workers AI) in the FreeLLMAPI dashboard.
3. Copy `.env.example` → `.env` and set `VITE_FREELLMAPI_KEY`.
4. `npm run dev` — Photoreal uses the Vite proxy `/freellm` → local router.

Default model: `@cf/black-forest-labs/flux-1-schnell`.

## License

Free to use. No account required.
