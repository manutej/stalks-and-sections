# Generate a sheaf from a knowledge graph

This is the contract for turning **any** knowledge graph into a lattice the explorer can load.

| Piece | Path |
| --- | --- |
| JSON Schema | [`docs/examples/sheaf.schema.json`](examples/sheaf.schema.json) |
| Input templates | [`templates/kg/`](../templates/kg/) |
| Generator | [`scripts/sheaf/generate.mjs`](../scripts/sheaf/generate.mjs) |
| Validator | [`scripts/sheaf/validate.mjs`](../scripts/sheaf/validate.mjs) |
| Runtime loader | [`src/lib/sheaf/from-json.ts`](../src/lib/sheaf/from-json.ts) |

Do not Gaussian-fill a real graph. If a stalk has no `section`, it is **zero** (unknown), not noise.

## 3 commands

```bash
# 1. Copy a template and edit nodes + triples (or start from CSV)
cp templates/kg/triples.json /tmp/my-kg.json

# 2. Compile restriction maps + residuals
npm run sheaf:generate -- --from /tmp/my-kg.json --out docs/examples/my-kg.json

# 3. Check the contract
npm run sheaf:validate -- docs/examples/my-kg.json
```

Regenerate the shipped examples:

```bash
npm run sheaf:examples
```

Drop the JSON in `docs/examples/` (id = filename without `.json`). The catalog picks it up. Restart the app. The new graph appears in the dataset switcher.

## Input shapes

### A. Triples JSON (preferred)

See [`templates/kg/triples.json`](../templates/kg/triples.json).

```json
{
  "id": "my-kg",
  "title": "…",
  "residualMeaning": "One sentence a reviewer can quote.",
  "levels": [{ "id": 0, "label": "…" }],
  "nodes": [
    {
      "id": "paris",
      "title": "Paris",
      "kind": "entity",
      "level": 2,
      "dim": 4,
      "known": true,
      "section": [1, 0, 0, 0]
    }
  ],
  "triples": [
    {
      "source": "paris",
      "relation": "capital_of",
      "target": "france",
      "restrictKind": "identity",
      "translation": [0, 1, 0, 0]
    }
  ]
}
```

Nodes listed in triples but missing from `nodes` are created with default dim/kind. **They get zero sections** unless you pass `--sample-sections` (demo only).

### B. CSV

See [`templates/kg/triples.csv`](../templates/kg/triples.csv). Header: `source,relation,target[,restrictKind]`.

```bash
npm run sheaf:generate -- --from templates/kg/triples.csv --out docs/examples/from-csv.json
```

CSV has no sections → zeros. Use it to sketch topology, then add vectors in JSON.

### C. Wiki markdown folder

Each `.md` with YAML frontmatter (`id`, `title`, `type`, `sources`) becomes a stalk. Lines under `## Relations` of the form `- is_a [[other-page]]` become restriction maps. Kind/dim/level are inferred from `type`.

```bash
npm run sheaf:generate -- --from-wiki docs/sources --out docs/examples/wiki-integrity.json
```

### D. Already a sheaf

If you already have `Fsrc` / `Ftgt` / `section`, put them on the nodes and triples. The generator will not overwrite maps you supply. `nodes-edges.json` is the blank form: [`templates/kg/nodes-edges.json`](../templates/kg/nodes-edges.json).

## Restriction kinds

| `restrictKind` | Typical relation | Map |
| --- | --- | --- |
| `identity` | same space, TransE, `uses` | projection onto `min(dim)` |
| `projection` | `is_a`, `part_of`, `expresses` | keep a subspace |
| `embed` | `extends`, `defines`, `capital_of` | pad into a larger fibre |
| `spectral` | default / unknown | seeded orthonormal rows |
| `type-aware` | `proves`, `authored_by` | sparse signed rows |

Omit `restrictKind` and the generator picks from the relation name (`scripts/sheaf/algebra.mjs` `kindForRelation`).

## What “good” looks like

1. **Every coordinate has a meaning** written in the node `summary` or the graph `blurb`.
2. **`residualMeaning` is one sentence** in the domain (not “the math residual”).
3. **At least one triple is designed to be teal** and **one is designed to be terracotta**, so a reviewer can see the scale work.
4. **Pinned (`known: true`) stalks** are the facts Diffuse is not allowed to move.
5. Validator exits 0. Dirichlet energy is finite. `section.length === dim`.

The shipped **Geo fragment** (`docs/examples/toy-kg.json`) is the reference: Paris→France is a clean TransE triple; Paris→Europe is a noisy skip.

## Runtime

`src/lib/sheaf/from-json.ts` accepts the same JSON. Missing maps are built from `restrictKind`. Missing sections are zeros. The store’s dataset switcher lists every `docs/examples/*.json` except the schema file, plus the two builtin graphs (`literature`, `cobb`).

## Do not

- Sample Gaussians on a real KG (`--sample-sections` is a demo flag).
- Force every stalk into the same dimension.
- Use a rainbow colour for residual or level — the explorer will ignore it.
- Commit a graph whose terracotta edges you cannot explain.
