# Codex Marketplace

This directory is the Codex-specific marketplace subtree.

## What Belongs Here

- Codex plugin runtime files
- Codex plugin manifests
- Codex-specific commands, hooks, agents, and skills
- Codex-local assets, scripts, and references used by the plugin runtime

## How It Resolves

Codex reads the root shim at `.agents/plugins/marketplace.json`, which points into `codex-marketplace/plugins/`.

Runtime files must stay under the Codex plugin roots. That includes each plugin's `SKILL.md` files, plugin manifest files, and any Codex-only packaging like `.mcp.json`.

## Shared Material

Keep shared content non-runtime only. If Codex needs a file during execution, place it under `codex-marketplace/plugins/<plugin>/` instead of `shared/`.
