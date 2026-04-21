---
description: Install and configure arc for OpenCode
---

# arc docs plugin

Install the OpenCode arc plugin from this repository's `opencode-marketplace/plugins/arc/` package.

## After installation

Run `arc onboard` in the project root to resolve the active project and load the current work queue.

## OpenCode contract

- `arc prime` automation is fail-open.
- OpenCode commands, agents, and skills remain explicitly prefixed.
- The workflow is sequential and subagent-driven.
- This plugin does not claim worktree-isolated parallel execution.
