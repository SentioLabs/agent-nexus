---
description: Install and configure arc for Claude Code and Codex
---

# arc docs plugin

Arc supports both Claude Code and Codex through repo-local plugin packaging.

## Claude Code

- Install the Claude plugin from this repository's `claude-marketplace/plugins/arc/.claude-plugin/` manifest.
- Claude packaging includes automatic session priming and the agent registration hook used by arc's AI session tracking.

## Codex

- Install the Codex plugin from this repository's `.agents/plugins/marketplace.json` catalog.
- Codex packaging uses `codex-marketplace/plugins/arc/.codex-plugin/plugin.json` and `codex-marketplace/plugins/arc/hooks.json`.
- Codex support in this repo keeps automatic `SessionStart` and `PreCompact` priming so `arc prime` still runs at the right moments.

## Compatibility note

This Codex pass enables Arc's core single-agent workflow plus automatic `SessionStart` and `PreCompact` priming.

This Codex pass does not enable arc's Claude-only `PostToolUse` `Agent` registration hook. The hook remains disabled for Codex until an equivalent spawned-agent matcher is confirmed in Codex plugin hooks.

`arc team-deploy` also remains Claude-first for now. The current team workflow still depends on `TeamCreate`, `TaskCreate`, `TaskUpdate`, `TaskList`, `Agent`, and `SendMessage`, and those runtime primitives have not yet been confirmed in Codex.

## After installation

Run `arc onboard` in the project root to resolve the active project and load the current work queue.
