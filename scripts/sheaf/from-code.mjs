#!/usr/bin/env node
/**
 * Code → sheaf extractor for a TypeScript monorepo.
 * Streams files, never keeps source text. Hierarchical pooling: file → module → lattice.
 *
 *   node scripts/sheaf/from-code.mjs --root /tmp/langchainjs --out docs/examples/langchainjs.json \
 *     --issues docs/experiments/langchainjs-issues.json --report docs/experiments/langchainjs.md
 */
import { createReadStream, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { readdir } from "node:fs/promises";
import { dirichletEnergy, makePair, recomputeResiduals, zeros } from "./algebra.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const FAMILIES = [
  { id: "runnable", re: /\b(Runnable|RunnableLike|\.pipe\b|\.invoke\b|\.batch\b|\.streamEvents\b|\.stream\b)\b/ },
  { id: "combinators", re: /\b(RunnableSequence|RunnableMap|RunnableLambda|RunnablePassthrough|RunnableBranch|RunnableBinding|RunnableRetry|RunnableWithFallbacks|RunnableParallel)\b/ },
  { id: "messages", re: /\b(BaseMessage|AIMessage|HumanMessage|ToolMessage|SystemMessage|contentBlocks|AIMessageChunk)\b/ },
  { id: "tools", re: /\b(BaseTool|bindTools|tool_calls|invalid_tool_call|DynamicStructuredTool)\b/ },
  { id: "llm", re: /\b(BaseChatModel|BaseLLM|_generate|_streamResponseChunks|SimpleChatModel)\b/ },
  { id: "structured", re: /\b(withStructuredOutput|responseSchema|response_format|zodToJsonSchema|toJsonSchema)\b/ },
  { id: "callbacks", re: /\b(CallbackManager|handleLLMNewToken|BaseCallbackHandler|callbacks)\b/ },
  { id: "streaming", re: /\b(streamEvents|EventStreamCallbackHandler|AsyncGenerator|_streamResponseChunks)\b/ },
  { id: "agents", re: /\b(createAgent|AgentExecutor|humanInTheLoop|middleware)\b/ },
  { id: "prompts", re: /\b(BasePromptTemplate|ChatPromptTemplate|MessagesPlaceholder|PromptTemplate)\b/ },
  { id: "parsers", re: /\b(BaseOutputParser|JsonOutputParser|StructuredOutputParser)\b/ },
  { id: "google", re: /\b(ChatGoogle|ChatVertex|Gemini|GoogleGenerativeAI|vertexai|google-genai)\b/i },
  { id: "openai", re: /\b(ChatOpenAI|OpenAI|useResponsesApi)\b/ },
  { id: "providers", re: /\b(ChatAnthropic|ChatBedrock|ChatOllama|ChatOpenRouter|BedrockConverse|ChatGroq)\b/ },
  { id: "errors", re: /\b(AsyncCaller|maxRetries|onFailedAttempt|MiddlewareError|ToolException)\b/ },
  { id: "schema", re: /\b(json-schema|JSONSchema|simplifyJsonSchema|exclusiveMinimum|zod)\b/ },
];
const DIM = FAMILIES.length;

const GOLD_GLUE = [
  { number: 11372, pkgs: ["langchain-openai", "langchain-google", "langchain-aws", "langchain-anthropic"] },
  { number: 11396, pkgs: ["langchain-anthropic"] },
  { number: 11155, pkgs: ["langchain-ollama"] },
  { number: 11326, pkgs: ["langchain-aws"] },
  { number: 11341, pkgs: ["langchain-aws"] },
  { number: 10956, pkgs: ["langchain-google-genai"] },
  { number: 10307, pkgs: ["langchain-google"] },
  { number: 11328, pkgs: ["langchain-google-genai"] },
  { number: 11311, pkgs: ["langchain-core"] },
  { number: 11355, pkgs: ["langchain-core"] },
  { number: 11293, pkgs: ["langchain-core", "langchain-openai"] },
  { number: 11444, pkgs: ["langchain-google"] },
  { number: 11381, pkgs: ["langchain-openai"] },
  { number: 6795, pkgs: ["langchain-openai", "langchain-google", "langchain-anthropic"] },
  { number: 11332, pkgs: ["langchain-openai"] },
  { number: 11409, pkgs: ["langchain-openrouter"] },
  { number: 11417, pkgs: ["langchain-openrouter"] },
  { number: 11351, pkgs: ["langchain-mcp-adapters"] },
];

const SKIP = /(^|\/)(node_modules|\.git|dist|build|coverage|\.turbo)(\/|$)/;
const SKIP_FILE = /\.(test|spec|int\.test)\.tsx?$|\/tests\//;

function parseArgs(argv) {
  const o = { root: null, out: null, issues: null, report: null, cap: 96 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") o.root = argv[++i];
    else if (a === "--out") o.out = argv[++i];
    else if (a === "--issues") o.issues = argv[++i];
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
    if (nxt.endsWith(".ts") || nxt.endsWith(".tsx")) return `${pkg}/index`;
    return `${pkg}/${nxt.replace(/\.(tsx?)$/, "")}`;
  }
  return pkg;
}

function levelOf(pkg, mod) {
  if (pkg === "langchain-core" && /runnables|messages/.test(mod)) return 0;
  if (pkg === "langchain-core") return 1;
  if (pkg === "langchain" || pkg === "langchain-classic" || pkg === "langchain-textsplitters" || pkg === "langchain-mcp-adapters") return 2;
  return 3;
}

function kindOf(pkg, mod) {
  if (/runnables/.test(mod)) return "lcel";
  if (pkg === "langchain-core") return "core";
  if (pkg === "langchain" || pkg === "langchain-classic") return "surface";
  if (pkg.startsWith("langchain-mcp")) return "mcp";
  return "provider";
}

async function scanFile(abs) {
  const stream = createReadStream(abs, { encoding: "utf8" });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  const fam = zeros(DIM);
  const imports = new Set();
  const exports = [];
  let loc = 0;
  let tokens = 0;
  const grams = new Set();
  let prev2 = 0;
  let prev1 = 0;
  const identRe = /[A-Za-z_$][\w$]*/g;
  const fromRe = /(?:from|import)\s+['"]([^'"]+)['"]/g;
  const exportRe = /export\s+(?:async\s+)?(?:class|function|const|type|interface)\s+([A-Za-z_$][\w$]*)/g;

  for await (const line of rl) {
    loc++;
    const t = line.trim();
    if (t.startsWith("//") || t.startsWith("*")) continue;
    for (let i = 0; i < FAMILIES.length; i++) {
      if (FAMILIES[i].re.test(line)) fam[i] += 1;
    }
    fromRe.lastIndex = 0;
    let m;
    while ((m = fromRe.exec(line))) {
      const spec = m[1];
      if (spec.startsWith(".")) continue;
      imports.add(spec);
    }
    exportRe.lastIndex = 0;
    while ((m = exportRe.exec(line))) exports.push(m[1]);
    identRe.lastIndex = 0;
    while ((m = identRe.exec(line))) {
      tokens++;
      const h = hash32(m[0]) >>> 0;
      const g = (prev2 ^ (prev1 * 0x9e3779b1) ^ h) >>> 0;
      grams.add(g & 0xfffff);
      prev2 = prev1;
      prev1 = h;
    }
  }
  const n = Math.sqrt(fam.reduce((a, b) => a + b * b, 0)) || 1;
  return {
    loc,
    tokens,
    grams,
    imports: [...imports],
    exports: exports.slice(0, 12),
    section: fam.map((v) => v / n),
    mass: fam.reduce((a, b) => a + b, 0),
  };
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
  for (let i = 0; i < a.length; i++) a[i] += b[i];
}

function l2(a) {
  const n = Math.sqrt(a.reduce((s, x) => s + x * x, 0)) || 1;
  return a.map((x) => x / n);
}

function restrictKind(a, b) {
  if (a.level === 0 && b.level > 0) return "embed";
  if (a.pkg === b.pkg) return "identity";
  if (a.level < b.level) return "projection";
  return "type-aware";
}

function specToNode(spec, nodes) {
  const m = spec.match(/^@langchain\/([^/]+)(?:\/(.*))?$/);
  if (!m) return null;
  const scope = m[1];
  const rest = (m[2] || "").split("/")[0];
  const pkg =
    scope === "core"
      ? "langchain-core"
      : scope === "classic"
        ? "langchain-classic"
        : scope === "textsplitters"
          ? "langchain-textsplitters"
          : scope === "mcp-adapters"
            ? "langchain-mcp-adapters"
            : `langchain-${scope}`;
  if (rest) {
    const hit = nodes.find((n) => n.id === `${pkg}/${rest}`);
    if (hit) return hit;
  }
  const cands = nodes.filter((n) => n.pkg === pkg);
  return (
    cands.find((n) => /\/(runnables|messages|language_models|chat_models|agents)$/.test(n.id)) ||
    cands.find((n) => n.id.endsWith("/index")) ||
    cands[0] ||
    null
  );
}

function aliasesFor(node) {
  const slug = node.pkg.replace(/^langchain-/, "");
  const extra = {
    "langchain-core": ["@langchain/core"],
    "langchain-openai": ["@langchain/openai", "chatopenai", "useResponsesApi", "responses api"],
    "langchain-google": ["@langchain/google", "chatgoogle"],
    "langchain-google-genai": ["@langchain/google-genai", "chatgooglegenerativeai"],
    "langchain-google-common": ["@langchain/google-common"],
    "langchain-google-vertexai": ["chatvertexai", "vertexai"],
    "langchain-aws": ["@langchain/aws", "chatbedrock", "bedrockconverse"],
    "langchain-anthropic": ["@langchain/anthropic", "chatanthropic"],
    "langchain-ollama": ["@langchain/ollama", "chatollama"],
    "langchain-openrouter": ["@langchain/openrouter", "chatopenrouter"],
    "langchain-mcp-adapters": ["mcp-adapters", "mcp tools"],
    langchain: ["createagent", "humanintheloop"],
    "langchain-classic": ["langchain-classic"],
  };
  const a = new Set(extra[node.pkg] || []);
  if (node.pkg !== "langchain" && node.pkg !== "langchain-core") a.add(`@langchain/${slug}`);
  return [...a];
}

function loadIssues(path) {
  if (!path) return [];
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return Array.isArray(raw) ? raw : raw.issues || [];
  } catch {
    return [];
  }
}

function issueHits(issues, node) {
  const keys = aliasesFor(node);
  let n = 0;
  const matched = [];
  for (const iss of issues) {
    const blob = `${iss.title}`.toLowerCase();
    if (keys.some((k) => k.length > 4 && blob.includes(k.toLowerCase()))) {
      n++;
      if (matched.length < 8) matched.push(iss.number);
    }
  }
  return { n, matched };
}

function goldRecall(rankedIds, k, nodesRaw) {
  const topPkgs = new Set(
    rankedIds
      .slice(0, k)
      .map((id) => nodesRaw.find((n) => n.id === id)?.pkg)
      .filter(Boolean),
  );
  let hit = 0;
  const details = [];
  for (const g of GOLD_GLUE) {
    const ok = g.pkgs.some((p) => topPkgs.has(p));
    if (ok) hit++;
    details.push({ number: g.number, pkgs: g.pkgs, recovered: ok });
  }
  return { k, hit, total: GOLD_GLUE.length, recall: hit / GOLD_GLUE.length, details };
}

async function main(args) {
  if (args.help || !args.root || !args.out) {
    console.log(
      "usage: node scripts/sheaf/from-code.mjs --root <repo> --out <sheaf.json> [--issues issues.json] [--report report.md] [--cap 96]",
    );
    process.exit(args.help ? 0 : 2);
  }
  const t0 = Date.now();
  const files = await walk(args.root);
  const modules = new Map();
  let fileCount = 0;
  let locTotal = 0;
  let tokenTotal = 0;
  const globalGrams = new Set();

  for (const abs of files) {
    const rel = relative(args.root, abs).split("\\").join("/");
    if (!rel.startsWith("libs/")) continue;
    const rec = await scanFile(abs);
    fileCount++;
    locTotal += rec.loc;
    tokenTotal += rec.tokens;
    for (const g of rec.grams) globalGrams.add(g);
    const pkg = pkgOf(rel);
    const mod = moduleOf(rel, pkg);
    const id = mod;
    let m = modules.get(id);
    if (!m) {
      m = {
        id,
        pkg,
        mod,
        title: id.replace(/^langchain-/, ""),
        files: 0,
        loc: 0,
        tokens: 0,
        grams: new Set(),
        imports: new Set(),
        exports: [],
        section: zeros(DIM),
        mass: 0,
        level: levelOf(pkg, mod),
        kind: kindOf(pkg, mod),
      };
      modules.set(id, m);
    }
    m.files++;
    m.loc += rec.loc;
    m.tokens += rec.tokens;
    m.mass += rec.mass;
    addVec(m.section, rec.section);
    for (const g of rec.grams) m.grams.add(g);
    for (const im of rec.imports) m.imports.add(im);
    m.exports.push(...rec.exports);
  }

  const all = [...modules.values()].map((m) => {
    m.section = l2(m.section);
    m.astEntropy = m.tokens ? m.grams.size / m.tokens : 0;
    m.known = m.level === 0;
    return m;
  });

  all.sort((a, b) => b.mass + b.files * 2 - (a.mass + a.files * 2));
  const cap = Math.max(24, args.cap);
  const keep = new Set();
  const prefer = (m) =>
    m.level === 0 ||
    /\/(runnables|messages|language_models|callbacks|tools|prompts|output_parsers|chat_models|agents)$/.test(m.id);
  for (const m of all) if (prefer(m)) keep.add(m.id);
  for (const m of all) {
    if (keep.size >= cap) break;
    keep.add(m.id);
  }
  const nodesRaw = all.filter((m) => keep.has(m.id));

  const issues = loadIssues(args.issues);
  for (const n of nodesRaw) {
    const h = issueHits(issues, n);
    n.issueCount = h.n;
    n.issueIds = h.matched;
  }

  const edges = [];
  const pushEdge = (source, target, relation, kind) => {
    if (!source || !target || source.id === target.id) return;
    const maps = makePair(kind, DIM, DIM, `${source.id}|${target.id}|${relation}`);
    edges.push({
      source: source.id,
      target: target.id,
      relation,
      restrictKind: kind,
      edgeDim: maps.edgeDim,
      Fsrc: maps.Fsrc,
      Ftgt: maps.Ftgt,
      translation: zeros(maps.edgeDim),
    });
  };

  for (const n of nodesRaw) {
    for (const spec of n.imports) {
      const hit = specToNode(spec, nodesRaw);
      if (hit) pushEdge(n, hit, "imports", restrictKind(n, hit));
    }
  }

  const contract = {
    runnables: nodesRaw.find((n) => n.id === "langchain-core/runnables"),
    messages: nodesRaw.find((n) => n.id === "langchain-core/messages"),
    llm: nodesRaw.find((n) => n.id === "langchain-core/language_models"),
    tools: nodesRaw.find((n) => n.id === "langchain-core/tools"),
    callbacks: nodesRaw.find((n) => n.id === "langchain-core/callbacks"),
  };
  for (const n of nodesRaw) {
    if (n.level < 2) continue;
    if (n.section[4] + n.section[11] + n.section[12] + n.section[13] > 0.15) {
      pushEdge(n, contract.llm, "restricts", "projection");
      pushEdge(n, contract.runnables, "restricts", "projection");
    }
    if (n.section[2] > 0.15) pushEdge(n, contract.messages, "restricts", "projection");
    if (n.section[3] > 0.12) pushEdge(n, contract.tools, "restricts", "projection");
    if (n.section[6] + n.section[7] > 0.12) pushEdge(n, contract.callbacks, "restricts", "projection");
    if (n.section[5] > 0.12) pushEdge(n, contract.llm, "structured-output", "type-aware");
  }

  const seen = new Set();
  const dedup = [];
  for (const e of edges) {
    const k = `${e.source}>${e.target}:${e.relation}`;
    if (seen.has(k)) continue;
    seen.add(k);
    dedup.push(e);
  }

  const nodes = nodesRaw.map((n) => ({
    id: n.id,
    title: n.title,
    kind: n.kind,
    level: n.level,
    dim: DIM,
    known: n.known,
    section: n.section,
    summary: `${n.files} files · ${n.loc} loc · AST entropy ${(n.astEntropy * 100).toFixed(1)}% · open-issue hits ${n.issueCount}${n.issueIds?.length ? ` (#${n.issueIds.join(", #")})` : ""}`,
    sources: ["langchain-ai/langchainjs"],
    aliases: n.exports.slice(0, 8),
  }));

  const edgesFull = recomputeResiduals(
    nodes,
    dedup.map((e) => ({
      id: `${e.source}→${e.target}:${e.relation}`,
      residual: 0,
      source: e.source,
      target: e.target,
      relation: e.relation,
      restrictKind: e.restrictKind,
      edgeDim: e.edgeDim,
      Fsrc: e.Fsrc,
      Ftgt: e.Ftgt,
      translation: e.translation,
    })),
  );
  const energy = dirichletEnergy(nodes, edgesFull);

  const graph = {
    id: "langchainjs",
    title: "LangChain.js LCEL sheaf",
    kicker: "Pinned LCEL contract → provider wrappers",
    blurb: "langchain-core runnables/messages are the pinned global section. Provider and surface modules must restrict into that contract. Terracotta edges are gluing failures — dropped callbacks, mismatched streamEvents, withStructuredOutput drift — not AST complexity.",
    residualMeaning:
      "Interface mismatch vs the pinned LCEL contract: a wrapper that looks locally like ChatModel (low AST entropy) but does not restrict invoke/stream/callbacks/structured-output into core.",
    levels: [
      { id: 0, code: "L0", label: "LCEL", kicker: "Pinned contract", blurb: "Runnable, combinators, messages. Known stalks. Diffuse must not move them." },
      { id: 1, code: "L1", label: "Core domains", kicker: "tools, llm, callbacks", blurb: "langchain-core modules that implement the contract." },
      { id: 2, code: "L2", label: "Surfaces", kicker: "agents & classic", blurb: "langchain / classic APIs that compose LCEL." },
      { id: 3, code: "L3", label: "Providers", kicker: "wrappers", blurb: "OpenAI, Google, AWS, Anthropic — where gluing usually fails." },
    ],
    nodes,
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
  const ranked = nodesRaw
    .map((n) => {
      const my = graph.edges.filter(
        (e) =>
          (e.source === n.id || e.target === n.id) &&
          (e.relation === "restricts" || e.relation === "structured-output"),
      );
      const pool = my.length ? my : graph.edges.filter((e) => e.source === n.id || e.target === n.id);
      const mean = pool.length ? pool.reduce((s, e) => s + e.residual, 0) / pool.length : 0;
      return { ...n, meanResidual: mean };
    })
    .sort((a, b) => b.meanResidual - a.meanResidual);

  const k = Math.min(15, ranked.length);
  const topRes = ranked.slice(0, k);
  const astRanked = [...nodesRaw].sort((a, b) => b.astEntropy - a.astEntropy);
  const astTop = astRanked.slice(0, k);
  const sheafPrec = topRes.filter((n) => n.issueCount > 0).length / k;
  const astPrec = astTop.filter((n) => n.issueCount > 0).length / k;
  const sheafGold = goldRecall(
    ranked.filter((n) => n.level >= 2).map((n) => n.id),
    20,
    nodesRaw,
  );
  const astGold = goldRecall(
    astRanked.filter((n) => n.level >= 2).map((n) => n.id),
    20,
    nodesRaw,
  );

  const astCompression = tokenTotal ? 1 - globalGrams.size / tokenTotal : 0;
  const mem1 = process.memoryUsage().heapUsed;
  const dt = Date.now() - t0;
  const topEdges = [...graph.edges].sort((a, b) => b.residual - a.residual).slice(0, 12);

  mkdirSync(dirname(args.out), { recursive: true });
  writeFileSync(args.out, JSON.stringify(graph, null, 2) + "\n");

  const report = {
    repo: "langchain-ai/langchainjs",
    files: fileCount,
    loc: locTotal,
    tokens: tokenTotal,
    modulesKept: nodes.length,
    edges: graph.edges.length,
    energy,
    astUniqueGrams: globalGrams.size,
    astCompression,
    peakHeapMB: Math.round((mem1 / 1048576) * 10) / 10,
    elapsedMs: dt,
    dim: DIM,
    issueCount: issues.length,
    precisionAtK: {
      k,
      sheaf: sheafPrec,
      astEntropy: astPrec,
      sheafHits: topRes.filter((n) => n.issueCount > 0).length,
      astHits: astTop.filter((n) => n.issueCount > 0).length,
    },
    goldRecallAt20: { sheaf: sheafGold, ast: astGold },
    topResidual: topRes.slice(0, 10).map((n) => ({
      id: n.id,
      residual: Number(n.meanResidual.toFixed(3)),
      astEntropy: Number(n.astEntropy.toFixed(3)),
      issues: n.issueCount,
      issueIds: n.issueIds,
    })),
    topAstEntropy: astTop.slice(0, 8).map((n) => ({
      id: n.id,
      astEntropy: Number(n.astEntropy.toFixed(3)),
      issues: n.issueCount,
    })),
    loudestEdges: topEdges.map((e) => ({
      edge: `${e.source} → ${e.target}`,
      residual: Number(e.residual.toFixed(3)),
      kind: e.restrictKind,
      relation: e.relation,
    })),
  };

  if (args.report) {
    mkdirSync(dirname(args.report), { recursive: true });
    writeFileSync(args.report.replace(/\.md$/, ".json"), JSON.stringify(report, null, 2) + "\n");
    writeFileSync(args.report, renderMarkdown(report, graph));
  }

  console.log(JSON.stringify({ out: args.out, ...report, energy: Number(energy.toFixed(3)) }, null, 2));
}

function renderMarkdown(r, graph) {
  const rows = r.topResidual
    .map(
      (n) =>
        `| \`${n.id}\` | ${n.residual.toFixed(3)} | ${(n.astEntropy * 100).toFixed(1)}% | ${n.issues} | ${n.issueIds?.length ? n.issueIds.map((x) => `#${x}`).join(" ") : "—"} |`,
    )
    .join("\n");
  const goldRows = r.goldRecallAt20.sheaf.details
    .map((d) => `| [#${d.number}](https://github.com/langchain-ai/langchainjs/issues/${d.number}) | ${d.pkgs.join(", ")} | ${d.recovered ? "yes" : "no"} |`)
    .join("\n");
  return `# LangChain.js sheaf experiment

Repo: [${r.repo}](https://github.com/${r.repo})
Pinned contract: \`langchain-core\` runnables + messages (L0). Providers must restrict into that fibre.

## Scale (this run)

| | |
| --- | --- |
| Source files streamed | ${r.files} |
| LOC | ${r.loc.toLocaleString()} |
| Tokens | ${r.tokens.toLocaleString()} |
| Lattice nodes (pooled modules) | ${r.modulesKept} |
| Restriction edges | ${r.edges} |
| Stalk dim | ${r.dim} (LCEL/interface families, not LLM embeddings) |
| Dirichlet energy | ${r.energy.toFixed(3)} |
| Wall time | ${(r.elapsedMs / 1000).toFixed(1)}s |
| Heap | ${r.peakHeapMB} MB |

Memory stays bounded because files are read line-by-line; only a 16-dim section and a 20-bit gram set survive per module. Hierarchical pooling (\`file → module → lattice\`) is what makes the explorer playable. A million-line Java tree would use the same pipeline: stream, hash, pool, glue.

## Sheaf vs AST compression

AST compression ratio (1 − unique identifier-trigrams / tokens): **${(r.astCompression * 100).toFixed(1)}%**.
Wrappers look like wrappers. That is the point AST hashing *cannot* see.

| Ranker | Precision@${r.precisionAtK.k} | Gold LCEL-glue recall@20 |
| --- | --- | --- |
| Mean sheaf residual (contract edges) | ${(r.precisionAtK.sheaf * 100).toFixed(0)}% | **${(r.goldRecallAt20.sheaf.recall * 100).toFixed(0)}%** (${r.goldRecallAt20.sheaf.hit}/${r.goldRecallAt20.sheaf.total}) |
| AST entropy (least compressible) | ${(r.precisionAtK.astEntropy * 100).toFixed(0)}% | ${(r.goldRecallAt20.ast.recall * 100).toFixed(0)}% (${r.goldRecallAt20.ast.hit}/${r.goldRecallAt20.ast.total}) |

Gold set = hand-labeled open issues that *are* gluing failures: dropped callbacks (#11372), streamEvents (#11396, #11355), withStructuredOutput drift (#10956, #10307, #11381, #6795), tool_call streaming (#11311, #11293), provider converters (#11444, #11341).

${goldRows}

## Loudest modules (harmonic mismatch)

| Module | Mean residual | AST entropy | Issue hits | Issues |
| --- | --- | --- | --- | --- |
${rows}

## What to do in the explorer

Load **LangChain.js LCEL sheaf**. Peel to L0 to read the pinned contract. Raise layers to see provider wrappers. Terracotta edges into core are predicted refactor sites. Diffuse will not move L0; it pulls unknown wrappers toward the contract so leftover obstruction stays visible.

Residual meaning: ${graph.residualMeaning}
`;
}

const isMain =
  Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  main(parseArgs(process.argv.slice(2))).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main, FAMILIES };
