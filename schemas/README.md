# Schemas

Canonical JSON Schema (Draft 2020-12) for every object this repo loads.

| File | Who reads it | What it is |
| --- | --- | --- |
| [`sheaf-graph.schema.json`](sheaf-graph.schema.json) | explorer, `sheaf:validate`, scrapers | One lattice: levels, stalks, restriction edges |
| [`library-ingest.schema.json`](library-ingest.schema.json) | `sheaf:ingest`, CI, humans | How to scrape a library into a SheafGraph |
| [`catalog.schema.json`](catalog.schema.json) | scrapers, docs | Explicit list of graphs in `docs/examples/` |

Shipped copy used by older docs: [`../docs/examples/sheaf.schema.json`](../docs/examples/sheaf.schema.json) — keep in sync with `sheaf-graph.schema.json`.

## Validate

```bash
npm run sheaf:validate -- docs/examples/discourse-triangle.json
npm run sheaf:validate -- docs/examples/langchainjs.json
```

The CLI validator (`scripts/sheaf/schema.mjs`) is the runtime contract. The JSON Schema files are the scraper-facing spec.

## Loader rules (do not violate)

1. Missing `section` → **zeros**, never random / Gaussian.
2. Missing `Fsrc` / `Ftgt` → built from `restrictKind` (`identity` | `projection` | `embed` | `spectral` | `type-aware`).
3. Node `id` is slug-safe. Loader lowercases and turns other characters into `-`.
4. `edges` and `triples` are aliases (`source`/`subject`, `target`/`object`, `relation`/`predicate`).
5. `known: true` stalks are frozen under Diffuse / harmonic extension.
6. Drop a valid `docs/examples/<id>.json` and restart — `src/lib/sheaf/catalog.ts` globs it.

Full ingest walkthrough: [`../docs/INGEST.md`](../docs/INGEST.md).
