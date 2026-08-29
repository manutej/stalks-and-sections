# Ingest a library or a JSON sheaf

This is the scraper-facing contract. The explorer only loads objects that satisfy
[`schemas/sheaf-graph.schema.json`](../schemas/sheaf-graph.schema.json). Everything
else in this folder exists to *produce* that object.

| You have | You do |
| --- | --- |
| A finished SheafGraph JSON | Drop it in `docs/examples/<id>.json`, validate, restart |
| Triples / CSV / wiki markdown | `npm run sheaf:generate` → same drop path |
| A TypeScript / JS monorepo | Write a LibraryIngest job → `npm run sheaf:ingest` |
| A foreign scraper | Emit SheafGraph JSON. Do not invent extra required keys |

Canonical specs:

| Schema | Who reads it |
| --- | --- |
| [`schemas/sheaf-graph.schema.json`](../schemas/sheaf-graph.schema.json) | explorer, `sheaf:validate`, every scraper |
| [`schemas/library-ingest.schema.json`](../schemas/library-ingest.schema.json) | `sheaf:ingest`, CI, humans writing a scrape job |
| [`schemas/catalog.schema.json`](../schemas/catalog.schema.json) | explicit graph list + provenance |

Shipped alias (keep in sync): [`examples/sheaf.schema.json`](examples/sheaf.schema.json).

## 1. Drop-in JSON (fastest path)

A scraper writes one file: `docs/examples/<id>.json`.
`<id>` must equal the object's `id` field and match `^[a-z0-9][a-z0-9._-]*$`.

```bash
npm run sheaf:validate -- docs/examples/<id>.json
```

Add a row to [`examples/catalog.json`](examples/catalog.json). Restart the app.
`src/lib/sheaf/catalog.ts` globs every `docs/examples/*.json` except the schema
and the catalog itself.

Minimum valid object: [`templates/library/minimal-sheaf.json`](../templates/library/minimal-sheaf.json).

## 2. Required elements a scraper MUST emit

Loader: `src/lib/sheaf/from-json.ts`. CLI: `scripts/sheaf/schema.mjs`.

**Root:** `id`, `title`, `levels`, `nodes`, and `edges` or `triples`.
`residualMeaning` is strongly required (validator warns).

**Each node:** `id`, `title`, `level`, `dim` (1–64). Optional: `kind`, `section`
(omit → zeros, never Gaussian), `known`, `summary`, `sources`, `arxiv`,
`aliases`, `pooledFrom`.

**Each edge:** `source`/`subject`, `target`/`object`. Optional: `relation`/`predicate`,
`restrictKind` (`identity` | `projection` | `embed` | `spectral` | `type-aware`),
`edgeDim`, `Fsrc`, `Ftgt` (omit both → rebuilt from restrictKind), `translation`,
`residual` (recomputed on load), `note`.

## 3. Loader rules (do not violate)

1. Missing `section` → **zeros**, never random / Gaussian.
2. Missing `Fsrc` / `Ftgt` → built from `restrictKind`.
3. Node `id` is slug-safe. Loader lowercases and turns other characters into `-`.
4. `edges` and `triples` are aliases (`source`/`subject`, `target`/`object`, `relation`/`predicate`).
5. `known: true` stalks are frozen under Diffuse / harmonic extension.
6. Compact JSON is allowed: omit maps, omit zero sections. The loader rebuilds.
7. Do not force every stalk into the same dimension.
8. Do not put a colour on a node or edge.
9. Cap a playable lattice at ~120 nodes after pooling.

## 4. Ingest a library from source

```bash
git clone --depth 1 https://github.com/org/my-lib.git /tmp/my-lib
cp templates/library/scrape.json /tmp/my-lib.ingest.json
npm run sheaf:ingest -- --job /tmp/my-lib.ingest.json
npm run sheaf:validate -- docs/examples/my-lib.json
```

`sheaf:ingest` reads the job and dispatches:

| `kind` | Script |
| --- | --- |
| `codebase` + segmentation includes `api` | `scripts/sheaf/rich-index.mjs` |
| `codebase` | `scripts/sheaf/from-code.mjs` |
| `triples` / `csv` / `sheaf` | `scripts/sheaf/generate.mjs --from` |
| `wiki` | `scripts/sheaf/generate.mjs --from-wiki` |

`source.root` must already exist. The ingest script will not clone for you.

Worked LCEL job: [`templates/library/langchainjs.json`](../templates/library/langchainjs.json).

```bash
git clone --depth 1 https://github.com/langchain-ai/langchainjs.git /tmp/langchainjs
npm run sheaf:langchainjs
npm run sheaf:rich
```

## 5. Catalog

[`docs/examples/catalog.json`](examples/catalog.json) is the explicit list.
The live app also auto-globs `docs/examples/*.json`. `sheaf.schema.json` and
`catalog.json` themselves are not graphs.

## 6. Do not

- Sample Gaussians on a real graph (`--sample-sections` is a demo flag).
- Commit matrices you cannot rebuild from `restrictKind` + dims — omit them.
- Change required keys without updating the schema, `scripts/sheaf/schema.mjs`,
  and `src/lib/sheaf/from-json.ts` in the same commit.
- Ship a lattice larger than ~120 nodes without pooling.
- Force “sheaf beats graph” in eval write-ups.
