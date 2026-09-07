import type { SheafEval, SheafGraph } from "./types";

export type ReviewPin = { id: string; title: string };

export type ReviewClaim = {
  source: string;
  sourceTitle: string;
  target: string;
  targetTitle: string;
  note: string;
  residual: number;
};

export type ReviewRoom = {
  id: string;
  title: string;
  kicker: string;
  nodes: number;
  edges: number;
  aliases: string[];
};

export type ReviewSheet = {
  id: string;
  title: string;
  kicker: string;
  residualMeaning?: string;
  stalks: number;
  restrictions: number;
  files?: number;
  walker?: string;
  waist: ReviewPin[];
  terracotta: ReviewClaim[];
  rooms: ReviewRoom[];
  gaps: string[];
};

function titleOf(graph: Pick<SheafGraph, "nodes">, id: string): string {
  return graph.nodes.find((n) => n.id === id)?.title ?? id;
}

function roomSig(room: SheafGraph): string {
  const nodes = room.nodes.map((n) => n.id).slice().sort().join(",");
  const edges = room.edges
    .map((e) => `${e.source}>${e.target}:${e.restrictKind}`)
    .slice()
    .sort()
    .join(",");
  return `${nodes}|${edges}`;
}

/** Compact 2D review of a sheaf — claims and interiors, not an AST dump. */
export function reviewSheet(
  graph: Pick<
    SheafGraph,
    "id" | "title" | "kicker" | "residualMeaning" | "nodes" | "edges" | "rooms" | "eval"
  >,
): ReviewSheet {
  const waist = graph.nodes
    .filter((n) => n.known && n.level === 0)
    .map((n) => ({ id: n.id, title: n.title }));

  const terracotta = graph.edges
    .filter((e) => e.restrictKind === "type-aware")
    .map((e) => ({
      source: e.source,
      sourceTitle: titleOf(graph, e.source),
      target: e.target,
      targetTitle: titleOf(graph, e.target),
      note: e.note ?? "",
      residual: e.residual,
    }));

  const unique = new Map<string, ReviewRoom>();
  for (const [key, room] of Object.entries(graph.rooms ?? {})) {
    const sig = roomSig(room);
    const hit = unique.get(sig);
    if (hit) {
      hit.aliases.push(key);
      continue;
    }
    unique.set(sig, {
      id: key,
      title: room.title || titleOf(graph, key),
      kicker: room.kicker ?? "",
      nodes: room.nodes.length,
      edges: room.edges.length,
      aliases: [],
    });
  }

  const ev: SheafEval | undefined = graph.eval;
  return {
    id: graph.id,
    title: graph.title,
    kicker: graph.kicker,
    residualMeaning: graph.residualMeaning,
    stalks: graph.nodes.length,
    restrictions: graph.edges.length,
    files: ev?.files,
    walker: ev?.walker,
    waist,
    terracotta,
    rooms: [...unique.values()],
    gaps: ev?.honestGaps ?? [],
  };
}
