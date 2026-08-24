# Architecture

Stalks & Sections is a **client-side sheaf engine** with a WebGL lattice on top. There is no server state. Auth and Postgres scaffolding in `src/lib/auth` and `src/lib/db.ts` is unused by the explorer — leave it alone unless you are adding accounts.

## Data flow

```
loadGraph(dataset)
    │
    ├─ literatureGraph()     src/lib/sheaf/lattice.ts
    └─ cobbGraph()           src/lib/sheaf/cobb.ts
            │
            ▼
    buildGraph(nodes, edges) src/lib/sheaf/build.ts
            │  stalks, restriction maps F_s, F_t, residuals
            ▼
    layoutForce(...)         src/lib/sheaf/layout.ts
            │
            ▼
    zustand store            src/store/sheaf.ts
            │
            ├─ Scene.tsx     3D lattice, labels, planes
            ├─ Inspector     stalk plot + neighbour residuals
            └─ Dock          Diffuse / Coarsen / filters
```

## Algebra (`src/lib/sheaf`)

| File | Responsibility |
| --- | --- |
| `types.ts` | `SheafNode`, `SheafEdge`, `RestrictionKind`, `DatasetId` |
| `maps.ts` | Restriction builders: identity, projection, embed, spectral, type-aware |
| `linear.ts` | Small dense linear algebra used by maps and plots |
| `energy.ts` | Coboundary, Dirichlet energy, per-edge residual |
| `diffuse.ts` | Degree-normalised Euler step on \(L_F\); known stalks frozen |
| `closed-form.ts` | TransE / identity-case harmonic extension (Cobb graph) |
| `pool.ts` | HiSP-style coarsening to supernodes |
| `build.ts` | Turn `{NodeSpec, EdgeSpec}` into numeric stalks + maps |
| `layout.ts` | Seeded rings per level + xz force; `y = level * LAYER_Z` |
| `palette.ts` | Bertin-correct hues, residual scale, labels |
| `rng.ts` | Seeded PRNG so plots and layouts are stable |

### Invariants the UI depends on

- `node.section.length === node.dim`
- `edge.Fsrc` maps `source.dim → edgeDim`, `edge.Ftgt` maps `target.dim → edgeDim`
- `recomputeResiduals` is called after every Diffuse / Exact / import
- Known (`node.known`) stalks do not move during Diffuse
- Energy on the Cobb seed is monotonically non-increasing under Diffuse

## View (`src/components/sheaf`)

| File | Responsibility |
| --- | --- |
| `canvas/GraphCanvas.tsx` | Client-only mount + lazy `SheafScene` (SSR-safe) |
| `canvas/Scene.tsx` | R3F canvas, OrbitControls, node marks, residual lines, layer planes, paper-chip labels |
| `canvas/StalkPlot.tsx` | 2D orthonormal projection of a stalk |
| `chrome/Dock.tsx` | Layers, size, glow, noise cut, operators |
| `chrome/Inspector.tsx` | Selected stalk + neighbour residuals; **Close** |
| `chrome/Hint.tsx` | `?` popovers; copy lives in `HINTS` |
| `chrome/Guide.tsx` | Full control legend |
| `useVisible.ts` | Level / search / noise filters → visible subgraph |

Labels are screen-space HTML chips, pushed radially from each node. They draw for the **topmost visible level** plus the hover/selection. `pointer-events: none` on the drei Html wrapper so they never trap the dock.

## Store

`src/store/sheaf.ts` is the only mutable app state. Operators (`diffuseNow`, `exactNow`, `poolNow`, `reset`, `select`) are methods on it. Selection always pairs with `mobilePanel`: opening a node on a phone opens the inspector sheet; `select(null)` closes it. Do not reintroduce a path that leaves `mobilePanel === "inspect"` with `selectedId === null`.

## Adding behaviour (short recipes)

**New operator** — implement in `src/lib/sheaf/`, call from a store method, bind a dock button, add a `HINTS` entry.

**New dataset** — see [`DATASETS.md`](DATASETS.md).

**New visual encoding** — palette first (`palette.ts`), then Scene. Size and value stay quantitative; hue stays ordered. No rainbow.

**New chrome** — tokens in `src/styles.css` (`@theme`). No raw hex in JSX. `?` on every new control.
