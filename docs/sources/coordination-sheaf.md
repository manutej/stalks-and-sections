---
id: coordination-sheaf
title: "Coordination sheaf"
type: concept
aliases: ["coordination sheaves", "(G, F, U)"]
sources: [S2, S1, S3, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Coordination sheaf

## Definition

A **coordination sheaf** is a triple: a graph `G`, a [[cellular-sheaf]] `F` on `G`, and a family of [[edge-potential]]s `{U_e}` — one convex function per edge measuring how bad the disagreement on that edge is [S2].

This is the central object of the wiki. The sheaf says *what* agents compare (via [[restriction-map]]s into edge stalks); the potentials say *how much a mismatch costs* [S2]. Consensus, formation, fixed-distance flocking and heterogeneous mixtures are all obtained by varying `F` and `U_e` while the algorithm stays fixed [S2][S3]. Coordination is then "drive the state into `ker` of the [[nonlinear-sheaf-laplacian]]", i.e. reach a [[global-section]] [S2].

## Relations

- extends [[cellular-sheaf]] by attaching an edge potential to every edge [S2]
- defined_in [[distributed-coordination-cellular-sheaves]] [S2]
- defines [[nonlinear-homological-program]], the optimization problem it induces [S2]
- solved_by [[admm]] with a [[sheaf-diffusion]] inner step [S2]
- applies_to [[multi-robot-formation-flocking]] [S2]
- carried into the asynchronous regime by [[async-sheaf-diffusion]] [S1]

## Sources

- [S2] — arXiv:2504.02049 Distributed Multi-agent Coordination over Cellular Sheaves (Hanks et al.)
- [S1] — arXiv:2510.00270 Asynchronous Nonlinear Sheaf Diffusion (Zhao et al.)
- [S3] — AlgebraicJulia blog post on sheaf coordination
- [S41] — Verified research digest, live web checks August 2026

