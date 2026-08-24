import type { RestrictionKind } from "./types";

const LEVEL_PALETTE = ["#4a9a92", "#6b8ea3", "#8a9a6e", "#b08978", "#7a8b9a", "#9a7a8a"];

export function levelHex(level: number): string {
  const i = ((level % LEVEL_PALETTE.length) + LEVEL_PALETTE.length) % LEVEL_PALETTE.length;
  return LEVEL_PALETTE[i]!;
}

/** @deprecated use levelHex — kept so 0–3 lookups stay terse */
export const LEVEL_HEX: Record<number, string> = {
  0: LEVEL_PALETTE[0]!,
  1: LEVEL_PALETTE[1]!,
  2: LEVEL_PALETTE[2]!,
  3: LEVEL_PALETTE[3]!,
};

export const LEVELS = [
  { id: 0, code: "L0", label: "Foundations", kicker: "Cells & stalks" },
  { id: 1, code: "L1", label: "Sheaf theory", kicker: "Maps & embeddings" },
  { id: 2, code: "L2", label: "Applications", kicker: "Networks & KGE" },
  { id: 3, code: "L3", label: "Viz & integrity", kicker: "Residuals, Bertin" },
];

const KIND_LABELS: Record<string, string> = {
  paper: "Paper",
  concept: "Concept",
  algorithm: "Algorithm",
  theorem: "Theorem",
  model: "Model",
  integrity: "Integrity",
  entity: "Entity",
  agent: "Agent",
  channel: "Channel",
  person: "Person",
  software: "Software",
  application: "Application",
  "open-problem": "Open problem",
};

export function kindLabel(kind: string): string {
  if (KIND_LABELS[kind]) return KIND_LABELS[kind];
  return kind.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const KIND_LABEL = KIND_LABELS;

export const RESTRICT_LABEL: Record<RestrictionKind, string> = {
  identity: "Identity",
  projection: "Projection",
  embed: "Embed",
  spectral: "Spectral",
  "type-aware": "Type-aware",
};

export const RES_LO = "#2f8f78";
export const RES_MID = "#c4a574";
export const RES_HI = "#c45c68";

export function residualColor(t: number): string {
  const u = Math.max(0, Math.min(1, t));
  if (u < 0.5) return lerpHex(RES_LO, RES_MID, u * 2);
  return lerpHex(RES_MID, RES_HI, (u - 0.5) * 2);
}

export function residualT(residual: number, lo: number, hi: number): number {
  if (hi <= lo) return 0;
  return Math.max(0, Math.min(1, (residual - lo) / (hi - lo)));
}

function lerpHex(a: string, b: string, t: number): string {
  const A = hexRgb(a);
  const B = hexRgb(b);
  const r = Math.round(A[0] + (B[0] - A[0]) * t);
  const g = Math.round(A[1] + (B[1] - A[1]) * t);
  const bl = Math.round(A[2] + (B[2] - A[2]) * t);
  return `#${[r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function hexRgb(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

export function hexToRgb01(h: string): [number, number, number] {
  const [r, g, b] = hexRgb(h);
  return [r / 255, g / 255, b / 255];
}
