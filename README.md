# Nocturne — Faces

Free 3D face studio in the browser.

- Looks: Female, Male, Cyborg, Vampire
- Hair style & colour, facial hair, eye colour
- Shape sliders, text prompt, generate / reset
- Save faces on this device
- Photoreal via FreeLLMAPI (local router)

## Run

```bash
npm install
cp .env.example .env   # set FREELLMAPI_KEY (server-side only)
npm run dev
```

## Photoreal (FreeLLMAPI)

Per [FreeLLMAPI REST docs](https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/api/01-rest-api.md):

- `POST /v1/images/generations` with `Authorization: Bearer <unified-key>`
- Enable image models on **Models → Image** (e.g. Cloudflare FLUX)

1. Run FreeLLMAPI on `http://127.0.0.1:3001`.
2. Enable an image model and create a unified key.
3. Put the key in `.env` as **`FREELLMAPI_KEY`** (no `VITE_` prefix).
4. `npm run dev` — proxy `/freellm` injects auth server-side.

Default model: `@cf/black-forest-labs/flux-1-schnell`.

## Security

API keys use `FREELLMAPI_KEY` (server/proxy only). Do **not** use `VITE_FREELLMAPI_KEY`.

## License

Free to use. No account required.
