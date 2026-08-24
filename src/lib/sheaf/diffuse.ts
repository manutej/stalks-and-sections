import { dirichletEnergy, halfGradients, degrees, recomputeResiduals } from "./energy";
import type { ProofReport, SheafEdge, SheafNode } from "./types";

export interface DiffuseResult {
  nodes: SheafNode[];
  edges: SheafEdge[];
  energyLog: number[];
  report: ProofReport;
}

/**
 * Degree-normalized Euler scheme on the sheaf Laplacian
 * (Cobb & Gebhart Thm 3.2 / Cor 3.3 spirit; Hansen–Ghrist Dirichlet flow).
 * Known nodes are frozen (boundary of the harmonic extension).
 */
export function diffuse(
  nodesIn: SheafNode[],
  edgesIn: SheafEdge[],
  opts: { maxIters?: number; h?: number; tol?: number } = {},
): DiffuseResult {
  const maxIters = opts.maxIters ?? 80;
  const h = opts.h ?? 0.85;
  const tol = opts.tol ?? 1e-8;
  const nodes = nodesIn.map((n) => ({ ...n, section: n.section.slice() }));
  const snapKnown = new Map(
    nodes.filter((n) => n.known).map((n) => [n.id, n.section.slice()]),
  );
  const energyBefore = dirichletEnergy(nodes, edgesIn);
  const log = [energyBefore];
  let increases = 0;
  let itDone = 0;

  for (let it = 0; it < maxIters; it++) {
    const G = halfGradients(nodes, edgesIn);
    const deg = degrees(nodes, edgesIn);
    let maxStep = 0;
    for (const n of nodes) {
      if (n.known) continue;
      const g = G.get(n.id);
      if (!g) continue;
      const d = Math.max(deg.get(n.id) ?? 1, 1);
      for (let i = 0; i < n.section.length; i++) {
        const step = (h * (g[i] ?? 0)) / d;
        n.section[i]! -= step;
        maxStep = Math.max(maxStep, Math.abs(step));
      }
    }
    itDone = it + 1;
    const e = dirichletEnergy(nodes, edgesIn);
    if (e > (log[log.length - 1] ?? 0) + 1e-9) increases++;
    log.push(e);
    if (maxStep < tol) break;
  }

  const edges = recomputeResiduals(nodes, edgesIn);
  const energyAfter = log[log.length - 1] ?? energyBefore;
  let drift = 0;
  for (const n of nodes) {
    if (!n.known) continue;
    const s = snapKnown.get(n.id);
    if (!s) continue;
    for (let i = 0; i < n.section.length; i++) {
      drift = Math.max(drift, Math.abs(n.section[i]! - s[i]!));
    }
  }

  return {
    nodes,
    edges,
    energyLog: log,
    report: {
      energyBefore,
      energyAfter,
      iters: itDone,
      boundaryDrift: drift,
      energyIncreases: increases,
      closedFormDiff: null,
      unique: null,
      note: "Normalized Euler descent on E = Σ ‖F_s x_s − F_t x_t − r‖². Known stalks stay fixed.",
    },
  };
}
