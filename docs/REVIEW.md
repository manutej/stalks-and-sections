# Review this build

One door. Do not start from a 3387-file tree.

| | |
| --- | --- |
| **What you see** | Cellular sheaf of [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent). **113 stalks · 112 restrictions · 10 interiors.** |
| **What you do not see** | An AST. 3387 py/md files were scored; they are not one stalk each. |
| **Live explorer** | Default dataset is `hermes-agent`. Deep link `?g=hermes-agent`. |
| **Pack** | `npm run sheaf:hermes:pack` → `artifacts/hermes-ship113/` |

## Walk (2 minutes)

1. Lattice loads on the 113-stalk working set. Names are **L0 pins + the topmost visible plane** — peel **Layers** to read the plane below. Toggle **Names** for the rest.
2. Right-hand **Review** ledger (empty selection): L0 waist, ten terracotta claims, ten unique rooms.
3. Search `run_agent` → **Enter room** (or double-click the hex ring). Eight pinned stalks. Breadcrumb **Hermes › run_agent.py AIAgent**. **Leave** restores the outer lattice.
4. Click a terracotta row to fly to the named gluing failure.

Esc / Close / empty plane deselects. Enter on a double-ring stalk unfolds it.

## Canonical files

| Role | Path |
| --- | --- |
| Emitter | [`scripts/sheaf/emit-hermes.py`](../scripts/sheaf/emit-hermes.py) |
| Playable JSON | [`docs/examples/hermes-agent.json`](examples/hermes-agent.json) |
| Schema | [`docs/examples/sheaf.schema.json`](examples/sheaf.schema.json) |
| Eval / honesty | [`docs/experiments/hermes-agent.md`](experiments/hermes-agent.md) |
| Land checklist | [`docs/experiments/hermes-land.md`](experiments/hermes-land.md) |
| Folder map | [`docs/FILEMAP.md`](FILEMAP.md) |
| Room runtime | [`src/lib/sheaf/room.ts`](../src/lib/sheaf/room.ts) |
| 2D review sheet | [`src/lib/sheaf/review.ts`](../src/lib/sheaf/review.ts) |

Rebuild: `npm run sheaf:hermes` then `npm run sheaf:hermes:pack`. Validate: `npm test` (includes the digest + rooms + isolation). QA: `npm run sheaf:qa`.

## Isolation

Dataset id `hermes-agent`. **Never** `from-code.mjs` or `rich-index.mjs` (those are LangChain.js). Zero LCEL node ids.

## GitHub

Production `main` still serves the **31-node** digest until this land. Do **not** merge `feat/hermes-94-land` — its blob is `PLACEHOLDER_WILL_FAIL`. Issue [manutej/stalks-and-sections#16](https://github.com/manutej/stalks-and-sections/issues/16). Steps: [`docs/experiments/hermes-land.md`](experiments/hermes-land.md).
