---
name: sheaf-ingest
description: Turn triples, CSV, wiki markdown, or a JS/TS codebase into a SheafGraph JSON the explorer can load. Use when adding a knowledge graph, scraping a library, validating sheaf JSON, or running from-code / rich-index.
version: 1
---

# Sheaf ingest

## Contract

A loadable graph MUST satisfy `schemas/sheaf-graph.schema.json`.

- Missing `section` → zeros. Never Gaussian-fill a real graph.
- Missing `Fsrc`/`Ftgt` → rebuild from `restrictKind`.
- `residualMeaning` is one domain sentence.
- Cap playable lattices at ~120 nodes after pooling.
- Do not put colours on nodes or edges.

Read `docs/INGEST.md` and `docs/GENERATE.md` before writing a new extractor.

## Fast paths

### Triples / CSV / wiki

```bash
cp templates/kg/triples.json /tmp/my-kg.json
npm run sheaf:generate -- --from /tmp/my-kg.json --out docs/examples/my-kg.json
npm run sheaf:validate -- docs/examples/my-kg.json
```

Wiki folder: `npm run sheaf:generate -- --from-wiki docs/sources --out docs/examples/wiki-integrity.json`

### Codebase

```bash
git clone --depth 1 https://github.com/ORG/REPO.git /tmp/lib
node scripts/sheaf/from-code.mjs --root /tmp/lib --out docs/examples/my-lib.json --cap 88
```

Worked job: `templates/library/langchainjs.json`.
Rich three-level index: `scripts/sheaf/rich-index.mjs`.

### Drop-in

Write `docs/examples/<id>.json` where `<id>` equals the object's `id`.
Add a row to `docs/examples/catalog.json`. Restart the app.

## Templates

| File | Use |
| --- | --- |
| `templates/kg/triples.json` | Entities + relations + optional sections |
| `templates/kg/triples.csv` | Topology sketch (zeros) |
| `templates/kg/nodes-edges.json` | Already have maps |
| `templates/library/minimal-sheaf.json` | Smallest valid SheafGraph |
| `templates/library/scrape.json` | Generic library job |
| `templates/library/langchainjs.json` | LCEL worked example |

## Done when

1. `sheaf:validate` exits 0.
2. At least one teal (consistent) and one terracotta (noisy) restriction you can explain.
3. Pinned (`known: true`) stalks are the facts Diffuse must not move.
4. Catalog row exists.
5. No claim of “sheaf beats baseline” without a labeled gold set and a base rate.
