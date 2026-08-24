# Adding a dataset

**Canonical path:** [`GENERATE.md`](GENERATE.md) — JSON spec, templates, and generator CLI.

A dataset is a `SheafGraph`: levels, nodes with stalks, edges with restriction maps.

## Preferred: generate JSON

```bash
cp templates/kg/triples.json /tmp/my-kg.json
# edit nodes + triples (give every coordinate a meaning)
npm run sheaf:generate -- --from /tmp/my-kg.json --out docs/examples/my-kg.json
npm run sheaf:validate -- docs/examples/my-kg.json
```

Put the file in `docs/examples/`. The catalog (`src/lib/sheaf/catalog.ts`) loads every JSON there except the schema. Restart the app; pick it in the dataset switcher.

Hand-authored sheaves (maps already filled) also belong in `docs/examples/` — see `discourse-triangle.json`.

## Builtin TypeScript graphs

`literature` and `cobb` still live in `src/lib/sheaf/lattice.ts` and `cobb.ts`. Use that path only when the graph is part of the algebra demo (closed-form TransE, sampled literature sections). New knowledge graphs should be JSON.

## Loader rules

`src/lib/sheaf/from-json.ts`:

- Missing `section` → **zeros**, never Gaussians
- Missing `Fsrc`/`Ftgt` → built from `restrictKind`
- `kind` and `level` are data, not a closed TypeScript union
