/** Day 1: minimal face params. Days 2–4 expand looks, hair, prompt, save. */

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
};

export const FACE_DEFAULTS: FaceParams = {
  width: 1,
  length: 1,
  jaw: 0.9,
  cheek: 0.45,
  chin: 1,
  noseLen: 1,
  noseWidth: 1,
  eyeSize: 1,
  eyeGap: 1,
  brow: 0.45,
  lip: 0.55,
  skin: 0.38,
};

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
  let x = nx * p.width;
  let y = ny * p.length;
  let z = nz * 0.9;

  const jaw = Math.max(0, Math.min(1, (0.12 - ny) / 0.62));
  x *= 1 - jaw * (1 - p.jaw) * 0.42;
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

export function skinColor(tone: number): string {
  const t = Math.min(1, Math.max(0, tone));
  const stops = [
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
