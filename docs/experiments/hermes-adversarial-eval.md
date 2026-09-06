# Hermes lattice adversarial eval (2026-09-06)

## Live production (what the preview actually serves)

URL: https://stalks-and-sections.vercel.app/?g=hermes-agent
Repo file: `docs/examples/hermes-agent.json` on `main` @ `ec9ea9fd` SHA `247340f5`.

| check | result |
| --- | --- |
| Deep-link hydrates `hermes-agent` | PASS |
| Intro skipped on `?g=` | PASS |
| Dataset title | Hermes Agent digest |
| Size shown | **31 stalks · 29 restrictions** |
| Layers | Runtime waist / Subsystems / Surfaces / Adapters and docs |
| LCEL / langchainjs node ids | PASS — none |
| Isolation | PASS — separate dataset from langchainjs-rich |
| Comprehensive ingest reflected | **FAIL** — live bundle is the compact 31-node digest |

Live L0 ids (old compact set): `run-agent`, `prompt-builder`, `tool-registry`, `session-db`, `runtime-provider`, `profile-isolation`.

## Deeper digest that exists locally but is not deployed

`artifacts/hermes-agent.ship94.json` — 94 nodes / 93 edges / dim 12 / 2918 py+md files scored at NousResearch/hermes-agent@485aaf6.

This is a **hierarchical pool**, not an AST of every file. Playable cap is 120.

Covered waist (8 pinned L0): `run-agent`, `tools-registry`, `hermes-state`, `toolsets`, `model-tools`, `runtime-provider`, `system-prompt`, `tools-approval`.

## Honest gaps vs live tree @ df4c786

`agent/` has 200+ modules. Digest keeps ~20 first-class stalks. Pooled away:
- `agent/turn_*.py` (architecture.md: the turn loop lives here)
- `display.py`, `trajectory.py`, `learning_graph.py`, `compression_facade.py`
- provider adapters beyond anthropic/codex (bedrock, gemini, vertex)

`hermes_state_*.py` has ~20 siblings. Digest keeps 6. Missing first-class:
- fts, wal, gateway, compression, dbfile, guard, maintenance, portability, telegram, usage, registry, holders, errors, readpool, titles

`tools/` has 200+ modules. Digest keeps registry + a few surfaces. Pooled:
- `web_tools.py`, `code_execution_tool.py`, `terminal_tool.py`, `file_tools.py`, `process_registry.py`

`gateway/platforms/` and `plugins/platforms/` have 20+ adapters. Digest keeps telegram/discord/slack/whatsapp/signal.

Also not first-class: `hermes_startup_watchdog.py`, `hermes_bootstrap.py`, `docker/`, `evals/`, `native/`, `nix/`.

## Verdict

- Ingest of the **waist + documented subsystems** is real and source-grounded.
- Ingest is **not** a complete file-level map of Hermes.
- Live preview still serves the **31-node** compact digest.
- Overwrite `docs/examples/hermes-agent.json` with ship94 and rebuild to reflect the deeper pool.
