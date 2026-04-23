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

## Install In Codex

Add the repository root as the marketplace, not this `codex-marketplace/` directory directly. The root shim is what Codex discovers, and the shim then points at the Codex plugin runtime files here.

For the public GitHub repository, the recommended lightweight install is:

```bash
codex plugin marketplace add sentiolabs/agent-nexus \
  --sparse .agents/plugins \
  --sparse codex-marketplace
```

The `--sparse` options tell Codex to clone only the marketplace shim and Codex plugin subtree. A full clone also works:

```bash
codex plugin marketplace add sentiolabs/agent-nexus
```

For a local checkout, run this from the repository root:

```bash
codex plugin marketplace add .
```

Or pass the absolute path:

```bash
codex plugin marketplace add /path/to/agent-nexus
```

Then open Codex, go to the plugin manager, choose the `Sentio Labs` marketplace, and install the plugins you want.

To refresh an installed marketplace from its source:

```bash
codex plugin marketplace upgrade sentiolabs-plugins
```

## Remove From Codex

Remove installed plugins from the Codex plugin manager first if you no longer want them enabled. Then remove the marketplace registration:

```bash
codex plugin marketplace remove sentiolabs-plugins
```

The marketplace name comes from `.agents/plugins/marketplace.json`.

## Shared Material

Keep shared content non-runtime only. If Codex needs a file during execution, place it under `codex-marketplace/plugins/<plugin>/` instead of `shared/`.
