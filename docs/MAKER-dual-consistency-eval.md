# MAKER Dual-Consistency Evaluation & Agent Agreement Loop

This document packages the dual-consistency control loop and evaluation provisions developed for Hierarchical Sheaf + MAKER systems (operadic self-consistency + sheaf residual energy).

It complements the residual energy / sheaf diffusion machinery already in `src/lib/sheaf/` (energy, diffuse, coboundary, Laplacian) and the hierarchical residual visualization.

## Dual Consistency Signals

1. **Operadic self-consistency** (discrete compositional side)  
   Candidate answers / plans / votes from micro-agents are composed through the Agentic Operad or Questions Operad. Self-consistency of the collapse is checked.

2. **Sheaf residual / Dirichlet energy** (continuous side)  
   \( E(\mathbf{x}) = \frac12 \|\delta_{\mathcal{F}} \mathbf{x}\|^2 \) (or nonlinear potential version).  
   High residual = local sections fail to glue into a global section.

Both signals must pass for acceptance. Residual spikes are the continuous disagreement oracle.

## MAKER Agent Agreement Control Loop

```
while not terminated:
    candidates ← micro-agents generate local sections / answers
    operadic_collapse ← compose via Questions/Agentic Operad
    residual ← Dirichlet energy of the current sheaf assignment

    if operadic_collapse is consistent AND residual < τ_low:
        accept and continue          # cheap path
    elif residual < τ_high:
        scoped_reeval(criteria=tightened, models=cheap)
    else:
        escalate(subproblem=high-residual components,
                 models=higher-capability or specialized)
        then drop back to cheap models after residual drops
```

- Residual magnitude gates cost: low residual stays on cheap models; high residual selectively escalates only the residual-bearing sub-tree.
- Projection onto symmetry-invariant subspace (\(\Pi_{\mathrm{sym}}\)) can be applied inside any residual diffusion step to keep movement harmonious.

## Evaluation Provisions (Theory vs Actual / Tooling / Edge Cases)

### Already present or nearly free
- Residual energy time-series (expected monotonic decrease under diffusion; actual spikes/plateaus diagnose disagreement or tooling).
- Operadic collapse success rate crossed with residual magnitude (dual mismatch = high-signal edge case).
- Residual-triggered control flow (spikes already designed as triggers for re-decomposition / escalation).
- Harmonic extension residual impact (before/after placement of new observations).

### Mechanical probes to instrument
| Provision | Checks | Diagnoses |
|-----------|--------|-----------|
| Residual time-series + dual cross-plot | Expected decay; dual agreement | Laplacian/restriction bugs; discrete-vs-continuous mismatch |
| Synthetic ground-truth sheaves | Known consistent vs conflicting sections | Detection latency, recovery correctness |
| Convergence rate vs theory | Linear residual decay under bounded delays | Discrete step / async bugs |
| Threshold / step-size sensitivity | Escalation only on genuine high residual | Tuning & cost-control edge cases |
| Symmetry-projection fidelity | Invariants preserved after projected steps | Broken \(\Pi_{\mathrm{sym}}\) |
| Escalation cost curve | Higher-cost models only when residual demands it | Selective-escalation logic |
| Local section / \(\delta x\) dumps on spikes | Where inconsistency lives | Restriction-map or stalk-dimension bugs |

### Practical diagnostic workflow
1. Log residual + operadic success on every MAKER agreement step.
2. Inject synthetic disagreements (conflicting local sections, delays, near-kernel modes).
3. Verify residual spikes, scoped-reevaluation path is taken, and residual recovers.
4. Surface dual mismatches (operadic pass + high residual, or residual low + operadic fail) as first-class health events.
5. Compare observed residual decay to theoretical guarantees from sheaf-diffusion literature.

## Link to Codebase

- Residual / energy / Laplacian: `src/lib/sheaf/energy.ts`, `diffuse.ts`, `cobb.ts`, `linear.ts`
- Hierarchical residual visualization and energy log: the main WebGL explorer
- Literature seeds (async sheaf diffusion, coordination sheaves, Game Sheaf, etc.): `docs/sources/`

Residual energy is already the continuous health signal; the operadic check is the discrete counterpart. Most evaluation surface is obtained by instrumenting the dual-consistency loop itself.

## References (selected)
- Asynchronous Nonlinear Sheaf Diffusion (arXiv:2510.00270)
- Distributed Multi-agent Coordination over Cellular Sheaves (arXiv:2504.02049)
- Questions Operad / Agentic Operad / MAKER nodes in the Hierarchical Sheaf GraphWiki
