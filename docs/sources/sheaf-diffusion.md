---
id: sheaf-diffusion
title: "Sheaf diffusion"
type: algorithm
aliases: ["sheafDiffusion", "diffusion dynamics"]
sources: [S2, S4, S1, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Sheaf diffusion

## Definition

Gradient flow on disagreement: `x <- x - gamma L_F x` in the linear case, or `x <- x - gamma L_F^{grad U} x` with [[edge-potential]]s [S2].

It is the sheaf generalization of average consensus, converging to the orthogonal projection of the initial state onto `H^0` in the linear symmetric case [S5]. Each step is local: an agent needs only its neighbours' restricted states [S2]. Stability follows from the [[step-size-budget]] in the linear normalized case [S4]; in the nonlinear case it follows from [[strong-convexity-and-smoothness]] [S1]. In [[admm]] it appears as the consensus (z) step [S2], and in [[sheaf-admm-learning]] it is truncated to `T = 5` conjugate-gradient steps and backpropagated through [S11].

## Relations

- implements descent on [[dirichlet-energy]] [S4]
- uses [[sheaf-laplacian]] or [[nonlinear-sheaf-laplacian]] [S2]
- part_of [[admm]] as the consensus step [S2]
- generalized_by [[async-block-update]] when agents wake at different times [S1]
- implemented_in [[cellularsheaves-jl]] and [[sheaf-agents-rust]] [S27][S30]

## Sources

- [S2] — arXiv:2504.02049 Distributed Multi-agent Coordination over Cellular Sheaves (Hanks et al.)
- [S4] — arXiv:1808.01513 Toward a Spectral Theory of Cellular Sheaves (Hansen & Ghrist)
- [S1] — arXiv:2510.00270 Asynchronous Nonlinear Sheaf Diffusion (Zhao et al.)
- [S41] — Verified research digest, live web checks August 2026

