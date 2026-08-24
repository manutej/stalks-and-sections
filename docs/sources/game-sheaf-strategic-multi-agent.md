---
id: game-sheaf-strategic-multi-agent
title: "A Sheaf Framework for Strategic Multi-Agent Systems"
type: paper
aliases: ["arXiv:2606.01663", "game sheaf paper"]
sources: [S13, S41]
confidence: medium
created: "2026-08-20"
updated: "2026-08-20"
---
# A Sheaf Framework for Strategic Multi-Agent Systems

## Summary

Hernandez and Sanchez-Soto, arXiv:2606.01663 (May 2026) — pushes sheaves from consensus into game theory [S13].

The site is `S = T x G` (time crossed with the interaction graph), and the total stalk is `C_geom x C_know x Sigma x R`: geometry, knowledge, strategies and rewards [S13]. A utility sheaf `U(I,v) = R^{n_v}`, a strategy sheaf `Sigma` with compact convex stalks, and a reward sheaf `R` with event-calculus inertia are glued by restriction maps built from Cartan parallel transport plus best-response alignment [S13]. Theorem 1 states that Nash equilibria correspond to global sections of the [[best-response-sheaf]], existing iff `H^1(S;B) = 0` [S13]. The hybrid update is `phi^{t+1} = phi^t - alpha L_C phi^t + beta grad_phi U_v`, and a Kunneth argument splits `H^1_total` into time and graph contributions plus torsion [S13].

**Read [[caveat-nonabelian-h1]] before citing Theorem 1** [S41].

## Relations

- defines [[best-response-sheaf]] [S13]
- proves [[thm-nash-as-global-sections]] [S13]
- uses [[kunneth-split-h1]] [S13]
- caveat_of itself via [[caveat-nonabelian-h1]] [S41]
- extends [[coordination-sheaf]] thinking from cooperative to strategic agents [S2]
- related_to [[sheaf-theoretic-planning]] by the same authors [S14]

## Sources

- [S13] — arXiv:2606.01663 A Sheaf Framework for Strategic Multi-Agent Systems
- [S41] — Verified research digest, live web checks August 2026

