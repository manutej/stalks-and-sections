# Hermes digest — adversarial eval v2

**Date:** 2026-09-06
**Working set:** 113 stalks · 112 restrictions · 10 type-aware claims · 8 L0 pins
**Numbers:** [`hermes-adv-v2.json`](hermes-adv-v2.json) from `npm run sheaf:eval`
**Not used:** `from-code.mjs`, `rich-index.mjs`, LangChain.js LCEL ids
**Walker:** `scripts/sheaf/emit-hermes.py`

This is the eval of the *next level* after the 113-land: 2D review, spectral layout, kernel HUD, restriction-kind marks, and a hold-out against the live digest. It is not a claim that the sheaf now beats an AST on every axis.

Reproduce:

```
npm run sheaf:eval
```

---

## B1 — “Strata is still a dressed-up force graph”

**Verdict: still partly true. Spectral exists and is honest about what it is.**

| | Force (Strata) | Spectral |
| --- | --- | --- |
| xz | seeded rings + springs | Fiedler + next of residual-weighted *graph* Laplacian \(L=D-W\) |
| y | `level * LAYER_Z` | same — hierarchy is not an eigenvector |
| weights | unused | \(W_e = 1/(0.2 + r_e)\) |
| operator | not \(L_F\) | not \(L_F\) either |

The block sheaf Laplacian \(L_F\) is 1356-dimensional (`vDim`). Spectral layout is the **1-skeleton** (113 vertices). If Strata and Spectral disagree, that disagreement is residual geometry, not a harmonic coordinate of \(L_F\). A reviewer who screenshots Spectral as “the sheaf embedding” is over-claiming.

**Shipped:** top-bar **Spectral**. Keys `1–4`.

---

## B2 — “2D review was promised and is missing”

**Verdict: closed for Matrix and ×4. Slice-as-page and CSV export still missing.**

| View | Status | What a reviewer can screenshot |
| --- | --- | --- |
| Strata 3D | v1 | hierarchy |
| **Matrix** | **v1.1** | Bertin residual adjacency, Fiedler seriation, grouped by layer |
| **×4 multiples** | **v1.1** | one xz drawing per visible plane, linked selection |
| Spectral | **v1.1** | residual-weighted 1-skeleton (see B1) |
| Slice page / export | missing | issue #4 / CSV |

The Review ledger (waist, 10 terracotta rows, 10 rooms) remains the default empty-selection inspector. Matrix is the 2D drawing that ledger could not be.

---

## B3 — Hold-out: does the sheaf beat the graph?

**Verdict: no. Kind-tagged restrictions lose to identity-graph Laplacian.**

Eight highest-degree *free* stalks held out (not the L0 pins):

`gateway-run`, `agent-prompt-builder`, `gateway-platform-registry`, `agent-context-compressor`, `hermes-cli-main`, `agent-conversation-loop`, `agent-memory-manager`, `cron-scheduler`

Harmonic extension of the complement, cosine vs the stored section:

| Predictor | cosine | MSE |
| --- | ---: | ---: |
| Kind-tagged sheaf \(L_F\) | **0.732** | 0.038 |
| Identity-graph Laplacian | **0.851** | 0.024 |
| Neighbour mean | **0.832** | — |

Margin sheaf − graph = **−0.118**. `beatGraph: false`.

This is the expected failure if restriction *matrices* are reconstructed from `restrictKind` (`makePair`) rather than estimated from symbols or traces. The terracotta *notes* are still named claims a reviewer can disagree with. The numeric maps are not yet evidence. Do not quote the sheaf cosine as a win.

---

## B4 — Kernel honesty

Heat-kernel rank heuristic, 12 samples, 40 Euler steps on \(L_F\).

| Quantity | Value | Reading |
| --- | ---: | --- |
| \(\sum_v \dim F(v)\) | 1356 | cochain \(C^0\) |
| \(\sum_e \dim F(e)\) | 968 | identity 12 + projection 6 + type-aware 8 |
| \(\chi = \dim C^0 - \dim C^1\) | **388** | cochain count, **not** \(\dim H^0\) |
| \(\widehat{\dim H^0}\) | **2** | lower bound; not capped (cap 12) |
| \(\widehat{\dim H^1} = \hat h^0 - \chi\) | **null** | Euler would be negative — do not print 0 |
| Dirichlet energy | 58.16 | radius 0.060 |
| L0 pins | 8 | frozen under Diffuse |

HUD copy: `H⁰ 2` and **family** or **unique** after the pinned re-test. If the sample cap saturates, HUD says `H⁰ ≥ 12`. χ is shown as `χ = v − e` in the inspector, not as dim H⁰.

Energy → 0 is still not “the true assignment.” Diffuse picks one harmonic extension.

---

## B5 — Restriction kind as a second visual variable

**Verdict: shipped in 3D. Colour remains residual.**

| Kind | Count on outer lattice | Mark |
| --- | ---: | --- |
| identity | 46 | solid |
| projection | 56 | dashed |
| embed | 0 | dotted (legend only on this digest) |
| spectral | 0 | solid, slightly brighter |
| type-aware | 10 | solid + midpoint octahedron |

Bertin: size = dim, hue = ordered level, colour on edges = residual, dash/shape = kind. Glow slider still does not change math.

---

## What is still missing (do not paper over)

- Learned restriction matrices (Procrustes / shared-symbol). Until then B3 stays a loss.
- Nested rooms beyond the authored set (1-hop induce cap 16 is the fallback).
- File-drop of sheaf JSON in the UI (issue #5).
- Noether folds by kind / syntax / linear (A8).
- Collision-aware labels (A6 / issue #3).
- Slice-as-a-page and residual CSV.
- Production GitHub `main` still serves the **31-node** digest until [PR #17](https://github.com/manutej/stalks-and-sections/pull/17) merges. Do not merge `feat/hermes-94-land`.

The sheaf is still **not an AST of 3387 files**. 113 is the complete playable ingest. v2 did not change that.

---

## Attacks this eval does *not* close

A2 file-drop, A4 content (sections are still 12 family coordinates, not traces), A6 LOD at 200+, A7 discourse sheaf as a runnable dataset, A8 functional folds, A10 verb-first operators.
