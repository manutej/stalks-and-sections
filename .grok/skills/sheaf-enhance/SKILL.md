---
name: sheaf-enhance
description: Continue Stalks & Sections enhancement work from HANDOFF.md. Use when implementing views (matrix, slice, multiples, spectral), loader polish, HUD honesty, or example datasets.
version: 1
---

# Sheaf enhance

Read `HANDOFF.md` before writing code. Work on branch `enhancement`. One concern per PR.

## Invariants (stop if you break one)

- Diffuse does not increase Dirichlet energy; known stalks do not drift.
- Residual scale is diverging teal → terracotta. Size = dim. Hue = ordered level. No rainbow.
- `select(null)` clears `mobilePanel`. Close / Esc / empty-plane must leave the inspector without leaving the app.
- Labels: `pointer-events: none` on `.sheaf-html-wrap`.
- Do not extend `src/lib/auth` or `src/lib/db.ts`.

## PR sequence

1. Generic JSON loader + kinds/levels as data (#5, #11)
2. Wire `docs/examples/discourse-triangle.json` as a first-class dataset (#6)
3. Kernel-dimension next to energy (#10) + Cobb energy tests in CI (#7)
4. Bertin matrix view (#1)
5. Small multiples + slice (#2, #4)
6. Spectral layout from \(L_F\) (#9)
7. Restriction-kind marks + label collision (#8, #3)
8. Example pack: fleet, modules, KG fragment (#12)

If time for only one pair: **1 + 2**.

## Code map

Algebra stays in `src/lib/sheaf/` and stays testable without React.
State lives only in `src/store/sheaf.ts`.
Every new control needs a `HINTS` entry in `src/components/sheaf/chrome/Hint.tsx`.

## Definition of done (HANDOFF §10)

A stranger can drop JSON, see energy + uniqueness, switch Strata/Slice/Multiples/Matrix, name a terracotta edge in domain words, Diffuse, Close, export residuals, and do it at 390px.
