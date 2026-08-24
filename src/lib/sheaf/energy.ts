import { matTVec, matVec, nrm2, sub, zeros } from "./linear";
import type { SheafEdge, SheafNode } from "./types";

export function coboundary(
  edge: SheafEdge,
  src: SheafNode,
  tgt: SheafNode,
): number[] {
  const hs = matVec(edge.Fsrc, src.section);
  const ht = matVec(edge.Ftgt, tgt.section);
  const d = sub(hs, ht);
  if (edge.translation.length === d.length) {
    for (let i = 0; i < d.length; i++) d[i]! += edge.translation[i]!;
  }
  return d;
}

export function residualOf(
  edge: SheafEdge,
  src: SheafNode,
  tgt: SheafNode,
): number {
  return nrm2(coboundary(edge, src, tgt));
}

export function recomputeResiduals(
  nodes: SheafNode[],
  edges: SheafEdge[],
): SheafEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) return { ...e, residual: Number.POSITIVE_INFINITY };
    return { ...e, residual: residualOf(e, s, t) };
  });
}

export function dirichletEnergy(nodes: SheafNode[], edges: SheafEdge[]): number {
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

export function nodeMeanResidual(
  nodeId: string,
  edges: SheafEdge[],
): number {
  let s = 0;
  let n = 0;
  for (const e of edges) {
    if (e.source === nodeId || e.target === nodeId) {
      s += e.residual;
      n++;
    }
  }
  return n ? s / n : 0;
}

/** ∇½E at each node as a map id → gradient in the stalk. */
export function halfGradients(
  nodes: SheafNode[],
  edges: SheafEdge[],
): Map<string, number[]> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const g = new Map<string, number[]>();
  for (const n of nodes) g.set(n.id, zeros(n.dim));
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) continue;
    const d = coboundary(e, s, t);
    const gs = g.get(s.id)!;
    const gt = g.get(t.id)!;
    const pullS = matTVec(e.Fsrc, d);
    const pullT = matTVec(e.Ftgt, d);
    for (let i = 0; i < gs.length; i++) gs[i]! += pullS[i] ?? 0;
    for (let i = 0; i < gt.length; i++) gt[i]! -= pullT[i] ?? 0;
  }
  return g;
}

export function degrees(nodes: SheafNode[], edges: SheafEdge[]): Map<string, number> {
  const d = new Map<string, number>();
  for (const n of nodes) d.set(n.id, 0);
  for (const e of edges) {
    d.set(e.source, (d.get(e.source) ?? 0) + 1);
    d.set(e.target, (d.get(e.target) ?? 0) + 1);
  }
  return d;
}
