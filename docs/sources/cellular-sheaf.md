---
id: cellular-sheaf
title: "Cellular sheaf"
type: concept
aliases: ["cellular sheaf", "sheaf on a graph", "F"]
sources: [S4, S2, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Cellular sheaf

## Definition

A **cellular sheaf** `F` on a graph `G` assigns a vector space — a [[stalk]] — to every vertex and every edge, together with a linear [[restriction-map]] `F_{v<|e} : F(v) -> F(e)` for each incident vertex-edge pair [S4]. It is the minimal data structure for "local spaces of data plus rules for comparing them across a communication link" [S4][S41].

Everything else in this wiki is built from it: the [[coboundary-map]] measures disagreement across edges, its composite with itself gives the [[sheaf-laplacian]], the kernel of that Laplacian is the space of [[global-section]]s, and putting nonlinear [[edge-potential]]s on top yields the [[coordination-sheaf]] of multi-agent control [S2][S4].

## Relations

- specializes the general notion of a sheaf on a topological space to a finite cell complex, which makes cohomology a finite linear-algebra computation [S4]
- part_of [[cochain-complex]] — the stalks assemble into `C^0` and `C^1` [S4]
- generalized_by [[coordination-sheaf]], which adds edge potentials and a distributed objective [S2]
- used by [[sheaf-neural-network]] where the restriction maps are learned rather than authored [S15]
- see [[spectral-theory-cellular-sheaves]] for the spectral theory that governs its Laplacian [S4]

## Sources

- [S4] — arXiv:1808.01513 Toward a Spectral Theory of Cellular Sheaves (Hansen & Ghrist)
- [S2] — arXiv:2504.02049 Distributed Multi-agent Coordination over Cellular Sheaves (Hanks et al.)
- [S41] — Verified research digest, live web checks August 2026

