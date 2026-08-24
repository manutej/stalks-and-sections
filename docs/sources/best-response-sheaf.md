---
id: best-response-sheaf
title: "Best-response sheaf"
type: concept
aliases: ["best response sheaf", "B(I,v)"]
sources: [S13, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Best-response sheaf

## Definition

The assignment `B(I,v) = {sigma_v in Sigma(I,v) : sigma_v in BR_v(sigma_{-v})}` — at each vertex and time interval, the set of strategies that are best responses to the neighbours' strategies [S13].

Its global sections are Nash equilibria [S13]. The catch is structural: `BR` is a **correspondence** — set-valued, upper-hemicontinuous, generally nonlinear — so `B` is not a cellular sheaf of vector spaces [S13][S41]. Everything computational that the linear theory gives you (coboundary matrices, nullspaces, Laplacians) does not directly apply [S41].

## Relations

- defined_in [[game-sheaf-strategic-multi-agent]] [S13]
- characterizes Nash equilibria via [[thm-nash-as-global-sections]] [S13]
- contradicts the vector-space assumptions of [[cellular-sheaf]] — it is set-valued [S13]
- caveat_of [[caveat-nonabelian-h1]] [S41]

## Sources

- [S13] — arXiv:2606.01663 A Sheaf Framework for Strategic Multi-Agent Systems
- [S41] — Verified research digest, live web checks August 2026

