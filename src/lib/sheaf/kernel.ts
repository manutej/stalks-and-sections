import { dirichletEnergy } from "./energy";
import { axpy, dot, nrm2, solve, zeros, zeros2 } from "./linear";
import { makePair } from "./maps";
import { LAYER_Z } from "./layout";
import type { SheafEdge, SheafNode, Vec3 } from "./types";

export type KernelReport = {
  h0: number;
  h0Capped: boolean;
  h1: number | null;
  chi: number;
  energy: number;
  radius: number;
  unique: boolean | null;
  vDim: number;
  eDim: number;
  pinned: number;
};

export type HoldoutReport = {
  n: number;
  sheafCos: number;
  graphCos: number;
  neighborCos: number;
  sheafMse: number;
  graphMse: number;
  beatGraph: boolean;
};

function pack(nodes: SheafNode[]): number[] {
  const x: number[] = [];
  for (const n of nodes) {
    for (let i = 0; i < n.dim; i++) x.push(n.section[i] ?? 0);
  }
  return x;
}

function unpackInto(nodes: SheafNode[], x: number[]): void {
  let o = 0;
  for (const n of nodes) {
    for (let i = 0; i < n.dim; i++) n.section[i] = x[o++] ?? 0;
  }
}

function applyLf(nodes: SheafNode[], edges: SheafEdge[], x: number[]): number[] {
  const sec = new Map<string, number[]>();
  let o = 0;
  for (const n of nodes) {
    sec.set(n.id, x.slice(o, o + n.dim));
    o += n.dim;
  }
  const g = new Map(nodes.map((n) => [n.id, zeros(n.dim)]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) continue;
    const xs = sec.get(e.source)!;
    const xt = sec.get(e.target)!;
    const d = zeros(e.edgeDim);
    for (let i = 0; i < e.edgeDim; i++) {
      const rs = e.Fsrc[i] ?? [];
      const rt = e.Ftgt[i] ?? [];
      let hs = 0;
      let ht = 0;
      for (let j = 0; j < rs.length; j++) hs += (rs[j] ?? 0) * (xs[j] ?? 0);
      for (let j = 0; j < rt.length; j++) ht += (rt[j] ?? 0) * (xt[j] ?? 0);
      d[i] = hs - ht + (e.translation[i] ?? 0);
    }
    const gs = g.get(e.source)!;
    const gt = g.get(e.target)!;
    for (let i = 0; i < e.Fsrc.length; i++) {
      const row = e.Fsrc[i]!;
      const di = d[i] ?? 0;
      for (let j = 0; j < row.length; j++) gs[j]! += row[j]! * di;
    }
    for (let i = 0; i < e.Ftgt.length; i++) {
      const row = e.Ftgt[i]!;
      const di = d[i] ?? 0;
      for (let j = 0; j < row.length; j++) gt[j]! -= row[j]! * di;
    }
  }
  const out: number[] = [];
  for (const n of nodes) out.push(...(g.get(n.id) ?? zeros(n.dim)));
  return out;
}

function lambdaMax(nodes: SheafNode[], edges: SheafEdge[], iters = 20): number {
  const N = nodes.reduce((s, n) => s + n.dim, 0);
  if (N === 0) return 1;
  let x = Array.from({ length: N }, (_, i) => Math.sin(1 + i * 1.7));
  let nrm = nrm2(x) || 1;
  for (let i = 0; i < x.length; i++) x[i]! /= nrm;
  let lam = 1;
  for (let k = 0; k < iters; k++) {
    const y = applyLf(nodes, edges, x);
    lam = Math.abs(dot(x, y));
    nrm = nrm2(y) || 1;
    x = y.map((v) => v / nrm);
  }
  return Math.max(lam, 1e-6);
}

/** Heat-kernel rank heuristic for dim ker L_F. Caps at `samples`. */
export function estimateH0(
  nodes: SheafNode[],
  edges: SheafEdge[],
  samples = 12,
  iters = 36,
  freezeIds?: Set<string>,
): number {
  const N = nodes.reduce((s, n) => s + n.dim, 0);
  if (N === 0) return 0;
  const offsets: number[] = [];
  let o = 0;
  for (const n of nodes) {
    offsets.push(o);
    o += n.dim;
  }
  const freeze = new Set<number>();
  if (freezeIds) {
    nodes.forEach((n, i) => {
      if (!freezeIds.has(n.id)) return;
      const off = offsets[i]!;
      for (let k = 0; k < n.dim; k++) freeze.add(off + k);
    });
  }
  const lam = lambdaMax(nodes, edges, 16);
  const h = 0.85 / lam;
  const basis: number[][] = [];
  for (let s = 0; s < samples; s++) {
    let x = Array.from({ length: N }, (_, i) => Math.sin((s + 1) * 2.3 + i * 0.41));
    for (const i of freeze) x[i] = 0;
    for (let it = 0; it < iters; it++) {
      const Lx = applyLf(nodes, edges, x);
      for (let i = 0; i < N; i++) {
        if (freeze.has(i)) {
          x[i] = 0;
          continue;
        }
        x[i]! -= h * (Lx[i] ?? 0);
      }
    }
    for (const b of basis) axpy(x, -dot(x, b), b);
    for (const i of freeze) x[i] = 0;
    const n = nrm2(x);
    if (n < 1e-4) continue;
    basis.push(x.map((v) => v / n));
  }
  return basis.length;
}

export function eulerCharacteristic(nodes: SheafNode[], edges: SheafEdge[]): {
  chi: number;
  vDim: number;
  eDim: number;
} {
  const vDim = nodes.reduce((s, n) => s + n.dim, 0);
  const eDim = edges.reduce((s, e) => s + e.edgeDim, 0);
  return { chi: vDim - eDim, vDim, eDim };
}

export function kernelReport(nodes: SheafNode[], edges: SheafEdge[]): KernelReport {
  const { chi, vDim, eDim } = eulerCharacteristic(nodes, edges);
  const energy = dirichletEnergy(nodes, edges);
  const pinned = new Set(nodes.filter((n) => n.known).map((n) => n.id));
  const samples = 12;
  const h0 = estimateH0(nodes, edges, samples, 36);
  const h0Capped = h0 >= samples;
  const h0b = pinned.size ? estimateH0(nodes, edges, 8, 28, pinned) : h0;
  const h0bCapped = pinned.size ? h0b >= 8 : h0Capped;
  const h1Raw = h0 - chi;
  const h1 = h1Raw >= 0 ? h1Raw : null;
  let unique: boolean | null = null;
  if (pinned.size) {
    if (h0b === 0) unique = true;
    else if (!h0bCapped) unique = false;
  } else if (!h0Capped) {
    unique = h0 <= 1;
  }
  return {
    h0,
    h0Capped,
    h1,
    chi,
    energy,
    radius: eDim ? energy / eDim : energy,
    unique,
    vDim,
    eDim,
    pinned: pinned.size,
  };
}

function cosine(a: number[], b: number[]): number {
  return dot(a, b) / (nrm2(a) * nrm2(b) + 1e-12);
}

function mse(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    s += d * d;
  }
  return n ? s / n : 0;
}

function identityClone(nodes: SheafNode[], edges: SheafEdge[]): SheafEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    const maps = makePair("identity", s?.dim ?? 4, t?.dim ?? 4, `${e.source}|id|${e.target}`);
    return {
      ...e,
      restrictKind: "identity" as const,
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
    };
  });
}

function harmonicExtend(
  nodesIn: SheafNode[],
  edges: SheafEdge[],
  knownIds: Set<string>,
  iters = 64,
): SheafNode[] {
  const nodes = nodesIn.map((n) => ({ ...n, section: n.section.slice() }));
  const lam = lambdaMax(nodes, edges, 14);
  const h = 0.85 / lam;
  for (let it = 0; it < iters; it++) {
    const x = pack(nodes);
    const Lx = applyLf(nodes, edges, x);
    unpackInto(nodes, x.map((v, i) => v - h * (Lx[i] ?? 0)));
    for (const n of nodes) {
      if (!knownIds.has(n.id)) continue;
      const src = nodesIn.find((x) => x.id === n.id);
      if (src) n.section = src.section.slice();
    }
  }
  return nodes;
}

export function pickHoldoutIds(nodes: SheafNode[], edges: SheafEdge[], n = 8): string[] {
  const known = new Set(nodes.filter((nd) => nd.known).map((nd) => nd.id));
  const deg = new Map<string, number>();
  for (const nd of nodes) deg.set(nd.id, 0);
  for (const e of edges) {
    deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
    deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
  }
  return nodes
    .filter((nd) => !known.has(nd.id) && (deg.get(nd.id) ?? 0) >= 2)
    .sort((a, b) => (deg.get(b.id) ?? 0) - (deg.get(a.id) ?? 0) || a.id.localeCompare(b.id))
    .slice(0, n)
    .map((nd) => nd.id);
}

export function holdoutReport(
  nodes: SheafNode[],
  edges: SheafEdge[],
  holdIds?: string[],
): HoldoutReport | null {
  const ids = holdIds ?? pickHoldoutIds(nodes, edges);
  if (ids.length < 3) return null;
  const hold = new Set(ids);
  const truth = new Map(
    nodes.filter((n) => hold.has(n.id)).map((n) => [n.id, n.section.slice()]),
  );
  const masked = nodes.map((n) => ({
    ...n,
    section: hold.has(n.id) ? zeros(n.dim) : n.section.slice(),
  }));
  const knownIds = new Set(nodes.filter((n) => !hold.has(n.id)).map((n) => n.id));
  const sheafN = harmonicExtend(masked, edges, knownIds, 56);
  const graphN = harmonicExtend(masked, identityClone(nodes, edges), knownIds, 56);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nbr = new Map<string, string[]>();
  for (const e of edges) {
    if (!nbr.has(e.source)) nbr.set(e.source, []);
    if (!nbr.has(e.target)) nbr.set(e.target, []);
    nbr.get(e.source)!.push(e.target);
    nbr.get(e.target)!.push(e.source);
  }
  const score = (recon: SheafNode[]) => {
    const rec = new Map(recon.map((n) => [n.id, n.section]));
    let c = 0;
    let m = 0;
    let k = 0;
    for (const [id, t] of truth) {
      const r = rec.get(id);
      if (!r) continue;
      c += cosine(r, t);
      m += mse(r, t);
      k++;
    }
    return { cos: k ? c / k : 0, mse: k ? m / k : 0, n: k };
  };
  let neighborCos = 0;
  let nk = 0;
  for (const id of hold) {
    const n = byId.get(id);
    if (!n) continue;
    const acc = zeros(n.dim);
    let c = 0;
    for (const oid of nbr.get(id) ?? []) {
      if (hold.has(oid)) continue;
      const o = byId.get(oid);
      if (!o) continue;
      for (let i = 0; i < n.dim; i++) acc[i]! += o.section[i] ?? 0;
      c++;
    }
    const pred = c ? acc.map((v) => v / c) : acc;
    neighborCos += cosine(pred, n.section);
    nk++;
  }
  const sh = score(sheafN);
  const gr = score(graphN);
  return {
    n: hold.size,
    sheafCos: sh.cos,
    graphCos: gr.cos,
    neighborCos: nk ? neighborCos / nk : 0,
    sheafMse: sh.mse,
    graphMse: gr.mse,
    beatGraph: sh.cos > gr.cos + 0.01,
  };
}

/**
 * Residual-weighted 1-skeleton Fiedler embedding.
 * y stays pinned to hierarchy. xz come from the two smallest non-constant
 * eigenvectors of L = D − W, W_e = 1/(0.2 + residual).
 * This is NOT the block sheaf Laplacian L_F (~vDim).
 */
export function spectralLayout(
  nodes: SheafNode[],
  edges: SheafEdge[],
): Record<string, Vec3> {
  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const n = nodes.length;
  const W = zeros2(n, n);
  const deg = zeros(n);
  for (const e of edges) {
    const i = idx.get(e.source);
    const j = idx.get(e.target);
    if (i == null || j == null || i === j) continue;
    const w = 1 / (0.2 + e.residual);
    W[i]![j]! += w;
    W[j]![i]! += w;
    deg[i]! += w;
    deg[j]! += w;
  }
  const A = zeros2(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) A[i]![j] = (i === j ? deg[i]! + 1e-4 : 0) - (W[i]![j] ?? 0);
  }
  const ones = Array.from({ length: n }, () => 1 / Math.sqrt(n));
  const inverseIter = (prev?: number[]) => {
    let x =
      prev?.slice() ??
      Array.from({ length: n }, (_, i) => Math.sin(0.7 + i * 1.13));
    axpy(x, -dot(x, ones), ones);
    let nn = nrm2(x) || 1;
    for (let i = 0; i < n; i++) x[i]! /= nn;
    for (let k = 0; k < 18; k++) {
      x = solve(A, x);
      axpy(x, -dot(x, ones), ones);
      if (prev) axpy(x, -dot(x, prev), prev);
      nn = nrm2(x) || 1;
      for (let i = 0; i < n; i++) x[i]! /= nn;
    }
    return x;
  };
  const f1 = inverseIter();
  const f2 = inverseIter(f1);
  let m = 0;
  for (let i = 0; i < n; i++) m = Math.max(m, Math.hypot(f1[i]!, f2[i]!));
  const s = m > 1e-9 ? 11 / m : 1;
  const pos: Record<string, Vec3> = {};
  nodes.forEach((nd, i) => {
    pos[nd.id] = {
      x: f1[i]! * s,
      y: nd.level * LAYER_Z,
      z: f2[i]! * s,
    };
  });
  return pos;
}

export function seriateIds(nodes: SheafNode[], edges: SheafEdge[]): string[] {
  const pos = spectralLayout(nodes, edges);
  return nodes
    .slice()
    .sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      const pa = pos[a.id]!;
      const pb = pos[b.id]!;
      return pa.x - pb.x || pa.z - pb.z || a.id.localeCompare(b.id);
    })
    .map((n) => n.id);
}
