# HANDOFF — Stalks & Sections

**Repo:** [manutej/stalks-and-sections](https://github.com/manutej/stalks-and-sections)
**Branch to work on:** `enhancement` (fork from `main` v1)
**Product:** a WebGL explorer of *cellular sheaves* on a hierarchical knowledge graph
**This document:** what v1 actually is, where it fails under adversarial review, and the smallest set of changes that would make it useful across many kinds of data — not just a literature demo.

Read this before writing code. Architecture map: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Live tickets: [issues](https://github.com/manutej/stalks-and-sections/issues).

---

## 1. What you are looking at

A client-only sheaf engine (`src/lib/sheaf`) plus a Three.js lattice (`src/components/sheaf`). There is **no server state**. Auth / Postgres under `src/lib/auth` and `src/lib/db.ts` is unused scaffolding — do not extend it.

Two datasets ship in v1:

| id | What it is | What is real | What is sampled |
| --- | --- | --- | --- |
| `literature` | ~40 nodes, 4 hierarchy planes, sheaf papers + concepts | Graph, dims 2–16, typed restriction *kinds*, Dirichlet energy of whatever sections exist | Stalk vectors and numeric maps are generated from a seeded RNG in `build.ts` |
| `cobb` | Cobb–Gebhart TransE seed | Identity restrictions, translation vectors, closed-form harmonic extension (Thm 3.1) vs Euler (Thm 3.2) | Small |

**Operators that exist:** Diffuse (Euler on \(L_F\), known stalks frozen), Exact solve (Cobb only), Coarsen (HiSP-style pool), Hide noise, Layers, search, inspector stalk plot.

**UX that was just fixed:** Close / Esc / empty-plane deselect; `?` on every control; paper-chip labels on the topmost visible layer. Do not reintroduce a path where `mobilePanel === "inspect"` and `selectedId === null`.

---

## 2. Run / do not break

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
```

Invariants the UI and the math both assume:

1. `node.section.length === node.dim`
2. `Fsrc: source.dim → edgeDim`, `Ftgt: target.dim → edgeDim`
3. Diffuse **does not increase** Dirichlet energy; **boundary drift ≈ 0** on `known` stalks
4. Residual colour is a diverging teal → terracotta scale. Size encodes dimension. Hue encodes **ordered** hierarchy. No rainbow.
5. Drei `Html` labels are `pointer-events: none` (class `sheaf-html-wrap`). Labels must never trap the dock.
6. `select(null)` always sets `mobilePanel: "none"`.

If a change violates (3) or (4), it is not an enhancement.

---

## 3. Adversarial evaluation

The original brief asked for a **structured 3D map of a sheaf**, with **planes by functional grouping**, **symmetry folds**, and **2D slice-and-dice** that a person can actually review. v1 is a beautiful demo of *one* graph. It is not yet a tool. The following attacks were run against the running lattice, the algebra, and the source notes in `docs/sources/`.

### A1 — “This is a dressed-up force graph”

**Verdict: partly true, and the most dangerous critique.**

Layout is seeded rings + xz springs (`layout.ts`). Positions do **not** come from the sheaf Laplacian. Residuals colour the edges, but the *shape* of the lattice would look similar if every restriction were the identity.

Diffuse *does* walk sections toward \(\ker L_F\). On `literature`, those sections started as Gaussians, so energy falling is real algebra on fake data. On `cobb`, it is a proof: Euler vs closed form.

**Fix:** add a **spectral layout** option that embeds nodes from \(L_F\) (harmonic coordinates / Fiedler + next). Keep force as “readable strata.” If the two layouts disagree, that disagreement *is* the sheaf.

### A2 — “I cannot load my data”

**Verdict: true. This is the utility blocker.**

`DatasetId = "literature" | "cobb"`. `NodeKind` is `{paper, concept, algorithm, theorem, model, integrity}`. Levels are hardcoded `0 | 1 | 2 | 3`. There is no JSON import, no adapter, no generic kind.

**P0 shipped in part:** JSON schema, generator CLI, templates, and a catalog loader. See [`docs/GENERATE.md`](docs/GENERATE.md). Discourse triangle, geo fragment, and wiki-integrity are loadable datasets. Remaining: file-drop in the UI (issue #5) and generic kinds polish (#11).

### A3 — “2D review was promised and is missing”

**Verdict: true.**

The brief: *reviewed in 2D and along various views of layers (slice and dice with different filters)*. v1 has one camera. Peeling Layers hides planes; it does not give you a pageable 2D drawing. There is no Bertin matrix, no small-multiples, no export.

A 3D lattice is a *discovery* view. Analysis happens in 2D (matrix, multiples, slice). Without those, a reviewer cannot take a screenshot that argues a claim.

### A4 — “Variable-dimension stalks are cosmetic”

**Verdict: false on structure, true on content.**

Dims really differ (2–16). Restriction builders really change rank (`maps.ts`: identity / projection / embed / spectral / type-aware). Node size encodes dim. That part is honest.

Content is not: literature sections are RNG. Restriction *kind* is chosen from the relation string, not learned. So the visual novelty (multi-dim stalks) is structurally real and empirically unearned on the big graph.

**Fix:** at least one dataset where sections *mean something* (opinions, poses, embeddings, API signatures). Cobb is the existence proof; it is too small to carry the product.

### A5 — “H⁰ uniqueness is swept under the HUD”

**Verdict: true.**

Energy → 0 does not mean “the true assignment.” On an underdetermined sheaf the kernel is large; Diffuse picks one harmonic extension. The Cobb Exact path reports `unique`. The literature path never does.

**Fix:** report \(\dim \ker L_F\) (or a rank heuristic) next to energy. If it is > 0 after pinning known stalks, say **family of sections**, not **the** section.

### A6 — “Will die at a few hundred nodes”

**Verdict: true.**

~40 nodes, one `Html` chip each, one mesh each, CPU force layout. At 200+ you get a hairball of chips and a dropped frame budget. Coarsen exists but is a toggle, not a LOD.

**Fix:** default-pool above a threshold; instance meshes; labels only for the active slice + selection; matrix view for the rest.

### A7 — “Discourse and coordination sheaves are only vocabulary”

**Verdict: true, and this is the missed product.**

`docs/sources/discourse-sheaf.md`: vertex stalk = private opinion, edge stalk = what can be *said*, restriction = expression map. Consensus-in-speech over disagreement-in-belief is the whole point — and the thing LLM-agent people would actually use.

v1 draws a node titled “Discourse sheaf” on L2. It does not run a discourse sheaf.

Same for coordination (edge potentials \(U_e\)), async diffusion, best-response / game sheaves, interval sheaves.

### A8 — “Planes are only hierarchy, not functional grouping or symmetry”

**Verdict: true.**

The brief asked for planes by **functional grouping**, **key styles**, and **symmetry lines** (Noether folds by kind / syntax / linear). v1 planes are `level * LAYER_Z`. You cannot fold by `kind`, by restriction type, or by “this is the public cut of a private stalk.”

### A9 — “Encodings are Bertin-correct until they are not”

**Verdict: mostly good.**

Size = dim (quantitative). Hue = ordered level. Residual = diverging value. Restriction *kind* has no visual variable yet (inspector only) — that is a Bertin miss (issue #8). Label chips on a dense L3 slice still collide (issue #3). Glow slider does not change math; it is correctly documented as a reading aid.

### A10 — “The operator names still hide the job”

**Verdict: improved, not finished.**

`?` + Guide exist. “Coarsen / Diffuse / Exact” still require the primer. For a non-sheaf analyst the verb they want is: **smooth unknowns toward pinned facts** / **hide inconsistent links** / **merge clusters**. Keep the math names; lead with the verb in the dock (already partly done).

---

## 4. What “utility across scenarios” actually requires

A sheaf viewer is useful when **three** things are true at once:

1. **The user can bring a graph** (JSON / adapter), not only ours.
2. **Stalks and restrictions mean something in their domain** (opinion, pose, embedding, type, measurement) — so residual is a *claim*, not a colour.
3. **They can review that claim in 2D** (matrix, slice, export) and in 3D (strata, fold).

v1 has (3) only as 3D strata, (2) only on Cobb, (1) not at all.

So the enhancement sequence is not “more shaders.” It is:

| Priority | Capability | Unlocks |
| --- | --- | --- |
| P0 | Generic sheaf JSON + kinds/levels as data | Every scenario below |
| P0 | One semantically true extra example (discourse triangle) | Proof that residual ≠ decoration |
| P1 | 2D views: Bertin matrix + small-multiples + single-plane slice | Review, teaching, papers |
| P1 | Spectral layout toggle | Positions that are sheaf-faithful |
| P1 | Kernel-dimension next to energy | Intellectual honesty |
| P2 | Fleet / coordination / code / KG example pack | Breadth |
| P2 | Restriction-kind marks; collision-aware labels; LOD pool | Readability at size |
| P3 | Editable sections; URL state; persistent sheaf (scale axis) | Workbench |

GitHub issues #1–#8 cover pieces of this. They do **not** yet cover spectral layout, generic kinds, kernel-dimension, or the example pack — those should be opened from this handoff.

---

## 5. View catalog

One lattice, several **projections**. Selection, hover, and residual scale are shared. Do not invent a second colour system per view.

| View | Status | What the user is asking | Implementation sketch |
| --- | --- | --- | --- |
| **Strata 3D** | **v1** | “What is the hierarchy?” | Current Scene. Keep as default. |
| **Slice** | missing | “Show me only this plane, as a page.” | Camera ortho onto `y = level * LAYER_Z`; or hide other levels and lock polar angle. Issue #4. |
| **Small multiples** | missing | “Compare the four planes.” | Four 2D canvases, same xz layout, linked selection. Issue #2. |
| **Bertin matrix** | missing | “Which restrictions are noisy, in order?” | Rows/cols = stalks (or edges × edges); seriation by residual. Issue #1. |
| **Spectral** | missing | “Where does the sheaf think things sit?” | 2D/3D coords from smallest non-zero eigenmaps of \(L_F\). New. |
| **Fold (Noether)** | missing | “Group by kind / restriction / private↔public.” | Mirror or partition xz; do not destroy the sheaf. Issue #4 + roadmap v2. |
| **Energy** | partial | “Did Diffuse actually help?” | Sparkline exists in the dock after Diffuse; needs a persistent panel + CSV. |
| **Stalk inspector** | **v1** | “What is in this fibre?” | `StalkPlot` + neighbour residual bars. Next: drag to edit (§ P3). |
| **Timeline / persistent** | missing | “How does inconsistency evolve with scale / time?” | Extra axis; persistent sheaf Laplacian. Roadmap v2. |

**Filters that must apply to every view** (already in `useVisible.ts`, extend don’t replace):

- max level / slice
- search
- residual cut + hide noise
- kind / restriction-kind (new)
- known vs free
- high-dim vs low-dim stalks

**View chrome:** a single segmented control in the top bar (`Strata · Slice · Multiples · Matrix · Spectral`). Each has a `HINTS` entry. URL `?view=matrix&id=cellular-sheaf` later (P3).

---

## 6. Example catalog (scenarios)

Each example is a sheaf, not a metaphor. Residual must be interpretable in one sentence. Files go in `docs/examples/` as JSON matching the schema in §7. v1 ships none of these as runnable datasets except the two marked.

| Example | Sheaf reading | Why it earns a residual | Source |
| --- | --- | --- | --- |
| **Literature lattice** (v1) | Concepts/papers as stalks; citation/incidence as restrictions | “These two accounts of the same idea do not agree” — currently RNG | `lattice.ts` |
| **Cobb TransE** (v1) | Entities as stalks; relation as translation | Closed-form harmonic extension; energy is embedding error | `cobb.ts`, arXiv:2309.03773 |
| **Discourse triangle** (P0) | 3 agents; private \(\mathbb{R}^2\); public \(\mathbb{R}^1\); expression = projection | High residual = they *say* they agree and *believe* they don’t | Hansen–Ghrist S5; `docs/sources/discourse-sheaf.md` |
| **Fleet / candor** (P2) | Private vs expressed pair per agent; seam edges | GENUINE vs MANUFACTURED: concession vs leftover private energy | discourse + game sheaf notes |
| **Coordination formation** (P2) | Robot pose stalks; edge potentials \(U_e\) | Residual = formation error; Diffuse ≈ one ADMM inner step | S2, S1; `coordination-sheaf.md` |
| **Module / API sheaf** (P2) | Files as stalks (export signature dim); import = projection | Residual = used symbols that the exporter does not provide | New adapter; useful to engineers immediately |
| **KG fragment** (P2) | Entities + relations, TransE/RotatE maps | Residual = triple violation; pin a seed of true facts | Cobb generalized; JSON from any triple list |
| **Sensor overlap** (P2) | Patches as stalks; overlap = restriction | Residual = measurements that cannot be the same field | Robinson S8, S9 |
| **Wiki itself** (P2) | Pages as stalks; `wiki.yaml` relations as restrictions | Residual = type/relation integrity (the wiki’s own `link.integrity` lens) | `docs/sources/wiki.yaml` |
| **Dependency graph** (P2) | Packages as stalks; depends_on = projection of API | Residual = broken or version-skewed constraint | Sister repo `sheaf-dep-ethereum` as an adapter target |

**Do not add an example whose sections are Gaussians.** If we cannot name what coordinate 0 means, it does not ship.

The **discourse triangle** is the first extra example because it is tiny, classic, and makes residual *morally* different from a graph weight. A draft JSON lives at [`docs/examples/discourse-triangle.json`](docs/examples/discourse-triangle.json).

---

## 7. JSON schema (contract for import)

Draft schema: [`docs/examples/sheaf.schema.json`](docs/examples/sheaf.schema.json).

Minimum a loader must accept:

```json
{
  "id": "discourse-triangle",
  "title": "…",
  "levels": [{ "id": 0, "label": "Private" }, { "id": 1, "label": "Said" }],
  "nodes": [
    {
      "id": "alice",
      "title": "Alice",
      "kind": "agent",
      "level": 0,
      "dim": 2,
      "known": true,
      "section": [0.8, 0.1]
    }
  ],
  "edges": [
    {
      "source": "alice",
      "target": "channel-ab",
      "relation": "expresses",
      "restrictKind": "projection",
      "Fsrc": [[1, 0]]
    }
  ]
}
```

Rules:

- `section` optional → loader may refuse (prefer this) or fill zeros. **Do not silently Gaussian-fill imported graphs.**
- `Fsrc` / `Ftgt` optional only when `restrictKind` is set; then `maps.makePair` is allowed.
- `kind` and `level` are strings/ints in the file; the app maps them. Stop using a closed `NodeKind` union for datasets.
- Unknown fields ignored. Invalid maps → visible error, canvas stays on the previous graph.

---

## 8. Recommended PR sequence

Work on `enhancement`. One concern per PR. Screenshot-testable.

| PR | Issue | Why this order |
| --- | --- | --- |
| **0. Handoff + schema + discourse JSON** | this commit | Contract before features |
| **1. Generic loader + dataset switcher** | #5, plus generic kinds | Unblocks every example |
| **2. Wire discourse-triangle as third dataset** | new | Semantic residual; teaching demo |
| **3. Energy HUD: kernel hint + export CSV** | #7 (tests) + HUD | Honesty + CI lock on Cobb |
| **4. Bertin matrix view** | #1 | 2D review, the original brief |
| **5. Small multiples + slice** | #2, #4 (slice half) | Layer-wise reading |
| **6. Spectral layout toggle** | new | Sheaf-faithful positions |
| **7. Restriction-kind marks + label collision** | #8, #3 | Read the existing lattice better |
| **8. Example pack** (fleet, modules, KG fragment) | #6 + new | Breadth |
| **9. Fold / symmetry** | #4 rest | Functional grouping planes |
| **10. Edit stalk + URL state** | roadmap P3 | Workbench |

If time allows only **one** enhancement after this handoff: **PR 1 + PR 2**. That single pair turns a demo into a tool.

---

## 9. Code map (where to touch)

```
src/lib/sheaf/          algebra — keep this pure, testable, no React
  types.ts              widen DatasetId, NodeKind; add ViewMode elsewhere
  build.ts              add buildFromJson(); stop RNG-filling when section given
  maps.ts               restriction builders
  energy.ts             Dirichlet, residuals; add kernel/rank helper
  diffuse.ts            Euler
  closed-form.ts        Cobb only
  layout.ts             force strata; add layoutSpectral()
src/store/sheaf.ts      the only app state; add view, loadCustom, kernelDim
src/components/sheaf/
  canvas/Scene.tsx      strata; respect view (or sibling canvases)
  chrome/Dock.tsx       operators
  chrome/Hint.tsx       HINTS copy — required for every new control
  chrome/TopBar.tsx     dataset + view switcher
docs/examples/          JSON graphs + schema
docs/sources/           literature notes; not runtime
```

Dead: `chrome/HoverChip.tsx` is unused (CueBar replaced it). Safe to delete in a cleanup PR.

---

## 10. Definition of done for “useful across scenarios”

A stranger can:

1. Drop a JSON sheaf (or pick Discourse / Cobb / Literature).
2. See **energy** and whether the assignment is unique given the pins.
3. Switch **Strata / Slice / Multiples / Matrix** without losing selection.
4. Point at a terracotta edge and say, in domain words, what is inconsistent.
5. Diffuse and watch energy fall; Close still returns from a node.
6. Export residuals.
7. Do this at 390px width.

Until (1) and (4) are true, do not add more visual polish.

---

## 11. Non-goals (still)

- Accounts, multiplayer, database
- A common ambient dimension for all stalks
- Rainbow maps, hairball-as-default
- Replacing \(L_F\) with a black-box GNN
- Vendoring copyrighted PDFs
- Changing Grok preview-host / PWA scaffolding unless it blocks a view

---

## 12. Open tickets (already filed)

| # | Title | Maps to |
| --- | --- | --- |
| [#1](https://github.com/manutej/stalks-and-sections/issues/1) | Bertin matrix | View: Matrix |
| [#2](https://github.com/manutej/stalks-and-sections/issues/2) | Small multiples | View: Multiples |
| [#3](https://github.com/manutej/stalks-and-sections/issues/3) | Collision-aware labels | UX |
| [#4](https://github.com/manutej/stalks-and-sections/issues/4) | Slice + symmetry folds | View: Slice / Fold |
| [#5](https://github.com/manutej/stalks-and-sections/issues/5) | JSON import | P0 loader |
| [#6](https://github.com/manutej/stalks-and-sections/issues/6) | Discourse / fleet dataset | Example pack |
| [#7](https://github.com/manutej/stalks-and-sections/issues/7) | Energy tests in CI | Honesty |
| [#8](https://github.com/manutej/stalks-and-sections/issues/8) | Typed restriction marks | Bertin |
| [#9](https://github.com/manutej/stalks-and-sections/issues/9) | Spectral layout from \(L_F\) | View: Spectral |
| [#10](https://github.com/manutej/stalks-and-sections/issues/10) | Kernel-dimension HUD | Honesty |
| [#11](https://github.com/manutej/stalks-and-sections/issues/11) | Generic kind / level | P0 loader |
| [#12](https://github.com/manutej/stalks-and-sections/issues/12) | Example pack | Breadth |

**File next (from this eval):** spectral layout (#9); kernel-dimension HUD (#10); generic `kind` (#11); example-pack (#12).

---

When you pick this up, start at §8 PR 1. If something in v1’s Close-path, residual scale, or Cobb energy monotonicity regresses, stop and fix that first.
