# Visualization module

Designer front door. How to draw this sheaf without inventing a second language.

The live explorer is a *discovery* view. Stills you can put in a brief live here. Both use the same encoding.

| | |
| --- | --- |
| **Grammar** | [`src/lib/sheaf/viz/grammar.ts`](../src/lib/sheaf/viz/grammar.ts) |
| **SVG builders** | [`src/lib/sheaf/viz/svg.ts`](../src/lib/sheaf/viz/svg.ts) |
| **Export** | `node scripts/sheaf/emit-viz.mjs` → [`docs/viz/`](viz/) |
| **Stills** | [encoding key](viz/encoding-key.svg) · [kind marks](viz/kind-marks.svg) · [waist](viz/waist.svg) · [terracotta claims](viz/terracotta-claims.svg) · [residual matrix](viz/residual-matrix.svg) |
| **Live (after land)** | https://stalks-and-sections.vercel.app/?g=hermes-agent |
| **This branch** | [`feat/hermes-ship113`](https://github.com/manutej/stalks-and-sections/tree/feat/hermes-ship113) · [PR #17](https://github.com/manutej/stalks-and-sections/pull/17) |
| **Playable JSON** | [`docs/examples/hermes-agent.json`](examples/hermes-agent.json) |

Production `main` still serves the 31-node digest. Use this branch or the PR deploy for 113 stalks.

---

## What to open first

1. This page.
2. The [encoding key](viz/encoding-key.svg) — keep it next to every still.
3. Live explorer, top bar: **Strata · Matrix · ×4 · Spectral** (keys 1–4).
4. Empty inspector: L0 waist, ten terracotta rows, ten rooms.

Do not start from the 3387-file tree. The working set is **113 stalks · 112 restrictions · 10 interiors**.

---

## Encoding (do not fork)

One table. Every view is a projection of these marks.

| Variable | Carries | Level | Rule |
| --- | --- | --- | --- |
| **y** | hierarchy | ordered | `level × LAYER_Z`. Planes stay strata. |
| **xz** | layout | quantitative | Force = readable. Spectral = residual-weighted 1-skeleton Fiedler — **not** the 1356-d block $L_F$. |
| **size** | stalk dim | quantitative | Radius. Not residual. Not kind. |
| **hue** | hierarchy | ordered | `#4a9a92 → #6b8ea3 → #8a9a6e → #b08978`. No rainbow. |
| **edge colour** | residual | ordered | `#2f8f78` glues → `#c4a574` sand → `#c45c68` fails. |
| **dash** | restriction kind | nominal | Solid identity. Dashed projection. Dotted embed. |
| **diamond** | type-aware claim | nominal | Midpoint mark on the ten terracotta edges only. |
| **round ring** | pinned (`known`) | nominal | Diffuse may not move these. |
| **hex ring** | enterable room | nominal | Double-click / Enter room. |

If a picture uses hue for residual, or size for kind, it is a different product.

Tokens: `VIZ_TOKENS` in `src/lib/sheaf/viz/grammar.ts` and `src/lib/sheaf/palette.ts`. Change them in one place.

---

## Views

| View | Question | File |
| --- | --- | --- |
| **Strata** | What is the hierarchy? | `src/components/sheaf/canvas/Scene.tsx` |
| **Matrix** | Which restrictions fail, in order? | `src/components/sheaf/review/MatrixView.tsx` + [still](viz/residual-matrix.svg) |
| **×4** | Compare the four planes. | `src/components/sheaf/review/MultiplesView.tsx` |
| **Spectral** | Where does the 1-skeleton think things sit? | `spectralLayout` in `src/lib/sheaf/kernel.ts` |

Shared filters: layer peel, search, hide-noise, selection. Do not invent a second residual scale per view.

---

## How to emit stills

```bash
node scripts/sheaf/emit-viz.mjs
# writes docs/viz/*.svg and docs/viz/manifest.json
```

Input defaults to `docs/examples/hermes-agent.json`.

Drop a `lattice.json` from [sheaf-port](https://github.com/manutej/sheaf-port) into `docs/examples/` and re-run the exporter. The encoding does not change.

---

## What not to draw

- One stalk per file of the Hermes repo. That is an AST dump, not this digest.
- A rainbow hue for residual or kind.
- A “Spectral” view that claims to be the full sheaf Laplacian.
- dim H¹ = 0 because χ = 388. χ is cochain count. The heat-kernel H⁰ on this digest is **2** (lower bound). Hold-out **loses**: sheaf cosine 0.732 vs identity-graph 0.851. Quote [`docs/experiments/hermes-adv-v2.md`](experiments/hermes-adv-v2.md).
- LCEL node ids on the Hermes dataset.

---

## Rooms and claims a still should be able to name

L0 waist (round rings): `run-agent` · `tools-registry` · `hermes-state` · `toolsets` · `model-tools` · `runtime-provider` · `system-prompt` · `tools-approval`.

Ten terracotta claims: listed in [`docs/experiments/hermes-agent.md`](experiments/hermes-agent.md) and drawn in [terracotta-claims.svg](viz/terracotta-claims.svg).

Enter `run_agent` to unfold the eight-pin interior. That room is unique after pinning. The outer lattice is a **family of sections**.
