#!/usr/bin/env node
/**
 * Thin ingest dispatcher.
 *
 * Docs historically claimed `npm run sheaf:ingest`. Until this file existed
 * that command was a stub. This dispatcher is honest about what it can run:
 *
 *   kind=sheaf|triples|csv  → generate.mjs --from
 *   kind=wiki               → generate.mjs --from-wiki
 *   kind=codebase           → from-code.mjs / rich-index.mjs ONLY if the
 *                             tree looks like a TS/JS monorepo with .ts files.
 *                             Python / Hermes / mixed trees are refused with
 *                             the drop-JSON recipe — do not pretend to scrape.
 *
 *   node scripts/sheaf/ingest.mjs --job templates/library/scrape.json
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

function parseArgs(argv) {
  const o = { job: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--job") o.job = argv[++i];
    else if (argv[i] === "-h" || argv[i] === "--help") o.help = true;
  }
  return o;
}

function run(script, args) {
  const r = spawnSync(process.execPath, [resolve(here, script), ...args], {
    stdio: "inherit",
    cwd: repoRoot,
  });
  process.exit(r.status ?? 1);
}

async function looksLikeTsMonorepo(root) {
  const SKIP = /(^|\/)(node_modules|\.git|dist|build|coverage)(\/|$)/;
  async function walk(dir, acc, budget) {
    if (acc.ts >= 8 || budget <= 0) return acc;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return acc;
    }
    for (const e of entries) {
      const p = `${dir}/${e.name}`;
      if (SKIP.test(p)) continue;
      if (e.isDirectory()) await walk(p, acc, budget - 1);
      else if (/\.tsx?$/.test(e.name) && !e.name.endsWith(".d.ts")) acc.ts++;
      else if (/\.py$/.test(e.name)) acc.py++;
    }
    return acc;
  }
  return walk(root, { ts: 0, py: 0 }, 40);
}

function refusePython(job, counts) {
  const id = job.id || "library";
  console.error(`sheaf:ingest: ${id} is not a TypeScript/JS monorepo (found ${counts.py} .py vs ${counts.ts} .ts).`);
  console.error("");
  console.error("The shipped extractors (from-code.mjs, rich-index.mjs) are LCEL/TS-shaped:");
  console.error("  they walk libs/, score LCEL families, and pin langchain-core runnables.");
  console.error("They will not digest Hermes, a Python harness, or mixed docs.");
  console.error("");
  console.error("Working path today:");
  console.error(`  1. Author docs/examples/${id}.json against schemas/sheaf-graph.schema.json`);
  console.error("     (see templates/library/minimal-sheaf.json and docs/examples/hermes-agent.json).");
  console.error(`  2. npm run sheaf:validate -- docs/examples/${id}.json`);
  console.error("  3. Add a row to docs/examples/catalog.json and restart.");
  console.error("");
  console.error("A generic LibraryIngest walker that reads job.contract.families");
  console.error("across languages is not implemented. Do not invent one in this command.");
  process.exit(2);
}

async function main(args) {
  if (args.help || !args.job) {
    console.log(`usage: node scripts/sheaf/ingest.mjs --job <library-ingest.json>

Dispatches a LibraryIngest job.
  sheaf | triples | csv  → scripts/sheaf/generate.mjs --from
  wiki                   → scripts/sheaf/generate.mjs --from-wiki
  codebase (TS/JS)       → from-code.mjs or rich-index.mjs
  codebase (Python/other)→ refused; drop a SheafGraph JSON instead
`);
    process.exit(args.help ? 0 : 2);
  }

  const jobPath = resolve(process.cwd(), args.job);
  if (!existsSync(jobPath)) {
    console.error(`job not found: ${jobPath}`);
    process.exit(2);
  }
  const job = JSON.parse(readFileSync(jobPath, "utf8"));
  const kind = job.kind || "codebase";
  const out = job.output?.sheaf;
  const report = job.output?.report;
  const cap = String(job.cap ?? 96);

  if (kind === "wiki") {
    const from = job.source?.root || job.source?.wiki;
    if (!from) {
      console.error("wiki job needs source.root");
      process.exit(2);
    }
    const a = ["--from-wiki", from];
    if (out) a.push("--out", out);
    run("generate.mjs", a);
  }

  if (kind === "sheaf" || kind === "triples" || kind === "csv") {
    const from = job.source?.file || job.source?.root;
    if (!from) {
      console.error(`${kind} job needs source.file or source.root`);
      process.exit(2);
    }
    const a = ["--from", from];
    if (out) a.push("--out", out);
    run("generate.mjs", a);
  }

  if (kind === "codebase") {
    const root = job.source?.root;
    if (!root || !existsSync(root)) {
      console.error("codebase job needs an existing source.root (clone the repo yourself).");
      console.error("ingest.mjs will not git clone.");
      process.exit(2);
    }
    const counts = await looksLikeTsMonorepo(root);
    if (counts.ts < 8) {
      refusePython(job, counts);
    }
    const segmentation = job.segmentation || [];
    const script = segmentation.includes("api") ? "rich-index.mjs" : "from-code.mjs";
    const a = ["--root", root, "--cap", cap];
    if (out) a.push("--out", out);
    if (report) a.push("--report", report);
    console.error(`sheaf:ingest: dispatching ${script} (TS/JS tree: ${counts.ts} files)`);
    run(script, a);
  }

  console.error(`unknown kind: ${kind}`);
  process.exit(2);
}

main(parseArgs(process.argv.slice(2))).catch((err) => {
  console.error(err);
  process.exit(1);
});
