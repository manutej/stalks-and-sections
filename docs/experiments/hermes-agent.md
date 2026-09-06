# Hermes Agent family digest

Walker: `scripts/sheaf/from-hermes.mjs`.
Files scored: 2918 py/md under `/tmp/hermes-agent` @ `485aaf6` (NousResearch/hermes-agent@main).
Nodes: 94 / edges: 91 / dim 12.
Layers: L0 8 pinned · L1 34 subsystems · L2 19 surfaces · L3 33 adapters/docs.

Not an official-architecture sketch. Each stalk is a real file or directory on the cloned tree. Restriction maps omitted in JSON and rebuilt at load. Missing sections stay zeros — no Gaussian fill.

Type-aware terracotta (documented gluing failures only):
- plugins/memory → SessionDB (Honcho/Mem0 second writer)
- apps/desktop → SessionDB (second session writer)
- cron/scheduler → SessionDB (fresh AIAgent, lineage skip)
- mcp_serve.py → approval (external MCP can skip the gate)
- optional-skills → prompt_builder (often never injected)
- tools/bot_relay.py → SessionDB (Bot Mode / peer DM can fork lineage)
- plugins/context_engine → prompt_builder (parallel memory path)
- agent/moa_loop.py → run_agent.py (second conversation loop)
- gateway/session.py → SessionDB (two session objects)
- plugins/model-providers → runtime_provider (api_mode mismatch)

Never from-code.mjs / rich-index.mjs. Dataset id stays `hermes-agent`.
