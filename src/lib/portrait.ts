import {
  HAIR_COLORS,
  HAIR_STYLES,
  FACIAL_HAIR,
  EYE_COLORS,
  cleanPromptNote,
  type FaceParams,
} from "./face";

/** Default FreeLLMAPI image model (Cloudflare FLUX schnell). */
export const DEFAULT_IMAGE_MODEL =
  (import.meta.env.VITE_FREELLMAPI_IMAGE_MODEL as string | undefined) ||
  "@cf/black-forest-labs/flux-1-schnell";

/**
 * Browser always hits same-origin `/freellm/v1`.
 * Vite (dev/preview) proxies to FreeLLMAPI and injects FREELLMAPI_KEY server-side.
 * Optional VITE_FREELLMAPI_BASE overrides for advanced setups (no key in client).
 */
export function freellmBase(): string {
  const fromEnv = import.meta.env.VITE_FREELLMAPI_BASE as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/$/, "");
  return "/freellm/v1";
}

export function portraitBrief(params: FaceParams, userPrompt: string): string {
  const look =
    params.presentation === "vampire"
      ? "pale gothic vampire adult"
      : params.presentation === "cyborg"
        ? "cybernetic adult human with subtle metal implant"
        : params.presentation === "male"
          ? "adult man"
          : "adult woman";
  const hairStyle =
    HAIR_STYLES.find((item) => item.id === params.hairStyle)?.label.toLowerCase() ?? "hair";
  const hairColor =
    HAIR_COLORS.find((item) => item.id === params.hairColor)?.label.toLowerCase() ?? "dark";
  const eyes =
    EYE_COLORS.find((item) => item.id === params.eyeColor)?.label.toLowerCase() ?? "brown";
  const faceHair =
    params.facialHair === "none"
      ? "clean shaven"
      : (FACIAL_HAIR.find((item) => item.id === params.facialHair)?.label.toLowerCase() ?? "");

  const skin =
    params.presentation === "vampire"
      ? "very pale skin"
      : params.skin < 0.25
        ? "fair skin"
        : params.skin > 0.7
          ? "deep skin tone"
          : "medium skin tone";

  const structure = [
    params.jaw > 1 ? "strong jaw" : params.jaw < 0.8 ? "soft jaw" : null,
    params.cheek > 0.6 ? "full cheeks" : null,
    params.lip > 0.7 ? "full lips" : null,
    params.brow > 0.65 ? "heavy brows" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const note = cleanPromptNote(userPrompt);
  const bits = [
    "Photorealistic head-and-shoulders portrait photograph",
    look,
    `${hairColor} ${hairStyle} hair`,
    `${eyes} eyes`,
    faceHair,
    skin,
    structure,
    note,
    "sharp focus, natural lighting, high detail face, no text, no watermark",
  ].filter(Boolean);

  return bits.join(", ");
}

export type PortraitResult = {
  imageUrl: string;
  model: string;
};

export type PortraitResponseBody = {
  data?: { url?: string; b64_json?: string }[];
  error?: { message?: string } | string;
  message?: string;
};

/** Pure parse + status mapping — unit-tested without network. */
export function parsePortraitResponse(
  status: number,
  text: string,
  model: string,
): PortraitResult {
  let body: PortraitResponseBody = {};
  try {
    body = JSON.parse(text) as PortraitResponseBody;
  } catch {
    /* non-json */
  }

  if (status < 200 || status >= 300) {
    const msg =
      (typeof body.error === "object" && body.error?.message) ||
      (typeof body.error === "string" && body.error) ||
      body.message ||
      text.slice(0, 200) ||
      `HTTP ${status}`;
    if (status === 401 || status === 403) {
      throw new Error(`FreeLLMAPI auth failed: ${msg}`);
    }
    if (status === 429) {
      throw new Error(`FreeLLMAPI rate limit: ${msg}`);
    }
    throw new Error(`Portrait failed: ${msg}`);
  }

  const item = body.data?.[0];
  if (item?.url) return { imageUrl: item.url, model };
  if (item?.b64_json) {
    return { imageUrl: `data:image/png;base64,${item.b64_json}`, model };
  }
  throw new Error("Portrait response had no image data.");
}

export function buildPortraitPayload(params: FaceParams, userPrompt: string, model = DEFAULT_IMAGE_MODEL) {
  return {
    model,
    prompt: portraitBrief(params, userPrompt),
    n: 1,
    size: "1024x1024" as const,
  };
}

const DEFAULT_TIMEOUT_MS = 60_000;

export async function renderPortrait(
  params: FaceParams,
  userPrompt: string,
  options?: { timeoutMs?: number; fetchImpl?: typeof fetch },
): Promise<PortraitResult> {
  const model = DEFAULT_IMAGE_MODEL;
  const payload = buildPortraitPayload(params, userPrompt, model);
  const base = freellmBase();
  const url = `${base}/images/generations`;
  const fetchImpl = options?.fetchImpl ?? fetch;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "POST",
      headers: {
        // Auth is injected by the Vite proxy from FREELLMAPI_KEY (server-only).
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Portrait timed out after ${timeoutMs}ms`);
    }
    const detail = error instanceof Error ? error.message : "unknown";
    // Vite proxy returns Failed to fetch when FreeLLMAPI is down / unreachable.
    if (/failed to fetch|networkerror|econnrefused|load failed/i.test(detail)) {
      throw new Error(
        "Cannot reach FreeLLMAPI. Start it on port 3001, set FREELLMAPI_KEY in .env, then retry.",
      );
    }
    throw new Error(`Portrait network error: ${detail}`);
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  return parsePortraitResponse(response.status, text, model);
}
