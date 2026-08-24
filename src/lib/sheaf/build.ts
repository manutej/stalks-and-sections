import { gaussian, hashSeed, mulberry32 } from "./rng";
import { zeros } from "./linear";
import { kindForRelation, makePair } from "./maps";
import { recomputeResiduals } from "./energy";
import type {
  DatasetId,
  LevelDef,
  LevelId,
  NodeKind,
  RestrictionKind,
  SheafEdge,
  SheafGraph,
  SheafNode,
} from "./types";

export interface NodeSpec {
  id: string;
  title: string;
  kind: NodeKind;
  level: LevelId;
  dim: number;
  known?: boolean;
  summary: string;
  sources: string[];
  arxiv?: string;
  aliases?: string[];
}

export interface EdgeSpec {
  source: string;
  target: string;
  relation: string;
  restrictKind?: RestrictionKind;
  note?: string;
  translationScale?: number;
}

export function buildGraph(
  id: DatasetId,
  title: string,
  kicker: string,
  blurb: string,
  levels: LevelDef[],
  nodeSpecs: NodeSpec[],
  edgeSpecs: EdgeSpec[],
): SheafGraph {
  const nodes: SheafNode[] = nodeSpecs.map((s) => {
    const rng = mulberry32(hashSeed(`section:${s.id}`));
    const section = zeros(s.dim);
    for (let i = 0; i < s.dim; i++) {
      section[i] = s.known ? gaussian(rng) * 0.35 : gaussian(rng) * 1.15;
    }
    return {
      id: s.id,
      title: s.title,
      kind: s.kind,
      level: s.level,
      dim: s.dim,
      section,
      known: Boolean(s.known),
      summary: s.summary,
      sources: s.sources,
      arxiv: s.arxiv,
      aliases: s.aliases,
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: SheafEdge[] = [];
  for (const e of edgeSpecs) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) continue;
    const kind = e.restrictKind ?? kindForRelation(e.relation);
    const maps = makePair(kind, s.dim, t.dim, `${e.source}|${e.target}|${e.relation}`);
    const rng = mulberry32(hashSeed(`tr:${e.source}:${e.relation}:${e.target}`));
    const translation = zeros(maps.edgeDim);
    const scale = e.translationScale ?? 0;
    if (scale) {
      for (let i = 0; i < maps.edgeDim; i++) translation[i] = (rng() * 2 - 1) * scale;
    }
    edges.push({
      id: `${e.source}→${e.target}:${e.relation}`,
      source: e.source,
      target: e.target,
      relation: e.relation,
      restrictKind: kind,
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
      translation,
      residual: 0,
      note: e.note,
    });
  }

  return {
    id,
    title,
    kicker,
    blurb,
    levels,
    nodes,
    edges: recomputeResiduals(nodes, edges),
  };
}
