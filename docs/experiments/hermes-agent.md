# Hermes Agent digest

Source-grounded sheaf of [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) `@ afc3d9d3` plus official docs.

- Graph: `docs/examples/hermes-agent.json` (id `hermes-agent`)
- 81 nodes / 70 edges / dim 12 harness families
- L0 waist files from architecture.md: `run_agent.py`, `tools/registry.py`, `hermes_state.py`, `toolsets.py`, `model_tools.py`, `hermes_cli/runtime_provider.py`, `agent/system_prompt.py`, `tools/approval.py`
- Method: tree + docs digest. Restriction edges follow the documented import chain in `tools/registry.py` and data flow in architecture.md / agent-loop.md.
- Not an AST family-hash. Do not run `from-code.mjs` or `sheaf:rich` on this repo.
- Separate from `langchainjs` / `langchainjs-rich` / builtin `literature`.
