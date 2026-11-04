export type Presentation = "female" | "male" | "cyborg" | "vampire";
export type HairStyle = "bald" | "buzz" | "crop" | "side" | "waves" | "long" | "bun" | "mohawk";
export type HairColor = "black" | "brown" | "auburn" | "blonde" | "red" | "silver" | "white" | "blue";
export type FacialHair = "none" | "stubble" | "mustache" | "goatee" | "beard";
export type EyeColor = "brown" | "hazel" | "green" | "blue" | "grey" | "amber" | "red";

export type FaceParams = {
  width: number;
  length: number;
  jaw: number;
  cheek: number;
  chin: number;
  noseLen: number;
  noseWidth: number;
  eyeSize: number;
  eyeGap: number;
  brow: number;
  lip: number;
  skin: number;
  presentation: Presentation;
  hairStyle: HairStyle;
  hairColor: HairColor;
  facialHair: FacialHair;
  eyeColor: EyeColor;
};

export const PRESENTATIONS: { id: Presentation; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "cyborg", label: "Cyborg" },
  { id: "vampire", label: "Vampire" },
];

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "bald", label: "Bald" },
  { id: "buzz", label: "Buzz" },
  { id: "crop", label: "Crop" },
  { id: "side", label: "Side part" },
  { id: "waves", label: "Waves" },
  { id: "long", label: "Long" },
  { id: "bun", label: "Bun" },
  { id: "mohawk", label: "Mohawk" },
];

export const HAIR_COLORS: { id: HairColor; label: string; hex: string }[] = [
  { id: "black", label: "Black", hex: "#1a1412" },
  { id: "brown", label: "Brown", hex: "#4a2e22" },
  { id: "auburn", label: "Auburn", hex: "#7a3b24" },
  { id: "blonde", label: "Blonde", hex: "#c6a15a" },
  { id: "red", label: "Red", hex: "#8f2d22" },
  { id: "silver", label: "Silver", hex: "#b9b6b0" },
  { id: "white", label: "White", hex: "#efeae2" },
  { id: "blue", label: "Blue", hex: "#243a62" },
];

export const FACIAL_HAIR: { id: FacialHair; label: string }[] = [
  { id: "none", label: "Clean" },
  { id: "stubble", label: "Stubble" },
  { id: "mustache", label: "Mustache" },
  { id: "goatee", label: "Goatee" },
  { id: "beard", label: "Beard" },
];

export const EYE_COLORS: { id: EyeColor; label: string; hex: string }[] = [
  { id: "brown", label: "Brown", hex: "#3a2418" },
  { id: "hazel", label: "Hazel", hex: "#6b5428" },
  { id: "green", label: "Green", hex: "#3d6b45" },
  { id: "blue", label: "Blue", hex: "#3d6e92" },
  { id: "grey", label: "Grey", hex: "#7d838a" },
  { id: "amber", label: "Amber", hex: "#b86a1a" },
  { id: "red", label: "Red", hex: "#8c1c22" },
];

export const FACE_DEFAULTS: FaceParams = {
  width: 1,
  length: 1,
  jaw: 0.86,
  cheek: 0.55,
  chin: 1,
  noseLen: 1,
  noseWidth: 1,
  eyeSize: 1,
  eyeGap: 1,
  brow: 0.4,
  lip: 0.62,
  skin: 0.35,
  presentation: "female",
  hairStyle: "waves",
  hairColor: "brown",
  facialHair: "none",
  eyeColor: "brown",
};

export const SLIDERS: { key: NumericKey; label: string; min: number; max: number }[] = [
  { key: "width", label: "Width", min: 0.8, max: 1.25 },
  { key: "length", label: "Length", min: 0.85, max: 1.2 },
  { key: "jaw", label: "Jaw", min: 0.65, max: 1.2 },
  { key: "cheek", label: "Cheeks", min: 0, max: 1 },
  { key: "chin", label: "Chin", min: 0.75, max: 1.3 },
  { key: "noseLen", label: "Nose", min: 0.55, max: 1.45 },
  { key: "noseWidth", label: "Nose width", min: 0.55, max: 1.5 },
  { key: "eyeSize", label: "Eyes", min: 0.65, max: 1.35 },
  { key: "eyeGap", label: "Eye spacing", min: 0.75, max: 1.3 },
  { key: "brow", label: "Brow", min: 0, max: 1 },
  { key: "lip", label: "Lips", min: 0.15, max: 1.1 },
  { key: "skin", label: "Skin", min: 0, max: 1 },
];

type NumericKey = {
  [K in keyof FaceParams]: FaceParams[K] extends number ? K : never;
}[keyof FaceParams];

const PRESENTATION_IDS = PRESENTATIONS.map((item) => item.id);
const HAIR_STYLE_IDS = HAIR_STYLES.map((item) => item.id);
const HAIR_COLOR_IDS = HAIR_COLORS.map((item) => item.id);
const FACIAL_IDS = FACIAL_HAIR.map((item) => item.id);
const EYE_IDS = EYE_COLORS.map((item) => item.id);

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function pick<T>(items: readonly T[], n: number): T {
  return items[Math.min(items.length - 1, Math.floor(n * items.length))]!;
}

export function paramsFromSeed(seed: number): FaceParams {
  const r = (i: number) => hash(seed * 17.17 + i * 9.13);
  const presentation = pick(PRESENTATION_IDS, r(13));
  const base: FaceParams = {
    width: 0.86 + r(1) * 0.3,
    length: 0.9 + r(2) * 0.24,
    jaw: 0.7 + r(3) * 0.48,
    cheek: 0.12 + r(4) * 0.75,
    chin: 0.82 + r(5) * 0.42,
    noseLen: 0.65 + r(6) * 0.7,
    noseWidth: 0.65 + r(7) * 0.75,
    eyeSize: 0.72 + r(8) * 0.55,
    eyeGap: 0.82 + r(9) * 0.4,
    brow: 0.15 + r(10) * 0.85,
    lip: 0.28 + r(11) * 0.75,
    skin: r(12),
    presentation,
    hairStyle: pick(HAIR_STYLE_IDS, r(14)),
    hairColor: pick(HAIR_COLOR_IDS, r(15)),
    facialHair: presentation === "female" ? "none" : pick(FACIAL_IDS, r(16)),
    eyeColor: presentation === "vampire" ? "red" : pick(EYE_IDS, r(17)),
  };
  return withPresentation(base, presentation);
}

export function withPresentation(current: FaceParams, presentation: Presentation): FaceParams {
  const next: FaceParams = { ...current, presentation };
  if (presentation === "female") {
    next.jaw = 0.78;
    next.lip = 0.74;
    next.cheek = 0.64;
    next.brow = 0.28;
    next.facialHair = "none";
    if (next.hairStyle === "bald" || next.hairStyle === "buzz" || next.hairStyle === "mohawk") {
      next.hairStyle = "waves";
    }
  } else if (presentation === "male") {
    next.jaw = 1.06;
    next.brow = 0.72;
    next.lip = 0.4;
    next.cheek = 0.32;
    if (next.hairStyle === "bun" || next.hairStyle === "long") next.hairStyle = "crop";
  } else if (presentation === "vampire") {
    next.skin = Math.min(next.skin, 0.16);
    next.jaw = 0.9;
    next.cheek = 0.28;
    next.brow = 0.62;
    next.lip = 0.58;
    next.eyeColor = "red";
    if (next.hairColor === "blonde" || next.hairColor === "blue") next.hairColor = "black";
  } else {
    next.jaw = 0.98;
    next.brow = 0.55;
    next.eyeColor = "blue";
    if (next.hairStyle === "long" || next.hairStyle === "waves") next.hairStyle = "side";
  }
  return next;
}

function gauss(value: number, center: number, spread: number) {
  const d = (value - center) / spread;
  return Math.exp(-d * d);
}

export function sculptPoint(
  nx: number,
  ny: number,
  nz: number,
  p: FaceParams,
): [number, number, number] {
  const front = Math.max(0, nz);
  const feminine = p.presentation === "female" ? 1 : p.presentation === "vampire" ? 0.35 : 0;
  const masculine = p.presentation === "male" ? 1 : p.presentation === "cyborg" ? 0.45 : 0;
  let x = nx * p.width * (1 - feminine * 0.04 + masculine * 0.03);
  let y = ny * p.length;
  let z = nz * 0.9;

  const jaw = Math.max(0, Math.min(1, (0.12 - ny) / 0.62));
  const jawScale = p.jaw * (1 - feminine * 0.08 + masculine * 0.06);
  x *= 1 - jaw * (1 - jawScale) * 0.42;
  y -= jaw * (p.chin - 1) * 0.18;
  z *= 1 - jaw * 0.08;

  const cheek = gauss(ny, 0.02, 0.28) * gauss(Math.abs(nx), 0.38, 0.22);
  x += Math.sign(nx || 1) * cheek * p.cheek * 0.1;
  z += cheek * p.cheek * 0.05 * front;

  const nose = gauss(nx, 0, 0.11 * p.noseWidth) * gauss(ny, 0.02, 0.16 * p.noseLen);
  z += nose * front * 0.28 * p.noseLen;
  const tip = gauss(nx, 0, 0.07) * gauss(ny, -0.08, 0.07);
  z += tip * front * 0.08 * p.noseLen;

  const gap = 0.18 * p.eyeGap;
  const socket = (cx: number) =>
    gauss(nx, cx, 0.09 * p.eyeSize) * gauss(ny, 0.14, 0.07 * p.eyeSize);
  z -= (socket(-gap) + socket(gap)) * front * 0.18;

  const brow = gauss(ny, 0.26, 0.06) * gauss(nx, 0, 0.42);
  z += brow * p.brow * 0.07 * front;
  y += brow * p.brow * 0.02;

  const mouth = gauss(nx, 0, 0.16) * gauss(ny, -0.32, 0.045);
  z -= mouth * front * 0.055;
  const upper = gauss(nx, 0, 0.14) * gauss(ny, -0.28, 0.035);
  const lower = gauss(nx, 0, 0.13) * gauss(ny, -0.37, 0.04);
  z += (upper * 0.85 + lower) * p.lip * 0.055 * front;

  const ear = gauss(Math.abs(nx), 0.96, 0.12) * gauss(ny, 0.02, 0.22) * Math.max(0, 0.35 - nz);
  x += Math.sign(nx || 1) * ear * 0.16;

  const cranium = Math.max(0, ny);
  y += cranium * cranium * 0.06;
  x *= 1 - cranium * 0.04;

  return [x, y, z];
}

export function skinColor(tone: number, presentation: Presentation = "female"): string {
  const t = Math.min(1, Math.max(0, tone));
  const stops =
    presentation === "vampire"
      ? [
          [236, 226, 224],
          [214, 196, 196],
          [186, 166, 168],
        ]
      : presentation === "cyborg"
        ? [
            [214, 206, 198],
            [168, 156, 146],
            [112, 104, 98],
            [72, 68, 66],
          ]
        : [
            [232, 206, 186],
            [214, 170, 138],
            [176, 122, 86],
            [120, 78, 52],
            [74, 48, 36],
          ];
  const scaled = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(scaled));
  const f = scaled - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  const mix = a.map((channel, index) => Math.round(channel + (b[index]! - channel) * f));
  return `rgb(${mix[0]} ${mix[1]} ${mix[2]})`;
}

export function hairHex(color: HairColor) {
  return HAIR_COLORS.find((item) => item.id === color)?.hex ?? "#1a1412";
}

export function eyeHex(color: EyeColor) {
  return EYE_COLORS.find((item) => item.id === color)?.hex ?? "#3a2418";
}

const BLOCKED = /\b(nude|naked|sex|porn|xxx|nsfw|child|teen|loli|underage|minor)\b/gi;

export function applyPrompt(text: string, base: FaceParams): FaceParams {
  const t = text.toLowerCase();
  let next: FaceParams = { ...base };
  if (/\bvampire|vampiress|\bfangs?\b/.test(t)) next = withPresentation(next, "vampire");
  else if (/\bcyborg|android|\brobot\b/.test(t)) next = withPresentation(next, "cyborg");
  else if (/\bwoman|\bfemale|feminine|lady\b/.test(t)) next = withPresentation(next, "female");
  else if (/\bman\b|\bmale|masculine|gentleman\b/.test(t)) next = withPresentation(next, "male");

  if (/\bbald\b/.test(t)) next.hairStyle = "bald";
  else if (/\bbuzz\b/.test(t)) next.hairStyle = "buzz";
  else if (/\bmohawk\b/.test(t)) next.hairStyle = "mohawk";
  else if (/\bbun\b/.test(t)) next.hairStyle = "bun";
  else if (/\blong\b/.test(t)) next.hairStyle = "long";
  else if (/\bwaves\b|\bwavy\b/.test(t)) next.hairStyle = "waves";
  else if (/\bside part\b|\bside\b/.test(t)) next.hairStyle = "side";
  else if (/\bcrop\b/.test(t)) next.hairStyle = "crop";

  if (/\bblonde|blond\b/.test(t)) next.hairColor = "blonde";
  else if (/\bauburn\b/.test(t)) next.hairColor = "auburn";
  else if (/\bred hair|ginger|redhead\b/.test(t)) next.hairColor = "red";
  else if (/\bsilver|grey hair|gray hair\b/.test(t)) next.hairColor = "silver";
  else if (/\bwhite hair\b/.test(t)) next.hairColor = "white";
  else if (/\bblue hair\b/.test(t)) next.hairColor = "blue";
  else if (/\bblack hair\b/.test(t)) next.hairColor = "black";
  else if (/\bbrown hair\b/.test(t)) next.hairColor = "brown";

  if (/\bclean shaven|clean-shaven|no beard\b/.test(t)) next.facialHair = "none";
  else if (/\bstubble\b/.test(t)) next.facialHair = "stubble";
  else if (/\bmustache|moustache\b/.test(t)) next.facialHair = "mustache";
  else if (/\bgoatee\b/.test(t)) next.facialHair = "goatee";
  else if (/\bbeard\b/.test(t)) next.facialHair = "beard";

  if (/\bbrown eyes\b/.test(t)) next.eyeColor = "brown";
  else if (/\bhazel\b/.test(t)) next.eyeColor = "hazel";
  else if (/\bgreen eyes\b/.test(t)) next.eyeColor = "green";
  else if (/\bblue eyes\b/.test(t)) next.eyeColor = "blue";
  else if (/\bgrey eyes|gray eyes\b/.test(t)) next.eyeColor = "grey";
  else if (/\bamber eyes\b/.test(t)) next.eyeColor = "amber";
  else if (/\bred eyes\b/.test(t)) next.eyeColor = "red";

  if (/\bpale\b/.test(t)) next.skin = 0.08;
  else if (/\btan\b/.test(t)) next.skin = 0.45;
  else if (/\bdark skin\b/.test(t)) next.skin = 0.82;

  return next;
}

export type SavedFace = {
  id: string;
  name: string;
  params: FaceParams;
  prompt: string;
  at: number;
};

const FACE_KEY = "nocturne.faces.v1";

export function loadFaces(): SavedFace[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(FACE_KEY) || "[]") as SavedFace[];
    return Array.isArray(raw) ? raw.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function storeFaces(faces: SavedFace[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FACE_KEY, JSON.stringify(faces.slice(0, 8)));
}

export function cleanPromptNote(note: string) {
  return note.replace(BLOCKED, "").replace(/\s+/g, " ").trim().slice(0, 240);
}
