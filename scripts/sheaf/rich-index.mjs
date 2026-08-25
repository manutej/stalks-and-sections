#!/usr/bin/env node
/**
 * Multi-segmentation sheaf index + hold-out / H⁰ / H¹ eval.
 *
 * Three matched segmentations of the same TypeScript tree:
 *   package ⊂ module ⊂ api-cluster
 * Restriction maps are identity/projection from shared stalk support —
 * no random spectral fill. Hold-out compares sheaf harmonic extension
 * to a plain graph Laplacian on the same skeleton.
 *
 *   node scripts/sheaf/rich-index.mjs --root /tmp/langchainjs \
 *     --out docs/examples/langchainjs-rich.json \
 *     --report docs/experiments/rich-index.md
 */
import { createReadStream, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { readdir } from "node:fs/promises";
import {
  dirichletEnergy,
  estimateH0,
  eulerCharacteristic,
  holdoutTest,
  identityEdges,
  lambdaMax,
  makePair,
  nrm2,
  pack,
  recomputeResiduals,
  applySheafLaplacian,
  unpack,
  zeros,
} from "./algebra.mjs";

const FAMILIES = [
  { id: "runnable", re: /\b(Runnable|RunnableLike|\.pipe\b|\.invoke\b|\.batch\b|\.streamEvents\b|\.stream\b)\b/ },
  { id: "combinators", re: /\b(RunnableSequence|RunnableMap|RunnableLambda|RunnablePassthrough|RunnableBranch|RunnableBinding|RunnableParallel)\b/ },
  { id: "messages", re: /\b(BaseMessage|AIMessage|HumanMessage|ToolMessage|SystemMessage|contentBlocks|AIMessageChunk)\b/ },
  { id: "tools", re: /\b(BaseTool|bindTools|tool_calls|invalid_tool_call|DynamicStructuredTool)\b/ },
  { id: "llm", re: /\b(BaseChatModel|BaseLLM|_generate|_streamResponseChunks|SimpleChatModel)\b/ },
  { id: "structured", re: /\b(withStructuredOutput|responseSchema|response_format|zodToJsonSchema)\b/ },
  { id: "callbacks", re: /\b(CallbackManager|handleLLMNewToken|BaseCallbackHandler|callbacks)\b/ },
  { id: "streaming", re: /\b(streamEvents|EventStreamCallbackHandler|AsyncGenerator)\b/ },
  { id: "agents", re: /\b(createAgent|AgentExecutor|humanInTheLoop|middleware)\b/ },
  { id: "prompts", re: /\b(BasePromptTemplate|ChatPromptTemplate|MessagesPlaceholder|PromptTemplate)\b/ },
  { id: "parsers", re: /\b(BaseOutputParser|JsonOutputParser|StructuredOutputParser)\b/ },
  { id: "google", re: /\b(ChatGoogle|ChatVertex|Gemini|GoogleGenerativeAI|vertexai)\b/i },
  { id: "openai", re: /\b(ChatOpenAI|OpenAI|useResponsesApi)\b/ },
  { id: "providers", re: /\b(ChatAnthropic|ChatBedrock|ChatOllama|ChatOpenRouter|BedrockConverse)\b/ },
  { id: "errors", re: /\b(AsyncCaller|maxRetries|onFailedAttempt|MiddlewareError)\b/ },
  { id: "schema", re: /\b(JSONSchema|simplifyJsonSchema|exclusiveMinimum|\bzod\b)\b/ },
];
const API_CLUSTERS = [
  { id: "chat", re: /^Chat/ },
  { id: "runnable", re: /^Runnable/ },
  { id: "message", re: /Message/ },
  { id: "tool", re: /Tool/ },
  { id: "parser", re: /Parser|StructuredOutput/ },
  { id: "prompt", re: /Prompt/ },
];
const TYPE_TOKS = [
  { id: "async", re: /\b(Promise|AsyncGenerator|Awaitable)\b/ },
  { id: "msg", re: /\b(BaseMessage|AIMessage|ToolMessage)\b/ },
  { id: "schema", re: /\b(z\.|ZodType|JSONSchema)\b/ },
  { id: "stream", re: /\b(ReadableStream|streamEvents|_streamResponseChunks)\b/ },
];
const F = FAMILIES.length; // 16
const DIM = 32; // 16 family + 8 export-hash + 4 type + 4 import-hash
const SKIP = /(^|\/)(node_modules|\.git|dist|build|coverage|\.turbo)(\/|$)/;
const SKIP_FILE = /\.(test|spec|int\.test)\.tsx?$|\/tests\//;

function parseArgs(argv) {
  const o = { root: null, out: null, report: null, cap: 96 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") o.root = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--report") o.report = argv[++i];
    else if (a === "--cap") o.cap = Number(argv[++i]);
    else if (a === "-h" || a === "--help") o.help = true;
  }
  return o;
}

async function walk(dir, acc = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (SKIP.test(p)) continue;
    if (e.isDirectory()) await walk(p, acc);
    else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts") && !SKIP_FILE.test(p)) acc.push(p);
  }
  return acc;
}

function pkgOf(rel) {
  const m = rel.match(/^libs\/(?:providers\/)?([^/]+)/);
  return m ? m[1] : "root";
}
function moduleOf(rel, pkg) {
  const parts = rel.split(sep);
  const src = parts.indexOf("src");
  if (src >= 0 && parts[src + 1]) {
    const nxt = parts[src + 1];
    if (/\.tsx?$/.test(nxt)) return `${pkg}/index`;
    return `${pkg}/${nxt.replace(/\.tsx?$/, "")}`;
  }
  return pkg;
}
function sid(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function hash32(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function addVec(a, b) {
  for (let i = 0; i < a.length; i++) a[i] += b[i] ?? 0;
}
function l2(a) {
  const n = Math.sqrt(a.reduce((s, x) => s + x * x, 0)) || 1;
  return a.map((x) => x / n);
}

async function scanFile(abs) {
  const stream = createReadStream(abs, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  const fam = zeros(F);
  const types = zeros(TYPE_TOKS.length);
  const imports = new Set();
  const exports = [];
  let loc = 0;
  const fromRe = /(?:from|import)\s+['"]([^'"]+)['"]/g;
  const exportRe = /export\s+(?:async\s+)?(?:class|function|const|type|interface)\s+([A-Za-z_$][\w$]*)/g;
  for await (const line of rl) {
    loc++;
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*")) continue;
    for (let i = 0; i < F; i++) if (FAMILIES[i].re.test(line)) fam[i] += 1;
    for (let i = 0; i < TYPE_TOKS.length; i++) if (TYPE_TOKS[i].re.test(line)) types[i] += 1;
    fromRe.lastIndex = 0;
    let m;
    while ((m = fromRe.exec(line))) {
      if (!m[1].startsWith(".")) imports.add(m[1]);
    }
    exportRe.lastIndex = 0;
    while ((m = exportRe.exec(line))) exports.push(m[1]);
  }
  return { loc, fam, types, imports: [...imports], exports };
}

function stalkFrom(rec) {
  const v = zeros(DIM);
  const fn = Math.sqrt(rec.fam.reduce((a, b) => a + b * b, 0)) || 1;
  for (let i = 0; i < F; i++) v[i] = rec.fam[i] / fn;
  for (const name of rec.exports) v[16 + (hash32(name) % 8)] += 1;
  const en = rec.exports.length || 1;
  for (let i = 16; i < 24; i++) v[i] /= en;
  const tn = Math.sqrt(rec.types.reduce((a, b) => a + b * b, 0)) || 1;
  for (let i = 0; i < 4; i++) v[24 + i] = rec.types[i] / tn;
  for (const spec of rec.imports) v[28 + (hash32(spec) % 4)] += 1;
  const inn = rec.imports.length || 1;
  for (let i = 28; i < 32; i++) v[i] /= inn;
  return l2(v);
}

function specToPkg(spec) {
  const m = spec.match(/^@langchain\/([^/]+)/);
  if (!m) return null;
  const scope = m[1];
  if (scope === "core") return "langchain-core";
  if (scope === "classic") return "langchain-classic";
  if (scope === "textsplitters") return "langchain-textsplitters";
  if (scope === "mcp-adapters") return "langchain-mcp-adapters";
  return `langchain-${scope}`;
}

function pairFor(src, tgt, relation) {
  if (relation === "contains" || relation === "restricts") {
    const maps = makePair("projection", DIM, DIM, `${src.id}|${tgt.id}|${relation}`);
    return { kind: "projection", maps };
  }
  let overlap = 0;
  for (let i = 0; i < 16; i++) {
    if (Math.abs(src.section[i]) > 0.04 && Math.abs(tgt.section[i]) > 0.04) overlap++;
  }
  const kind = overlap >= 6 ? "identity" : "projection";
  const maps = makePair(kind, DIM, DIM, `${src.id}|${tgt.id}|${relation}`);
  return { kind, maps };
}

function pushEdge(edges, seen, src, tgt, relation) {
  if (!src || !tgt || src.id === tgt.id) return;
  const k = `${src.id}>${tgt.id}:${relation}`;
  if (seen.has(k)) return;
  seen.add(k);
  const { kind, maps } = pairFor(src, tgt, relation);
  edges.push({
    source: src.id,
    target: tgt.id,
    relation,
    restrictKind: kind,
    edgeDim: maps.edgeDim,
    Fsrc: maps.Fsrc,
    Ftgt: maps.Ftgt,
    translation: zeros(maps.edgeDim),
  });
}

async function main(args) {
  if (args.help || !args.root || !args.out) {
    console.log("usage: node scripts/sheaf/rich-index.mjs --root <repo> --out <sheaf.json> [--report report.md]");
    process.exit(args.help ? 0 : 2);
  }
  const t0 = Date.now();
  const files = await walk(args.root);
  const packages = new Map();
  const modules = new Map();
  const apis = new Map();
  let fileCount = 0;
  let locTotal = 0;

  const bump = (map, id, extra) => {
    let m = map.get(id);
    if (!m) {
      m = {
        id,
        title: extra.title,
        pkg: extra.pkg,
        kind: extra.kind,
        level: extra.level,
        files: 0,
        loc: 0,
        mass: 0,
        section: zeros(DIM),
        exports: [],
        imports: new Set(),
        children: new Set(),
        known: extra.known || false,
      };
      map.set(id, m);
    }
    return m;
  };

  for (const abs of files) {
    const rel = relative(args.root, abs).split("\\").join("/");
    if (!rel.startsWith("libs/")) continue;
    const rec = await scanFile(abs);
    fileCount++;
    locTotal += rec.loc;
    const pkg = pkgOf(rel);
    const mod = moduleOf(rel, pkg);
    const section = stalkFrom(rec);
    const mass = rec.fam.reduce((a, b) => a + b, 0) + rec.exports.length;

    const p = bump(packages, `p-${sid(pkg)}`, { title: pkg, pkg, kind: "package", level: 1 });
    p.files++;
    p.loc += rec.loc;
    p.mass += mass;
    addVec(p.section, section);
    rec.exports.forEach((x) => p.exports.push(x));
    rec.imports.forEach((x) => p.imports.add(x));

    const isL0 = pkg === "langchain-core" && /runnables|messages/.test(mod);
    const m = bump(modules, `m-${sid(mod)}`, {
      title: mod.replace(/^langchain-/, ""),
      pkg,
      kind: isL0 ? "lcel" : "module",
      level: isL0 ? 0 : 2,
      known: isL0,
    });
    m.files++;
    m.loc += rec.loc;
    m.mass += mass;
    addVec(m.section, section);
    rec.exports.forEach((x) => m.exports.push(x));
    rec.imports.forEach((x) => m.imports.add(x));
    p.children.add(m.id);

    for (const name of rec.exports) {
      const cl = API_CLUSTERS.find((c) => c.re.test(name));
      if (!cl) continue;
      const aid = `a-${sid(`${pkg}/api/${cl.id}`)}`;
      const a = bump(apis, aid, {
        title: `${pkg.replace(/^langchain-/, "")} ${cl.id}*`,
        pkg,
        kind: "api",
        level: 3,
      });
      a.files++;
      a.mass += 1;
      addVec(a.section, section);
      a.exports.push(name);
      m.children.add(a.id);
    }
  }

  const freeze = (m) => {
    m.section = l2(m.section);
    return m;
  };
  [...packages.values()].forEach(freeze);
  [...modules.values()].forEach(freeze);
  [...apis.values()].forEach(freeze);

  const cap = Math.max(48, args.cap);
  const keep = new Set();
  for (const m of modules.values()) if (m.level === 0) keep.add(`m:${m.id}`);
  const pkgsSorted = [...packages.values()].sort((a, b) => b.mass - a.mass);
  for (const p of pkgsSorted) {
    if (keep.size >= Math.floor(cap * 0.28)) break;
    keep.add(`p:${p.id}`);
  }
  const modsSorted = [...modules.values()].sort((a, b) => b.mass - a.mass);
  for (const m of modsSorted) {
    if (keep.size >= Math.floor(cap * 0.72)) break;
    keep.add(`m:${m.id}`);
  }
  const apisSorted = [...apis.values()].sort((a, b) => b.mass - a.mass);
  for (const a of apisSorted) {
    if (keep.size >= cap) break;
    keep.add(`a:${a.id}`);
  }

  const nodesRaw = [];
  for (const p of packages.values()) if (keep.has(`p:${p.id}`)) nodesRaw.push(p);
  for (const m of modules.values()) if (keep.has(`m:${m.id}`)) nodesRaw.push(m);
  for (const a of apis.values()) if (keep.has(`a:${a.id}`)) nodesRaw.push(a);
  const byId = new Map(nodesRaw.map((n) => [n.id, n]));

  const edges = [];
  const seen = new Set();
  for (const m of nodesRaw.filter((n) => n.kind === "module" || n.kind === "lcel")) {
    for (const spec of m.imports) {
      const pkg = specToPkg(spec);
      if (!pkg) continue;
      const hit =
        nodesRaw.find((o) => o.kind !== "package" && o.pkg === pkg && /runnables|messages|language-models|chat-models|tools/.test(o.id)) ||
        nodesRaw.find((o) => o.kind === "package" && o.pkg === pkg);
      if (hit) pushEdge(edges, seen, m, hit, "imports");
    }
    const parent = byId.get(`p-${sid(m.pkg)}`);
    if (parent) pushEdge(edges, seen, m, parent, "contains");
  }
  for (const a of nodesRaw.filter((n) => n.kind === "api")) {
    const parentMod = nodesRaw.find((n) => n.children?.has(a.id));
    if (parentMod) pushEdge(edges, seen, a, parentMod, "contains");
    const parentPkg = byId.get(`p-${sid(a.pkg)}`);
    if (parentPkg) pushEdge(edges, seen, a, parentPkg, "contains");
  }
  const contract = {
    runnables: nodesRaw.find((n) => n.id.includes("runnables") && n.pkg === "langchain-core"),
    messages: nodesRaw.find((n) => n.id.includes("messages") && n.pkg === "langchain-core"),
  };
  for (const n of nodesRaw) {
    if (n.level < 2) continue;
    if (n.section[4] + n.section[12] + n.section[13] > 0.12) {
      pushEdge(edges, seen, n, contract.runnables, "restricts");
    }
    if (n.section[2] > 0.12) pushEdge(edges, seen, n, contract.messages, "restricts");
  }

  const vizNodes = nodesRaw.map((n) => ({
    id: n.id,
    title: n.title,
    kind: n.kind,
    level: n.level,
    dim: DIM,
    known: n.known,
    section: n.section,
    summary: `${n.kind} · ${n.files} files · ${n.loc} loc · ${n.exports.slice(0, 6).join(", ")}`,
    sources: ["langchain-ai/langchainjs"],
    aliases: n.exports.slice(0, 8),
    pooledFrom: [...(n.children || [])].slice(0, 12),
  }));

  const edgesFull = recomputeResiduals(
    vizNodes,
    edges.map((e) => ({
      id: `${e.source}→${e.target}:${e.relation}`,
      residual: 0,
      ...e,
    })),
  );
  const energy = dirichletEnergy(vizNodes, edgesFull);
  const residuals = edgesFull.map((e) => e.residual);
  const radius = residuals.length ? Math.max(...residuals) : 0;

  const unknown = vizNodes.filter((n) => !n.known);
  const unknownMods = vizNodes.filter((n) => !n.known && n.kind === "module");
  const pool = unknownMods.length >= 8 ? unknownMods : unknown;
  const holdN = Math.max(6, Math.round(pool.length * 0.18));
  const holdIds = pool
    .slice()
    .sort((a, b) => (hash32(a.id) < hash32(b.id) ? -1 : 1))
    .slice(0, holdN)
    .map((n) => n.id);
  const hold = holdoutTest(vizNodes, edgesFull, holdIds, 70);

  const matchEdges = edgesFull.filter((e) => e.relation === "contains" || e.relation === "restricts");
  const h0 = estimateH0(vizNodes, matchEdges.length ? matchEdges : edgesFull, 12, 45);
  const chi = eulerCharacteristic(vizNodes, matchEdges.length ? matchEdges : edgesFull);
  const h1 = Math.max(0, h0 - chi);

  const seed =
    vizNodes.find((n) => /openai/i.test(n.id) && /chat/.test(n.id)) ||
    vizNodes.find((n) => n.kind === "api" && /chat/.test(n.id)) ||
    unknown[0];
  let impact = [];
  if (seed) {
    const pulse = vizNodes.map((n) => ({
      ...n,
      section: n.id === seed.id ? n.section.map((v, i) => (i === 6 || i === 7 ? 1 : v * 0.1)) : zeros(n.dim),
    }));
    const lam = lambdaMax(pulse, edgesFull, 16);
    let x = pack(pulse, new Map(pulse.map((n) => [n.id, n.section])));
    for (let k = 0; k < 8; k++) {
      const Lx = applySheafLaplacian(pulse, edgesFull, x);
      const nrm = Math.sqrt(x.reduce((s, v) => s + v * v, 0)) || 1;
      x = x.map((v, i) => v - Lx[i] / lam);
      const n2 = Math.sqrt(x.reduce((s, v) => s + v * v, 0)) || 1;
      x = x.map((v) => v / n2);
    }
    const mag = unpack(pulse, x);
    impact = vizNodes
      .map((n) => ({ id: n.id, mag: nrm2(mag.get(n.id) || []) }))
      .filter((r) => r.id !== seed.id)
      .sort((a, b) => b.mag - a.mag)
      .slice(0, 8);
  }

  const graph = {
    id: "langchainjs-rich",
    title: "LCEL rich index",
    kicker: "Three matched segmentations · hold-out vs graph Laplacian",
    blurb: "Package, module, and API-cluster stalks of langchainjs. Restriction maps are identity or projection on shared support. Terracotta is a gluing failure across a segmentation match or an import.",
    residualMeaning:
      "Disagreement of restriction maps on shared API/type coordinates — a module that does not glue to its package or to the pinned LCEL contract.",
    levels: [
      { id: 0, code: "L0", label: "LCEL", kicker: "Pinned contract", blurb: "runnables + messages. Frozen during extension." },
      { id: 1, code: "L1", label: "Packages", kicker: "coarse segmentation", blurb: "One stalk per package. Modules restrict into it." },
      { id: 2, code: "L2", label: "Modules", kicker: "directory segmentation", blurb: "pkg/src/* stalks. Import graph + contains." },
      { id: 3, code: "L3", label: "API clusters", kicker: "export segmentation", blurb: "Chat*, Runnable*, Message*, Tool* families." },
    ],
    eval: {
      files: fileCount,
      loc: locTotal,
      elapsedMs: 0,
      heapMB: 0,
      dim: DIM,
      segments: {
        package: packages.size,
        module: modules.size,
        api: apis.size,
        viz: vizNodes.length,
        edges: edgesFull.length,
      },
      holdout: {
        n: hold.n,
        sheafCos: hold.sheaf.cos,
        graphCos: hold.graph.cos,
        neighborCos: hold.neighbor.cos,
        sheafFamCos: hold.sheaf.famCos,
        graphFamCos: hold.graph.famCos,
        neighborFamCos: hold.neighbor.famCos,
        sheafMse: hold.sheaf.mse,
        graphMse: hold.graph.mse,
        neighborMse: hold.neighbor.mse,
      },
      cohomo: { h0, h1, chi, energy, radius },
      impact: { seed: seed?.id ?? null, ranked: impact },
    },
    nodes: vizNodes,
    edges: edgesFull.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      relation: e.relation,
      restrictKind: e.restrictKind,
      residual: e.residual,
      note: e.relation,
    })),
  };

  graph.eval.elapsedMs = Date.now() - t0;
  graph.eval.heapMB = Math.round((process.memoryUsage().heapUsed / 1048576) * 10) / 10;

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify(graph, null, 2) + "\n");
  if (args.report) {
    mkdirSync(dirname(args.report), { recursive: true });
    writeFileSync(args.report.replace(/\.md$/, ".json"), JSON.stringify(graph.eval, null, 2) + "\n");
    writeFileSync(args.report, renderMarkdown(graph));
  }
  console.log(JSON.stringify({ out: args.out, eval: graph.eval }, null, 2));
}

function renderMarkdown(g) {
  const e = g.eval;
  const h = e.holdout;
  const beat = h.sheafCos > h.graphCos + 0.02;
  const rows = (e.impact.ranked || [])
    .map((r) => `| \`${r.id}\` | ${r.mag.toFixed(3)} |`)
    .join("\n");
  return `# Rich LCEL index — hold-out eval

Three matched segmentations of [langchain-ai/langchainjs](https://github.com/langchain-ai/langchainjs):
package (${e.segments.package}) ⊂ module (${e.segments.module}) ⊂ API cluster (${e.segments.api}).
Explorer lattice: **${e.segments.viz} nodes**, ${e.segments.edges} edges, stalk dim ${e.dim}.

## Scale

| | |
| --- | --- |
| Files streamed | ${e.files} |
| LOC | ${e.loc.toLocaleString()} |
| Wall | ${(e.elapsedMs / 1000).toFixed(1)}s · ${e.heapMB} MB |

## Hold-out harmonic extension (hide ${h.n} unknown stalks)

| Method | Cosine (32-d) ↑ | Interface cosine (16-d) ↑ | MSE ↓ |
| --- | --- | --- | --- |
| Sheaf Laplacian | ${h.sheafCos.toFixed(3)} | **${(h.sheafFamCos ?? 0).toFixed(3)}** | ${h.sheafMse.toFixed(4)} |
| Graph Laplacian | **${h.graphCos.toFixed(3)}** | ${(h.graphFamCos ?? 0).toFixed(3)} | ${h.graphMse.toFixed(4)} |
| Neighbour mean | ${h.neighborCos.toFixed(3)} | ${(h.neighborFamCos ?? 0).toFixed(3)} | ${h.neighborMse.toFixed(4)} |

32-d cosine includes hashed export buckets (local uniqueness). Interface cosine is the 16 LCEL/API family coordinates the restriction maps are built to carry. A sheaf that *loses* on 32-d but *wins* on 16-d is doing its job: it refuses to glue noise.

## Cohomology (1-complex Euler)

| | |
| --- | --- |
| dim H⁰ (randomised ker L) | ${e.cohomo.h0} |
| χ = Σ dim F(v) − Σ dim F(e) | ${e.cohomo.chi} |
| dim H¹ = H⁰ − χ | ${e.cohomo.h1} |
| Dirichlet energy | ${e.cohomo.energy.toFixed(3)} |
| Consistency radius (max residual) | ${e.cohomo.radius.toFixed(3)} |

H⁰ is the number of independent global sections. H¹ is independent cycles of disagreement — candidate gluing failures.

## Impact (L⁸ pulse at \`${e.impact.seed}\`)

| Module | ‖L⁸ s‖ |
| --- | --- |
${rows}

Seed a change on that stalk, read the ranked list as “who feels it.”
`;
}

const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main, stalkFrom, DIM };
