# Viz spec — reproducible stills from any sheaf JSON

One encoding. Any graph. The picture changes with the data; the grammar does not.

| | |
| --- | --- |
| **Input contract** | [`docs/examples/sheaf.schema.json`](../examples/sheaf.schema.json) |
| **Encoding contract** | [`docs/viz/encoding.spec.json`](encoding.spec.json) |
| **Tokens / Bertin table** | [`src/lib/sheaf/viz/grammar.ts`](../../src/lib/sheaf/viz/grammar.ts) |
| **Exporter** | `node scripts/sheaf/emit-viz.mjs --in <sheaf.json> --out <dir>` |
| **Designer brief** | [`docs/VIZ.md`](../VIZ.md) |

## Input

A file is legal if it has `id`, `title`, `levels[]`, `nodes[]`, `edges[]` and validates against the sheaf schema. That includes:

- `docs/examples/hermes-agent.json`
- `docs/examples/discourse-triangle.json`
- `docs/examples/toy-kg.json`
- `docs/examples/wiki-integrity.json`
- a `lattice.json` dropped from [sheaf-port](https://github.com/manutej/sheaf-port)
- anything the dataset switcher already loads

`residual` on an edge is optional. If it is missing, the exporter uses a kind proxy (identity low, projection mid, type-aware high) and writes that fact in the manifest. It does not invent Gaussian sections.

## Reproduce

```bash
# one graph
node scripts/sheaf/emit-viz.mjs --in docs/examples/discourse-triangle.json --out docs/viz/discourse-triangle

# every example JSON except the schema
node scripts/sheaf/emit-viz.mjs --all

# default (hermes-agent → docs/viz/hermes-agent)
node scripts/sheaf/emit-viz.mjs
```

Each run writes, for that graph id:

| File | Reads |
| --- | --- |
| `census.svg` | title, stalk count, restriction count, kinds |
| `waist.svg` | `known` nodes |
| `claims.svg` | `restrictKind === "type-aware"` |
| `matrix.svg` | residual adjacency (edge list if n > 48) |
| `multiples.svg` | one row per level |
| `manifest.json` | input path, counts, whether residual was proxied |

Shared stills (same for every JSON) land in `docs/viz/`:

- `encoding-key.svg`
- `kind-marks.svg`

## Encoding (do not fork per dataset)

| Channel | JSON field | Rule |
| --- | --- | --- |
| Size | `node.dim` | radius ~ dimension |
| Hue | `node.level` | ordered `#4a9a92 → #6b8ea3 → #8a9a6e → #b08978` |
| Edge colour | `edge.residual` | diverging `#2f8f78 → #c4a574 → #c45c68` |
| Dash | `edge.restrictKind` | solid identity, dashed projection, dotted embed |
| Diamond | `edge.restrictKind` | type-aware only |
| Ring | `node.known` | pinned |
| Hex ring | `rooms[id]` or `pooledFrom` | enterable |

If a still uses hue for residual, it is out of spec.

## Test

`node --test scripts/sheaf/emit-viz.test.mjs` runs the exporter on **two** graphs (discourse-triangle and hermes-agent) and checks that titles differ while the palette hexes do not.
