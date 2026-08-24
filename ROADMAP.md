# Roadmap

**Read [`HANDOFF.md`](HANDOFF.md) first.** It is the adversarial evaluation of v1, the view catalog, the example catalog, and the PR sequence. Open GitHub issues are the live tracker; this file is the short intent list.

Status of v1 (this repo): a literature-grounded cellular-sheaf lattice with variable-dimension stalks, residual-coloured restrictions, Diffuse / Exact / Coarsen operators, sliceable layers, and a documented inspector. **Utility blocker:** no JSON import; literature sections are sampled, not measured; no 2D review views.

## Now — v1.1 visualization & UX

The lattice is readable. These make it *reviewable* in 2D and under filters, which was the original brief.

1. **Bertin reorderable matrix** of restriction residuals (seriation by energy). Companion to the 3D lattice, not a replacement.
2. **Small-multiples 2D** — one drawing per hierarchy level, linked selection.
3. **Collision-aware labels** — still paper chips, but with a 2D projection pass so names never stack.
4. **Slice plane** — a movable clipping plane along Y (hierarchy) and an optional symmetry fold (kind / syntax / linear partitions).
5. **Typed restriction marks** — identity / projection / embed / spectral / type-aware as a second visual variable (orientation or dash), residual remaining colour.

## Next — v1.2 data & operators

6. **Sheaf JSON import** — load `{ nodes, edges, stalks, F }` from a file. The literature graph becomes one dataset among many.
7. **Discourse / coordination / fleet sheaves** — private vs expressed beliefs, seam obstructions, candor (GENUINE / MANUFACTURED). Seeded by `docs/sources/discourse-sheaf.md` and `coordination-sheaf.md`.
8. **Live energy sparkline + proof panel** always visible; export a residual CSV.
9. **Animate Diffuse and Coarsen** as short in-scene interpolations of positions and residuals, not just a snap.

## Later — v2 knowledge workbench

10. **Noether symmetry views** — fold the lattice across kind, syntax, or linear partitions without destroying the sheaf.
11. **Persistent sheaf Laplacians** — a time / scale axis for the same graph.
12. **Editable sections** — drag a stalk vector in the 2D plot, watch residuals update.
13. **Shareable camera + filter state** (URL query).
14. **Headless tests** for energy monotonicity, boundary invariance, and Euler-vs-closed-form on the Cobb seed (the QA already observed a drop; lock it in).

## Non-goals (for now)

- Accounts, multiplayer, or a database. Local state is enough.
- Rainbow colour maps, a common ambient dimension, or a hairball force graph as the default view.
- Replacing the math with a black-box GNN.

## How to pick up an item

Open the matching GitHub issue. Each one should name the files to touch (`docs/ARCHITECTURE.md` has the map) and a definition of done that can be screenshot-tested.
