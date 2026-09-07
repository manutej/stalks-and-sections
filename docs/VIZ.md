# Visualization module

Designer front door. How to draw this sheaf without inventing a second language.

The live explorer is a *discovery* view. The structure below is what every still and every camera must keep.

| | |
| --- | --- |
| **Spec** | [`docs/viz/SPEC.md`](viz/SPEC.md) |
| **Machine contract** | [`docs/viz/encoding.spec.json`](viz/encoding.spec.json) |
| **Grammar** | [`src/lib/sheaf/viz/grammar.ts`](../src/lib/sheaf/viz/grammar.ts) |
| **Worked example** | [`docs/examples/discourse-triangle.json`](examples/discourse-triangle.json) · [lattice still](viz/discourse-triangle-lattice.svg) |
| **Live example** | https://stalks-and-sections.vercel.app/?g=discourse-triangle |
| **This branch** | [`feat/hermes-ship113`](https://github.com/manutej/stalks-and-sections/tree/feat/hermes-ship113) · [PR #17](https://github.com/manutej/stalks-and-sections/pull/17) |

Production `main` still serves the 31-node Hermes digest. Use this branch or the PR deploy for 113 stalks and for the triangle.

---

## Lattice structure (one picture, four projections)

```
Planes (y = level × LAYER_Z)
  L3 adapter / integrity     hue #b08978
  L2 surface / said          hue #8a9a6e
  L1 subsystem / channel     hue #6b8ea3
  L0 pin / private           hue #4a9a92   ← waist sits here

On each plane
  stalk  = node.  size = dim.  round ring = known.  hex ring = room.
  edge   = restriction.  colour = residual.  dash = kind.  diamond = type-aware.

Views (same marks)
  Strata    3D stacked planes          key 1
  Matrix    Bertin residual adjacency  key 2
  ×4        one 2D slice per plane     key 3
  Spectral  xz from 1-skeleton Fiedler key 4   y stays level
```

Do not start from a file tree. A lattice is stalks + restrictions + rooms, not an AST.

---

## Worked example — discourse triangle

Four stalks, three projections. Private beliefs are \(\mathbb{R}^2\). What can be *said* is \(\mathbb{R}^1\). Restriction is the first coordinate.

```
                    [ Public channel ]     L1 said · dim 1 · free
                     /       |       \
              dashed     dashed     dashed     restrictKind = projection
               /             |           \
          Alice            Bob          Cara   L0 private · dim 2 · pinned
         (0.9, 0.8)    (0.85, −0.7)    (0.1, 0.0)
```

| Stalk | Level | Dim | Known | Section | Reads as |
| --- | --- | --- | --- | --- | --- |
| Alice | L0 private | 2 | yes | `[0.9, 0.8]` | Says yes. Strong private qualifier. |
| Bob | L0 private | 2 | yes | `[0.85, −0.7]` | Says almost the same. Private axis flipped. |
| Cara | L0 private | 2 | yes | `[0.1, 0.0]` | Public dissent. Quiet private axis. |
| Public channel | L1 said | 1 | no | `[0.0]` | Unknown utterance. Diffuse may move this. |

Alice and Bob *agree in speech* and *disagree in belief*. That disagreement is invisible on the channel — residual on the hidden axis is candor, not graph distance. Still: [`docs/viz/discourse-triangle-lattice.svg`](viz/discourse-triangle-lattice.svg). JSON: [`docs/examples/discourse-triangle.json`](examples/discourse-triangle.json).

Open live: [stalks-and-sections.vercel.app/?g=discourse-triangle](https://stalks-and-sections.vercel.app/?g=discourse-triangle).

The 113-stalk Hermes digest uses the **same** marks. It is the working set, not this toy.

---

## Encoding (do not fork)

| Variable | Carries | Rule |
| --- | --- | --- |
| **y** | hierarchy | `level × LAYER_Z`. Planes stay strata. |
| **xz** | layout | Force = readable. Spectral = residual-weighted 1-skeleton Fiedler — **not** the block \(L_F\). |
| **size** | stalk dim | Radius. Not residual. Not kind. |
| **hue** | hierarchy | `#4a9a92 → #6b8ea3 → #8a9a6e → #b08978`. No rainbow. |
| **edge colour** | residual | `#2f8f78` glues → `#c4a574` sand → `#c45c68` fails. |
| **dash** | restriction kind | Solid identity. Dashed projection. Dotted embed. |
| **diamond** | type-aware claim | Midpoint mark on terracotta edges only. |
| **round ring** | pinned (`known`) | Diffuse may not move these. |
| **hex ring** | enterable room | Double-click / Enter room. |

If a picture uses hue for residual, or size for kind, it is a different product.

Tokens live in `src/lib/sheaf/viz/grammar.ts` and `src/lib/sheaf/palette.ts`. Change them in one place.

---

## Views

| View | Question | File |
| --- | --- | --- |
| **Strata** | What is the hierarchy? | `src/components/sheaf/canvas/Scene.tsx` |
| **Matrix** | Which restrictions fail, in order? | `src/components/sheaf/review/MatrixView.tsx` |
| **×4** | Compare the planes. | `src/components/sheaf/review/MultiplesView.tsx` |
| **Spectral** | Where does the 1-skeleton sit? | `spectralLayout` in `src/lib/sheaf/kernel.ts` |

Shared filters: layer peel, search, hide-noise, selection. Do not invent a second residual scale per view.

Exporter (any sheaf JSON → stills):

```bash
node scripts/sheaf/emit-viz.mjs --in docs/examples/discourse-triangle.json --out docs/viz/discourse-triangle
node scripts/sheaf/emit-viz.mjs --all
```

---

## What not to draw

- One stalk per file of the Hermes repo. That is an AST dump, not this digest.
- A rainbow hue for residual or kind.
- A “Spectral” view that claims to be the full sheaf Laplacian.
- dim H¹ = 0 because χ = 388. χ is cochain count. Heat-kernel H⁰ on Hermes is **2** (lower bound). Hold-out **loses**: sheaf cosine 0.732 vs identity-graph 0.851. Quote [`docs/experiments/hermes-adv-v2.md`](experiments/hermes-adv-v2.md).
- LCEL node ids on the Hermes dataset.
