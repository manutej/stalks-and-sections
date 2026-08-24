---
id: nonlinear-sheaf-laplacian
title: "Nonlinear sheaf Laplacian"
type: concept
aliases: ["nonlinear Laplacian", "L_F^{grad U}"]
sources: [S2, S1, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Nonlinear sheaf Laplacian

## Definition

The nonlinear sheaf Laplacian is `L_F^{grad U} := delta_F^T . grad U . delta_F`, equivalently `grad(U . delta_F)`: push the state through the [[coboundary-map]], take the gradient of the [[edge-potential]] in each edge stalk, and pull back [S2].

It is the exact object whose zeros are the coordinated states — `L_F^{grad U} x = 0` is the equilibrium condition of the [[nonlinear-homological-program]] [S2]. When every `U_e` is the squared norm it collapses to the linear [[sheaf-laplacian]] [S2]. Its structure is what makes the dynamics distributable: the gradient at vertex `i` depends only on `i` and its neighbours, so each agent can run its own update [S2][S1].

## Relations

- generalizes [[sheaf-laplacian]] [S2]
- uses [[coboundary-map]] and [[edge-potential]] [S2]
- defined_in [[distributed-coordination-cellular-sheaves]] [S2]
- iterated by [[sheaf-diffusion]] and by [[async-block-update]] [S1][S2]

## Sources

- [S2] — arXiv:2504.02049 Distributed Multi-agent Coordination over Cellular Sheaves (Hanks et al.)
- [S1] — arXiv:2510.00270 Asynchronous Nonlinear Sheaf Diffusion (Zhao et al.)
- [S41] — Verified research digest, live web checks August 2026

