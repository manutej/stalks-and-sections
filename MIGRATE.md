# MIGRATE — drop this folder into Grok Build

This archive is a **source snapshot** of [manutej/stalks-and-sections](https://github.com/manutej/stalks-and-sections) prepared so a new Grok Build session (CLI or grok.com Build) can keep working without re-deriving the sheaf contract.

Commit pinned in this pack: see `VERSION.txt`.

## What you just unzipped

```
stalks-and-sections/
  AGENTS.md                 ← Grok Build / Codex / Aider project rules (read first)
  CLAUDE.md                 ← one-line bridge to AGENTS.md
  HANDOFF.md                ← adversarial eval + PR sequence
  MIGRATE.md                ← this file
  schemas/                  ← sheaf-graph, library-ingest, catalog
  templates/kg/             ← triples / CSV / nodes-edges
  templates/library/        ← scrape + langchainjs + minimal-sheaf jobs
  scripts/sheaf/            ← generate, validate, from-code, rich-index, algebra
  docs/examples/            ← loadable graphs including langchainjs.json
  docs/experiments/         ← LCEL eval + findings dashboard
  docs/INGEST.md            ← scraper contract
  docs/GENERATE.md          ← how to mint a new graph
  src/lib/sheaf/            ← algebra
  src/components/sheaf/     ← WebGL explorer
  .grok/skills/             ← Grok Build skills (ingest + enhance)
```

No `node_modules`. No secrets. Auth / Postgres scaffolding is present but unused — do not extend it.

## Path A — Grok Build CLI (x.ai/cli)

```bash
unzip stalks-and-sections-grok-build.zip
cd stalks-and-sections
npm install
grok inspect          # should list AGENTS.md + .grok/skills/*
grok                  # or: grok -p "Read AGENTS.md and HANDOFF.md. Continue PR 1 (generic loader)."
```

First useful prompts:

```
Read AGENTS.md and HANDOFF.md §8. Implement PR 1: generic sheaf JSON loader + dataset switcher. Do not touch auth.
Explain how to add a new knowledge graph from triples.
Run sheaf:validate on every file in docs/examples/.
```

## Path B — grok.com Build / App Builder

1. Unzip.
2. Open the folder as the project root (the directory that contains `package.json` and `AGENTS.md`).
3. If the builder asks for a start command: `npm install && npm run dev` (already in `startup.sh`, binds `0.0.0.0:8080`).
4. Paste this as the first message:

> This is Stalks & Sections. Read AGENTS.md then HANDOFF.md. Do not extend src/lib/auth. Next work is HANDOFF §8 PR 1 (generic JSON loader) unless I name a different ticket.

Grok PWA chrome under `public/__grok/` and `scripts/grok-pwa-*` is already wired. Leave it alone unless it blocks a view.

## Path C — plain Vite, no agent

```bash
npm install
npm run dev
```

Open the printed URL. Dataset switcher should list Literature, Cobb, Discourse triangle, Geo fragment, Wiki integrity, LangChain.js, LangChain.js rich.

## Verify the pack

```bash
test -f AGENTS.md && test -f schemas/sheaf-graph.schema.json
test -f templates/library/minimal-sheaf.json
test -f scripts/sheaf/from-code.mjs
test -f docs/examples/langchainjs.json
npm run sheaf:validate -- docs/examples/discourse-triangle.json
npm run sheaf:validate -- docs/examples/langchainjs.json
```

Expected: validator exit 0. LangChain.js graph is compact (maps rebuilt from `restrictKind` on load).

## Mint a new graph in the next session

```bash
cp templates/kg/triples.json /tmp/my-kg.json
# edit — every stalk coordinate needs a meaning; write residualMeaning
npm run sheaf:generate -- --from /tmp/my-kg.json --out docs/examples/my-kg.json
npm run sheaf:validate -- docs/examples/my-kg.json
# add a row to docs/examples/catalog.json
```

Codebase:

```bash
git clone --depth 1 https://github.com/ORG/REPO.git /tmp/lib
cp templates/library/scrape.json /tmp/lib.ingest.json
# edit source.root, id, out
node scripts/sheaf/from-code.mjs --root /tmp/lib --out docs/examples/my-lib.json --cap 88
```

Full contract: `docs/INGEST.md`.

## What this pack is not

- A substitute for `git clone git@github.com:manutej/stalks-and-sections.git`
- A release binary
- An evaluation claim that sheaf beats AST on precision (it does not; see findings HTML)

After unzipping, prefer `git remote -v` + `git pull` if you need commits newer than `VERSION.txt`.
