# Adding a dataset

A dataset is a `SheafGraph`: levels, nodes with stalks, edges with restriction maps. The store loads one via `loadGraph(id)` in `src/lib/sheaf/index.ts`.

## 1. Declare the id

In `src/lib/sheaf/types.ts`:

```ts
export type DatasetId = "literature" | "cobb" | "my-graph";
```

## 2. Write the specs

Follow `src/lib/sheaf/lattice.ts` / `cobb.ts`. You describe **intent**; `buildGraph` builds the numeric maps.

```ts
const N: NodeSpec[] = [
  {
    id: "entity-a",
    title: "Entity A",
    kind: "concept",       // paper | concept | algorithm | theorem | model | integrity
    level: 0,              // 0..3
    dim: 4,                // stalk dimension, 2–16
    known: true,           // pinned during Diffuse
    summary: "…",
    sources: ["S1"],
  },
];

const E: EdgeSpec[] = [
  {
    source: "entity-a",
    target: "entity-b",
    relation: "restricts",
    restrictKind: "projection", // identity | projection | embed | spectral | type-aware
  },
];
```

`build.ts` samples a section in \(\mathbb{R}^{\mathrm{dim}}\) and a pair of maps into a shared edge stalk. Override `section`, `Fsrc`, `Ftgt`, or `translation` on the spec when you have real numbers (the Cobb seed does this for TransE).

## 3. Register

```ts
// src/lib/sheaf/index.ts
export function loadGraph(id: DatasetId): SheafGraph {
  if (id === "cobb") return cobbGraph();
  if (id === "my-graph") return myGraph();
  return literatureGraph();
}
```

Add a dataset button in `TopBar.tsx` and a `HINTS` entry in `Hint.tsx`.

## 4. Prove it

- Energy is finite after load
- Diffuse does not increase energy
- Known stalks do not drift (`boundaryDrift ≈ 0`)
- Screenshot the four layers and one selected stalk

JSON import (Roadmap v1.2) will replace this boilerplate with a file drop. Until then, a module is the API.
