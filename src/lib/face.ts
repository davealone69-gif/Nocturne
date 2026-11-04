export type Presentation = "female" | "male" | "cyborg" | "vampire";

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
};

export const PRESENTATIONS: { id: Presentation; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "cyborg", label: "Cyborg" },
  { id: "vampire", label: "Vampire" },
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

export function withPresentation(current: FaceParams, presentation: Presentation): FaceParams {
  const next: FaceParams = { ...current, presentation };
  if (presentation === "female") {
    next.jaw = 0.78;
    next.lip = 0.74;
    next.cheek = 0.64;
    next.brow = 0.28;
  } else if (presentation === "male") {
    next.jaw = 1.06;
    next.brow = 0.72;
    next.lip = 0.4;
    next.cheek = 0.32;
  } else if (presentation === "vampire") {
    next.skin = Math.min(next.skin, 0.16);
    next.jaw = 0.9;
    next.cheek = 0.28;
    next.brow = 0.62;
    next.lip = 0.58;
  } else {
    next.jaw = 0.98;
    next.brow = 0.55;
  }
  return next;
}

function gauss(value: number, center: number, spread: number) {
  const d = (value - center) / spread;
  return Math.exp(-d * d);
}

/** Displace a unit-sphere direction into a head. */
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
  const nostrilL = gauss(nx, -0.06 * p.noseWidth, 0.04) * gauss(ny, -0.06, 0.04);
  const nostrilR = gauss(nx, 0.06 * p.noseWidth, 0.04) * gauss(ny, -0.06, 0.04);
  z -= (nostrilL + nostrilR) * front * 0.04;

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

export function irisColor(presentation: Presentation): string {
  if (presentation === "vampire") return "#8c1c22";
  if (presentation === "cyborg") return "#7ee7ff";
  if (presentation === "male") return "#3a2418";
  return "#3d6e92";
}
