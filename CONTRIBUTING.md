# Contributing

This repo is set up so the next change is a small, reviewable enhancement — not a rewrite.

## Before you write code

1. Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Honour the store/algebra/view split.
2. Pick an item from [`ROADMAP.md`](ROADMAP.md) or an open issue. If it is new, open an issue first.
3. Keep Bertin encodings: **size and value for quantity**, **ordered hue for hierarchy**, residual as a diverging scale. No rainbow, no forced common dimension.

## Dev loop

```bash
npm install
npm run dev
npm run typecheck
```

Leave the lattice playable. A change that traps the user in a selected node, covers the dock with HTML labels, or ships a control without a `?` is not done.

## Definition of done

- Typecheck passes
- Diffuse still drops Dirichlet energy on both datasets
- Close / Esc / empty-plane still returns from a selected stalk
- Mobile (390px) does not overflow or hide Close
- New controls have a `HINTS` entry

## Commit style

Imperative, scoped: `feat(sheaf): closed-form TransE on Cobb seed`, `fix(ui): deselect on plane click`.
