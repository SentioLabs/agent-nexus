# Claude Marketplace

This directory is the Claude-specific marketplace subtree.

## What Belongs Here

- Claude plugin runtime files
- Claude plugin manifests
- Claude-specific commands, hooks, agents, and skills
- Claude-local assets and references that are loaded by the plugin runtime

## How It Resolves

Claude reads the root shim at `.claude-plugin/marketplace.json`, which points into `claude-marketplace/plugins/`.

That means runtime files must stay under the Claude plugin roots, including each plugin's own `SKILL.md` files and plugin manifest files.

## Shared Material

Only non-runtime support files should be shared across marketplaces. If a file needs to be loaded directly by Claude at runtime, keep it inside `claude-marketplace/plugins/<plugin>/`.
