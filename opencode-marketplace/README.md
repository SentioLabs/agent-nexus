# OpenCode Marketplace

This directory is the OpenCode-specific marketplace subtree.

## What Belongs Here

- OpenCode plugin runtime files
- OpenCode command, skill, agent, and plugin copies
- OpenCode-local references used by those runtime files
- Optional OpenCode config fragments such as `opencode.fragment.json`

## How It Resolves

OpenCode does not use a root marketplace manifest here. Instead, the repository exposes a
fetched install entrypoint at `.opencode/INSTALL.md`.

That install flow copies plugin files from `opencode-marketplace/plugins/` into either the
current project's `.opencode/` directory or the user's global `~/.config/opencode/`
directory, depending on the install choice.

## Layout Rules

- Keep runtime files inside `opencode-marketplace/plugins/<plugin>/`
- Prefix OpenCode command filenames with the plugin name, for example
  `slop-review-review.md`
- Prefix OpenCode agent filenames with the plugin name for the same reason
- Treat OpenCode skill names as globally unique after installation; if a plugin has
  generic names such as `plan` or `review`, rename them to plugin-prefixed names such as
  `plugin-plan` and `plugin-review`
- Store local OpenCode hook/runtime plugins under
  `opencode-marketplace/plugins/<plugin>/plugins/` and copy them into
  `.opencode/plugins/`
- Reserve `opencode.fragment.json` for `opencode.json` merges that cannot live in plain
  command, skill, agent, or local plugin files
- Do not add a fake OpenCode marketplace manifest at the repo root

## Install Surface

Use the root install instructions:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/sentiolabs/agent-nexus/main/.opencode/INSTALL.md
```

## Roadmap

See `docs/marketplaces/opencode-roadmap.md` for the staged rollout beyond the phase 1
pilot.
