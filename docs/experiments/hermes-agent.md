# Hermes Agent digest — eval & honesty

**Walker:** [`scripts/sheaf/emit-hermes.py`](../scripts/sheaf/emit-hermes.py)
**Ingest:** [`docs/examples/hermes-agent.json`](../examples/hermes-agent.json)
**Clone scored:** NousResearch/hermes-agent @ `df4c786279ee2844c16a4a0fc60bc6d32e4b7988`
**Not used:** `from-code.mjs`, `rich-index.mjs`, LangChain.js LCEL ids

## Honesty clause

> Same preview URL after that land. It will not say “3387 files, one stalk each.” It will say **113 stalks · 112 restrictions** and the L0 waist `run-agent` / `tools-registry` / `hermes-state` / `toolsets` / `model-tools` / `runtime-provider` / `system-prompt` / `tools-approval`. That is the **complete playable ingest**. It is **not** a complete AST of the repo.

Read that as a completeness criterion, not a hedge:

| Claim | Meaning |
| --- | --- |
| Complete playable ingest | A reviewer can walk the runtime waist, open rooms, and see terracotta gluing failures without a 3k-node hairball. |
| Not a complete AST | File-per-node of 3387 py/md files is a different object and a worse explorer. |
| ~120 is a working set | Visible lattice heuristic, not an information cap. Interiors live in `rooms` / `pooledFrom`. |

If the HUD ever says “3387 stalks”, the ingest has failed its own brief.

## Sheaf vs AST (why 113 can beat 3387)

An AST is a syntax tree. A cellular sheaf on a code graph is a **consistency structure**: stalks (typed sections), restriction maps (how a module is allowed to look from its neighbour), residuals (where they fail to glue), pinned facts Diffuse may not move, and rooms (HiSP / Kron interiors).

| Capability | AST dump | This digest | Still missing |
| --- | --- | --- | --- |
| Node for every file | yes (3387) | no, on purpose | — |
| Hierarchy planes | maybe folders | runtime ⊂ subsystem ⊂ surface ⊂ adapter | — |
| Restriction maps | no | kind-tagged (`identity` / `projection` / `type-aware`) | numeric Procrustes / shared-symbol matrices |
| Residuals you can quote | no | terracotta = harness gluing failure | learned maps would change the numbers |
| Pinned L0 waist | no | 8 `known` stalks | — |
| Spaces-within-spaces | no | 10 unique interiors, 16 room keys | nested rooms beyond the authored set |
| Hold-out harmonic eval | no | **v2 ran it: sheaf 0.732 vs graph 0.851 — loses** | learned maps; see [`hermes-adv-v2.md`](hermes-adv-v2.md) |
| Isolation from LCEL | n/a | dataset id `hermes-agent`, 0 LCEL ids | — |

The sheaf is **on par with or better than an AST** when the consistency structure exists, not when the node count matches the file count. Today the maps are still **kind tags rebuilt by `makePair`**, not call-graph matrices. That gap is listed, not hidden.

## Working set

| | Count |
| --- | --- |
| Outer stalks | 113 |
| Outer restrictions | 112 |
| Levels | 4 (L0 pin … L3 adapter) |
| Family coordinates | 12 (loop, prompt, tools, state, memory, skills, providers, gateway, cron, acp, mcp, security) |
| L0 pins (`known`) | 8 |
| `pooledFrom` on outer | 10 |
| Room keys | 16 |
| Unique interiors | 10 |
| Aliased keys | 6 (waist pins share the `run-agent` room; long-tail aliases the platform room) |
| Restriction kinds | identity 46 · projection 56 · type-aware 10 |

Kinds on the outer lattice: runtime 8 · subsystem 45 · surface 22 · adapter 38.

## Unique rooms

| Key | Title | Interior size | What an AST would dump instead |
| --- | --- | --- | --- |
| `run-agent` | Runtime waist | 8 / 10 | every caller of `AIAgent` |
| `agent-conversation-loop` | Turn machine | 11 / 15 | `agent/turn_*.py` as siblings with no phase order |
| `hermes-cli-main` | CLI interior | 13 / 12 | 455 `hermes_cli` files |
| `hermes-state` | SessionDB siblings | 13 / 12 | every `hermes_state_*.py` plus gateway session |
| `tools-registry` | Tool registry | 15 / 15 | each `tools/*.py` |
| `gateway-run` | GatewayRunner | 9 / 8 | `gateway/` tree |
| `gateway-platform-registry` | Platform adapters | 14 / 13 | 22 adapter files, no identity-restrict claim |
| `optional-skills` | Optional skill packs | 8 / 7 | every `SKILL.md` |
| `plugin-memory` | Memory backends | 6 / 7 | three plugin folders, no SessionDB miss |
| `plugin-model-providers` | Extra providers | 7 / 6 | plugin files, no `api_mode` gluing |

Aliases (same interior, extra doors): `plugin-platforms-longtail` → platform room; `system-prompt`, `runtime-provider`, `tools-approval`, `toolsets`, `model-tools` → waist room.

## Ten terracotta claims (type-aware)

These are the edges a reviewer should be able to find and disagree with.

1. `plugin-memory` → `hermes-state` — Honcho/Mem0 can persist outside SessionDB.
2. `desktop-app` → `hermes-state` — desktop can be a second session writer.
3. `cron-scheduler` → `hermes-state` — cron starts a fresh AIAgent (lineage skip).
4. `mcp-serve` → `tools-approval` — external MCP can skip the dangerous-command gate.
5. `optional-skills` → `agent-prompt-builder` — optional pack often never injected.
6. `bot-relay` → `hermes-state` — bot-mode / peer DM can fork session lineage.
7. `plugin-context-engine` → `agent-prompt-builder` — plugin context engine is a parallel memory path.
8. `agent-moa-loop` → `run-agent` — MoA is a second conversation loop.
9. `gateway-session` → `hermes-state` — `gateway/session.py` vs SessionDB, two session objects.
10. `plugin-model-providers` → `runtime-provider` — plugin provider must match `api_mode`.

Room interiors repeat a subset of these so the claim is visible after Enter room.

## Honest gaps (quoted from the ingest `eval`)

- `hermes_cli` has 455 py files; the CLI room unfolds commands/setup/doctor/models — not every mixin.
- `agent/` has 204 py files; `turn_*` live in the conversation-loop room.
- `plugins/platforms` long-tail live in the platform-registry room.
- `evals/`, `docker/`, `native/`, `nix/` omitted as non-runtime.

Further gaps not in the JSON (reviewer notes):

- Restriction *matrices* are reconstructed from `restrictKind`, not estimated from symbols or traces.
- Hold-out harmonic-extension on this digest **loses** to identity-graph Laplacian (sheaf cosine 0.732 vs 0.851). Quoted in [`hermes-adv-v2.md`](hermes-adv-v2.md).
- Nested rooms stop at the authored set; a generic 1-hop induce (cap 16) is the fallback.
- Production GitHub `main` still serves the 31-node digest until this JSON lands.

## Reproduce

```bash
npm run sheaf:hermes        # emit docs/examples/hermes-agent.json + validate
npm run sheaf:hermes:pack   # artifacts/hermes-ship113/
```

QA against the running explorer: `node scripts/qa-hermes-room.mjs` (search `run_agent` → Enter room → 8 pinned stalks).
