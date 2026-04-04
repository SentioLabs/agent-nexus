# Claude and Codex Marketplace Split

This repository hosts two first-class marketplace trees:

- `claude-marketplace/` for Claude-facing plugins
- `codex-marketplace/` for Codex-facing plugins

The repository root is a harness, not the canonical marketplace. Root shims live in:

- `.claude-plugin/marketplace.json`
- `.agents/plugins/marketplace.json`

Those shims point each tool at its platform-local plugin subtree. Shared support files live in `shared/`, but runtime plugin files stay inside the plugin roots that each platform resolves.

## Where To Look

- [Claude Marketplace](claude-marketplace/README.md)
- [Codex Marketplace](codex-marketplace/README.md)
- [Migration Rules](docs/marketplaces/migration-rules.md)

## Current Layout

- `claude-marketplace/plugins/` contains the Claude plugin copies
- `codex-marketplace/plugins/` contains the Codex plugin copies
- `shared/` contains non-runtime support files such as validation scripts and references
- `docs/` contains design notes and contributor guidance

## Working Rule

Start with explicit platform-specific duplication. Only introduce generation or shared-source rendering if duplicated maintenance becomes a real problem.
