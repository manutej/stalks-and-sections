#!/usr/bin/env node
/**
 * Hermes-only SheafGraph walker.
 * Scores job.contract.families across **/*.{py,md} and updates
 * docs/examples/hermes-agent.json. NEVER imports from-code.mjs.
 *
 *   node scripts/sheaf/from-hermes.mjs --job templates/library/hermes-agent.json
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

const DEFAULT_FAMILIES = [
  { id: "loop", pattern: String.raw`\b(AIAgent|_run_agent_loop|run_conversation)\b` },
  { id: "prompt", pattern: String.raw`\b(prompt_builder|prompt_caching|system prompt|SOUL\.md)\b` },
  { id: "tools", pattern: String.raw`\b(registry\.register|handle_function_call|toolsets)\b` },
  { id: "state", pattern: String.raw`\b(SessionDB|hermes_state|FTS5)\b` },
  { id: "memory", pattern: String.raw`\b(memory_manager|MEMORY\.md|USER\.md|Honcho)\b` },
  { id: "skills", pattern: String.raw`\b(SKILL\.md|skills_hub|agentskills)\b` },
  { id: "providers", pattern: String.raw`\b(runtime_provider|chat_completions|anthropic_messages|codex_responses)\b` },
  { id: "gateway", pattern: String.raw`\b(GatewayRunner|gateway/run)\b` },
  { id: "cron", pattern: String.raw`\b(cron/jobs|scheduler)\b` },
  { id: "acp", pattern: String.raw`\b(acp_adapter|ACP)\b` },
  { id: "mcp", pattern: String.raw`\b(mcp_serve|mcp_tool|MCP)\b` },
  { id: "security", pattern: String.raw`\b(approval|HERMES_HOME|container isolation|DM pairing)\b` },
];

const SKIP = /(^|\/)(node_modules|\.git|dist|build|coverage|tests|tests-js|locales|__pycache__|\.venv|venv)(\/|$)/;

function parseArgs(argv) {
  const o = { job: null, root: null, out: null, report: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--job") o.job = argv[++i];
    else if (argv[i] === "--root") o.root = argv[++i];
    else if (argv[i] === "--out") o.out = argv[++i];
    else if (argv[i] === "--report") o.report = argv[++i];
  }
  return o;
}

async function walkFiles(root) {
  const out = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      const rel = relative(root, p).replaceAll("\\", "/");
      if (SKIP.test(rel)) continue;
      if (e.isDirectory()) await walk(p);
      else if (/\.(py|md)$/i.test(e.name)) out.push(rel);
    }
  }
  await walk(root);
  return out;
}

function scoreText(text, families) {
  return families.map((f) => {
    const m = text.match(f.re);
    return m ? m.length : 0;
  });
}

function l2norm(v) {
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return n < 1e-9 ? v.map(() => 0) : v.map((x) => x / n);
}

function nodeFor(rel, nodes) {
  const needle = rel.replaceAll("\\", "/");
  for (const n of nodes) {
    for (const s of n.sources || []) {
      const tail = String(s).replace(/^https?:\/\/[^/]+\//, "");
      if (tail.endsWith(needle) || tail.includes("/" + needle) || tail.includes(needle)) return n.id;
    }
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const jobPath = args.job ? resolve(process.cwd(), args.job) : resolve(repoRoot, "templates/library/hermes-agent.json");
  const job = existsSync(jobPath) ? JSON.parse(readFileSync(jobPath, "utf8")) : {};
  const root = resolve(process.cwd(), args.root || job.source?.root || "/tmp/hermes-agent");
  const outPath = resolve(process.cwd(), args.out || job.output?.sheaf || "docs/examples/hermes-agent.json");
  const reportPath = resolve(process.cwd(), args.report || job.output?.report || "docs/experiments/hermes-agent.md");
  const bakedPath = resolve(repoRoot, "docs/examples/hermes-agent.json");

  if (!existsSync(bakedPath)) {
    console.error("from-hermes: baked digest missing at", bakedPath);
    process.exit(2);
  }
  const graph = JSON.parse(readFileSync(bakedPath, "utf8"));
  graph.id = job.id || graph.id || "hermes-agent";
  if (job.title) graph.title = job.title;
  if (job.residualMeaning) graph.residualMeaning = job.residualMeaning;

  if (!existsSync(root)) {
    console.error("from-hermes: no clone at", root, "; shipped digest left in place.");
    process.exit(0);
  }

  const raw = job?.contract?.families?.length ? job.contract.families : DEFAULT_FAMILIES;
  const families = raw.map((f) => ({ id: f.id, re: new RegExp(f.pattern, "g") }));
  const files = await walkFiles(root);
  const corpus = families.map(() => 0);
  const perNode = new Map();
  let scanned = 0;
  for (const rel of files) {
    let text = "";
    try { text = readFileSync(resolve(root, rel), "utf8"); } catch { continue; }
    scanned++;
    const hits = scoreText(text, families);
    hits.forEach((h, i) => { corpus[i] += h; });
    const id = nodeFor(rel, graph.nodes || []);
    if (!id) continue;
    if (!perNode.has(id)) perNode.set(id, families.map(() => 0));
    const acc = perNode.get(id);
    hits.forEach((h, i) => { acc[i] += h; });
  }

  let updated = 0;
  for (const n of graph.nodes || []) {
    const hits = perNode.get(n.id);
    if (!hits) continue;
    const prior = Array.isArray(n.section) ? n.section.slice() : families.map(() => 0);
    while (prior.length < families.length) prior.push(0);
    n.section = l2norm(hits.map((h, i) => Math.log1p(h) + 0.25 * (prior[i] || 0)));
    n.dim = families.length;
    updated++;
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(graph, null, 2) + "\n");
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, [
    "# Hermes Agent digest",
    "",
    "Source-grounded sheaf of [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) plus official docs.",
    "",
    `- Graph: \`${relative(repoRoot, outPath)}\` (id \`${graph.id}\`)`,
    `- ${graph.nodes?.length ?? 0} nodes / ${graph.edges?.length ?? 0} edges / dim ${families.length}`,
    `- Scanned ${scanned} .py/.md files under ${root}; updated ${updated} sections`,
    "- Method: tree + docs digest. Do not run from-code.mjs or sheaf:rich on this repo.",
    "",
    "## Corpus family hits",
    "",
    ...families.map((f, i) => `- \`${f.id}\`: ${corpus[i]}`),
    "",
  ].join("\n"));
  console.error(`from-hermes: wrote ${outPath} (${graph.nodes.length} nodes, ${scanned} files)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
