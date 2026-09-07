#!/usr/bin/env python3
"""Emit docs/examples/hermes-agent.json — playable 113-stalk digest + rooms.

Not an AST. Outer lattice is the runtime waist + scored subsystems.
Rooms are interiors of fat stalks (CLI mixins, turn_*, platforms, memory backends).
"""
from __future__ import annotations

import json
import math
from pathlib import Path

FAM = [
    "loop",
    "prompt",
    "tools",
    "state",
    "memory",
    "skills",
    "providers",
    "gateway",
    "cron",
    "acp",
    "mcp",
    "security",
]
GH = "https://github.com/NousResearch/hermes-agent"


def vec(**kw) -> list[float]:
    v = [float(kw.get(k, 0.0)) for k in FAM]
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [round(x / n, 3) for x in v]


def src(path: str, tree: bool = False) -> list[str]:
    kind = "tree" if tree else "blob"
    return [f"{GH}/{kind}/main/{path}"]


def N(
    id: str,
    title: str,
    kind: str,
    level: int,
    section: list[float],
    summary: str,
    sources: list[str],
    known: bool = False,
    pooled: list[str] | None = None,
) -> dict:
    n = {
        "id": id,
        "title": title,
        "kind": kind,
        "level": level,
        "dim": 12,
        "known": known,
        "section": section,
        "summary": summary,
        "sources": sources,
    }
    if pooled:
        n["pooledFrom"] = pooled
    return n


def E(source: str, target: str, kind: str, note: str, relation: str = "restricts") -> dict:
    return {
        "source": source,
        "target": target,
        "relation": relation,
        "restrictKind": kind,
        "note": note,
    }


# ---------------------------------------------------------------------------
# Outer working set — 113 stalks. L0 is the pinned runtime waist.
# ---------------------------------------------------------------------------

nodes: list[dict] = [
    # L0 pins
    N("run-agent", "run_agent.py AIAgent", "runtime", 0, vec(loop=0.68, prompt=0.32, tools=0.48, state=0.2, memory=0.2, providers=0.32, mcp=0.12, security=0.12), "Pinned loop. AIAgent.run_conversation.", src("run_agent.py"), True),
    N("tools-registry", "tools/registry.py", "runtime", 0, vec(loop=0.22, prompt=0.24, tools=0.44, state=0.23, memory=0.18, skills=0.37, providers=0.21, gateway=0.12, cron=0.2, acp=0.2, mcp=0.44, security=0.39), "Pinned ToolRegistry.", src("tools/registry.py"), True, ["tool-web", "tool-code-exec", "tool-process-registry", "tool-terminal", "tool-file", "tool-browser", "tool-computer-use", "tool-mcp", "tool-delegate", "tool-cronjob", "tools-memory-tool", "tools-skills-hub"]),
    N("hermes-state", "hermes_state.py SessionDB", "runtime", 0, vec(state=0.9, memory=0.1, gateway=0.16, cron=0.16, acp=0.1, security=0.36), "Pinned SessionDB + FTS5.", src("hermes_state.py"), True, ["hermes-state-schema", "hermes-state-search", "hermes-state-common", "hermes-state-sessions", "hermes-state-messages", "hermes-state-repair", "hermes-state-fts", "hermes-state-wal", "hermes-state-gateway", "hermes-state-compression"]),
    N("toolsets", "toolsets.py", "runtime", 0, vec(tools=0.9, mcp=0.4, security=0.14), "Pinned named toolset bundles.", src("toolsets.py"), True),
    N("model-tools", "model_tools.py", "runtime", 0, vec(loop=0.13, tools=0.69, providers=0.13, gateway=0.2, acp=0.37, mcp=0.37, security=0.42), "Pinned handle_function_call.", src("model_tools.py"), True),
    N("runtime-provider", "runtime_provider.py", "runtime", 0, vec(providers=1.0), "Pinned ProviderResolver.", src("hermes_cli/runtime_provider.py"), True),
    N("system-prompt", "agent/system_prompt.py", "runtime", 0, vec(loop=0.17, prompt=0.85, memory=0.39, gateway=0.17, security=0.27), "Pinned prompt-tier hook.", src("agent/system_prompt.py"), True),
    N("tools-approval", "tools/approval.py", "runtime", 0, vec(memory=0.18, skills=0.33, mcp=0.12, security=0.92), "Pinned dangerous-command gate.", src("tools/approval.py"), True),
    # L1 subsystems
    N("agent-conversation-loop", "conversation_loop.py", "subsystem", 1, vec(loop=0.46, prompt=0.32, tools=0.21, state=0.26, memory=0.25, skills=0.29, providers=0.34, gateway=0.09, cron=0.25, acp=0.28, mcp=0.29, security=0.3), "Inner turn machine.", src("agent/conversation_loop.py"), False, ["agent-turn-pool", "turn-prep", "turn-api", "turn-error", "turn-overflow", "turn-truncation", "turn-recovery", "agent-display", "subagent-lifecycle"]),
    N("agent-prompt-builder", "agent/prompt_builder.py", "subsystem", 1, vec(loop=0.14, prompt=0.81, skills=0.4, security=0.4), "SOUL/USER/MEMORY/skills inject.", src("agent/prompt_builder.py")),
    N("agent-prompt-caching", "agent/prompt_caching.py", "subsystem", 1, vec(loop=0.25, prompt=0.94, state=0.25), "Anthropic prefix cache markers.", src("agent/prompt_caching.py")),
    N("agent-context-compressor", "context_compressor.py", "subsystem", 1, vec(loop=0.14, prompt=0.74, state=0.33, memory=0.53, providers=0.14, cron=0.14), "Lossy summarize at context cap.", src("agent/context_compressor.py")),
    N("agent-context-engine", "agent/context_engine.py", "subsystem", 1, vec(prompt=1.0), "Pluggable context engine.", src("agent/context_engine.py")),
    N("agent-memory-manager", "agent/memory_manager.py", "subsystem", 1, vec(loop=0.31, tools=0.45, memory=0.78, security=0.31), "MEMORY.md through SessionDB.", src("agent/memory_manager.py")),
    N("agent-memory-provider", "agent/memory_provider.py", "subsystem", 1, vec(memory=0.87, security=0.5), "Memory provider interface.", src("agent/memory_provider.py")),
    N("agent-tool-executor", "agent/tool_executor.py", "subsystem", 1, vec(loop=0.35, tools=0.64, state=0.15, memory=0.15, mcp=0.24, security=0.61), "Post-registry tool execution.", src("agent/tool_executor.py")),
    N("agent-curator", "agent/curator.py", "subsystem", 1, vec(loop=0.51, prompt=0.15, skills=0.75, providers=0.24, cron=0.31), "Closed learning loop.", src("agent/curator.py")),
    N("agent-skill-commands", "agent/skill_commands.py", "subsystem", 1, vec(prompt=0.3, skills=0.81, cron=0.15, security=0.49), "Progressive skill disclosure.", src("agent/skill_commands.py")),
    N("agent-anthropic-adapter", "anthropic_adapter.py", "subsystem", 1, vec(prompt=0.2, providers=0.96, mcp=0.2), "Anthropic messages adapter.", src("agent/anthropic_adapter.py")),
    N("agent-codex-adapter", "codex_responses_adapter", "subsystem", 1, vec(loop=0.38, prompt=0.16, state=0.16, providers=0.77, mcp=0.26, security=0.38), "Codex responses adapter.", src("agent/codex_responses_adapter.py")),
    N("agent-moa-loop", "agent/moa_loop.py", "subsystem", 1, vec(loop=0.61, prompt=0.67, providers=0.36, security=0.22), "Mixture-of-agents second loop.", src("agent/moa_loop.py")),
    N("agent-file-safety", "agent/file_safety.py", "subsystem", 1, vec(prompt=0.22, acp=0.35, mcp=0.35, security=0.84), "Write-path safety checks.", src("agent/file_safety.py")),
    N("agent-init", "agent/agent_init.py", "subsystem", 1, vec(loop=0.51, prompt=0.38, tools=0.18, state=0.18, memory=0.36, providers=0.52, acp=0.26, mcp=0.11, security=0.23), "AIAgent construction.", src("agent/agent_init.py")),
    N("agent-runtime-helpers", "agent_runtime_helpers", "subsystem", 1, vec(loop=0.63, prompt=0.47, tools=0.12, memory=0.23, providers=0.54, acp=0.12, mcp=0.12), "Runtime helpers for the loop.", src("agent/agent_runtime_helpers.py")),
    N("auxiliary-client", "auxiliary_client.py", "subsystem", 1, vec(loop=0.14, providers=0.95, acp=0.27), "Aux / sidecar model client.", src("agent/auxiliary_client.py")),
    N("chat-completion-helpers", "chat_completion_helpers", "subsystem", 1, vec(loop=0.26, state=0.13, providers=0.96), "Chat Completions shaping.", src("agent/chat_completion_helpers.py")),
    N("conversation-compression", "conversation_compression", "subsystem", 1, vec(loop=0.35, prompt=0.63, state=0.52, memory=0.38, gateway=0.13, security=0.21), "Turn-level compression.", src("agent/conversation_compression.py")),
    N("credential-pool", "credential_pool.py", "subsystem", 1, vec(providers=0.87, security=0.5), "Provider credential pool.", src("agent/credential_pool.py")),
    N("hermes-state-schema", "hermes_state_schema.py", "subsystem", 1, vec(prompt=0.18, state=0.98), "SQLite schema.", src("hermes_state_schema.py")),
    N("hermes-state-search", "hermes_state_search.py", "subsystem", 1, vec(state=1.0), "FTS5 reader.", src("hermes_state_search.py")),
    N("hermes-state-common", "hermes_state_common.py", "subsystem", 1, vec(state=1.0), "Shared SessionDB helpers.", src("hermes_state_common.py")),
    N("hermes-state-sessions", "hermes_state_sessions.py", "subsystem", 1, vec(loop=0.34, prompt=0.21, state=0.92), "Session row CRUD.", src("hermes_state_sessions.py")),
    N("hermes-state-messages", "hermes_state_messages.py", "subsystem", 1, vec(state=0.98, memory=0.19), "Message log writer.", src("hermes_state_messages.py")),
    N("hermes-state-repair", "hermes_state_repair.py", "subsystem", 1, vec(state=0.99, cron=0.16), "DB repair / migrate.", src("hermes_state_repair.py")),
    N("hermes-logging", "hermes_logging.py", "subsystem", 1, vec(mcp=1.0), "Logging facade.", src("hermes_logging.py")),
    N("hermes-constants", "hermes_constants.py", "subsystem", 1, vec(tools=0.2, acp=0.2, security=0.96), "HERMES_HOME and constants.", src("hermes_constants.py")),
    N("hermes-cli-config", "hermes_cli/config.py", "subsystem", 1, vec(prompt=0.37, tools=0.25, skills=0.16, providers=0.16, cron=0.25, acp=0.25, mcp=0.45, security=0.65), "CLI config load.", src("hermes_cli/config.py")),
    N("hermes-cli-plugins", "hermes_cli/plugins.py", "subsystem", 1, vec(prompt=0.31, tools=0.21, state=0.24, memory=0.24, skills=0.21, gateway=0.29, cron=0.27, mcp=0.41, security=0.61), "Plugin discovery.", src("hermes_cli/plugins.py")),
    N("hermes-cli-auth", "hermes_cli/auth.py", "subsystem", 1, vec(providers=0.34, acp=0.78, security=0.53), "Auth / creds CLI.", src("hermes_cli/auth.py")),
    N("tools-skills-hub", "tools/skills_hub.py", "subsystem", 1, vec(loop=0.15, prompt=0.32, tools=0.32, state=0.12, skills=0.51, gateway=0.08, cron=0.18, acp=0.12, mcp=0.46, security=0.48), "Skill pack loader.", src("tools/skills_hub.py")),
    N("tools-memory-tool", "tools/memory_tool.py", "subsystem", 1, vec(prompt=0.22, tools=0.22, memory=0.89, security=0.35), "Memory tool surface.", src("tools/memory_tool.py")),
    N("trajectory-compressor", "trajectory_compressor.py", "subsystem", 1, vec(security=1.0), "Batch trajectory compress.", src("trajectory_compressor.py")),
    N("agent-turn-pool", "agent/turn_*.py", "subsystem", 1, vec(loop=0.47, prompt=0.45, state=0.27, memory=0.11, providers=0.47, gateway=0.32, cron=0.25, acp=0.11, mcp=0.3, security=0.11), "Turn machine — architecture.md says the loop lives here.", src("agent", True)),
    N("agent-display", "agent/display.py", "subsystem", 1, vec(loop=0.47, skills=0.75, mcp=0.47), "KawaiiSpinner and tool preview formatting.", src("agent/display.py")),
    N("agent-trajectory", "agent/trajectory.py", "subsystem", 1, vec(loop=1.0), "ShareGPT trajectory helpers.", src("agent/trajectory.py")),
    N("agent-model-metadata", "agent/model_metadata.py", "subsystem", 1, vec(loop=0.58, prompt=0.58, providers=0.58), "Context lengths and models.dev registry.", src("agent/model_metadata.py")),
    N("agent-compression-facade", "compression_facade.py", "subsystem", 1, vec(loop=0.71, state=0.71), "Compression facade over context engines.", src("agent/compression_facade.py")),
    N("hermes-state-fts", "hermes_state_fts.py", "subsystem", 1, vec(state=1.0), "FTS5 index writer/reader sibling.", src("hermes_state_fts.py")),
    N("hermes-state-wal", "hermes_state_wal.py", "subsystem", 1, vec(state=1.0), "WAL journal mode sibling.", src("hermes_state_wal.py")),
    N("hermes-state-gateway", "hermes_state_gateway.py", "subsystem", 1, vec(state=1.0), "Gateway-facing session rows.", src("hermes_state_gateway.py")),
    N("hermes-state-compression", "hermes_state_compression", "subsystem", 1, vec(state=1.0), "Persisted compression state.", src("hermes_state_compression.py")),
    N("hermes-cli-commands", "hermes_cli/commands.py", "subsystem", 1, vec(tools=0.36, skills=0.23, gateway=0.36, mcp=0.59, security=0.59), "COMMAND_REGISTRY slash commands.", src("hermes_cli/commands.py")),
    N("hermes-cli-models", "hermes_cli/models.py", "subsystem", 1, vec(loop=0.05, providers=1.0, security=0.1), "Model catalog and /model switch.", src("hermes_cli/models.py")),
    # L2 surfaces
    N("cli", "cli.py entry", "surface", 2, vec(loop=0.37, prompt=0.24, tools=0.6, state=0.33, providers=0.24, gateway=0.2, mcp=0.33, security=0.35), "Interactive CLI entry.", src("cli.py")),
    N("hermes-cli-main", "hermes_cli/main.py", "surface", 2, vec(loop=0.23, prompt=0.27, tools=0.32, state=0.31, memory=0.25, skills=0.27, providers=0.31, gateway=0.26, cron=0.26, acp=0.21, mcp=0.35, security=0.38), "CLI command router. Pools 451 hermes_cli files.", src("hermes_cli/main.py"), False, ["hermes-cli-commands", "hermes-cli-setup", "hermes-cli-doctor", "hermes-cli-models", "hermes-cli-config", "hermes-cli-plugins", "hermes-cli-auth", "hermes-cli-profiles", "cli-model-switch", "cli-checkpoints", "cli-callbacks"]),
    N("gateway-run", "gateway/run.py", "surface", 2, vec(loop=0.35, prompt=0.27, tools=0.2, state=0.36, memory=0.18, skills=0.11, providers=0.15, gateway=0.5, cron=0.26, acp=0.09, mcp=0.27, security=0.41), "GatewayRunner.", src("gateway/run.py"), False, ["gateway-session", "gateway-delivery", "gateway-pairing", "gateway-platform-registry", "gateway-hooks", "api-server"]),
    N("gateway-session", "gateway/session.py", "surface", 2, vec(prompt=0.59, state=0.62, mcp=0.46, security=0.23), "Gateway session object.", src("gateway/session.py")),
    N("gateway-delivery", "gateway/delivery.py", "surface", 2, vec(gateway=1.0), "Outbound delivery.", src("gateway/delivery.py")),
    N("gateway-pairing", "gateway/pairing.py", "surface", 2, vec(gateway=0.65, security=0.76), "DM pairing.", src("gateway/pairing.py")),
    N("gateway-platform-registry", "platform_registry.py", "surface", 2, vec(loop=0.26, prompt=0.2, tools=0.38, state=0.14, gateway=0.57, cron=0.28, acp=0.09, mcp=0.09, security=0.57), "Platform plugin registry.", src("gateway/platform_registry.py"), False, ["plat-telegram", "plat-discord", "plat-slack", "plat-whatsapp", "plat-signal", "plat-matrix", "plat-mattermost", "plat-email", "plat-homeassistant", "plat-teams"]),
    N("cron-scheduler", "cron/scheduler.py", "surface", 2, vec(loop=0.37, prompt=0.08, tools=0.08, state=0.29, providers=0.25, gateway=0.16, cron=0.66, mcp=0.36, security=0.35), "Fresh AIAgent, no history.", src("cron/scheduler.py")),
    N("acp-server", "acp_adapter/", "surface", 2, vec(loop=0.33, prompt=0.19, tools=0.22, state=0.25, memory=0.12, skills=0.19, providers=0.12, acp=0.68, mcp=0.29, security=0.35), "IDE ACP server.", src("acp_adapter", True)),
    N("mcp-serve", "mcp_serve.py", "surface", 2, vec(state=0.43, mcp=0.77, security=0.47), "MCP server + client.", src("mcp_serve.py")),
    N("desktop-app", "apps/desktop", "surface", 2, vec(gateway=0.41, cron=0.24, security=0.88), "Electron. Second-writer risk.", src("apps/desktop", True)),
    N("batch-runner", "batch_runner.py", "surface", 2, vec(loop=0.91, prompt=0.36, tools=0.22), "Trajectory dump path.", src("batch_runner.py")),
    N("tui", "ui-tui + tui_gateway", "surface", 2, vec(loop=0.36, prompt=0.3, tools=0.31, state=0.29, memory=0.11, skills=0.17, providers=0.24, gateway=0.3, cron=0.16, acp=0.13, mcp=0.39, security=0.46), "Terminal UI.", src("ui-tui", True)),
    N("api-server", "gateway api_server", "surface", 2, vec(loop=0.39, prompt=0.16, tools=0.33, state=0.36, memory=0.1, providers=0.23, gateway=0.49, cron=0.16, mcp=0.16, security=0.47), "HTTP API surface.", src("gateway/platforms/api_server.py")),
    N("voice-mode", "tools/voice_mode.py", "surface", 2, vec(gateway=1.0), "Voice + wake word.", src("tools/voice_mode.py")),
    N("bot-relay", "tools/bot_relay.py", "surface", 2, vec(loop=0.19, prompt=0.67, tools=0.3, skills=0.19, gateway=0.33, mcp=0.3, security=0.44), "Bot-to-bot / Bot Mode.", src("tools/bot_relay.py")),
    N("hosted-room-driver", "hosted room driver", "surface", 2, vec(gateway=1.0), "Hosted room dispatch.", src("gateway/platforms/api_server_room_dispatch.py")),
    N("hermes-cli-profiles", "hermes_cli/profiles.py", "surface", 2, vec(prompt=0.36, memory=0.4, skills=0.2, security=0.82), "Profile isolation.", src("hermes_cli/profiles.py")),
    N("mini-swe-runner", "mini_swe_runner.py", "surface", 2, vec(prompt=1.0), "SWE-bench mini runner.", src("mini_swe_runner.py")),
    N("hermes-cli-setup", "hermes_cli/setup.py", "surface", 2, vec(tools=0.5, gateway=0.21, mcp=0.68, security=0.5), "Interactive setup wizard.", src("hermes_cli/setup.py")),
    N("hermes-cli-doctor", "hermes_cli/doctor.py", "surface", 2, vec(prompt=0.3, tools=0.26, state=0.43, memory=0.39, providers=0.4, mcp=0.34, security=0.49), "hermes doctor diagnostics.", src("hermes_cli/doctor.py")),
    N("gateway-hooks", "gateway/hooks.py", "surface", 2, vec(loop=0.1, gateway=1.0, security=0.1), "Gateway hook bus.", src("gateway/hooks.py")),
    # L3 adapters
    N("plat-telegram", "plugins telegram", "adapter", 3, vec(gateway=0.8, security=0.6), "Telegram adapter.", src("plugins/platforms/telegram", True)),
    N("plat-discord", "plugins discord", "adapter", 3, vec(gateway=0.72, mcp=0.18, security=0.67), "Discord adapter.", src("plugins/platforms/discord", True)),
    N("plat-slack", "plugins slack", "adapter", 3, vec(gateway=0.63, security=0.78), "Slack adapter.", src("plugins/platforms/slack", True)),
    N("plat-whatsapp", "whatsapp adapters", "adapter", 3, vec(gateway=0.42, security=0.91), "WhatsApp adapter.", src("gateway/platforms/whatsapp_cloud.py")),
    N("plat-signal", "signal adapter", "adapter", 3, vec(gateway=0.36, cron=0.93), "Signal adapter.", src("gateway/platforms/signal.py")),
    N("tool-terminal", "tools/environments", "adapter", 3, vec(loop=0.22, tools=0.38, acp=0.51, security=0.75), "Terminal backends.", src("tools/environments", True)),
    N("tool-browser", "tools/browser_tool.py", "adapter", 3, vec(tools=1.0), "Browser backends.", src("tools/browser_tool.py")),
    N("tool-file", "file_operations.py", "adapter", 3, vec(tools=1.0), "File tools.", src("tools/file_operations.py")),
    N("tool-delegate", "tools/delegate_tool.py", "adapter", 3, vec(loop=0.66, prompt=0.16, tools=0.56, state=0.42, acp=0.16, security=0.16), "Child AIAgent.", src("tools/delegate_tool.py")),
    N("tool-cronjob", "tools cron job", "adapter", 3, vec(tools=0.23, providers=0.15, cron=0.91, mcp=0.15, security=0.29), "Cron tool.", src("tools/cronjob_tools.py")),
    N("tool-mcp", "tools/mcp_tool.py", "adapter", 3, vec(mcp=0.97, security=0.23), "MCP client tool.", src("tools/mcp_tool.py")),
    N("tool-computer-use", "tools/computer_use", "adapter", 3, vec(tools=0.34, mcp=0.72, security=0.61), "Computer-use stack.", src("tools/computer_use", True)),
    N("tool-web", "tools/web_tools.py", "adapter", 3, vec(tools=1.0), "Web search/fetch tools.", src("tools/web_tools.py")),
    N("tool-code-exec", "code_execution_tool.py", "adapter", 3, vec(tools=0.45, mcp=0.23, security=0.86), "Sandboxed code execution.", src("tools/code_execution_tool.py")),
    N("tool-process-registry", "process_registry.py", "adapter", 3, vec(tools=1.0), "Background process registry.", src("tools/process_registry.py")),
    N("skills-software", "skills/software-dev", "adapter", 3, vec(prompt=0.13, tools=0.38, skills=0.71, gateway=0.13, mcp=0.2, security=0.53), "Shipped software skills.", src("skills/software-development", True)),
    N("skills-research", "skills/research", "adapter", 3, vec(skills=0.73, security=0.69), "Shipped research skills.", src("skills/research", True)),
    N("optional-skills", "optional-skills/", "adapter", 3, vec(loop=0.05, prompt=0.39, tools=0.32, state=0.05, memory=0.32, skills=0.39, providers=0.18, cron=0.35, acp=0.09, mcp=0.43, security=0.38), "Install-gated packs. Often never injected.", src("optional-skills", True), False, ["skill-creative", "skill-devops", "skill-data", "skill-personal", "skill-home"]),
    N("optional-mcps", "optional-mcps/", "adapter", 3, vec(mcp=1.0), "Optional MCP packs.", src("optional-mcps", True)),
    N("plugin-memory", "plugins/memory", "adapter", 3, vec(loop=0.15, prompt=0.35, state=0.3, memory=0.77, mcp=0.12, security=0.39), "Honcho/Mem0/Hindsight.", src("plugins/memory", True), False, ["mem-honcho", "mem-mem0", "mem-hindsight"]),
    N("plugin-model-providers", "plugins/model-providers", "adapter", 3, vec(providers=0.88, acp=0.44, security=0.21), "Extra providers.", src("plugins/model-providers", True), False, ["prov-custom", "prov-local", "prov-bedrock"]),
    N("plugin-context-engine", "plugins/context_engine", "adapter", 3, vec(prompt=1.0), "Plugin context engine.", src("plugins/context_engine", True)),
    N("plugin-observability", "plugins/observability", "adapter", 3, vec(prompt=1.0), "Tracing / metrics plugin.", src("plugins/observability", True)),
    N("plugin-web", "plugins/web", "adapter", 3, vec(mcp=1.0), "Web plugin.", src("plugins/web", True)),
    N("plugin-image-gen", "plugins/image_gen", "adapter", 3, vec(providers=1.0), "Image gen plugin.", src("plugins/image_gen", True)),
    N("plugin-kanban", "plugins/kanban", "adapter", 3, vec(security=1.0), "Kanban plugin.", src("plugins/kanban", True)),
    N("plugin-browser", "plugins/browser", "adapter", 3, vec(tools=1.0, gateway=0.1, security=0.2), "Browser plugin backends.", src("plugins/browser", True)),
    N("plugin-platforms-longtail", "plugins/platforms *", "adapter", 3, vec(loop=0.44, gateway=0.46, security=0.77), "Long-tail platform adapters pooled.", src("plugins/platforms", True), False, ["plat-matrix", "plat-mattermost", "plat-email", "plat-homeassistant", "plat-teams", "plat-weixin", "plat-sms", "plat-webhook"]),
    N("docs-agent-loop", "docs agent loop", "adapter", 3, vec(loop=0.31, prompt=0.34, tools=0.32, state=0.26, memory=0.24, skills=0.24, providers=0.32, gateway=0.19, cron=0.23, acp=0.35, mcp=0.26, security=0.36), "Docs: agent loop.", src("website/docs/developer-guide", True)),
    N("docs-session-storage", "docs session storage", "adapter", 3, vec(loop=0.3, prompt=0.4, tools=0.24, state=0.06, memory=0.27, skills=0.33, providers=0.27, cron=0.3, acp=0.2, mcp=0.42, security=0.37), "Docs: SessionDB.", src("website/docs", True)),
    N("docs-tools-runtime", "docs tools runtime", "adapter", 3, vec(loop=0.15, prompt=0.35, tools=0.39, state=0.12, memory=0.28, skills=0.25, gateway=0.08, cron=0.2, acp=0.27, mcp=0.5, security=0.43), "Docs: tools runtime.", src("website/docs/reference", True)),
    N("docs-gateway", "docs gateway", "adapter", 3, vec(prompt=0.32, memory=0.37, providers=0.55, acp=0.63, mcp=0.25), "Docs: gateway.", src("website/docs/integrations", True)),
    N("docs-architecture", "docs architecture", "adapter", 3, vec(loop=0.31, prompt=0.31, tools=0.09, state=0.28, memory=0.18, skills=0.18, gateway=0.31, cron=0.42, mcp=0.34, security=0.52), "In-repo architecture notes.", src("docs", True)),
    N("repo-agents-md", "AGENTS.md", "adapter", 3, vec(loop=0.26, prompt=0.26, tools=0.42, state=0.33, gateway=0.16, cron=0.16, acp=0.26, mcp=0.46, security=0.49), "In-repo agent manual.", src("AGENTS.md")),
    N("repo-security-md", "SECURITY.md", "adapter", 3, vec(skills=0.28, acp=0.35, mcp=0.53, security=0.72), "Security policy.", src("SECURITY.md")),
    N("soul-md", "SOUL.md", "adapter", 3, vec(prompt=1.0, memory=0.2, security=0.1), "SOUL.md prompt slot.", src("SOUL.md")),
    N("docs-which-file", "USER/MEMORY slots", "adapter", 3, vec(loop=0.22, prompt=0.34, tools=0.28, state=0.22, memory=0.31, skills=0.4, providers=0.2, gateway=0.12, cron=0.24, acp=0.26, mcp=0.38, security=0.36), "SOUL/USER/MEMORY contract.", src("website/docs/user-guide", True)),
    N("hermes-bootstrap", "hermes_bootstrap.py", "adapter", 3, vec(state=0.51, gateway=0.32, cron=0.32, mcp=0.32, security=0.65), "Bootstrap + startup watchdog.", src("hermes_bootstrap.py")),
]

# 112 restrictions (outer)
edges: list[dict] = [
    E("cli", "run-agent", "projection", "CLI boots AIAgent"),
    E("hermes-cli-main", "run-agent", "projection", "CLI router → loop"),
    E("gateway-run", "run-agent", "projection", "GatewayRunner → AIAgent"),
    E("cron-scheduler", "run-agent", "projection", "Cron starts a fresh AIAgent"),
    E("acp-server", "run-agent", "projection", "ACP session → loop"),
    E("batch-runner", "run-agent", "projection", "Batch path → loop"),
    E("tui", "run-agent", "projection", "TUI → loop"),
    E("api-server", "gateway-run", "identity", "HTTP API is a gateway surface"),
    E("voice-mode", "run-agent", "projection", "Voice session → loop"),
    E("mini-swe-runner", "run-agent", "projection", "Eval runner → loop"),
    E("hosted-room-driver", "gateway-run", "projection", "Room dispatch → gateway"),
    E("bot-relay", "run-agent", "projection", "Bot relay talks to AIAgent"),
    E("agent-conversation-loop", "run-agent", "identity", "Inner turn machine"),
    E("agent-init", "run-agent", "identity", "Constructs AIAgent"),
    E("agent-runtime-helpers", "run-agent", "projection", "Loop helpers"),
    E("agent-prompt-builder", "system-prompt", "identity", "Builder feeds the tier hook"),
    E("system-prompt", "run-agent", "projection", "Prompt tiers into the loop"),
    E("agent-prompt-caching", "agent-prompt-builder", "projection", "Cache markers"),
    E("agent-context-compressor", "agent-prompt-builder", "projection", "Compress before rebuild"),
    E("conversation-compression", "agent-context-compressor", "identity", "Turn compression sibling"),
    E("agent-context-engine", "agent-prompt-builder", "projection", "Engine selects context"),
    E("agent-memory-manager", "hermes-state", "projection", "MEMORY.md through SessionDB"),
    E("agent-memory-provider", "agent-memory-manager", "identity", "Provider behind manager"),
    E("tools-memory-tool", "agent-memory-manager", "identity", "Tool is the manager surface"),
    E("agent-skill-commands", "agent-prompt-builder", "projection", "Skills inject into prompt"),
    E("agent-curator", "agent-skill-commands", "projection", "Learning writes skills"),
    E("agent-tool-executor", "tools-registry", "identity", "Executes registered tools"),
    E("agent-anthropic-adapter", "runtime-provider", "projection", "Anthropic api_mode"),
    E("agent-codex-adapter", "runtime-provider", "projection", "Codex api_mode"),
    E("auxiliary-client", "runtime-provider", "projection", "Sidecar model"),
    E("chat-completion-helpers", "runtime-provider", "projection", "Chat Completions shape"),
    E("credential-pool", "runtime-provider", "projection", "Creds for transport"),
    E("toolsets", "tools-registry", "identity", "Bundles filter registry"),
    E("model-tools", "tools-registry", "identity", "Queries the registry"),
    E("model-tools", "run-agent", "projection", "handle_function_call from loop"),
    E("hermes-state-schema", "hermes-state", "identity", "Schema for SessionDB"),
    E("hermes-state-search", "hermes-state", "identity", "FTS5 reader"),
    E("hermes-state-common", "hermes-state", "identity", "Shared helpers"),
    E("hermes-state-sessions", "hermes-state", "identity", "Session rows"),
    E("hermes-state-messages", "hermes-state", "identity", "Message log"),
    E("hermes-state-repair", "hermes-state", "projection", "Repair path"),
    E("hermes-constants", "tools-approval", "projection", "HERMES_HOME / isolation"),
    E("hermes-logging", "run-agent", "projection", "Logs the loop"),
    E("hermes-cli-config", "runtime-provider", "projection", "Config selects provider"),
    E("hermes-cli-plugins", "tools-registry", "projection", "Plugins override registry"),
    E("hermes-cli-auth", "runtime-provider", "projection", "Creds for transport"),
    E("hermes-cli-profiles", "tools-approval", "projection", "Profile isolation"),
    E("tools-skills-hub", "system-prompt", "projection", "Loaded skills inject"),
    E("trajectory-compressor", "agent-context-compressor", "projection", "Offline compress"),
    E("gateway-delivery", "gateway-run", "identity", "Outbound path"),
    E("gateway-pairing", "gateway-run", "projection", "DM pairing"),
    E("gateway-platform-registry", "gateway-run", "identity", "Platform plugins"),
    E("desktop-app", "run-agent", "projection", "Desktop boots a loop"),
    E("plat-telegram", "gateway-platform-registry", "identity", "Telegram plugin"),
    E("plat-discord", "gateway-platform-registry", "identity", "Discord plugin"),
    E("plat-slack", "gateway-platform-registry", "identity", "Slack plugin"),
    E("plat-whatsapp", "gateway-platform-registry", "identity", "WhatsApp adapter"),
    E("plat-signal", "gateway-platform-registry", "identity", "Signal adapter"),
    E("tool-terminal", "tools-registry", "identity", "registry.register"),
    E("tool-browser", "tools-registry", "identity", "registry.register"),
    E("tool-file", "tools-registry", "identity", "registry.register"),
    E("tool-computer-use", "tools-registry", "identity", "registry.register"),
    E("tool-delegate", "run-agent", "projection", "Child AIAgent"),
    E("tool-cronjob", "cron-scheduler", "projection", "Cron tool → scheduler"),
    E("tool-mcp", "mcp-serve", "projection", "MCP tool + server"),
    E("skills-software", "tools-skills-hub", "identity", "Shipped pack"),
    E("skills-research", "tools-skills-hub", "identity", "Shipped pack"),
    E("plugin-observability", "run-agent", "projection", "Traces the loop"),
    E("plugin-web", "tools-registry", "projection", "Web tools"),
    E("plugin-image-gen", "tools-registry", "projection", "Image gen tools"),
    E("plugin-kanban", "tools-registry", "projection", "Kanban tools"),
    E("plugin-browser", "tool-browser", "identity", "Browser plugin"),
    E("docs-agent-loop", "run-agent", "projection", "Docs describe the loop"),
    E("docs-which-file", "system-prompt", "projection", "SOUL/USER/MEMORY contract"),
    E("docs-session-storage", "hermes-state", "identity", "Docs for SessionDB"),
    E("docs-tools-runtime", "tools-registry", "identity", "Docs for the registry"),
    E("docs-gateway", "gateway-run", "identity", "Docs for GatewayRunner"),
    E("docs-architecture", "run-agent", "identity", "In-repo architecture notes"),
    E("repo-agents-md", "run-agent", "projection", "In-repo manual"),
    E("repo-security-md", "tools-approval", "projection", "Security → approval waist"),
    E("soul-md", "system-prompt", "identity", "Slot #1"),
    E("plugin-memory", "hermes-state", "type-aware", "Honcho/Mem0 can persist outside SessionDB."),
    E("desktop-app", "hermes-state", "type-aware", "Desktop can be a second session writer."),
    E("cron-scheduler", "hermes-state", "type-aware", "Cron starts a fresh AIAgent — lineage skip."),
    E("mcp-serve", "tools-approval", "type-aware", "External MCP can skip the dangerous-command gate."),
    E("optional-skills", "agent-prompt-builder", "type-aware", "Optional pack often never injected."),
    E("bot-relay", "hermes-state", "type-aware", "Bot Mode / peer DM can fork session lineage."),
    E("plugin-context-engine", "agent-prompt-builder", "type-aware", "Plugin context engine is a parallel memory path."),
    E("agent-moa-loop", "run-agent", "type-aware", "MoA is a second conversation loop beside run_conversation."),
    E("gateway-session", "hermes-state", "type-aware", "gateway/session.py vs SessionDB — two session objects."),
    E("plugin-model-providers", "runtime-provider", "type-aware", "Plugin provider must match api_mode of runtime_provider."),
    E("optional-mcps", "mcp-serve", "identity", "Optional MCP packs attach to mcp_serve."),
    E("agent-file-safety", "tools-approval", "projection", "File safety sits under the approval waist."),
    E("agent-turn-pool", "agent-conversation-loop", "identity", "Inner turn_* modules of the conversation loop."),
    E("agent-display", "agent-conversation-loop", "projection", "Display callbacks from the loop."),
    E("agent-trajectory", "batch-runner", "projection", "Trajectories feed the batch path."),
    E("agent-model-metadata", "runtime-provider", "projection", "Model metadata for provider resolution."),
    E("agent-compression-facade", "agent-context-compressor", "identity", "Facade over the compressor."),
    E("hermes-state-fts", "hermes-state", "identity", "FTS sibling of SessionDB."),
    E("hermes-state-wal", "hermes-state", "identity", "WAL sibling of SessionDB."),
    E("hermes-state-gateway", "hermes-state", "identity", "Gateway session sibling."),
    E("hermes-state-compression", "hermes-state", "projection", "Compressed session blobs."),
    E("hermes-cli-commands", "hermes-cli-main", "identity", "Slash command registry."),
    E("hermes-cli-setup", "hermes-cli-main", "projection", "Setup wizard entry."),
    E("hermes-cli-doctor", "hermes-cli-main", "projection", "Doctor surface."),
    E("hermes-cli-models", "runtime-provider", "projection", "Catalog feeds ProviderResolver."),
    E("gateway-hooks", "gateway-run", "identity", "Hooks on GatewayRunner."),
    E("tool-web", "tools-registry", "identity", "registry.register"),
    E("tool-code-exec", "tools-registry", "identity", "registry.register"),
    E("tool-process-registry", "tools-registry", "identity", "registry.register"),
    E("plugin-platforms-longtail", "gateway-platform-registry", "identity", "Long-tail platform plugins."),
    E("hermes-bootstrap", "run-agent", "projection", "Bootstraps the loop."),
]


def by_id() -> dict[str, dict]:
    return {n["id"]: n for n in nodes}


def lift(id: str, **patch) -> dict:
    n = dict(by_id()[id])
    n.update(patch)
    n["section"] = list(n["section"])
    return n


def fresh(
    id: str,
    title: str,
    kind: str,
    level: int,
    section: list[float],
    summary: str,
    path: str,
    known: bool = False,
    tree: bool = False,
) -> dict:
    return N(id, title, kind, level, section, summary, src(path, tree), known)


def room(title: str, kicker: str, blurb: str, ns: list[dict], es: list[dict]) -> dict:
    levels = []
    seen = sorted({n["level"] for n in ns})
    labels = {0: "Interior pin", 1: "Neighbours", 2: "Interior", 3: "Adapters"}
    for i in seen:
        levels.append(
            {
                "id": i,
                "code": f"L{i}",
                "label": labels.get(i, f"Layer {i}"),
                "kicker": "Pinned" if i == 0 else "",
                "blurb": "",
            }
        )
    return {
        "id": "room",
        "title": title,
        "kicker": kicker,
        "blurb": blurb,
        "levels": levels,
        "nodes": ns,
        "edges": es,
    }


rooms: dict[str, dict] = {}

# --- Core essence: the 8 L0 pins as their own sheaf ---
rooms["run-agent"] = room(
    "Runtime waist",
    "Eight pinned stalks",
    "The contract every other module must restrict onto. This is the core essence — not 3387 files.",
    [
        lift("run-agent", level=0, known=True),
        lift("tools-registry", level=1, known=True),
        lift("hermes-state", level=1, known=True),
        lift("toolsets", level=1, known=True),
        lift("model-tools", level=1, known=True),
        lift("runtime-provider", level=1, known=True),
        lift("system-prompt", level=1, known=True),
        lift("tools-approval", level=1, known=True),
    ],
    [
        E("system-prompt", "run-agent", "projection", "Prompt tiers into the loop"),
        E("model-tools", "run-agent", "projection", "handle_function_call from loop"),
        E("model-tools", "tools-registry", "identity", "Queries the registry"),
        E("toolsets", "tools-registry", "identity", "Bundles filter registry"),
        E("tools-registry", "run-agent", "identity", "Loop dispatches through the registry"),
        E("hermes-state", "run-agent", "projection", "Session lineage of the loop"),
        E("runtime-provider", "run-agent", "projection", "Transport for the loop"),
        E("tools-approval", "run-agent", "projection", "Dangerous-command gate on the loop"),
        E("system-prompt", "hermes-state", "projection", "Prompt slots persist on SessionDB"),
        E("tools-approval", "tools-registry", "projection", "Gate sits on registered tools"),
    ],
)

# --- Turn machine ---
rooms["agent-conversation-loop"] = room(
    "Turn machine",
    "agent/turn_*.py",
    "architecture.md: the loop lives in turn_*.py. Sequential phases restrict onto conversation_loop.",
    [
        lift("agent-conversation-loop", level=0, known=True),
        lift("agent-turn-pool", level=1),
        fresh("turn-prep", "turn_prep.py", "subsystem", 1, vec(loop=0.7, prompt=0.4, state=0.3), "Iteration prep.", "agent/turn_prep.py"),
        fresh("turn-api", "turn_api.py", "subsystem", 1, vec(loop=0.4, providers=0.9), "API call phase.", "agent/turn_api.py"),
        fresh("turn-error", "turn_error.py", "subsystem", 1, vec(loop=0.4, providers=0.6, security=0.4), "API error phase.", "agent/turn_error.py"),
        fresh("turn-overflow", "turn_overflow.py", "subsystem", 1, vec(loop=0.5, prompt=0.4, state=0.5), "Context overflow.", "agent/turn_overflow.py"),
        fresh("turn-truncation", "turn_truncation.py", "subsystem", 1, vec(loop=0.4, prompt=0.6, state=0.4), "Truncation phase.", "agent/turn_truncation.py"),
        fresh("turn-recovery", "turn_recovery.py", "subsystem", 1, vec(loop=0.5, providers=0.4, security=0.5), "Recovery phase.", "agent/turn_recovery.py"),
        lift("agent-display", level=1),
        fresh("subagent-lifecycle", "subagent_lifecycle.py", "subsystem", 2, vec(loop=0.8, tools=0.4, security=0.3), "Child agent lifecycle.", "agent/subagent_lifecycle.py"),
        fresh("learning-graph", "learning_graph.py", "subsystem", 2, vec(loop=0.3, skills=0.8, memory=0.4), "Closed learning graph.", "agent/learning_graph.py"),
    ],
    [
        E("agent-turn-pool", "agent-conversation-loop", "identity", "turn_* bundle"),
        E("turn-prep", "agent-conversation-loop", "identity", "Phase of the loop"),
        E("turn-api", "agent-conversation-loop", "identity", "Phase of the loop"),
        E("turn-error", "agent-conversation-loop", "identity", "Phase of the loop"),
        E("turn-overflow", "agent-conversation-loop", "identity", "Phase of the loop"),
        E("turn-truncation", "agent-conversation-loop", "identity", "Phase of the loop"),
        E("turn-recovery", "agent-conversation-loop", "identity", "Phase of the loop"),
        E("turn-prep", "turn-api", "projection", "Prep before the call"),
        E("turn-api", "turn-error", "projection", "Error handles the call"),
        E("turn-api", "turn-overflow", "projection", "Overflow after the call"),
        E("turn-overflow", "turn-truncation", "identity", "Sibling compression"),
        E("turn-error", "turn-recovery", "projection", "Recover from error"),
        E("agent-display", "agent-conversation-loop", "projection", "Display callbacks"),
        E("subagent-lifecycle", "agent-conversation-loop", "type-aware", "Child loop beside the parent turn machine."),
        E("learning-graph", "agent-conversation-loop", "projection", "Learning reads the trajectory"),
    ],
)

# --- CLI interior ---
rooms["hermes-cli-main"] = room(
    "CLI interior",
    "hermes_cli mixins",
    "hermes_cli is 455 files. This room is the command surface, not every mixin.",
    [
        lift("hermes-cli-main", level=0, known=True),
        lift("hermes-cli-commands", level=1),
        lift("hermes-cli-setup", level=1),
        lift("hermes-cli-doctor", level=1),
        lift("hermes-cli-models", level=1),
        lift("hermes-cli-config", level=1),
        lift("hermes-cli-plugins", level=1),
        lift("hermes-cli-auth", level=1),
        lift("hermes-cli-profiles", level=1),
        fresh("cli-model-switch", "model_switch.py", "subsystem", 2, vec(providers=0.9, tools=0.2), "/model switch.", "hermes_cli/model_switch.py"),
        fresh("cli-checkpoints", "checkpoints.py", "subsystem", 2, vec(state=0.7, loop=0.3, security=0.2), "Checkpoints / rollback.", "hermes_cli/checkpoints.py"),
        fresh("cli-callbacks", "callbacks.py", "subsystem", 2, vec(loop=0.4, gateway=0.5), "CLI callbacks.", "hermes_cli/callbacks.py"),
        fresh("cli-skin", "skin_engine.py", "adapter", 2, vec(prompt=0.6, gateway=0.3), "TUI skin engine.", "hermes_cli/skin_engine.py"),
    ],
    [
        E("hermes-cli-commands", "hermes-cli-main", "identity", "Slash command registry"),
        E("hermes-cli-setup", "hermes-cli-main", "projection", "Setup wizard"),
        E("hermes-cli-doctor", "hermes-cli-main", "projection", "Doctor"),
        E("hermes-cli-models", "hermes-cli-main", "projection", "Model catalog CLI"),
        E("hermes-cli-config", "hermes-cli-main", "identity", "Config load"),
        E("hermes-cli-plugins", "hermes-cli-main", "projection", "Plugin discovery"),
        E("hermes-cli-auth", "hermes-cli-main", "projection", "Auth CLI"),
        E("hermes-cli-profiles", "hermes-cli-main", "projection", "Profiles"),
        E("cli-model-switch", "hermes-cli-models", "identity", "Switch uses the catalog"),
        E("cli-checkpoints", "hermes-cli-main", "projection", "Rollback surface"),
        E("cli-callbacks", "hermes-cli-main", "identity", "Callback bus"),
        E("cli-skin", "hermes-cli-main", "projection", "Skin"),
    ],
)

# --- SessionDB siblings ---
rooms["hermes-state"] = room(
    "SessionDB siblings",
    "hermes_state_*.py",
    "The facade plus FTS/WAL/gateway/compression. Two session objects is a terracotta residual.",
    [
        lift("hermes-state", level=0, known=True),
        lift("hermes-state-schema", level=1),
        lift("hermes-state-search", level=1),
        lift("hermes-state-common", level=1),
        lift("hermes-state-sessions", level=1),
        lift("hermes-state-messages", level=1),
        lift("hermes-state-repair", level=1),
        lift("hermes-state-fts", level=1),
        lift("hermes-state-wal", level=1),
        lift("hermes-state-gateway", level=2),
        lift("hermes-state-compression", level=2),
        fresh("hermes-state-guard", "hermes_state_guard.py", "subsystem", 2, vec(state=0.6, security=0.8), "DB guard / isolation.", "hermes_state_guard.py"),
        lift("gateway-session", level=2),
    ],
    [
        E("hermes-state-schema", "hermes-state", "identity", "Schema"),
        E("hermes-state-search", "hermes-state", "identity", "FTS reader"),
        E("hermes-state-common", "hermes-state", "identity", "Helpers"),
        E("hermes-state-sessions", "hermes-state", "identity", "Session rows"),
        E("hermes-state-messages", "hermes-state", "identity", "Messages"),
        E("hermes-state-repair", "hermes-state", "projection", "Repair"),
        E("hermes-state-fts", "hermes-state", "identity", "FTS writer"),
        E("hermes-state-wal", "hermes-state", "identity", "WAL"),
        E("hermes-state-gateway", "hermes-state", "identity", "Gateway rows"),
        E("hermes-state-compression", "hermes-state", "projection", "Compressed blobs"),
        E("hermes-state-guard", "hermes-state", "projection", "Guard"),
        E("gateway-session", "hermes-state", "type-aware", "gateway/session.py vs SessionDB — two session objects."),
    ],
)

# --- Tool registry interior ---
rooms["tools-registry"] = room(
    "Tool registry",
    "registry.register",
    "Each tool restricts onto the registry by identity. MCP is the terracotta skip of approval.",
    [
        lift("tools-registry", level=0, known=True),
        lift("tool-web", level=1),
        lift("tool-code-exec", level=1),
        lift("tool-process-registry", level=1),
        lift("tool-terminal", level=1),
        lift("tool-file", level=1),
        lift("tool-browser", level=1),
        lift("tool-computer-use", level=1),
        lift("tool-mcp", level=1),
        lift("tool-delegate", level=1),
        lift("tool-cronjob", level=1),
        lift("tools-memory-tool", level=1),
        lift("tools-skills-hub", level=1),
        lift("tools-approval", level=2, known=True),
        lift("mcp-serve", level=2),
    ],
    [
        E("tool-web", "tools-registry", "identity", "registry.register"),
        E("tool-code-exec", "tools-registry", "identity", "registry.register"),
        E("tool-process-registry", "tools-registry", "identity", "registry.register"),
        E("tool-terminal", "tools-registry", "identity", "registry.register"),
        E("tool-file", "tools-registry", "identity", "registry.register"),
        E("tool-browser", "tools-registry", "identity", "registry.register"),
        E("tool-computer-use", "tools-registry", "identity", "registry.register"),
        E("tool-mcp", "tools-registry", "identity", "registry.register"),
        E("tool-delegate", "tools-registry", "projection", "Child agent is a tool"),
        E("tool-cronjob", "tools-registry", "identity", "registry.register"),
        E("tools-memory-tool", "tools-registry", "identity", "registry.register"),
        E("tools-skills-hub", "tools-registry", "identity", "registry.register"),
        E("tools-approval", "tools-registry", "projection", "Gate on registered tools"),
        E("tool-mcp", "mcp-serve", "projection", "MCP tool + server"),
        E("mcp-serve", "tools-approval", "type-aware", "External MCP can skip the dangerous-command gate."),
    ],
)

# --- Gateway ---
rooms["gateway-run"] = room(
    "GatewayRunner",
    "gateway/",
    "Surfaces that restrict onto GatewayRunner. gateway/session.py is the terracotta second session object.",
    [
        lift("gateway-run", level=0, known=True),
        lift("gateway-session", level=1),
        lift("gateway-delivery", level=1),
        lift("gateway-pairing", level=1),
        lift("gateway-platform-registry", level=1),
        lift("gateway-hooks", level=1),
        lift("api-server", level=1),
        lift("hosted-room-driver", level=2),
        lift("hermes-state", level=2, known=True),
    ],
    [
        E("gateway-session", "gateway-run", "identity", "Session object"),
        E("gateway-delivery", "gateway-run", "identity", "Outbound"),
        E("gateway-pairing", "gateway-run", "projection", "DM pairing"),
        E("gateway-platform-registry", "gateway-run", "identity", "Platforms"),
        E("gateway-hooks", "gateway-run", "identity", "Hook bus"),
        E("api-server", "gateway-run", "identity", "HTTP API"),
        E("hosted-room-driver", "gateway-run", "projection", "Room dispatch"),
        E("gateway-session", "hermes-state", "type-aware", "Two session objects."),
    ],
)

# --- Platforms including long-tail ---
rooms["gateway-platform-registry"] = room(
    "Platform adapters",
    "22 adapters, 5 first-class + long tail",
    "AST would list 22 files. The sheaf says they all identity-restrict onto the platform registry.",
    [
        lift("gateway-platform-registry", level=0, known=True),
        lift("plat-telegram", level=1),
        lift("plat-discord", level=1),
        lift("plat-slack", level=1),
        lift("plat-whatsapp", level=1),
        lift("plat-signal", level=1),
        fresh("plat-matrix", "matrix adapter", "adapter", 2, vec(gateway=0.8, security=0.4), "Matrix.", "plugins/platforms/matrix", tree=True),
        fresh("plat-mattermost", "mattermost adapter", "adapter", 2, vec(gateway=0.8, security=0.4), "Mattermost.", "plugins/platforms/mattermost", tree=True),
        fresh("plat-email", "email adapter", "adapter", 2, vec(gateway=0.7, cron=0.4), "Email.", "plugins/platforms/email", tree=True),
        fresh("plat-homeassistant", "homeassistant adapter", "adapter", 2, vec(gateway=0.5, tools=0.5, mcp=0.4), "Home Assistant.", "plugins/platforms/homeassistant", tree=True),
        fresh("plat-teams", "teams adapter", "adapter", 2, vec(gateway=0.8, security=0.5), "Teams.", "plugins/platforms/teams", tree=True),
        fresh("plat-weixin", "weixin adapter", "adapter", 2, vec(gateway=0.8), "Weixin.", "plugins/platforms/weixin", tree=True),
        fresh("plat-sms", "sms adapter", "adapter", 2, vec(gateway=0.7, cron=0.3), "SMS.", "plugins/platforms/sms", tree=True),
        fresh("plat-webhook", "webhook adapter", "adapter", 2, vec(gateway=0.7, mcp=0.4), "Webhook.", "plugins/platforms/webhook", tree=True),
    ],
    [
        E("plat-telegram", "gateway-platform-registry", "identity", "plugin"),
        E("plat-discord", "gateway-platform-registry", "identity", "plugin"),
        E("plat-slack", "gateway-platform-registry", "identity", "plugin"),
        E("plat-whatsapp", "gateway-platform-registry", "identity", "plugin"),
        E("plat-signal", "gateway-platform-registry", "identity", "plugin"),
        E("plat-matrix", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-mattermost", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-email", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-homeassistant", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-teams", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-weixin", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-sms", "gateway-platform-registry", "identity", "long-tail"),
        E("plat-webhook", "gateway-platform-registry", "identity", "long-tail"),
    ],
)
rooms["plugin-platforms-longtail"] = rooms["gateway-platform-registry"]

# --- Optional skills ---
rooms["optional-skills"] = room(
    "Optional skill packs",
    "Install-gated, often never injected",
    "Terracotta: packs exist on disk but often never reach prompt_builder.",
    [
        lift("optional-skills", level=0, known=True),
        lift("agent-prompt-builder", level=0, known=True),
        fresh("skill-creative", "optional creative", "adapter", 1, vec(skills=0.8, prompt=0.3), "Creative pack.", "optional-skills", tree=True),
        fresh("skill-devops", "optional devops", "adapter", 1, vec(skills=0.7, tools=0.5), "Devops pack.", "optional-skills", tree=True),
        fresh("skill-data", "optional data", "adapter", 1, vec(skills=0.7, tools=0.4), "Data pack.", "optional-skills", tree=True),
        fresh("skill-personal", "optional personal", "adapter", 1, vec(skills=0.7, memory=0.4), "Personal pack.", "optional-skills", tree=True),
        fresh("skill-home", "optional home", "adapter", 1, vec(skills=0.6, mcp=0.5), "Home-automation pack.", "optional-skills", tree=True),
        lift("tools-skills-hub", level=2),
    ],
    [
        E("skill-creative", "optional-skills", "identity", "gated pack"),
        E("skill-devops", "optional-skills", "identity", "gated pack"),
        E("skill-data", "optional-skills", "identity", "gated pack"),
        E("skill-personal", "optional-skills", "identity", "gated pack"),
        E("skill-home", "optional-skills", "identity", "gated pack"),
        E("optional-skills", "tools-skills-hub", "projection", "Would load through the hub"),
        E("optional-skills", "agent-prompt-builder", "type-aware", "Optional pack often never injected."),
    ],
)

# --- Memory backends ---
rooms["plugin-memory"] = room(
    "Memory backends",
    "Honcho / Mem0 / Hindsight",
    "AST would show three plugins. The sheaf colours the SessionDB miss as terracotta.",
    [
        lift("plugin-memory", level=0, known=True),
        lift("hermes-state", level=0, known=True),
        fresh("mem-honcho", "Honcho", "adapter", 1, vec(memory=0.9, prompt=0.3), "Honcho dialectical user model.", "plugins/memory", tree=True),
        fresh("mem-mem0", "Mem0", "adapter", 1, vec(memory=0.9, state=0.2), "Mem0 store.", "plugins/memory", tree=True),
        fresh("mem-hindsight", "Hindsight", "adapter", 1, vec(memory=0.8, loop=0.3), "Hindsight memory.", "plugins/memory", tree=True),
        lift("agent-memory-manager", level=2),
    ],
    [
        E("mem-honcho", "plugin-memory", "identity", "backend"),
        E("mem-mem0", "plugin-memory", "identity", "backend"),
        E("mem-hindsight", "plugin-memory", "identity", "backend"),
        E("plugin-memory", "hermes-state", "type-aware", "Honcho/Mem0 can persist outside SessionDB."),
        E("mem-honcho", "hermes-state", "type-aware", "Honcho is a second writer."),
        E("mem-mem0", "hermes-state", "type-aware", "Mem0 is a second writer."),
        E("agent-memory-manager", "hermes-state", "projection", "In-tree manager does glue."),
    ],
)

# --- Extra providers ---
rooms["plugin-model-providers"] = room(
    "Extra providers",
    "api_mode must match",
    "Type-aware residual: a plugin provider that disagrees with runtime_provider.api_mode.",
    [
        lift("plugin-model-providers", level=0, known=True),
        lift("runtime-provider", level=0, known=True),
        fresh("prov-custom", "custom endpoint", "adapter", 1, vec(providers=1.0), "Custom OpenAI-compatible.", "plugins/model-providers", tree=True),
        fresh("prov-local", "local models", "adapter", 1, vec(providers=0.8, acp=0.3), "Local / llama.cpp.", "plugins/model-providers", tree=True),
        fresh("prov-bedrock", "bedrock adapter", "adapter", 1, vec(providers=0.9), "Bedrock.", "plugins/model-providers", tree=True),
        lift("agent-anthropic-adapter", level=2),
        lift("agent-codex-adapter", level=2),
    ],
    [
        E("prov-custom", "plugin-model-providers", "identity", "plugin"),
        E("prov-local", "plugin-model-providers", "identity", "plugin"),
        E("prov-bedrock", "plugin-model-providers", "identity", "plugin"),
        E("plugin-model-providers", "runtime-provider", "type-aware", "Plugin provider must match api_mode."),
        E("agent-anthropic-adapter", "runtime-provider", "projection", "In-tree Anthropic mode"),
        E("agent-codex-adapter", "runtime-provider", "projection", "In-tree Codex mode"),
    ],
)

# also hang the waist room off the other L0 pins so Enter works from any of them
for pin in ("tools-registry", "hermes-state", "system-prompt", "runtime-provider", "tools-approval", "toolsets", "model-tools"):
    rooms.setdefault(pin, rooms["run-agent"] if pin in ("toolsets", "model-tools", "system-prompt", "runtime-provider", "tools-approval") else rooms[pin])

# tools-registry and hermes-state already have richer rooms; don't overwrite.
# toolsets/model-tools/system-prompt/runtime-provider/tools-approval share the waist room.


graph = {
    "$schema": "../../docs/examples/sheaf.schema.json",
    "id": "hermes-agent",
    "title": "Hermes Agent digest",
    "kicker": "113 stalks · 112 restrictions · rooms inside fat stalks",
    "blurb": "Hermes-only digest of NousResearch/hermes-agent. Not an AST of 3387 files. Double-click a stalk (or Enter room) to unfold its interior sheaf.",
    "residualMeaning": "A terracotta edge is a harness gluing failure against the pinned AIAgent + tool-registry + SessionDB + prompt-tier contract — second memory writer, skipped approval, unused skill pack, or a parallel loop.",
    "families": [{"id": k, "label": k.replace("-", " ").title()} for k in FAM],
    "levels": [
        {"id": 0, "code": "L0", "label": "Runtime waist", "kicker": "Pinned", "blurb": "run_agent.py, registry, SessionDB, toolsets, model_tools, runtime_provider, system_prompt, approval."},
        {"id": 1, "code": "L1", "label": "Subsystems", "kicker": "agent/ + state + tools", "blurb": "Modules that implement the loop."},
        {"id": 2, "code": "L2", "label": "Surfaces", "kicker": "Entry points", "blurb": "CLI, gateway, ACP, MCP, cron, desktop, TUI, bot mode."},
        {"id": 3, "code": "L3", "label": "Adapters and docs", "kicker": "Pools", "blurb": "Platforms, backends, skills, plugins, docs."},
    ],
    "nodes": nodes,
    "edges": edges,
    "rooms": rooms,
    "eval": {
        "files": 3387,
        "dim": 12,
        "walker": "scripts/sheaf/emit-hermes.py",
        "clone": "df4c786279ee2844c16a4a0fc60bc6d32e4b7988",
        "segments": {"nodes": len(nodes), "edges": len(edges)},
        "note": "Playable hierarchical digest plus authored interiors. Never from-code.mjs. Not every file.",
        "honestGaps": [
            "hermes_cli has 455 py files; room unfolds commands/setup/doctor/models — not every mixin",
            "agent/ has 204 py files; turn_* live in the conversation-loop room",
            "plugins/platforms long-tail live in the platform-registry room",
            "evals/, docker/, native/, nix/ omitted as non-runtime",
        ],
    },
}


def main() -> None:
    ids = [n["id"] for n in nodes]
    assert len(ids) == len(set(ids)), "duplicate node id"
    missing = []
    idset = set(ids)
    for e in edges:
        if e["source"] not in idset:
            missing.append(e["source"])
        if e["target"] not in idset:
            missing.append(e["target"])
    assert not missing, missing
    out = Path("docs/examples/hermes-agent.json")
    out.write_text(json.dumps(graph, indent=2) + "\n")
    print(f"wrote {out} nodes={len(nodes)} edges={len(edges)} rooms={len(rooms)}")


if __name__ == "__main__":
    main()
