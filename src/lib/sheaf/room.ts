import { recomputeResiduals } from "./energy";
import { makePair } from "./maps";
import { zeros } from "./linear";
import type { LevelDef, SheafEdge, SheafGraph, SheafNode } from "./types";

const INDUCE_CAP = 16;

export function degreeOf(id: string, edges: SheafEdge[]): number {
  let n = 0;
  for (const e of edges) if (e.source === id || e.target === id) n++;
  return n;
}

export function canEnterRoom(
  node: SheafNode | null | undefined,
  edges: SheafEdge[],
  rooms?: Record<string, SheafGraph>,
): boolean {
  if (!node) return false;
  const authored = rooms?.[node.id];
  if (authored && authored.nodes.length >= 3) return true;
  if ((node.pooledFrom?.length ?? 0) >= 3) return true;
  return degreeOf(node.id, edges) >= 3;
}

function cloneNode(n: SheafNode, patch: Partial<SheafNode> = {}): SheafNode {
  return {
    ...n,
    section: (patch.section ?? n.section).slice(),
    sources: (patch.sources ?? n.sources).slice(),
    aliases: (patch.aliases ?? n.aliases)?.slice(),
    pooledFrom: (patch.pooledFrom ?? n.pooledFrom)?.slice(),
    ...patch,
  };
}

function remapEdges(nodes: SheafNode[], edges: SheafEdge[]): SheafEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const out: SheafEdge[] = [];
  const seen = new Set<string>();
  for (const e of edges) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t || s.id === t.id) continue;
    const key = `${e.source}|${e.target}|${e.relation}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const maps = makePair(e.restrictKind, s.dim, t.dim, key);
    out.push({
      ...e,
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
      translation:
        e.translation?.length === maps.edgeDim ? e.translation.slice() : zeros(maps.edgeDim),
      residual: 0,
    });
  }
  return recomputeResiduals(nodes, out);
}

function roomLevels(nodes: SheafNode[]): LevelDef[] {
  const ids = [...new Set(nodes.map((n) => n.level))].sort((a, b) => a - b);
  const labels = ["Interior pin", "Neighbours", "Interior", "Adapters"];
  return ids.map((id) => ({
    id,
    code: `L${id}`,
    label: labels[id] ?? `Layer ${id}`,
    kicker: id === 0 ? "Pinned" : "",
    blurb: "",
  }));
}

function graphOf(
  id: string,
  title: string,
  kicker: string,
  blurb: string,
  nodes: SheafNode[],
  edges: SheafEdge[],
): SheafGraph {
  return {
    id,
    title,
    kicker,
    blurb,
    levels: roomLevels(nodes),
    nodes,
    edges: remapEdges(nodes, edges),
  };
}

/** Unfold a HiSP supernode back into its members. */
export function unfoldMembers(
  focus: SheafNode,
  nodes: SheafNode[],
  edges: SheafEdge[],
): SheafGraph | null {
  const ids = new Set(focus.pooledFrom ?? []);
  if (ids.size < 3) return null;
  const roomNodes = nodes.filter((n) => ids.has(n.id)).map((n) => cloneNode(n));
  if (roomNodes.length < 3) return null;
  const roomEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
  return graphOf(
    `room:${focus.id}`,
    focus.title,
    `Inside ${focus.title}`,
    `Unfolded HiSP supernode — ${roomNodes.length} member stalks.`,
    roomNodes,
    roomEdges,
  );
}

/**
 * Authored interior wins. Otherwise induce a 1-hop sheaf around `focusId`,
 * optionally unfolding pooledFrom members that already live in `nodes`.
 * Cap keeps the working set playable — density is navigated by rooms, not by
 * dumping an AST onto the outer ring.
 */
export function buildRoom(
  focusId: string,
  nodes: SheafNode[],
  edges: SheafEdge[],
  rooms?: Record<string, SheafGraph>,
): SheafGraph | null {
  const authored = rooms?.[focusId];
  if (authored && authored.nodes.length >= 3) {
    const pinned = authored.nodes.map((n) =>
      cloneNode(n, { known: n.id === focusId ? true : n.known }),
    );
    return {
      ...authored,
      id: authored.id || `room:${focusId}`,
      nodes: pinned,
      edges: remapEdges(pinned, authored.edges),
    };
  }

  const focus = nodes.find((n) => n.id === focusId);
  if (!focus) return null;

  const fromPool = unfoldMembers(focus, nodes, edges);
  if (fromPool) return fromPool;

  const rank = (e: SheafEdge) => {
    if (e.restrictKind === "type-aware") return 0;
    if (e.restrictKind === "identity") return 1;
    return 2;
  };

  const incident = edges
    .filter((e) => e.source === focusId || e.target === focusId)
    .slice()
    .sort((a, b) => rank(a) - rank(b));

  const keep = new Set<string>([focusId]);
  for (const e of incident) {
    if (keep.size >= INDUCE_CAP) break;
    keep.add(e.source === focusId ? e.target : e.source);
  }
  if (keep.size < 3) return null;

  const minL = Math.min(...nodes.filter((n) => keep.has(n.id)).map((n) => n.level));
  const roomNodes = nodes
    .filter((n) => keep.has(n.id))
    .map((n) => {
      const shifted = Math.max(0, n.level - minL);
      return cloneNode(n, {
        level: n.id === focusId ? 0 : Math.max(1, shifted),
        known: n.id === focusId ? true : n.known,
      });
    });

  const roomEdges = edges.filter((e) => keep.has(e.source) && keep.has(e.target));
  return graphOf(
    `room:${focusId}`,
    focus.title,
    `Inside ${focus.title}`,
    `1-hop sheaf around ${focus.title}. Restriction maps and residuals are the interior — not an AST dump.`,
    roomNodes,
    roomEdges,
  );
}
