---
id: async-sheaf-diffusion
title: "Asynchronous Nonlinear Sheaf Diffusion for Multi-Agent Coordination"
type: paper
aliases: ["arXiv:2510.00270", "asynchronous sheaf diffusion"]
sources: [S1, S41, S42]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Asynchronous Nonlinear Sheaf Diffusion for Multi-Agent Coordination

## Summary

Zhao, Hanks, Riess, Cohen, Hale, Fairbanks (University of Florida and Georgia Tech), arXiv:2510.00270 — the frontier paper of the coordination-sheaf line and the central paper of this wiki [S1].

It drops the synchrony assumption of [[distributed-coordination-cellular-sheaves]] [S1]. Each waking agent runs the [[async-block-update]] `x_i(t+1) = x_i(t) - gamma [L_F^{grad U} x^i(t)]_i` on its own stale view [S1]. Under [[partial-asynchrony]] (Assumption 1) plus `m_e`-strong convexity and `K_e`-smoothness of each [[edge-potential]] (Assumptions 2 and 3), Theorem 1 gives linear convergence measured per `(B+1)` block [S1]. The error-bound constant is `kappa = 1/(m sigma_2(delta_F))` [S1]. Four experiments cover a `B` sweep on a 20-node 4-regular graph with constant, random-restriction and matrix-weighted sheaves; 100 random initializations at `B = 50`; a `B` sweep to `2^15` exposing drift; and `lambda_2(L_F)` versus iteration count on Erdos-Renyi graphs [S1]. The paper claims the first asynchronous sheaf-diffusion analysis [S1].

## Relations

- extends [[distributed-coordination-cellular-sheaves]] by removing synchrony [S1]
- assumes [[partial-asynchrony]], [[strong-convexity-and-smoothness]] [S1]
- proves [[thm-async-linear-convergence]] [S1]
- defines [[async-block-update]], [[delay-bound-b]], [[error-bound-constant]] [S1]
- authored_by [[yichen-zhao]], [[tyler-hanks]], [[hans-riess]], [[samuel-cohen]], [[matthew-hale]], [[james-fairbanks]] — full byline verified [S42]
- closes the stability gap left open by [[sheaf-diffusion-goes-nonlinear]] [S17]
- open_problem_in [[op-staleness-semantics]] — the semantics of staleness for LLM agents remains unbuilt [S41]

## Unverified

- Closed forms for the step-size threshold `gamma_0` and the contraction constant `c` are not given in the paper; they are deferred to a citation, so no numerical step size can be read off directly [S41].

## Sources

- [S1] — arXiv:2510.00270 Asynchronous Nonlinear Sheaf Diffusion (Zhao et al.)
- [S41] — Verified research digest, live web checks August 2026
- [S42] — arXiv author bylines fetched live 2026-08-20 (2504.02049, 2510.00270)

