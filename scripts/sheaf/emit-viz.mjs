#!/usr/bin/env node
/** Emit stills from any SheafGraph JSON. Encoding is dataset-free.
 *  node scripts/sheaf/emit-viz.mjs --in docs/examples/discourse-triangle.json --out docs/viz/discourse-triangle
 *  node scripts/sheaf/emit-viz.mjs --all
 */
import { mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

export const TOKENS = {
  bg: "#081114",
  fg: "#e8ece8",
  muted: "#8a9690",
  subtle: "#5c6864",
  levels: ["#4a9a92", "#6b8ea3", "#8a9a6e", "#b08978"],
  lo: "#2f8f78",
  mid: "#c4a574",
  hi: "#c45c68",
};

const SANS = "IBM Plex Sans, sans-serif";
const DISPLAY = "Fraunces, serif";
const MONO = "IBM Plex Mono, monospace";

function esc(s) {
  return String(s ?? "").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
}
function arg(flag, fallback) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : fallback;
}
function slug(s) {
  return String(s || "node").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "node";
}
function kindOf(e) {
  return e.restrictKind ?? "spectral";
}
function residualOf(e) {
  if (typeof e.residual === "number" && Number.isFinite(e.residual)) return e.residual;
  return { identity: 0.12, projection: 0.4, embed: 0.28, "type-aware": 0.92, spectral: 0.55 }[kindOf(e)] ?? 0.55;
}
function levelHex(level) {
  const i = ((level % 4) + 4) % 4;
  return TOKENS.levels[i];
}

export function loadGraph(path) {
  const raw = JSON.parse(readFileSync(path, "utf8"));
  if (Array.isArray(raw.triples) && !raw.nodes) {
    const ids = new Map();
    const nodes = [];
    const take = (name, level) => {
      const id = slug(name);
      if (ids.has(id)) return id;
      ids.set(id, true);
      nodes.push({ id, title: String(name), level, dim: 4, known: level === 0 });
      return id;
    };
    const edges = raw.triples.map((t, i) => ({
      id: `t${i}`,
      source: take(t.subject ?? t.source, 0),
      target: take(t.object ?? t.target, 1),
      relation: t.predicate ?? t.relation ?? "related_to",
      restrictKind: t.restrictKind ?? "identity",
    }));
    return {
      id: raw.id ?? slug(basename(path, ".json")),
      title: raw.title ?? basename(path),
      kicker: raw.kicker ?? "triples",
      levels: [{ id: 0, label: "Subject" }, { id: 1, label: "Object" }],
      nodes,
      edges,
      _fromTriples: true,
    };
  }
  if (!raw.id || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
    throw new Error(`${path} is not a SheafGraph (need id, nodes, edges)`);
  }
  return raw;
}

function censusSvg(g) {
  const kinds = {};
  for (const e of g.edges) kinds[kindOf(e)] = (kinds[kindOf(e)] ?? 0) + 1;
  const kindRows = Object.entries(kinds)
    .map(([k, n], i) => `<text x="36" y="${160 + i * 18}" fill="${TOKENS.muted}" font-family="${MONO}" font-size="12">${esc(k)} ${n}</text>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="240" viewBox="0 0 640 240">
  <rect width="640" height="240" fill="${TOKENS.bg}"/>
  <text x="36" y="40" fill="${TOKENS.fg}" font-family="${DISPLAY}" font-size="22">${esc(g.title)}</text>
  <text x="36" y="64" fill="${TOKENS.muted}" font-family="${SANS}" font-size="13">${esc(g.id)} · ${g.nodes.length} stalks · ${g.edges.length} restrictions</text>
  <text x="36" y="96" fill="${TOKENS.fg}" font-family="${SANS}" font-size="14">${esc(g.kicker ?? g.residualMeaning ?? "")}</text>
  ${kindRows}
</svg>
`;
}

function waistSvg(g) {
  const pins = g.nodes.filter((n) => n.known);
  const rows = pins.map((n, i) => {
    const y = 88 + i * 26;
    return `<circle cx="48" cy="${y}" r="6" fill="${levelHex(n.level)}"/><text x="64" y="${y + 4}" fill="${TOKENS.fg}" font-family="${SANS}" font-size="13">${esc(n.title)}</text>`;
  }).join("\n");
  const h = Math.max(120, 80 + pins.length * 26);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${h}" viewBox="0 0 640 ${h}">
  <rect width="640" height="${h}" fill="${TOKENS.bg}"/>
  <text x="36" y="36" fill="${TOKENS.fg}" font-family="${DISPLAY}" font-size="20">Pinned stalks</text>
  <text x="36" y="58" fill="${TOKENS.muted}" font-family="${SANS}" font-size="12">${esc(g.id)} · ${pins.length} known</text>
  ${rows || `<text x="36" y="90" fill="${TOKENS.subtle}" font-family="${SANS}" font-size="13">No known pins.</text>`}
</svg>
`;
}

function claimsSvg(g) {
  const byId = new Map(g.nodes.map((n) => [n.id, n]));
  const claims = g.edges.filter((e) => kindOf(e) === "type-aware");
  const rows = claims.map((e, i) => {
    const y = 88 + i * 32;
    const s = byId.get(e.source)?.title ?? e.source;
    const t = byId.get(e.target)?.title ?? e.target;
    return `<text x="36" y="${y}" fill="${TOKENS.fg}" font-family="${SANS}" font-size="13">${esc(s)} → ${esc(t)}</text><text x="36" y="${y + 14}" fill="${TOKENS.muted}" font-family="${SANS}" font-size="11">${esc(e.note ?? e.relation ?? "type-aware")}</text>`;
  }).join("\n");
  const h = Math.max(120, 80 + claims.length * 32);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${h}" viewBox="0 0 720 ${h}">
  <rect width="720" height="${h}" fill="${TOKENS.bg}"/>
  <text x="36" y="36" fill="${TOKENS.fg}" font-family="${DISPLAY}" font-size="20">Terracotta claims</text>
  <text x="36" y="58" fill="${TOKENS.muted}" font-family="${SANS}" font-size="12">${esc(g.id)} · ${claims.length} type-aware</text>
  ${rows || `<text x="36" y="90" fill="${TOKENS.subtle}" font-family="${SANS}" font-size="13">No type-aware edges.</text>`}
</svg>
`;
}

function matrixSvg(g) {
  const n = g.nodes.length;
  if (n === 0) return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="120" height="40"><rect width="120" height="40" fill="${TOKENS.bg}"/></svg>`;
  const idx = new Map(g.nodes.map((nd, i) => [nd.id, i]));
  const useList = n > 48;
  if (useList) {
    const rows = g.edges.slice().sort((a, b) => residualOf(b) - residualOf(a)).slice(0, 20)
      .map((e, i) => `<text x="36" y="${80 + i * 16}" fill="${TOKENS.fg}" font-family="${MONO}" font-size="11">${esc(e.source)} → ${esc(e.target)}</text>`).join("\n");
    const h = 80 + Math.min(20, g.edges.length) * 16;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${h}" viewBox="0 0 720 ${h}">
  <rect width="720" height="${h}" fill="${TOKENS.bg}"/>
  <text x="36" y="36" fill="${TOKENS.fg}" font-family="${DISPLAY}" font-size="20">Noisiest restrictions</text>
  <text x="36" y="58" fill="${TOKENS.muted}" font-family="${SANS}" font-size="12">${esc(g.id)} · ${n} stalks</text>
  ${rows}
</svg>
`;
  }
  const cell = Math.max(6, Math.min(14, Math.floor(480 / n)));
  const size = n * cell + 8;
  const rects = g.edges.map((e) => {
    const i = idx.get(e.source);
    const j = idx.get(e.target);
    if (i == null || j == null) return "";
    const kind = kindOf(e);
    const fill = kind === "type-aware" ? TOKENS.hi : kind === "identity" ? TOKENS.lo : TOKENS.mid;
    return `<rect x="${4 + i * cell}" y="${4 + j * cell}" width="${cell - 1}" height="${cell - 1}" fill="${fill}"/>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 28}" viewBox="0 0 ${size} ${size + 28}">
  <rect width="100%" height="100%" fill="${TOKENS.bg}"/>
  <text x="8" y="16" fill="${TOKENS.muted}" font-family="${SANS}" font-size="11">${esc(g.id)} matrix</text>
  <g transform="translate(0,22)">${rects}</g>
</svg>
`;
}

function multiplesSvg(g) {
  const ids = [...new Set((g.levels ?? []).map((l) => l.id).concat(g.nodes.map((n) => n.level)))].sort((a, b) => a - b);
  const h = 48 + ids.length * 72;
  const rows = ids.map((id, r) => {
    const label = (g.levels ?? []).find((l) => l.id === id)?.label ?? `L${id}`;
    const group = g.nodes.filter((n) => n.level === id);
    const y = 56 + r * 72;
    const dots = group.slice(0, 32).map((n, i) => `<circle cx="${160 + i * 14}" cy="${y}" r="${n.known ? 5 : 4}" fill="${levelHex(id)}"/>`).join("");
    return `<text x="36" y="${y + 4}" fill="${TOKENS.fg}" font-family="${SANS}" font-size="13">L${id} ${esc(label)}</text>${dots}`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${h}" viewBox="0 0 720 ${h}">
  <rect width="720" height="${h}" fill="${TOKENS.bg}"/>
  <text x="36" y="28" fill="${TOKENS.fg}" font-family="${DISPLAY}" font-size="20">${esc(g.title)} — planes</text>
  ${rows}
</svg>
`;
}

export function encodingKeySvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="180" viewBox="0 0 720 180">
  <rect width="720" height="180" fill="${TOKENS.bg}"/>
  <text x="36" y="32" fill="${TOKENS.fg}" font-family="${DISPLAY}" font-size="20">Encoding key</text>
  ${TOKENS.levels.map((c, i) => `<rect x="${36 + i * 48}" y="56" width="40" height="18" fill="${c}"/>`).join("")}
  <rect x="260" y="56" width="40" height="18" fill="${TOKENS.lo}"/>
  <rect x="304" y="56" width="40" height="18" fill="${TOKENS.mid}"/>
  <rect x="348" y="56" width="40" height="18" fill="${TOKENS.hi}"/>
  <text x="36" y="110" fill="${TOKENS.fg}" font-family="${SANS}" font-size="13">size=dim · hue=level · colour=residual · dash=kind · diamond=type-aware</text>
  <text x="36" y="132" fill="${TOKENS.muted}" font-family="${SANS}" font-size="13">Same grammar for every sheaf JSON.</text>
</svg>
`;
}

export function emitGraph(graph, outDir) {
  mkdirSync(outDir, { recursive: true });
  const files = {
    "census.svg": censusSvg(graph),
    "waist.svg": waistSvg(graph),
    "claims.svg": claimsSvg(graph),
    "matrix.svg": matrixSvg(graph),
    "multiples.svg": multiplesSvg(graph),
    "encoding-key.svg": encodingKeySvg(),
  };
  for (const [name, svg] of Object.entries(files)) writeFileSync(join(outDir, name), svg);
  const manifest = {
    id: graph.id,
    title: graph.title,
    inputShape: graph._fromTriples ? "triples" : "sheaf",
    stalks: graph.nodes.length,
    restrictions: graph.edges.length,
    residualProxied: graph.edges.some((e) => typeof e.residual !== "number"),
    tokens: TOKENS,
    files: Object.keys(files),
  };
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

export function main(argv = process.argv) {
  const all = argv.includes("--all");
  const inputs = all
    ? readdirSync("docs/examples").filter((f) => f.endsWith(".json") && f !== "sheaf.schema.json").map((f) => join("docs/examples", f))
    : [arg("--in", "docs/examples/hermes-agent.json")];
  mkdirSync("docs/viz", { recursive: true });
  writeFileSync("docs/viz/encoding-key.svg", encodingKeySvg());
  const reports = [];
  for (const input of inputs) {
    const graph = loadGraph(input);
    const out = arg("--out") && !all ? arg("--out") : join("docs/viz", graph.id);
    reports.push({ input, ...emitGraph(graph, out) });
  }
  writeFileSync("docs/viz/manifest.json", JSON.stringify({ reports }, null, 2) + "\n");
  return reports;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("emit-viz.mjs")) {
  console.log(JSON.stringify(main().map((r) => ({ id: r.id, stalks: r.stalks, restrictions: r.restrictions })), null, 2));
}
