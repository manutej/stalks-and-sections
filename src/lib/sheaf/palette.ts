import type { LevelId, NodeKind, RestrictionKind } from "./types";

export const LEVEL_HEX: Record<LevelId, string> = {
  0: "#4a9a92",
  1: "#6b8ea3",
  2: "#8a9a6e",
  3: "#b08978",
};

export const LEVELS = [
  { id: 0 as const, code: "L0", label: "Foundations", kicker: "Cells & stalks" },
  { id: 1 as const, code: "L1", label: "Sheaf theory", kicker: "Maps & embeddings" },
  { id: 2 as const, code: "L2", label: "Applications", kicker: "Networks & KGE" },
  { id: 3 as const, code: "L3", label: "Viz & integrity", kicker: "Residuals, Bertin" },
];

export const KIND_LABEL: Record<NodeKind, string> = {
  paper: "Paper",
  concept: "Concept",
  algorithm: "Algorithm",
  theorem: "Theorem",
  model: "Model",
  integrity: "Integrity",
};

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
