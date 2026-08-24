---
id: learning-sheaf-laplacian-restriction-maps
title: "Learning Sheaf Laplacian Optimizing Restriction Maps"
type: paper
aliases: ["arXiv:2501.19207", "Di Nino et al"]
sources: [S18, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Learning Sheaf Laplacian Optimizing Restriction Maps

## Summary

Di Nino, Barbarossa and Di Lorenzo, arXiv:2501.19207, ICASSP 2025 — learns a sheaf Laplacian from data by optimizing the restriction maps directly [S18].

The problem is `min` over `F` and an edge selector `a` of `sum_e a_e ||F_{u<|e} X_u - F_{v<|e} X_v||^2` subject to `||a||_0 = E_0`, `a_e in {0,1}`, and `F^T F = I` [S18]. Restriction maps are constrained **orthonormal**, and each per-edge subproblem with one side fixed to the identity is an orthogonal Procrustes problem with the closed form `F = V U^T` from an SVD [S18]. Every step is closed-form, avoiding the semidefinite programs earlier sheaf-learning methods needed [S18].

**Limitation that matters for design.** The method learns dense `O(d)` rotations; it cannot enforce that a map be a fixed coordinate selection or a hand-specified projection [S18]. It is therefore a *validation / misspecification-detection* tool for authored maps, not a tool for designing them [S18][S41].

## Relations

- defines [[procrustes-restriction-learning]] [S18]
- learns [[restriction-map]]s under an orthonormality constraint [S18]
- alternative_to [[sheaf-nn-connection-laplacians]], which computes maps geometrically [S16]
- alternative_to [[sheaflearning-jl]] [S29]
- caveat_of authored-sheaf workflows: it validates, it does not design [S41]

## Sources

- [S18] — arXiv:2501.19207 Learning Sheaf Laplacian Optimizing Restriction Maps
- [S41] — Verified research digest, live web checks August 2026

