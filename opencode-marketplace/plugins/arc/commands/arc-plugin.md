---
description: Install and configure arc for OpenCode
---

# arc docs plugin

Install the official OpenCode arc plugin package through `opencode.json`:

```json
{
  "plugin": ["@sentiolabs/opencode-arc"]
}
```

OpenCode installs npm plugin packages automatically with Bun. This package registers the Arc runtime hook, `/arc-*` commands, `arc-*` agents, and Arc workflow skills from its bundled assets.

## After installation

Run `arc onboard` in the project root to resolve the active project and load the current work queue.

## OpenCode contract

- `arc prime` automation is fail-open.
- OpenCode commands, agents, and skills remain explicitly prefixed.
- The workflow is sequential and subagent-driven.
- This plugin does not claim worktree-isolated parallel execution.

## Local development fallback

The repository's copy-based OpenCode installer can still install files from `opencode-marketplace/plugins/arc/` into `.opencode/` for local development or for environments that are not using npm package plugins yet.
