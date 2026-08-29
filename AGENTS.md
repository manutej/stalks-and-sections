# AGENTS.md — Stalks & Sections

Grok Build / any coding agent: read this first. Deep context lives in `HANDOFF.md`.

## What this repo is

WebGL explorer of **cellular sheaves** on hierarchical knowledge graphs.
Variable-dimension stalks, typed restriction maps, sheaf-Laplacian residuals as visual variables.

- **Product surface:** `src/lib/sheaf/` (pure algebra) + `src/components/sheaf/` (Three.js lattice) + `src/store/sheaf.ts`
- **Ingest surface:** `schemas/`, `templates/`, `scripts/sheaf/`, `docs/examples/`
- **Do not extend:** `src/lib/auth/`, `src/lib/db.ts`, multiplayer, Postgres. Unused Grok App Builder scaffolding.

Live site intent: drop a sheaf JSON → review residuals in 3D strata and (soon) 2D slice / matrix.

## Run

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm run sheaf:validate -- docs/examples/discourse-triangle.json
```

## Invariants — do not break

1. `node.section.length === node.dim`
2. `Fsrc: source.dim → edgeDim`, `Ftgt: target.dim → edgeDim`
3. Diffuse **does not increase** Dirichlet energy; boundary drift ≈ 0 on `known` stalks
4. Residual colour is diverging teal → terracotta. Size = dim. Hue = **ordered** hierarchy. No rainbow.
5. Drei `Html` labels are `pointer-events: none` (`.sheaf-html-wrap`)
6. `select(null)` always sets `mobilePanel: "none"` (Close / Esc / empty-plane must exit inspector)
7. Missing imported `section` → **zeros**, never Gaussian
8. Cap a playable lattice at ~120 nodes after pooling

If a change violates 3, 4, 6, or 7, it is not an enhancement.

## Where to touch

```
src/lib/sheaf/          algebra — keep pure, no React
src/store/sheaf.ts      only app state
src/components/sheaf/   Scene + Dock + Inspector + Guide + Hint
schemas/                sheaf-graph / library-ingest / catalog
scripts/sheaf/          generate, validate, from-code, rich-index, algebra
templates/              kg + library job templates
docs/examples/          drop-in graphs (id = filename)
docs/INGEST.md          scraper contract
docs/GENERATE.md        triples / wiki / codebase → sheaf
HANDOFF.md              adversarial eval + PR sequence
```

## Add a graph

```bash
cp templates/kg/triples.json /tmp/my-kg.json
# edit nodes + triples; every coordinate must mean something
npm run sheaf:generate -- --from /tmp/my-kg.json --out docs/examples/my-kg.json
npm run sheaf:validate -- docs/examples/my-kg.json
# add a row to docs/examples/catalog.json; restart
```

Codebase path (LangChain.js worked example):

```bash
git clone --depth 1 https://github.com/langchain-ai/langchainjs.git /tmp/langchainjs
npm run sheaf:langchainjs
npm run sheaf:rich
```

## Enhancement order (from HANDOFF §8)

Work on branch `enhancement`. One concern per PR.

1. Generic loader polish + file-drop (#5, #11)
2. Discourse triangle as first-class dataset (#6)
3. Kernel-dimension HUD (#10) + energy tests (#7)
4. Bertin matrix (#1) → small multiples (#2) → slice (#4)
5. Spectral layout from \(L_F\) (#9)
6. Restriction-kind marks (#8) + example pack (#12)

If you can only ship one pair: **loader + discourse triangle**.

## Eval honesty

LangChain.js lattice: **88 pooled modules**, 531 edges, 16-dim interface-family stalks (not LLM embeddings), 1 041 files / 202k LOC / ~1s / 39MB.
Gold LCEL-glue recall@20: sheaf 56% vs AST 39%. Precision@15 is noise (base rate ~56%) — do not cite it as a win.
Findings dashboard: `docs/experiments/langchainjs-sheaf-findings.html`.

Do not write “sheaf beats graph” unless the metric has a labeled gold set and a stated base rate.

## Non-goals

Accounts, rainbow maps, common ambient stalk dimension, replacing \(L_F\) with a GNN, vendoring PDFs, changing Grok PWA chrome unless it blocks a view.
