import { kindForRelation, makePair } from "./maps";
import { recomputeResiduals } from "./energy";
import { zeros } from "./linear";
import type {
  RestrictionKind,
  SheafEdge,
  SheafEval,
  SheafGraph,
  SheafNode,
} from "./types";

const KINDS: RestrictionKind[] = [
  "identity",
  "projection",
  "embed",
  "spectral",
  "type-aware",
];

function asKind(v: unknown): RestrictionKind {
  return KINDS.includes(v as RestrictionKind) ? (v as RestrictionKind) : "spectral";
}

function clampDim(n: unknown): number {
  const d = Math.round(Number(n));
  if (!Number.isFinite(d)) return 4;
  return Math.max(1, Math.min(64, d));
}

function slug(s: string): string {
  return (
    s
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "node"
  );
}

/**
 * Load a portable SheafGraph. Missing maps are built from restrictKind.
 * Missing sections become zeros — never Gaussians.
 */
export function graphFromJson(raw: unknown): SheafGraph {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Sheaf JSON root must be an object");
  }
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) throw new Error("Sheaf JSON needs id");
  if (typeof o.title !== "string" || !o.title) throw new Error("Sheaf JSON needs title");
  if (!Array.isArray(o.nodes) || o.nodes.length < 1) throw new Error("Sheaf JSON needs nodes");
  if (!Array.isArray(o.edges) && !Array.isArray(o.triples)) {
    throw new Error("Sheaf JSON needs edges or triples");
  }

  const levels = Array.isArray(o.levels)
    ? o.levels.map((lv, i) => {
        const L = (lv ?? {}) as Record<string, unknown>;
        const id = typeof L.id === "number" ? L.id : i;
        return {
          id,
          code: typeof L.code === "string" ? L.code : `L${id}`,
          label: typeof L.label === "string" ? L.label : `Level ${id}`,
          kicker: typeof L.kicker === "string" ? L.kicker : "",
          blurb: typeof L.blurb === "string" ? L.blurb : "",
        };
      })
    : [{ id: 0, code: "L0", label: "Graph", kicker: "", blurb: "" }];

  const nodes: SheafNode[] = o.nodes.map((n, i) => {
    const N = (n ?? {}) as Record<string, unknown>;
    const id = slug(String(N.id ?? `node-${i}`));
    const dim = clampDim(N.dim);
    let section = Array.isArray(N.section)
      ? (N.section as unknown[]).map((x) => Number(x) || 0).slice(0, dim)
      : zeros(dim);
    while (section.length < dim) section.push(0);
    return {
      id,
      title: String(N.title ?? id),
      kind: String(N.kind ?? "entity"),
      level: typeof N.level === "number" ? N.level : 0,
      dim,
      section,
      known: Boolean(N.known),
      summary: String(N.summary ?? ""),
      sources: Array.isArray(N.sources) ? N.sources.map(String) : [],
      arxiv: typeof N.arxiv === "string" ? N.arxiv : undefined,
      aliases: Array.isArray(N.aliases) ? N.aliases.map(String) : undefined,
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rawEdges = (Array.isArray(o.edges) ? o.edges : o.triples) as unknown[];
  const edges: SheafEdge[] = [];
  for (const item of rawEdges) {
    const e = (item ?? {}) as Record<string, unknown>;
    const source = slug(String(e.source ?? e.subject ?? ""));
    const target = slug(String(e.target ?? e.object ?? ""));
    const relation = String(e.relation ?? e.predicate ?? "related_to");
    const s = byId.get(source);
    const t = byId.get(target);
    if (!s || !t) continue;
    const kind = e.restrictKind ? asKind(e.restrictKind) : kindForRelation(relation);
    let Fsrc = Array.isArray(e.Fsrc) ? (e.Fsrc as number[][]) : null;
    let Ftgt = Array.isArray(e.Ftgt) ? (e.Ftgt as number[][]) : null;
    let edgeDim = typeof e.edgeDim === "number" ? e.edgeDim : 0;
    if (!Fsrc || !Ftgt) {
      const maps = makePair(kind, s.dim, t.dim, `${source}|${target}|${relation}`);
      Fsrc = maps.Fsrc;
      Ftgt = maps.Ftgt;
      edgeDim = maps.edgeDim;
    } else {
      edgeDim = edgeDim || Fsrc.length;
    }
    const translation = Array.isArray(e.translation)
      ? (e.translation as unknown[]).map((x) => Number(x) || 0)
      : zeros(edgeDim);
    while (translation.length < edgeDim) translation.push(0);
    edges.push({
      id: String(e.id ?? `${source}→${target}:${relation}`),
      source,
      target,
      relation,
      restrictKind: kind,
      edgeDim,
      Fsrc,
      Ftgt,
      translation: translation.slice(0, edgeDim),
      residual: 0,
      note: typeof e.note === "string" ? e.note : undefined,
    });
  }

  return {
    id: o.id,
    title: o.title,
    kicker: typeof o.kicker === "string" ? o.kicker : "",
    blurb: typeof o.blurb === "string" ? o.blurb : "",
    residualMeaning:
      typeof o.residualMeaning === "string" ? o.residualMeaning : undefined,
    levels,
    nodes,
    edges: recomputeResiduals(nodes, edges),
    eval: o.eval && typeof o.eval === "object" ? (o.eval as SheafEval) : undefined,
  };
}
