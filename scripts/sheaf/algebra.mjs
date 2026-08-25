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
    case "contains":
      return "embed";
    case "is_a":
    case "specializes":
    case "part_of":
    case "expresses":
    case "restricts":
      return "projection";
    case "uses":
    case "implements":
    case "minimizes":
    case "imports":
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
};

export const DEFAULT_LEVELS = [
  { id: 0, code: "L0", label: "Foundations", kicker: "", blurb: "" },
  { id: 1, code: "L1", label: "Sheaf theory", kicker: "", blurb: "" },
  { id: 2, code: "L2", label: "Applications", kicker: "", blurb: "" },
  { id: 3, code: "L3", label: "Integrity", kicker: "", blurb: "" },
];

export function unpack(nodes, x) {
  const map = new Map();
  let o = 0;
  for (const n of nodes) {
    const d = n.dim ?? n.section?.length ?? 0;
    map.set(n.id, x.slice(o, o + d));
    o += d;
  }
  return map;
}

export function pack(nodes, map) {
  const x = [];
  for (const n of nodes) {
    const d = n.dim ?? n.section?.length ?? 0;
    const s = map.get(n.id) || zeros(d);
    for (let i = 0; i < d; i++) x.push(s[i] ?? 0);
  }
  return x;
}

export function applySheafLaplacian(nodes, edges, x) {
  const sec = unpack(nodes, x);
  const g = new Map(nodes.map((n) => [n.id, zeros(n.dim ?? n.section.length)]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t || !e.Fsrc || !e.Ftgt) continue;
    const xs = sec.get(e.source);
    const xt = sec.get(e.target);
    if (!xs || !xt) continue;
    const d = sub(matVec(e.Fsrc, xs), matVec(e.Ftgt, xt));
    const gs = g.get(e.source);
    const gt = g.get(e.target);
    for (let i = 0; i < e.Fsrc.length; i++) {
      const row = e.Fsrc[i];
      for (let j = 0; j < row.length; j++) gs[j] += row[j] * d[i];
    }
    for (let i = 0; i < e.Ftgt.length; i++) {
      const row = e.Ftgt[i];
      for (let j = 0; j < row.length; j++) gt[j] -= row[j] * d[i];
    }
  }
  return pack(nodes, g);
}

export function lambdaMax(nodes, edges, iters = 24) {
  const N = nodes.reduce((s, n) => s + (n.dim ?? n.section.length), 0);
  if (N === 0) return 1;
  let x = Array.from({ length: N }, (_, i) => Math.sin(1 + i * 1.7));
  let n = nrm2(x) || 1;
  for (let i = 0; i < x.length; i++) x[i] /= n;
  let lam = 1;
  for (let k = 0; k < iters; k++) {
    const y = applySheafLaplacian(nodes, edges, x);
    lam = Math.abs(dot(x, y));
    n = nrm2(y) || 1;
    x = y.map((v) => v / n);
  }
  return Math.max(lam, 1e-6);
}

export function estimateH0(nodes, edges, samples = 12, iters = 50) {
  const N = nodes.reduce((s, n) => s + (n.dim ?? n.section.length), 0);
  if (N === 0) return 0;
  const lam = lambdaMax(nodes, edges);
  const h = 0.85 / lam;
  const basis = [];
  for (let s = 0; s < samples; s++) {
    let x = Array.from({ length: N }, (_, i) => Math.sin((s + 1) * 2.3 + i * 0.41));
    for (let it = 0; it < iters; it++) {
      const Lx = applySheafLaplacian(nodes, edges, x);
      for (let i = 0; i < N; i++) x[i] -= h * Lx[i];
    }
    for (const b of basis) axpy(x, -dot(x, b), b);
    const n = nrm2(x);
    if (n < 1e-4) continue;
    basis.push(x.map((v) => v / n));
  }
  return basis.length;
}

export function eulerCharacteristic(nodes, edges) {
  const v = nodes.reduce((s, n) => s + (n.dim ?? n.section.length), 0);
  const e = edges.reduce((s, ed) => s + (ed.edgeDim || ed.Fsrc?.length || 0), 0);
  return v - e;
}

export function cosine(a, b) {
  const n = Math.min(a.length, b.length);
  let dp = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < n; i++) {
    dp += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dp / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

export function mse(a, b) {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    s += d * d;
  }
  return n ? s / n : 0;
}

export function identityEdges(nodes, edges) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    const sd = s?.dim ?? s?.section?.length ?? 4;
    const td = t?.dim ?? t?.section?.length ?? 4;
    const maps = makePair("identity", sd, td, `${e.source}|id|${e.target}`);
    return { ...e, restrictKind: "identity", edgeDim: maps.edgeDim, Fsrc: maps.Fsrc, Ftgt: maps.Ftgt };
  });
}

export function harmonicExtend(nodesIn, edges, knownIds, iters = 80) {
  const known = new Set(knownIds);
  const nodes = nodesIn.map((n) => ({ ...n, section: n.section.slice() }));
  const lam = lambdaMax(nodes, edges, 16);
  const h = 0.85 / lam;
  for (let it = 0; it < iters; it++) {
    const x = pack(nodes, new Map(nodes.map((n) => [n.id, n.section])));
    const Lx = applySheafLaplacian(nodes, edges, x);
    const g = unpack(nodes, Lx);
    for (const n of nodes) {
      if (known.has(n.id)) continue;
      const gn = g.get(n.id);
      if (!gn) continue;
      for (let i = 0; i < n.section.length; i++) n.section[i] -= h * gn[i];
    }
  }
  return nodes;
}

export function holdoutTest(nodes, edges, holdIds, iters = 80) {
  const hold = new Set(holdIds);
  const truth = new Map(nodes.filter((n) => hold.has(n.id)).map((n) => [n.id, n.section.slice()]));
  const knownIds = nodes.filter((n) => !hold.has(n.id)).map((n) => n.id);
  const masked = nodes.map((n) => ({
    ...n,
    section: hold.has(n.id) ? zeros(n.dim) : n.section.slice(),
  }));
  const sheafN = harmonicExtend(masked, edges, knownIds, iters);
  const graphN = harmonicExtend(masked, identityEdges(nodes, edges), knownIds, iters);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const nbr = new Map();
  for (const e of edges) {
    if (!nbr.has(e.source)) nbr.set(e.source, []);
    if (!nbr.has(e.target)) nbr.set(e.target, []);
    nbr.get(e.source).push(e.target);
    nbr.get(e.target).push(e.source);
  }
  const neighborN = masked.map((n) => {
    if (!hold.has(n.id)) return n;
    const ids = nbr.get(n.id) || [];
    const acc = zeros(n.dim);
    let c = 0;
    for (const id of ids) {
      if (hold.has(id)) continue;
      const o = byId.get(id);
      if (!o) continue;
      for (let i = 0; i < n.dim; i++) acc[i] += o.section[i] ?? 0;
      c++;
    }
    return { ...n, section: c ? acc.map((v) => v / c) : acc };
  });
  const score = (recon) => {
    const rec = new Map(recon.map((n) => [n.id, n.section]));
    let c = 0,
      m = 0,
      cf = 0,
      k = 0;
    for (const [id, t] of truth) {
      const r = rec.get(id);
      if (!r) continue;
      c += cosine(r, t);
      cf += cosine(r.slice(0, 16), t.slice(0, 16));
      m += mse(r, t);
      k++;
    }
    return { cos: k ? c / k : 0, famCos: k ? cf / k : 0, mse: k ? m / k : 0, n: k };
  };
  return {
    n: hold.size,
    sheaf: score(sheafN),
    graph: score(graphN),
    neighbor: score(neighborN),
  };
}
