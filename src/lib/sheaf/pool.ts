import { recomputeResiduals } from "./energy";
import { zeros } from "./linear";
import { makePair } from "./maps";
import type { SheafEdge, SheafNode } from "./types";

/**
 * Hierarchical Sheaf Pool (HiSP-style): collapse each level's communities
 * into supernodes. Stalk of a supernode is the mean of members, truncated
 * to the min dim (a projection — low-frequency modes survive).
 */
export function hierarchicalPool(
  nodes: SheafNode[],
  edges: SheafEdge[],
): { nodes: SheafNode[]; edges: SheafEdge[] } {
  const groups = new Map<string, SheafNode[]>();
  for (const n of nodes) {
    const key = `L${n.level}:${n.kind}`;
    const g = groups.get(key) ?? [];
    g.push(n);
    groups.set(key, g);
  }

  const superNodes: SheafNode[] = [];
  const memberOf = new Map<string, string>();

  for (const [key, members] of groups) {
    if (members.length === 1) {
      const only = members[0]!;
      superNodes.push({ ...only, section: only.section.slice() });
      memberOf.set(only.id, only.id);
      continue;
    }
    const dim = Math.max(2, Math.min(...members.map((m) => m.dim)));
    const section = zeros(dim);
    for (const m of members) {
      for (let i = 0; i < dim; i++) section[i]! += m.section[i] ?? 0;
    }
    for (let i = 0; i < dim; i++) section[i]! /= members.length;
    const id = `pool:${key}`;
    const titles = members.map((m) => m.title).slice(0, 3).join(", ");
    superNodes.push({
      id,
      title: titles + (members.length > 3 ? " +" : ""),
      kind: members[0]!.kind,
      level: members[0]!.level,
      dim,
      section,
      known: members.every((m) => m.known),
      summary: `HiSP supernode of ${members.length} stalks. Mean section, dim ${dim}.`,
      sources: [...new Set(members.flatMap((m) => m.sources))],
      pooledFrom: members.map((m) => m.id),
    });
    for (const m of members) memberOf.set(m.id, id);
  }

  const seen = new Set<string>();
  const superEdges: SheafEdge[] = [];
  for (const e of edges) {
    const s = memberOf.get(e.source);
    const t = memberOf.get(e.target);
    if (!s || !t || s === t) continue;
    const key = s < t ? `${s}|${t}|${e.relation}` : `${t}|${s}|${e.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const sn = superNodes.find((n) => n.id === s)!;
    const tn = superNodes.find((n) => n.id === t)!;
    const maps = makePair(e.restrictKind, sn.dim, tn.dim, key);
    superEdges.push({
      id: key,
      source: s,
      target: t,
      relation: e.relation,
      restrictKind: e.restrictKind,
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
      translation: zeros(maps.edgeDim),
      residual: 0,
      note: "Pooled restriction (Galerkin-style).",
    });
  }

  return {
    nodes: superNodes,
    edges: recomputeResiduals(superNodes, superEdges),
  };
}
