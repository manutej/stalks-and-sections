#!/usr/bin/env node
/**
 * Thin ingest dispatcher.
 *
 *   kind=sheaf|triples|csv  → generate.mjs --from
 *   kind=wiki               → generate.mjs --from-wiki
 *   hermes-agent / hermes-* → from-hermes.mjs   (never from-code.mjs)
 *   kind=codebase TS/JS     → from-code.mjs / rich-index.mjs
 *   kind=codebase Python    → refused
 *
 *   node scripts/sheaf/ingest.mjs --job templates/library/hermes-agent.json
 */
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

const NEVER_LCEL = /^(hermes)(-|$)/i;
const HERMES_PINS = new Set([
  "agent-loop",
  "tool-protocol",
  "session-state",
  "prompt-tiers",
  "provider-transport",
  "profile-isolation",
]);
const HERMES_SEG = new Set(["runtime", "subsystem", "surface"]);

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

function isHermesJob(job) {
  const id = String(job.id || "");
  if (NEVER_LCEL.test(id)) return "id " + id;
  const git = String(job.source?.git || "");
  if (/hermes-agent/i.test(git)) return "git " + git;
  const pinned = job.contract?.pinned || [];
  if (pinned.some((p) => HERMES_PINS.has(String(p)))) return "pinned Hermes contract";
  const seg = job.segmentation || [];
  if (seg.some((s) => HERMES_SEG.has(String(s)))) return "segmentation runtime|subsystem|surface";
  const families = (job.contract?.families || []).map((f) => f.id);
  if (families.includes("loop") && families.includes("gateway") && families.includes("acp")) {
    return "Hermes family set";
  }
  return null;
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
  console.error("from-code.mjs / rich-index.mjs pin langchain-core and must not run here.");
  console.error("For Hermes use: npm run sheaf:ingest -- --job templates/library/hermes-agent.json");
  process.exit(2);
}

async function main(args) {
  if (args.help || !args.job) {
    console.log(`usage: node scripts/sheaf/ingest.mjs --job <library-ingest.json>\n\n  sheaf | triples | csv     → generate.mjs\n  wiki                      → generate.mjs --from-wiki\n  hermes-agent              → from-hermes.mjs\n  codebase TS/JS (not Hermes) → from-code.mjs / rich-index.mjs\n`);
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

  const hermesWhy = isHermesJob(job);
  if (hermesWhy) {
    console.error(`sheaf:ingest: Hermes job (${hermesWhy}) → from-hermes.mjs`);
    const a = ["--job", jobPath];
    if (out) a.push("--out", out);
    if (report) a.push("--report", report);
    run("from-hermes.mjs", a);
  }

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
      process.exit(2);
    }
    const counts = await looksLikeTsMonorepo(root);
    if (counts.ts < 8) refusePython(job, counts);
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
