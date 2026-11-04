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
  import.meta.env.VITE_FREELLMAPI_IMAGE_MODEL ||
  "@cf/black-forest-labs/flux-1-schnell";

/**
 * In dev, Vite proxies `/freellm` → FreeLLMAPI (localhost:3001).
 * Override with VITE_FREELLMAPI_BASE for a remote router.
 */
export function freellmBase(): string {
  const fromEnv = import.meta.env.VITE_FREELLMAPI_BASE as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/$/, "");
  return "/freellm/v1";
}

export function freellmKey(): string {
  return (import.meta.env.VITE_FREELLMAPI_KEY as string | undefined)?.trim() || "";
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

export async function renderPortrait(
  params: FaceParams,
  userPrompt: string,
): Promise<PortraitResult> {
  const key = freellmKey();
  if (!key) {
    throw new Error(
      "Set VITE_FREELLMAPI_KEY in .env (unified key from FreeLLMAPI dashboard). See .env.example.",
    );
  }

  const model = DEFAULT_IMAGE_MODEL;
  const prompt = portraitBrief(params, userPrompt);
  const base = freellmBase();
  const url = `${base}/images/generations`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  });

  const text = await response.text();
  let body: {
    data?: { url?: string; b64_json?: string }[];
    error?: { message?: string } | string;
    message?: string;
  } = {};
  try {
    body = JSON.parse(text) as typeof body;
  } catch {
    /* non-json */
  }

  if (!response.ok) {
    const msg =
      (typeof body.error === "object" && body.error?.message) ||
      (typeof body.error === "string" && body.error) ||
      body.message ||
      text.slice(0, 200) ||
      `HTTP ${response.status}`;
    if (response.status === 401 || response.status === 403) {
      throw new Error(`FreeLLMAPI auth failed: ${msg}`);
    }
    if (response.status === 429) {
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
