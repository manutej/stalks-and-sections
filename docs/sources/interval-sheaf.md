---
id: interval-sheaf
title: "Interval sheaf"
type: concept
aliases: ["interval sheaves", "sheaf on Int"]
sources: [S22, S41]
confidence: high
created: "2026-08-20"
updated: "2026-08-20"
---
# Interval sheaf

## Definition

A sheaf on the site `Int` (or `Int_N`) of closed time intervals: a section over an interval is a trajectory, restriction is looking at a subinterval, and gluing means compatible trajectories on overlapping intervals combine [S22].

Schultz, Spivak and Vasilakopoulou call such a sheaf a **[[behavior-type]]** [S22]. Machines are then *spans* of sheaves, and interconnecting them per a wiring diagram is a limit/pullback over the shared wires, which enforces "the output section of one machine equals the input section of the other on every interval" [S22]. Because limits of sheaves are computed pointwise, the composite of machines is again a sheaf — that closure property is the whole payoff [S22][S41].

## Relations

- defined_in [[dynamical-systems-and-sheaves]] [S22]
- is_a [[behavior-type]] [S22]
- composed by [[limit-vs-colimit-composition]] on the limit side [S22]
- alternative_to the operad algebra of [[algebras-open-dynamical-systems]] [S20]
- related_to [[temporal-type-theory]] [S24]

## Sources

- [S22] — arXiv:1609.08086 Dynamical Systems and Sheaves (Schultz, Spivak, Vasilakopoulou)
- [S41] — Verified research digest, live web checks August 2026

