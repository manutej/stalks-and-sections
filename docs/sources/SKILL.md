---
name: sheaf-compose
description: >-
  Compose fleets of fleets operadically — wire independently-coherent teams, sub-agents, or
  artifact groups together along typed interfaces (an undirected wiring diagram), build the
  composite coordination sheaf, and find the SEAM: the contradiction that no individual team can
  see because it does not live inside any team. Use when "compose these teams", "fleet of fleets",
  "team of teams", "nested agents", "hierarchical orchestration", "wire these subsystems", "the
  parts all pass but the whole is wrong", "interface contract between subsystems", "where do the
  chunks join", "seam errors", "split-work-rejoin at scale", "operadic composition", "wiring
  diagram". Requires one COORD-SHEAF.yaml per box from sheaf-model.
---

# Operadic composition: the syntax layer

Grounded in the operad of wiring diagrams (Spivak, [arXiv:1305.0297](https://arxiv.org/abs/1305.0297); Vagner–Spivak–Lerman, [arXiv:1408.1598](https://arxiv.org/abs/1408.1598)) and in machines-as-spans-of-sheaves (Schultz–Spivak–Vasilakopoulou, [arXiv:1609.08086](https://arxiv.org/abs/1609.08086)), where **wiring is a limit over the shared wires** — which is exactly what Catlab's `oapply` computes for multispans.

## The one idea to hold onto

> **Operads supply the syntax; sheaves supply the semantics.** A wiring diagram says how the boxes plug together and nothing about whether the result makes sense. A sheaf says what "makes sense" means and nothing about how to build a bigger one. Put them together and you get: *a wiring diagram of wiring diagrams is a wiring diagram*, and the composite of coherent parts is a coordination sheaf you can diffuse, diagnose and forecast like any other.

And the payoff that justifies the machinery:

> **Every part being internally coherent does not imply the whole is coherent. The gap is a relative cohomology class, and it lives on the seam.**

That is not a slogan. `sheafkit seam` computes it:

```
seam excess² = residual(composite)² − Σ_boxes residual(part)²
```

A strictly positive excess with every part satisfiable means the contradiction is *in the wiring*. Nobody inside any team can find it, however carefully they work, because it is not inside any team. Sending them back to work burns tokens and changes nothing.

## Why not just flatten everything into one big sheaf?

You can. It is usually wrong, for three reasons you can measure:

1. **It destroys the abstraction boundary.** Every agent must publish into one namespace, so every team's internal vocabulary leaks into every other team's contracts.
2. **The condition number stops meaning anything.** A flat κ reflects the whole organisation. A composed κ, compared against each part's, tells you *whether the seam or a team is the bottleneck* — see `interface_penalty` below.
3. **You lose the diagnosis.** Flattened, a seam contradiction and an internal contradiction look identical. Composed, they are two different verdicts with two different fixes.

## The objects

| Wiring diagram | In your system |
|---|---|
| **box** | one sub-fleet, with its own `COORD-SHEAF.yaml` |
| **port** | a node of that sub-fleet that is exposed at the boundary |
| **junction** | a shared wire: every port on it must carry the same value (in that junction's space) |
| **outer box** | the composite you are building |
| **γ (substitution)** | `nest()` — plug a diagram into a box of another diagram |

Node names are namespaced `box/node`, so two fleets may both have a `reviewer`. A junction with *k* ports becomes a star of *k−1* edges, not a clique: equality is transitive, and a star keeps the composite's condition number reflecting the wiring you wrote rather than a clique you did not.

## Procedure

### 1. Draw the boundary before you draw the wires

For each box, ask: *which of this team's variables cross its boundary?* That list is the port set, and it should be short. A team exposing eight variables is not a team, it is a namespace. If you cannot name the interface in three or four numbers, the decomposition is wrong — merge the boxes or re-cut them.

### 2. Write the junctions as contracts, not as plumbing

A junction is a promise that a quantity means the same thing on both sides of an organisational boundary. Give it a `note` saying whose promise it is. Junctions carry `offset` and `weight` like any edge, so *structured* cross-team relationships are expressible: "the build plan sits five days above the priced estimate" is a junction with an offset, not a disagreement.

That is also exactly how seam obstructions get created, which is the point of writing them down.

### 3. Compose and check the seam — before running anything

```bash
python -m sheafkit seam composite.yaml
```

```
COMPOSITE  org   8 agents, 11 edges, 4 seam edge(s)
  parts: research=SATISFIABLE, build=SATISFIABLE, commercial=SATISFIABLE
VERDICT  SEAM OBSTRUCTION
  composite residual  2.88675
  parts residual      0
  SEAM EXCESS         2.88675   <- what no part could see
  junctions by residual:
    effort               2.35702
    contingency          1.66667
  interface penalty   5.01x
```

Read it as: research says the estimate is one number, build and commercial are both wired to it, and engineering policy requires build to sit five days above the priced figure. Around that triangle the demanded offsets sum to five, not zero. Every team is right. The organisation is not.

### 4. Read the interface penalty

`interface_penalty = κ(composite) / max κ(part)`. Near 1 means composition is free. Much above 1 means **the seam, not any team, sets the round count** — the teams will each settle quickly and then spend the whole run arguing across the boundary. The fix is a wider junction space or one more junction. It is not more agents and it is not a better model.

### 5. Nest when the org is deeper than two levels

```python
from sheafkit import load_wiring, nest, oapply
nested = nest(outer_diagram, "delivery", inner_diagram)   # operadic γ
composite = oapply(nested, parts)
```

Substitution is closed, so a fleet of fleets of fleets needs no new machinery and no new concepts. This is the whole reason to use an operad rather than an ad-hoc nesting scheme.

## Repairing a seam obstruction

In order:

1. **Renegotiate the junction**, not the teams. Which of the cross-boundary promises was aspirational?
2. **Widen the junction space.** Two teams forced to agree on a single summary number will contradict a third party that sees more detail.
3. **Make the offset deliberate and consistent.** If build genuinely must carry contingency, then *every* path between build and commercial must account for it. Offsets around a cycle must sum to zero.
4. **Split the junction.** Sometimes one wire is carrying two different promises.
5. **Escalate.** A real contradiction between things two teams both genuinely need is the highest-value output this plugin produces. Hand over the junction name, the residual, and the three promises that cannot all hold.

## Relationship to the other checks you already run

- **Operadic consistency checks (`meta-operad`) verify the *tree*:** does composing the parts of a decomposition give the same answer as collapsing them? That is a *vertical* check across levels of abstraction.
- **Sheaf energy verifies the *graph*:** do peers at one level agree? That is a *horizontal* check.
- **Seam obstruction is where they meet:** it is a vertical failure (parts vs whole) localised by horizontal means (which junction, which variable, how much). When an OC check fails and you want to know *where*, compose the levels as boxes and run `seam`.
- **`split-work-rejoin`** says the seams are where errors hide. This makes "seam" a computable object with a residual attached.

## Anti-patterns

- **Boxes drawn on the org chart.** Draw them on the *interface*: a box is a set of agents that can reach internal coherence without talking to anyone outside it. If they cannot, it is not a box.
- **Fat interfaces.** Every exposed variable is a contract you must maintain and a place a false agreement can be manufactured.
- **A junction with two ports on the same box.** That is an internal edge; `load_wiring` rejects it, and it should.
- **Composing before each part is satisfiable.** A part's obstruction masquerades as a seam. Fix the parts first; the verdict `SEAM AND PART OBSTRUCTION` exists to tell you that you did not.
- **Claiming a theorem about the operad links.** Ginzburg–Kapranov's operads-to-sheaves-on-moduli-of-trees and May's E∞-on-sheaf-cochains are real mathematics, but they are about *dg/linear* operads; wiring diagrams are *Set-valued combinatorial* operads. No theorem connects the two worlds. The resonance is an analogy; say so.

## Next

- `sheaf-obstruct` — when the obstruction turns out to be inside a part after all
- `sheaf-spectral` — the composite is a normal sheaf; forecast it like one
- `sheaf-diffuse` — run the composed fleet
