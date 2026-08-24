#!/usr/bin/env node
/**
 * Build a portable SheafGraph JSON from triples, a node-edge graph, a CSV,
 * or a folder of wiki markdown pages.
 *
 *   node scripts/sheaf/generate.mjs --from templates/kg/triples.json --out docs/examples/toy-kg.json
 *   node scripts/sheaf/generate.mjs --from-wiki docs/sources --out docs/examples/wiki-integrity.json
 *   node scripts/sheaf/generate.mjs --all
 *
 * Never Gaussian-fills imported sections. Pass --sample-sections only for throwaway demos.
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_LEVELS,
  DIM_FOR_KIND,
  LEVEL_FOR_KIND,
  clampDim,
  dirichletEnergy,
  gaussian,
  hashSeed,
  kindForRelation,
  makePair,
  mulberry32,
  recomputeResiduals,
  zeros,
} from "./algebra.mjs";
import { formatReport, validateSheaf } from "./schema.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");

function parseArgs(argv) {
  const out = { _: [], sample: false, all: false, from: null, wiki: null, out: null, id: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--from") out.from = argv[++i];
    else if (a === "--from-wiki") out.wiki = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--id") out.id = argv[++i];
    else if (a === "--sample-sections") out.sample = true;
    else if (a === "--all") out.all = true;
    else if (a === "-h" || a === "--help") out.help = true;
    else out._.push(a);
  }
  return out;
}

function slug(s) {
  return String(s)
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "node";
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const si = header.indexOf("source");
  const ri = header.indexOf("relation") >= 0 ? header.indexOf("relation") : header.indexOf("predicate");
  const ti = header.indexOf("target") >= 0 ? header.indexOf("target") : header.indexOf("object");
  const ki = header.indexOf("restrictkind");
  if (si < 0 || ri < 0 || ti < 0) throw new Error("CSV needs source,relation,target columns");
  return lines.slice(1).map((line) => {
    const c = line.split(",").map((x) => x.trim());
    const row = { source: c[si], relation: c[ri], target: c[ti] };
    if (ki >= 0 && c[ki]) row.restrictKind = c[ki];
    return row;
  });
}

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim();
    if (v.startsWith("[") && v.endsWith("]")) {
      v = v
        .slice(1, -1)
        .split(",")
        .map((x) => x.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else {
      v = v.replace(/^["']|["']$/g, "");
    }
    meta[kv[1]] = v;
  }
  return { meta, body: m[2] };
}

function extractWikiRelations(body) {
  const rels = [];
  const block = body.split(/^## Relations\s*$/m)[1] ?? "";
  const zone = block.split(/^## /m)[0] ?? "";
  const re = /^-\s+([a-z_]+)\s+.*?\[\[([^\]]+)\]\]/gim;
  let m;
  while ((m = re.exec(zone))) {
    rels.push({ relation: m[1], target: slug(m[2].split("|")[0]) });
  }
  return rels;
}

function loadWikiDir(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md" && f !== "SOURCES.md" && f !== "SKILL.md");
  const pages = [];
  for (const f of files) {
    const text = readFileSync(join(dir, f), "utf8");
    const { meta, body } = parseFrontmatter(text);
    const id = slug(meta.id || basename(f, ".md"));
    const title = meta.title || id;
    const kind = String(meta.type || "concept");
    const sources = Array.isArray(meta.sources) ? meta.sources : meta.sources ? [meta.sources] : [];
    const summary = (body.match(/^#{1,2} .+\n+([\s\S]{0,280})/) || [,""])[1]
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
    pages.push({
      id,
      title,
      kind,
      sources,
      summary,
      relations: extractWikiRelations(body),
    });
  }
  return pages;
}

function ensureNode(map, spec, sample) {
  if (map.has(spec.id)) {
    const cur = map.get(spec.id);
    for (const [k, v] of Object.entries(spec)) {
      if (v !== undefined && v !== null && (cur[k] === undefined || cur[k] === null || cur[k] === "")) cur[k] = v;
    }
    return cur;
  }
  const kind = spec.kind || "entity";
  const dim = clampDim(spec.dim ?? DIM_FOR_KIND[kind] ?? 4);
  let section = Array.isArray(spec.section) ? spec.section.slice(0, dim) : null;
  if (section) while (section.length < dim) section.push(0);
  if (!section) {
    if (sample) {
      const rng = mulberry32(hashSeed(`section:${spec.id}`));
      section = zeros(dim).map(() => gaussian(rng) * (spec.known ? 0.35 : 1.15));
    } else {
      section = zeros(dim);
    }
  }
  const node = {
    id: spec.id,
    title: spec.title || spec.id,
    kind,
    level: Number.isFinite(spec.level) ? spec.level : (LEVEL_FOR_KIND[kind] ?? 1),
    dim,
    known: Boolean(spec.known),
    section,
    summary: spec.summary || "",
    sources: spec.sources || [],
  };
  map.set(spec.id, node);
  return node;
}

function buildFromInput(input, { sample = false, idOverride = null } = {}) {
  const nodes = new Map();
  const edgeSpecs = [];

  if (Array.isArray(input.nodes)) {
    for (const n of input.nodes) {
      ensureNode(nodes, { ...n, id: slug(n.id || n.title) }, sample);
    }
  }

  const triples = input.triples || input.edges || [];
  for (const t of triples) {
    const source = slug(t.source || t.subject);
    const target = slug(t.target || t.object);
    const relation = String(t.relation || t.predicate || "related_to");
    if (!source || !target) continue;
    ensureNode(nodes, { id: source, title: t.source || t.subject, kind: t.sourceKind }, sample);
    ensureNode(nodes, { id: target, title: t.target || t.object, kind: t.targetKind }, sample);
    edgeSpecs.push({
      source,
      target,
      relation,
      restrictKind: t.restrictKind || kindForRelation(relation),
      translation: t.translation,
      note: t.note,
      Fsrc: t.Fsrc,
      Ftgt: t.Ftgt,
      edgeDim: t.edgeDim,
    });
  }

  const levels = Array.isArray(input.levels) && input.levels.length ? input.levels : DEFAULT_LEVELS;
  const used = new Set([...nodes.values()].map((n) => n.level));
  const finalLevels = levels.filter((lv) => used.has(lv.id));
  const levelList = finalLevels.length ? finalLevels : levels;

  const nodeList = [...nodes.values()];
  const byId = new Map(nodeList.map((n) => [n.id, n]));
  const edges = [];
  for (const e of edgeSpecs) {
    const s = byId.get(e.source);
    const t = byId.get(e.target);
    if (!s || !t) continue;
    const kind = e.restrictKind || kindForRelation(e.relation);
    let Fsrc = e.Fsrc;
    let Ftgt = e.Ftgt;
    let edgeDim = e.edgeDim;
    if (!Fsrc || !Ftgt) {
      const maps = makePair(kind, s.dim, t.dim, `${e.source}|${e.target}|${e.relation}`);
      Fsrc = maps.Fsrc;
      Ftgt = maps.Ftgt;
      edgeDim = maps.edgeDim;
    } else {
      edgeDim = edgeDim || Fsrc.length;
    }
    const translation = Array.isArray(e.translation) ? e.translation.slice() : zeros(edgeDim);
    while (translation.length < edgeDim) translation.push(0);
    edges.push({
      id: `${e.source}→${e.target}:${e.relation}`,
      source: e.source,
      target: e.target,
      relation: e.relation,
      restrictKind: kind,
      edgeDim,
      Fsrc,
      Ftgt,
      translation: translation.slice(0, edgeDim),
      residual: 0,
      note: e.note,
    });
  }

  const graph = {
    id: idOverride || input.id || "untitled-kg",
    title: input.title || "Untitled knowledge graph",
    kicker: input.kicker || "generated sheaf",
    blurb: input.blurb || "",
    residualMeaning: input.residualMeaning || "Restriction residual: the coboundary of the two incident stalks.",
    levels: levelList,
    nodes: nodeList,
    edges: recomputeResiduals(nodeList, edges),
  };
  graph.energy = dirichletEnergy(graph.nodes, graph.edges);
  return graph;
}

function typeSection(kind, dim) {
  const order = [
    "concept",
    "theorem",
    "paper",
    "algorithm",
    "software",
    "person",
    "application",
    "integrity",
    "open-problem",
    "entity",
    "agent",
    "channel",
  ];
  const s = zeros(dim);
  const i = Math.max(0, order.indexOf(kind));
  s[i % dim] = 1;
  return s;
}

function wikiToInput(pages) {
  const nodes = pages.map((p) => {
    const dim = DIM_FOR_KIND[p.kind] ?? 4;
    return {
      id: p.id,
      title: p.title,
      kind: p.kind,
      level: LEVEL_FOR_KIND[p.kind] ?? 1,
      dim,
      known: p.kind === "paper" || p.kind === "theorem",
      section: typeSection(p.kind, dim),
      summary: p.summary,
      sources: p.sources,
    };
  });
  const have = new Set(nodes.map((n) => n.id));
  const triples = [];
  for (const p of pages) {
    for (const r of p.relations) {
      if (!have.has(r.target)) {
        const dim = 3;
        nodes.push({
          id: r.target,
          title: r.target.replace(/-/g, " "),
          kind: "concept",
          level: 0,
          dim,
          known: false,
          section: typeSection("concept", dim),
          summary: "Stub target from a wiki relation (page not in this folder).",
          sources: [],
        });
        have.add(r.target);
      }
      triples.push({ source: p.id, relation: r.relation, target: r.target });
    }
  }
  return {
    id: "wiki-integrity",
    title: "Wiki integrity sheaf",
    kicker: "docs/sources as a sheaf",
    blurb: "Each markdown page is a stalk. Typed wiki relations become restriction maps. Residual is disagreement between a page and the thing it claims to relate to.",
    residualMeaning: "Typed-relation mismatch: is_a projects, extends embeds; leftover energy is a claim the wiki does not support as a section.",
    levels: DEFAULT_LEVELS,
    nodes,
    triples,
  };
}

function loadFrom(path) {
  const ext = extname(path).toLowerCase();
  const text = readFileSync(path, "utf8");
  if (ext === ".csv") {
    return {
      id: slug(basename(path, ext)),
      title: basename(path, ext),
      residualMeaning: "Restriction residual on a triple.",
      triples: parseCsv(text),
    };
  }
  return JSON.parse(text);
}

function writeGraph(graph, outPath) {
  const { energy, ...rest } = graph;
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(rest, null, 2) + "\n");
  const report = validateSheaf(rest);
  console.log(formatReport(outPath, report));
  console.log(`  energy ${energy.toFixed(4)}`);
  if (!report.ok) process.exitCode = 1;
}

function help() {
  console.log(`Sheaf knowledge-graph generator

Usage:
  node scripts/sheaf/generate.mjs --from <file.json|file.csv> --out <out.json>
  node scripts/sheaf/generate.mjs --from-wiki <dir> --out <out.json>
  node scripts/sheaf/generate.mjs --all

Options:
  --sample-sections   Fill missing stalks with seeded Gaussians (demo only)
  --id <id>           Override graph id

Input JSON: see templates/kg/triples.json and docs/GENERATE.md
Schema:     docs/examples/sheaf.schema.json
`);
}

export { buildFromInput, wikiToInput, loadWikiDir, loadFrom };

function main(args) {
  if (args.help) {
    help();
    return;
  }
  if (args.all) {
    const toyIn = join(root, "templates/kg/triples.json");
    const toyOut = join(root, "docs/examples/toy-kg.json");
    const wikiDir = join(root, "docs/sources");
    const wikiOut = join(root, "docs/examples/wiki-integrity.json");
    writeGraph(buildFromInput(loadFrom(toyIn), { sample: false, idOverride: "toy-kg" }), toyOut);
    writeGraph(buildFromInput(wikiToInput(loadWikiDir(wikiDir)), { sample: false }), wikiOut);
    return;
  }
  if (!args.from && !args.wiki) {
    help();
    process.exitCode = 2;
    return;
  }
  if (!args.out) {
    console.error("--out is required");
    process.exitCode = 2;
    return;
  }
  const input = args.wiki
    ? wikiToInput(loadWikiDir(resolve(args.wiki)))
    : loadFrom(resolve(args.from));
  const graph = buildFromInput(input, { sample: args.sample, idOverride: args.id });
  writeGraph(graph, resolve(args.out));
}

const isMain =
  Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) main(parseArgs(process.argv.slice(2)));
