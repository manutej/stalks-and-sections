/** Self-contained sheaf algebra for the generator CLI. Keep in sync with src/lib/sheaf. */

export function zeros(n) {
  return Array.from({ length: n }, () => 0);
}
export function zeros2(r, c) {
  return Array.from({ length: r }, () => zeros(c));
}
export function dot(a, b) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] ?? 0) * (b[i] ?? 0);
  return s;
}
export function nrm2(a) {
  return Math.sqrt(dot(a, a));
}
export function axpy(y, a, x) {
  const n = Math.min(y.length, x.length);
  for (let i = 0; i < n; i++) y[i] += a * x[i];
}
export function matVec(M, x) {
  const out = zeros(M.length);
  for (let i = 0; i < M.length; i++) {
    const row = M[i];
    let s = 0;
    const n = Math.min(row.length, x.length);
    for (let j = 0; j < n; j++) s += row[j] * x[j];
    out[i] = s;
  }
  return out;
}
export function sub(a, b) {
  const n = Math.max(a.length, b.length);
  const o = zeros(n);
  for (let i = 0; i < n; i++) o[i] = (a[i] ?? 0) - (b[i] ?? 0);
  return o;
}
export function projector(outDim, inDim) {
  const M = zeros2(outDim, inDim);
  const k = Math.min(outDim, inDim);
  for (let i = 0; i < k; i++) M[i][i] = 1;
  return M;
}
export function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function gaussian(rng) {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
export function spectralMap(outDim, inDim, rng) {
  const M = zeros2(outDim, inDim);
  for (let i = 0; i < outDim; i++) {
    for (let j = 0; j < inDim; j++) M[i][j] = rng() * 2 - 1;
    const row = M[i];
    for (let k = 0; k < i; k++) axpy(row, -dot(row, M[k]), M[k]);
    const n = nrm2(row) || 1;
    for (let j = 0; j < inDim; j++) row[j] /= n;
  }
  return M;
}
export function typeAwareMap(outDim, inDim, rng) {
  const M = zeros2(outDim, inDim);
  const k = Math.min(outDim, inDim);
  for (let i = 0; i < k; i++) {
    const j = Math.min(inDim - 1, Math.floor(rng() * inDim));
    M[i][j] = rng() > 0.5 ? 1 : -1;
    if (rng() > 0.55 && j + 1 < inDim) M[i][j + 1] = 0.35 * (rng() * 2 - 1);
  }
  return M;
}

export const RESTRICT_KINDS = ["identity", "projection", "embed", "spectral", "type-aware"];

export function edgeDimFor(kind, srcDim, tgtDim) {
  switch (kind) {
    case "identity":
      return Math.min(srcDim, tgtDim);
    case "projection":
      return Math.max(2, Math.min(srcDim, tgtDim, 6));
    case "embed":
      return Math.max(srcDim, tgtDim);
    case "spectral":
      return Math.max(2, Math.min(srcDim, tgtDim));
    case "type-aware":
      return Math.max(2, Math.ceil((srcDim + tgtDim) / 3));
    default:
      return Math.min(srcDim, tgtDim);
  }
}

export function makePair(kind, srcDim, tgtDim, seed) {
  const rng = mulberry32(hashSeed(seed));
  const edgeDim = edgeDimFor(kind, srcDim, tgtDim);
  let Fsrc;
  let Ftgt;
  switch (kind) {
    case "embed":
      Fsrc = projector(edgeDim, srcDim);
      Ftgt = projector(edgeDim, tgtDim);
      break;
    case "spectral":
      Fsrc = spectralMap(edgeDim, srcDim, rng);
      Ftgt = spectralMap(edgeDim, tgtDim, rng);
      break;
    case "type-aware":
      Fsrc = typeAwareMap(edgeDim, srcDim, rng);
      Ftgt = typeAwareMap(edgeDim, tgtDim, rng);
      break;
    default:
      Fsrc = projector(edgeDim, srcDim);
      Ftgt = projector(edgeDim, tgtDim);
  }
  return { edgeDim, Fsrc, Ftgt };
}

export function kindForRelation(rel) {
  switch (rel) {
    case "defines":
    case "defined_in":
    case "generalizes":
    case "extends":
    case "capital_of":
    case "located_in":
      return "embed";
    case "is_a":
    case "specializes":
    case "part_of":
    case "expresses":
      return "projection";
    case "uses":
    case "implements":
    case "minimizes":
      return "identity";
    case "proves":
    case "authored":
    case "authored_by":
      return "type-aware";
    default:
      return "spectral";
  }
}

export function coboundary(edge, src, tgt) {
  const d = sub(matVec(edge.Fsrc, src.section), matVec(edge.Ftgt, tgt.section));
  if (edge.translation?.length === d.length) {
    for (let i = 0; i < d.length; i++) d[i] += edge.translation[i];
  }
  return d;
}

export function recomputeResiduals(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) return { ...e, residual: Number.POSITIVE_INFINITY };
    return { ...e, residual: nrm2(coboundary(e, s, t)) };
  });
}

export function dirichletEnergy(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let tot = 0;
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) continue;
    const d = coboundary(e, s, t);
    tot += d.reduce((a, b) => a + b * b, 0);
  }
  return tot;
}

export function clampDim(n) {
  const d = Math.round(Number(n));
  if (!Number.isFinite(d)) return 4;
  return Math.max(1, Math.min(64, d));
}

export const DIM_FOR_KIND = {
  paper: 8,
  concept: 4,
  theorem: 6,
  algorithm: 5,
  software: 4,
  person: 3,
  agent: 2,
  channel: 1,
  entity: 4,
  model: 6,
  integrity: 4,
  application: 4,
  "open-problem": 3,
};

export const LEVEL_FOR_KIND = {
  concept: 0,
  theorem: 0,
  paper: 1,
  person: 1,
  algorithm: 2,
  software: 2,
  agent: 0,
  channel: 1,
  entity: 1,
  application: 3,
  integrity: 3,
  "open-problem": 3,
  model: 2,
};

export const DEFAULT_LEVELS = [
  { id: 0, code: "L0", label: "Foundations", kicker: "Pinned / primitive", blurb: "Known stalks and primitive types." },
  { id: 1, code: "L1", label: "Structure", kicker: "Types & papers", blurb: "Declared structure that restrictions compare against." },
  { id: 2, code: "L2", label: "Operations", kicker: "Algorithms & models", blurb: "Things that move or embed the stalks." },
  { id: 3, code: "L3", label: "Integrity", kicker: "Applications & checks", blurb: "Where residual is read as a claim." },
];
