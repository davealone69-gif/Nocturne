import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const face = readFileSync(join(root, "src/lib/face.ts"), "utf8");
let portrait = readFileSync(join(root, "src/lib/portrait.ts"), "utf8");
portrait = portrait
  .replace(/import\.meta\.env\.VITE_FREELLMAPI_IMAGE_MODEL/g, "undefined")
  .replace(/import\.meta\.env\.VITE_FREELLMAPI_BASE/g, "undefined")
  .replace(/from "\.\/face"/, 'from "./face-shim.ts"');

const outDir = join(root, ".test-shims");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "face-shim.ts"), face);
writeFileSync(join(outDir, "portrait-shim.ts"), portrait);

const { buildPortraitPayload, parsePortraitResponse, portraitBrief, renderPortrait } = await import(
  pathToFileURL(join(outDir, "portrait-shim.ts")).href
);
const { FACE_DEFAULTS } = await import(pathToFileURL(join(outDir, "face-shim.ts")).href);

let passed = 0;
let failed = 0;
async function ok(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log("ok -", name);
  } catch (err) {
    failed += 1;
    console.error("not ok -", name);
    console.error("  ", err?.message || err);
  }
}

await ok("portraitBrief vampire", () => {
  const brief = portraitBrief(
    { ...FACE_DEFAULTS, presentation: "vampire", eyeColor: "red", hairColor: "black" },
    "long hair",
  );
  if (!/vampire/i.test(brief)) throw new Error("missing vampire");
  if (!/red eyes/i.test(brief)) throw new Error("missing red eyes");
});

await ok("payload shape", () => {
  const payload = buildPortraitPayload(FACE_DEFAULTS, "test");
  if (payload.n !== 1 || payload.size !== "1024x1024") throw new Error("bad shape");
  if (!/flux/i.test(payload.model)) throw new Error("model not flux");
  if (payload.prompt.length < 20) throw new Error("prompt too short");
});

await ok("success url", () => {
  const r = parsePortraitResponse(
    200,
    JSON.stringify({ data: [{ url: "https://example.com/a.png" }] }),
    "flux",
  );
  if (r.imageUrl !== "https://example.com/a.png") throw new Error("url mismatch");
});

await ok("success b64", () => {
  const r = parsePortraitResponse(
    200,
    JSON.stringify({ data: [{ b64_json: "abc" }] }),
    "flux",
  );
  if (r.imageUrl !== "data:image/png;base64,abc") throw new Error("b64 mismatch");
});

await ok("auth 401", () => {
  try {
    parsePortraitResponse(401, JSON.stringify({ error: { message: "bad key" } }), "flux");
    throw new Error("expected throw");
  } catch (e) {
    if (!/auth failed/i.test(String(e.message))) throw e;
  }
});

await ok("provider 502", () => {
  try {
    parsePortraitResponse(502, JSON.stringify({ error: { message: "up" } }), "flux");
    throw new Error("expected throw");
  } catch (e) {
    if (!/Portrait failed/i.test(String(e.message))) throw e;
  }
});

await ok("malformed", () => {
  try {
    parsePortraitResponse(200, JSON.stringify({ data: [] }), "flux");
    throw new Error("expected throw");
  } catch (e) {
    if (!/no image data/i.test(String(e.message))) throw e;
  }
});

await ok("render success no client auth", async () => {
  let init;
  const fetchImpl = async (_u, requestInit) => {
    init = requestInit;
    return new Response(JSON.stringify({ data: [{ url: "https://img.test/p.png" }] }), {
      status: 200,
    });
  };
  const r = await renderPortrait(FACE_DEFAULTS, "vampire", { fetchImpl });
  if (r.imageUrl !== "https://img.test/p.png") throw new Error("bad url");
  if (init.headers.Authorization) throw new Error("client must not send Authorization");
});

await ok("timeout", async () => {
  const fetchImpl = (_u, init) =>
    new Promise((_res, reject) => {
      init?.signal?.addEventListener("abort", () => {
        const err = new Error("aborted");
        err.name = "AbortError";
        reject(err);
      });
    });
  try {
    await renderPortrait(FACE_DEFAULTS, "x", { fetchImpl, timeoutMs: 20 });
    throw new Error("expected timeout");
  } catch (e) {
    if (!/timed out/i.test(String(e.message))) throw e;
  }
});

await ok("invalid key via fetch", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: { message: "invalid api key" } }), { status: 401 });
  try {
    await renderPortrait(FACE_DEFAULTS, "x", { fetchImpl });
    throw new Error("expected auth fail");
  } catch (e) {
    if (!/auth failed/i.test(String(e.message))) throw e;
  }
});

await ok("provider failure via fetch", async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify({ error: { message: "503" } }), { status: 503 });
  try {
    await renderPortrait(FACE_DEFAULTS, "x", { fetchImpl });
    throw new Error("expected fail");
  } catch (e) {
    if (!/Portrait failed/i.test(String(e.message))) throw e;
  }
});

await ok("malformed via fetch", async () => {
  const fetchImpl = async () => new Response("{}", { status: 200 });
  try {
    await renderPortrait(FACE_DEFAULTS, "x", { fetchImpl });
    throw new Error("expected fail");
  } catch (e) {
    if (!/no image data/i.test(String(e.message))) throw e;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
