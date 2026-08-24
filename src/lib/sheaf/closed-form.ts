import { dirichletEnergy, recomputeResiduals } from "./energy";
import { solve, zeros, zeros2 } from "./linear";
import type { SheafEdge, SheafNode } from "./types";

/**
 * Exact harmonic extension for the TransE special case
 * (identity restrictions, shared dim): Cobb & Gebhart Theorem 3.1.
 * L[U,U] X_U = b_U − L[U,B] X_B, with b = δᵀ r.
 */
export function closedFormTransE(
  nodesIn: SheafNode[],
  edges: SheafEdge[],
): { nodes: SheafNode[]; edges: SheafEdge[]; unique: boolean; maxDiff: number } {
  const nodes = nodesIn.map((n) => ({ ...n, section: n.section.slice() }));
  const ids = nodes.map((n) => n.id);
  const pos = new Map(ids.map((id, i) => [id, i]));
  const n = ids.length;
  const dim = nodes[0]?.dim ?? 4;
  const L = zeros2(n, n);
  const b = zeros2(n, dim);

  for (const e of edges) {
    const i = pos.get(e.source);
    const j = pos.get(e.target);
    if (i == null || j == null) continue;
    L[i]![i]! += 1;
    L[j]![j]! += 1;
    L[i]![j]! -= 1;
    L[j]![i]! -= 1;
    const r = e.translation;
    for (let d = 0; d < dim; d++) {
      b[j]![d]! += r[d] ?? 0;
      b[i]![d]! -= r[d] ?? 0;
    }
  }

  const known = nodes.map((nd) => nd.known);
  const U: number[] = [];
  const B: number[] = [];
  for (let i = 0; i < n; i++) (known[i] ? B : U).push(i);
  if (U.length === 0) {
    return { nodes, edges: recomputeResiduals(nodes, edges), unique: true, maxDiff: 0 };
  }

  const Luu = zeros2(U.length, U.length);
  const Lub = zeros2(U.length, B.length);
  for (let a = 0; a < U.length; a++) {
    for (let c = 0; c < U.length; c++) Luu[a]![c] = L[U[a]!]![U[c]!]!;
    for (let c = 0; c < B.length; c++) Lub[a]![c] = L[U[a]!]![B[c]!]!;
  }

  const XB = B.map((i) => nodes[i]!.section);
  let unique = true;
  let maxDiff = 0;

  for (let d = 0; d < dim; d++) {
    const rhs = zeros(U.length);
    for (let a = 0; a < U.length; a++) {
      let s = b[U[a]!]![d]!;
      for (let c = 0; c < B.length; c++) s -= Lub[a]![c]! * (XB[c]![d] ?? 0);
      rhs[a] = s;
    }
    let xU: number[];
    try {
      xU = solve(Luu, rhs);
    } catch {
      unique = false;
      xU = rhs.map(() => 0);
    }
    for (let a = 0; a < U.length; a++) {
      const before = nodes[U[a]!]!.section[d]!;
      nodes[U[a]!]!.section[d] = xU[a]!;
      maxDiff = Math.max(maxDiff, Math.abs(xU[a]! - before));
    }
  }

  return {
    nodes,
    edges: recomputeResiduals(nodes, edges),
    unique,
    maxDiff,
  };
}

export function energyOf(nodes: SheafNode[], edges: SheafEdge[]): number {
  return dirichletEnergy(nodes, edges);
}
